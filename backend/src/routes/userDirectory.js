const express = require('express');
const router = express.Router();
const { User, Admin, QuizAttempt, EventRegistration } = require('../models');
const { Op } = require('sequelize');
const authMiddleware = require('../middleware/auth');

// ==========================================
// GET /api/admin/users — Paginated User Directory
// ==========================================
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(5, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const search = (req.query.search || '').trim().toLowerCase();
    const roleFilter = (req.query.role || 'all').trim();
    const statusFilter = (req.query.status || 'all').trim();

    const whereConditions = [];

    // Search condition across Name, Email, Username, College
    if (search) {
      whereConditions.push({
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { username: { [Op.iLike]: `%${search}%` } },
          { college: { [Op.iLike]: `%${search}%` } }
        ]
      });
    }

    // Role filter
    if (roleFilter && roleFilter !== 'all') {
      whereConditions.push({ role: roleFilter });
    }

    // Verification status filter
    if (statusFilter === 'verified') {
      whereConditions.push({ is_verified: true });
    } else if (statusFilter === 'pending') {
      whereConditions.push({ is_verified: false });
    }

    const whereClause = whereConditions.length > 0 ? { [Op.and]: whereConditions } : {};

    // Execute paginated query
    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'subject_id', 'name', 'email', 'username', 'college', 'role', 'is_verified', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // Calculate aggregate statistics
    const [totalUsers, totalVerified, totalStudents] = await Promise.all([
      User.count(),
      User.count({ where: { is_verified: true } }),
      User.count({ where: { role: 'student' } })
    ]);

    const totalPages = Math.ceil(count / limit) || 1;

    return res.json({
      success: true,
      users,
      pagination: {
        total: count,
        page,
        limit,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages
      },
      stats: {
        totalUsers,
        totalVerified,
        totalStudents,
        totalPending: totalUsers - totalVerified
      }
    });
  } catch (err) {
    console.error('Error fetching user directory:', err);
    return res.status(500).json({ error: 'Failed to fetch user directory: ' + err.message });
  }
});

// ==========================================
// DELETE /api/admin/users/:id — Delete Single User
// ==========================================
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'User ID is required.' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const userEmail = user.email;
    const userName = user.name;

    // Best-effort cleanup of associated attempts
    try {
      if (QuizAttempt) {
        await QuizAttempt.destroy({ where: { email: userEmail } }).catch(() => {});
      }
    } catch (e) {
      console.warn('Notice: associated attempt cleanup warning:', e.message);
    }

    // Delete the user record
    await user.destroy();

    return res.json({
      success: true,
      message: `User ${userName} (${userEmail}) has been deleted successfully.`
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    return res.status(500).json({ error: 'Failed to delete user: ' + err.message });
  }
});

// ==========================================
// POST /api/admin/users/bulk-delete — Bulk Delete Users
// ==========================================
router.post('/bulk-delete', authMiddleware, async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of user IDs to delete.' });
    }

    // Find users to clean up attempts
    const users = await User.findAll({
      where: { id: { [Op.in]: userIds } },
      attributes: ['id', 'email']
    });

    const emails = users.map(u => u.email).filter(Boolean);

    if (QuizAttempt && emails.length > 0) {
      await QuizAttempt.destroy({ where: { email: { [Op.in]: emails } } }).catch(() => {});
    }

    const deletedCount = await User.destroy({
      where: { id: { [Op.in]: userIds } }
    });

    return res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} user(s).`,
      deletedCount
    });
  } catch (err) {
    console.error('Error bulk deleting users:', err);
    return res.status(500).json({ error: 'Failed to bulk delete users: ' + err.message });
  }
});

module.exports = router;
