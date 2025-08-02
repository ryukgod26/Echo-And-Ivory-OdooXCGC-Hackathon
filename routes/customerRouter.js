const express = require('express');
const path = require('path');
const router = express.Router();

// Customer route (now just '/' since it's mounted at '/customer')
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'customer.html'));
});

module.exports = router;
