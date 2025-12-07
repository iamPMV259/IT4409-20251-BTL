const express = require('express')
const mongoose = require('mongoose');
const Workspace = require('../models/Workspace');
const Project = require('../models/Projects');
const User = require('../models/User');
const Column = require('../models/Columns');
const Task = require('../models/Task');
const Activity = require('../models/Activities');
const generateUUID = () => new mongoose.Types.UUID();


const getAllWorkspaces = async (req, res) => {
    // exports.getAllWorkspace= async (req,res) =>{
    try {
        const { workspaceId } = req.params;
        const userId = req.user._id;
        // 1. Check if the user is a member of the workspace
        // const workspace = await Workspace.find(workspaceId)
        const workspace = await Workspace.findById(workspaceId)
        console.log(userId);
        console.log(workspace);

        if (!workspace) {
            return res.status(404).json({ success: false, message: 'workspace not found ' });
        }
        // verify membership ( owner or member)
        // const isMember = workspace.members.some(member => member.equals(userId)) || workspace.ownerId.equals(userId);
        // const isMember = workspace.members.includes(userId) || workspace.ownerId.equals(userId);
        const userIdString = userId.toString();
        const isMember = workspace.members.some(member => member.toString() === userIdString) || workspace.ownerId.toString() === userIdString;
        if (!isMember) {
            return res.status(403).json({ success: false, message: 'Not authorized to access this workspace' });
        }
        const projects = await Project.find({
            workspaceId: workspaceId,
        })
            .select('-columnOrder') // Exclude columnOrder array for lighter list view
            .populate({
                path: 'ownerId',
                select: 'name avatarUrl' // Chỉ lấy tên và avatar của chủ sở hữu
            })
            .sort({ createdAt: 1 });
        res.status(200).json({
            success: true,
            count: projects.length,
            data: projects,
        });
    } catch (error) {
        console.error('error fetching workspace projectsL ', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });

    }
};
const createProject = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { name, description, members } = req.body;
        const userId = req.user._id;
        // precheck: ensure the user is the owner or admin or the workspace
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace || !workspace.ownerId.equals(userId)) {
            return res.status(403).json({ success: false, message: "only workspace owners can create new projects " });
        }
        // 2. create the Project Document
        const projectId = generateUUID();
        const newProject = await Project.create({
            _id: projectId,
            name,
            description,
            workspaceId,
            ownerId: userId,
            // ensure the owner is always first member
            members: [...new Set([userId, ...(members || [])])],
            taskStats: { open: 0, closed: 0 }

        });
        //3, initialize default kanban columns
        const Column = require('../models/Columns');
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
        // 4. Update the new Project document with the order of the create columns
        await Project.findByIdAndUpdate(projectId, {
            columnOrder: columnIds,
        }, { new: true });
        res.status(201).json({
            success: true,
            message: 'Project created adn initialized successfully',
            data: {
                ...newProject.toObject(),
                columnOrder: columnIds,
            },
            initalColumns: createdColumns.map(c => c.toObject()),
        });
    } catch (error) {
        console.error('Error creating project', error);
        // hanble specific mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.massage);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Server Error duting project creation' });
    }
};
const getProjectDetail = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user._id;
        const project = await Project.findById(projectId)
            .populate({ path: 'ownerId', select: 'name email avatarUrl' })
            .populate({ path: 'members', select: 'name email avatarUrl' });
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found,' });
        }
        //2. authortization check: ensure the user is a member of the project
        const isMember = project.members.some(member => member._id.equals(userId));
        if (!isMember && !project.ownerId._id.equals(userId)) {
            return res.status(403).json({ success: false, message: 'Access denied. User is not a member of this project' });
        }
        res.status(200).json({
            success: true,
            data: project,
        })
    } catch (error) {
        console.error('Error fetching project details', error);
        res.status(500).json({ success: false, message: 'Server error at project details', error: error.massage });
    }
}
/**
 * @desc Update project information (name, description, status)
 * @route PATCH /api/v1/projects/:projectId
 * @access Private
 */
const updateProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { name, description, status } = req.body;
        const userId = req.user._id;

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found. at update url" });
        }
        // 2. Authorization Check: Only the project owner or a designated manager can update details
        if (!project.ownerId.equals(userId)) {
            return res.status(403).json({ success: false, message: 'Only the project owner can update project details.' });
        }
        // 3. Update fields dynamically
        const updateFields = {};
        if (name) updateFields.name = name;
        if (description) updateFields.description = description;
        if (status) updateFields.status = status;

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ success: false, message: 'No fields provided for update.' });
        }

        const updatedProject = await Project.findByIdAndUpdate(
            projectId,
            { $set: updateFields },
            { new: true, runValidators: true }
        );
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
 * @desc Delete a project and all related data (tasks, columns, activities)
 * @route DELETE /api/v1/projects/:projectId
 * @access Private
 */
const deleteProject = async (req, res) => {
    // ⚠️ CRITICAL: Use a transaction for multi-document deletion to maintain data integrity
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { projectId } = req.params;
        const userId = req.user._id;

        // 1. Authorization Check (Find first, before deletion)
        const project = await Project.findById(projectId).session(session);

        if (!project) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: 'Project not found.' });
        }

        // Only the project owner can delete the project
        if (!project.ownerId.equals(userId)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ success: false, message: 'Only the project owner can delete the project.' });
        }

        // 2. Cascade Delete (Delete all related documents)
        await Column.deleteMany({ projectId }, { session });
        await Task.deleteMany({ projectId }, { session });
        await Activity.deleteMany({ projectId }, { session });
        // NOTE: Comments and Labels are linked to Tasks/Projects, so they should also be deleted using the project ID or cascaded through tasks

        // 3. Delete the Project document itself
        await Project.deleteOne({ _id: projectId }, { session });

        // 4. Commit the transaction and close the session
        await session.commitTransaction();
        session.endSession();

        // 5. Send success response
        res.status(200).json({
            success: true,
            message: 'Project and all related data deleted successfully.',
        });

    } catch (error) {
        // If any step failed, abort the transaction
        await session.abortTransaction();
        session.endSession();
        console.error('Error during project deletion transaction:', error);
        res.status(500).json({ success: false, message: 'Transaction failed. Project data might be inconsistent.' });
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

        // 1. Fetch Project and check Authorization
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found.' });
        }

        // Check authorization without session
        const inviterIdStr = String(inviterId);
        const projectMemberIdsStr = project.members.map(m => String(m));
        const isAuthorized = projectMemberIdsStr.includes(inviterIdStr) || String(project.ownerId) === inviterIdStr;
        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'Not authorized to add members to this project.' });
        }

        // 2. Find Users based on provided emails
        const usersToAdd = await User.find({ email: { $in: newMemberEmails } });

        // Check if all emails were found
        if (usersToAdd.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No users found with the provided email addresses.',
                notFoundEmails: newMemberEmails
            });
        }

        // Check if some emails were not found
        const foundEmails = usersToAdd.map(u => u.email);
        const notFoundEmails = newMemberEmails.filter(email => !foundEmails.includes(email));
        if (notFoundEmails.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `Some users not found: ${notFoundEmails.join(', ')}`,
                notFoundEmails: notFoundEmails
            });
        }

        // Lọc ra ID của những người dùng đã tồn tại
        const newMemberIds = usersToAdd.map(user => user._id);
        const addedUsersInfo = usersToAdd.map(user => ({ id: user._id, name: user.name, email: user.email }));

        // 3. Filter out users who are already members (use string comparison)
        const currentMemberIds = projectMemberIdsStr;
        const membersToActuallyAdd = newMemberIds.filter(id => !currentMemberIds.includes(String(id)));

        if (membersToActuallyAdd.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'All provided users are already members of this project.',
                data: project,
            });
        }

        // 4. Update the Project document (without session - simpler approach)
        const updatedProject = await Project.findByIdAndUpdate(
            projectId,
            { $addToSet: { members: { $each: membersToActuallyAdd } } },
            { new: true, runValidators: true }
        );

        // 5. Response
        res.status(200).json({
            success: true,
            message: `${membersToActuallyAdd.length} new members added successfully.`,
            data: updatedProject,
            newlyAddedUsers: addedUsersInfo.filter(u => membersToActuallyAdd.some(m => String(m) === String(u.id))),
        });

    } catch (error) {
        console.error('Error adding project members - Message:', error.message);
        console.error('Error adding project members - Stack:', error.stack);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error during member addition.',
            error: error.message 
        });
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
