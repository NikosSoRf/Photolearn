const express = require('express');
const router = express.Router();

// Простейший тестовый маршрут
router.get('/test', (req, res) => {
    res.json({ message: 'Courses router is working!' });
});

router.get('/', (req, res) => {
    res.json([{ id: 1, title: 'Test Course' }]);
});

module.exports = router;