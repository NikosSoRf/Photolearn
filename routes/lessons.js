const express = require('express');
const router = express.Router();
const { Lesson, Module, Course, User } = require('../models');
const auth = require('../middleware/auth');

// Получение урока с полной информацией для отображения
router.get('/full/:id', async (req, res) => {
  try {
    const lesson = await Lesson.findByPk(req.params.id, {
      include: [{
        model: Module,
        as: 'module',
        include: [{
          model: Course,
          as: 'course',
          include: [{
            model: User,
            as: 'teacher',
            attributes: ['id', 'first_name', 'last_name']
          }]
        }]
      }]
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Урок не найден' });
    }

    // Получаем соседние уроки для навигации
    const allLessons = await Lesson.findAll({
      where: { module_id: lesson.module_id },
      order: [['order_index', 'ASC']],
      attributes: ['id', 'title', 'order_index']
    });

    const currentIndex = allLessons.findIndex(l => l.id === lesson.id);
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

    res.json({
      lesson: lesson,
      navigation: {
        prev: prevLesson,
        next: nextLesson,
        current: currentIndex + 1,
        total: allLessons.length
      },
      course: lesson.module.course
    });
  } catch (error) {
    console.error('Error fetching lesson:', error);
    res.status(500).json({ error: 'Ошибка при загрузке урока' });
  }
});

// Получение контента урока (простая версия)
router.get('/:id', async (req, res) => {
  try {
    const lesson = await Lesson.findByPk(req.params.id, {
      include: [{
        model: Module,
        as: 'module',
        include: [{
          model: Course,
          as: 'course'
        }]
      }]
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Урок не найден' });
    }

    res.json(lesson);
  } catch (error) {
    console.error('Error fetching lesson:', error);
    res.status(500).json({ error: 'Ошибка при загрузке урока' });
  }
});

module.exports = router;