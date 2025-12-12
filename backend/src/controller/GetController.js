// src/controller/GetController.js
const mongoose = require('mongoose');
const Workspace = require('../models/Workspace');
const Project = require('../models/Projects');
const User = require('../models/User');
const Column = require('../models/Columns');
const Task = require('../models/Task');
const Activity = require('../models/Activities');

const generateUUID = () => new mongoose.Types.UUID();

// --- HELPER: SO SÁNH ID AN TOÀN ---
const areIdsEqual = (id1, id2) => {
    if (!id1 || !id2) return false;
    return id1.toString() === id2.toString();
};

const getAllWorkspaces = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const userId = req.user._id;

        const workspace = await Workspace.findById(workspaceId);

        if (!workspace) {
            return res.status(404).json({ success: false, message: 'Workspace not found' });
        }

        // Check Membership
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

const createProject = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { name, description, members, deadline } = req.body;
        const userId = req.user._id;
        
        const workspace = await Workspace.findById(workspaceId);
        
        if (!workspace || !areIdsEqual(workspace.ownerId, userId)) {
            return res.status(403).json({ success: false, message: "Only workspace owners can create new projects" });
        }
        
        // 1. Prepare Members Data
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

        // 2. Create Project
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
        
        // 3. Initialize default columns
        const defaultColumns = ['To Do', 'In Progress', 'Done'];
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
        
        // 4. Update Project with column order
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

        // Check Authorization
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

const deleteProject = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { projectId } = req.params;
        const userId = req.user._id;

        const project = await Project.findById(projectId).session(session);

        if (!project) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: 'Project not found.' });
        }

        if (!areIdsEqual(project.ownerId, userId)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ success: false, message: 'Only the project owner can delete the project.' });
        }

        await Column.deleteMany({ projectId }, { session });
        await Task.deleteMany({ projectId }, { session });
        await Activity.deleteMany({ projectId }, { session });
        
        await Project.deleteOne({ _id: projectId }, { session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: 'Project and all related data deleted successfully.',
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error during project deletion transaction:', error);
        res.status(500).json({ success: false, message: 'Transaction failed.' });
    }
};

const addProjectMembers = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { newMemberEmails } = req.body;
        const inviterId = req.user._id;

        if (!newMemberEmails || !Array.isArray(newMemberEmails) || newMemberEmails.length === 0) {
            return res.status(400).json({ success: false, message: 'Must provide a list of new member emails.' });
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

        if (usersToAdd.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No users found with the provided emails.',
                notFoundEmails: newMemberEmails
            });
        }

        const newMemberObjects = [];
        const addedUsersInfo = [];

        const currentMemberIds = project.members.map(m => m.userId.toString());

        usersToAdd.forEach(user => {
            if (!currentMemberIds.includes(user._id.toString())) {
                newMemberObjects.push({ userId: user._id, role: 'member' });
                addedUsersInfo.push({ id: user._id, name: user.name, email: user.email });
            }
        });

        if (newMemberObjects.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'All provided users are already members.',
                data: project,
            });
        }

        const updatedProject = await Project.findByIdAndUpdate(
            projectId,
            { $push: { members: { $each: newMemberObjects } } },
            { new: true, runValidators: true }
        );

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

module.exports = {
    getAllWorkspaces,
    createProject,
    getProjectDetail,
    updateProject,
    deleteProject,
    addProjectMembers,
};