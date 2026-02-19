// Главная функция инициализации
document.addEventListener('DOMContentLoaded', function() {
    // Сначала проверяем токен
    const token = localStorage.getItem('auth_token'); // ИЗМЕНИЛ на auth_token
    
    if (!token) {
        console.log('❌ Нет токена, перенаправляем на /login');
        window.location.href = '/login';
        return;
    }
     // Проверяем, не истек ли токен
    if (checkTokenExpiration()) {
        console.log('⚠️ Токен истек, показываем модальное окно');
        showTokenExpiredModal();
        return; // Не инициализируем дашборд, пока пользователь не войдет снова
    }
    
    console.log('✅ Токен найден и валиден, инициализируем dashboard');
    
    // Добавляем кнопку выхода
    addLogoutButton();
    initializeDashboard();
});

// Функция очистки выбора файла
function clearFileSelection() {
    console.log('🗑️ Очистка выбора файла');
    const fileInput = document.getElementById('assignment-photo');
    const selectedFileInfo = document.getElementById('selected-file-info');
    const customButton = document.getElementById('custom-file-button');
    const submitButton = document.getElementById('submit-button');
    const previewDiv = document.getElementById('upload-preview');
    
    if (fileInput) fileInput.value = '';
    if (selectedFileInfo) selectedFileInfo.style.display = 'none';
    if (submitButton) submitButton.disabled = true;
    
    if (customButton) {
        customButton.innerHTML = `
            <div class="file-input-icon">📁</div>
            <div class="file-input-text">Нажмите для выбора файла</div>
            <div class="file-input-hint">или перетащите сюда</div>
        `;
        customButton.style.background = 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)';
    }
    
    if (previewDiv) {
        previewDiv.innerHTML = `
            <div class="preview-placeholder">
                <div class="icon">📷</div>
                <p>Здесь будет предпросмотр вашей фотографии</p>
            </div>
        `;
    }
}

// Сразу экспортируем в глобальную область видимости
window.clearFileSelection = clearFileSelection;
// Инициализация кабинета
async function initializeDashboard() {
    try {
        // Показываем загрузку
        showLoading();

        // 1. Получаем данные пользователя
        const userData = await getUserData();
        console.log('👤 Полученные данные пользователя:', userData);
        
        if (!userData) {
            console.error('❌ Не удалось получить данные пользователя');
            localStorage.removeItem('auth_token'); // Очищаем невалидный токен
            window.location.href = '/login';
            return;
        }

        // 2. Устанавливаем роль и показываем соответствующий интерфейс
        setupUserInterface(userData);

        // 3. Загружаем данные в зависимости от роли
        await loadRoleSpecificData(userData.role || 'student');

        // 4. Скрываем загрузку
        hideLoading();

    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
        showError('Не удалось загрузить данные');
    }
}

