const express = require('express');
const router = express.Router();
const { Course, User, Enrollment, Module, Lesson } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');

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

router.get('/api-test/:id', async (req, res) => {
    try {
        const courseId = req.params.id;
        console.log('🧪 Тестирование API для курса ID:', courseId);
        
        //Проверяем существование курса
        const course = await Course.findByPk(courseId);
        
        if (!course) {
            return res.json({
                success: false,
                message: `Курс с ID ${courseId} не найден`,
                suggestion: 'Создайте курс через интерфейс администратора'
            });
        }
        
        // Проверяем связи
        const modulesCount = await Module.count({ where: { course_id: courseId } });
        const enrollmentsCount = await Enrollment.count({ where: { course_id: courseId } });
        
        res.json({
            success: true,
            course: {
                id: course.id,
                title: course.title,
                is_published: course.is_published,
                teacher_id: course.teacher_id
            },
            stats: {
                modules: modulesCount,
                enrollments: enrollmentsCount
            },
            endpoints: {
                get_course: `GET /api/courses/${courseId}`,
                enroll: `POST /api/courses/${courseId}/enroll`,
                enrollment_status: `GET /api/courses/${courseId}/enrollment-status`
            }
        });
        
    } catch (error) {
        console.error('❌ Тестовый маршрут ошибка:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
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
        
        const formattedCourses = courses.map(course => ({
            id: course.id,
            title: course.title,
            description: course.description || 'Описание курса',
            price: course.price,
            level: course.level,
            teacher: course.teacher ? 
                `${course.teacher.first_name} ${course.teacher.last_name}` : 
                'Преподаватель',
            modules_count: 3, 
            duration: course.level === 'basic' ? '8 недель' : 
                    course.level === 'advanced' ? '10 недель' : '6 недель'
        }));
        
        res.json(formattedCourses);
    } catch (error) {
        console.error('Error fetching public courses:', error);
        
        // Временные данные 
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
/*router.get('/:id', async (req, res) => {
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
});*/
// Получение курса с модулями и уроками
// Получение курса по ID с полной структурой (с модулями и уроками)
router.get('/:id', async (req, res) => {
    try {
        const courseId = req.params.id;
        console.log('📚 Запрос курса с модулями, ID:', courseId);
        
        // Получаем курс с учителем и модулями
        const course = await Course.findByPk(courseId, {
            include: [
                {
                    model: User,
                    as: 'teacher',
                    attributes: ['id', 'first_name', 'last_name', 'email']
                },
                {
                    model: Module,
                    as: 'modules',
                    required: false, 
                    include: [{
                        model: Lesson,
                        as: 'lessons',
                        required: false,
                        order: [['order_index', 'ASC']]
                    }],
                    order: [['order_index', 'ASC']]
                }
            ]
        });

        if (!course) {
            console.log('❌ Курс не найден:', courseId);
            return res.status(404).json({ error: 'Курс не найден' });
        }

        console.log('✅ Курс найден:', course.title);
        console.log('📦 Модулей найдено:', course.modules ? course.modules.length : 0);
        
        // Форматируем ответ
        const formattedCourse = {
            id: course.id,
            title: course.title,
            description: course.description,
            price: course.price,
            level: course.level,
            teacher: course.teacher ? {
                id: course.teacher.id,
                first_name: course.teacher.first_name,
                last_name: course.teacher.last_name,
                email: course.teacher.email,
                name: `${course.teacher.first_name} ${course.teacher.last_name}`
            } : null,
            video_call_link: course.video_call_link,
            is_published: course.is_published,
            created_at: course.created_at,
            // Добавляем модули 
            modules: course.modules ? course.modules.map(module => {
                console.log(`📝 Модуль: ${module.title}, уроков: ${module.lessons ? module.lessons.length : 0}`);
                return {
                    id: module.id,
                    title: module.title,
                    order_index: module.order_index,
                    // Добавляем уроки 
                    lessons: module.lessons ? module.lessons.map(lesson => ({
                        id: lesson.id,
                        title: lesson.title,
                        content_type: lesson.content_type,
                        order_index: lesson.order_index,
                        content: lesson.content,
                        description: lesson.content ? 
                            lesson.content.substring(0, 100) + (lesson.content.length > 100 ? '...' : '') : 
                            'Описание урока'
                    })) : []
                };
            }) : []
        };
        
        console.log('🎯 Отправляем курс с', formattedCourse.modules.length, 'модулями');
        res.json(formattedCourse);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки курса:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            error: 'Ошибка при загрузке курса',
            message: error.message,
            details: 'Проверьте ассоциации моделей Module и Lesson'
        });
    }
});

// Создание тестового модуля с уроками
router.post('/:id/create-test-module', async (req, res) => {
    try {
        const courseId = req.params.id;
        
        console.log('🔧 Создание тестового модуля для курса:', courseId);
        
        // Проверяем существование курса
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Курс не найден' });
        }
        
        // Создаем модуль
        const module = await Module.create({
            course_id: courseId,
            title: 'Основы композиции',
            order_index: 1
        });
        
        console.log('✅ Модуль создан:', module.id);
        
        // Создаем уроки
        const lessons = [
            {
                module_id: module.id,
                title: 'Правило третей',
                content_type: 'theory',
                content: 'Изучите основное правило композиции в фотографии. Правило третей делит кадр на 9 равных частей...',
                order_index: 1
            },
            {
                module_id: module.id,
                title: 'Практика: Съемка по правилу третей',
                content_type: 'creative_task',
                content: 'Снимите 3 фотографии с применением правила третей. Загрузите свои работы для проверки преподавателем.',
                order_index: 2
            },
            {
                module_id: module.id,
                title: 'Золотое сечение',
                content_type: 'theory',
                content: 'Более сложный принцип композиции - золотое сечение...',
                order_index: 3
            }
        ];
        
        for (const lessonData of lessons) {
            const lesson = await Lesson.create(lessonData);
            console.log(`📝 Урок создан: ${lesson.title} (${lesson.content_type})`);
        }
        
        res.json({
            success: true,
            message: 'Тестовый модуль с уроками создан',
            course_id: courseId,
            module_id: module.id,
            lessons_count: lessons.length
        });
        
    } catch (error) {
        console.error('❌ Ошибка создания тестового модуля:', error);
        res.status(500).json({ 
            error: 'Ошибка при создании тестового модуля',
            message: error.message 
        });
    }
});

// ФУНКЦИИ ДЛЯ ЛИЧНОГО КАБИНЕТА

router.get('/teacher/simple', authenticateToken, requireRole(['teacher']), async (req, res) => {
    try {
        console.log('🧪 Тестовый запрос курсов для преподавателя ID:', req.user.id);
        
        const courses = await Course.findAll({
            where: { teacher_id: req.user.id },
            attributes: ['id', 'title', 'description', 'level', 'is_published', 'created_at']
        });

        console.log(`✅ Найдено курсов: ${courses.length}`);
        
        const simpleCourses = courses.map(course => ({
            id: course.id,
            title: course.title,
            description: course.description,
            level: course.level,
            is_published: course.is_published,
            student_count: 0,
            assignments_pending: 0,
            created_at: course.created_at
        }));

        res.json({
            success: true,
            message: `Найдено ${courses.length} курсов`,
            courses: simpleCourses
        });
        
    } catch (error) {
        console.error('❌ Ошибка в тестовом endpoint:', error);
        res.status(500).json({ 
            success: false,
            error: 'Тестовая ошибка',
            details: error.message 
        });
    }
});
// Получение курсов преподавателя 
router.get('/teacher/my-courses', authenticateToken, requireRole(['teacher']), async (req, res) => {
    try {
        const courses = await Course.findAll({
            where: { teacher_id: req.user.id },
            include: [
                {
                    model: User,
                    as: 'teacher',
                    attributes: ['id', 'first_name', 'last_name', 'email']
                },
                {
                    model: Enrollment,
                    as: 'enrollments',
                    attributes: ['id', 'user_id', 'progress', 'status', 'created_at'],
                    include: [{
                        model: User,
                       as: 'enrollmentStudent', 
                        attributes: ['id', 'first_name', 'last_name', 'email']
                    }]
                }
            ],
            order: [['created_at', 'DESC']]
        });
        
        const formattedCourses = courses.map(course => ({
            id: course.id,
            title: course.title,
            description: course.description,
            price: course.price,
            level: course.level,
            is_published: course.is_published,
            student_count: course.Enrollments ? course.Enrollments.length : 0,
            assignments_pending: 0, 
            teacher: course.teacher ? {
                id: course.teacher.id,
                name: `${course.teacher.first_name} ${course.teacher.last_name}`,
                email: course.teacher.email
            } : null,
            enrollments: course.Enrollments ? course.Enrollments.map(enrollment => ({
                id: enrollment.id,
                user_id: enrollment.user_id,
                progress: enrollment.progress,
                status: enrollment.status,
                enrolled_at: enrollment.created_at,
                student: enrollment.User ? {
                    id: enrollment.User.id,
                    name: `${enrollment.User.first_name} ${enrollment.User.last_name}`,
                    email: enrollment.User.email
                } : null
            })) : [],
            created_at: course.created_at,
            updated_at: course.updated_at
        }));
        
        res.json({
            success: true,
            courses: formattedCourses
        });
    } catch (error) {
        console.error('Error fetching teacher courses:', error);
        res.status(500).json({ 
            success: false,
            error: 'Ошибка при загрузке курсов преподавателя',
            details: error.message 
        });
    }
});

// Создание курса
router.post('/', authenticateToken, requireRole(['teacher']), async (req, res) => {
    try {
        const { 
            title, 
            description, 
            level, 
            price, 
            category,
            video_call_link 
        } = req.body;

        // Валидация
        if (!title || !description) {
            return res.status(400).json({ 
                error: 'Название и описание курса обязательны' 
            });
        }

        const course = await Course.create({
            title,
            description,
            level: level || 'basic',
            price: price || 0,
            category: category || 'photography',
            video_call_link: video_call_link || null,
            teacher_id: req.user.id,
            is_published: false, // По умолчанию не опубликован
            created_at: new Date(),
            updated_at: new Date()
        });

        res.status(201).json({
            success: true,
            message: 'Курс успешно создан',
            course: {
                id: course.id,
                title: course.title,
                description: course.description,
                level: course.level,
                teacher_id: course.teacher_id,
                is_published: course.is_published
            }
        });

    } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({ 
            error: 'Ошибка при создании курса',
            details: error.message 
        });
    }
});
// Редактирование курса (только владелец-преподаватель)
router.put('/:id', authenticateToken, requireRole(['teacher']), async (req, res) => {
    try {
        const courseId = req.params.id;
        
        // Проверяем, принадлежит ли курс этому преподавателю
        const course = await Course.findOne({
            where: { 
                id: courseId, 
                teacher_id: req.user.id 
            }
        });

        if (!course) {
            return res.status(404).json({ 
                error: 'Курс не найден или у вас нет прав на его редактирование' 
            });
        }

        // Обновляем поля
        const updatableFields = [
            'title', 'description', 'level', 'price', 
            'category', 'video_call_link', 'is_published'
        ];
        
        updatableFields.forEach(field => {
            if (req.body[field] !== undefined) {
                course[field] = req.body[field];
            }
        });
        
        course.updated_at = new Date();
        await course.save();

        res.json({
            success: true,
            message: 'Курс успешно обновлен',
            course: {
                id: course.id,
                title: course.title,
                description: course.description,
                level: course.level,
                is_published: course.is_published,
                updated_at: course.updated_at
            }
        });

    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ 
            error: 'Ошибка при обновлении курса',
            details: error.message 
        });
    }
});

