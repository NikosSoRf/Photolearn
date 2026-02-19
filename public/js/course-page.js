
console.log('🔍 course-page.js загружен');

// Получаем ID курса из URL
function getCourseIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

document.addEventListener('DOMContentLoaded', async function() {
    document.body.classList.add('js-loaded');
    console.log('✅ Course page loaded');
    const courseId = getCourseIdFromUrl();
    
    if (!courseId) {
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
        console.log('🔍 Структура данных курса:', {
            title: course.title,
            description: course.description,
            teacher: course.teacher,
            modules: course.modules,
            is_published: course.is_published
        });
        
        if (!course.is_published) {
            showError('Этот курс не доступен для записи');
            return;
        }
        
        renderCourse(course);
        
        // Проверяем, авторизован ли пользователь
        const token = localStorage.getItem('auth_token');
        const userRole = localStorage.getItem('user_role');
        
        if (token) {
            
            await checkEnrollmentStatus(courseId);
        } else {
            
            setupEnrollButtonForUnauthenticated(courseId);
        }
        
    } catch (error) {
        console.error('❌ Error loading course:', error);
        showError('Не удалось загрузить курс');
    }
}

//функция записи на курс
async function enrollInCourse(courseId) {
    console.log('🎯 Запись на курс ID:', courseId);
    
    const token = localStorage.getItem('auth_token');
    
    // Если нет токена - перенаправляем на логин
    if (!token) {
        console.log('🔐 Требуется авторизация');
        
        // переходим на страницу логина
        window.location.href = `/login.html?course=${courseId}`;
        return;
    }
    
    // Проверяем роль
    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'student') {
        console.log('⚠️ Роль пользователя:', userRole);
        // показываем предупреждение
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
            updateEnrollButton({ is_enrolled: true }, courseId);
            
            // Перенаправляем в ЛК через 1 секунду
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1000);
            
        } else {
            console.error('❌ Ошибка сервера:', result);
            
            // Обрабатываем конкретные ошибки
            if (response.status === 403) {
                alert('❌ Только студенты могут записываться на курсы');
            } else if (response.status === 409) {
                alert('✅ Вы уже записаны на этот курс');
                updateEnrollButton({ is_enrolled: true }, courseId);
            } else {
                alert('❌ Ошибка: ' + (result.error || result.message || 'Не удалось записаться на курс'));
            }
        }
        
    } catch (error) {
        console.error('❌ Ошибка сети при записи на курс:', error);
        alert('❌ Ошибка сети при записи на курс');
    }
}

