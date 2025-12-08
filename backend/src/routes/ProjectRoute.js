const express = require('express');
const router = express.Router();
const GetController = require('../controller/GetController');
const Module4Controller = require('../controller/Module4Controller');
const {protect} = require('../Middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management endpoints
 */

// Apply authentication middleware to all routes
router.use(protect);

/**
 * @swagger
 * /projects/{projectId}:
 *   get:
 *     summary: Get project details
 *     description: Retrieve detailed information about a specific project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project not found
 */
router.get('/:projectId', GetController.getProjectDetail);

/**
 * @swagger
 * /projects/{projectId}/board:
 *   get:
 *     summary: Get project board
 *     description: Retrieve the Kanban board for a project with all columns and tasks
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project board with columns and tasks
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project not found
 */
router.get('/:projectId/board', Module4Controller.getProjectBoard);

/**
 * @swagger
 * /projects/{projectId}:
 *   patch:
 *     summary: Update project
 *     description: Update project information
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project not found
 */
router.patch('/:projectId', GetController.updateProject);

/**
 * @swagger
 * /projects/{projectId}:
 *   delete:
 *     summary: Delete project
 *     description: Delete a project permanently
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project not found
 */
router.delete('/:projectId', GetController.deleteProject);

/**
 * @swagger
 * /projects/{projectId}/members:
 *   post:
 *     summary: Add project members
 *     description: Add members to a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["userId1", "userId2"]
 *     responses:
 *       200:
 *         description: Members added successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/:projectId/members', GetController.addProjectMembers);

/**
 * @swagger
 * /projects/{projectId}/columns:
 *   post:
 *     summary: Create a new column
 *     description: Create a new column within a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: To Do
 *               order:
 *                 type: number
 *                 example: 1
 *     responses:
 *       201:
 *         description: Column created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/:projectId/columns', Module4Controller.createColumn);

module.exports = router;