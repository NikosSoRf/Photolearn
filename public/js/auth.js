class AuthAPI {
    
    static baseURL = '/api/auth';

    static async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };

        console.log('📤 Отправляем запрос на:', url);

        try {
            const response = await fetch(url, config);
            console.log('📨 Статус ответа:', response.status);
            
            const text = await response.text();
            
            let data;
            try {
                data = text ? JSON.parse(text) : {};
            } catch (e) {
                console.error('❌ Ошибка парсинга JSON:', e);
                data = { message: 'Invalid JSON response' };
            }
            
            return {
                success: response.ok,
                status: response.status,
                data: data
            };
        } catch (error) {
            console.error('💥 Ошибка сети:', error);
            return {
                success: false,
                status: 0,
                data: { message: 'Ошибка сети' }
            };
        }
    }

    // Регистрация
    static async register(userData) {
        return await this.request('/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    // Вход
    static async login(credentials) {
        return await this.request('/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }
}

// Утилиты для работы с DOM
class AuthUI {
    // Показать сообщение
    static showMessage(message, type = 'info') {
        // Удаляем предыдущие сообщения
        this.hideMessages();

        const messageDiv = document.createElement('div');
        messageDiv.className = `auth-message auth-message-${type}`;
        messageDiv.textContent = message;

        // Вставляем перед формой
        const form = document.querySelector('.auth-form');
        if (form) {
            form.parentNode.insertBefore(messageDiv, form);
        }

        // Автоматически скрываем через 5 секунд
        if (type === 'success') {
            setTimeout(() => this.hideMessages(), 5000);
        }
    }

    // Скрыть все сообщения
    static hideMessages() {
        const messages = document.querySelectorAll('.auth-message');
        messages.forEach(msg => msg.remove());
    }

    // Показать/скрыть спиннер загрузки
    static setLoading(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = '<div class="spinner"></div> Загрузка...';
        } else {
            button.disabled = false;
            const originalText = button.getAttribute('data-original-text') || 'Отправить';
            button.textContent = originalText;
        }
    }

    // Сохранить токен в localStorage
    static saveToken(token) {
        if (!token || token === 'undefined' || token === 'null') {
            console.error('❌ Попытка сохранить невалидный токен:', token);
            return false;
        }
        
        if (typeof token !== 'string') {
            console.error('❌ Токен не является строкой:', typeof token, token);
            return false;
        }
        
        if (token.split('.').length !== 3) {
            console.error('❌ Токен не в формате JWT. Части:', token.split('.').length);
            return false;
        }
        
        console.log('💾 Сохраняем валидный токен в localStorage');
        localStorage.setItem('auth_token', token);
        return true;
    }

    // Получить токен из localStorage
    static getToken() {
        return localStorage.getItem('auth_token');
    }

    // Удалить токен
    static removeToken() {
        localStorage.removeItem('auth_token');
    }

    // Проверить авторизацию
    static isAuthenticated() {
        return !!this.getToken();
    }

    // ========== НОВЫЕ ФУНКЦИИ ==========
    
    // Получить redirect параметр из URL
    static getRedirectParam() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('redirect') || urlParams.get('return_url') || '';
    }

    // Получить параметр course из URL
    static getCourseParam() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('course');
    }

    // ИСПРАВЛЕНО: Определить дашборд по роли пользователя
    static getDashboardUrl(userRole) {
        // ВСЕ роли используют единый dashboard.html
        // Роль будет определена внутри dashboard.html или dashboard.js
        return '/dashboard.html';
    }

    // Проверить есть ли отложенная запись на курс
    static hasPendingCourseEnrollment() {
        const pendingCourse = localStorage.getItem('pending_course_enrollment');
        const courseFromUrl = this.getCourseParam();
        
        // ПРИОРИТЕТ: параметр из URL важнее сохраненного
        if (courseFromUrl) {
            localStorage.setItem('pending_course_enrollment', courseFromUrl);
            return courseFromUrl;
        }
        
        return pendingCourse;
    }

    // Перенаправление после успешной авторизации
    /*static redirectAfterAuth(userData = null) {
        // Проверяем отложенную запись на курс
        const pendingCourse = this.hasPendingCourseEnrollment();
        
        let redirectUrl = '/dashboard.html'; // ИСПРАВЛЕНО: всегда dashboard.html
        
        if (pendingCourse) {
            // Приоритет 1: Запись на курс
            redirectUrl = `/course.html?id=${pendingCourse}`;
            console.log('🎯 Перенаправляем для записи на курс:', pendingCourse);
            localStorage.removeItem('pending_course_enrollment');
        } else {
            // Приоритет 2: Redirect параметр из URL
            const redirectParam = this.getRedirectParam();
            if (redirectParam) {
                redirectUrl = decodeURIComponent(redirectParam);
                console.log('🔄 Перенаправляем по redirect:', redirectUrl);
            } else if (userData && userData.role) {
                // Приоритет 3: Добавляем роль как параметр URL
                redirectUrl = `/dashboard.html?role=${userData.role}`;
                console.log('👤 Перенаправляем в дашборд с ролью:', userData.role);
            }
        }
        
        console.log('🔄 Выполняем перенаправление на:', redirectUrl);
        
        // Короткая задержка для показа сообщения
        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 800);
    }*/
// УПРОЩЕННОЕ перенаправление после авторизации
static redirectAfterAuth(userData = null) {
    // Проверяем отложенную запись на курс
    const pendingCourse = localStorage.getItem('pending_course_enrollment');
    
    if (pendingCourse) {
        // Если есть отложенная запись, возвращаем на страницу курса
        console.log('🎯 Возвращаем для записи на курс:', pendingCourse);
        localStorage.removeItem('pending_course_enrollment');
        
        setTimeout(() => {
            window.location.href = `/course.html?id=${pendingCourse}`;
        }, 800);
        
    } else {
        // Иначе - в общий ЛК
        console.log('🔄 Перенаправляем в дашборд');
        
        // Добавляем роль в URL если есть
        let dashboardUrl = '/dashboard.html';
        if (userData && userData.role) {
            dashboardUrl += `?role=${userData.role}`;
        }
        
        setTimeout(() => {
            window.location.href = dashboardUrl;
        }, 800);
    }
}
    // Показать информационное сообщение об отложенной записи
    static showPendingCourseMessage() {
        const pendingCourse = this.hasPendingCourseEnrollment();
        
        if (pendingCourse) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'auth-message auth-message-info';
            messageDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span>🎯</span>
                    <div>
                        <strong>Запись на курс</strong>
                        <p style="margin: 5px 0 0 0; font-size: 0.9rem;">
                            После авторизации вы будете автоматически записаны на выбранный курс.
                        </p>
                    </div>
                </div>
            `;
            
            const form = document.querySelector('.auth-form');
            if (form) {
                form.parentNode.insertBefore(messageDiv, form);
            }
        }
    }
    // Проверка параметра course при загрузке страницы
static checkCourseFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('course');
    
    if (courseId) {
        console.log('📌 Курс из URL параметра:', courseId);
        // Сохраняем в localStorage для последующего использования
        localStorage.setItem('pending_course_enrollment', courseId);
        
        // Показываем сообщение пользователю
        this.showCourseEnrollmentMessage(courseId);
        return true;
    }
    
    return false;
}

// Показать сообщение о записи на курс
static showCourseEnrollmentMessage(courseId) {
    // Удаляем предыдущие сообщения
    this.hideMessages();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'auth-message auth-message-info';
    messageDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span>🎯</span>
            <div>
                <strong>Запись на курс</strong>
                <p style="margin: 5px 0 0 0; font-size: 0.9rem;">
                    После авторизации вы будете автоматически записаны на выбранный курс.
                </p>
            </div>
        </div>
    `;
    
    const form = document.querySelector('.auth-form');
    if (form) {
        form.parentNode.insertBefore(messageDiv, form);
    }
}
}

