const express = require('express');
const router = express.Router();
const { Course, User } = require('../models');

// Тестовый маршрут
router.get('/test-models', async (req, res) => {
    try {
        const courses = await Course.findAll({
            include: [{
                model: User,
                as: 'teacher',
                attributes: ['id', 'first_name', 'last_name', 'email']
            }],
            limit: 5
        });
        
        res.json({ 
            message: 'Models are working!',
            courses: courses.map(course => ({
                id: course.id,
                title: course.title,
                teacher: course.teacher ? {
                    id: course.teacher.id,
                    name: `${course.teacher.first_name} ${course.teacher.last_name}`,
                    email: course.teacher.email
                } : null
            }))
        });
    } catch (error) {
        console.error('Error in test-models:', error);
        res.status(500).json({ 
            error: error.message,
            details: 'Проверьте структуру таблиц в базе данных'
        });
    }
});

// Получение всех опубликованных курсов
router.get('/', async (req, res) => {
    try {
        const courses = await Course.findAll({
            where: { is_published: true },
            include: [{
                model: User,
                as: 'teacher',
                attributes: ['id', 'first_name', 'last_name', 'email']
            }],
            order: [['created_at', 'DESC']]
        });
        
        const formattedCourses = courses.map(course => ({
            id: course.id,
            title: course.title,
            description: course.description,
            price: course.price,
            level: course.level,
            teacher: course.teacher ? {
                id: course.teacher.id,
                name: `${course.teacher.first_name} ${course.teacher.last_name}`,
                email: course.teacher.email
            } : null,
            video_call_link: course.video_call_link,
            is_published: course.is_published,
            created_at: course.created_at
        }));
        
        res.json(formattedCourses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ 
            error: 'Ошибка при загрузке курсов',
            details: error.message 
        });
    }
});

// Получение курсов для главной страницы (публичные)
router.get('/public/home', async (req, res) => {
  try {
    const courses = await Course.findAll({
      where: { is_published: true },
      include: [{
        model: User,
        as: 'teacher',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }],
      order: [['created_at', 'DESC']],
      limit: 6
    });
    
    // Форматируем для фронтенда
    const formattedCourses = courses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description || 'Описание курса',
      price: course.price,
      level: course.level,
      teacher: course.teacher ? 
        `${course.teacher.first_name} ${course.teacher.last_name}` : 
        'Преподаватель',
      modules_count: 3, // Пока статично, можно посчитать реально
      duration: course.level === 'basic' ? '8 недель' : 
               course.level === 'advanced' ? '10 недель' : '6 недель'
    }));
    
    res.json(formattedCourses);
  } catch (error) {
    console.error('Error fetching public courses:', error);
    
    // Временные данные для разработки если БД пустая
    const mockCourses = [
      {
        id: 999,
        title: "Основы фотографии",
        description: "Идеально для начинающих. Освойте базовые принципы композиции, работы с камерой и светом.",
        price: 0,
        level: "basic",
        teacher: "Преподаватель",
        modules_count: 3,
        duration: "8 недель"
      }
    ];
    
    res.json(mockCourses);
  }
});
// Получение курса по ID с полной структурой
router.get('/:id', async (req, res) => {
  try {
    const courseId = req.params.id;
    console.log('Fetching course with ID:', courseId);
    
    // Сначала получаем базовую информацию о курсе
    const course = await Course.findByPk(courseId, {
      include: [{
        model: User,
        as: 'teacher',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }]
    });

    if (!course) {
      console.log('Course not found:', courseId);
      return res.status(404).json({ error: 'Курс не найден' });
    }

    console.log('Course found:', course.title);
    
    // Форматируем ответ
    const formattedCourse = {
      id: course.id,
      title: course.title,
      description: course.description,
      price: course.price,
      level: course.level,
      teacher: course.teacher ? {
        id: course.teacher.id,
        name: `${course.teacher.first_name} ${course.teacher.last_name}`,
        email: course.teacher.email
      } : null,
      video_call_link: course.video_call_link,
      is_published: course.is_published,
      created_at: course.created_at,
      // Пока оставляем пустые модули, можно будет добавить позже
      modules: []
    };
    
    res.json(formattedCourse);
    
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Ошибка при загрузке курса' });
  }
});
module.exports = router;