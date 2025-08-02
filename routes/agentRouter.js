const express = require('express');
const path = require('path');
const router = express.Router();

// Support Agent route (now just '/' since it's mounted at '/support_agent')
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'agent.html'));
});

module.exports = router;
