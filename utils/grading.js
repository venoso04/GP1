/**
 * Converts a percentage score to a letter grade.
 * Scale matches the UI (shows "A-", "B+", etc.)
 */
export const percentageToGrade = (percentage) => {
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
};

/**
 * Generates a performance insight message based on score.
 */
export const getPerformanceInsight = (correct, total) => {
  const pct = (correct / total) * 100;
  if (pct === 100) return `Perfect score! Outstanding performance, keep it up!`;
  if (pct >= 80) return `You answered ${correct} out of ${total} questions correctly. Excellent work! Keep it up!`;
  if (pct >= 60) return `You answered ${correct} out of ${total} questions correctly. Good effort — review the ones you missed.`;
  if (pct >= 40) return `You answered ${correct} out of ${total} questions correctly. Keep practicing, you're making progress.`;
  return `You answered ${correct} out of ${total} questions correctly. Don't give up — review the material and try again.`;
};

/**
 * Auto-grades MCQ answers for a submission.
 * Returns { score, totalPoints, percentage, grade, answers[] }
 */
export const autoGradeMCQ = (questions, submittedAnswers) => {
  let score = 0;
  let totalPoints = 0;

  const gradedAnswers = submittedAnswers.map((ans) => {
    const question = questions.find(
      (q) => q._id.toString() === ans.question.toString()
    );

    if (!question) return ans;

    if (question.type === 'mcq') {
      totalPoints += question.points;
      const isCorrect =
        ans.answerText?.trim().toUpperCase() ===
        question.correctAnswer?.trim().toUpperCase();
      if (isCorrect) score += question.points;
      return { ...ans, isCorrect };
    }

    // open_ended — not graded here
    return { ...ans, isCorrect: null };
  });

  // Total points includes open_ended questions (graded later)
  const allPoints = questions.reduce((sum, q) => sum + q.points, 0);

  // Only compute percentage from MCQ for now; will be recalculated when open_ended graded
  const percentage = allPoints > 0 ? Math.round((score / allPoints) * 100) : 0;
  const grade = percentageToGrade(percentage);

  return { score, totalPoints: allPoints, percentage, grade, gradedAnswers };
};