// Обработчики форм
class AuthHandlers {
    // Обработчик регистрации - обновленный
    static async handleRegister(event) {
        event.preventDefault();
        
        console.log('🖱️ Начало обработки регистрации');
        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');

        // Показываем загрузку
        AuthUI.setLoading(submitButton, true);
        AuthUI.hideMessages();

        try {
            const formData = new FormData(form);
            const userData = {
                email: formData.get('email'),
                password: formData.get('password'),
                first_name: formData.get('firstName'),
                last_name: formData.get('lastName'),
                role: formData.get('role')
            };

            // Простая валидация
            if (!AuthHandlers.validateRegisterData(userData)) {
                return;
            }

            const result = await AuthAPI.register(userData);
            
            console.log('🔍 Результат регистрации:', result);
            
            // Обработка успешной регистрации
            if (result.success && result.data) {
                let token, user;
                
                // Пробуем разные форматы ответа
                if (result.data.token) {
                    token = result.data.token;
                    user = result.data.user;
                } else if (result.data.data && result.data.data.token) {
                    token = result.data.data.token;
                    user = result.data.data.user;
                }
                
                if (token) {
                    console.log('🎉 Токен получен:', token.substring(0, 20) + '...');
                    
                    // Сохраняем токен
                    const saved = AuthUI.saveToken(token);
                    if (!saved) {
                        AuthUI.showMessage('Ошибка при сохранении токена', 'error');
                        return;
                    }
                    
                    // Сохраняем данные пользователя если есть
                    if (user) {
                        localStorage.setItem('user_id', user.id || '');
                        localStorage.setItem('user_role', user.role || '');
                        localStorage.setItem('user_name', `${user.first_name || ''} ${user.last_name || ''}`.trim());
                    }
                    
                    AuthUI.showMessage('Регистрация прошла успешно! Перенаправление...', 'success');
                    
                    // Перенаправляем с учетом отложенных действий
                    AuthUI.redirectAfterAuth(user);
                    
                } else {
                    console.error('💥 Токен не найден. Структура ответа:', result.data);
                    AuthUI.showMessage('Ошибка: токен не получен', 'error');
                }
            } else {
                // Показываем ошибку от сервера
                const errorMessage = result.data?.message || 
                                  result.data?.error || 
                                  'Ошибка регистрации';
                AuthUI.showMessage(errorMessage, 'error');
            }
            
        } catch (error) {
            console.error('💥 Ошибка:', error);
            AuthUI.showMessage('Ошибка регистрации', 'error');
        } finally {
            AuthUI.setLoading(submitButton, false);
        }
    }

