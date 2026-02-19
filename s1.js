const express = require('express');
const cors = require('cors');
const path = require('path');
//require('dotenv').config();
require('dotenv').config({ path: '.env' }); 

// Импортируем модели
const { syncModels, User, Course, Module, Lesson } = require('./models');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Основные маршруты
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
//app.use('/api/courses', require('./routes/courses-step1'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/modules', require('./routes/modules-clean'));
app.use('/api/lessons', require('./routes/lessons'));
app.use('/api', require('./routes/dashboard'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/assignments', require('./routes/assignments'));

// Статические страницы
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'main.html')));
app.get('/courses', (req, res) => res.sendFile(path.join(__dirname, 'public', 'courses.html')));
app.get('/first_course', (req, res) => res.sendFile(path.join(__dirname, 'public', 'first_course.html')));
app.get('/lesson', (req, res) => res.sendFile(path.join(__dirname, 'public', 'lesson.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));


app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'PhotoLearn'
    });
});
// тестовый маршрут
app.get('/api/test-course/:id', async (req, res) => {
    res.json({
        success: true,
        data: {
            id: req.params.id,
            title: "Основы фотографии",
            description: "Тестовый курс для отладки",
            price: 0,
            level: "basic",
            teacher: {
                name: "Тест Преподаватель",
                email: "teacher@test.com"
            },
            is_published: true
        }
    });
});

app.post('/api/test-enroll', async (req, res) => {
    res.json({
        success: true,
        message: "Тестовая запись успешна!",
        enrollment: {
            id: 999,
            course_id: req.body.course_id,
            user_id: req.body.user_id,
            status: "active"
        }
    });
});
// Создание тестовых данных
app.get('/api/dev/create-test-data', async (req, res) => {
    try {
        const { User, Course, Module, Lesson } = require('./models');
        const bcrypt = require('bcryptjs');
        
        // Проверяем, есть ли уже тестовый преподаватель
        let teacher = await User.findOne({ 
            where: { email: 'teacher@photolearn.com' } 
        });
        
        if (!teacher) {
            const hashedPassword = await bcrypt.hash('teacher123', 10);
            teacher = await User.create({
                email: 'teacher@photolearn.com',
                password_hash: hashedPassword,
                role: 'teacher',
                first_name: 'Анна',
                last_name: 'Фотографова'
            });
        }
        
        // Проверяем, есть ли уже тестовый курс
        let course = await Course.findOne({ 
            where: { title: 'Основы фотографии для начинающих' } 
        });
        
        if (!course) {
            course = await Course.create({
                title: 'Основы фотографии для начинающих',
                description: 'Научитесь основам композиции, работы с освещением и настройками камеры. Идеальный курс для тех, кто только начинает свой путь в фотографии.',
                price: 0,
                level: 'basic',
                teacher_id: teacher.id,
                video_call_link: 'https://meet.google.com/abc-defg-hij',
                is_published: true
            });
            
            // Создаем модуль
            const module = await Module.create({
                course_id: course.id,
                title: 'Введение в фотографию',
                order_index: 1
            });
            
            // Создаем уроки
            await Lesson.create({
                module_id: module.id,
                title: 'Основы композиции',
                content_type: 'theory',
                content: 'Изучите правило третей, золотое сечение и другие принципы композиции.',
                order_index: 1
            });
            
            await Lesson.create({
                module_id: module.id,
                title: 'Практика: Съемка с разной экспозицией',
                content_type: 'creative_task',
                content: 'Снимите 3 фотографии одного объекта с разной экспозицией.',
                order_index: 2
            });
        }
        
        res.json({
            success: true,
            message: 'Тестовые данные созданы успешно!',
            course_id: course.id
        });
        
    } catch (error) {
        console.error('Error creating test data:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Получение тестовых курсов 
app.get('/api/dev/test-courses', async (req, res) => {
    try {
        const courses = await Course.findAll({
            include: [{
                model: User,
                as: 'teacher',
                attributes: ['id', 'first_name', 'last_name', 'email']
            }]
        });
        
        res.json({
            count: courses.length,
            courses: courses.map(course => ({
                id: course.id,
                title: course.title,
                description: course.description,
                price: course.price,
                level: course.level,
                teacher: course.teacher ? `${course.teacher.first_name} ${course.teacher.last_name}` : null,
                is_published: course.is_published
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.use('/api/:any', (req, res) => {
    res.status(404).json({ 
        error: 'API endpoint not found', 
        requested: req.originalUrl,
        available: [
            '/api/health',
            '/api/courses',
            '/api/dev/create-test-data',
            '/api/dev/test-courses'
        ]
    });
});


app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});


async function startServer() {
    try {
        // Синхронизируем базу данных
        console.log('Syncing database...');
        await syncModels();
        console.log('Database synced successfully');
        
        // Запускаем сервер
        app.listen(PORT, () => {
            console.log('\n' + '='.repeat(50));
            console.log('PHOTOLEARN СЕРВЕР ЗАПУЩЕН');
            console.log('='.repeat(50));
            console.log(`Порт: ${PORT}`);
            console.log(`URL: http://localhost:${PORT}`);
            console.log('='.repeat(50));
        });
        
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}


startServer();