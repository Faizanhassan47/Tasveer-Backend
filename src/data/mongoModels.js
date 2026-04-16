import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['creator', 'consumer'],
      required: true
    }
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false
    }
  }
);

const photoSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    caption: {
      type: String,
      default: '',
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    eventName: {
      type: String,
      required: true,
      trim: true
    },
    tags: {
      type: [String],
      default: []
    },
    imageUrl: {
      type: String,
      required: true
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    averageRating: {
      type: Number,
      default: null,
      index: true
    },
    ratingsCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false
    }
  }
);

const commentSchema = new Schema(
  {
    photoId: {
      type: Schema.Types.ObjectId,
      ref: 'Photo',
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false
    }
  }
);

const ratingSchema = new Schema(
  {
    photoId: {
      type: Schema.Types.ObjectId,
      ref: 'Photo',
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    value: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    }
  },
  {
    timestamps: true
  }
);

ratingSchema.index({ photoId: 1, userId: 1 }, { unique: true });

export const UserModel = models.User || model('User', userSchema);
export const PhotoModel = models.Photo || model('Photo', photoSchema);
export const CommentModel = models.Comment || model('Comment', commentSchema);
export const RatingModel = models.Rating || model('Rating', ratingSchema);
