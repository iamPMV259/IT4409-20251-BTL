// src/controller/GetController.js
const mongoose = require('mongoose');
const Workspace = require('../models/Workspace');
const Project = require('../models/Projects');
const User = require('../models/User');
const Column = require('../models/Columns');
const Task = require('../models/Task');
const Activity = require('../models/Activities');
const SocketService = require('../services/SocketService');

const generateUUID = () => new mongoose.Types.UUID();

const areIdsEqual = (id1, id2) => {
    if (!id1 || !id2) return false;
    return id1.toString() === id2.toString();
};

/**
 * @desc Get all projects in a workspace
 * @route GET /api/v1/workspaces/:workspaceId/projects
 */
const getAllWorkspaces = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const userId = req.user._id;

        const workspace = await Workspace.findById(workspaceId);

        if (!workspace) {
            return res.status(404).json({ success: false, message: 'Workspace not found' });
        }

        const isMember = workspace.members.some(m => areIdsEqual(m.userId, userId));
        const isOwner = areIdsEqual(workspace.ownerId, userId);

        if (!isMember && !isOwner) {
            return res.status(403).json({ success: false, message: 'Not authorized to access this workspace' });
        }

        const projects = await Project.find({ workspaceId: workspaceId })
            .select('-columnOrder')
            .populate({
                path: 'ownerId',
                select: 'name avatarUrl'
            })
            .sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            count: projects.length,
            data: projects,
        });
    } catch (error) {
        console.error('Error fetching workspace projects:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

/**
 * @desc Create a new project
 * @route POST /api/v1/workspaces/:workspaceId/projects
 */
const createProject = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { name, description, members, deadline } = req.body;
        const userId = req.user._id;
        
        const workspace = await Workspace.findById(workspaceId);
        
        if (!workspace || !areIdsEqual(workspace.ownerId, userId)) {
            return res.status(403).json({ success: false, message: "Only workspace owners can create new projects" });
        }
        
        const memberData = [
            { userId: userId, role: 'owner' }
        ];

        if (members && Array.isArray(members)) {
            members.forEach(mId => {
                if (!areIdsEqual(mId, userId)) {
                    memberData.push({ userId: mId, role: 'member' });
                }
            });
        }

        const projectId = generateUUID();
        const newProject = await Project.create({
            _id: projectId,
            name,
            description,
            workspaceId,
            ownerId: userId,
            members: memberData,
            taskStats: { open: 0, closed: 0 },
            deadline: deadline ? new Date(deadline) : undefined 
        });
        
        const defaultColumns = ['To Do', 'In Progress', 'Review', 'Done'];
        const columnIds = [];
        const createdColumns = [];
        
        for (const title of defaultColumns) {
            const columnId = generateUUID();
            const column = await Column.create({
                _id: columnId,
                title: title,
                projectId: projectId,
                taskOrder: [],
            });
            columnIds.push(columnId);
            createdColumns.push(column);
        }
        
        await Project.findByIdAndUpdate(projectId, {
            columnOrder: columnIds,
        }, { new: true });
        
        res.status(201).json({
            success: true,
            message: 'Project created and initialized successfully',
            data: {
                ...newProject.toObject(),
                columnOrder: columnIds,
            },
            initalColumns: createdColumns.map(c => c.toObject()),
        });

    } catch (error) {
        console.error('Error creating project:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Server Error during project creation' });
    }
};

/**
 * @desc Get project details
 * @route GET /api/v1/projects/:projectId
 */
const getProjectDetail = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user._id;

        const project = await Project.findById(projectId)
            .populate({ path: 'ownerId', select: 'name email avatarUrl' })
            .populate({ path: 'members.userId', select: 'name email avatarUrl' });

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const ownerId = project.ownerId._id || project.ownerId;
        const isOwner = areIdsEqual(ownerId, userId);

        const isMember = project.members.some(m => {
            const mId = m.userId._id || m.userId; 
            return areIdsEqual(mId, userId);
        });
        
        if (!isMember && !isOwner) {
            return res.status(403).json({ success: false, message: 'Access denied. User is not a member of this project' });
        }

        res.status(200).json({
            success: true,
            data: project,
        });

    } catch (error) {
        console.error('Error fetching project details:', error);
        res.status(500).json({ success: false, message: 'Server error at project details', error: error.message });
    }
}

