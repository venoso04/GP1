import Quiz from '../../db/models/quiz.model.js';
import QuizSubmission from '../../db/models/quizSubmission.model.js';
import Group from '../../db/models/group.model.js';
import User from '../../db/models/user.model.js';
import { autoGradeMCQ, percentageToGrade, getPerformanceInsight } from '../../utils/grading.js';

// ════════════════════════════════════════════════════════════════════════════
//  TEACHER
// ════════════════════════════════════════════════════════════════════════════

// POST /quizzes — Create a quiz
// Body: { title, subject, description, duration, deadline, assignedGroup, questions[] }
// questions[]: { questionText, type: 'mcq'|'open_ended', options[], correctAnswer, points }
export const createQuiz = async (req, res) => {
  try {
    const { title, subject, description, duration, deadline, assignedGroup, questions } = req.body;

    const group = await Group.findOne({ _id: assignedGroup, teacher: req.user.id });
    if (!group) {
      return res.status(404).json({ messageEng: 'Group not found or does not belong to you.' });
    }

    if (!questions || questions.length === 0) {
      return res.status(400).json({ messageEng: 'A quiz must have at least one question.' });
    }

    // Validate MCQ questions have correctAnswer
    for (const q of questions) {
      if (q.type === 'mcq' && !q.correctAnswer) {
        return res.status(400).json({
          messageEng: `MCQ question "${q.questionText}" is missing a correctAnswer.`,
        });
      }
      if (q.type === 'mcq' && (!q.options || q.options.length < 2)) {
        return res.status(400).json({
          messageEng: `MCQ question "${q.questionText}" must have at least 2 options.`,
        });
      }
    }

    const quiz = await Quiz.create({
      title,
      subject,
      description,
      duration,
      deadline: new Date(deadline),
      assignedGroup,
      teacher: req.user.id,
      questions,
    });

    res.status(201).json({ messageEng: 'Quiz created successfully.', quiz });
  } catch (err) {
    console.error(err);
    res.status(500).json({ messageEng: 'Server error.' });
  }
};

// GET /quizzes — All quizzes by this teacher
export const getTeacherQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ teacher: req.user.id })
      .populate('assignedGroup', 'name')
      .sort({ createdAt: -1 });

    const quizzesWithStats = await Promise.all(
      quizzes.map(async (quiz) => {
        const submissionCount = await QuizSubmission.countDocuments({ quiz: quiz._id });
        const graded = await QuizSubmission.countDocuments({
          quiz: quiz._id,
          gradingStatus: 'fully_graded',
        });
        const avgScore = await QuizSubmission.aggregate([
          { $match: { quiz: quiz._id, percentage: { $ne: null } } },
          { $group: { _id: null, avg: { $avg: '$percentage' } } },
        ]);

        return {
          ...quiz.toObject(),
          submissionCount,
          fullyGradedCount: graded,
          avgScore: avgScore[0]?.avg ? Math.round(avgScore[0].avg) : null,
        };
      })
    );

    res.json(quizzesWithStats);
  } catch (err) {
    res.status(500).json({ messageEng: 'Server error.' });
  }
};

// GET /quizzes/:id — Quiz details + all submissions summary (teacher view)
export const getQuizByIdTeacher = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, teacher: req.user.id })
      .populate('assignedGroup', 'name students');

    if (!quiz) return res.status(404).json({ messageEng: 'Quiz not found.' });

    const submissions = await QuizSubmission.find({ quiz: quiz._id })
      .populate('student', 'name email')
      .select('-answers')
      .sort({ submittedAt: -1 });

    res.json({ quiz, submissions });
  } catch (err) {
    res.status(500).json({ messageEng: 'Server error.' });
  }
};

// GET /quizzes/:id/submissions — Detailed submissions list with answers
export const getQuizSubmissions = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, teacher: req.user.id });
    if (!quiz) return res.status(404).json({ messageEng: 'Quiz not found.' });

    const submissions = await QuizSubmission.find({ quiz: quiz._id })
      .populate('student', 'name email')
      .sort({ submittedAt: 1 });

    // Find students who haven't submitted yet
    const group = await Group.findById(quiz.assignedGroup).populate('students', 'name email');
    const submittedIds = submissions.map((s) => s.student._id.toString());
    const pendingStudents = group.students.filter(
      (s) => !submittedIds.includes(s._id.toString())
    );

    res.json({ quiz: { _id: quiz._id, title: quiz.title }, submissions, pendingStudents });
  } catch (err) {
    res.status(500).json({ messageEng: 'Server error.' });
  }
};

