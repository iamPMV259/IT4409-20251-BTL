const express = require('express');
const router = express.Router();

const GetController = require('../controller/GetController');
const {protect} = require('../Middleware/authMiddleware')
// dùng middleware để bảo vệ api
router.use(protect)

router.get('/:workspaceId/projects',GetController.getAllWorkspaces)
    
router.post('/:workspaceId/projects',GetController.createProject)

module.exports = router;
