const express = require('express');
const router = express.Router();
const { sequelize, User, Admin, QuizAttempt, EventRegistration } = require('../models');
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

    const search = (req.query.search || '').trim();
    const roleFilter = (req.query.role || 'all').trim();
    const statusFilter = (req.query.status || 'all').trim();
    const sortBy = ['name', 'email', 'createdAt', 'is_verified', 'role'].includes(req.query.sortBy)
      ? req.query.sortBy
      : 'createdAt';
    const sortOrder = (req.query.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const whereConditions = [];
    const isPostgres = sequelize.getDialect() === 'postgres';
    const likeOp = isPostgres ? Op.iLike : Op.like;

    // Search condition across Name, Email, Username, College
    if (search) {
      whereConditions.push({
        [Op.or]: [
          { name: { [likeOp]: `%${search}%` } },
          { email: { [likeOp]: `%${search}%` } },
          { username: { [likeOp]: `%${search}%` } },
          { college: { [likeOp]: `%${search}%` } }
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
    } else if (statusFilter === 'pending' || statusFilter === 'unverified') {
      whereConditions.push({ is_verified: false });
    }

    const whereClause = whereConditions.length > 0 ? { [Op.and]: whereConditions } : {};

    // Execute paginated query
    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'subject_id', 'name', 'email', 'username', 'college', 'role', 'is_verified', 'createdAt', 'updatedAt'],
      order: [[sortBy, sortOrder]],
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
// PATCH /api/admin/users/:id/verify — Toggle or Set Verification
// ==========================================
router.patch('/:id/verify', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_verified } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    // Toggle if boolean not provided explicitly
    const nextStatus = typeof is_verified === 'boolean' ? is_verified : !user.is_verified;
    user.is_verified = nextStatus;
    if (nextStatus) {
      user.otp = null;
      user.otp_expiry = null;
    }
    await user.save();

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_verified: user.is_verified
      },
      message: `User ${user.name} is now ${user.is_verified ? 'verified' : 'unverified'}.`
    });
  } catch (err) {
    console.error('Error updating user verification:', err);
    return res.status(500).json({ error: 'Failed to update verification status: ' + err.message });
  }
});

// ==========================================
// POST /api/admin/users/bulk-verify — Bulk Verify or Unverify Users
// ==========================================
router.post('/bulk-verify', authMiddleware, async (req, res) => {
  try {
    const { userIds, verify = true } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of user IDs.' });
    }

    const [updatedCount] = await User.update(
      { is_verified: Boolean(verify) },
      { where: { id: { [Op.in]: userIds } } }
    );

    return res.json({
      success: true,
      updatedCount,
      message: `Successfully ${verify ? 'verified' : 'unverified'} ${updatedCount} user(s).`
    });
  } catch (err) {
    console.error('Error bulk updating verification:', err);
    return res.status(500).json({ error: 'Failed to update users: ' + err.message });
  }
});

// ==========================================
// PATCH /api/admin/users/:id/role — Update User Role
// ==========================================
router.patch('/:id/role', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['student', 'admin'].includes(role.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid role. Must be "student" or "admin".' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    user.role = role.toLowerCase();
    await user.save();

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      },
      message: `Role for ${user.name} updated to ${user.role.toUpperCase()}.`
    });
  } catch (err) {
    console.error('Error updating user role:', err);
    return res.status(500).json({ error: 'Failed to update user role: ' + err.message });
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