// Получение данных пользователя
/*async function getUserData() {
    try {
        const token = localStorage.getItem('auth_token');
        
        // Проверяем, не истек ли токен
        if (checkTokenExpiration && checkTokenExpiration()) {
            showTokenExpiredModal && showTokenExpiredModal();
            return null;
        }
        
        console.log('📡 Запрашиваем данные пользователя с токеном:', token ? 'Есть' : 'Нет');
        
        // Сначала пробуем получить данные через API
        try {
            const response = await fetch('/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('📊 Ответ от /api/user/profile:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Данные пользователя от API:', data);
                
                // Обрабатываем разные форматы ответа
                if (data.user) {
                    return data.user; // { user: {...} }
                } else if (data.data) {
                    return data.data; // { data: {...} }
                } else if (data.id || data.email) {
                    return data; // { id, email, role, ... }
                } else {
                    console.warn('⚠️ Неизвестный формат данных от API:', data);
                }
            } else if (response.status === 401) {
                console.warn('⚠️ Токен невалиден (статус 401)');
                showTokenExpiredModal && showTokenExpiredModal();
                return null;
            } else {
                console.warn('⚠️ API ответило ошибкой:', response.status);
            }
        } catch (apiError) {
            console.warn('⚠️ Ошибка API, используем декодирование токена:', apiError.message);
        }

        // Если API недоступно или не ответило, пробуем получить данные из токена
        if (token) {
            try {
                // Декодируем JWT токен
                const payload = token.split('.')[1];
                const decoded = JSON.parse(atob(payload));
                
                console.log('🔓 Декодированный токен:', decoded);
                
                // Проверяем срок действия токена
                if (decoded.exp) {
                    const expirationTime = decoded.exp * 1000;
                    const currentTime = Date.now();
                    
                    if (currentTime >= expirationTime) {
                        console.warn('⚠️ Токен в декодированном виде истек');
                        showTokenExpiredModal && showTokenExpiredModal();
                        return null;
                    }
                }
                
                // Возвращаем данные из токена с гарантированной ролью
                return {
                    id: decoded.userId || decoded.id,
                    email: decoded.email,
                    role: decoded.role || 'student', // Важно: гарантируем наличие роли
                    name: decoded.name || (decoded.email ? decoded.email.split('@')[0] : 'Пользователь'),
                    first_name: decoded.first_name,
                    last_name: decoded.last_name
                };
            } catch (decodeError) {
                console.warn('⚠️ Не удалось декодировать токен:', decodeError);
            }
        }

        // Если ничего не сработало, возвращаем минимальные данные с ролью
        console.warn('⚠️ Все методы получения данных не сработали, используем fallback');
        return {
            id: 0,
            email: 'user@unknown.com',
            role: 'student', // Гарантируем наличие роли
            name: 'Пользователь'
        };

    } catch (error) {
        console.error('❌ Общая ошибка получения данных:', error);
        
        if (error.message && error.message.includes('Failed to fetch')) {
            console.warn('🌐 Ошибка сети, возможно API недоступно');
        }
        
        // Возвращаем fallback с ролью
        return {
            id: 0,
            email: 'user@unknown.com',
            role: 'student',
            name: 'Пользователь'
        };
    }
}*/
// Получение данных пользователя
async function getUserData() {
    try {
        const token = localStorage.getItem('auth_token');
        
        // Проверяем, не истек ли токен
        if (checkTokenExpiration && checkTokenExpiration()) {
            showTokenExpiredModal && showTokenExpiredModal();
            return null;
        }
        
        console.log('📡 Запрашиваем данные пользователя с токеном:', token ? 'Есть' : 'Нет');
        
        // Сначала пробуем получить данные через API
        try {
            const response = await fetch('/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('📊 Ответ от /api/user/profile:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Данные пользователя от API:', data);
                
                // ИЗМЕНЕНИЕ: Правильное извлечение данных пользователя
                let userData = null;
                
                if (data.user) {
                    userData = data.user; // Формат: {success: true, user: {...}}
                } else if (data.data) {
                    userData = data.data; // Формат: {success: true, data: {...}}
                    // Проверяем, не содержит ли data.user внутри data
                    if (userData && userData.user) {
                        userData = userData.user;
                    }
                } else if (data.id || data.email) {
                    userData = data; // Прямые данные: {id, email, ...}
                } else if (data.success && data.data && data.data.user) {
                    userData = data.data.user; // Формат: {success: true, data: {user: {...}}}
                }
                
                if (!userData) {
                    console.warn('⚠️ Не удалось извлечь данные пользователя из ответа:', data);
                    // Пробуем декодировать токен
                    return decodeTokenData(token);
                }
                
                // Гарантируем наличие роли
                if (!userData.role) {
                    userData.role = 'student'; // Значение по умолчанию
                }
                
                return userData;
                
            } else if (response.status === 401) {
                console.warn('⚠️ Токен невалиден (статус 401)');
                showTokenExpiredModal && showTokenExpiredModal();
                return null;
            } else {
                console.warn('⚠️ API ответило ошибкой:', response.status);
                // Пробуем декодировать токен
                return decodeTokenData(token);
            }
        } catch (apiError) {
            console.warn('⚠️ Ошибка API, используем декодирование токена:', apiError.message);
            return decodeTokenData(token);
        }

    } catch (error) {
        console.error('❌ Общая ошибка получения данных:', error);
        return decodeTokenData(token);
    }
}

