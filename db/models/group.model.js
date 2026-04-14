import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    // e.g. 101, 202, "Group A" — flexible string so teachers name it freely
    name: {
      type: String,
      required: true,
      trim: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

// A teacher cannot have two groups with the same name
groupSchema.index({ name: 1, teacher: 1 }, { unique: true });

const Group = mongoose.model('Group', groupSchema);
export default Group;
