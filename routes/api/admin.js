const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Category = require('../../models/Category');

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// USER MANAGEMENT ROUTES

// Get all users
router.get('/users', requireAdmin, async (req, res) => {
    try {
        const { role, status, page = 1, limit = 20 } = req.query;
        const filter = {};
        
        if (role) filter.role = role;
        if (status === 'active') filter.isActive = true;
        if (status === 'inactive') filter.isActive = false;
        
        const users = await User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
            
        const total = await User.countDocuments(filter);
        
        res.json({
            users,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Create new user
router.post('/users', requireAdmin, async (req, res) => {
    try {
        const { firstName, lastName, email, password, role, employeeId, department, phone } = req.body;
        
        if (!firstName || !lastName || !email || !password || !role) {
            return res.status(400).json({ error: 'Required fields missing' });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        
        const userData = {
            firstName,
            lastName,
            email,
            password,
            role,
            employeeId,
            department,
            phone
        };
        
        let user;
        if (role === 'admin') {
            user = User.createAdmin(userData);
        } else if (role === 'agent') {
            user = User.createAgent(userData);
        } else {
            user = User.createCustomer(userData);
        }
        
        await user.save();
        
        // Return user without password
        const userResponse = user.toObject();
        delete userResponse.password;
        
        res.status(201).json({ success: true, user: userResponse });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Update user
router.put('/users/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Remove sensitive fields that shouldn't be updated via this route
        delete updates.password;
        delete updates._id;
        
        const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ success: true, user });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Toggle user status
router.patch('/users/:id/toggle-status', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        user.isActive = !user.isActive;
        await user.save();
        
        const userResponse = user.toObject();
        delete userResponse.password;
        
        res.json({ success: true, user: userResponse });
    } catch (error) {
        console.error('Error toggling user status:', error);
        res.status(500).json({ error: 'Failed to update user status' });
    }
});

// Delete user
router.delete('/users/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// CATEGORY MANAGEMENT ROUTES

// Get all categories
router.get('/categories', requireAdmin, async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};
        
        if (status === 'active') filter.isActive = true;
        if (status === 'inactive') filter.isActive = false;
        
        const categories = await Category.find(filter)
            .populate('createdBy', 'firstName lastName email')
            .sort({ priority: -1, name: 1 });
        
        res.json({ categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Create new category
router.post('/categories', requireAdmin, async (req, res) => {
    try {
        const { name, description, color, icon, priority } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }
        
        const category = new Category({
            name,
            description,
            color,
            icon,
            priority,
            createdBy: req.session.user.id
        });
        
        await category.save();
        await category.populate('createdBy', 'firstName lastName email');
        
        res.status(201).json({ success: true, category });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Category with this name already exists' });
        }
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

// Update category
router.put('/categories/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        delete updates._id;
        delete updates.createdBy;
        
        const category = await Category.findByIdAndUpdate(id, updates, { new: true })
            .populate('createdBy', 'firstName lastName email');
        
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        res.json({ success: true, category });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
});

// Toggle category status
router.patch('/categories/:id/toggle-status', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        category.isActive = !category.isActive;
        await category.save();
        await category.populate('createdBy', 'firstName lastName email');
        
        res.json({ success: true, category });
    } catch (error) {
        console.error('Error toggling category status:', error);
        res.status(500).json({ error: 'Failed to update category status' });
    }
});

// Delete category
router.delete('/categories/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const category = await Category.findByIdAndDelete(id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

module.exports = router;
