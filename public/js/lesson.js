// ========== ОСНОВНАЯ ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('📚 Lesson page loaded');
    initializeLessonPage();
});

async function initializeLessonPage() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const lessonId = urlParams.get('id');
        
        if (!lessonId) {
            showError('ID урока не указан');
            return;
        }
        
        console.log('🔍 Загружаем урок ID:', lessonId);
        await checkAuth();
        const lessonData = await loadLessonData(lessonId);
        if (!lessonData) return;
        renderLesson(lessonData);
        
        // Если это творческое задание, проверяем статус
        if (lessonData.lesson.content_type === 'creative_task') {
            await checkAssignmentStatus(lessonId);
        }
        
        setupEventListeners();
        
        console.log('✅ Урок успешно загружен');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
        showError('Не удалось загрузить урок');
    }
}

// АВТОРИЗАЦИЯ 
async function checkAuth() {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    const userGreeting = document.getElementById('user-greeting');
    
    if (!token) {
        console.log('⚠️ Пользователь не авторизован');
        return false;
    }
    
    try {
        // Декодируем токен для получения имени
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (userGreeting) {
            userGreeting.textContent = `Привет, ${payload.first_name || 'Пользователь'}!`;
        }
        return true;
    } catch (e) {
        console.error('❌ Ошибка парсинга токена:', e);
        return false;
    }
}

// ЗАГРУЗКА ДАННЫХ УРОКА 
async function loadLessonData(lessonId) {
    try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        console.log('📡 Запрашиваем данные урока...');
        const response = await fetch(`/api/lessons/full/${lessonId}`, { headers });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка загрузки урока');
        }
        
        const data = await response.json();
        console.log('✅ Данные урока получены:', data);
        return data;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки урока:', error);
        showError('Не удалось загрузить урок');
        return null;
    }
}

// РЕНДЕРИНГ УРОКА
function renderLesson(data) {
    const { lesson, navigation, course } = data;
    
    // Показываем/скрываем элементы
    document.getElementById('lesson-loading').style.display = 'none';
    document.getElementById('lesson-error').style.display = 'none';
    document.getElementById('lesson-content').style.display = 'block';
    
    // Заголовок
    document.getElementById('lesson-title').textContent = lesson.title;
    
    // Тип урока
    const typeBadge = document.getElementById('lesson-type');
    typeBadge.className = `lesson-type-badge ${lesson.content_type}`;
    typeBadge.textContent = getLessonTypeText(lesson.content_type);
    
    // Мета-информация
    document.getElementById('lesson-course').textContent = `Курс: ${course.title}`;
    document.getElementById('lesson-module').textContent = `Модуль: ${lesson.module.title}`;
    document.getElementById('lesson-number').textContent = `Урок ${navigation.current} из ${navigation.total}`;
    

    document.getElementById('breadcrumbs').innerHTML = `
        <a href="/courses">Курсы</a> 
        <span>›</span>
        <a href="/first_course?id=${course.id}">${course.title}</a>
        <span>›</span>
        <span>${lesson.title}</span>
    `;
    
    // Контент урока
    const article = document.getElementById('lesson-article');
    article.innerHTML = formatLessonContent(lesson.content);
    

    showSpecialSection(lesson.content_type, lesson.content);
    setupNavigation(navigation, course.id);
    loadCourseTOC(course.id, lesson.id);
}

function formatLessonContent(content) {
    if (!content) return '<p>Контент урока пока не добавлен.</p>';
    
    return content
        .split('\n')
        .map(paragraph => {
            if (paragraph.trim() === '') return '';
            if (paragraph.startsWith('# ')) return `<h2>${paragraph.substring(2)}</h2>`;
            if (paragraph.startsWith('## ')) return `<h3>${paragraph.substring(3)}</h3>`;
            if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) return `<li>${paragraph.substring(2)}</li>`;
            return `<p>${paragraph}</p>`;
        })
        .join('');
}

function showSpecialSection(contentType, content) {
    // Скрываем все секции
    document.getElementById('assignment-section').style.display = 'none';
    document.getElementById('quiz-section').style.display = 'none';
    
    if (contentType === 'creative_task') {
        const section = document.getElementById('assignment-section');
        section.style.display = 'block';
        document.getElementById('assignment-instructions').innerHTML = formatLessonContent(content);
    } else if (contentType === 'test') {
        const section = document.getElementById('quiz-section');
        section.style.display = 'block';
        document.getElementById('quiz-content').innerHTML = `<p>${content || 'Тестовые вопросы скоро будут добавлены.'}</p>`;
    }
}

