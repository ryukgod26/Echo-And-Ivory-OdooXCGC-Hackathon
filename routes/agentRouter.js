const express = require('express');
const path = require('path');
const router = express.Router();

// Support Agent route
router.get('/support_agent', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'agent.html'));
});

module.exports = router;
