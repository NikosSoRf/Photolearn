const express = require('express');
const router = express.Router();

// Временные данные для тестирования
let mockEnrollments = [
    {
        id: 1,
        student_id: 1,
        course_id: 1,
        purchased_at: new Date().toISOString(),
        progress: 30
    }
];

// Запись на курс
router.post('/', (req, res) => {
    try {
        const { course_id } = req.body;
        const student_id = 1; // Временно - тестовый студент
        
        // Проверяем, не записан ли уже
        const existing = mockEnrollments.find(e => 
            e.student_id === student_id && e.course_id === course_id
        );
        
        if (existing) {
            return res.status(400).json({ 
                error: 'Вы уже записаны на этот курс' 
            });
        }
        
        // Создаем запись
        const newEnrollment = {
            id: mockEnrollments.length + 1,
            student_id,
            course_id,
            purchased_at: new Date().toISOString(),
            progress: 0
        };
        
        mockEnrollments.push(newEnrollment);
        
        res.status(201).json({
            success: true,
            message: 'Вы успешно записались на курс!',
            enrollment: newEnrollment
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получение курсов студента
router.get('/my-courses', (req, res) => {
    const student_id = 1; // Временно - тестовый студент
    
    const studentCourses = mockEnrollments
        .filter(e => e.student_id === student_id)
        .map(e => ({
            id: e.course_id,
            title: 'Основы фотографии',
            description: 'Тестовый курс',
            progress: e.progress,
            teacher: 'Анна Фотографова',
            enrolled_at: e.purchased_at,
            enrollment_id: e.id
        }));
    
    res.json(studentCourses);
});

// Проверка записи на курс
router.get('/check/:course_id', (req, res) => {
    const student_id = 1;
    const course_id = parseInt(req.params.course_id);
    
    const enrollment = mockEnrollments.find(e => 
        e.student_id === student_id && e.course_id === course_id
    );
    
    if (enrollment) {
        res.json({
            enrolled: true,
            progress: enrollment.progress,
            enrollment: enrollment
        });
    } else {
        res.json({
            enrolled: false
        });
    }
});

// Удаление записи
router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    mockEnrollments = mockEnrollments.filter(e => e.id !== id);
    
    res.json({ 
        success: true, 
        message: 'Запись удалена' 
    });
});

// Информация о API
router.get('/', (req, res) => {
    res.json({
        message: 'Enrollments API (basic version)',
        endpoints: {
            enroll: 'POST /',
            my_courses: 'GET /my-courses',
            check: 'GET /check/:course_id',
            delete: 'DELETE /:id'
        },
        current_enrollments: mockEnrollments
    });
});

module.exports = router;