const express = require('express');
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/projects — List projects
// Admin: sees all projects | Member: sees projects they belong to
router.get('/', async (req, res, next) => {
  try {
    let projects;

    if (req.user.role === 'admin') {
      projects = await Project.find()
        .populate('owner', 'name email')
        .populate('members', 'name email')
        .sort({ createdAt: -1 });
    } else {
      projects = await Project.find({
        $or: [{ owner: req.user._id }, { members: req.user._id }],
      })
        .populate('owner', 'name email')
        .populate('members', 'name email')
        .sort({ createdAt: -1 });
    }

    res.json(projects);
  } catch (error) {
    next(error);
  }
});

// POST /api/projects — Create a new project (Admin only)
router.post('/', authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Project name is required').isLength({ max: 100 }).withMessage('Project name must be 100 characters or less'),
  body('description').optional().trim(),
  body('members').optional().isArray().withMessage('Members must be an array of IDs'),
  validate
], async (req, res, next) => {
  try {
    const { name, description, members } = req.body;

    // Validate member IDs if provided
    if (members && members.length > 0) {
      const validMembers = await User.find({ _id: { $in: members } }).select('_id');
      if (validMembers.length !== members.length) {
        return res.status(400).json({ message: 'One or more member IDs are invalid.' });
      }
    }

    const project = await Project.create({
      name: name.trim(),
      description: description?.trim() || '',
      owner: req.user._id,
      members: members || [],
    });

    const populated = await project.populate([
      { path: 'owner', select: 'name email' },
      { path: 'members', select: 'name email' },
    ]);

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id — Get a single project with its tasks
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid project ID'),
  validate
], async (req, res, next) => {
  try {

    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Get tasks belonging to this project
    const tasks = await Task.find({ project: project._id })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ project, tasks });
  } catch (error) {
    next(error);
  }
});

// PUT /api/projects/:id — Update a project (Admin only)
router.put('/:id', authorize('admin'), [
  param('id').isMongoId().withMessage('Invalid project ID'),
  body('name').optional().trim().notEmpty().withMessage('Project name cannot be empty').isLength({ max: 100 }).withMessage('Project name must be 100 characters or less'),
  body('description').optional().trim(),
  body('members').optional().isArray().withMessage('Members must be an array of IDs'),
  validate
], async (req, res, next) => {
  try {
    const { name, description, members } = req.body;

    // Validate member IDs if provided
    if (members && members.length > 0) {
      const validMembers = await User.find({ _id: { $in: members } }).select('_id');
      if (validMembers.length !== members.length) {
        return res.status(400).json({ message: 'One or more member IDs are invalid.' });
      }
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (members) updateData.members = members;

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email')
      .populate('members', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/members — Add a member to project (Admin only)
router.post('/:id/members', authorize('admin'), [
  param('id').isMongoId().withMessage('Invalid project ID'),
  body('userId').isMongoId().withMessage('A valid user ID is required'),
  validate
], async (req, res, next) => {
  try {
    const { userId } = req.body;

    // Check user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Prevent duplicates
    if (project.members.map(String).includes(String(userId))) {
      return res.status(400).json({ message: 'User is already a member of this project.' });
    }

    // Prevent adding the owner as a member (they already have access)
    if (String(project.owner) === String(userId)) {
      return res.status(400).json({ message: 'The project owner is already part of this project.' });
    }

    project.members.push(userId);
    await project.save();

    const populated = await project.populate([
      { path: 'owner', select: 'name email' },
      { path: 'members', select: 'name email' },
    ]);

    res.json(populated);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:id/members/:userId — Remove a member from project (Admin only)
router.delete('/:id/members/:userId', authorize('admin'), [
  param('id').isMongoId().withMessage('Invalid project ID'),
  param('userId').isMongoId().withMessage('Invalid user ID'),
  validate
], async (req, res, next) => {
  try {

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Check the user is actually a member
    if (!project.members.map(String).includes(String(req.params.userId))) {
      return res.status(400).json({ message: 'User is not a member of this project.' });
    }

    project.members = project.members.filter(
      (m) => String(m) !== String(req.params.userId)
    );
    await project.save();

    const populated = await project.populate([
      { path: 'owner', select: 'name email' },
      { path: 'members', select: 'name email' },
    ]);

    res.json(populated);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:id — Delete project and its tasks (Admin only)
router.delete('/:id', authorize('admin'), [
  param('id').isMongoId().withMessage('Invalid project ID'),
  validate
], async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Delete all tasks in this project
    await Task.deleteMany({ project: project._id });

    // Delete the project
    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Project and its tasks deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

