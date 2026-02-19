const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { User, Course, Enrollment, StudentAssignment, Lesson } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');


// Получение данных текущего пользователя 
router.get('/users/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { 
                exclude: ['password_hash', 'reset_token', 'reset_token_expires'] 
            },
            include: [{
                model: Enrollment,
                as: 'studentEnrollments', 
                include: [{
                    model: Course,
                    as: 'course', 
                    attributes: ['id', 'title', 'level']
                }]
            }]
        });

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Пользователь не найден' 
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                name: `${user.first_name} ${user.last_name}`.trim(),  
                email: user.email,
                role: user.role,
                first_name: user.first_name,
                last_name: user.last_name,
                enrollments: user.studentEnrollments || []  
            }
        });

    } catch (error) {
        console.error('Ошибка получения данных пользователя:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка сервера' 
        });
    }
});

// СТУДЕНТ

// Получение курсов студента 
router.get('/enrollments/my-courses', authenticateToken, requireRole(['student']), async (req, res) => {
    try {
        const enrollments = await Enrollment.findAll({
            where: { student_id: req.user.id }, 
            include: [{
                model: Course,
                as: 'course',  
                include: [{
                    model: User,
                    as: 'teacher',  
                    attributes: ['id', 'first_name', 'last_name', 'email']  
                }]
            }]
        });

        const courses = enrollments.map(enrollment => ({
            id: enrollment.course.id,
            title: enrollment.course.title,
            description: enrollment.course.description,
            level: enrollment.course.level,
            teacher_name: enrollment.course.teacher ? 
                `${enrollment.course.teacher.first_name} ${enrollment.course.teacher.last_name}` : 
                'Не назначен',
            progress: enrollment.progress || 0,
            enrolled_at: enrollment.purchased_at,  
            enrollment_id: enrollment.id
        }));

        res.json({
            success: true,
            courses
        });

    } catch (error) {
        console.error('Ошибка загрузки курсов:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка загрузки курсов' 
        });
    }
});

// Запись на курс 
router.post('/enrollments/:courseId', authenticateToken, requireRole(['student']), async (req, res) => {
    try {
        const { courseId } = req.params;
        
        // Проверяем, существует ли курс
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ 
                success: false, 
                message: 'Курс не найден' 
            });
        }

        // Проверяем, не записан ли уже
        const existingEnrollment = await Enrollment.findOne({
            where: { 
                student_id: req.user.id,  
                course_id: courseId 
            }
        });

        if (existingEnrollment) {
            return res.status(400).json({ 
                success: false, 
                message: 'Вы уже записаны на этот курс' 
            });
        }

        // Создаем запись
        const enrollment = await Enrollment.create({
            student_id: req.user.id,  
            course_id: courseId,
            progress: 0,
            purchased_at: new Date()  // Добавляем дату покупки
        });

        res.status(201).json({
            success: true,
            message: 'Вы успешно записались на курс',
            enrollment: {
                id: enrollment.id,
                course_id: enrollment.course_id,
                progress: enrollment.progress,
                purchased_at: enrollment.purchased_at
            }
        });

    } catch (error) {
        console.error('Ошибка записи на курс:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка записи на курс' 
        });
    }
});

// Отписка от курса 
router.delete('/enrollments/:enrollmentId', authenticateToken, requireRole(['student']), async (req, res) => {
    try {
        const { enrollmentId } = req.params;
        
        const enrollment = await Enrollment.findOne({
            where: { 
                id: enrollmentId, 
                student_id: req.user.id  
            }
        });

        if (!enrollment) {
            return res.status(404).json({ 
                success: false, 
                message: 'Запись на курс не найдена' 
            });
        }

        await enrollment.destroy();

        res.json({
            success: true,
            message: 'Вы отписались от курса'
        });

    } catch (error) {
        console.error('Ошибка отписки от курса:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка отписки от курса' 
        });
    }
});

