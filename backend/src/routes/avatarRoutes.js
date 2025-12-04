/**
 * Avatar Routes
 * 
 * Why: Serve avatar images from backend
 * How: Provides static file serving for avatar images
 * Impact: Centralized avatar management with better error handling
 * 
 * Routes:
 * GET /api/avatars/:filename - Get avatar image
 * GET /api/avatars - List available avatars
 */

const express = require('express')
const path = require('path')
const fs = require('fs')
const router = express.Router()

/**
 * CORS middleware for avatar routes
 * Why: Allow frontend to load avatar images from backend
 * How: Sets CORS headers for image requests
 * Impact: Frontend can display avatars without CORS errors
 */
const cors = require('cors')
const avatarCors = cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: false,
  methods: ['GET'],
  allowedHeaders: ['Content-Type'],
})

/**
 * Avatar directory path
 * Why: Define where avatar images are stored
 * How: Points to public/avatars directory
 * Impact: Centralized avatar storage location
 */
const AVATAR_DIR = path.join(__dirname, '../../public/avatars')

/**
 * Ensure avatar directory exists
 * Why: Create directory if it doesn't exist
 * How: Creates directory recursively
 * Impact: Prevents errors if directory is missing
 */
if (!fs.existsSync(AVATAR_DIR)) {
  fs.mkdirSync(AVATAR_DIR, { recursive: true })
}

/**
 * Handle OPTIONS request for CORS preflight
 * Why: Allow browser to check CORS permissions
 * How: Responds to OPTIONS request with CORS headers
 * Impact: Enables CORS for image requests
 */
router.options('/:filename', avatarCors, (req, res) => {
  res.sendStatus(200)
})

/**
 * Get avatar image
 * GET /api/avatars/:filename
 * Why: Serve avatar images to frontend
 * How: Reads file from avatar directory and sends as image
 * Impact: Frontend can display user avatars
 * 
 * Common Errors:
 * 1. 404 - Avatar file not found
 * 2. 400 - Invalid filename (security check)
 */
router.get('/:filename', avatarCors, (req, res, next) => {
  try {
    const filename = req.params.filename

    // Security check: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename',
      })
    }

    // Allowed avatar filenames (for security)
    const allowedAvatars = [
      'avatar_1.jpg', 'avatar_2.jpg', 'avatar_3.jpg', 'avatar_4.jpg', 'avatar_5.jpg',
      'avatar_6.jpg', 'avatar_7.jpg', 'avatar_8.jpg', 'avatar_9.jpg', 'avatar_10.jpg',
      'avatar_11.jpg', 'avatar_12.jpg', 'avatar_13.jpg', 'avatar_14.jpg', 'avatar_15.jpg',
      'avatar_16.jpg', 'avatar_17.jpg', 'avatar_18.jpg',
    ]

    if (!allowedAvatars.includes(filename)) {
      return res.status(404).json({
        success: false,
        message: 'Avatar not found',
      })
    }

    const filePath = path.join(AVATAR_DIR, filename)

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Avatar file not found',
      })
    }

    // Set CORS headers explicitly for image requests
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    res.setHeader('Access-Control-Allow-Origin', frontendUrl)
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Access-Control-Allow-Credentials', 'false')
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    
    // Set content type and cache headers
    res.type('image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=31536000') // Cache for 1 year
    
    // Send file
    res.sendFile(filePath)
  } catch (error) {
    next(error)
  }
})

/**
 * List available avatars
 * GET /api/avatars
 * Why: Provide list of available avatars to frontend
 * How: Reads avatar directory and returns list
 * Impact: Frontend can display all available avatars
 */
router.get('/', avatarCors, (req, res, next) => {
  try {
    const avatars = [
      { id: 'avatar_1', name: 'Hero', filename: 'avatar_1.jpg', url: '/api/avatars/avatar_1.jpg' },
      { id: 'avatar_2', name: 'Warrior', filename: 'avatar_2.jpg', url: '/api/avatars/avatar_2.jpg' },
      { id: 'avatar_3', name: 'Ninja', filename: 'avatar_3.jpg', url: '/api/avatars/avatar_3.jpg' },
      { id: 'avatar_4', name: 'Samurai', filename: 'avatar_4.jpg', url: '/api/avatars/avatar_4.jpg' },
      { id: 'avatar_5', name: 'Mage', filename: 'avatar_5.jpg', url: '/api/avatars/avatar_5.jpg' },
      { id: 'avatar_6', name: 'Knight', filename: 'avatar_6.jpg', url: '/api/avatars/avatar_6.jpg' },
      { id: 'avatar_7', name: 'Ranger', filename: 'avatar_7.jpg', url: '/api/avatars/avatar_7.jpg' },
      { id: 'avatar_8', name: 'Rogue', filename: 'avatar_8.jpg', url: '/api/avatars/avatar_8.jpg' },
      { id: 'avatar_9', name: 'Paladin', filename: 'avatar_9.jpg', url: '/api/avatars/avatar_9.jpg' },
      { id: 'avatar_10', name: 'Bard', filename: 'avatar_10.jpg', url: '/api/avatars/avatar_10.jpg' },
      { id: 'avatar_11', name: 'Monk', filename: 'avatar_11.jpg', url: '/api/avatars/avatar_11.jpg' },
      { id: 'avatar_12', name: 'Druid', filename: 'avatar_12.jpg', url: '/api/avatars/avatar_12.jpg' },
      { id: 'avatar_13', name: 'Princess', filename: 'avatar_13.jpg', url: '/api/avatars/avatar_13.jpg' },
      { id: 'avatar_14', name: 'Valkyrie', filename: 'avatar_14.jpg', url: '/api/avatars/avatar_14.jpg' },
      { id: 'avatar_15', name: 'Enchantress', filename: 'avatar_15.jpg', url: '/api/avatars/avatar_15.jpg' },
      { id: 'avatar_16', name: 'Archer', filename: 'avatar_16.jpg', url: '/api/avatars/avatar_16.jpg' },
      { id: 'avatar_17', name: 'Priestess', filename: 'avatar_17.jpg', url: '/api/avatars/avatar_17.jpg' },
      { id: 'avatar_18', name: 'Ranger', filename: 'avatar_18.jpg', url: '/api/avatars/avatar_18.jpg' },
    ]

    res.json({
      success: true,
      data: {
        avatars,
      },
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router

