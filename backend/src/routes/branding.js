const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { BrandSettings } = require('../models');
const authMiddleware = require('../middleware/auth');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Always save as brand-logo with the original extension
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `brand-logo-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPG, SVG, and WebP images are allowed'));
    }
  }
});

// Helper: Get or create the singleton branding settings row
const getOrCreateSettings = async () => {
  let settings = await BrandSettings.findOne();
  if (!settings) {
    settings = await BrandSettings.create({});
  }
  return settings;
};

// ----------------------------------------------------
// GET /api/branding — Public (no auth needed so QR cards work)
// ----------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    return res.json(settings);
  } catch (error) {
    console.error('Fetch branding error:', error);
    return res.status(500).json({ error: 'Server error fetching branding settings' });
  }
});

// ----------------------------------------------------
// PUT /api/branding — Update text fields (auth required)
// ----------------------------------------------------
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { club_name, chapter_name, primary_color, footer_text, qr_logo_size } = req.body;
    const settings = await getOrCreateSettings();

    await settings.update({
      club_name: club_name !== undefined ? club_name : settings.club_name,
      chapter_name: chapter_name !== undefined ? chapter_name : settings.chapter_name,
      primary_color: primary_color !== undefined ? primary_color : settings.primary_color,
      footer_text: footer_text !== undefined ? footer_text : settings.footer_text,
      qr_logo_size: qr_logo_size !== undefined ? parseInt(qr_logo_size, 10) : settings.qr_logo_size
    });

    return res.json(settings);
  } catch (error) {
    console.error('Update branding error:', error);
    return res.status(500).json({ error: 'Server error updating branding settings' });
  }
});

// ----------------------------------------------------
// POST /api/branding/logo — Upload logo image (auth required)
// ----------------------------------------------------
router.post('/logo', authMiddleware, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Logo image file is required' });
    }

    const settings = await getOrCreateSettings();

    // Delete old logo file if one exists
    if (settings.logo_path) {
      const oldFilePath = path.join(__dirname, '..', '..', settings.logo_path);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Save new logo path (relative path for serving)
    const relativePath = `uploads/${req.file.filename}`;
    await settings.update({ logo_path: relativePath });

    return res.json({
      message: 'Logo uploaded successfully',
      logo_path: relativePath,
      settings
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    return res.status(500).json({ error: 'Server error uploading logo' });
  }
});

// ----------------------------------------------------
// DELETE /api/branding/logo — Remove uploaded logo (auth required)
// ----------------------------------------------------
router.delete('/logo', authMiddleware, async (req, res) => {
  try {
    const settings = await getOrCreateSettings();

    if (settings.logo_path) {
      const filePath = path.join(__dirname, '..', '..', settings.logo_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await settings.update({ logo_path: null });
    }

    return res.json({ message: 'Logo removed successfully', settings });
  } catch (error) {
    console.error('Delete logo error:', error);
    return res.status(500).json({ error: 'Server error removing logo' });
  }
});

module.exports = router;