// Проверка статуса записи
async function checkEnrollmentStatus(courseId) {
    const token = localStorage.getItem('auth_token');
    
    if (!token) return;
    
    try {
        const response = await fetch(`/api/courses/${courseId}/enrollment-status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) return;
        
        const result = await response.json();
        updateEnrollButton(result, courseId);
        
    } catch (error) {
        console.error('❌ Ошибка проверки записи:', error);
    }
}

// Обновление кнопки записи
function updateEnrollButton(enrollmentData, courseId) {
    const enrollBtn = document.getElementById('enroll-btn');
    if (!enrollBtn) return;
    
    if (enrollmentData.is_enrolled) {
        // Уже записан
        enrollBtn.textContent = '✅ Вы записаны на курс';
        enrollBtn.className = 'btn btn-success';
        enrollBtn.disabled = true;
        enrollBtn.onclick = null;
    } else {
        // Не записан
        enrollBtn.textContent = 'Записаться на курс';
        enrollBtn.className = 'btn btn-primary';
        enrollBtn.disabled = false;
        enrollBtn.onclick = function() {
            enrollInCourse(courseId);
        };
    }
}

// Настройка кнопки для неавторизованных пользователей
function setupEnrollButtonForUnauthenticated(courseId) {
    const enrollBtn = document.getElementById('enroll-btn');
    if (!enrollBtn) return;
    
    enrollBtn.textContent = 'Записаться на курс';
    enrollBtn.className = 'btn btn-primary';
    enrollBtn.onclick = function() {
        // Сохраняем курс для возврата
        localStorage.setItem('pending_course_enrollment', courseId);
        
        // Просто переходим на логин с параметром курса
        window.location.href = `/login.html?course=${courseId}`;
    };
}

// Рендеринг курса
/*function renderCourse(course) {
    console.log('🎨 Рендерим курс. DOM элементы:');
    console.log('course-title элемент:', document.getElementById('course-title'));
    console.log('course-description элемент:', document.getElementById('course-description'));
    console.log('enroll-btn элемент:', document.getElementById('enroll-btn'));
    // Заполняем основные данные
    const titleElement = document.getElementById('course-title');
    const descriptionElement = document.getElementById('course-description');
    const teacherElement = document.getElementById('course-teacher');
    const priceElement = document.getElementById('course-price');
    
    if (titleElement) titleElement.textContent = course.title || 'Название курса';
    if (descriptionElement) descriptionElement.textContent = course.description || 'Описание курса';
    
    if (teacherElement) {
        let teacherName = 'Не указан';
        if (course.teacher) {
            if (typeof course.teacher === 'object') {
                teacherName = `${course.teacher.first_name || ''} ${course.teacher.last_name || ''}`.trim();
                if (!teacherName) teacherName = course.teacher.name || 'Преподаватель';
            } else {
                teacherName = course.teacher;
            }
        }
        teacherElement.textContent = `Преподаватель: ${teacherName}`;
    }
    
    if (priceElement) {
        const price = course.price || 0;
        const priceText = price === 0 || price === '0.00' ? 'Бесплатно' : `${price} у.е.`;
        priceElement.textContent = `Цена: ${priceText}`;
    }
}*/

/*function renderCourse(course) {
    console.log('🎨 Рендерим курс. DOM элементы:');
    console.log('course-title элемент:', document.getElementById('course-title'));
    console.log('course-description элемент:', document.getElementById('course-description'));
    console.log('enroll-btn элемент:', document.getElementById('enroll-btn'));
    
    const loading = document.getElementById('course-loading');
    const content = document.getElementById('course-content');
    const error = document.getElementById('course-error');
    
    // ОТЛАДКА: Проверяем что нашли элементы
    console.log('Элементы:');
    console.log('- loading:', loading);
    console.log('- content:', content);
    console.log('- error:', error);
    
    // Показываем/скрываем элементы
    if (loading) {
        console.log('✅ Скрываем спиннер загрузки');
        loading.style.display = 'none';
    } else {
        console.error('❌ Элемент course-loading не найден!');
    }
    
    if (error) {
        error.style.display = 'none';
    }
    
    if (content) {
        console.log('✅ Показываем контент курса');
        content.style.display = 'block';
    } else {
        console.error('❌ Элемент course-content не найден!');
    }
    
    // Заполняем данные курса
    const titleElement = document.getElementById('course-title');
    if (titleElement) {
        console.log('Заполняем заголовок:', course.title);
        titleElement.textContent = course.title || 'Название курса';
    } else {
        console.error('❌ Элемент course-title не найден!');
    }
    
    const descriptionElement = document.getElementById('course-description');
    if (descriptionElement) {
        console.log('Заполняем описание:', course.description);
        descriptionElement.textContent = course.description || 'Описание курса';
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
    
    // Уровень курса - УДАЛИЛИ вызов getLevelText или добавим функцию
    const levelBadge = document.getElementById('course-level');
    if (levelBadge) {
        const level = course.level || 'basic';
        levelBadge.className = `course-level-badge ${level}`;
        
        // Простая функция для преобразования уровня
        function getLevelText(level) {
            const levelMap = {
                'basic': 'Для начинающих',
                'intermediate': 'Средний уровень',
                'advanced': 'Продвинутый уровень',
                'expert': 'Экспертный уровень'
            };
            return levelMap[level] || 'Для начинающих';
        }
        
        levelBadge.textContent = getLevelText(level);
    }
    
    // Кнопка записи
    const enrollBtn = document.getElementById('enroll-btn');
    if (enrollBtn) {
       enrollBtn.textContent = 'Записаться на курс';
       enrollBtn.onclick = function() {
           enrollInCourse(course.id || getCourseIdFromUrl());
       };
    }
    
    console.log('✅ renderCourse завершена');
}*/

function renderCourse(course) {
    console.log('🎨 Рендерим курс. DOM элементы:');
    console.log('course-title элемент:', document.getElementById('course-title'));
    console.log('course-description элемент:', document.getElementById('course-description'));
    console.log('enroll-btn элемент:', document.getElementById('enroll-btn'));
    
    const loading = document.getElementById('course-loading');
    const content = document.getElementById('course-content');
    const error = document.getElementById('course-error');
    
    // ОТЛАДКА: Проверяем что нашли элементы
    console.log('Элементы:');
    console.log('- loading:', loading);
    console.log('- content:', content);
    console.log('- error:', error);
    
    // Показываем/скрываем элементы
    if (loading) {
        console.log('✅ Скрываем спиннер загрузки');
        loading.style.display = 'none';
    } else {
        console.error('❌ Элемент course-loading не найден!');
    }
    
    if (error) {
        error.style.display = 'none';
    }
    
    if (content) {
        console.log('✅ Показываем контент курса');
        content.style.display = 'block';
    } else {
        console.error('❌ Элемент course-content не найден!');
    }
    
    // Заполняем данные курса
    const titleElement = document.getElementById('course-title');
    if (titleElement) {
        console.log('Заполняем заголовок:', course.title);
        titleElement.textContent = course.title || 'Название курса';
    } else {
        console.error('❌ Элемент course-title не найден!');
    }
    
    const descriptionElement = document.getElementById('course-description');
    if (descriptionElement) {
        console.log('Заполняем описание:', course.description);
        descriptionElement.textContent = course.description || 'Описание курса';
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
        
        function getLevelText(level) {
            const levelMap = {
                'basic': 'Для начинающих',
                'intermediate': 'Средний уровень',
                'advanced': 'Продвинутый уровень',
                'expert': 'Экспертный уровень'
            };
            return levelMap[level] || 'Для начинающих';
        }
        
        levelBadge.textContent = getLevelText(level);
    }
    
    // Кнопка записи
    const enrollBtn = document.getElementById('enroll-btn');
    if (enrollBtn) {
       enrollBtn.textContent = 'Записаться на курс';
       enrollBtn.onclick = function() {
           enrollInCourse(course.id || getCourseIdFromUrl());
       };
    }
    
    // РЕНДЕРИМ МОДУЛИ И УРОКИ 
    renderCourseModules(course.modules || []);
    
    console.log('✅ renderCourse завершена');
}

// Новая функция для рендеринга модулей курса
function renderCourseModules(modules) {
    console.log('📚 Рендерим модули:', modules);
    
    const modulesContainer = document.getElementById('modules-container');
    if (!modulesContainer) {
        console.error('❌ Контейнер модулей не найден');
        return;
    }
    
    if (!modules || modules.length === 0) {
        modulesContainer.innerHTML = '<p>Курс пока не имеет содержания.</p>';
        return;
    }
    
    let html = '';
    
    modules.forEach((module, moduleIndex) => {
        console.log(`Модуль ${moduleIndex + 1}:`, module);
        
        html += `
            <div class="course-module">
                <div class="module-header">
                    <h3>Модуль ${moduleIndex + 1}: ${module.title || 'Без названия'}</h3>
                    <span class="module-lessons-count">Уроков: ${module.lessons ? module.lessons.length : 0}</span>
                </div>
        `;
        
        if (module.description) {
            html += `<p class="module-description">${module.description}</p>`;
        }
        
        // Рендерим уроки внутри модуля
        if (module.lessons && module.lessons.length > 0) {
            html += '<div class="module-lessons">';
            
                module.lessons.forEach((lesson, lessonIndex) => {
            html += `
                <div class="lesson-item" onclick="goToLesson(${lesson.id})" 
                    style="cursor: pointer; transition: all 0.3s ease;">
                    <div class="lesson-icon">
                        ${lesson.type === 'video' ? '🎬' : 
                        lesson.type === 'text' ? '📄' : 
                        lesson.type === 'quiz' ? '📝' : '📚'}
                    </div>
                    <div class="lesson-info">
                        <h4>Урок ${lessonIndex + 1}: ${lesson.title || 'Без названия'}</h4>
                        ${lesson.description ? `<p>${lesson.description}</p>` : ''}
                        ${lesson.duration ? `<span class="lesson-duration">${lesson.duration} мин.</span>` : ''}
                        <span class="lesson-type">${getLessonTypeText(lesson.content_type)}</span>
                    </div>
                </div>
            `;
        });
            
            html += '</div>';
        } else {
            html += '<p class="no-lessons">В этом модуле пока нет уроков.</p>';
        }
        
        html += '</div>';
    });
    
    modulesContainer.innerHTML = html;
    console.log(`✅ Отображено ${modules.length} модулей`);
}

function getLessonTypeText(contentType) {
    const types = {
        'theory': '📚 Теория',
        'test': '📝 Тест',
        'creative_task': '📷 Творческое задание'
    };
    return types[contentType] || contentType;
}

// Функция перехода к уроку
function goToLesson(lessonId) {
    if (lessonId) {
        window.location.href = `/lesson.html?id=${lessonId}`;
    }
}

// Экспортируем функции
window.goToLesson = goToLesson;
// Обработка ошибок
function showError(message) {
    const errorElement = document.getElementById('course-error');
    const loadingElement = document.getElementById('course-loading');
    
    if (loadingElement) loadingElement.style.display = 'none';
    if (errorElement) {
        errorElement.style.display = 'block';
        errorElement.textContent = message;
    }
    
    // Также показываем алерт
    alert(message);
}

// Экспортируем функции
window.enrollInCourse = enrollInCourse;