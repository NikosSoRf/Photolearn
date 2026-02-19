let currentCourseId = null;
let modules = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log('Edit course page loaded');
    
    // Проверяем авторизацию
    checkAuthAndRole(['teacher']);
    
    // Получаем ID курса из URL
    const urlParams = new URLSearchParams(window.location.search);
    currentCourseId = urlParams.get('id');
    
    if (!currentCourseId) {
        showMessage('ID курса не указан', 'error');
        setTimeout(() => window.location.href = '/dashboard.html', 2000);
        return;
    }
    
    // Загружаем данные курса
    loadCourseData();
    
    // Настраиваем форму
    const form = document.getElementById('edit-course-form');
    if (form) {
        form.addEventListener('submit', handleUpdateCourse);
    }
    
    // Настраиваем кнопку добавления модуля
    const btnAddModule = document.getElementById('btn-add-module');
    if (btnAddModule) {
        btnAddModule.addEventListener('click', showAddModuleForm);
    }
    const lessonForm = document.getElementById('lesson-editor-form');
    if (lessonForm) {
        lessonForm.addEventListener('submit', async function(e) {
            // Этот обработчик уже добавлен выше в коде
        });
    }
    // Настраиваем кнопки формы модуля
    document.getElementById('btn-save-module')?.addEventListener('click', handleAddModule);
    document.getElementById('btn-cancel-module')?.addEventListener('click', hideAddModuleForm);

    addActionButtons();
});
// Добавляем кнопки действий в шапку
function addActionButtons() {
    const pageHeader = document.querySelector('.page-header');
    if (!pageHeader) return;
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'page-header-actions';
    actionsDiv.style.marginTop = '15px';
    actionsDiv.style.display = 'flex';
    actionsDiv.style.gap = '10px';
    actionsDiv.style.flexWrap = 'wrap';
    
    // Кнопка "Вернуться в ЛК"
    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-secondary';
    backBtn.innerHTML = '← Назад в Личный кабинет';
    backBtn.onclick = () => window.location.href = '/dashboard.html';
    
    // Кнопка "Удалить курс"
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.innerHTML = '🗑️ Удалить курс';
    deleteBtn.style.background = '#f56565';
    deleteBtn.style.color = 'white';
    deleteBtn.style.border = 'none';
    deleteBtn.onclick = deleteCourse;
    
    actionsDiv.appendChild(backBtn);
    actionsDiv.appendChild(deleteBtn);
    
    pageHeader.appendChild(actionsDiv);
}
async function loadCourseData() {
    try {
        const token = localStorage.getItem('auth_token');
        
        const response = await fetch(`/api/courses/${currentCourseId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Не удалось загрузить данные курса');
        }
        
        const course = await response.json();
        console.log('Курс загружен:', course);
        
        // Заполняем форму
        populateCourseForm(course);
        
        // Загружаем модули если они есть
        if (course.modules && course.modules.length > 0) {
            modules = course.modules;
            renderModules();
        }
        
    } catch (error) {
        console.error('Ошибка загрузки курса:', error);
        showMessage('Ошибка загрузки данных курса', 'error');
    }
}

function populateCourseForm(course) {
    document.getElementById('page-title').textContent = `Редактирование: ${course.title}`;
    document.getElementById('course-title').value = course.title || '';
    document.getElementById('course-description').value = course.description || '';
    document.getElementById('course-level').value = course.level || 'basic';
    document.getElementById('course-price').value = course.price || 0;
    document.getElementById('course-published').value = course.is_published ? 'true' : 'false';
    document.getElementById('video-call-link').value = course.video_call_link || '';
}

async function handleUpdateCourse(event) {
    event.preventDefault();
    
    const token = localStorage.getItem('auth_token');
    
    const courseData = {
        title: document.getElementById('course-title').value.trim(),
        description: document.getElementById('course-description').value.trim(),
        level: document.getElementById('course-level').value,
        price: parseFloat(document.getElementById('course-price').value) || 0,
        video_call_link: document.getElementById('video-call-link').value.trim() || null,
        is_published: document.getElementById('course-published').value === 'true'
    };
    
    // Валидация
    if (!courseData.title || !courseData.description) {
        showMessage('Пожалуйста, заполните все обязательные поля', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/courses/${currentCourseId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(courseData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showMessage('✅ Изменения сохранены', 'success');
        } else {
            showMessage(`❌ Ошибка: ${result.error || 'Не удалось обновить курс'}`, 'error');
        }
        
    } catch (error) {
        console.error('Error updating course:', error);
        showMessage('❌ Ошибка сети при сохранении', 'error');
    }
}

function showAddModuleForm() {
    document.getElementById('add-module-form').style.display = 'block';
    document.getElementById('btn-add-module').style.display = 'none';
}

function hideAddModuleForm() {
    document.getElementById('add-module-form').style.display = 'none';
    document.getElementById('btn-add-module').style.display = 'block';
    document.getElementById('new-module-title').value = '';
    document.getElementById('new-module-description').value = '';
}

async function handleAddModule() {
    const title = document.getElementById('new-module-title').value.trim();
    const description = document.getElementById('new-module-description').value.trim();
    
    if (!title) {
        showMessage('Введите название модуля', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('auth_token');
        
        const response = await fetch(`/api/courses/${currentCourseId}/modules`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title,
                description: description,
                order_index: modules.length + 1
            })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showMessage('✅ Модуль добавлен', 'success');
            hideAddModuleForm();
            
            // Обновляем список модулей
            modules.push(result.module);
            renderModules();
            // Показываем кнопку "Вернуться в ЛК" после создания модуля
            showBackToDashboardButton();
        } else {
            showMessage(`❌ Ошибка: ${result.message || 'Не удалось создать модуль'}`, 'error');
        }
        
    } catch (error) {
        console.error('Error adding module:', error);
        showMessage('❌ Ошибка при создании модуля', 'error');
    }
}
// Показать кнопку "Вернуться в ЛК" после создания модуля
function showBackToDashboardButton() {
    // Проверяем, есть ли уже такая кнопка
    let backButton = document.querySelector('.back-to-dashboard-btn');
    
    if (!backButton) {
        const modulesSection = document.querySelector('.modules-section');
        if (modulesSection) {
            // Создаем контейнер для кнопки
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'module-actions-footer';
            buttonContainer.style.marginTop = '25px';
            buttonContainer.style.paddingTop = '20px';
            buttonContainer.style.borderTop = '1px solid #e2e8f0';
            buttonContainer.style.textAlign = 'center';
            
            backButton = document.createElement('button');
            backButton.className = 'btn btn-primary back-to-dashboard-btn';
            backButton.innerHTML = '← Готово! Вернуться в Личный кабинет';
            backButton.style.padding = '12px 24px';
            backButton.style.fontSize = '16px';
            backButton.style.background = '#667eea';
            backButton.style.color = 'white';
            backButton.onclick = () => window.location.href = '/dashboard.html';
            
            buttonContainer.appendChild(backButton);
            modulesSection.appendChild(buttonContainer);
        }
    }
}
/*function renderModules() {
    const container = document.getElementById('modules-container');
    
    if (!modules || modules.length === 0) {
        container.innerHTML = '<p class="empty-state">В курсе пока нет модулей</p>';
        return;
    }
    
    container.innerHTML = modules.map((module, index) => `
        <div class="module-card" data-module-id="${module.id}">
            <div class="module-header">
                <h3 class="module-title">${module.title || 'Модуль ' + (index + 1)}</h3>
                <div class="module-actions">
                    <button onclick="addLesson(${module.id})" class="btn-add-lesson">+ Добавить урок</button>
                    <button onclick="deleteModule(${module.id})" class="btn-delete">Удалить</button>
                </div>
            </div>
            ${module.description ? `<p>${module.description}</p>` : ''}
            
            <div class="lessons-container" id="lessons-${module.id}">
                ${renderLessons(module.lessons || [])}
            </div>
        </div>
    `).join('');
}*/
let currentEditingModuleId = null;
let currentEditingModuleName = '';
let currentEditingLessonId = null;
function renderModules() {
    const container = document.getElementById('modules-container');
    
    if (!modules || modules.length === 0) {
        container.innerHTML = '<p class="empty-state">В курсе пока нет модулей</p>';
        return;
    }
    
    container.innerHTML = modules.map((module, index) => `
        <div class="module-card" data-module-id="${module.id}">
            <div class="module-header">
                <div class="module-info">
                    <h3 class="module-title">${module.title || 'Модуль ' + (index + 1)}</h3>
                    <div class="module-stats">
                        <span class="stat-lessons">📚 ${module.lessons ? module.lessons.length : 0} уроков</span>
                        <span class="module-order">#${index + 1}</span>
                    </div>
                </div>
                <div class="module-actions">
                    <button onclick="manageModuleLessons(${module.id}, '${module.title}')" class="btn btn-manage-lessons">
                        Управление уроками
                    </button>
                    <button onclick="showEditModuleForm(${module.id})" class="btn btn-edit">Редактировать</button>
                    <button onclick="deleteModule(${module.id})" class="btn btn-delete">Удалить</button>
                </div>
            </div>
            ${module.description ? `<p class="module-description">${module.description}</p>` : ''}
            
            <!-- Быстрый просмотр уроков -->
            <div class="module-lessons-preview">
                ${renderLessons(module.lessons || [])}
            </div>
        </div>
    `).join('');
}
/*function renderLessons(lessons) {
    if (!lessons || lessons.length === 0) {
        return '<p style="color: #666; font-style: italic;">В модуле пока нет уроков</p>';
    }
    
    return lessons.map(lesson => `
        <div class="lesson-item">
            <span class="lesson-title">${lesson.title || 'Урок'}</span>
            <span class="lesson-type">${getLessonTypeText(lesson.content_type)}</span>
        </div>
    `).join('');
}*/
function renderLessons(lessons) {
    if (!lessons || lessons.length === 0) {
        return '<p class="empty-lessons">В модуле пока нет уроков</p>';
    }
    
    // Показываем только первые 3 урока для предпросмотра
    const previewLessons = lessons.slice(0, 3);
    const remaining = lessons.length - 3;
    
    return `
        <div class="lessons-preview-list">
            ${previewLessons.map((lesson, idx) => `
                <div class="lesson-preview-item" data-lesson-id="${lesson.id}">
                    <span class="lesson-preview-icon">${getLessonIcon(lesson.content_type)}</span>
                    <span class="lesson-preview-title">${lesson.title || 'Урок ' + (idx + 1)}</span>
                    <span class="lesson-preview-type ${lesson.content_type}">${getLessonTypeText(lesson.content_type)}</span>
                </div>
            `).join('')}
            ${remaining > 0 ? `
                <div class="lesson-preview-more">
                    + еще ${remaining} уроков
                </div>
            ` : ''}
        </div>
    `;
}

// Вспомогательная функция для иконок уроков
function getLessonIcon(type) {
    const icons = {
        'theory': '📘',
        'test': '📝',
        'creative_task': '📷'
    };
    return icons[type] || '📄';
}
function getLessonTypeText(type) {
    const types = {
        'theory': 'Теория',
        'test': 'Тест',
        'creative_task': 'Задание'
    };
    return types[type] || type;
}
async function manageModuleLessons(moduleId, moduleTitle) {
    currentEditingModuleId = moduleId;
    currentEditingModuleName = moduleTitle;
    
    // Показываем секцию управления уроками
    document.getElementById('current-module-name').textContent = moduleTitle;
    document.getElementById('module-details-section').style.display = 'block';
    document.querySelector('.modules-section').style.display = 'none';
    
    // Загружаем уроки модуля
    await loadModuleLessons(moduleId);
}

// Загрузка уроков модуля
async function loadModuleLessons(moduleId) {
    try {
        const token = localStorage.getItem('auth_token');
        
        const response = await fetch(`/api/courses/modules/${moduleId}/lessons`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Не удалось загрузить уроки');
        }
        
        const lessons = await response.json();
        renderLessonsManagement(lessons);
        
    } catch (error) {
        console.error('Ошибка загрузки уроков:', error);
        showMessage('Ошибка загрузки уроков', 'error');
        document.getElementById('lessons-management-container').innerHTML = 
            '<p class="error">Не удалось загрузить уроки</p>';
    }
}

// Отображение управления уроками
function renderLessonsManagement(lessons) {
    const container = document.getElementById('lessons-management-container');
    
    if (!lessons || lessons.length === 0) {
        container.innerHTML = `
            <div class="empty-state-card">
                <div class="empty-icon">📚</div>
                <h4>В модуле пока нет уроков</h4>
                <p>Добавьте первый урок, чтобы начать наполнение модуля</p>
                <button onclick="showAddLessonForm()" class="btn btn-primary">+ Создать первый урок</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="lessons-list-header">
            <div class="lessons-count">Всего уроков: ${lessons.length}</div>
            <div class="lessons-filters">
                <select id="filter-lesson-type" class="form-control" style="width: 150px;" onchange="filterLessons()">
                    <option value="all">Все типы</option>
                    <option value="theory">Теория</option>
                    <option value="test">Тесты</option>
                    <option value="creative_task">Задания</option>
                </select>
            </div>
        </div>
        <div class="lessons-grid" id="lessons-grid">
            ${lessons.map(lesson => `
                <div class="lesson-management-card" data-lesson-id="${lesson.id}" data-type="${lesson.content_type}">
                    <div class="lesson-card-header">
                        <div class="lesson-type-icon ${lesson.content_type}">
                            ${getLessonIcon(lesson.content_type)}
                        </div>
                        <div class="lesson-card-title">
                            <h4>${lesson.title}</h4>
                            <span class="lesson-order">#${lesson.order_index || 1}</span>
                        </div>
                        <div class="lesson-card-actions">
                            <button onclick="editLessonDetailed(${lesson.id})" class="btn-action btn-edit" title="Редактировать">
                                ✏️
                            </button>
                            <button onclick="deleteLesson(${lesson.id}, ${currentEditingModuleId})" class="btn-action btn-delete" title="Удалить">
                                🗑️
                            </button>
                        </div>
                    </div>
                    <div class="lesson-card-content">
                        <p class="lesson-content-preview">
                            ${lesson.content ? lesson.content.substring(0, 100) + '...' : 'Нет описания'}
                        </p>
                        ${lesson.video_url ? `
                            <div class="lesson-video-info">
                                <span>🎬 Есть видео</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="lesson-card-footer">
                        <span class="lesson-type-badge ${lesson.content_type}">
                            ${getLessonTypeText(lesson.content_type)}
                        </span>
                        <span class="lesson-updated">
                            ${lesson.updatedAt ? new Date(lesson.updatedAt).toLocaleDateString('ru-RU') : ''}
                        </span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Фильтрация уроков по типу
function filterLessons() {
    const filterType = document.getElementById('filter-lesson-type').value;
    const lessons = document.querySelectorAll('.lesson-management-card');
    
    lessons.forEach(lesson => {
        if (filterType === 'all' || lesson.dataset.type === filterType) {
            lesson.style.display = 'block';
        } else {
            lesson.style.display = 'none';
        }
    });
}

// Показать форму добавления урока
function showAddLessonForm() {
    currentEditingLessonId = null;
    document.getElementById('lesson-editor-title').textContent = 'Новый урок';
    document.getElementById('lesson-editor-container').style.display = 'block';
    document.getElementById('lesson-editor-form').reset();
    document.getElementById('edit-lesson-order').value = 
        document.querySelectorAll('.lesson-management-card').length + 1;
    
    // Скрыть дополнительные поля по умолчанию
    document.getElementById('lesson-extra-fields').style.display = 'none';
    document.getElementById('content-hint-text').textContent = 'HTML-разметка поддерживается';
}

// Показать форму редактирования урока
async function editLessonDetailed(lessonId) {
    try {
        const token = localStorage.getItem('auth_token');
        
        const response = await fetch(`/api/courses/lessons/${lessonId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Не удалось загрузить урок');
        }
        
        const lesson = await response.json();
        currentEditingLessonId = lessonId;
        
        // Заполняем форму
        document.getElementById('lesson-editor-title').textContent = 'Редактирование урока';
        document.getElementById('edit-lesson-title').value = lesson.title || '';
        document.getElementById('edit-lesson-type').value = lesson.content_type || 'theory';
        document.getElementById('edit-lesson-content').value = lesson.content || '';
        document.getElementById('edit-lesson-order').value = lesson.order_index || 1;
        document.getElementById('edit-lesson-video').value = lesson.video_url || '';
        
        // Показываем дополнительные поля в зависимости от типа
        toggleLessonContentType();
        
        // Показываем форму
        document.getElementById('lesson-editor-container').style.display = 'block';
        
    } catch (error) {
        console.error('Ошибка загрузки урока:', error);
        showMessage('Не удалось загрузить данные урока', 'error');
    }
}

// Переключение дополнительных полей в зависимости от типа урока
function toggleLessonContentType() {
    const type = document.getElementById('edit-lesson-type').value;
    const extraFields = document.getElementById('lesson-extra-fields');
    
    // Скрываем все подсекции
    document.getElementById('test-fields').style.display = 'none';
    document.getElementById('creative-task-fields').style.display = 'none';
    
    // Меняем подсказку для контента
    const hintText = document.getElementById('content-hint-text');
    
    switch(type) {
        case 'test':
            extraFields.style.display = 'block';
            document.getElementById('test-fields').style.display = 'block';
            hintText.textContent = 'Используйте формат JSON для вопросов теста';
            break;
            
        case 'creative_task':
            extraFields.style.display = 'block';
            document.getElementById('creative-task-fields').style.display = 'block';
            hintText.textContent = 'Опишите задание, требования и критерии оценки';
            break;
            
        default:
            extraFields.style.display = 'none';
            hintText.textContent = 'HTML-разметка поддерживается';
    }
}

// Сохранение урока (новая или существующая версия)
document.getElementById('lesson-editor-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const lessonData = {
        title: document.getElementById('edit-lesson-title').value.trim(),
        content_type: document.getElementById('edit-lesson-type').value,
        content: document.getElementById('edit-lesson-content').value.trim(),
        order_index: parseInt(document.getElementById('edit-lesson-order').value) || 1,
        video_url: document.getElementById('edit-lesson-video').value.trim() || null
    };
    
    // Добавляем дополнительные данные для специфических типов
    const type = lessonData.content_type;
    if (type === 'test') {
        lessonData.meta_data = {
            format: document.querySelector('input[name="test-format"]:checked').value,
            question_count: parseInt(document.getElementById('test-question-count').value) || 10
        };
    } else if (type === 'creative_task') {
        lessonData.meta_data = {
            max_files: parseInt(document.getElementById('task-max-files').value) || 5,
            max_size_mb: parseInt(document.getElementById('task-max-size').value) || 20,
            allowed_formats: Array.from(document.querySelectorAll('input[name="task-formats"]:checked'))
                .map(cb => cb.value)
        };
    }
    
    // Валидация
    if (!lessonData.title || !lessonData.content) {
        showMessage('Заполните название и содержание урока', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('auth_token');
        const url = currentEditingLessonId 
            ? `/api/courses/lessons/${currentEditingLessonId}`
            : `/api/courses/modules/${currentEditingModuleId}/lessons`;
        
        const method = currentEditingLessonId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(lessonData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showMessage(`✅ Урок ${currentEditingLessonId ? 'обновлен' : 'создан'}`, 'success');
            hideLessonEditor();
            
            // Обновляем список уроков
            if (currentEditingLessonId) {
                // Обновляем существующий урок в массиве
                const module = modules.find(m => m.id === currentEditingModuleId);
                if (module && module.lessons) {
                    const lessonIndex = module.lessons.findIndex(l => l.id === currentEditingLessonId);
                    if (lessonIndex > -1) {
                        module.lessons[lessonIndex] = result.lesson;
                    }
                }
            } else {
                // Добавляем новый урок
                const module = modules.find(m => m.id === currentEditingModuleId);
                if (module) {
                    if (!module.lessons) module.lessons = [];
                    module.lessons.push(result.lesson);
                }
            }
            
            // Перерисовываем модули
            renderModules();
            
            // Если мы в режиме управления уроками, обновляем эту секцию тоже
            if (document.getElementById('module-details-section').style.display === 'block') {
                await loadModuleLessons(currentEditingModuleId);
            }
            
        } else {
            showMessage(`❌ Ошибка: ${result.message || 'Не удалось сохранить урок'}`, 'error');
        }
        
    } catch (error) {
        console.error('Ошибка сохранения урока:', error);
        showMessage('Ошибка сети при сохранении урока', 'error');
    }
});

// Скрыть редактор уроков
function hideLessonEditor() {
    document.getElementById('lesson-editor-container').style.display = 'none';
    currentEditingLessonId = null;
}

// Вернуться к списку модулей
function hideModuleDetails() {
    document.getElementById('module-details-section').style.display = 'none';
    document.querySelector('.modules-section').style.display = 'block';
    currentEditingModuleId = null;
}
/*async function addLesson(moduleId) {
    const lessonTitle = prompt('Введите название урока:');
    if (!lessonTitle) return;
    
    const lessonType = prompt('Тип урока (theory/test/creative_task):', 'theory');
    
    try {
        const token = localStorage.getItem('auth_token');
        
        const response = await fetch(`/api/courses/modules/${moduleId}/lessons`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: lessonTitle,
                content_type: lessonType || 'theory',
                content: '',
                order_index: 1
            })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showMessage('✅ Урок добавлен', 'success');
            // Обновляем отображение уроков
            const module = modules.find(m => m.id === moduleId);
            if (module) {
                if (!module.lessons) module.lessons = [];
                module.lessons.push(result.lesson);
                renderModules();
            }
        } else {
            showMessage(`❌ Ошибка: ${result.message || 'Не удалось создать урок'}`, 'error');
        }
        
    } catch (error) {
        console.error('Error adding lesson:', error);
        showMessage('❌ Ошибка при создании урока', 'error');
    }
}*/
async function deleteLesson(lessonId, moduleId) {
    if (!confirm('Удалить этот урок?')) return;
    
    try {
        const token = localStorage.getItem('auth_token');
        
        const response = await fetch(`/api/courses/lessons/${lessonId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showMessage('✅ Урок удален', 'success');
            // Удаляем урок из массива и перерисовываем
            const module = modules.find(m => m.id === moduleId);
            if (module && module.lessons) {
                module.lessons = module.lessons.filter(l => l.id !== lessonId);
                renderModules();
            }
        } else {
            const result = await response.json();
            showMessage(`❌ Ошибка: ${result.message || 'Не удалось удалить урок'}`, 'error');
        }
        
    } catch (error) {
        console.error('Error deleting lesson:', error);
        showMessage('❌ Ошибка при удалении урока', 'error');
    }
}
async function deleteModule(moduleId) {
    if (!confirm('Удалить этот модуль и все уроки в нем?')) return;
    
    try {
        const token = localStorage.getItem('auth_token');
        
        const response = await fetch(`/api/courses/modules/${moduleId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showMessage('✅ Модуль удален', 'success');
            // Удаляем модуль из массива и перерисовываем
            modules = modules.filter(m => m.id !== moduleId);
            renderModules();
        } else {
            const result = await response.json();
            showMessage(`❌ Ошибка: ${result.message || 'Не удалось удалить модуль'}`, 'error');
        }
        
    } catch (error) {
        console.error('Error deleting module:', error);
        showMessage('❌ Ошибка при удалении модуля', 'error');
    }
}
// ФУНКЦИЯ УДАЛЕНИЯ КУРСА
async function deleteCourse() {
    if (!confirm('❌ УДАЛИТЬ КУРС?\n\nЭто действие удалит весь курс, все модули и уроки в нем.\nДействие необратимо!')) {
        return;
    }
    
    if (!confirm('Вы уверены? Это окончательное удаление.')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('auth_token');
        
        const response = await fetch(`/api/courses/${currentCourseId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showMessage('✅ Курс успешно удален. Возвращаемся в личный кабинет...', 'success');
            
            // Переадресация в ЛК через 2 секунды
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 2000);
            
        } else {
            const result = await response.json();
            showMessage(`❌ Ошибка удаления: ${result.message || 'Не удалось удалить курс'}`, 'error');
        }
        
    } catch (error) {
        console.error('Error deleting course:', error);
        showMessage('❌ Ошибка сети при удалении курса', 'error');
    }
}

function showMessage(message, type) {
    const container = document.getElementById('message-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="message ${type}">
            ${message}
        </div>
    `;
    
    // Автоматически скрыть через 5 секунд
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

function checkAuthAndRole(allowedRoles) {
    const token = localStorage.getItem('auth_token');
    const userRole = localStorage.getItem('user_role');
    
    if (!token) {
        window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
        return false;
    }
    
    if (!allowedRoles.includes(userRole)) {
        showMessage('У вас нет прав для доступа к этой странице', 'error');
        setTimeout(() => window.location.href = '/dashboard.html', 2000);
        return false;
    }
    
    return true;
}

// Делаем функции доступными глобально
window.deleteCourse = deleteCourse;
window.addLesson = addLesson;
window.deleteModule = deleteModule;
window.deleteLesson = deleteLesson;
window.manageModuleLessons = manageModuleLessons;
window.hideModuleDetails = hideModuleDetails;
window.showAddLessonForm = showAddLessonForm;
window.hideLessonEditor = hideLessonEditor;
window.editLessonDetailed = editLessonDetailed;
window.toggleLessonContentType = toggleLessonContentType;
window.filterLessons = filterLessons;