// Вспомогательная функция для декодирования токена
function decodeTokenData(token) {
    if (!token) return getFallbackUserData();
    
    try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        
        console.log('🔓 Декодированный токен:', decoded);
        
        // Проверяем срок действия токена
        if (decoded.exp) {
            const expirationTime = decoded.exp * 1000;
            const currentTime = Date.now();
            
            if (currentTime >= expirationTime) {
                console.warn('⚠️ Токен в декодированном виде истек');
                showTokenExpiredModal && showTokenExpiredModal();
                return null;
            }
        }
        
        // Возвращаем данные из токена с гарантированной ролью
        return {
            id: decoded.userId || decoded.id,
            email: decoded.email,
            role: decoded.role || 'student',
            name: decoded.name || (decoded.email ? decoded.email.split('@')[0] : 'Пользователь'),
            first_name: decoded.first_name,
            last_name: decoded.last_name
        };
    } catch (decodeError) {
        console.warn('⚠️ Не удалось декодировать токен:', decodeError);
        return getFallbackUserData();
    }
}

// Fallback данные
function getFallbackUserData() {
    console.warn('⚠️ Используем fallback данные пользователя');
    return {
        id: 0,
        email: 'user@unknown.com',
        role: 'student',
        name: 'Пользователь'
    };
}
// Добавляем недостающие функции, если их нет
if (typeof checkTokenExpiration === 'undefined') {
    window.checkTokenExpiration = function() {
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
            return true; // Токен отсутствует
        }
        
        try {
            // Декодируем JWT токен
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expirationTime = payload.exp * 1000; // Конвертируем в миллисекунды
            const currentTime = Date.now();
            
            // Проверяем, истек ли токен
            return currentTime >= expirationTime;
        } catch (error) {
            console.error('❌ Ошибка при проверке токена:', error);
            return false; // Если ошибка декодирования, не считаем токен истекшим
        }
    };
}

if (typeof showTokenExpiredModal === 'undefined') {
    window.showTokenExpiredModal = function() {
        // Создаем простое модальное окно
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 10px; text-align: center; max-width: 400px;">
                <h3 style="color: #e74c3c; margin-top: 0;">Сессия истекла</h3>
                <p>Ваша сессия авторизации истекла. Пожалуйста, войдите снова.</p>
                <button onclick="window.location.href='/login'" 
                        style="background: #e74c3c; color: white; border: none; padding: 10px 20px; 
                               border-radius: 5px; cursor: pointer; margin-top: 15px;">
                    Войти снова
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    };
}

// Настройка интерфейса по роли
function setupUserInterface(userData) {
    console.log('🎨 Настраиваем интерфейс для роли:', userData?.role);
    
    // Проверяем userData
    if (!userData) {
        console.error('❌ userData is undefined в setupUserInterface');
        showError('Ошибка загрузки данных пользователя');
        return;
    }
    
    // Устанавливаем общую информацию
    setUserInfo(userData);
    
    // Убеждаемся, что роль есть
    const role = userData.role || 'student';
    console.log('🎯 Используемая роль:', role);
    //Сохраняем роль для последующих подтверждений
    if (role && !localStorage.getItem('user_role')) {
        localStorage.setItem('user_role', role);
        console.log('💾 Сохранили роль в localStorage для других страниц:', role);
    }
    // Скрываем все меню сначала
    const menus = ['student-nav', 'teacher-nav', 'admin-nav'];
    const contents = ['student-content', 'teacher-content', 'admin-content'];
    
    menus.forEach(menuId => {
        const menu = document.getElementById(menuId);
        if (menu) menu.style.display = 'none';
    });
    
    contents.forEach(contentId => {
        const content = document.getElementById(contentId);
        if (content) content.style.display = 'none';
    });
    
    // Показываем нужное меню и контент
    if (role === 'student') {
        console.log('🎓 Показываем интерфейс студента');
        const studentNav = document.getElementById('student-nav');
        const studentContent = document.getElementById('student-content');
        if (studentNav) studentNav.style.display = 'block';
        if (studentContent) studentContent.style.display = 'block';
        
        // Показываем статистику студента
        const statCourses = document.getElementById('stat-courses');
        const statProgress = document.getElementById('stat-progress');
        if (statCourses) statCourses.style.display = 'block';
        if (statProgress) statProgress.style.display = 'block';
        
    } else if (role === 'teacher') {
        console.log('👨‍🏫 Показываем интерфейс преподавателя');
        const teacherNav = document.getElementById('teacher-nav');
        const teacherContent = document.getElementById('teacher-content');
        if (teacherNav) teacherNav.style.display = 'block';
        if (teacherContent) teacherContent.style.display = 'block';
        
        // Показываем статистику преподавателя
        const statCourses = document.getElementById('stat-courses');
        const statAssignments = document.getElementById('stat-assignments');
        if (statCourses) statCourses.style.display = 'block';
        if (statAssignments) statAssignments.style.display = 'block';
        
    } else if (role === 'admin') {
        console.log('👑 Показываем интерфейс администратора');
        const adminNav = document.getElementById('admin-nav');
        const adminContent = document.getElementById('admin-content');
        if (adminNav) adminNav.style.display = 'block';
        if (adminContent) adminContent.style.display = 'block';
    }
    
    // Активируем первую вкладку через небольшой таймаут
    setTimeout(() => {
        const activeNav = document.querySelector('.nav-item.active');
        if (activeNav && activeNav.onclick) {
            activeNav.onclick();
        } else {
            // Если нет активной, активируем первую
            const firstNavItem = document.querySelector('.nav-item');
            if (firstNavItem && firstNavItem.onclick) {
                firstNavItem.onclick();
            }
        }
    }, 100);
}


