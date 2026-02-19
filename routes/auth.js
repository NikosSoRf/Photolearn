const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Вход пользователя - ИСПРАВЛЕННАЯ ВЕРСИЯ
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Попытка входа:', req.body.email);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email и пароль обязательны'
      });
    }
    
    // Находим пользователя
    const user = await User.findOne({ 
      where: { email },
      attributes: ['id', 'email', 'password_hash', 'first_name', 'last_name', 'role']
    });
    
    if (!user) {
      console.log('❌ Пользователь не найден:', email);
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль'
      });
    }
    
    console.log('✅ Пользователь найден:', user.email);
    
    // Проверяем пароль
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      console.log('❌ Неверный пароль для:', email);
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль'
      });
    }
    
    console.log('✅ Пароль верный для:', email);
    
    // JWT токен
    const JWT_SECRET = process.env.JWT_SECRET;
      if (!JWT_SECRET) {
      console.error('❌ ОШИБКА: JWT_SECRET не установлен в .env файле');
      throw new Error('JWT_SECRET не установлен');
    }
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('✅ Токен сгенерирован для:', user.email);
    
    res.json({
      success: true,
      message: 'Вход выполнен успешно',
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        name: `${user.first_name} ${user.last_name}`.trim(),
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('🔥 Ошибка входа:', error);
    console.error('Стек ошибки:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Ошибка входа',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Внутренняя ошибка сервера'
    });
  }
});

// Регистрация пользователя - ИСПРАВЛЕННАЯ ВЕРСИЯ
router.post('/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name, role = 'student' } = req.body;
    
    if (!email || !password || !first_name) {
      return res.status(400).json({
        success: false,
        message: 'Email, пароль и имя обязательны'
      });
    }
    
    // Проверяем, существует ли пользователь
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь с таким email уже существует'
      });
    }
    
    // Хешируем пароль
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    
    // Создаем пользователя
    const user = await User.create({
      email,
      password_hash,
      first_name,
      last_name: last_name || '',
      role: ['student', 'teacher', 'admin'].includes(role) ? role : 'student',
      created_at: new Date(),
      updated_at: new Date()
    });
    
    // Генерируем JWT токен
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
     console.error('❌ ОШИБКА: JWT_SECRET не установлен в .env файле');
     throw new Error('JWT_SECRET не установлен');
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      success: true,
      message: 'Пользователь успешно зарегистрирован',
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        name: `${user.first_name} ${user.last_name}`.trim(),
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка регистрации пользователя',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Внутренняя ошибка'
    });
  }
});

module.exports = router;