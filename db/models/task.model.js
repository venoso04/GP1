import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    taskName: { type: String, required: true, trim: true },
    taskTitle: { type: String, required: true, trim: true },
    taskType: {
      type: String,
      enum: ['personal', 'home', 'office', 'library', 'other'],
      default: 'personal',
    },
    location: { type: String, trim: true },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    deadline: { type: Date, required: true },
    rewardCoins: { type: Number, default: 50 },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
  },
  { timestamps: true }
);

const Task = mongoose.model('Task', taskSchema);
export default Task;
