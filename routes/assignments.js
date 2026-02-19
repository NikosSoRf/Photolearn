const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { StudentAssignment, Enrollment, Lesson, Course, User, Module } = require('../models');

// Настройка multer для загрузки фото (до 50MB)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/assignments/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|bmp|tiff|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Поддерживаются только файлы изображений'));
  }
});

// Получение заданий студента
router.get('/my-assignments', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    // Находим все записи студента на курсы
    const enrollments = await Enrollment.findAll({
      where: { student_id: req.user.id },
      attributes: ['id']
    });

    const enrollmentIds = enrollments.map(e => e.id);

    if (enrollmentIds.length === 0) {
      return res.json({
        success: true,
        assignments: []
      });
    }

    // Получаем задания студента
    const assignments = await StudentAssignment.findAll({
      where: {
        enrollment_id: enrollmentIds
      },
      include: [
        {
          model: Enrollment,
          as: 'enrollment',
          include: [{
            model: Course,
            as: 'course',
            attributes: ['id', 'title']
          }]
        },
        {
          model: Lesson,
          as: 'lesson',
          attributes: ['id', 'title']
        }
      ],
      order: [['submitted_at', 'DESC']]
    });

    res.json({
      success: true,
      assignments
    });

  } catch (error) {
    console.error('Error fetching student assignments:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка загрузки заданий' 
    });
  }
});
// Получение задания по конкретному уроку
router.get('/lesson/:lessonId', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;

    console.log('📝 Получение задания для урока:', lessonId, 'пользователя:', userId);

    // Находим запись студента на курс, к которому относится урок
    const enrollment = await Enrollment.findOne({
      where: { 
        student_id: userId 
      },
      include: [{
        model: Course,
        as: 'course',
        include: [{
          model: Module,
          as: 'modules',
          include: [{
            model: Lesson,
            as: 'lessons',
            where: { id: lessonId }
          }]
        }]
      }]
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Вы не записаны на этот курс или урок не найден'
      });
    }

    // Ищем задание для этого урока
    const assignment = await StudentAssignment.findOne({
      where: {
        enrollment_id: enrollment.id,
        lesson_id: lessonId
      },
      include: [
        {
          model: Lesson,
          as: 'lesson',
          attributes: ['id', 'title', 'content_type']
        },
        {
          model: Enrollment,
          as: 'enrollment',
          attributes: ['id'],
          include: [{
            model: Course,
            as: 'course',
            attributes: ['id', 'title']
          }]
        }
      ]
    });

    res.json({
      success: true,
      assignment: assignment || null,
      enrollment_id: enrollment.id
    });

  } catch (error) {
    console.error('Error fetching assignment by lesson:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка загрузки задания'
    });
  }
});
// Загрузка работы студентом
/*router.post('/submit', 
  authenticateToken, 
  requireRole(['student']), 
  upload.single('photo'), 
  async (req, res) => {
  try {
    const { enrollment_id, lesson_id, comment } = req.body;

    // Проверяем, что студент записан на курс
    const enrollment = await Enrollment.findOne({
      where: { 
        id: enrollment_id,
        student_id: req.user.id 
      }
    });

    if (!enrollment) {
      return res.status(403).json({ 
        success: false, 
        error: 'Вы не записаны на этот курс' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Файл не загружен' 
      });
    }

    // Создаем или обновляем задание
    const [assignment, created] = await StudentAssignment.findOrCreate({
      where: {
        enrollment_id,
        lesson_id
      },
      defaults: {
        enrollment_id,
        lesson_id,
        photo_url: `/uploads/assignments/${req.file.filename}`,
        status: 'submitted',
        submitted_at: new Date(),
        teacher_comment: null,
        grade: null
      }
    });

    if (!created) {
      // Обновляем существующее задание
      assignment.photo_url = `/uploads/assignments/${req.file.filename}`;
      assignment.status = 'submitted';
      assignment.submitted_at = new Date();
      await assignment.save();
    }

    res.json({
      success: true,
      message: created ? 'Работа загружена' : 'Работа обновлена',
      assignment
    });

  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка загрузки работы' 
    });
  }
});*/
// Загрузка работы студентом (обновленная версия)
/*router.post('/submit', 
  authenticateToken, 
  requireRole(['student']), 
  upload.single('photo'), 
  async (req, res) => {
  try {
    const { lesson_id, comment } = req.body;
    const userId = req.user.id;

    console.log('📤 Загрузка работы для урока:', lesson_id, 'пользователя:', userId);

    if (!lesson_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID урока обязателен' 
      });
    }

    // Находим запись студента на курс, к которому относится урок
    const enrollment = await Enrollment.findOne({
      where: { 
        student_id: userId 
      },
      include: [{
        model: Course,
        as: 'course',
        include: [{
          model: Module,
          as: 'modules',
          include: [{
            model: Lesson,
            as: 'lessons',
            where: { id: lesson_id }
          }]
        }]
      }]
    });

    if (!enrollment) {
      return res.status(403).json({ 
        success: false, 
        error: 'Вы не записаны на курс, к которому относится этот урок' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Файл не загружен' 
      });
    }

    // Создаем или обновляем задание
    const [assignment, created] = await StudentAssignment.findOrCreate({
      where: {
        enrollment_id: enrollment.id,
        lesson_id
      },
      defaults: {
        enrollment_id: enrollment.id,
        lesson_id,
        photo_url: `/uploads/assignments/${req.file.filename}`,
        status: 'submitted',
        submitted_at: new Date(),
        teacher_comment: comment || null,
        grade: null
      }
    });

    if (!created) {
      // Обновляем существующее задание
      assignment.photo_url = `/uploads/assignments/${req.file.filename}`;
      assignment.status = 'submitted';
      assignment.submitted_at = new Date();
      assignment.teacher_comment = comment || assignment.teacher_comment;
      await assignment.save();
    }

    console.log('✅ Работа загружена, ID задания:', assignment.id);

    res.json({
      success: true,
      message: created ? 'Работа загружена' : 'Работа обновлена',
      assignment: {
        id: assignment.id,
        photo_url: assignment.photo_url,
        status: assignment.status,
        submitted_at: assignment.submitted_at,
        grade: assignment.grade,
        teacher_comment: assignment.teacher_comment
      }
    });

  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка загрузки работы: ' + error.message 
    });
  }
});*/
router.post('/submit', 
  authenticateToken, 
  requireRole(['student']), 
  upload.single('photo'), 
  async (req, res) => {
  try {
    const { lesson_id, comment } = req.body;
    const userId = req.user.id;

    console.log('📤 ЗАГРУЗКА ФАЙЛА ===================');
    console.log('👤 Пользователь ID:', userId);
    console.log('📝 ID урока:', lesson_id);
    console.log('💬 Комментарий:', comment);
    console.log('📁 Файл:', req.file);
    console.log('===================================');

    if (!lesson_id) {
      console.error('❌ Ошибка: ID урока обязателен');
      return res.status(400).json({ 
        success: false, 
        error: 'ID урока обязателен' 
      });
    }

    // Находим запись студента на курс, к которому относится урок
    const enrollment = await Enrollment.findOne({
      where: { 
        student_id: userId 
      },
      include: [{
        model: Course,
        as: 'course',
        include: [{
          model: Module,
          as: 'modules',
          include: [{
            model: Lesson,
            as: 'lessons',
            where: { id: lesson_id }
          }]
        }]
      }]
    });

    console.log('🔍 Найдена запись на курс:', enrollment ? 'Да' : 'Нет');

    if (!enrollment) {
      console.error('❌ Ошибка: Студент не записан на курс с этим уроком');
      return res.status(403).json({ 
        success: false, 
        error: 'Вы не записаны на курс, к которому относится этот урок' 
      });
    }

    if (!req.file) {
      console.error('❌ Ошибка: Файл не загружен');
      return res.status(400).json({ 
        success: false, 
        error: 'Файл не загружен' 
      });
    }

    console.log('✅ Файл загружен:', req.file.filename, 'путь:', req.file.path);

    // Создаем или обновляем задание
    const [assignment, created] = await StudentAssignment.findOrCreate({
      where: {
        enrollment_id: enrollment.id,
        lesson_id
      },
      defaults: {
        enrollment_id: enrollment.id,
        lesson_id,
        photo_url: `/uploads/assignments/${req.file.filename}`,
        status: 'submitted',
        submitted_at: new Date(),
        teacher_comment: comment || null,
        grade: null
      }
    });

    if (!created) {
      // Обновляем существующее задание
      assignment.photo_url = `/uploads/assignments/${req.file.filename}`;
      assignment.status = 'submitted';
      assignment.submitted_at = new Date();
      assignment.teacher_comment = comment || assignment.teacher_comment;
      await assignment.save();
      console.log('🔄 Задание обновлено, ID:', assignment.id);
    } else {
      console.log('🆕 Задание создано, ID:', assignment.id);
    }

    console.log('✅ Успешная загрузка!');

    res.json({
      success: true,
      message: created ? 'Работа загружена' : 'Работа обновлена',
      assignment: {
        id: assignment.id,
        photo_url: assignment.photo_url,
        status: assignment.status,
        submitted_at: assignment.submitted_at,
        grade: assignment.grade,
        teacher_comment: assignment.teacher_comment
      }
    });

  } catch (error) {
    console.error('❌ Ошибка загрузки:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка загрузки работы: ' + error.message 
    });
  }
});
// Простой маршрут для проверки работы API
router.get('/test/:lessonId', authenticateToken, async (req, res) => {
  try {
    const { lessonId } = req.params;
    
    // Просто возвращаем тестовые данные
    res.json({
      success: true,
      lesson_id: lessonId,
      user_id: req.user.id,
      timestamp: new Date().toISOString(),
      message: 'API работает корректно'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
// Получение заданий на проверку (для преподавателя)
router.get('/pending', authenticateToken, requireRole(['teacher']), async (req, res) => {
  try {
    // Находим курсы преподавателя
    const courses = await Course.findAll({
      where: { teacher_id: req.user.id },
      attributes: ['id']
    });

    const courseIds = courses.map(c => c.id);

    if (courseIds.length === 0) {
      return res.json({
        success: true,
        assignments: []
      });
    }

    // Находим записи на эти курсы
    const enrollments = await Enrollment.findAll({
      where: {
        course_id: courseIds
      },
      attributes: ['id']
    });

    const enrollmentIds = enrollments.map(e => e.id);

    // Получаем задания на проверку
    const assignments = await StudentAssignment.findAll({
      where: {
        enrollment_id: enrollmentIds,
        status: 'submitted'
      },
      include: [
        {
          model: Enrollment,
          as: 'enrollment',
          include: [
            {
              model: User,
              as: 'enrollmentStudent',
              attributes: ['id', 'first_name', 'last_name', 'email']
            },
            {
              model: Course,
              as: 'course',
              attributes: ['id', 'title']
            }
          ]
        },
        {
          model: Lesson,
          as: 'lesson',
          attributes: ['id', 'title']
        }
      ],
      order: [['submitted_at', 'ASC']]
    });

    res.json({
      success: true,
      assignments
    });

  } catch (error) {
    console.error('Error fetching pending assignments:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка загрузки заданий' 
    });
  }
});
// Получение одного задания по ID
router.get('/:id', authenticateToken, requireRole(['student']), async (req, res) => {
    try {
        const { id } = req.params;
        
        const assignment = await StudentAssignment.findOne({
            where: {
                id: id
            },
            include: [
                {
                    model: Enrollment,
                    as: 'enrollment',
                    where: { student_id: req.user.id },
                    required: true,
                    include: [{
                        model: Course,
                        as: 'course',
                        attributes: ['id', 'title']
                    }]
                },
                {
                    model: Lesson,
                    as: 'lesson',
                    attributes: ['id', 'title']
                }
            ]
        });

        if (!assignment) {
            return res.status(404).json({ 
                success: false, 
                error: 'Задание не найдено' 
            });
        }

        res.json({
            success: true,
            assignment
        });

    } catch (error) {
        console.error('Error fetching assignment:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка загрузки задания' 
        });
    }
});
// Оценка работы преподавателем
router.post('/:id/review', authenticateToken, requireRole(['teacher']), async (req, res) => {
  try {
    const { id } = req.params;
    const { grade, teacher_comment, status } = req.body;

    // Находим задание и проверяем, что курс принадлежит преподавателю
    const assignment = await StudentAssignment.findOne({
      where: { id },
      include: [{
        model: Enrollment,
        as: 'enrollment',
        include: [{
          model: Course,
          as: 'course',
          where: { teacher_id: req.user.id }
        }]
      }]
    });

    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        error: 'Задание не найдено или у вас нет прав' 
      });
    }

    // Обновляем задание
    if (grade !== undefined) assignment.grade = grade;
    if (teacher_comment !== undefined) assignment.teacher_comment = teacher_comment;
    if (status !== undefined) assignment.status = status;
    
    await assignment.save();

    res.json({
      success: true,
      message: 'Оценка сохранена',
      assignment
    });

  } catch (error) {
    console.error('Error reviewing assignment:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка оценки задания' 
    });
  }
});

