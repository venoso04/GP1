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
      enum: ['student', 'teacher'],
      default: 'student',
    },
    emailConfirmed: {
      type: Boolean,
      default: false,
    },
    // Student-only fields
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
    },
    coins: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User;