// Установка информации о пользователе
function setUserInfo(userData) {
    console.log('📝 Устанавливаем информацию пользователя:', userData);
    
    // Проверяем, что userData существует
    if (!userData) {
        console.error('❌ userData is undefined');
        return;
    }
    
    // Создаем отображаемое имя безопасно
    let displayName = 'Пользователь';
    
    if (userData.name) {
        displayName = userData.name;
    } else if (userData.first_name && userData.last_name) {
        displayName = `${userData.first_name} ${userData.last_name}`;
    } else if (userData.email) {
        // Безопасная проверка email
        try {
            displayName = userData.email.split('@')[0] || 'Пользователь';
        } catch (e) {
            displayName = 'Пользователь';
        }
    }
    
    safeSetText('nav-user-name', displayName);
    safeSetText('sidebar-user-name', displayName);
    
    // Устанавливаем роль (с проверкой)
    const role = userData.role || 'student';
    safeSetText('sidebar-user-role', getRoleText(role));
    
    // Устанавливаем аватар (первая буква имени)
    const avatarText = displayName.charAt(0).toUpperCase() || 'П';
    safeSetText('nav-user-avatar', avatarText);
    safeSetText('sidebar-user-avatar', avatarText);
    
    // Добавляем роль в userData если ее нет
    if (!userData.role) {
        userData.role = role;
    }
}
// Загрузка данных по роли
/*async function loadRoleSpecificData(role) {
    console.log('📊 Загружаем данные для роли:', role);
    
    try {
        if (role === 'student') {
            await loadStudentDashboard();
        } else if (role === 'teacher') {
            await loadTeacherDashboard();
        } else if (role === 'admin') {
            await loadAdminDashboard();
        }
    } catch (error) {
        console.error(`❌ Ошибка загрузки данных для роли ${role}:`, error);
    }
}*/
// Загрузка данных по роли
async function loadRoleSpecificData(role) {
    console.log('📊 Загружаем данные для роли:', role);
    
    try {
        if (role === 'student') {
            await loadStudentDashboard();
        } else if (role === 'teacher') {
            // Загружаем дашборд преподавателя
            if (typeof loadTeacherDashboard === 'function') {
                await loadTeacherDashboard();
            } else {
                console.error('❌ Функция loadTeacherDashboard не определена');
                // Показываем сообщение о загрузке преподавательского интерфейса
                const container = document.getElementById('teacher-courses-container');
                if (container) {
                    container.innerHTML = `
                        <div class="loading-state">
                            <div class="spinner"></div>
                            <p>Загрузка преподавательского интерфейса...</p>
                        </div>
                    `;
                }
            }
        } else if (role === 'admin') {
            await loadAdminDashboard();
        }
    } catch (error) {
        console.error(`❌ Ошибка загрузки данных для роли ${role}:`, error);
    }
}

