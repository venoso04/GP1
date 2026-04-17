import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    taskType: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active',
    },
    completedAt: {
      type: Date,
    },
    rewardCoins: {
      type: Number,
      default: 50,
    },
    rewardGranted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Task', taskSchema);
