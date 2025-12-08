const express = require('express');
const router = express.Router();

const GetController = require('../controller/GetController');
const {protect} = require('../Middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Workspaces
 *   description: Workspace management endpoints
 */

// Apply authentication middleware to all routes
router.use(protect);

/**
 * @swagger
 * /workspaces/{workspaceId}/projects:
 *   get:
 *     summary: Get all projects in a workspace
 *     description: Retrieve all projects within a specific workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *     responses:
 *       200:
 *         description: List of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Workspace not found
 */
router.get('/:workspaceId/projects', GetController.getAllWorkspaces);

/**
 * @swagger
 * /workspaces/{workspaceId}/projects:
 *   post:
 *     summary: Create a new project in workspace
 *     description: Create a new project within a specific workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
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
 *                 example: New Project
 *               description:
 *                 type: string
 *                 example: Project description
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/:workspaceId/projects', GetController.createProject);

module.exports = router;