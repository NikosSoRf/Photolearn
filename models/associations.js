const setupAssociations = (models) => {
  const { User, Course, Enrollment, StudentAssignment, Module, Lesson } = models;
  
  console.log('🔄 Настраиваем связи между моделями...');
  
  // ========== ОСНОВНЫЕ АССОЦИАЦИИ ==========
  
  // 1. User -> Enrollment (студент имеет записи на курсы)
  User.hasMany(Enrollment, {
    foreignKey: 'student_id',
    as: 'studentEnrollments'
  });
  
  // 2. User -> Course (преподаватель ведет курсы)
  User.hasMany(Course, {
    foreignKey: 'teacher_id',
    as: 'taughtCourses'
  });
  
  // 3. Course -> User (курс принадлежит преподавателю)
  Course.belongsTo(User, {
    foreignKey: 'teacher_id',
    as: 'teacher'
  });
  
  // 4. Course -> Enrollment (курс имеет записи студентов)
  Course.hasMany(Enrollment, {
    foreignKey: 'course_id',
    as: 'enrollments'
  });
  
  // 5. Course -> Module (курс имеет модули)
  Course.hasMany(Module, {
    foreignKey: 'course_id',
    as: 'modules'
  });
  
  // 6. Enrollment -> User (запись принадлежит студенту)
  Enrollment.belongsTo(User, {
    foreignKey: 'student_id',
    as: 'enrollmentStudent'  // ИЗМЕНИЛ: 'student' → 'enrollmentStudent'
  });
  
  // 7. Enrollment -> Course (запись принадлежит курсу)
  Enrollment.belongsTo(Course, {
    foreignKey: 'course_id',
    as: 'course'
  });
  
  // 8. Enrollment -> StudentAssignment
  Enrollment.hasMany(StudentAssignment, {
    foreignKey: 'enrollment_id',
    as: 'assignments'
  });
  
  // ========== АССОЦИАЦИИ ДЛЯ МОДУЛЕЙ И УРОКОВ ==========
  
  // 9. Module -> Course
  if (Module) {
    Module.belongsTo(Course, {
      foreignKey: 'course_id',
      as: 'course'
    });
    
    // 10. Module -> Lesson
    Module.hasMany(Lesson, {
      foreignKey: 'module_id',
      as: 'lessons'
    });
  }
  
  // 11. Lesson -> Module
  if (Lesson) {
    Lesson.belongsTo(Module, {
      foreignKey: 'module_id',
      as: 'module'
    });
    
    // 12. Lesson -> StudentAssignment
    Lesson.hasMany(StudentAssignment, {
      foreignKey: 'lesson_id',
      as: 'studentAssignments'
    });
  }
  
  // ========== АССОЦИАЦИИ ДЛЯ ЗАДАНИЙ ==========
  
  // 13. StudentAssignment -> Enrollment
  if (StudentAssignment) {
    StudentAssignment.belongsTo(Enrollment, {
      foreignKey: 'enrollment_id',
      as: 'enrollment'
    });
    
    // 14. StudentAssignment -> Lesson
    StudentAssignment.belongsTo(Lesson, {
      foreignKey: 'lesson_id',
      as: 'lesson'
    });
    
  }
  
  console.log('✅ Все ассоциации установлены успешно');
  console.log('📋 Установленные связи:');
  console.log('   User ↔ Enrollment (studentEnrollments)');
  console.log('   User ↔ Course (taughtCourses)');
  console.log('   Course ↔ User (teacher)');
  console.log('   Course ↔ Enrollment (enrollments)');
  console.log('   Course ↔ Module (modules)');
  console.log('   Enrollment ↔ User (enrollmentStudent) ← ИЗМЕНЕНО!');
  console.log('   Enrollment ↔ Course (course)');
  console.log('   Enrollment ↔ StudentAssignment (assignments)');
  console.log('   Module ↔ Course (course)');
  console.log('   Module ↔ Lesson (lessons)');
  console.log('   Lesson ↔ Module (module)');
  console.log('   Lesson ↔ StudentAssignment (studentAssignments)');
  console.log('   StudentAssignment ↔ Enrollment (enrollment)');
  console.log('   StudentAssignment ↔ Lesson (lesson)');
  console.log('\n💡 Для доступа к студенту через задание:');
  console.log('   StudentAssignment -> Enrollment -> enrollmentStudent');
  
  return models;
};

module.exports = setupAssociations;