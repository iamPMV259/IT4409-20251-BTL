const express = require('express');
const router = express.Router();

// Import các router con (Sub-routers)
const authRoutes = require('../routes/authRoutes'); 
const workspaceRoutes = require('../routes/WorkspaceRoutes'); 
const projectRoutes = require('../routes/ProjectRoute'); 
const ColumnsRoutes = require('../routes/ColumnsRoutes');

// 1. /auth
// Ví dụ: /api/v1/auth/login, /api/v1/auth/register
router.use('/auth', authRoutes);


router.use('/workspaces', workspaceRoutes);


router.use('/projects', projectRoutes);
router.use('/columns', ColumnsRoutes);


module.exports = router;