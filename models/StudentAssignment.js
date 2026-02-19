const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Enrollment = require('./Enrollment');
const Lesson = require('./Lesson');

const StudentAssignment = sequelize.define('StudentAssignment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  enrollment_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'enrollments',
      key: 'id'
    }
  },
  lesson_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'lessons',
      key: 'id'
    }
  },
  photo_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('submitted', 'under_review', 'completed'),
    allowNull: false,
    defaultValue: 'submitted'
  },
  teacher_comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  grade: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 10
    }
  }
}, {
  tableName: 'student_assignments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = StudentAssignment;