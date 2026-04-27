import mongoose from 'mongoose';

const videoSummarySchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Original video file name the student uploaded
    originalFileName: {
      type: String,
      required: true,
    },

    // The summary text returned by the HF API
    summaryText: {
      type: String,
      required: true,
    },

    // Optional transcript if the HF API returns one
    transcriptText: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const VideoSummary = mongoose.model('VideoSummary', videoSummarySchema);
export default VideoSummary;
