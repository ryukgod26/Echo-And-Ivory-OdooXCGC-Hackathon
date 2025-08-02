const express = require('express');
const router = express.Router();

// Get current user session info
router.get('/me', (req, res) => {
    if (req.session.customer) {
        return res.json({
            success: true,
            userType: 'customer',
            user: req.session.customer
        });
    }
    
    if (req.session.agent) {
        return res.json({
            success: true,
            userType: 'agent',
            user: req.session.agent
        });
    }
    
    res.json({
        success: false,
        message: 'No active session'
    });
});

// Check if user is authenticated
router.get('/check', (req, res) => {
    const isAuthenticated = !!(req.session.customer || req.session.agent);
    const userType = req.session.customer ? 'customer' : req.session.agent ? 'agent' : null;
    
    res.json({
        success: true,
        isAuthenticated,
        userType
    });
});

module.exports = router;
