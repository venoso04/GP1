import mongoose from 'mongoose';

const taskSubmissionSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Path/URL to the uploaded PDF proof
    filePath: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    // Was the task submitted before or after deadline?
    isOnTime: {
      type: Boolean,
      required: true,
    },
    // How many coins were awarded (0 if late, task.rewardCoins if on time)
    coinsAwarded: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// A student can only submit once per task
taskSubmissionSchema.index({ task: 1, student: 1 }, { unique: true });

const TaskSubmission = mongoose.model('TaskSubmission', taskSubmissionSchema);
export default TaskSubmission;
