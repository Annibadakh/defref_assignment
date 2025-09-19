import mongoose from 'mongoose';

const annotationSchema = new mongoose.Schema({
  pdf: {
    type: mongoose.Schema.ObjectId,
    ref: 'PDF',
    required: [true, 'PDF reference is required']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  page: {
    type: Number,
    required: [true, 'Page number is required'],
    min: [1, 'Page number must be at least 1']
  },
  type: {
    type: String,
    enum: ['highlight', 'text', 'rectangle', 'circle', 'arrow', 'freehand'],
    required: [true, 'Annotation type is required']
  },
  content: {
    text: {
      type: String,
      maxlength: [1000, 'Text content cannot exceed 1000 characters']
    },
    coordinates: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      width: Number,
      height: Number
    },
    bounds: {
      x1: Number,
      y1: Number,
      x2: Number,
      y2: Number
    },
    points: [{
      x: Number,
      y: Number
    }],
    style: {
      color: {
        type: String,
        default: '#FFFF00',
        match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color']
      },
      opacity: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.5
      },
      strokeWidth: {
        type: Number,
        min: 1,
        max: 10,
        default: 2
      },
      fontSize: {
        type: Number,
        min: 8,
        max: 72,
        default: 14
      },
      fontFamily: {
        type: String,
        default: 'Arial'
      }
    }
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  replies: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: [500, 'Reply cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isResolved: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot be more than 20 characters']
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
annotationSchema.index({ pdf: 1, page: 1 });
annotationSchema.index({ user: 1, createdAt: -1 });
annotationSchema.index({ type: 1 });
annotationSchema.index({ isPrivate: 1 });

// Virtual for reply count
annotationSchema.virtual('replyCount').get(function() {
  return this.replies ? this.replies.length : 0;
});

export default mongoose.model('Annotation', annotationSchema);