const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { User, Course, Enrollment, Lesson, StudentAssignment } = require('../models');
const router = express.Router();

// Получить профиль текущего пользователя
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          created_at: user.created_at
        }
      }
    });
  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка сервера' 
    });
  }
});

// Получить курсы пользователя
router.get('/courses', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const enrollments = await Enrollment.findAll({
      where: { student_id: userId },
      include: [
        {
          model: Course,
          as: 'course',
          include: [
            {
              model: User,
              as: 'teacher',
              attributes: ['id', 'first_name', 'last_name']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const courses = enrollments.map(enrollment => ({
      id: enrollment.course.id,
      title: enrollment.course.title,
      description: enrollment.course.description,
      level: enrollment.course.level,
      progress: enrollment.progress,
      teacher: enrollment.course.teacher,
      enrollment_date: enrollment.created_at
    }));

    res.json({
      success: true,
      data: { courses }
    });
  } catch (error) {
    console.error('Ошибка получения курсов:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка сервера' 
    });
  }
});

// Получить задания пользователя
router.get('/assignments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const assignments = await StudentAssignment.findAll({
      include: [
        {
          model: Enrollment,
          as: 'enrollment',
          where: { student_id: userId },
          include: [
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
          attributes: ['id', 'title', 'content_type']
        }
      ],
      order: [['submitted_at', 'DESC']],
      limit: 10
    });

    const formattedAssignments = assignments.map(assignment => ({
      id: assignment.id,
      title: assignment.lesson.title,
      course: assignment.enrollment.course.title,
      course_id: assignment.enrollment.course.id,
      photo_url: assignment.photo_url,
      submitted_at: assignment.submitted_at,
      status: assignment.status,
      teacher_comment: assignment.teacher_comment,
      grade: assignment.grade
    }));

    res.json({
      success: true,
      data: { assignments: formattedAssignments }
    });
  } catch (error) {
    console.error('Ошибка получения заданий:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка сервера' 
    });
  }
});

// Получить статистику пользователя
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Количество курсов
    const coursesCount = await Enrollment.count({
      where: { student_id: userId }
    });

    // Средний прогресс
    const enrollments = await Enrollment.findAll({
      where: { student_id: userId },
      attributes: ['progress']
    });

    const totalProgress = enrollments.reduce((sum, enrollment) => sum + enrollment.progress, 0);
    const averageProgress = enrollments.length > 0 ? Math.round(totalProgress / enrollments.length) : 0;

    // Задания по статусам
    const assignmentsStats = await StudentAssignment.findAll({
      include: [
        {
          model: Enrollment,
          as: 'enrollment',
          where: { student_id: userId }
        }
      ],
      attributes: ['status'],
      raw: true
    });

    const pendingCount = assignmentsStats.filter(a => a.status === 'submitted' || a.status === 'under_review').length;
    const completedCount = assignmentsStats.filter(a => a.status === 'completed').length;

    res.json({
      success: true,
      data: {
        stats: {
          courses_count: coursesCount,
          average_progress: averageProgress,
          pending_assignments: pendingCount,
          completed_assignments: completedCount
        }
      }
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка сервера' 
    });
  }
});

module.exports = router;