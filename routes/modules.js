const express = require('express');
const router = express.Router();
const { Module, Lesson, Course } = require('../models');
const auth = require('../middleware/auth');

// Создание модуля
router.post('/', auth, async (req, res) => {
  try {
    const course = await Course.findByPk(req.body.course_id);
    
    if (!course) {
      return res.status(404).json({ error: 'Курс не найден' });
    }

    if (course.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Нет прав для добавления модулей' });
    }

    const module = await Module.create(req.body);
    res.status(201).json(module);
  } catch (error) {
    console.error('Error creating module:', error);
    res.status(400).json({ error: error.message });
  }
});

// Редактирование модуля
router.put('/:id', auth, async (req, res) => {
  try {
    const module = await Module.findByPk(req.params.id, {
      include: [{ model: Course, as: 'course' }]
    });
    
    if (!module) {
      return res.status(404).json({ error: 'Модуль не найден' });
    }

    if (module.course.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Нет прав для редактирования модуля' });
    }

    await module.update(req.body);
    res.json(module);
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(400).json({ error: error.message });
  }
});

// Удаление модуля
router.delete('/:id', auth, async (req, res) => {
  try {
    const module = await Module.findByPk(req.params.id, {
      include: [{ model: Course, as: 'course' }]
    });
    
    if (!module) {
      return res.status(404).json({ error: 'Модуль не найден' });
    }

    if (module.course.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Нет прав для удаления модуля' });
    }

    await module.destroy();
    res.json({ message: 'Модуль успешно удален' });
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({ error: 'Ошибка при удалении модуля' });
  }
});
// Простой GET маршрут для тестирования
router.get('/', async (req, res) => {
  try {
    const modules = await Module.findAll({
      limit: 10,
      include: [{
        model: Course,
        as: 'course'
      }]
    });
    res.json(modules);
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ error: 'Ошибка при загрузке модулей' });
  }
});

// GET по ID
router.get('/:id', async (req, res) => {
  try {
    const module = await Module.findByPk(req.params.id, {
      include: [{
        model: Course,
        as: 'course'
      }, {
        model: Lesson,
        as: 'lessons',
        order: [['order_index', 'ASC']]
      }]
    });

    if (!module) {
      return res.status(404).json({ error: 'Модуль не найден' });
    }

    res.json(module);
  } catch (error) {
    console.error('Error fetching module:', error);
    res.status(500).json({ error: 'Ошибка при загрузке модуля' });
  }
});
module.exports = router;