// Получение задания по ID для преподавателя
router.get('/teacher/:id', authenticateToken, requireRole(['teacher']), async (req, res) => {
    try {
        const { id } = req.params;
        const teacherId = req.user.id;
        
        console.log(`👨‍🏫 Преподаватель ${teacherId} запрашивает задание ${id}`);
        
        // Находим задание
        const assignment = await StudentAssignment.findOne({
            where: { id: id },
            include: [
                {
                    model: Enrollment,
                    as: 'enrollment',
                    include: [
                        {
                            model: User,
                            as: 'enrollmentStudent',
                            attributes: ['id', 'first_name', 'last_name', 'email']
                        },
                        {
                            model: Course,
                            as: 'course',
                            attributes: ['id', 'title', 'teacher_id']
                        }
                    ]
                },
                {
                    model: Lesson,
                    as: 'lesson',
                    attributes: ['id', 'title', 'content_type']
                }
            ]
        });

        if (!assignment) {
            console.log(`❌ Задание ${id} не найдено`);
            return res.status(404).json({ 
                success: false, 
                error: 'Задание не найдено' 
            });
        }

        // Проверяем, что преподаватель ведет этот курс
        const course = assignment.enrollment.course;
        if (!course || course.teacher_id !== teacherId) {
            console.log(`🚫 Преподаватель ${teacherId} пытается получить задание не своего курса (курс: ${course?.id}, учитель курса: ${course?.teacher_id})`);
            return res.status(403).json({ 
                success: false, 
                error: 'Это задание не относится к вашим курсам' 
            });
        }

        console.log(`✅ Найдено задание ${assignment.id} для преподавателя ${teacherId}`);
        
        res.json({
            success: true,
            assignment
        });

    } catch (error) {
        console.error('❌ Ошибка загрузки задания для преподавателя:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка загрузки задания' 
        });
    }
});

// Альтернативный эндпоинт
router.get('/:id/teacher', authenticateToken, requireRole(['teacher']), async (req, res) => {
    try {
        const { id } = req.params;
        const teacherId = req.user.id;
        
        console.log(`📝 Альтернативный запрос: преподаватель ${teacherId} -> задание ${id}`);
        
        const assignment = await StudentAssignment.findOne({
            where: { id: id },
            include: [
                {
                    model: Enrollment,
                    as: 'enrollment',
                    include: [
                        {
                            model: User,
                            as: 'enrollmentStudent',
                            attributes: ['id', 'first_name', 'last_name', 'email']
                        },
                        {
                            model: Course,
                            as: 'course',
                            where: { teacher_id: teacherId },
                            attributes: ['id', 'title']
                        }
                    ]
                },
                {
                    model: Lesson,
                    as: 'lesson',
                    attributes: ['id', 'title']
                }
            ]
        });

        if (!assignment) {
            return res.status(404).json({ 
                success: false, 
                error: 'Задание не найдено или не относится к вашим курсам' 
            });
        }

        res.json({
            success: true,
            assignment
        });

    } catch (error) {
        console.error('Error fetching assignment for teacher:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка загрузки задания' 
        });
    }
});

module.exports = router;