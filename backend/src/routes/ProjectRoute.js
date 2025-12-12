// src/routes/ProjectRoute.js
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
 *     - bearerAuth: []
 *     parameters:
 *     - in: path
 *       name: projectId
 *       required: true
 *       schema:
 *         type: string
 *       description: Project ID
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
 *     - bearerAuth: []
 *     parameters:
 *     - in: path
 *       name: projectId
 *       required: true
 *       schema:
 *         type: string
 *       description: Project ID
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
 *     summary: Update project details
 *     description: Update project metadata. Only the project owner can perform this action.
 *     tags: [Projects]
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: path
 *       name: projectId
 *       required: true
 *       schema:
 *         type: string
 *       description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "New Project Name"
 *               description:
 *                 type: string
 *                 example: "Updated description"
 *               status:
 *                 type: string
 *                 enum: [active, on-hold, completed]
 *                 example: "completed"
 *               deadline:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-12-31T23:59:59.000Z"
 *               ownerId:
 *                 type: string
 *                 description: "UUID of the new owner (Transfer ownership)"
 *                 example: "58f026e6-e184-4cff-bcb4-3102e6599afa"
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       400:
 *         description: Invalid input or status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not the owner)
 *       404:
 *         description: Project or New Owner not found
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
 *               - newMemberEmails
 *             properties:
 *               newMemberEmails:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *                   example: ["user1@example.com", "user2@example.com"]
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
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: To Do
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