const express = require ('express');
const router = express.Router();
const GetController = require('../controller/GetController');
const Module4Controller = require('../controller/Module4Controller');
const {protect} = require('../Middleware/authMiddleware')
// dùng middleware để bảo vệ api
router.use(protect);
router.get('/:projectId', GetController.getProjectDetail);
router.get('/:projectId/board', Module4Controller.getProjectBoard);
router.patch('/:projectId', GetController.updateProject);
router.delete('/:projectId',GetController.deleteProject);
router.post('/:projectId/members',GetController.addProjectMembers);
// Create a new column within a project
router.post('/:projectId/columns', Module4Controller.createColumn);

module.exports = router;
