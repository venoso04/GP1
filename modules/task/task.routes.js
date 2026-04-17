import { Router } from 'express';
import { auth } from '../../middleware/auth.middleware.js';
import {
  createTask,
  getMyTasks,
  getTaskById,
  completeTask,
  deleteTask,
} from './task.controllers.js';

export const taskRouter = Router();

// All task routes require authentication
taskRouter.use(auth);

taskRouter.post('/', createTask);
taskRouter.get('/', getMyTasks);
taskRouter.get('/:id', getTaskById);
taskRouter.patch('/:id/complete', completeTask);
taskRouter.delete('/:id', deleteTask);
