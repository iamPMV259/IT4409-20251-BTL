const express = require('express');
const router = express.Router();
const Module4Controller = require('../controller/Module4Controller');
const {protect} = require('../Middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Columns
 *   description: Column management endpoints
 */

// Apply authentication middleware to all routes
router.use(protect);

/**
 * @swagger
 * /columns/{columnId}:
 *   patch:
 *     summary: Update column
 *     description: Update column information (name, order, etc.)
 *     tags: [Columns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: columnId
 *         required: true
 *         schema:
 *           type: string
 *         description: Column ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: In Progress
 *               order:
 *                 type: number
 *                 example: 2
 *     responses:
 *       200:
 *         description: Column updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Column not found
 */
router.patch('/:columnId', Module4Controller.updateColumn);

/**
 * @swagger
 * /columns/{columnId}:
 *   delete:
 *     summary: Delete column
 *     description: Delete a column permanently
 *     tags: [Columns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: columnId
 *         required: true
 *         schema:
 *           type: string
 *         description: Column ID
 *     responses:
 *       200:
 *         description: Column deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Column not found
 */
router.delete('/:columnId', Module4Controller.deleteColumn);

module.exports = router;