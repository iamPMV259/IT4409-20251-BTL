const mongoose = require('mongoose');

// Import Models (use actual filenames in project)
const Project = require('../models/Projects');
const Column = require('../models/Columns');
const Task = require('../models/Task');
const Activity = require('../models/Activities');
// Ensure Label model is registered (file is named `Lables.js` in this repo)
const Label = require('../models/Lables');

// Helper function to create a UUID
const generateUUID = () => new mongoose.Types.UUID();

// ----------------------------------------------------
// 1. GET /api/v1/projects/:projectId/board
// Endpoint chính cho Board View
// ----------------------------------------------------

/**
 * @desc Get the entire board structure (columns and nested tasks)
 * @route GET /api/v1/projects/:projectId/board
 * @access Private
 */
exports.getProjectBoard = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user._id;

        // 1. Authorization Check (Simple check, assumes project exists)
        const project = await Project.findById(projectId).select('members ownerId columnOrder');
        if (!project || (!project.members.includes(userId) && !project.ownerId.equals(userId))) {
            return res.status(403).json({ success: false, message: 'Access denied to this board.' });
        }

        // 2. Fetch all columns for the project
        const columns = await Column.find({ projectId }).sort({ createdAt: 1 }).lean(); // Use .lean() for faster, plain JavaScript objects

        // 3. Fetch all tasks for the project in one query
        const tasks = await Task.find({ projectId })
            .populate({ path: 'assignees', select: 'name avatarUrl' })
            .populate({ path: 'labels', select: 'text color' })
            .select('-description -checklists') // Exclude heavy fields for board view
            .lean();

        // 4. Organize tasks into a Map for fast lookup (Task ID -> Task Object)
        const taskIdMap = tasks.reduce((acc, task) => {
            acc[task._id.toString()] = task;
            return acc;
        }, {});

        // 5. Organize columns with their tasks according to taskOrder
        const boardColumns = columns.map(column => {
            column.tasks = column.taskOrder
                .map(taskId => taskIdMap[taskId.toString()])
                .filter(task => task); // Filter out tasks that might be missing (deleted)

            // Clean up the taskOrder array which is now redundant in the response
            delete column.taskOrder; 
            return column;
        });
        
        // 6. Send the structured response
        res.status(200).json({
            success: true,
            data: {
                project: project, // project info (including columnOrder if needed)
                columns: boardColumns,
            },
        });
    } catch (error) {
        console.error('Error fetching project board:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// ----------------------------------------------------
// 2. POST /api/v1/projects/:projectId/columns
// Tạo một cột (list) mới trong board.
// ----------------------------------------------------

/**
 * @desc Create a new column in the project board
 * @route POST /api/v1/projects/:projectId/columns
 * @access Private
 */
exports.createColumn = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { projectId } = req.params;
        const { title } = req.body;
        const userId = req.user._id;
        
        if (!title) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Column title is required.' });
        }

        // 1. Authorization Check (Must be a member)
        const project = await Project.findById(projectId).session(session);
        if (!project || (!project.members.includes(userId) && !project.ownerId.equals(userId))) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'Access denied. Must be a project member.' });
        }

        // 2. Create the new Column
        const newColumnId = generateUUID();
        const newColumn = await Column.create([{
            _id: newColumnId,
            title,
            projectId,
            taskOrder: [],
        }], { session });

        // 3. Update Project's columnOrder (add the new column ID to the end)
        await Project.findByIdAndUpdate(projectId, {
            $push: { columnOrder: newColumnId }
        }, { new: false, session });

        // 4. Log Activity
        await Activity.create([{
            _id: generateUUID(),
            projectId: projectId,
            userId: userId,
            action: 'CREATED_COLUMN',
            details: { columnTitle: title },
        }], { session });

        await session.commitTransaction();
        session.endSession();

        // 5. Send the created column
        res.status(201).json({
            success: true,
            message: 'Column created successfully.',
            data: newColumn[0],
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error creating column:', error);
        res.status(500).json({ success: false, message: 'Server Error during column creation.' });
    }
};

