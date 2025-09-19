import express from 'express';
import Annotation from '../models/Annotation.js';
import PDF from '../models/PDF.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Create annotation
// @route   POST /api/annotations
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { pdfId, page, type, content, isPrivate, tags } = req.body;

    // Validate required fields
    if (!pdfId || !page || !type || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide pdfId, page, type, and content'
      });
    }

    // Check if PDF exists and user has access
    const pdf = await PDF.findById(pdfId);
    if (!pdf) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found'
      });
    }

    const hasAccess = pdf.user.toString() === req.user.id || pdf.isPublic;
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to annotate this PDF'
      });
    }

    const annotation = await Annotation.create({
      pdf: pdfId,
      user: req.user.id,
      page,
      type,
      content,
      isPrivate: isPrivate || false,
      tags: tags || []
    });

    const populatedAnnotation = await Annotation.findById(annotation._id)
      .populate('user', 'name')
      .populate('replies.user', 'name');

    res.status(201).json({
      success: true,
      message: 'Annotation created successfully',
      annotation: populatedAnnotation
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get annotations for a PDF
// @route   GET /api/annotations/pdf/:pdfId
// @access  Private/Public (depends on PDF visibility)
router.get('/pdf/:pdfId', protect, async (req, res, next) => {
  try {
    const { pdfId } = req.params;
    const { page, type, isResolved } = req.query;

    // Check if PDF exists and user has access
    const pdf = await PDF.findById(pdfId);
    if (!pdf) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found'
      });
    }

    const hasAccess = pdf.user.toString() === req.user.id || pdf.isPublic;
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view annotations for this PDF'
      });
    }

    // Build query
    let query = { pdf: pdfId };
    
    // Only show public annotations if user doesn't own the PDF
    if (pdf.user.toString() !== req.user.id) {
      query.isPrivate = false;
    }

    if (page) query.page = parseInt(page);
    if (type) query.type = type;
    if (isResolved !== undefined) query.isResolved = isResolved === 'true';

    const annotations = await Annotation.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name')
      .populate('replies.user', 'name');

    res.status(200).json({
      success: true,
      count: annotations.length,
      annotations
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get user's annotations
// @route   GET /api/annotations/my
// @access  Private
router.get('/my', protect, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = { user: req.user.id };
    
    if (req.query.type) query.type = req.query.type;
    if (req.query.isResolved !== undefined) query.isResolved = req.query.isResolved === 'true';

    const total = await Annotation.countDocuments(query);
    const annotations = await Annotation.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('pdf', 'title originalName')
      .populate('replies.user', 'name');

    res.status(200).json({
      success: true,
      count: annotations.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      annotations
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update annotation
// @route   PUT /api/annotations/:id
// @access  Private
router.put('/:id', protect, async (req, res, next) => {
  try {
    let annotation = await Annotation.findById(req.params.id);

    if (!annotation) {
      return res.status(404).json({
        success: false,
        message: 'Annotation not found'
      });
    }

    // Make sure user owns annotation
    if (annotation.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this annotation'
      });
    }

    const updateFields = {};
    const { content, isPrivate, isResolved, tags } = req.body;

    if (content) updateFields.content = { ...annotation.content, ...content };
    if (typeof isPrivate === 'boolean') updateFields.isPrivate = isPrivate;
    if (typeof isResolved === 'boolean') updateFields.isResolved = isResolved;
    if (tags) updateFields.tags = tags;

    annotation = await Annotation.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).populate('user', 'name').populate('replies.user', 'name');

    res.status(200).json({
      success: true,
      message: 'Annotation updated successfully',
      annotation
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete annotation
// @route   DELETE /api/annotations/:id
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const annotation = await Annotation.findById(req.params.id);

    if (!annotation) {
      return res.status(404).json({
        success: false,
        message: 'Annotation not found'
      });
    }

    // Make sure user owns annotation or is admin
    if (annotation.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this annotation'
      });
    }

    await Annotation.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Annotation deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Add reply to annotation
// @route   POST /api/annotations/:id/replies
// @access  Private
router.post('/:id/replies', protect, async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reply text is required'
      });
    }

    const annotation = await Annotation.findById(req.params.id);

    if (!annotation) {
      return res.status(404).json({
        success: false,
        message: 'Annotation not found'
      });
    }

    // Check if user has access to the PDF
    const pdf = await PDF.findById(annotation.pdf);
    const hasAccess = pdf.user.toString() === req.user.id || pdf.isPublic;
    
    if (!hasAccess || annotation.isPrivate) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reply to this annotation'
      });
    }

    annotation.replies.push({
      user: req.user.id,
      text: text.trim()
    });

    await annotation.save();

    const updatedAnnotation = await Annotation.findById(annotation._id)
      .populate('user', 'name')
      .populate('replies.user', 'name');

    res.status(201).json({
      success: true,
      message: 'Reply added successfully',
      annotation: updatedAnnotation
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete reply from annotation
// @route   DELETE /api/annotations/:id/replies/:replyId
// @access  Private
router.delete('/:id/replies/:replyId', protect, async (req, res, next) => {
  try {
    const annotation = await Annotation.findById(req.params.id);

    if (!annotation) {
      return res.status(404).json({
        success: false,
        message: 'Annotation not found'
      });
    }

    const reply = annotation.replies.id(req.params.replyId);

    if (!reply) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found'
      });
    }

    // Make sure user owns reply or annotation
    if (reply.user.toString() !== req.user.id && 
        annotation.user.toString() !== req.user.id && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this reply'
      });
    }

    reply.remove();
    await annotation.save();

    res.status(200).json({
      success: true,
      message: 'Reply deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;