/**
 * @desc Update project information
 * @route PATCH /api/v1/projects/:projectId
 */
const updateProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { name, description, status, deadline, ownerId } = req.body;
        const userId = req.user._id;

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }

        if (!areIdsEqual(project.ownerId, userId)) {
            return res.status(403).json({ success: false, message: 'Only the project owner can update project details.' });
        }

        const updateFields = {};
        
        if (name) updateFields.name = name.trim();
        if (description !== undefined) updateFields.description = description; 
        if (status) {
            const validStatuses = ['active', 'on-hold', 'completed'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ success: false, message: 'Invalid status' });
            }
            updateFields.status = status;
        }
        if (deadline) {
            updateFields.deadline = new Date(deadline);
        }
        
        if (ownerId && !areIdsEqual(ownerId, project.ownerId)) {
            const newOwner = await User.findById(ownerId);
            if (!newOwner) {
                return res.status(404).json({ success: false, message: 'New owner user not found.' });
            }
            updateFields.ownerId = ownerId;
        }

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields provided for update.' });
        }

        const updatedProject = await Project.findByIdAndUpdate(
            projectId,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).populate({ path: 'ownerId', select: 'name email avatarUrl' });

        try {
            SocketService.getIO().to(projectId).emit('server:project_updated', {
                event: 'server:project_updated',
                data: {
                    projectId: updatedProject._id.toString(),
                    name: updatedProject.name,
                    description: updatedProject.description,
                    status: updatedProject.status,
                    updatedAt: updatedProject.updatedAt,
                    deadline: updatedProject.deadline
                }
            });
        } catch (socketError) {
            console.error("Socket emit error:", socketError.message);
        }

        res.status(200).json({
            success: true,
            message: 'Project updated successfully.',
            data: updatedProject,
        });
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(400).json({ success: false, message: error.message });
    }
}

/**
 * @desc Delete a project and all related data
 * @route DELETE /api/v1/projects/:projectId
 */
const deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user._id;

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found.' });
        }

        if (!areIdsEqual(project.ownerId, userId)) {
            return res.status(403).json({ success: false, message: 'Only the project owner can delete the project.' });
        }

        await Column.deleteMany({ projectId });
        await Task.deleteMany({ projectId });
        await Activity.deleteMany({ projectId });
        
        await Project.deleteOne({ _id: projectId });

        res.status(200).json({
            success: true,
            message: 'Project and all related data deleted successfully.',
        });

    } catch (error) {
        console.error('Error during project deletion:', error);
        res.status(500).json({ success: false, message: 'Delete failed.', error: error.message });
    }
};

/**
 * @desc Add members to a project
 * @route POST /api/v1/projects/:projectId/members
 */
