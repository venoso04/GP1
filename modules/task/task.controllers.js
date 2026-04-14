import Task from '../../db/models/task.model.js';
import TaskSubmission from '../../db/models/taskSubmission.model.js';
import Group from '../../db/models/group.model.js';
import User from '../../db/models/user.model.js';
import fs from 'fs';

// ════════════════════════════════════════════════════════════════════════════
//  TEACHER
// ════════════════════════════════════════════════════════════════════════════

// POST /tasks — Create a task
export const createTask = async (req, res) => {
  try {
    const { taskName, taskTitle, taskType, location, priority, deadline, rewardCoins, assignedGroup } = req.body;

    // Verify the group belongs to this teacher
    const group = await Group.findOne({ _id: assignedGroup, teacher: req.user.id });
    if (!group) {
      return res.status(404).json({ messageEng: 'Group not found or does not belong to you.' });
    }

    const task = await Task.create({
      taskName,
      taskTitle,
      taskType,
      location,
      priority,
      deadline: new Date(deadline),
      rewardCoins: rewardCoins ?? 50,
      teacher: req.user.id,
      assignedGroup,
    });

    res.status(201).json({ messageEng: 'Task created successfully.', task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ messageEng: 'Server error.' });
  }
};

// GET /tasks — Get all tasks created by this teacher
export const getTeacherTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ teacher: req.user.id })
      .populate('assignedGroup', 'name')
      .sort({ createdAt: -1 });

    // Attach submission counts
    const tasksWithCounts = await Promise.all(
      tasks.map(async (task) => {
        const submissionCount = await TaskSubmission.countDocuments({ task: task._id });
        return { ...task.toObject(), submissionCount };
      })
    );

    res.json(tasksWithCounts);
  } catch (err) {
    res.status(500).json({ messageEng: 'Server error.' });
  }
};

// GET /tasks/:id — Get task details + submission list
export const getTaskByIdTeacher = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, teacher: req.user.id })
      .populate('assignedGroup', 'name students');

    if (!task) return res.status(404).json({ messageEng: 'Task not found.' });

    const submissions = await TaskSubmission.find({ task: task._id })
      .populate('student', 'name email')
      .sort({ submittedAt: -1 });

    res.json({ task, submissions });
  } catch (err) {
    res.status(500).json({ messageEng: 'Server error.' });
  }
};

// GET /tasks/:id/submissions — All student submissions for a task
export const getTaskSubmissions = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, teacher: req.user.id });
    if (!task) return res.status(404).json({ messageEng: 'Task not found.' });

    const submissions = await TaskSubmission.find({ task: task._id })
      .populate('student', 'name email')
      .sort({ submittedAt: 1 });

    // Mark which students in the group have NOT submitted yet
    const group = await Group.findById(task.assignedGroup).populate('students', 'name email');
    const submittedIds = submissions.map((s) => s.student._id.toString());

    const pending = group.students.filter((s) => !submittedIds.includes(s._id.toString()));

    res.json({ submissions, pendingStudents: pending });
  } catch (err) {
    res.status(500).json({ messageEng: 'Server error.' });
  }
};

// PUT /tasks/:id — Edit a task
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user.id },
      { ...req.body, ...(req.body.deadline && { deadline: new Date(req.body.deadline) }) },
      { new: true, runValidators: true }
    );

    if (!task) return res.status(404).json({ messageEng: 'Task not found.' });
    res.json({ messageEng: 'Task updated.', task });
  } catch (err) {
    res.status(500).json({ messageEng: 'Server error.' });
  }
};

// DELETE /tasks/:id — Delete a task
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, teacher: req.user.id });
    if (!task) return res.status(404).json({ messageEng: 'Task not found.' });

    // Clean up submissions and uploaded files
    const submissions = await TaskSubmission.find({ task: task._id });
    for (const sub of submissions) {
      if (fs.existsSync(sub.filePath)) fs.unlinkSync(sub.filePath);
    }
    await TaskSubmission.deleteMany({ task: task._id });

    res.json({ messageEng: 'Task deleted successfully.' });
  } catch (err) {
    res.status(500).json({ messageEng: 'Server error.' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
//  STUDENT
// ════════════════════════════════════════════════════════════════════════════

// GET /tasks/student/my-tasks — Get all tasks for student's group
export const getStudentTasks = async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    if (!student.group) {
      return res.status(400).json({ messageEng: 'You are not assigned to any group yet.' });
    }

    const tasks = await Task.find({ assignedGroup: student.group })
      .populate('assignedGroup', 'name')
      .sort({ deadline: 1 });

    // For each task, check if this student has submitted
    const tasksWithStatus = await Promise.all(
      tasks.map(async (task) => {
        const submission = await TaskSubmission.findOne({
          task: task._id,
          student: req.user.id,
        });
        const now = new Date();
        return {
          ...task.toObject(),
          status: submission ? 'completed' : now > task.deadline ? 'overdue' : 'active',
          submission: submission || null,
        };
      })
    );

    // Summary counts for the task header (Active / Completed / High Priority)
    const active = tasksWithStatus.filter((t) => t.status === 'active').length;
    const completed = tasksWithStatus.filter((t) => t.status === 'completed').length;
    const highPriority = tasksWithStatus.filter(
      (t) => t.priority === 'high' && t.status === 'active'
    ).length;

    res.json({ summary: { active, completed, highPriority }, tasks: tasksWithStatus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ messageEng: 'Server error.' });
  }
};

// GET /tasks/student/:id — Get specific task details for student
export const getStudentTaskById = async (req, res) => {
  try {
    const student = await User.findById(req.user.id);

    const task = await Task.findOne({
      _id: req.params.id,
      assignedGroup: student.group,
    }).populate('teacher', 'name');

    if (!task) return res.status(404).json({ messageEng: 'Task not found.' });

    const submission = await TaskSubmission.findOne({
      task: task._id,
      student: req.user.id,
    });

    res.json({ task, submission: submission || null });
  } catch (err) {
    res.status(500).json({ messageEng: 'Server error.' });
  }
};

// PATCH /tasks/student/:id/complete — Submit PDF proof + mark task as complete
export const completeTask = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ messageEng: 'A PDF file is required to complete a task.' });
    }

    const student = await User.findById(req.user.id);
    const task = await Task.findOne({
      _id: req.params.id,
      assignedGroup: student.group,
    });

    if (!task) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ messageEng: 'Task not found.' });
    }

    // Check for existing submission (one attempt only)
    const existing = await TaskSubmission.findOne({ task: task._id, student: req.user.id });
    if (existing) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ messageEng: 'You have already completed this task.' });
    }

    const now = new Date();
    const isOnTime = now <= task.deadline;
    const coinsAwarded = isOnTime ? task.rewardCoins : 0;

    const submission = await TaskSubmission.create({
      task: task._id,
      student: req.user.id,
      filePath: req.file.path,
      fileName: req.file.originalname,
      submittedAt: now,
      isOnTime,
      coinsAwarded,
    });

    // Award coins if on time
    if (coinsAwarded > 0) {
      await User.findByIdAndUpdate(req.user.id, { $inc: { coins: coinsAwarded } });
    }

    res.json({
      messageEng: isOnTime
        ? `Task completed on time! You earned ${coinsAwarded} coins. 🎉`
        : 'Task submitted (late). No coins awarded this time.',
      coinsAwarded,
      submission,
    });
  } catch (err) {
    console.error(err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ messageEng: 'Server error.' });
  }
};
