const sequelize = require('../config/database');
const User = require('./User');
const Course = require('./Course');
const Module = require('./Module');
const Enrollment = require('./Enrollment');
const Lesson = require('./Lesson');
const StudentAssignment = require('./StudentAssignment');
const setupAssociations = require('./associations');
const models = {
  User: User,
  Course: Course,
  Module: Module,
  Enrollment: Enrollment,
  Lesson: Lesson,
  StudentAssignment: StudentAssignment,
  sequelize: sequelize
};

// Установка ассоциаций между моделями
setupAssociations(models);

const syncModels = async () => {
  try {
    await sequelize.sync({ force: false });
    console.log('Все модели синхронизированы с базой данных');
  } catch (error) {
    console.error('Ошибка синхронизации моделей:', error.message);
  }
};

module.exports = { ...models, syncModels };