// PUT /quizzes/:id — Edit a quiz (only if no submissions yet)
export const updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, teacher: req.user.id });
    if (!quiz) return res.status(404).json({ messageEng: 'Quiz not found.' });

    const submissionCount = await QuizSubmission.countDocuments({ quiz: quiz._id });
    if (submissionCount > 0) {
      return res.status(400).json({
        messageEng: 'Cannot edit a quiz that already has submissions.',
      });
    }

    const updated = await Quiz.findByIdAndUpdate(
      req.params.id,
      { ...req.body, ...(req.body.deadline && { deadline: new Date(req.body.deadline) }) },
      { new: true, runValidators: true }
    );

    res.json({ messageEng: 'Quiz updated.', quiz: updated });
  } catch (err) {
    res.status(500).json({ messageEng: 'Server error.' });
  }
};

// DELETE /quizzes/:id
export const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, teacher: req.user.id });
    if (!quiz) return res.status(404).json({ messageEng: 'Quiz not found.' });

    await QuizSubmission.deleteMany({ quiz: quiz._id });
    res.json({ messageEng: 'Quiz deleted successfully.' });
  } catch (err) {
    res.status(500).json({ messageEng: 'Server error.' });
  }
};

// PATCH /quizzes/:submissionId/grade — Teacher grades open-ended answers
// Body: { grades: [{ questionId, teacherScore, teacherFeedback }] }
export const gradeOpenEnded = async (req, res) => {
  try {
    const submission = await QuizSubmission.findById(req.params.submissionId).populate({
      path: 'quiz',
      match: { teacher: req.user.id },
    });

    if (!submission || !submission.quiz) {
      return res.status(404).json({ messageEng: 'Submission not found.' });
    }

    const { grades } = req.body; // [{ questionId, teacherScore, teacherFeedback }]
    if (!grades || !Array.isArray(grades)) {
      return res.status(400).json({ messageEng: 'grades array is required.' });
    }

    // Apply teacher scores
    for (const grade of grades) {
      const answer = submission.answers.find(
        (a) => a.question.toString() === grade.questionId
      );
      if (answer && answer.questionType === 'open_ended') {
        answer.teacherScore = grade.teacherScore;
        answer.teacherFeedback = grade.teacherFeedback || '';
      }
    }

    // Recalculate total score
    const quiz = await Quiz.findById(submission.quiz._id);
    let totalScore = 0;
    let totalPoints = 0;

    for (const answer of submission.answers) {
      const question = quiz.questions.id(answer.question);
      if (!question) continue;
      totalPoints += question.points;

      if (answer.questionType === 'mcq' && answer.isCorrect) {
        totalScore += question.points;
      } else if (answer.questionType === 'open_ended' && answer.teacherScore !== null) {
        totalScore += Math.min(answer.teacherScore, question.points); // cap at max points
      }
    }

    // Check if all open-ended questions are now graded
    const allGraded = submission.answers
      .filter((a) => a.questionType === 'open_ended')
      .every((a) => a.teacherScore !== null);

    const percentage = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;

    submission.score = totalScore;
    submission.totalPoints = totalPoints;
    submission.percentage = percentage;
    submission.grade = percentageToGrade(percentage);
    submission.gradingStatus = allGraded ? 'fully_graded' : 'pending_manual';

    await submission.save();

    res.json({
      messageEng: allGraded ? 'Submission fully graded.' : 'Partial grades saved.',
      score: totalScore,
      totalPoints,
      percentage,
      grade: submission.grade,
      gradingStatus: submission.gradingStatus,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ messageEng: 'Server error.' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
//  STUDENT
// ════════════════════════════════════════════════════════════════════════════

// GET /quizzes/student/my-quizzes — Available + completed quizzes for student
export const getStudentQuizzes = async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    if (!student.group) {
      return res.status(400).json({ messageEng: 'You are not assigned to any group yet.' });
    }

    const quizzes = await Quiz.find({ assignedGroup: student.group })
      .populate('teacher', 'name')
      .sort({ deadline: 1 });

    const quizzesWithStatus = await Promise.all(
      quizzes.map(async (quiz) => {
        const submission = await QuizSubmission.findOne({
          quiz: quiz._id,
          student: req.user.id,
        }).select('percentage grade gradingStatus submittedAt');

        const now = new Date();
        let status = 'available';
        if (submission) status = 'completed';
        else if (now > quiz.deadline) status = 'expired';

        return {
          _id: quiz._id,
          title: quiz.title,
          subject: quiz.subject,
          description: quiz.description,
          duration: quiz.duration,
          deadline: quiz.deadline,
          questionCount: quiz.questions.length,
          teacher: quiz.teacher,
          status,
          submission: submission || null,
        };
      })
    );

    const pending = quizzesWithStatus.filter((q) => q.status === 'available').length;
    const completed = quizzesWithStatus.filter((q) => q.status === 'completed').length;
    const completedWithScores = quizzesWithStatus.filter(
      (q) => q.submission?.percentage !== null && q.submission?.percentage !== undefined
    );
    const avgScore =
      completedWithScores.length > 0
        ? Math.round(
            completedWithScores.reduce((sum, q) => sum + q.submission.percentage, 0) /
              completedWithScores.length
          )
        : null;

    res.json({
      summary: { pending, completed, avgScore },
      quizzes: quizzesWithStatus,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ messageEng: 'Server error.' });
  }
};

// GET /quizzes/student/:id/take — Get quiz questions (NO correct answers exposed)
export const takeQuiz = async (req, res) => {
  try {
    const student = await User.findById(req.user.id);

    const quiz = await Quiz.findOne({ assignedGroup: student.group, _id: req.params.id });
    if (!quiz) return res.status(404).json({ messageEng: 'Quiz not found.' });

    const now = new Date();
    if (now > quiz.deadline) {
      return res.status(400).json({ messageEng: 'This quiz deadline has passed.' });
    }

    // Check if already attempted
    const existing = await QuizSubmission.findOne({ quiz: quiz._id, student: req.user.id });
    if (existing) {
      return res.status(400).json({
        messageEng: 'You have already attempted this quiz.',
        submissionId: existing._id,
      });
    }

    // Create a "started" submission to track start time
    const submission = await QuizSubmission.create({
      quiz: quiz._id,
      student: req.user.id,
      answers: [],
      startedAt: now,
      gradingStatus: 'auto_graded',
    });

    // Strip correct answers before sending to student
    const safeQuestions = quiz.questions.map((q) => ({
      _id: q._id,
      questionText: q.questionText,
      type: q.type,
      points: q.points,
      options: q.options.map((o) => ({ label: o.label, text: o.text })),
      // correctAnswer intentionally omitted
    }));

    res.json({
      submissionId: submission._id,
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        subject: quiz.subject,
        duration: quiz.duration,
        totalQuestions: quiz.questions.length,
      },
      questions: safeQuestions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ messageEng: 'Server error.' });
  }
};

// POST /quizzes/student/:id/submit — Submit answers
// Body: { submissionId, answers: [{ questionId, answerText }], flaggedQuestions: [] }
export const submitQuiz = async (req, res) => {
  try {
    const { submissionId, answers, flaggedQuestions } = req.body;

    const submission = await QuizSubmission.findOne({
      _id: submissionId,
      student: req.user.id,
    });

    if (!submission) {
      return res.status(404).json({ messageEng: 'Submission session not found. Please start the quiz again.' });
    }

    if (submission.submittedAt) {
      return res.status(400).json({ messageEng: 'This quiz has already been submitted.' });
    }

    const quiz = await Quiz.findById(submission.quiz);
    const now = new Date();

    // Build answers array
    const formattedAnswers = (answers || []).map((ans) => {
      const question = quiz.questions.id(ans.questionId);
      return {
        question: ans.questionId,
        questionType: question?.type || 'mcq',
        answerText: ans.answerText || '',
      };
    });

    // Auto-grade MCQ answers
    const { score, totalPoints, percentage, grade, gradedAnswers } = autoGradeMCQ(
      quiz.questions,
      formattedAnswers
    );

    // Determine grading status
    const hasOpenEnded = quiz.questions.some((q) => q.type === 'open_ended');
    const gradingStatus = hasOpenEnded ? 'pending_manual' : 'auto_graded';

    // Calculate time taken
    const timeTakenSeconds = Math.round((now - submission.startedAt) / 1000);

    submission.answers = gradedAnswers;
    submission.submittedAt = now;
    submission.timeTakenSeconds = timeTakenSeconds;
    submission.flaggedQuestions = flaggedQuestions || [];
    submission.gradingStatus = gradingStatus;

    // Only assign final scores if fully auto-gradeable
    if (!hasOpenEnded) {
      submission.score = score;
      submission.totalPoints = totalPoints;
      submission.percentage = percentage;
      submission.grade = grade;
    } else {
      // Store partial MCQ score; open-ended will be added by teacher later
      submission.score = score;
      submission.totalPoints = totalPoints;
    }

    await submission.save();

    const correctCount = gradedAnswers.filter((a) => a.isCorrect === true).length;
    const wrongCount = gradedAnswers.filter((a) => a.isCorrect === false).length;

    const minutes = Math.floor(timeTakenSeconds / 60);
    const seconds = timeTakenSeconds % 60;
    const timeTakenFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    res.json({
      messageEng: hasOpenEnded
        ? 'Quiz submitted. Open-ended questions are pending teacher review.'
        : 'Quiz submitted and graded successfully!',
      result: hasOpenEnded
        ? null
        : {
            score,
            totalPoints,
            percentage,
            grade,
            correctCount,
            wrongCount,
            timeTaken: timeTakenFormatted,
            totalQuestions: quiz.questions.length,
            performanceInsight: getPerformanceInsight(correctCount, quiz.questions.length),
          },
      gradingStatus,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ messageEng: 'Server error.' });
  }
};

// GET /quizzes/student/:id/result — Get own quiz result
export const getQuizResult = async (req, res) => {
  try {
    const submission = await QuizSubmission.findOne({
      quiz: req.params.id,
      student: req.user.id,
    });

    if (!submission) {
      return res.status(404).json({ messageEng: 'No submission found for this quiz.' });
    }

    if (!submission.submittedAt) {
      return res.status(400).json({ messageEng: 'Quiz has not been submitted yet.' });
    }

    if (submission.gradingStatus === 'pending_manual') {
      return res.status(200).json({
        messageEng: 'Your open-ended answers are still being reviewed by your teacher.',
        gradingStatus: 'pending_manual',
      });
    }

    const quiz = await Quiz.findById(submission.quiz).select('title subject questions');
    const correctCount = submission.answers.filter((a) => a.isCorrect === true).length;
    const wrongCount = submission.answers.filter((a) => a.isCorrect === false).length;

    const minutes = Math.floor(submission.timeTakenSeconds / 60);
    const seconds = submission.timeTakenSeconds % 60;
    const timeTakenFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Build detailed results (show correct answer for MCQ after grading)
    const detailedResults = submission.answers.map((ans) => {
      const question = quiz.questions.id(ans.question);
      return {
        questionText: question?.questionText,
        type: ans.questionType,
        yourAnswer: ans.answerText,
        correctAnswer: ans.questionType === 'mcq' ? question?.correctAnswer : null,
        isCorrect: ans.isCorrect,
        teacherScore: ans.teacherScore,
        teacherFeedback: ans.teacherFeedback,
        points: question?.points,
      };
    });

    res.json({
      quiz: { title: quiz.title, subject: quiz.subject },
      score: submission.score,
      totalPoints: submission.totalPoints,
      percentage: submission.percentage,
      grade: submission.grade,
      correctCount,
      wrongCount,
      timeTaken: timeTakenFormatted,
      totalQuestions: quiz.questions.length,
      performanceInsight: getPerformanceInsight(correctCount, quiz.questions.length),
      detailedResults,
      gradingStatus: submission.gradingStatus,
    });
  } catch (err) {
    res.status(500).json({ messageEng: 'Server error.' });
  }
};