function setupNavigation(navigation, courseId) {
    const prevBtn = document.getElementById('prev-lesson-btn');
    const nextBtn = document.getElementById('next-lesson-btn');
    const navContainer = document.getElementById('lesson-navigation');
    
    // Верхняя навигация
    navContainer.innerHTML = '';
    
    if (navigation.prev) {
        const prevNav = document.createElement('a');
        prevNav.href = `/lesson.html?id=${navigation.prev.id}`;
        prevNav.className = 'btn btn-secondary';
        prevNav.textContent = '← Предыдущий';
        navContainer.appendChild(prevNav);
    }
    
    if (navigation.next) {
        const nextNav = document.createElement('a');
        nextNav.href = `/lesson.html?id=${navigation.next.id}`;
        nextNav.className = 'btn btn-primary';
        nextNav.textContent = 'Следующий →';
        navContainer.appendChild(nextNav);
    }
    
    // Нижняя навигация
    prevBtn.style.display = navigation.prev ? 'block' : 'none';
    nextBtn.style.display = navigation.next ? 'block' : 'none';
    
    if (navigation.prev) {
        prevBtn.onclick = () => window.location.href = `/lesson.html?id=${navigation.prev.id}`;
    }
    
    if (navigation.next) {
        nextBtn.onclick = () => window.location.href = `/lesson.html?id=${navigation.next.id}`;
    }
    
    // Кнопка "Вернуться к курсу"
    const backToCourse = document.createElement('a');
    backToCourse.href = `/first_course?id=${courseId}`;
    backToCourse.className = 'btn btn-secondary';
    backToCourse.textContent = 'К курсу';
    navContainer.appendChild(backToCourse);
}