// Получение заданий студента 
router.get('/assignments/my-assignments', authenticateToken, requireRole(['student']), async (req, res) => {
    try {
        // Получаем записи студента на курсы
        const enrollments = await Enrollment.findAll({
            where: { student_id: req.user.id },
            attributes: ['id']  // Берем только ID записей
        });

        const enrollmentIds = enrollments.map(e => e.id);

        if (enrollmentIds.length === 0) {
            return res.json({
                success: true,
                assignments: []
            });
        }

        // Находим задания для этих записей
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
        console.error('Ошибка загрузки заданий:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка загрузки заданий' 
        });
    }
});

// ПРЕПОДАВАТЕЛЬ

// Получение курсов преподавателя 
/*router.get('/courses/my-teaching', authenticateToken, requireRole(['teacher']), async (req, res) => {
    try {
        const courses = await Course.findAll({
            where: { teacher_id: req.user.id },
            include: [{
                model: Enrollment,
                as: 'enrollments',  // ИЗМЕНИТЬ: 'Enrollments' → 'enrollments'
                attributes: ['id', 'progress', 'purchased_at'],
                include: [{
                    model: User,
                    as: 'enrollmentStudent',  // ИЗМЕНИТЬ: 'User' → 'enrollmentStudent'
                    attributes: ['id', 'first_name', 'last_name', 'email']
                }]
            }]
        });

        const formattedCourses = courses.map(course => ({
            id: course.id,
            title: course.title,
            description: course.description,
            level: course.level,
            student_count: course.enrollments ? course.enrollments.length : 0,  // ИЗМЕНИТЬ
            assignments_pending: 0, // TODO: посчитать задания на проверку
            created_at: course.created_at,
            enrollments: course.enrollments || []  // ИЗМЕНИТЬ
        }));

        res.json({
            success: true,
            courses: formattedCourses
        });

    } catch (error) {
        console.error('Ошибка загрузки курсов преподавателя:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка загрузки курсов' 
        });
    }
});*/
// Получение курсов преподавателя 
/*router.get('/courses/my-teaching', authenticateToken, requireRole(['teacher']), async (req, res) => {
    console.log('🎯 ========== ЗАПРОС КУРСОВ ПРЕПОДАВАТЕЛЯ ==========');
    console.log('👤 Пользователь ID:', req.user.id);
    console.log('🎭 Роль пользователя:', req.user.role);
    console.log('📧 Email пользователя:', req.user.email);
    
    try {
        const courses = await Course.findAll({
            where: { teacher_id: req.user.id },
            include: [{
                model: Enrollment,
                as: 'enrollments',
                attributes: ['id', 'progress', 'purchased_at'],
                include: [{
                    model: User,
                    as: 'enrollmentStudent',
                    attributes: ['id', 'first_name', 'last_name', 'email']
                }]
            }]
        });

        console.log(`📚 Найдено курсов в БД: ${courses.length}`);

        const formattedCourses = courses.map(course => ({
            id: course.id,
            title: course.title,
            description: course.description,
            level: course.level,
            student_count: course.enrollments ? course.enrollments.length : 0,
            assignments_pending: 0,
            created_at: course.created_at,
            enrollments: course.enrollments || []
        }));

        console.log('✅ Форматированные курсы:', formattedCourses);

        res.json({
            success: true,
            courses: formattedCourses
        });

    } catch (error) {
        console.error('❌ Ошибка загрузки курсов преподавателя:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка загрузки курсов' 
        });
    }
});*/

