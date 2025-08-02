const express = require('express');
const path = require('path');
const router = express.Router();

// Customer route
router.get('/customer', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'customer.html'));
});

module.exports = router;