//ПРОВЕРКА СТАТУСА ЗАДАНИЯ
async function checkAssignmentStatus(lessonId) {
    try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        
        if (!token) {
            console.log('⚠️ Нет токена, показываем форму входа');
            showLoginPrompt();
            return;
        }
        
        console.log('📝 Проверяем статус задания для урока:', lessonId);
        
        const response = await fetch(`/api/assignments/lesson/${lessonId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Статус задания:', result);
            
            if (result.success && result.assignment) {
                showSubmittedWork(result.assignment);
            } else {
                showUploadForm();
            }
        } else {
            showUploadForm();
        }
        
    } catch (error) {
        console.error('❌ Ошибка проверки статуса:', error);
        showUploadForm();
    }
}

function showSubmittedWork(assignment) {
    const uploadArea = document.getElementById('upload-area');
    const submittedWork = document.getElementById('submitted-work');
    
    // Скрываем форму загрузки
    if (uploadArea) uploadArea.style.display = 'none';
    
    // Создаем или обновляем блок с загруженной работой
    let workContainer = document.getElementById('submitted-work-container');
    
    if (!workContainer) {
        workContainer = document.createElement('div');
        workContainer.id = 'submitted-work-container';
        workContainer.className = 'submitted-work';
        
        // Вставляем после инструкций задания
        const instructions = document.getElementById('assignment-instructions');
        if (instructions) {
            instructions.parentNode.insertBefore(workContainer, instructions.nextSibling);
        }
    }
    
    const hasPhoto = assignment.photo_url && assignment.photo_url !== 'null';
    const statusText = getAssignmentStatusText(assignment.status);
    const statusClass = getAssignmentStatusClass(assignment.status);
    
    workContainer.innerHTML = `
        <div class="work-header">
            <h4>📸 Ваша загруженная работа</h4>
            <span class="work-status ${statusClass}">${statusText}</span>
        </div>
        
        ${hasPhoto ? `
        <div class="work-preview">
            <img src="${assignment.photo_url}" 
                 alt="Работа студента" 
                 onerror="this.src='/images/placeholder.jpg'"
                 onclick="viewWorkFullscreen('${assignment.photo_url}')"
                 style="cursor: pointer; max-width: 100%; max-height: 400px; border-radius: 8px;">
        </div>
        ` : '<p>Фото не загружено</p>'}
        
        <div class="work-details">
            <p><strong>Загружено:</strong> ${formatDate(assignment.submitted_at) || 'Не указано'}</p>
            ${assignment.grade ? `<p><strong>Оценка:</strong> ${assignment.grade}/10</p>` : ''}
            ${assignment.teacher_comment ? `
                <div class="teacher-feedback">
                    <strong>Комментарий преподавателя:</strong>
                    <p>${assignment.teacher_comment}</p>
                </div>
            ` : ''}
        </div>
        
        <div class="work-actions">
            <button onclick="updateWork()" class="btn btn-primary">
                Обновить работу
            </button>
            ${hasPhoto ? `
            <button onclick="viewWorkFullscreen('${assignment.photo_url}')" class="btn btn-secondary">
                Просмотреть в полном размере
            </button>
            ` : ''}
        </div>
    `;
}

function showUploadForm() {
    const uploadArea = document.getElementById('upload-area');
    const workContainer = document.getElementById('submitted-work-container');
    
    if (uploadArea) {
        uploadArea.style.display = 'block';
        uploadArea.innerHTML = `
            <h4>Загрузите вашу работу</h4>
            <form id="upload-form" enctype="multipart/form-data">
                <div class="form-group">
                    <label for="assignment-comment">Комментарий к работе (необязательно):</label>
                    <textarea id="assignment-comment" name="comment" rows="3" 
                              placeholder="Опишите вашу работу, если это необходимо..."></textarea>
                </div>
                
                <input type="file" id="photo-upload" name="photo" accept="image/*" class="file-input">
                <label for="photo-upload" class="file-label">
                    <span>Выберите файл</span>
                    <span class="file-name" id="file-name">Файл не выбран</span>
                </label>
                
                <div class="upload-info">
                    <p><small>Поддерживаемые форматы: JPG, PNG, GIF, BMP, WebP</small></p>
                    <p><small>Максимальный размер: 50 МБ</small></p>
                </div>
                
                <button type="submit" class="btn btn-primary" id="submit-btn">
                    Отправить на проверку
                </button>
            </form>
            <div id="upload-progress" style="display: none;">
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <p>Загрузка...</p>
            </div>
        `;
        
        // Настраиваем события для новой формы
        setupUploadFormEvents();
    }
    
    if (workContainer) {
        workContainer.style.display = 'none';
    }
}

function showLoginPrompt() {
    const uploadArea = document.getElementById('upload-area');
    if (uploadArea) {
        uploadArea.innerHTML = `
            <div class="login-prompt">
                <h4>Для загрузки работы необходимо войти в систему</h4>
                <p>Пожалуйста, авторизуйтесь чтобы отправить свою работу на проверку</p>
                <a href="/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}" 
                   class="btn btn-primary">
                    Войти
                </a>
            </div>
        `;
    }
}

// ========== ЗАГРУЗКА ФАЙЛА ==========
async function handlePhotoUpload(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('photo-upload');
    const lessonId = new URLSearchParams(window.location.search).get('id');
    const comment = document.getElementById('assignment-comment')?.value || '';
    
    if (!fileInput.files.length) {
        alert('Пожалуйста, выберите файл для загрузки');
        return;
    }
    
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) {
        alert('Для загрузки работы необходимо войти в систему');
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
    }
    
    const formData = new FormData();
    formData.append('photo', fileInput.files[0]);
    formData.append('lesson_id', lessonId);
    formData.append('comment', comment);
    
    console.log('📤 Отправка файла:', fileInput.files[0].name, 'урок:', lessonId);
    
    try {
        // Показываем прогресс
        const progress = document.getElementById('upload-progress');
        const submitBtn = document.getElementById('submit-btn');
        
        progress.style.display = 'block';
        submitBtn.disabled = true;
        
        const response = await fetch('/api/assignments/submit', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        const result = await response.json();
        console.log('📨 Ответ сервера:', result);
        
        if (response.ok) {
            alert('✅ Работа успешно отправлена на проверку!');
            // Обновляем статус задания
            await checkAssignmentStatus(lessonId);
        } else {
            alert('❌ Ошибка: ' + (result.error || 'Неизвестная ошибка'));
        }
        
    } catch (error) {
        console.error('❌ Ошибка загрузки:', error);
        alert('❌ Ошибка при загрузке файла: ' + error.message);
    } finally {
        const progress = document.getElementById('upload-progress');
        const submitBtn = document.getElementById('submit-btn');
        
        if (progress) progress.style.display = 'none';
        if (submitBtn) submitBtn.disabled = false;
    }
}

//НАСТРОЙКА СОБЫТИЙ
function setupEventListeners() {
    // Настраиваем форму загрузки
    setupUploadFormEvents();
    
    // Отправка теста
    const submitQuizBtn = document.getElementById('submit-quiz-btn');
    if (submitQuizBtn) {
        submitQuizBtn.addEventListener('click', handleQuizSubmit);
    }
}

function setupUploadFormEvents() {
    const fileInput = document.getElementById('photo-upload');
    const fileName = document.getElementById('file-name');
    const uploadForm = document.getElementById('upload-form');
    
    if (fileInput && fileName) {
        fileInput.addEventListener('change', function() {
            fileName.textContent = this.files.length > 0 ? this.files[0].name : 'Файл не выбран';
        });
    }
    
    if (uploadForm) {
        uploadForm.addEventListener('submit', handlePhotoUpload);
    }
}


async function loadCourseTOC(courseId, currentLessonId) {
    try {
        const response = await fetch(`/api/courses/${courseId}`);
        const course = await response.json();
        
        if (response.ok) {
            renderCourseTOC(course, currentLessonId);
        }
    } catch (error) {
        console.error('Ошибка загрузки содержания:', error);
    }
}

function renderCourseTOC(course, currentLessonId) {
    const tocContainer = document.getElementById('course-toc');
    
    if (!course.modules || course.modules.length === 0) {
        tocContainer.innerHTML = '<p>Содержание курса пока не добавлено.</p>';
        return;
    }
    
    const tocHTML = course.modules.map(module => `
        <div class="module-toc">
            <div class="module-title-toc">${module.title}</div>
            <div class="lessons-toc">
                ${(module.lessons || []).map(lesson => `
                    <div class="lesson-toc ${lesson.id == currentLessonId ? 'active' : ''}" 
                         onclick="window.location.href='/lesson.html?id=${lesson.id}'">
                        <span class="lesson-icon">${getLessonIcon(lesson.content_type)}</span>
                        ${lesson.title}
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
    
    tocContainer.innerHTML = tocHTML;
}

function getLessonTypeText(contentType) {
    const types = {
        'theory': 'Теория',
        'test': 'Тест',
        'creative_task': 'Творческое задание'
    };
    return types[contentType] || contentType;
}

function getLessonIcon(contentType) {
    const icons = {
        'theory': '📚',
        'test': '📝',
        'creative_task': '📷'
    };
    return icons[contentType] || '📄';
}

function getAssignmentStatusText(status) {
    const statuses = {
        'pending': 'Ожидает загрузки',
        'submitted': 'Отправлено на проверку',
        'under_review': 'На проверке',
        'completed': 'Завершено',
        'rejected': 'Требует доработки'
    };
    return statuses[status] || status;
}

function getAssignmentStatusClass(status) {
    const classes = {
        'pending': 'status-pending',
        'submitted': 'status-submitted',
        'under_review': 'status-under-review',
        'completed': 'status-completed',
        'rejected': 'status-rejected'
    };
    return classes[status] || 'status-pending';
}

function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
}

function handleQuizSubmit() {
    alert('Функция отправки теста скоро будет доступна!');
}

function updateWork() {
    showUploadForm();
}

function viewWorkFullscreen(photoUrl) {
    if (photoUrl) {
        window.open(photoUrl, '_blank');
    }
}

function showError(message) {
    document.getElementById('lesson-loading').style.display = 'none';
    const error = document.getElementById('lesson-error');
    error.style.display = 'block';
    error.textContent = message;
}


window.updateWork = updateWork;
window.viewWorkFullscreen = viewWorkFullscreen;

//ОТЛАДКА
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    setTimeout(() => {
        console.log('🔍 Отладка урока:');
        console.log('URL params:', new URLSearchParams(window.location.search).toString());
        console.log('Токен:', localStorage.getItem('auth_token') ? 'Есть' : 'Нет');
    }, 1000);
}