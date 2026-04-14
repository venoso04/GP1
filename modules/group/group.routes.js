import { Router } from 'express';
import { auth } from '../auth/auth.middleware.js';
import {
  createGroup,
  getMyGroups,
  getGroupById,
  addStudentToGroup,
  removeStudentFromGroup,
  getMyGroup,
} from './group.controllers.js';

export const groupRouter = Router();

// ── Teacher routes ────────────────────────────────────────────────────────────
groupRouter.post('/', auth('teacher'), createGroup);
groupRouter.get('/', auth('teacher'), getMyGroups);
groupRouter.get('/:id', auth('teacher'), getGroupById);
groupRouter.post('/:id/students', auth('teacher'), addStudentToGroup);
groupRouter.delete('/:id/students/:studentId', auth('teacher'), removeStudentFromGroup);

// ── Student routes ────────────────────────────────────────────────────────────
groupRouter.get('/student/my-group', auth('student'), getMyGroup);
