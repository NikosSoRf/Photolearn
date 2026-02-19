// ВАЖНО: Полностью новый файл
const express = require('express');
// Создаем роутер правильно
const router = express.Router();

// Сначала добавляем простой GET маршрут
router.get('/', (req, res) => {
    res.json({ 
        message: 'Modules API is working',
        timestamp: new Date().toISOString()
    });
});

router.get('/test', (req, res) => {
    res.json({ message: 'Test endpoint works' });
});

module.exports = router;