// src/controller/Module4Controller.js
const mongoose = require('mongoose');

// Import Models
const Project = require('../models/Projects');
const Column = require('../models/Columns');
const Task = require('../models/Task');
const Activity = require('../models/Activities');
// Lưu ý: Đảm bảo tên file model Label đúng với file thực tế (Labels.js hoặc Lables.js)
const Label = require('../models/Labels'); 

const generateUUID = () => new mongoose.Types.UUID();

// --- HELPER: SO SÁNH ID AN TOÀN ---
const areIdsEqual = (id1, id2) => {
    if (!id1 || !id2) return false;
    return id1.toString() === id2.toString();
};

// Helper Authorization Check
const checkProjectAccess = (project, userId) => {
    if (!project) return false;
    
    // 1. Check Owner
    // ownerId có thể là Object User (nếu populate) hoặc UUID/String
    const ownerId = project.ownerId._id || project.ownerId;
    if (areIdsEqual(ownerId, userId)) return true;

    // 2. Check Member
    // members là mảng object [{ userId: ..., role: ... }]
    if (project.members && Array.isArray(project.members)) {
        return project.members.some(m => {
             const mId = m.userId._id || m.userId;
             return areIdsEqual(mId, userId);
        });
    }
    
    return false;
};

// 1. GET Project Board
exports.getProjectBoard = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user._id;

        // Fetch project info
        const project = await Project.findById(projectId)
            .select('members ownerId columnOrder name')
            .lean(); // Dùng lean() để lấy plain object, xử lý nhanh hơn

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        
        // Authorization Check
        if (!checkProjectAccess(project, userId)) {
            return res.status(403).json({ success: false, message: 'Access denied to this board.' });
        }

        // Fetch Columns
        const columns = await Column.find({ projectId }).sort({ createdAt: 1 }).lean();

        // Fetch Tasks
        const tasks = await Task.find({ projectId })
            .populate({ path: 'assignees', select: 'name avatarUrl' })
            .populate({ path: 'labels', select: 'text color' })
            .select('-description -checklists')
            .lean();

        // Map Tasks by ID for O(1) access
        const taskIdMap = tasks.reduce((acc, task) => {
            acc[task._id.toString()] = task;
            return acc;
        }, {});

        // Organize Columns with Tasks
        const boardColumns = columns.map(column => {
            // Map taskOrder IDs to actual Task Objects
            column.tasks = (column.taskOrder || [])
                .map(taskId => taskIdMap[taskId.toString()])
                .filter(task => task); // Remove nulls (deleted tasks)

            delete column.taskOrder; 
            return column;
        });
        
        res.status(200).json({
            success: true,
            data: {
                project: project,
                columns: boardColumns,
            },
        });
    } catch (error) {
        console.error('Error fetching project board:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// 2. POST Create Column
exports.createColumn = async (req, res) => {
    // ⚠️ Đã bỏ Transaction (Session) để chạy trên Standalone Mongo
    try {
        const { projectId } = req.params;
        const { title } = req.body;
        const userId = req.user._id;
        
        if (!title) {
            return res.status(400).json({ success: false, message: 'Column title is required.' });
        }

        const project = await Project.findById(projectId);
        
        if (!checkProjectAccess(project, userId)) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        const newColumnId = generateUUID();
        
        // 1. Create Column
        const newColumn = await Column.create({
            _id: newColumnId,
            title,
            projectId,
            taskOrder: [],
        });

        // 2. Update Project columnOrder
        await Project.findByIdAndUpdate(projectId, {
            $push: { columnOrder: newColumnId }
        });

        // 3. Log Activity
        await Activity.create({
            _id: generateUUID(),
            projectId: projectId,
            userId: userId,
            action: 'CREATED_COLUMN',
            details: { columnTitle: title },
        });

        res.status(201).json({
            success: true,
            message: 'Column created successfully.',
            data: newColumn,
        });

    } catch (error) {
        console.error('Error creating column:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// 3. PATCH Update Column
exports.updateColumn = async (req, res) => {
    try {
        const { columnId } = req.params;
        const { title } = req.body;
        const userId = req.user._id;

        const column = await Column.findById(columnId);
        if (!column) {
            return res.status(404).json({ success: false, message: 'Column not found.' });
        }
        
        const project = await Project.findById(column.projectId);
        
        if (!checkProjectAccess(project, userId)) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        if (!title) {
             return res.status(400).json({ success: false, message: 'No fields provided.' });
        }
        
        const updatedColumn = await Column.findByIdAndUpdate(
            columnId,
            { $set: { title: title } },
            { new: true, runValidators: true }
        );

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

// 4. DELETE Column
exports.deleteColumn = async (req, res) => {
    // ⚠️ Đã bỏ Transaction (Session)
    try {
        const { columnId } = req.params;
        const userId = req.user._id;

        const columnToDelete = await Column.findById(columnId);
        if (!columnToDelete) {
            return res.status(404).json({ success: false, message: 'Column not found.' });
        }
        
        const projectId = columnToDelete.projectId;
        const project = await Project.findById(projectId);
        
        if (!checkProjectAccess(project, userId)) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        // Logic: Chuyển task sang cột bên cạnh
        // columnOrder là mảng UUID, cần convert sang String để tìm index
        const columnOrderStr = project.columnOrder.map(id => id.toString());
        const columnIndex = columnOrderStr.indexOf(columnId.toString());
        
        // Tìm cột đích (trước hoặc sau cột hiện tại)
        let targetColumnId = null;
        if (columnIndex > 0) {
            targetColumnId = project.columnOrder[columnIndex - 1];
        } else if (columnIndex < project.columnOrder.length - 1) {
            targetColumnId = project.columnOrder[columnIndex + 1];
        }

        if (targetColumnId) {
            // Move tasks
            await Task.updateMany(
                { columnId: columnId },
                { $set: { columnId: targetColumnId } }
            );

            // Cập nhật taskOrder của cột đích (đưa task mới lên đầu)
            const tasksToMove = columnToDelete.taskOrder || [];
            if (tasksToMove.length > 0) {
                 await Column.findByIdAndUpdate(targetColumnId, {
                    $push: { taskOrder: { $each: tasksToMove, $position: 0 } }
                });
            }
        } else {
            // Không còn cột nào khác -> Xóa hết task
            await Task.deleteMany({ columnId: columnId });
        }

        // Xóa cột khỏi Project
        await Project.findByIdAndUpdate(projectId, {
            $pull: { columnOrder: columnId }
        });

        // Xóa cột
        await Column.deleteOne({ _id: columnId });

        // Log Activity
        await Activity.create({
            _id: generateUUID(),
            projectId: projectId,
            userId: userId,
            action: 'DELETED_COLUMN',
            details: { columnTitle: columnToDelete.title, tasksRelocated: !!targetColumnId },
        });

        res.status(200).json({
            success: true,
            message: `Column deleted.`,
        });

    } catch (error) {
        console.error('Error deleting column:', error);
        res.status(500).json({ success: false, message: 'Delete failed.', error: error.message });
    }
};