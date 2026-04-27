import { Router } from 'express';
import { auth } from '../auth/auth.middleware.js';
import { uploadVideo } from '../../utils/multer.js';
import {
  createVideoSummary,
  getMyVideoSummaries,
  getVideoSummaryById,
  deleteVideoSummary,
} from './videoSummary.controllers.js';

export const videoSummaryRouter = Router();

videoSummaryRouter.use(auth);

// POST /video-summaries — multipart/form-data, field name: "video"
videoSummaryRouter.post('/', uploadVideo.single('video'), createVideoSummary);
videoSummaryRouter.get('/', getMyVideoSummaries);
videoSummaryRouter.get('/:id', getVideoSummaryById);
videoSummaryRouter.delete('/:id', deleteVideoSummary);