    // Обработчик входа - обновленный
    static async handleLogin(event) {
        event.preventDefault();
        
        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');
        
        // Сохраняем оригинальный текст кнопки
        if (!submitButton.getAttribute('data-original-text')) {
            submitButton.setAttribute('data-original-text', submitButton.textContent);
        }

        // Получаем данные формы
        const formData = new FormData(form);
        const credentials = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        console.log('🔐 Попытка входа для:', credentials.email);

        // Валидация
        if (!AuthHandlers.validateLoginData(credentials)) {
            return;
        }

        // Показываем загрузку
        AuthUI.setLoading(submitButton, true);
        AuthUI.hideMessages();

        try {
            const result = await AuthAPI.login(credentials);
            
            console.log('📊 Результат входа:', result);
            
            if (result.success) {
                console.log('✅ Успешный ответ от сервера');
                
                // Извлекаем токен и данные пользователя
                let token, user;
                
                if (result.data.token) {
                    token = result.data.token;
                    user = result.data.user;
                } else if (result.data.data && result.data.data.token) {
                    token = result.data.data.token;
                    user = result.data.data.user;
                } else {
                    token = result.token;
                    user = result.user;
                }
                
                if (token) {
                    console.log('🎉 Токен получен:', token.substring(0, 20) + '...');
                    
                    // Сохраняем токен
                    const saved = AuthUI.saveToken(token);
                    if (!saved) {
                        AuthUI.showMessage('Ошибка при сохранении токена', 'error');
                        return;
                    }
                    
                    // Сохраняем данные пользователя если есть
                    if (user) {
                        localStorage.setItem('user_id', user.id || '');
                        localStorage.setItem('user_role', user.role || '');
                        localStorage.setItem('user_name', `${user.first_name || ''} ${user.last_name || ''}`.trim());
                        localStorage.setItem('user_email', user.email || '');
                    }
                    
                    AuthUI.showMessage('Вход выполнен успешно! Перенаправление...', 'success');
                    
                    // Перенаправляем с учетом отложенных действий
                    AuthUI.redirectAfterAuth(user);
                    
                } else {
                    console.error('❌ Токен не найден в ответе. Структура ответа:', result.data);
                    AuthUI.showMessage('Ошибка: токен авторизации не получен', 'error');
                }
            } else {
                // Показываем ошибку от сервера
                const errorMessage = result.data?.message || 
                                  result.data?.error || 
                                  'Ошибка входа';
                AuthUI.showMessage(errorMessage, 'error');
                console.error('❌ Ошибка входа:', result.data);
            }
        } catch (error) {
            console.error('💥 Ошибка при выполнении запроса:', error);
            AuthUI.showMessage('Произошла ошибка при подключении к серверу', 'error');
        } finally {
            AuthUI.setLoading(submitButton, false);
        }
    }