// Проверка, записан ли студент на курс
router.get('/:id/enrollment-status', authenticateToken, requireRole(['student']), async (req, res) => {
    try {
        const courseId = req.params.id;
        
        const enrollment = await Enrollment.findOne({
            where: { 
                student_id: req.user.id, 
                course_id: courseId 
            }
        });

        res.json({
            success: true,
            is_enrolled: !!enrollment,
            enrollment: enrollment ? {
                id: enrollment.id,
                progress: enrollment.progress,
                status: enrollment.status,
                enrolled_at: enrollment.created_at
            } : null
        });

    } catch (error) {
        console.error('Error checking enrollment:', error);
        res.status(500).json({ 
            success: false,
            error: 'Ошибка при проверке записи на курс'
        });
    }
});

// Запись студента на курс
/*router.post('/:id/enroll', authenticateToken, requireRole(['student']), async (req, res) => {
    try {
        const courseId = req.params.id;
        
        // Проверяем, существует ли курс
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ 
                success: false,
                error: 'Курс не найден' 
            });
        }

        // Проверяем, опубликован ли курс
        if (!course.is_published) {
            return res.status(400).json({ 
                success: false,
                error: 'Этот курс не доступен для записи' 
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
                error: 'Вы уже записаны на этот курс' 
            });
        }

        // Создаем запись
        const enrollment = await Enrollment.create({
            student_id: req.user.id,
            course_id: courseId,
            progress: 0,
            status: 'active',
            created_at: new Date(),
            updated_at: new Date()
        });

        res.status(201).json({
            success: true,
            message: 'Вы успешно записались на курс',
            enrollment: {
                id: enrollment.id,
                course_id: enrollment.course_id,
                progress: enrollment.progress,
                status: enrollment.status,
                enrolled_at: enrollment.created_at
            }
        });

    } catch (error) {
        console.error('Error enrolling in course:', error);
        res.status(500).json({ 
            success: false,
            error: 'Ошибка при записи на курс',
            details: error.message 
        });
    }
    console.log('📝 Запись на курс:', {
    courseId: req.params.id,
    userId: req.user.id,
    userRole: req.user.role,
    body: req.body
    });
});*/
// Запись студента на курс 
/*router.post('/:id/enroll', authenticateToken, requireRole(['student']), async (req, res) => {
    try {
        const courseId = req.params.id;
        const userId = req.user.id;
        
        console.log('📝 Запись на курс:', {
            courseId,
            userId,
            userRole: req.user.role
        });
        
        // Проверяем, существует ли курс
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ 
                success: false,
                error: 'Курс не найден' 
            });
        }

        // Проверяем, опубликован ли курс
        if (!course.is_published) {
            return res.status(400).json({ 
                success: false,
                error: 'Этот курс не доступен для записи' 
            });
        }

        // Проверяем, не записан ли уже
        const existingEnrollment = await Enrollment.findOne({
            where: { 
                student_id: userId,
                course_id: courseId 
            }
        });

        if (existingEnrollment) {
            return res.json({ 
                success: true,
                message: 'Вы уже записаны на этот курс',
                is_enrolled: true,
                enrollment: existingEnrollment
            });
        }

        // Создаем запись
        const enrollment = await Enrollment.create({
            student_id: userId,
            course_id: courseId,
            progress: 0,
            purchased_at: new Date()
        });

        console.log('✅ Студент записан на курс:', enrollment.id);

        res.status(201).json({
            success: true,
            message: 'Вы успешно записались на курс',
            is_enrolled: true,
            enrollment: {
                id: enrollment.id,
                student_id: enrollment.student_id,
                course_id: enrollment.course_id,
                progress: enrollment.progress,
                purchased_at: enrollment.purchased_at
            }
        });

    } catch (error) {
        console.error('❌ Ошибка записи на курс:', error);
        res.status(500).json({ 
            success: false,
            error: 'Ошибка при записи на курс',
            details: error.message 
        });
    }
});*/