// Получение курсов преподавателя 
router.get('/courses/my-teaching', authenticateToken, requireRole(['teacher']), async (req, res) => {
    console.log('🎯 ========== ЗАПРОС /api/courses/my-teaching ==========');
    console.log('👤 Пользователь:', {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
    });
    
    try {
        console.log('🔍 Ищем курсы с teacher_id =', req.user.id);
        
        const courses = await Course.findAll({
            where: { teacher_id: req.user.id },
            include: [{
                model: Enrollment,
                as: 'enrollments',
                attributes: ['id']
            }]
        });

        console.log(`📚 Найдено курсов: ${courses.length}`);
        
        if (courses.length === 0) {
            console.log('ℹ️ Курсы не найдены, возвращаем пустой массив');
        }

        const formattedCourses = courses.map(course => ({
            id: course.id,
            title: course.title || 'Без названия',
            description: course.description || 'Описание отсутствует',
            level: course.level || 'basic',
            student_count: course.enrollments ? course.enrollments.length : 0,
            assignments_pending: 0,
            created_at: course.created_at
        }));

        console.log('✅ Отправляем ответ:', { 
            success: true, 
            count: formattedCourses.length 
        });

        res.json({
            success: true,
            courses: formattedCourses
        });

    } catch (error) {
        console.error('❌ Ошибка в /courses/my-teaching:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка загрузки курсов',
            message: error.message 
        });
    }
});

// Альтернативный эндпоинт для курсов преподавателя
router.get('/teacher-courses', authenticateToken, requireRole(['teacher']), async (req, res) => {
    console.log('🎯 Запрос /api/teacher-courses от преподавателя ID:', req.user.id);
    
    try {
        const courses = await Course.findAll({
            where: { teacher_id: req.user.id },
            attributes: ['id', 'title', 'description', 'level', 'created_at']
        });

        const formattedCourses = courses.map(course => ({
            id: course.id,
            title: course.title || 'Без названия',
            description: course.description || 'Описание отсутствует',
            level: course.level || 'basic',
            student_count: 0, // Нужно будет посчитать
            assignments_pending: 0,
            created_at: course.created_at
        }));

        console.log(`📚 Отправляем ${formattedCourses.length} курсов`);

        res.json({
            success: true,
            courses: formattedCourses
        });

    } catch (error) {
        console.error('❌ Ошибка в /teacher-courses:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка загрузки курсов' 
        });
    }
});

// УПРАВЛЕНИЕ КУРСАМИ

// Получение данных курса для редактирования
router.get('/courses/:id/manage', authenticateToken, requireRole(['teacher']), async (req, res) => {
    try {
        const courseId = req.params.id;
        
        const course = await Course.findOne({
            where: { 
                id: courseId,
                teacher_id: req.user.id // Проверяем, что курс принадлежит преподавателю
            },
            include: [
                {
                    model: Module,
                    as: 'modules',
                    include: [{
                        model: Lesson,
                        as: 'lessons',
                        attributes: ['id', 'title', 'content_type', 'content_url', 'order']
                    }],
                    order: [['order', 'ASC']]
                },
                {
                    model: Enrollment,
                    as: 'enrollments',
                    attributes: ['id', 'progress', 'purchased_at'],
                    include: [{
                        model: User,
                        as: 'enrollmentStudent',
                        attributes: ['id', 'first_name', 'last_name', 'email']
                    }]
                }
            ]
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Курс не найден или у вас нет прав'
            });
        }

        res.json({
            success: true,
            course: {
                id: course.id,
                title: course.title,
                description: course.description,
                level: course.level,
                price: course.price,
                teacher_id: course.teacher_id,
                modules: course.modules || [],
                enrollments: course.enrollments || [],
                student_count: course.enrollments ? course.enrollments.length : 0
            }
        });

    } catch (error) {
        console.error('Ошибка загрузки данных курса:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка загрузки данных курса' 
        });
    }
});

// Создание нового курса
router.post('/courses', authenticateToken, requireRole(['teacher']), async (req, res) => {
    try {
        const { title, description, level, price } = req.body;
        
        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: 'Название и описание обязательны'
            });
        }

        const course = await Course.create({
            title,
            description,
            level: level || 'basic',
            price: price || 0,
            teacher_id: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Курс успешно создан',
            course: {
                id: course.id,
                title: course.title,
                description: course.description,
                level: course.level
            }
        });

    } catch (error) {
        console.error('Ошибка создания курса:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка создания курса' 
        });
    }
});

