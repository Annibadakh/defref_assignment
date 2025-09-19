import mongoose from 'mongoose';

const pdfSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  filename: {
    type: String,
    required: [true, 'Filename is required']
  },
  originalName: {
    type: String,
    required: [true, 'Original name is required']
  },
  filePath: {
    type: String,
    required: [true, 'File path is required']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required'],
    validate: {
      validator: function(v) {
        return v === 'application/pdf';
      },
      message: 'Only PDF files are allowed'
    }
  },
  pageCount: {
    type: Number,
    default: null
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot be more than 30 characters']
  }],
  status: {
    type: String,
    enum: ['processing', 'ready', 'error'],
    default: 'ready'
  },
  metadata: {
    author: String,
    subject: String,
    creator: String,
    producer: String,
    creationDate: Date,
    modificationDate: Date,
    keywords: [String]
  },
  accessCount: {
    type: Number,
    default: 0
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
pdfSchema.index({ user: 1, createdAt: -1 });
pdfSchema.index({ title: 'text', description: 'text' });
pdfSchema.index({ tags: 1 });
pdfSchema.index({ isPublic: 1 });

// Virtual for annotations
pdfSchema.virtual('annotations', {
  ref: 'Annotation',
  localField: '_id',
  foreignField: 'pdf'
});

// Virtual for annotation count
pdfSchema.virtual('annotationCount', {
  ref: 'Annotation',
  localField: '_id',
  foreignField: 'pdf',
  count: true
});

// Pre-remove middleware to clean up annotations
pdfSchema.pre('remove', async function(next) {
  await this.model('Annotation').deleteMany({ pdf: this._id });
  next();
});

export default mongoose.model('PDF', pdfSchema);