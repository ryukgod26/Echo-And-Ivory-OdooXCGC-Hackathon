const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Agent = require('../models/Agent');
const User = require('../models/User'); // Add unified User model

// Unified login route for all user types
router.get('/login', (req, res) => {
    if (req.session.user) {
        // Redirect based on user role
        switch (req.session.user.role) {
            case 'admin':
                return res.redirect('/admin');
            case 'agent':
                return res.redirect('/support_agent');
            case 'customer':
                return res.redirect('/customer');
            default:
                return res.redirect('/');
        }
    }
    res.sendFile('login.html', { root: './views' });
});

// Unified login POST route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Try to find user in unified User model first
        let user = await User.findOne({ email: email.toLowerCase() });
        
        if (user) {
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.json({ success: false, message: 'Invalid email or password' });
            }
            
            // Update last login
            user.lastLogin = new Date();
            await user.save();
            
            // Create session
            req.session.user = {
                id: user._id,
                name: user.name || user.fullName,
                email: user.email,
                role: user.role,
                permissions: user.permissions
            };
            
            // Redirect based on role
            let redirectUrl = '/';
            switch (user.role) {
                case 'admin':
                    redirectUrl = '/admin';
                    break;
                case 'agent':
                    redirectUrl = '/support_agent';
                    // Also set legacy agent session for backward compatibility
                    req.session.agent = {
                        id: user._id,
                        name: user.name || user.fullName,
                        email: user.email,
                        employeeId: user.employeeId,
                        department: user.department
                    };
                    break;
                case 'customer':
                    redirectUrl = '/customer';
                    // Also set legacy customer session for backward compatibility
                    req.session.customer = {
                        id: user._id,
                        name: user.name || user.fullName,
                        email: user.email,
                        phone: user.phone
                    };
                    break;
            }
            
            return res.json({ success: true, message: 'Login successful', redirectUrl });
        }
        
        // Fallback to legacy authentication for existing users
        // Try Customer model
        const customer = await Customer.findOne({ email: email.toLowerCase() });
        if (customer) {
            const isMatch = await customer.comparePassword(password);
            if (!isMatch) {
                return res.json({ success: false, message: 'Invalid email or password' });
            }
            
            req.session.customer = {
                id: customer._id,
                name: `${customer.firstName} ${customer.lastName}`,
                email: customer.email,
                phone: customer.phone
            };
            
            return res.json({ success: true, message: 'Login successful', redirectUrl: '/customer' });
        }
        
        // Try Agent model
        const agent = await Agent.findOne({ email: email.toLowerCase() });
        if (agent && agent.status !== 'inactive') {
            const isMatch = await agent.comparePassword(password);
            if (!isMatch) {
                return res.json({ success: false, message: 'Invalid email or password' });
            }
            
            // Update agent status to online
            await Agent.findByIdAndUpdate(agent._id, { 
                status: 'online', 
                lastActivity: new Date() 
            });
            
            req.session.agent = {
                id: agent._id,
                name: `${agent.firstName} ${agent.lastName}`,
                email: agent.email,
                employeeId: agent.employeeId,
                department: agent.department
            };
            
            return res.json({ success: true, message: 'Login successful', redirectUrl: '/support_agent' });
        }
        
        return res.json({ success: false, message: 'Invalid email or password' });
        
    } catch (error) {
        console.error('Login error:', error);
        res.json({ success: false, message: 'Server error. Please try again.' });
    }
});

// Unified logout route
router.post('/logout', async (req, res) => {
    try {
        // Update agent status if applicable
        if (req.session.agent) {
            await Agent.findByIdAndUpdate(req.session.agent.id, { 
                status: 'offline',
                lastActivity: new Date()
            });
        }
        
        req.session.destroy((err) => {
            if (err) {
                console.error('Logout error:', err);
                return res.json({ success: false, message: 'Error logging out' });
            }
            res.json({ success: true, message: 'Logged out successfully', redirectUrl: '/auth/login' });
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.json({ success: false, message: 'Error logging out' });
    }
});

// Middleware to check if user is authenticated
const requireAuth = (userType) => {
    return (req, res, next) => {
        if (req.session && req.session[userType]) {
            return next();
        }
        
        // Redirect to appropriate login page
        const loginPage = userType === 'customer' ? '/auth/customer/login' : '/auth/agent/login';
        return res.redirect(loginPage);
    };
};

// Customer Authentication Routes

// Customer Login Page
router.get('/customer/login', (req, res) => {
    if (req.session.customer) {
        return res.redirect('/customer');
    }
    res.sendFile('customer-login.html', { root: './views' });
});

// Customer Signup Page
router.get('/customer/signup', (req, res) => {
    if (req.session.customer) {
        return res.redirect('/customer');
    }
    res.sendFile('customer-signup.html', { root: './views' });
});

// Customer Login POST
router.post('/customer/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find customer by email
        const customer = await Customer.findOne({ email: email.toLowerCase() });
        if (!customer) {
            return res.json({ success: false, message: 'Invalid email or password' });
        }
        
        // Check password
        const isMatch = await customer.comparePassword(password);
        if (!isMatch) {
            return res.json({ success: false, message: 'Invalid email or password' });
        }
        
        // Create session
        req.session.customer = {
            id: customer._id,
            email: customer.email,
            firstName: customer.firstName,
            lastName: customer.lastName
        };
        
        res.json({ success: true, message: 'Login successful', redirectUrl: '/customer' });
    } catch (error) {
        console.error('Customer login error:', error);
        res.json({ success: false, message: 'Server error. Please try again.' });
    }
});

