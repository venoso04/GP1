import { Router } from 'express';
import { auth } from '../auth/auth.middleware.js';
import { uploadPDF } from '../../utils/multer.js';
import {
  createTask,
  getTeacherTasks,
  getTaskByIdTeacher,
  getTaskSubmissions,
  updateTask,
  deleteTask,
  getStudentTasks,
  getStudentTaskById,
  completeTask,
} from './task.controllers.js';

export const taskRouter = Router();

// ── Teacher routes ────────────────────────────────────────────────────────────
taskRouter.post('/', auth('teacher'), createTask);
taskRouter.get('/', auth('teacher'), getTeacherTasks);
taskRouter.get('/:id', auth('teacher'), getTaskByIdTeacher);
taskRouter.get('/:id/submissions', auth('teacher'), getTaskSubmissions);
taskRouter.put('/:id', auth('teacher'), updateTask);
taskRouter.delete('/:id', auth('teacher'), deleteTask);

// ── Student routes ────────────────────────────────────────────────────────────
taskRouter.get('/student/my-tasks', auth('student'), getStudentTasks);
taskRouter.get('/student/:id', auth('student'), getStudentTaskById);
taskRouter.patch('/student/:id/complete', auth('student'), uploadPDF.single('file'), completeTask);
