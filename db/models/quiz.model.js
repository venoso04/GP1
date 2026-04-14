import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  type: {
    type: String,
    enum: ['mcq', 'open_ended'],
    required: true,
  },
  // MCQ only
  options: [
    {
      label: { type: String }, // "A", "B", "C", "D"
      text: { type: String },
    },
  ],
  // MCQ only — index into options array (0-based) or label e.g. "A"
  correctAnswer: { type: String, default: null },

  // Points this question is worth (default 1)
  points: { type: Number, default: 1 },
});

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, trim: true },
    description: { type: String, trim: true },

    // Duration in minutes
    duration: { type: Number, required: true },
    deadline: { type: Date, required: true },

    questions: [questionSchema],

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

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;