// Запись студента на курс 
router.post('/:id/enroll', authenticateToken, requireRole(['student']), async (req, res) => {
    try {
        const courseId = req.params.id;
        const userId = req.user.id;
        
        console.log('🎯 Запись студента на курс:');
        console.log('   👤 Студент ID:', userId);
        console.log('   📚 Курс ID:', courseId);
        
        // Проверяем, существует ли курс
        const course = await Course.findByPk(courseId);
        if (!course) {
            console.log('❌ Курс не найден');
            return res.status(404).json({ 
                success: false,
                error: 'Курс не найден' 
            });
        }

        // Проверяем, опубликован ли курс
        if (!course.is_published) {
            console.log('❌ Курс не опубликован');
            return res.status(400).json({ 
                success: false,
                error: 'Этот курс не доступен для записи' 
            });
        }

        // Проверяем, не записан ли уже
        const existingEnrollment = await Enrollment.findOne({
            where: { 
                student_id: userId,
                course_id: courseId 
            }
        });

        if (existingEnrollment) {
            console.log('ℹ️ Студент уже записан');
            return res.json({ 
                success: true,
                message: 'Вы уже записаны на этот курс',
                is_enrolled: true,
                enrollment: existingEnrollment
            });
        }

        // Создаем запись
        const enrollment = await Enrollment.create({
            student_id: userId,
            course_id: courseId,
            progress: 0,
            purchased_at: new Date()
        });

        console.log('✅ Студент успешно записан, ID записи:', enrollment.id);

        res.status(201).json({
            success: true,
            message: 'Вы успешно записались на курс',
            is_enrolled: true,
            enrollment: {
                id: enrollment.id,
                student_id: enrollment.student_id,
                course_id: enrollment.course_id,
                progress: enrollment.progress,
                purchased_at: enrollment.purchased_at
            }
        });

    } catch (error) {
        console.error('❌ Ошибка записи на курс:', error);
        res.status(500).json({ 
            success: false,
            error: 'Ошибка при записи на курс',
            details: error.message 
        });
    }
});


