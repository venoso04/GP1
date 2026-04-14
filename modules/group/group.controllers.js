import Group from '../../db/models/group.model.js';
import User from '../../db/models/user.model.js';

// ─── TEACHER: Create a group ─────────────────────────────────────────────────
export const createGroup = async (req, res) => {
  try {
    const { name } = req.body;

    const existing = await Group.findOne({ name, teacher: req.user.id });
    if (existing) {
      return res.status(400).json({
        messageEng: `You already have a group named "${name}".`,
      });
    }

    const group = await Group.create({ name, teacher: req.user.id });
    res.status(201).json({ messageEng: 'Group created successfully.', group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ messageEng: 'Server error.' });
  }
};

// ─── TEACHER: Get all my groups ──────────────────────────────────────────────
export const getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({ teacher: req.user.id })
      .populate('students', 'name email')
      .sort({ createdAt: -1 });

    res.json(groups);
  } catch (err) {
    res.status(500).json({ messageEng: 'Server error.' });
  }
};

// ─── TEACHER: Get one group with student list ────────────────────────────────
export const getGroupById = async (req, res) => {
  try {
    const group = await Group.findOne({
      _id: req.params.id,
      teacher: req.user.id,
    }).populate('students', 'name email coins');

    if (!group) {
      return res.status(404).json({ messageEng: 'Group not found.' });
    }

    res.json(group);
  } catch (err) {
    res.status(500).json({ messageEng: 'Server error.' });
  }
};

// ─── TEACHER: Add a student to a group by email ──────────────────────────────
export const addStudentToGroup = async (req, res) => {
  try {
    const { email } = req.body;
    const group = await Group.findOne({ _id: req.params.id, teacher: req.user.id });

    if (!group) {
      return res.status(404).json({ messageEng: 'Group not found.' });
    }

    const student = await User.findOne({ email, role: 'student' });
    if (!student) {
      return res.status(404).json({
        messageEng: 'No student found with that email.',
      });
    }

    if (student.group) {
      return res.status(400).json({
        messageEng: 'This student is already assigned to a group.',
      });
    }

    if (group.students.includes(student._id)) {
      return res.status(400).json({
        messageEng: 'Student is already in this group.',
      });
    }

    group.students.push(student._id);
    await group.save();

    student.group = group._id;
    await student.save();

    res.json({ messageEng: `${student.name} added to group "${group.name}".` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ messageEng: 'Server error.' });
  }
};

// ─── TEACHER: Remove a student from a group ─────────────────────────────────
export const removeStudentFromGroup = async (req, res) => {
  try {
    const group = await Group.findOne({ _id: req.params.id, teacher: req.user.id });
    if (!group) return res.status(404).json({ messageEng: 'Group not found.' });

    const student = await User.findById(req.params.studentId);
    if (!student) return res.status(404).json({ messageEng: 'Student not found.' });

    group.students = group.students.filter(
      (s) => s.toString() !== req.params.studentId
    );
    await group.save();

    student.group = null;
    await student.save();

    res.json({ messageEng: 'Student removed from group.' });
  } catch (err) {
    res.status(500).json({ messageEng: 'Server error.' });
  }
};

// ─── STUDENT: Get my group ───────────────────────────────────────────────────
export const getMyGroup = async (req, res) => {
  try {
    const student = await User.findById(req.user.id).populate('group');
    if (!student.group) {
      return res.status(404).json({ messageEng: 'You are not assigned to any group yet.' });
    }

    const group = await Group.findById(student.group._id)
      .populate('teacher', 'name email')
      .populate('students', 'name email');

    res.json(group);
  } catch (err) {
    res.status(500).json({ messageEng: 'Server error.' });
  }
};