    // Валидация данных регистрации
    static validateRegisterData(data) {
        if (!data.email || !data.password || !data.first_name) {
            AuthUI.showMessage('Заполните все обязательные поля', 'error');
            return false;
        }

        if (data.password.length < 6) {
            AuthUI.showMessage('Пароль должен содержать минимум 6 символов', 'error');
            return false;
        }

        if (!AuthHandlers.isValidEmail(data.email)) {
            AuthUI.showMessage('Введите корректный email', 'error');
            return false;
        }

        if (!data.role) {
            AuthUI.showMessage('Выберите роль', 'error');
            return false;
        }

        return true;
    }

    // Валидация данных входа
    static validateLoginData(data) {
        if (!data.email || !data.password) {
            AuthUI.showMessage('Заполните все поля', 'error');
            return false;
        }

        if (!AuthHandlers.isValidEmail(data.email)) {
            AuthUI.showMessage('Введите корректный email', 'error');
            return false;
        }

        return true;
    }

    // Проверка email
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// Инициализация при загрузке страницы
/*document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 auth.js инициализирован');
    
    // Проверяем авторизацию и показываем сообщение об отложенной записи
    if (!AuthUI.isAuthenticated()) {
        AuthUI.showPendingCourseMessage();
    } else {
        console.log('✅ Пользователь уже авторизован');
        
        // Если пользователь уже авторизован на странице логина/регистрации - перенаправляем
        const currentPath = window.location.pathname;
        const authPages = ['/login', '/login.html', '/register', '/register.html'];
        
        if (authPages.some(page => currentPath.includes(page.replace('.html', '')))) {
            console.log('🔄 Перенаправление из страницы авторизации...');
            AuthUI.redirectAfterAuth();
        }
    }

    // Регистрация формы регистрации
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        console.log('📝 Форма регистрации найдена');
        registerForm.addEventListener('submit', AuthHandlers.handleRegister);
    }

    // Форма входа
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        console.log('🔑 Форма входа найдена');
        loginForm.addEventListener('submit', AuthHandlers.handleLogin);
    }
});*/
// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 auth.js инициализирован');
    
    // 1. Проверяем, есть ли параметр course в URL
    const hasCourseFromUrl = AuthUI.checkCourseFromUrl();
    
    // 2. Проверяем авторизацию
    if (!AuthUI.isAuthenticated()) {
        // Если не авторизован, но нет параметра course - показываем обычное сообщение
        if (!hasCourseFromUrl) {
            AuthUI.showPendingCourseMessage();
        }
        // Если есть параметр course - сообщение уже показано в checkCourseFromUrl()
    } else {
        console.log('✅ Пользователь уже авторизован');
        
        // Если пользователь уже авторизован на странице логина/регистрации - перенаправляем
        const currentPath = window.location.pathname;
        const authPages = ['/login', '/login.html', '/register', '/register.html'];
        
        if (authPages.some(page => currentPath.includes(page.replace('.html', '')))) {
            console.log('🔄 Перенаправление из страницы авторизации...');
            AuthUI.redirectAfterAuth();
        }
    }

    // Регистрация формы регистрации
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        console.log('📝 Форма регистрации найдена');
        registerForm.addEventListener('submit', AuthHandlers.handleRegister);
    }

    // Форма входа
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        console.log('🔑 Форма входа найдена');
        loginForm.addEventListener('submit', AuthHandlers.handleLogin);
    }
});
// Глобальные утилиты для использования в других файлах
window.AuthUtils = {
    getToken: () => AuthUI.getToken(),
    isAuthenticated: () => AuthUI.isAuthenticated(),
    redirectAfterAuth: (userData) => AuthUI.redirectAfterAuth(userData),
    setPendingCourse: (courseId) => {
        if (courseId) {
            localStorage.setItem('pending_course_enrollment', courseId);
            console.log('📝 Установлена отложенная запись на курс:', courseId);
        }
    },
    clearPendingCourse: () => {
        localStorage.removeItem('pending_course_enrollment');
        console.log('🧹 Отложенная запись на курс очищена');
    }
};
