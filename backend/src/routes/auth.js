const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Admin } = require('../models');
const authMiddleware = require('../middleware/auth');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'msc_quiz_secret_key_2026';

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let admin = await Admin.findOne({ where: { email: cleanEmail } });
    if (!admin) {
      admin = await Admin.findOne({
        where: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('email')),
          cleanEmail
        )
      });
    }
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

// Verify Admin Token
router.get('/verify', authMiddleware, async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.user.id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin user not found' });
    }
    return res.json({
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Verify error:', error);
    return res.status(500).json({ error: 'Server error during verification' });
  }
});

module.exports = router;