// Получение прогресса студента по курсу
router.get('/:id/progress', authenticateToken, requireRole(['student']), async (req, res) => {
    try {
        const courseId = req.params.id;
        
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
                error: 'Вы не записаны на этот курс' 
            });
        }

        const detailedProgress = {
            course: {
                id: enrollment.Course.id,
                title: enrollment.Course.title,
                level: enrollment.Course.level
            },
            enrollment: {
                id: enrollment.id,
                progress: enrollment.progress,
                status: enrollment.status,
                enrolled_at: enrollment.created_at
            },
            modules_progress: [], 
            last_accessed: enrollment.updated_at
        };

        res.json({
            success: true,
            progress: detailedProgress
        });

    } catch (error) {
        console.error('Error fetching course progress:', error);
        res.status(500).json({ 
            success: false,
            error: 'Ошибка при загрузке прогресса'
        });
    }
});

// Получение всех курсов для администратора (включая неопубликованные)
router.get('/admin/all', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const courses = await Course.findAll({
            include: [{
                model: User,
                as: 'teacher',
                attributes: ['id', 'first_name', 'last_name', 'email']
            }],
            order: [['created_at', 'DESC']]
        });
        
        const stats = {
            total: courses.length,
            published: courses.filter(c => c.is_published).length,
            unpublished: courses.filter(c => !c.is_published).length,
            by_level: {
                basic: courses.filter(c => c.level === 'basic').length,
                advanced: courses.filter(c => c.level === 'advanced').length,
                specialized: courses.filter(c => c.level === 'specialized').length
            }
        };
        
        res.json({
            success: true,
            stats,
            courses: courses.map(course => ({
                id: course.id,
                title: course.title,
                description: course.description,
                price: course.price,
                level: course.level,
                is_published: course.is_published,
                teacher: course.teacher ? {
                    id: course.teacher.id,
                    name: `${course.teacher.first_name} ${course.teacher.last_name}`,
                    email: course.teacher.email
                } : null,
                created_at: course.created_at,
                updated_at: course.updated_at
            }))
        });
    } catch (error) {
        console.error('Error fetching all courses:', error);
        res.status(500).json({ 
            success: false,
            error: 'Ошибка при загрузке всех курсов'
        });
    }
});

