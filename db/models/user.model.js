import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['student'],
      default: 'student',
    },
    emailConfirmed: {
      type: Boolean,
      default: false,
    },
    coins: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