// ----------------------------------------------------
// 3. PATCH /api/v1/columns/:columnId
// Cập nhật một cột (ví dụ: đổi tên).
// ----------------------------------------------------

/**
 * @desc Update a column's details (e.g., title)
 * @route PATCH /api/v1/columns/:columnId
 * @access Private
 */
exports.updateColumn = async (req, res) => {
    try {
        const { columnId } = req.params;
        const { title } = req.body;
        const userId = req.user._id;

        // 1. Find Column and Project ID
        const column = await Column.findById(columnId);
        if (!column) {
            return res.status(404).json({ success: false, message: 'Column not found.' });
        }
        
        // 2. Authorization Check (Ensure user is member of the associated project)
        const project = await Project.findById(column.projectId);
        if (!project || (!project.members.includes(userId) && !project.ownerId.equals(userId))) {
            return res.status(403).json({ success: false, message: 'Access denied. Must be a project member.' });
        }

        // 3. Update the Column
        if (!title) {
             return res.status(400).json({ success: false, message: 'No fields provided for update.' });
        }
        
        const updatedColumn = await Column.findByIdAndUpdate(
            columnId,
            { $set: { title: title } },
            { new: true, runValidators: true }
        );

        // 4. Log Activity
        await Activity.create({
            _id: generateUUID(),
            projectId: column.projectId,
            userId: userId,
            action: 'UPDATED_COLUMN_TITLE',
            details: { oldTitle: column.title, newTitle: title },
        });

        res.status(200).json({
            success: true,
            message: 'Column updated successfully.',
            data: updatedColumn,
        });

    } catch (error) {
        console.error('Error updating column:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// ----------------------------------------------------
// 4. DELETE /api/v1/columns/:columnId
// Xóa một cột.
// ----------------------------------------------------

/**
 * @desc Delete a column and move its tasks to the next column
 * @route DELETE /api/v1/columns/:columnId
 * @access Private
 */
exports.deleteColumn = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { columnId } = req.params;
        const userId = req.user._id;

        // 1. Fetch Column and Project
        const columnToDelete = await Column.findById(columnId).session(session);
        if (!columnToDelete) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Column not found.' });
        }
        const projectId = columnToDelete.projectId;
        
        const project = await Project.findById(projectId).session(session);
        if (!project || (!project.members.includes(userId) && !project.ownerId.equals(userId))) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'Access denied. Must be a project member.' });
        }

        // 2. Identify the target column for tasks
        const columnIndex = project.columnOrder.findIndex(id => id.equals(columnId));
        const targetColumnId = project.columnOrder[columnIndex + 1] || project.columnOrder[columnIndex - 1]; 

        // 3. Move/Delete tasks
        if (targetColumnId) {
            // Move tasks to the next/previous column
            await Task.updateMany(
                { columnId: columnId },
                { $set: { columnId: targetColumnId } },
                { session }
            );

            // Add moved tasks to the beginning of the target column's taskOrder
            const tasksToMove = columnToDelete.taskOrder;
            if (tasksToMove.length > 0) {
                 await Column.findByIdAndUpdate(targetColumnId, {
                    $push: { taskOrder: { $each: tasksToMove, $position: 0 } }
                }, { session });
            }

        } else {
            // No other columns exist, delete all tasks in this column directly
            await Task.deleteMany({ columnId: columnId }, { session });
        }

        // 4. Remove column ID from Project's columnOrder
        await Project.findByIdAndUpdate(projectId, {
            $pull: { columnOrder: columnId }
        }, { new: false, session });

        // 5. Delete the Column itself
        await Column.deleteOne({ _id: columnId }, { session });

        // 6. Log Activity
        await Activity.create([{
            _id: generateUUID(),
            projectId: projectId,
            userId: userId,
            action: 'DELETED_COLUMN',
            details: { columnTitle: columnToDelete.title, tasksRelocated: !!targetColumnId },
        }], { session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: `Column '${columnToDelete.title}' deleted and its tasks were handled successfully.`,
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error deleting column:', error);
        res.status(500).json({ success: false, message: 'Transaction failed during column deletion.' });
    }
};