// Обновление курса
router.put('/courses/:id', authenticateToken, requireRole(['teacher']), async (req, res) => {
    try {
        const courseId = req.params.id;
        const { title, description, level, price } = req.body;
        
        const course = await Course.findOne({
            where: { 
                id: courseId,
                teacher_id: req.user.id
            }
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Курс не найден или у вас нет прав'
            });
        }

        // Обновляем поля
        if (title !== undefined) course.title = title;
        if (description !== undefined) course.description = description;
        if (level !== undefined) course.level = level;
        if (price !== undefined) course.price = price;
        
        await course.save();

        res.json({
            success: true,
            message: 'Курс успешно обновлен',
            course: {
                id: course.id,
                title: course.title,
                description: course.description,
                level: course.level,
                price: course.price
            }
        });

    } catch (error) {
        console.error('Ошибка обновления курса:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка обновления курса' 
        });
    }
});

// Удаление курса
router.delete('/courses/:id', authenticateToken, requireRole(['teacher']), async (req, res) => {
    try {
        const courseId = req.params.id;
        
        const course = await Course.findOne({
            where: { 
                id: courseId,
                teacher_id: req.user.id
            }
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Курс не найден или у вас нет прав'
            });
        }

        await course.destroy();

        res.json({
            success: true,
            message: 'Курс успешно удален'
        });

    } catch (error) {
        console.error('Ошибка удаления курса:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка удаления курса' 
        });
    }
});

//  УПРАВЛЕНИЕ МОДУЛЯМИ

// Создание модуля
router.post('/courses/:courseId/modules', authenticateToken, requireRole(['teacher']), async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const { title, description, order } = req.body;
        
        // Проверяем, что курс принадлежит преподавателю
        const course = await Course.findOne({
            where: { 
                id: courseId,
                teacher_id: req.user.id
            }
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Курс не найден или у вас нет прав'
            });
        }

        const module = await Module.create({
            title,
            description: description || '',
            course_id: courseId,
            order: order || 0
        });

        res.status(201).json({
            success: true,
            message: 'Модуль успешно создан',
            module: {
                id: module.id,
                title: module.title,
                description: module.description,
                order: module.order
            }
        });

    } catch (error) {
        console.error('Ошибка создания модуля:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка создания модуля' 
        });
    }
});

// Обновление модуля
router.put('/modules/:id', authenticateToken, requireRole(['teacher']), async (req, res) => {
    try {
        const moduleId = req.params.id;
        const { title, description, order } = req.body;
        
        const module = await Module.findOne({
            where: { id: moduleId },
            include: [{
                model: Course,
                as: 'course',
                where: { teacher_id: req.user.id }
            }]
        });

        if (!module) {
            return res.status(404).json({
                success: false,
                message: 'Модуль не найден или у вас нет прав'
            });
        }

        if (title !== undefined) module.title = title;
        if (description !== undefined) module.description = description;
        if (order !== undefined) module.order = order;
        
        await module.save();

        res.json({
            success: true,
            message: 'Модуль успешно обновлен',
            module: {
                id: module.id,
                title: module.title,
                description: module.description,
                order: module.order
            }
        });

    } catch (error) {
        console.error('Ошибка обновления модуля:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка обновления модуля' 
        });
    }
});

// Удаление модуля
router.delete('/modules/:id', authenticateToken, requireRole(['teacher']), async (req, res) => {
    try {
        const moduleId = req.params.id;
        
        const module = await Module.findOne({
            where: { id: moduleId },
            include: [{
                model: Course,
                as: 'course',
                where: { teacher_id: req.user.id }
            }]
        });

        if (!module) {
            return res.status(404).json({
                success: false,
                message: 'Модуль не найден или у вас нет прав'
            });
        }

        await module.destroy();

        res.json({
            success: true,
            message: 'Модуль успешно удален'
        });

    } catch (error) {
        console.error('Ошибка удаления модуля:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка удаления модуля' 
        });
    }
});
//АДМИНИСТРАТОР