// Customer Signup POST
router.post('/customer/signup', async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone, company } = req.body;
        
        // Check if customer already exists
        const existingCustomer = await Customer.findOne({ email: email.toLowerCase() });
        if (existingCustomer) {
            return res.json({ success: false, message: 'Customer with this email already exists' });
        }
        
        // Create new customer
        const customer = new Customer({
            firstName,
            lastName,
            email: email.toLowerCase(),
            password,
            phone,
            company
        });
        
        await customer.save();
        
        // Create session
        req.session.customer = {
            id: customer._id,
            email: customer.email,
            firstName: customer.firstName,
            lastName: customer.lastName
        };
        
        res.json({ success: true, message: 'Account created successfully', redirectUrl: '/customer' });
    } catch (error) {
        console.error('Customer signup error:', error);
        res.json({ success: false, message: 'Server error. Please try again.' });
    }
});

// Agent Authentication Routes

// Agent Login Page
router.get('/agent/login', (req, res) => {
    if (req.session.agent) {
        return res.redirect('/support_agent');
    }
    res.sendFile('agent-login.html', { root: './views' });
});

// Agent Signup Page
router.get('/agent/signup', (req, res) => {
    if (req.session.agent) {
        return res.redirect('/support_agent');
    }
    res.sendFile('agent-signup.html', { root: './views' });
});

// Agent Login POST
router.post('/agent/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find agent by email
        const agent = await Agent.findOne({ email: email.toLowerCase() });
        if (!agent) {
            return res.json({ success: false, message: 'Invalid email or password' });
        }
        
        // Check password
        const isMatch = await agent.comparePassword(password);
        if (!isMatch) {
            return res.json({ success: false, message: 'Invalid email or password' });
        }
        
        // Update agent status to online
        agent.status = 'online';
        agent.lastActivity = new Date();
        await agent.save();
        
        // Create session
        req.session.agent = {
            id: agent._id,
            email: agent.email,
            firstName: agent.firstName,
            lastName: agent.lastName,
            employeeId: agent.employeeId,
            department: agent.department
        };
        
        res.json({ success: true, message: 'Login successful', redirectUrl: '/support_agent' });
    } catch (error) {
        console.error('Agent login error:', error);
        res.json({ success: false, message: 'Server error. Please try again.' });
    }
});

// Agent Signup POST
router.post('/agent/signup', async (req, res) => {
    try {
        const { firstName, lastName, email, password, employeeId, department } = req.body;
        
        // Check if agent already exists
        const existingAgent = await Agent.findOne({ 
            $or: [
                { email: email.toLowerCase() },
                { employeeId: employeeId }
            ]
        });
        
        if (existingAgent) {
            return res.json({ success: false, message: 'Agent with this email or employee ID already exists' });
        }
        
        // Create new agent
        const agent = new Agent({
            firstName,
            lastName,
            email: email.toLowerCase(),
            password,
            employeeId,
            department,
            status: 'online'
        });
        
        await agent.save();
        
        // Create session
        req.session.agent = {
            id: agent._id,
            email: agent.email,
            firstName: agent.firstName,
            lastName: agent.lastName,
            employeeId: agent.employeeId,
            department: agent.department
        };
        
        res.json({ success: true, message: 'Account created successfully', redirectUrl: '/support_agent' });
    } catch (error) {
        console.error('Agent signup error:', error);
        res.json({ success: false, message: 'Server error. Please try again.' });
    }
});

// Logout Routes
router.post('/customer/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.json({ success: false, message: 'Error logging out' });
        }
        res.json({ success: true, message: 'Logged out successfully', redirectUrl: '/auth/customer/login' });
    });
});

router.post('/agent/logout', async (req, res) => {
    try {
        // Update agent status to offline
        if (req.session.agent) {
            await Agent.findByIdAndUpdate(req.session.agent.id, { 
                status: 'offline',
                lastActivity: new Date()
            });
        }
        
        req.session.destroy((err) => {
            if (err) {
                console.error('Logout error:', err);
                return res.json({ success: false, message: 'Error logging out' });
            }
            res.json({ success: true, message: 'Logged out successfully', redirectUrl: '/auth/agent/login' });
        });
    } catch (error) {
        console.error('Agent logout error:', error);
        res.json({ success: false, message: 'Error logging out' });
    }
});

// Export middleware for use in other routes
router.requireCustomerAuth = requireAuth('customer');
router.requireAgentAuth = requireAuth('agent');

module.exports = router;
