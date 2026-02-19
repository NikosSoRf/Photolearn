const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Module = require('./Module');

const Lesson = sequelize.define('Lesson', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  module_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'modules',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  content_type: {
    type: DataTypes.ENUM('theory', 'test', 'creative_task'),
    allowNull: false,
    defaultValue: 'theory'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  order_index: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'lessons',
  timestamps: false,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['module_id', 'order_index']
    }
  ]
});



module.exports = Lesson;