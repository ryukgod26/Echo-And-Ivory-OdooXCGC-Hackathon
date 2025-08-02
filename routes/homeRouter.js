const express = require('express');
const path = require('path');
const router = express.Router();

// Home route
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
});

// Home route (alternative path)
router.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
});

module.exports = router;
