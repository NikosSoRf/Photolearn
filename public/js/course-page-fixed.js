console.log('🔍 DEBUG: course-page.js загружен');

// Получаем ID курса из URL
function getCourseIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');
    console.log('📌 ID курса из URL:', courseId);
    return courseId;
}

document.addEventListener('DOMContentLoaded', async function() {
    console.log('✅ Course page loaded');
    
    const courseId = getCourseIdFromUrl();
    
    if (!courseId) {
        console.error('❌ ID курса не найден в URL');
        showError('Курс не найден');
        return;
    }
    
    // Загружаем данные курса
    await loadCourseData(courseId);
});

async function loadCourseData(courseId) {
    try {
        const response = await fetch(`/api/courses/${courseId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const course = await response.json();
        console.log('✅ Данные курса получены:', course);
        
        if (!course.is_published) {
            showError('Этот курс не доступен для записи');
            return;
        }
        
        renderCourse(course);
        
        // Проверяем статус записи если пользователь авторизован
        await checkAndUpdateEnrollmentStatus(courseId);
        
    } catch (error) {
        console.error('❌ Error loading course:', error);
        showError('Не удалось загрузить курс');
    }
}

async function checkAndUpdateEnrollmentStatus(courseId) {
    const token = localStorage.getItem('auth_token');
    const userRole = localStorage.getItem('user_role');
    
    const enrollBtn = document.getElementById('enroll-btn');
    if (!enrollBtn) return;
    
    if (!token) {
        // Не авторизован
        console.log('👤 Пользователь не авторизован');
        setupEnrollButtonForUnauthenticated(courseId);
        return;
    }
    
    if (userRole !== 'student') {
        // Не студент
        console.log('🚫 Роль пользователя:', userRole);
        enrollBtn.textContent = '❌ Только для студентов';
        enrollBtn.className = 'btn btn-secondary';
        enrollBtn.disabled = true;
        enrollBtn.onclick = null;
        return;
    }
    
    try {
        console.log('🔍 Проверяем статус записи...');
        const response = await fetch(`/api/courses/${courseId}/enrollment-status`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            console.log('⚠️ Ошибка проверки записи:', response.status);
            setupEnrollButtonForAuthenticated(courseId, false, null);
            return;
        }
        
        const result = await response.json();
        console.log('📊 Статус записи:', result);
        
        if (result.is_enrolled) {
            // Уже записан
            updateEnrollButtonForEnrolled(courseId, result.enrollment);
        } else {
            // Не записан
            setupEnrollButtonForAuthenticated(courseId, false, null);
        }
        
    } catch (error) {
        console.error('❌ Ошибка проверки записи:', error);
        setupEnrollButtonForAuthenticated(courseId, false, null);
    }
}

function setupEnrollButtonForUnauthenticated(courseId) {
    const enrollBtn = document.getElementById('enroll-btn');
    if (!enrollBtn) return;
    
    enrollBtn.textContent = 'Записаться на курс';
    enrollBtn.className = 'btn btn-primary';
    enrollBtn.disabled = false;
    enrollBtn.onclick = function() {
        handleUnauthenticatedEnrollment(courseId);
    };
}

function setupEnrollButtonForAuthenticated(courseId, isEnrolled, enrollment) {
    const enrollBtn = document.getElementById('enroll-btn');
    if (!enrollBtn) return;
    
    if (isEnrolled) {
        updateEnrollButtonForEnrolled(courseId, enrollment);
    } else {
        enrollBtn.textContent = 'Записаться на курс';
        enrollBtn.className = 'btn btn-primary';
        enrollBtn.disabled = false;
        enrollBtn.onclick = function() {
            handleAuthenticatedEnrollment(courseId);
        };
    }
}

function updateEnrollButtonForEnrolled(courseId, enrollment) {
    const enrollBtn = document.getElementById('enroll-btn');
    if (!enrollBtn) return;
    
    enrollBtn.textContent = enrollment ? `✅ Записан (${enrollment.progress}%)` : '✅ Вы записаны на курс';
    enrollBtn.className = 'btn btn-success';
    enrollBtn.disabled = true;
    enrollBtn.onclick = null;
    
    // Добавляем кнопку перехода к курсу
    const goToCourseBtn = document.getElementById('go-to-course-btn');
    if (goToCourseBtn) {
        goToCourseBtn.style.display = 'inline-block';
        goToCourseBtn.onclick = function() {
            window.location.href = `/course-student.html?id=${courseId}`;
        };
    }
}

function handleUnauthenticatedEnrollment(courseId) {
    console.log('🔐 Требуется авторизация для записи на курс');
    
    // Сохраняем ID курса для возврата после авторизации
    localStorage.setItem('pending_course_enrollment', courseId);
    
    // Показываем модальное окно выбора
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal" style="max-width: 450px;">
            <div class="modal-header">
                <h3>Для записи на курс необходима авторизация</h3>
                <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <p>Выберите вариант:</p>
                <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
                    <button onclick="redirectToRegistration(${courseId})" class="btn btn-primary">
                        📝 Зарегистрироваться как студент
                    </button>
                    <button onclick="redirectToLogin(${courseId})" class="btn btn-secondary">
                        🔑 Войти в аккаунт
                    </button>
                    <button onclick="this.closest('.modal-overlay').remove()" class="btn btn-outline">
                        Отмена
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function handleAuthenticatedEnrollment(courseId) {
    console.log('🎯 Пытаемся записаться на курс:', courseId);
    enrollInCourse(courseId);
}

// Глобальные функции для модального окна
window.redirectToRegistration = function(courseId) {
    localStorage.setItem('pending_course_enrollment', courseId);
    window.location.href = `/register.html?role=student&redirect=${encodeURIComponent(window.location.href)}`;
};

window.redirectToLogin = function(courseId) {
    localStorage.setItem('pending_course_enrollment', courseId);
    window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.href)}`;
};

// ОСНОВНАЯ ФУНКЦИЯ ЗАПИСИ НА КУРС
async function enrollInCourse(courseId) {
    const token = localStorage.getItem('auth_token');
    const userRole = localStorage.getItem('user_role');
    
    console.log('🔑 Токен:', token ? 'есть' : 'нет');
    console.log('👤 Роль:', userRole);
    
    // Проверка роли
    if (userRole !== 'student') {
        alert('❌ Только студенты могут записываться на курсы. Ваша роль: ' + userRole);
        return;
    }
    
    try {
        console.log('📤 Отправляем запрос на запись...');
        
        const response = await fetch(`/api/courses/${courseId}/enroll`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        console.log('📥 Ответ сервера:', result);
        
        if (response.ok) {
            // Успешная запись
            alert('✅ Вы успешно записались на курс!');
            
            // Очищаем отложенную запись
            localStorage.removeItem('pending_course_enrollment');
            
            // Обновляем кнопку
            updateEnrollButtonForEnrolled(courseId, result.enrollment);
            
            // Перенаправляем в ЛК студента через 2 секунды
            setTimeout(() => {
                window.location.href = '/dashboard-student.html';
            }, 2000);
            
        } else {
            console.error('❌ Ошибка сервера:', result);
            alert('❌ Ошибка: ' + (result.error || result.message || 'Не удалось записаться на курс'));
        }
        
    } catch (error) {
        console.error('❌ Ошибка сети при записи на курс:', error);
        alert('❌ Ошибка сети при записи на курс');
    }
}

// Обработка возврата после авторизации
function checkPendingEnrollment() {
    const pendingCourse = localStorage.getItem('pending_course_enrollment');
    const token = localStorage.getItem('auth_token');
    
    if (pendingCourse && token) {
        console.log('🔄 Обнаружена отложенная запись, пользователь авторизован');
        
        // Даем время для загрузки страницы
        setTimeout(async () => {
            const courseId = getCourseIdFromUrl();
            if (courseId === pendingCourse) {
                console.log('🎯 Пытаемся записаться на курс автоматически...');
                await enrollInCourse(courseId);
            } else {
                console.log('⚠️ ID курса не совпадает с отложенной записью');
                localStorage.removeItem('pending_course_enrollment');
            }
        }, 1500);
    }
}

// Остальные функции (renderCourse, renderModules и т.д.) остаются без изменений

function renderCourse(course) {
    console.log('Рендерим курс. Модули:', course.modules);
    const loading = document.getElementById('course-loading');
    const content = document.getElementById('course-content');
    const error = document.getElementById('course-error');
    
    // Показываем/скрываем элементы
    if (loading) loading.style.display = 'none';
    if (error) error.style.display = 'none';
    if (content) content.style.display = 'block';
    
    // Заполняем данные курса
    if (document.getElementById('course-title')) {
        document.getElementById('course-title').textContent = course.title || 'Название курса';
    }
    
    if (document.getElementById('course-description')) {
        document.getElementById('course-description').textContent = course.description || 'Описание курса';
    }
    
    if (document.getElementById('course-teacher')) {
        let teacherName = 'Не указан';
        if (course.teacher) {
            if (typeof course.teacher === 'object') {
                teacherName = `${course.teacher.first_name || ''} ${course.teacher.last_name || ''}`.trim();
                if (!teacherName) teacherName = course.teacher.name || 'Преподаватель';
            } else {
                teacherName = course.teacher;
            }
        }
        document.getElementById('course-teacher').textContent = `Преподаватель: ${teacherName}`;
    }
    
    if (document.getElementById('course-price')) {
        const price = course.price || 0;
        const priceText = price === 0 || price === '0.00' ? 'Бесплатно' : `${price} у.е.`;
        document.getElementById('course-price').textContent = `Цена: ${priceText}`;
    }
    
    // Уровень курса
    const levelBadge = document.getElementById('course-level');
    if (levelBadge) {
        const level = course.level || 'basic';
        levelBadge.className = `course-level-badge ${level}`;
        levelBadge.textContent = getLevelText(level);
    }
    
    // Рендерим модули если они есть
    if (course.modules && course.modules.length > 0) {
        renderModules(course.modules);
    } else {
        const container = document.getElementById('modules-container');
        if (container) {
            container.innerHTML = '<p>Модули курса пока не добавлены</p>';
        }
    }
    
    // Видео-звонки
    if (course.video_call_link) {
        const section = document.getElementById('video-calls-section');
        const container = document.getElementById('video-calls-container');
        if (section && container) {
            section.style.display = 'block';
            container.innerHTML = `
                <div class="video-call-card">
                    <h4>Онлайн-встречи с преподавателем</h4>
                    <p>Присоединяйтесь к онлайн-сессиям для обсуждения ваших работ и вопросов</p>
                    <a href="${course.video_call_link}" target="_blank" class="btn btn-secondary">
                        Присоединиться к встрече
                    </a>
                </div>
            `;
        }
    }
    
    // Проверяем отложенную запись
    checkPendingEnrollment();
}

function renderModules(modules) {
    const container = document.getElementById('modules-container');
    
    if (!container) return;
    
    console.log('🎨 Рендерим модули:', modules);
    
    if (!modules || modules.length === 0) {
        container.innerHTML = `
            <div class="no-modules">
                <p>Модули курса пока не добавлены</p>
            </div>
        `;
        return;
    }

    container.innerHTML = modules.map(module => `
        <div class="module">
            <h3 class="module-title">${module.title || 'Модуль'}</h3>
            <div class="lessons">
                ${(module.lessons || []).map(lesson => `
                    <div class="lesson" onclick="window.location.href='/lesson.html?id=${lesson.id}'">
                        <span class="lesson-icon">${getLessonIcon(lesson.content_type)}</span>
                        <span class="lesson-title">${lesson.title || 'Урок'}</span>
                        <span class="lesson-type">${getLessonTypeText(lesson.content_type)}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function getLevelText(level) {
    const levels = {
        'basic': 'Базовый',
        'advanced': 'Продвинутый', 
        'specialized': 'Специализация'
    };
    return levels[level] || level;
}

function getLessonIcon(contentType) {
    const icons = {
        'theory': '📚',
        'test': '📝',
        'creative_task': '📷'
    };
    return icons[contentType] || '📄';
}

function getLessonTypeText(contentType) {
    const types = {
        'theory': 'Теория',
        'test': 'Тест',
        'creative_task': 'Творческое задание'
    };
    return types[contentType] || contentType;
}

function showError(message) {
    const loading = document.getElementById('course-loading');
    const error = document.getElementById('course-error');
    
    if (loading) loading.style.display = 'none';
    if (error) {
        error.style.display = 'block';
        error.textContent = message;
    }
}

// Делаем функции глобальными
window.enrollInCourse = enrollInCourse;
window.redirectToRegistration = redirectToRegistration;
window.redirectToLogin = redirectToLogin;