const addProjectMembers = async (req, res) => {
    try {
        const { projectId } = req.params;
        let { newMemberEmails } = req.body; 
        const inviterId = req.user._id;

        if (!newMemberEmails || !Array.isArray(newMemberEmails)) {
            return res.status(400).json({ success: false, message: 'Must provide a list of new member emails.' });
        }

        newMemberEmails = newMemberEmails.flat();

        if (newMemberEmails.length === 0) {
            return res.status(400).json({ success: false, message: 'Email list cannot be empty.' });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found.' });
        }

        const isMember = project.members.some(m => areIdsEqual(m.userId, inviterId));
        const isOwner = areIdsEqual(project.ownerId, inviterId);

        if (!isMember && !isOwner) {
            return res.status(403).json({ success: false, message: 'Not authorized to add members.' });
        }

        const usersToAdd = await User.find({ email: { $in: newMemberEmails } });

        const foundEmails = usersToAdd.map(u => u.email);
        const notFoundEmails = newMemberEmails.filter(email => !foundEmails.includes(email));

        if (notFoundEmails.length > 0) {
            return res.status(404).json({ 
                success: false, 
                message: `The following users were not found: ${notFoundEmails.join(', ')}`,
                notFoundEmails: notFoundEmails
            });
        }

        const newMemberObjects = [];
        const addedUsersInfo = [];

        const currentMemberIds = project.members.map(m => m.userId.toString());
        if (project.ownerId) currentMemberIds.push(project.ownerId.toString());

        usersToAdd.forEach(user => {
            if (!currentMemberIds.includes(user._id.toString())) {
                newMemberObjects.push({ userId: user._id, role: 'member' });
                addedUsersInfo.push({ id: user._id, name: user.name, email: user.email });
            }
        });

        if (newMemberObjects.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'All provided users are already members of this project.',
                data: project,
            });
        }

        const updatedProject = await Project.findByIdAndUpdate(
            projectId,
            { $push: { members: { $each: newMemberObjects } } },
            { new: true, runValidators: true }
        ).populate({ path: 'members.userId', select: 'name email avatarUrl' });

        res.status(200).json({
            success: true,
            message: `${newMemberObjects.length} new members added successfully.`,
            data: updatedProject,
            newlyAddedUsers: addedUsersInfo,
        });

    } catch (error) {
        console.error('Error adding project members:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

/**
 * @desc Get project details
 * @route GET /api/v1/projects/:projectId
 */
const getProjectDashboard = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user._id;

        const project = await Project.findById(projectId)
            .populate({ path: 'ownerId', select: 'name email avatarUrl' })
            .populate({ path: 'members.userId', select: 'name email avatarUrl' });

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const ownerId = project.ownerId._id || project.ownerId;
        const isOwner = areIdsEqual(ownerId, userId);

        const isMember = project.members.some(m => {
            const mId = m.userId._id || m.userId; 
            return areIdsEqual(mId, userId);
        });
        
        if (!isMember && !isOwner) {
            return res.status(403).json({ success: false, message: 'Access denied. User is not a member of this project' });
        }

        project_dashboard = {};
        tasks = await Task.find({ projectId: projectId });
        totalTasks = tasks.length;
        to_do_tasks = 0
        in_progress_tasks = 0
        done_tasks = 0
        review_tasks = 0
        overdue_tasks = 0
        overdue_task_lists = []
        upcoming_deadlines_7d = []
        team_workload = {}

        for (const task of tasks) {
            const column = await Column.findById(task.columnId);
            if (column.title === 'To Do') to_do_tasks += 1;
            else if (column.title === 'In Progress') in_progress_tasks += 1;
            else if (column.title === 'Done') done_tasks += 1;
            else if (column.title === 'Review') review_tasks += 1;

            if (task.dueDate && task.dueDate < new Date() && task.status !== 'completed') {
                overdue_tasks += 1;
                overdue_task_lists.push({
                    taskId: task._id.toString(),
                    taskTitle: task.title,
                    taskDescription: task.description ? task.description : null,
                    dueDate: task.dueDate ? task.dueDate : null,
                });
            }
            if (task.dueDate && task.dueDate >= new Date() && task.dueDate <= new Date(Date.now() + 7*24*60*60*1000)) {
                upcoming_deadlines_7d.push({
                    taskId: task._id.toString(),
                    taskTitle: task.title,
                    taskDescription: task.description ? task.description : null,
                    dueDate: task.dueDate ? task.dueDate : null,
                });
            }
            for (const assigneeId of task.assignees) {
                const assigneeIdStr = assigneeId.toString();
                if (!team_workload[assigneeIdStr]) {
                    team_workload[assigneeIdStr] = 0;
                }
                team_workload[assigneeIdStr] += 1;
            }
        };

        team_workload_list = [];
        for (const [assigneeId, taskCount] of Object.entries(team_workload)) {
            const user = await User.findById(assigneeId).select('name email avatarUrl');
            team_workload_list.push({
                userId: assigneeId.toString(),
                userName: user ? user.name : 'Unknown User',
                taskCount: taskCount
            });
        }

        completion_rate = totalTasks === 0 ? 0 : (done_tasks / totalTasks) * 100;

        project_dashboard = {
            totalTasks,
            to_do_tasks,
            in_progress_tasks,
            done_tasks,
            review_tasks,
            overdue_tasks,
            overdue_task_lists,
            upcoming_deadlines_7d,
            completion_rate,
            team_workload_list
        }



        res.status(200).json({
            success: true,
            data: project_dashboard,
        });

    } catch (error) {
        console.error('Error fetching project details:', error);
        res.status(500).json({ success: false, message: 'Server error at project details', error: error.message });
    }
}

module.exports = {
    getAllWorkspaces,
    createProject,
    getProjectDetail,
    updateProject,
    deleteProject,
    addProjectMembers,
    getProjectDashboard,
};