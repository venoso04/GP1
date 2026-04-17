import Task from '../../db/models/task.model.js';
import User from '../../db/models/user.model.js';

// POST /tasks — create a new task
export const createTask = async (req, res) => {
  try {
    const { name, taskType, title, location, deadline, priority } = req.body;

    if (!name || !taskType || !deadline) {
      return res.status(400).json({
        messageEng: 'name, taskType, and deadline are required',
        messageAr: 'الاسم ونوع المهمة والموعد النهائي مطلوبة',
      });
    }

    const task = await Task.create({
      student: req.user.id,
      name,
      taskType,
      title,
      location,
      deadline: new Date(deadline),
      priority: priority || 'medium',
    });

    return res.status(201).json({
      messageEng: 'Task created successfully',
      messageAr: 'تم إنشاء المهمة بنجاح',
      task,
    });
  } catch (error) {
    console.error('createTask error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /tasks — get all tasks for the logged-in student
export const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ student: req.user.id }).sort({ createdAt: -1 });

    const active = tasks.filter((t) => t.status === 'active').length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const highPriority = tasks.filter((t) => t.priority === 'high').length;

    return res.json({
      stats: { active, completed, highPriority },
      tasks,
    });
  } catch (error) {
    console.error('getMyTasks error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /tasks/:id — get a single task
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, student: req.user.id });

    if (!task) {
      return res.status(404).json({
        messageEng: 'Task not found',
        messageAr: 'المهمة غير موجودة',
      });
    }

    return res.json({ task });
  } catch (error) {
    console.error('getTaskById error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /tasks/:id/complete — mark task as complete and reward coins if on time
export const completeTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, student: req.user.id });

    if (!task) {
      return res.status(404).json({
        messageEng: 'Task not found',
        messageAr: 'المهمة غير موجودة',
      });
    }

    if (task.status === 'completed') {
      return res.status(400).json({
        messageEng: 'Task is already completed',
        messageAr: 'المهمة مكتملة بالفعل',
      });
    }

    const now = new Date();
    const completedOnTime = now <= new Date(task.deadline);

    task.status = 'completed';
    task.completedAt = now;
    task.rewardGranted = completedOnTime;
    await task.save();

    let coinsAwarded = 0;

    if (completedOnTime) {
      coinsAwarded = task.rewardCoins;
      await User.findByIdAndUpdate(req.user.id, { $inc: { coins: coinsAwarded } });
    }

    return res.json({
      messageEng: completedOnTime
        ? `Task completed on time! You earned ${coinsAwarded} coins.`
        : 'Task completed, but the deadline has passed. No coins awarded.',
      messageAr: completedOnTime
        ? `أحسنت! أنهيت المهمة في الوقت المحدد وحصلت على ${coinsAwarded} عملة`
        : 'تم إنهاء المهمة لكن انتهى الموعد النهائي، لم يتم منح عملات',
      completedOnTime,
      coinsAwarded,
      task,
    });
  } catch (error) {
    console.error('completeTask error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /tasks/:id — delete a task
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, student: req.user.id });

    if (!task) {
      return res.status(404).json({
        messageEng: 'Task not found',
        messageAr: 'المهمة غير موجودة',
      });
    }

    return res.json({
      messageEng: 'Task deleted successfully',
      messageAr: 'تم حذف المهمة بنجاح',
    });
  } catch (error) {
    console.error('deleteTask error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