// ========== АДМИНИСТРАТОР ==========
async function loadAdminDashboard() {
    console.log('👑 Загружаем дашборд администратора');
    
    try {
        const token = localStorage.getItem('auth_token');
        
        // Загружаем статистику
        const response = await fetch('/api/admin/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const stats = await response.json();
            console.log('✅ Статистика получена:', stats);
            renderAdminStats(stats);
        } else {
            console.warn('⚠️ Не удалось загрузить статистику');
            showDemoAdminData();
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки данных администратора:', error);
        showDemoAdminData();
    }
}

// Демо-данные для администратора
function showDemoAdminData() {
    document.querySelector('.admin-stats-grid').innerHTML = `
        <div class="stat-card">
            <h3>Всего пользователей</h3>
            <div class="stat-number">42</div>
        </div>
        <div class="stat-card">
            <h3>Всего курсов</h3>
            <div class="stat-number">8</div>
        </div>
        <div class="stat-card">
            <h3>Активных студентов</h3>
            <div class="stat-number">35</div>
        </div>
    `;
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function showSection(sectionId) {
    console.log('🔍 Переключаемся на секцию:', sectionId);
    
    // Находим активный контент
    const activeContent = document.querySelector('.dashboard-content[style*="display: block"]');
    if (!activeContent) return;
    
    // Скрываем все секции в этом контенте
    const sections = activeContent.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Показываем нужную секцию
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    // Обновляем активное меню
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    // Находим и активируем соответствующий пункт меню
    const activeNavItem = document.querySelector(`[onclick*="${sectionId}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
}

function safeSetText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
}

function safeSetHTML(elementId, html) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = html;
    }
}

function getRoleText(role) {
    const roles = {
        'student': 'Студент',
        'teacher': 'Преподаватель',
        'admin': 'Администратор'
    };
    return roles[role] || role;
}

function getLevelText(level) {
    const levels = {
        'basic': 'Базовый',
        'advanced': 'Продвинутый',
        'specialized': 'Специализация'
    };
    return levels[level] || level;
}

function formatDate(dateString) {
    try {
        if (!dateString) return 'Не указано';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } catch (e) {
        return dateString || 'Не указано';
    }
}

function showLoading() {
    const loading = document.getElementById('dashboard-loading');
    if (loading) {
        loading.style.display = 'block';
    }
}

function hideLoading() {
    const loading = document.getElementById('dashboard-loading');
    if (loading) {
        loading.style.display = 'none';
    }
}

function showError(message) {
    const loading = document.getElementById('dashboard-loading');
    if (loading) {
        loading.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <p style="color: #e74c3c; font-size: 1.2rem;">${message}</p>
                <button onclick="logout()" class="btn btn-primary">
                    Войти снова
                </button>
            </div>
        `;
    }
}
// ========== ФУНКЦИИ ДЛЯ ВЫХОДА И УПРАВЛЕНИЯ ТОКЕНОМ ==========

// Функция выхода из системы
function logout() {
    console.log('🚪 Выход из системы...');
    
    // Удаляем токен из localStorage
    localStorage.removeItem('auth_token');
    
    // Показываем сообщение
    showNotification('✅ Вы успешно вышли из системы', 'success');
    
    // Перенаправляем на страницу логина через 1 секунду
    setTimeout(() => {
        window.location.href = '/login';
    }, 1000);
}

// Функция проверки истечения срока токена
function checkTokenExpiration() {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
        return true; // Токен отсутствует
    }
    
    try {
        // Декодируем JWT токен
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Конвертируем в миллисекунды
        const currentTime = Date.now();
        
        // Проверяем, истек ли токен
        if (currentTime >= expirationTime) {
            console.warn('⚠️ Токен истек');
            return true;
        }
        
        // Проверяем, скоро ли истечет токен (менее 5 минут)
        const timeUntilExpiration = expirationTime - currentTime;
        if (timeUntilExpiration < 5 * 60 * 1000) { // 5 минут
            console.log('⚠️ Токен скоро истечет, нужно обновить');
            // Можно показать предупреждение
        }
        
        return false;
    } catch (error) {
        console.error('❌ Ошибка при проверке токена:', error);
        return true; // Если ошибка декодирования, считаем токен невалидным
    }
}

// Показать модальное окно о просроченном токене
function showTokenExpiredModal() {
    // Проверяем, не открыто ли уже модальное окно
    if (document.querySelector('.token-expired-modal')) {
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'token-expired-modal';
    modal.innerHTML = `
        <div class="token-expired-content">
            <div class="token-expired-icon">⏰</div>
            <h3>Сессия истекла</h3>
            <p>Ваша сессия авторизации истекла. Пожалуйста, войдите снова для продолжения работы.</p>
            <div class="token-actions">
                <button onclick="handleTokenExpired()" class="btn btn-primary">
                    Войти снова
                </button>
                <button onclick="closeTokenExpiredModal()" class="btn btn-secondary">
                    Закрыть
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden'; // Блокируем скролл
}

// Закрыть модальное окно о просроченном токене
function closeTokenExpiredModal() {
    const modal = document.querySelector('.token-expired-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = ''; // Разблокируем скролл
    }
}

// Обработка истекшего токена
function handleTokenExpired() {
    closeTokenExpiredModal();
    logout();
}
// Функция очистки выбора файла (если не определена)
if (typeof clearFileSelection === 'undefined') {
    window.clearFileSelection = function() {
        console.log('🗑️ Очистка выбора файла');
        const fileInput = document.getElementById('assignment-photo');
        const selectedFileInfo = document.getElementById('selected-file-info');
        const customButton = document.getElementById('custom-file-button');
        const submitButton = document.getElementById('submit-button');
        
        if (fileInput) fileInput.value = '';
        if (selectedFileInfo) selectedFileInfo.style.display = 'none';
        if (submitButton) submitButton.disabled = true;
        
        if (customButton) {
            customButton.innerHTML = `
                <div class="file-input-icon">📁</div>
                <div class="file-input-text">Нажмите для выбора файла</div>
                <div class="file-input-hint">или перетащите сюда</div>
            `;
            customButton.style.background = 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)';
        }
    };
}
// Показать уведомление
function showNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">${message}</div>
        <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Автоматическое удаление через 5 секунд
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Добавление кнопки выхода в DOM
function addLogoutButton() {
    // Добавляем кнопку выхода в навбар (если ее еще нет)
    const userMenu = document.querySelector('.user-menu');
    if (userMenu && !document.getElementById('logout-btn-nav')) {
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logout-btn-nav';
        logoutBtn.className = 'logout-btn';
        logoutBtn.textContent = 'Выйти';
        logoutBtn.onclick = logout;
        userMenu.appendChild(logoutBtn);
    }
    
    // Показываем кнопку выхода в сайдбаре
    const sidebarLogoutBtn = document.getElementById('logout-btn-sidebar');
    if (sidebarLogoutBtn) {
        sidebarLogoutBtn.style.display = 'block';
    }
}

// Экспортируем функции для глобального использования
window.logout = logout;
window.showSection = showSection;
window.closeUploadModal = closeUploadModal;
window.closeReviewModal = closeReviewModal;
window.uploadAssignment = uploadAssignment;
window.closeTokenExpiredModal = closeTokenExpiredModal;
window.handleTokenExpired = handleTokenExpired;

// Если clearFileSelection еще не определена, определяем ее
if (typeof clearFileSelection === 'undefined') {
    window.clearFileSelection = function() {
        console.log('🗑️ Очистка выбора файла');
        // Реализация выше
    };
}

// Дебаг-функция для проверки состояния
window.debugUserData = function() {
    const token = localStorage.getItem('auth_token');
    console.log('🔍 Дебаг информации:');
    console.log('Токен:', token ? 'Присутствует' : 'Отсутствует');
    
    if (token) {
        try {
            const payload = token.split('.')[1];
            const decoded = JSON.parse(atob(payload));
            console.log('Декодированный токен:', decoded);
        } catch (e) {
            console.log('Не удалось декодировать токен:', e.message);
        }
    }
    
    console.log('Текущий пользователь:', JSON.parse(localStorage.getItem('currentUser') || '{}'));
};