// Статистика для администратора
router.get('/admin/stats', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        // Основная статистика
        const [
            totalUsers,
            totalTeachers,
            totalStudents,
            totalCourses,
            totalEnrollments,
            recentEnrollments
        ] = await Promise.all([
            User.count(),
            User.count({ where: { role: 'teacher' } }),
            User.count({ where: { role: 'student' } }),
            Course.count(),
            Enrollment.count(),
            Enrollment.count({ 
                where: { 
                    purchased_at: {  
                        [Op.gte]: new Date(new Date() - 7 * 24 * 60 * 60 * 1000) 
                    } 
                } 
            })
        ]);

        // Статистика по курсам
        const courseStats = await Course.findAll({
            include: [{
                model: Enrollment,
                as: 'enrollments',
                attributes: ['id']
            }],
            attributes: [
                'id', 
                'title', 
                'level',
                [sequelize.fn('COUNT', sequelize.col('enrollments.id')), 'student_count']
            ],
            group: ['Course.id'],
            order: [[sequelize.literal('student_count'), 'DESC']],
            limit: 10
        });

        res.json({
            success: true,
            stats: {
                total_users: totalUsers,
                total_teachers: totalTeachers,
                total_students: totalStudents,
                total_courses: totalCourses,
                total_enrollments: totalEnrollments,
                recent_enrollments: recentEnrollments,
                popular_courses: courseStats
            }
        });

    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка загрузки статистики' 
        });
    }
});


// Прогресс студента по курсу
router.get('/courses/:courseId/progress', authenticateToken, requireRole(['student']), async (req, res) => {
    try {
        const { courseId } = req.params;
        
        const enrollment = await Enrollment.findOne({
            where: { 
                student_id: req.user.id,
                course_id: courseId 
            },
            include: [{
                model: Course,
                as: 'course',
                attributes: ['id', 'title', 'level']
            }]
        });

        if (!enrollment) {
            return res.status(404).json({ 
                success: false,
                message: 'Вы не записаны на этот курс' 
            });
        }

        res.json({
            success: true,
            progress: {
                course: {
                    id: enrollment.course.id,
                    title: enrollment.course.title,
                    level: enrollment.course.level
                },
                enrollment: {
                    id: enrollment.id,
                    progress: enrollment.progress,
                    purchased_at: enrollment.purchased_at
                },
                last_accessed: enrollment.updatedAt || enrollment.purchased_at
            }
        });

    } catch (error) {
        console.error('Ошибка загрузки прогресса:', error);
        res.status(500).json({ 
            success: false,
            message: 'Ошибка загрузки прогресса'
        });
    }
});

// Статистика для дашборда студента
router.get('/student/stats', authenticateToken, requireRole(['student']), async (req, res) => {
    try {
        // Количество курсов
        const enrollmentCount = await Enrollment.count({
            where: { student_id: req.user.id }
        });
        
        // Средний прогресс
        const enrollments = await Enrollment.findAll({
            where: { student_id: req.user.id },
            attributes: ['progress']
        });
        
        const avgProgress = enrollments.length > 0 
            ? enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length
            : 0;
        
        // Задания на проверку
        const pendingAssignments = await StudentAssignment.count({
            include: [{
                model: Enrollment,
                as: 'enrollment',
                where: { student_id: req.user.id }
            }],
            where: { status: 'submitted' }
        });
        
        res.json({
            success: true,
            stats: {
                course_count: enrollmentCount,
                avg_progress: Math.round(avgProgress),
                pending_assignments: pendingAssignments,
                completed_courses: enrollments.filter(e => e.progress >= 100).length
            }
        });
        
    } catch (error) {
        console.error('Error fetching student stats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка загрузки статистики' 
        });
    }
});

module.exports = router;