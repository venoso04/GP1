import User from '../../db/models/user.model.js';
import TaskSubmission from '../../db/models/taskSubmission.model.js';

// GET /rewards/my-coins — Student's coin balance + earning history
export const getMyCoins = async (req, res) => {
  try {
    const student = await User.findById(req.user.id).select('name coins');
    if (!student) return res.status(404).json({ messageEng: 'User not found.' });

    // Full coin-earning history from task submissions
    const history = await TaskSubmission.find({
      student: req.user.id,
      coinsAwarded: { $gt: 0 },
    })
      .populate('task', 'taskName taskTitle deadline')
      .sort({ submittedAt: -1 });

    const formatted = history.map((sub) => ({
      taskName: sub.task?.taskName,
      taskTitle: sub.task?.taskTitle,
      coinsAwarded: sub.coinsAwarded,
      submittedAt: sub.submittedAt,
      isOnTime: sub.isOnTime,
    }));

    res.json({
      totalCoins: student.coins,
      history: formatted,
    });
  } catch (err) {
    res.status(500).json({ messageEng: 'Server error.' });
  }
};
