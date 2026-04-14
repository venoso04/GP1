import { Router } from 'express';
import { auth } from '../auth/auth.middleware.js';
import {
  createQuiz,
  getTeacherQuizzes,
  getQuizByIdTeacher,
  getQuizSubmissions,
  updateQuiz,
  deleteQuiz,
  gradeOpenEnded,
  getStudentQuizzes,
  takeQuiz,
  submitQuiz,
  getQuizResult,
} from './quiz.controllers.js';

export const quizRouter = Router();

// ── Teacher routes ────────────────────────────────────────────────────────────
quizRouter.post('/', auth('teacher'), createQuiz);
quizRouter.get('/', auth('teacher'), getTeacherQuizzes);
quizRouter.get('/:id', auth('teacher'), getQuizByIdTeacher);
quizRouter.get('/:id/submissions', auth('teacher'), getQuizSubmissions);
quizRouter.put('/:id', auth('teacher'), updateQuiz);
quizRouter.delete('/:id', auth('teacher'), deleteQuiz);
quizRouter.patch('/submissions/:submissionId/grade', auth('teacher'), gradeOpenEnded);

// ── Student routes ────────────────────────────────────────────────────────────
quizRouter.get('/student/my-quizzes', auth('student'), getStudentQuizzes);
quizRouter.get('/student/:id/take', auth('student'), takeQuiz);
quizRouter.post('/student/:id/submit', auth('student'), submitQuiz);
quizRouter.get('/student/:id/result', auth('student'), getQuizResult);