// Публикация/снятие с публикации курса
router.post('/:id/toggle-publish', authenticateToken, requireRole(['admin', 'teacher']), async (req, res) => {
    try {
        const courseId = req.params.id;
        
        // Для преподавателя проверяем, что курс его
        let whereCondition = { id: courseId };
        if (req.user.role === 'teacher') {
            whereCondition.teacher_id = req.user.id;
        }

        const course = await Course.findOne({ where: whereCondition });

        if (!course) {
            return res.status(404).json({ 
                success: false,
                error: 'Курс не найден или у вас нет прав' 
            });
        }

        course.is_published = !course.is_published;
        course.updated_at = new Date();
        await course.save();

        res.json({
            success: true,
            message: `Курс ${course.is_published ? 'опубликован' : 'снят с публикации'}`,
            course: {
                id: course.id,
                title: course.title,
                is_published: course.is_published,
                updated_at: course.updated_at
            }
        });

    } catch (error) {
        console.error('Error toggling publish:', error);
        res.status(500).json({ 
            success: false,
            error: 'Ошибка при изменении статуса публикации'
        });
    }
});

// Удаление курса (только преподаватель)
router.delete('/:id', authenticateToken, requireRole(['teacher', 'admin']), async (req, res) => {
    try {
        const courseId = req.params.id;
        
        // Для преподавателя проверяем, что курс его
        let whereCondition = { id: courseId };
        if (req.user.role === 'teacher') {
            whereCondition.teacher_id = req.user.id;
        }

        const course = await Course.findOne({ where: whereCondition });

        if (!course) {
            return res.status(404).json({ 
                success: false,
                error: 'Курс не найден или у вас нет прав' 
            });
        }

        // Проверяем, есть ли студенты на курсе
        const studentCount = await Enrollment.count({ where: { course_id: courseId } });
        if (studentCount > 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Нельзя удалить курс, на котором есть студенты. Сначала отчислите всех студентов.'
            });
        }

        await course.destroy();

        res.json({
            success: true,
            message: 'Курс успешно удален'
        });

    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({ 
            success: false,
            error: 'Ошибка при удалении курса'
        });
    }
});


