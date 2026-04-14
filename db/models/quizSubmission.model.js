import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  questionType: {
    type: String,
    enum: ['mcq', 'open_ended'],
  },
  // For MCQ: the selected option label e.g. "A"
  // For open_ended: the written answer text
  answerText: { type: String, default: '' },

  // MCQ — auto-graded immediately on submit
  isCorrect: { type: Boolean, default: null },

  // open_ended — graded by teacher later
  // null = not graded yet, number = teacher's score
  teacherScore: { type: Number, default: null },
  teacherFeedback: { type: String, default: '' },
});

const quizSubmissionSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    answers: [answerSchema],

    // Filled after all open-ended questions are graded (or immediately if all MCQ)
    score: { type: Number, default: null },        // e.g. 4
    totalPoints: { type: Number, default: null },  // e.g. 5
    percentage: { type: Number, default: null },   // e.g. 80
    grade: { type: String, default: null },        // e.g. "A-"

    // Grading state
    gradingStatus: {
      type: String,
      enum: ['auto_graded', 'pending_manual', 'fully_graded'],
      default: 'auto_graded',
    },

    // Time tracking
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    timeTakenSeconds: { type: Number },

    // Flagged questions (from UI — the bookmark icon)
    flaggedQuestions: [{ type: mongoose.Schema.Types.ObjectId }],
  },
  { timestamps: true }
);

// One attempt per student per quiz
quizSubmissionSchema.index({ quiz: 1, student: 1 }, { unique: true });

const QuizSubmission = mongoose.model('QuizSubmission', quizSubmissionSchema);
export default QuizSubmission;
