const express = require('express');
const Task = require('../models/Task');
const { authenticate, authorize } = require('../middleware/auth');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/tasks — List tasks
// Admin: all tasks | Member: tasks assigned to them
router.get('/', async (req, res, next) => {
  try {
    let filter = {};

    if (req.user.role !== 'admin') {
      filter = { assignedTo: req.user._id };
    }

    // Optional: filter by project
    if (req.query.project) {
      filter.project = req.query.project;
    }

    const tasks = await Task.find(filter)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks — Create a new task (Admin only)
router.post('/', authorize('admin'), [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('description').optional().trim(),
  body('status').optional().isIn(['todo', 'in-progress', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('project').isMongoId().withMessage('Valid project ID required'),
  body('assignedTo').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid assigned user ID'),
  body('dueDate').optional({ checkFalsy: true }).isISO8601().toDate().withMessage('Invalid due date'),
  validate
], async (req, res, next) => {
  try {
    const { title, description, status, priority, project, assignedTo, dueDate } = req.body;

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      project,
      assignedTo: assignedTo || null,
      dueDate: dueDate || null,
      createdBy: req.user._id,
    });

    const populated = await task.populate([
      { path: 'project', select: 'name' },
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
    ]);

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
});

// PUT /api/tasks/:id — Update a task
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid task ID'),
  body('title').optional().trim().notEmpty().withMessage('Task title cannot be empty'),
  body('description').optional().trim(),
  body('status').optional().isIn(['todo', 'in-progress', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('assignedTo').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid assigned user ID'),
  body('dueDate').optional({ checkFalsy: true }).isISO8601().toDate().withMessage('Invalid due date'),
  validate
], async (req, res, next) => {
  try {
    const taskCheck = await Task.findById(req.params.id);
    if (!taskCheck) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Ensure only admin or assigned user can update
    if (req.user.role !== 'admin' && String(taskCheck.assignedTo) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this task.' });
    }

    const { title, description, status, priority, assignedTo, dueDate } = req.body;

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, status, priority, assignedTo, dueDate },
      { new: true, runValidators: true }
    )
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/tasks/:id — Delete a task (Admin only)
router.delete('/:id', authorize('admin'), [
  param('id').isMongoId().withMessage('Invalid task ID'),
  validate
], async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({ message: 'Task deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
