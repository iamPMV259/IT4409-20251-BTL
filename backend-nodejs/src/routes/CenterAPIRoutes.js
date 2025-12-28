const express = require('express');
const router = express.Router();

const authRoutes = require('../routes/authRoutes'); 
const workspaceRoutes = require('../routes/WorkspaceRoutes'); 
const projectRoutes = require('../routes/ProjectRoute'); 
const ColumnsRoutes = require('../routes/ColumnsRoutes');

router.use('/auth', authRoutes);


router.use('/workspaces', workspaceRoutes);


router.use('/projects', projectRoutes);
router.use('/columns', ColumnsRoutes);


module.exports = router;