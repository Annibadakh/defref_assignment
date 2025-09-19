import express from 'express';
import fs from 'fs';
import path from 'path';
import PDF from '../models/PDF.js';
import Annotation from '../models/Annotation.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import upload, { handleMulterError } from '../middleware/upload.js';

const router = express.Router();

// @desc    Upload PDF
// @route   POST /api/pdfs/upload
// @access  Private
router.post('/upload', protect, upload.single('pdf'), handleMulterError, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a PDF file'
      });
    }

    const { title, description, tags, isPublic } = req.body;

    // Parse tags if provided
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (error) {
        parsedTags = [];
      }
    }

    const pdf = await PDF.create({
      title: title || req.file.originalname,
      description: description || '',
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      user: req.user.id,
      isPublic: isPublic || 'true',
      tags: parsedTags,
      status: 'ready'
    });

    res.status(201).json({
      success: true,
      message: 'PDF uploaded successfully',
      pdf: {
        id: pdf._id,
        title: pdf.title,
        description: pdf.description,
        filename: pdf.filename,
        originalName: pdf.originalName,
        fileSize: pdf.fileSize,
        isPublic: pdf.isPublic,
        tags: pdf.tags,
        status: pdf.status,
        createdAt: pdf.createdAt
      }
    });
  } catch (error) {
    // Clean up uploaded file if database operation fails
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Failed to delete uploaded file:', err);
      });
    }
    next(error);
  }
});

// @desc    Get all PDFs for logged in user
// @route   GET /api/pdfs
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = { user: req.user.id };
    
    // Add search functionality
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search, 'i')] } }
      ];
    }

    // Add tag filter
    if (req.query.tags) {
      const tags = req.query.tags.split(',');
      query.tags = { $in: tags };
    }

    const total = await PDF.countDocuments(query);
    const pdfs = await PDF.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('annotations', 'type isResolved')
      .select('-filePath');

    res.status(200).json({
      success: true,
      count: pdfs.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      pdfs: pdfs.map(pdf => ({
        id: pdf._id,
        title: pdf.title,
        description: pdf.description,
        filename: pdf.filename,
        originalName: pdf.originalName,
        fileSize: pdf.fileSize,
        pageCount: pdf.pageCount,
        isPublic: pdf.isPublic,
        tags: pdf.tags,
        status: pdf.status,
        annotationCount: pdf.annotations?.length || 0,
        accessCount: pdf.accessCount,
        lastAccessed: pdf.lastAccessed,
        createdAt: pdf.createdAt,
        updatedAt: pdf.updatedAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get public PDFs
// @route   GET /api/pdfs/public
// @access  Public
router.get('/public', optionalAuth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { isPublic: true };
    
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search, 'i')] } }
      ];
    }

    if (req.query.tags) {
      const tags = req.query.tags.split(',');
      query.tags = { $in: tags };
    }

    const total = await PDF.countDocuments(query);
    const pdfs = await PDF.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name')
      .populate('annotations', 'type isResolved')
      .select('-filePath');

    res.status(200).json({
      success: true,
      count: pdfs.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      pdfs: pdfs.map(pdf => ({
        id: pdf._id,
        title: pdf.title,
        description: pdf.description,
        filename: pdf.filename,
        originalName: pdf.originalName,
        fileSize: pdf.fileSize,
        pageCount: pdf.pageCount,
        tags: pdf.tags,
        status: pdf.status,
        user: pdf.user?.name || 'Anonymous',
        annotationCount: pdf.annotations?.length || 0,
        accessCount: pdf.accessCount,
        createdAt: pdf.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single PDF
// @route   GET /api/pdfs/:id
// @access  Private/Public (depends on PDF visibility)
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    let pdf = await PDF.findById(req.params.id)
      .populate('user', 'name email')
      .populate({
        path: 'annotations',
        populate: {
          path: 'user replies.user',
          select: 'name'
        }
      });

    if (!pdf) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found'
      });
    }

    // Check access permissions
    const hasAccess = pdf.isPublic || 
                     (req.user && pdf.user._id.toString() === req.user.id);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this PDF'
      });
    }

    // Increment access count
    pdf.accessCount += 1;
    pdf.lastAccessed = new Date();
    await pdf.save();

    // Filter annotations based on user permissions
    let annotations = pdf.annotations || [];
    if (!req.user || pdf.user._id.toString() !== req.user.id) {
      annotations = annotations.filter(annotation => !annotation.isPrivate);
    }

    res.status(200).json({
      success: true,
      pdf: {
        id: pdf._id,
        title: pdf.title,
        description: pdf.description,
        filename: pdf.filename,
        originalName: pdf.originalName,
        filePath: pdf.filePath,
        fileSize: pdf.fileSize,
        pageCount: pdf.pageCount,
        isPublic: pdf.isPublic,
        tags: pdf.tags,
        status: pdf.status,
        user: {
          id: pdf.user._id,
          name: pdf.user.name
        },
        annotations,
        accessCount: pdf.accessCount,
        lastAccessed: pdf.lastAccessed,
        createdAt: pdf.createdAt,
        updatedAt: pdf.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Serve PDF file
// @route   GET /api/pdfs/:id/file
// @access  Private/Public (depends on PDF visibility)
router.get('/:id/file', optionalAuth, async (req, res, next) => {
  try {
    const pdf = await PDF.findById(req.params.id);

    if (!pdf) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found'
      });
    }

    // Check access permissions
    const hasAccess = pdf.isPublic || 
                     (req.user && pdf.user.toString() === req.user.id);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this PDF'
      });
    }

    // Check if file exists
    if (!fs.existsSync(pdf.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'PDF file not found on server'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${pdf.originalName}"`);
    res.setHeader('Content-Length', pdf.fileSize);

    // Stream the file
    const fileStream = fs.createReadStream(pdf.filePath);
    fileStream.pipe(res);

  } catch (error) {
    next(error);
  }
});

// @desc    Update PDF
// @route   PUT /api/pdfs/:id
// @access  Private
router.put('/:id', protect, async (req, res, next) => {
  try {
    let pdf = await PDF.findById(req.params.id);

    if (!pdf) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found'
      });
    }

    // Make sure user owns PDF
    if (pdf.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this PDF'
      });
    }

    const { title, description, tags, isPublic } = req.body;
    const updateFields = {};

    if (title) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (tags) updateFields.tags = Array.isArray(tags) ? tags : [];
    if (typeof isPublic === 'boolean') updateFields.isPublic = isPublic;

    pdf = await PDF.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true
    }).select('-filePath');

    res.status(200).json({
      success: true,
      pdf: {
        id: pdf._id,
        title: pdf.title,
        description: pdf.description,
        isPublic: pdf.isPublic,
        tags: pdf.tags,
        updatedAt: pdf.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete PDF
// @route   DELETE /api/pdfs/:id
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const pdf = await PDF.findById(req.params.id);

    if (!pdf) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found'
      });
    }

    // Make sure user owns PDF
    if (pdf.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this PDF'
      });
    }

    // Delete associated annotations
    await Annotation.deleteMany({ pdf: pdf._id });

    // Delete file from filesystem
    if (fs.existsSync(pdf.filePath)) {
      fs.unlink(pdf.filePath, (err) => {
        if (err) console.error('Failed to delete PDF file:', err);
      });
    }

    // Delete PDF from database
    await PDF.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'PDF deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;