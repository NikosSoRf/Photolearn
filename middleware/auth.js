const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware для проверки JWT токена
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Токен доступа не предоставлен' 
      });
    }

    // Проверяем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Находим пользователя
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Пользователь не найден' 
      });
    }

    // Добавляем пользователя в запрос
    req.user = user;
    next();

  } catch (error) {
    console.error('Ошибка аутентификации:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Неверный токен' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Токен истек' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Ошибка аутентификации' 
    });
  }
};

// Middleware для проверки ролей
/*const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Требуется аутентификация' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Недостаточно прав' 
      });
    }

    next();
  };
};*/
// Проверка роли пользователя
function requireRole(roles) {
    return (req, res, next) => {
        console.log('🔐 Проверка роли:', {
            userId: req.user?.id,
            userRole: req.user?.role,
            requiredRoles: roles
        });
        
        if (!req.user) {
            console.log('🚫 Пользователь не авторизован');
            return res.status(401).json({ 
                success: false, 
                message: 'Требуется авторизация' 
            });
        }
        
        if (!roles.includes(req.user.role)) {
            console.log(`🚫 Недостаточно прав. Роль: ${req.user.role}, требуемые: ${roles}`);
            return res.status(403).json({ 
                success: false, 
                message: 'Недостаточно прав' 
            });
        }
        
        console.log('✅ Роль проверена успешно');
        next();
    };
}
module.exports = { authenticateToken, requireRole };