// УПРАВЛЕНИЕ МОДУЛЯМИ 

// Создание модуля для курса
router.post('/:courseId/modules', authenticateToken, requireRole(['teacher']), async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const { title, description, order_index } = req.body;
        
        console.log('📝 Создание модуля. Данные:', { title, description, order_index, courseId });
        
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
            title: title || 'Новый модуль',
            description: description || '',
            course_id: courseId,
            order_index: order_index || 0
        });

        console.log('✅ Модуль создан:', module.id);

        res.status(201).json({
            success: true,
            message: 'Модуль успешно создан',
            module: {
                id: module.id,
                title: module.title,
                description: module.description,
                order_index: module.order_index
            }
        });

    } catch (error) {
        console.error('❌ Ошибка создания модуля:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка создания модуля',
            error: error.message 
        });
    }
});

// Создание урока в модуле
router.post('/modules/:moduleId/lessons', authenticateToken, requireRole(['teacher']), async (req, res) => {
    try {
        const moduleId = req.params.moduleId;
        const { title, content_type, content, order_index } = req.body;
        
        console.log('📝 Создание урока. Данные:', { title, content_type, moduleId });
        
        // Проверяем права через цепочку: урок → модуль → курс → преподаватель
        const module = await Module.findByPk(moduleId, {
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

        const lesson = await Lesson.create({
            title: title || 'Новый урок',
            content_type: content_type || 'theory',
            content: content || '',
            module_id: moduleId,
            order_index: order_index || 0
        });

        console.log('✅ Урок создан:', lesson.id);

        res.status(201).json({
            success: true,
            message: 'Урок успешно создан',
            lesson: {
                id: lesson.id,
                title: lesson.title,
                content_type: lesson.content_type,
                content: lesson.content,
                order_index: lesson.order_index
            }
        });

    } catch (error) {
        console.error('❌ Ошибка создания урока:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка создания урока',
            error: error.message 
        });
    }
});

// Удаление модуля
router.delete('/modules/:moduleId', authenticateToken, requireRole(['teacher']), async (req, res) => {
    try {
        const moduleId = req.params.moduleId;
        
        const module = await Module.findByPk(moduleId, {
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
        console.error('❌ Ошибка удаления модуля:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка удаления модуля',
            error: error.message 
        });
    }
});

// Получение студентов курса для преподавателя
router.get('/:courseId/students', authenticateToken, requireRole(['teacher']), async (req, res) => {
    try {
        const courseId = req.params.courseId;
        
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

        // Получаем студентов курса
        const enrollments = await Enrollment.findAll({
            where: { course_id: courseId },
            include: [{
                model: User,
                as: 'student',
                attributes: ['id', 'first_name', 'last_name', 'email', 'created_at']
            }],
            order: [['purchased_at', 'DESC']]
        });

        const students = enrollments.map(enrollment => ({
            id: enrollment.id,
            student_id: enrollment.student_id,
            first_name: enrollment.enrollmentStudent?.first_name || '',
            last_name: enrollment.enrollmentStudent?.last_name || '',
            email: enrollment.enrollmentStudent?.email || '',
            enrolled_at: enrollment.purchased_at,
            progress: enrollment.progress || 0
        }));

        res.json({
            success: true,
            course: {
                id: course.id,
                title: course.title
            },
            students: students,
            count: students.length
        });

    } catch (error) {
        console.error('❌ Ошибка загрузки студентов:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка загрузки студентов',
            error: error.message 
        });
    }
});
module.exports = router;