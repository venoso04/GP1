import fs from 'fs';
import VideoSummary from '../../db/models/videoSummary.model.js';
import { summarizeVideo } from '../../utils/hfVideoClient.js';

// ─── POST /video-summaries ────────────────────────────────────────────────────
// Upload a video file → forward to HF API → save summary → return result
export const createVideoSummary = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'A video file is required.' });
  }

  const { path: filePath, originalname } = req.file;

  try {
    const { summaryText, transcriptText } = await summarizeVideo(filePath, originalname);

    const summary = await VideoSummary.create({
      student: req.user.id,
      originalFileName: originalname,
      summaryText,
      transcriptText: transcriptText || null,
    });

    res.status(201).json({
      message: 'Video summarized successfully.',
      summary,
    });
  } catch (err) {
    console.error('createVideoSummary error:', err.message);

    if (err.response) {
      return res.status(502).json({
        message: 'The video summarization service returned an error. Please try again.',
        detail: err.response.data || err.message,
      });
    }
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({
        message: 'The summarization service timed out. Your video may be too long — try a shorter clip.',
      });
    }

    res.status(500).json({ message: 'Server error.' });
  } finally {
    // Always remove the temp file from disk after forwarding
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

// ─── GET /video-summaries ─────────────────────────────────────────────────────
// Get the student's full video summary history, newest first
export const getMyVideoSummaries = async (req, res) => {
  try {
    const summaries = await VideoSummary.find({ student: req.user.id })
      .sort({ createdAt: -1 })
      .select('originalFileName summaryText createdAt');

    res.json({ count: summaries.length, summaries });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET /video-summaries/:id ─────────────────────────────────────────────────
export const getVideoSummaryById = async (req, res) => {
  try {
    const summary = await VideoSummary.findOne({
      _id: req.params.id,
      student: req.user.id,
    });

    if (!summary) return res.status(404).json({ message: 'Summary not found.' });

    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── DELETE /video-summaries/:id ──────────────────────────────────────────────
export const deleteVideoSummary = async (req, res) => {
  try {
    const summary = await VideoSummary.findOneAndDelete({
      _id: req.params.id,
      student: req.user.id,
    });

    if (!summary) return res.status(404).json({ message: 'Summary not found.' });

    res.json({ message: 'Summary deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};
