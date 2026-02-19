// ========== СТУДЕНТ ==========
/*async function loadStudentDashboard() {
console.log('📚 Загружаем дашборд студента');
const token = localStorage.getItem('auth_token');
console.log('🔍 Проверка данных пользователя:');
console.log('- Токен:', localStorage.getItem('auth_token') ? 'Есть' : 'Нет');
console.log('- Роль:', localStorage.getItem('user_role'));
console.log('- ID пользователя:', localStorage.getItem('user_id'));

// В блоке загрузки заданий добавьте отладку:
console.log('📡 Запрашиваем задания студента...');
console.log('- URL:', '/api/assignments/my-assignments');
console.log('- Токен:', token ? 'Есть' : 'Нет');

const assignmentsResponse = await fetch('/api/assignments/my-assignments', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});

console.log('- Статус ответа:', assignmentsResponse.status);
console.log('- OK?', assignmentsResponse.ok);

// Если ошибка 404, значит эндпоинт не существует
if (assignmentsResponse.status === 404) {
    console.error('❌ Эндпоинт /api/assignments/my-assignments не найден!');
    console.log('🔍 Проверим другие возможные URL:');
    
    // Проверка других возможных эндпоинтов
    const endpoints = [
        '/api/student/assignments',
        '/api/student/my-assignments',
        '/api/users/assignments'
    ];
    
    for (const endpoint of endpoints) {
        try {
            const testResponse = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log(`- ${endpoint}: ${testResponse.status}`);
        } catch (e) {
            console.log(`- ${endpoint}: Ошибка`);
        }
    }
}
    window.addEventListener('error', function(e) {
    console.error('Глобальная ошибка:', e.error);
    
    if (e.message.includes('uploadAssignment')) {
        console.log('🔄 Перезагружаем страницу из-за ошибки загрузки');
        setTimeout(() => {
            loadStudentDashboard();
        }, 2000);
    }
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Необработанное обещание:', e.reason);
});
    try {
       // const token = localStorage.getItem('auth_token');
        
        // Загружаем курсы студента
        console.log('📡 Запрашиваем курсы студента...');
        const coursesResponse = await fetch('/api/enrollments/my-courses', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (coursesResponse.ok) {
            const result = await coursesResponse.json(); // Получаем объект с данными
            console.log('✅ Ответ от сервера:', result);
            
            // ИЗМЕНЕНИЕ ЗДЕСЬ: Извлекаем массив курсов из объекта
            const courses = result.courses || result.data?.courses || result.data || [];
            console.log('📋 Извлеченные курсы:', courses);
            
            renderStudentCourses(courses);
            updateStudentStats(courses);
        } else {
            console.warn('⚠️ Не удалось загрузить курсы:', coursesResponse.status);
            showDemoStudentData();
        }

        // Загружаем задания студента
        console.log('📡 Запрашиваем задания студента...');
        const assignmentsResponse = await fetch('/api/assignments/my-assignments', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (assignmentsResponse.ok) {
            const result = await assignmentsResponse.json();
            console.log('✅ Ответ по заданиям:', result);
            
            // Извлекаем массив заданий
            const assignments = result.assignments || result.data?.assignments || result.data || [];
            console.log('📋 Извлеченные задания:', assignments);
            
            renderStudentAssignments(assignments);
        } else {
            console.warn('⚠️ Не удалось загрузить задания:', assignmentsResponse.status);
            // Попробуем получить текст ошибки
        try {
            const errorText = await assignmentsResponse.text();
            console.error('❌ Текст ошибки:', errorText);
        } catch (e) {
            console.error('❌ Не удалось прочитать ошибку:', e);
        }
        
        // Показываем заглушку вместо ошибки
        showNoAssignmentsMessage();
        }

    } catch (error) {
        console.error('❌ Ошибка загрузки данных студента:', error);
        showDemoStudentData();
    }
}*/

async function loadStudentDashboard() {
    console.log('📚 Загружаем дашборд студента');
    
    const token = localStorage.getItem('auth_token');
    console.log('🔍 Проверка данных пользователя:');
    console.log('- Токен:', token ? 'Есть' : 'Нет');
    console.log('- Роль:', localStorage.getItem('user_role'));
    console.log('- ID пользователя:', localStorage.getItem('user_id'));
    
    window.addEventListener('error', function(e) {
        console.error('Глобальная ошибка:', e.error);
        
        if (e.message.includes('uploadAssignment')) {
            console.log('🔄 Перезагружаем страницу из-за ошибки загрузки');
            setTimeout(() => {
                loadStudentDashboard();
            }, 2000);
        }
    });

    window.addEventListener('unhandledrejection', function(e) {
        console.error('Необработанное обещание:', e.reason);
    });
    
    try {
        
        // Загружаем курсы студента
        console.log('📡 Запрашиваем курсы студента...');
        const coursesResponse = await fetch('/api/enrollments/my-courses', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (coursesResponse.ok) {
            const result = await coursesResponse.json();
            console.log('✅ Ответ от сервера:', result);
            
            //Извлекаем массив курсов из объекта
            const courses = result.courses || result.data?.courses || result.data || [];
            console.log('📋 Извлеченные курсы:', courses);
            
            renderStudentCourses(courses);
            updateStudentStats(courses);
        } else {
            console.warn('⚠️ Не удалось загрузить курсы:', coursesResponse.status);
            showDemoStudentData();
        }

        // Загружаем задания студента
        console.log('📡 Запрашиваем задания студента...');
        console.log('- URL:', '/api/assignments/my-assignments');
        console.log('- Токен:', token ? 'Есть' : 'Нет');

        const assignmentsResponse = await fetch('/api/assignments/my-assignments', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('- Статус ответа:', assignmentsResponse.status);
        console.log('- OK?', assignmentsResponse.ok);
        
        // Если ошибка 404, значит эндпоинт не существует
        if (assignmentsResponse.status === 404) {
            console.error('❌ Эндпоинт /api/assignments/my-assignments не найден!');
            console.log('🔍 Проверим другие возможные URL:');
            
            // Проверка других возможных эндпоинтов
            const endpoints = [
                '/api/student/assignments',
                '/api/student/my-assignments',
                '/api/users/assignments'
            ];
            
            for (const endpoint of endpoints) {
                try {
                    const testResponse = await fetch(endpoint, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    console.log(`- ${endpoint}: ${testResponse.status}`);
                } catch (e) {
                    console.log(`- ${endpoint}: Ошибка`);
                }
            }
        }
        
        if (assignmentsResponse.ok) {
            const result = await assignmentsResponse.json();
            console.log('✅ Ответ по заданиям:', result);
            
            // Извлекаем массив заданий
            const assignments = result.assignments || result.data?.assignments || result.data || [];
            console.log('📋 Извлеченные задания:', assignments);
            
            renderStudentAssignments(assignments);
        } else {
            console.warn('⚠️ Не удалось загрузить задания:', assignmentsResponse.status);
            
            // Попробуем получить текст ошибки
            try {
                const errorText = await assignmentsResponse.text();
                console.error('❌ Текст ошибки:', errorText);
            } catch (e) {
                console.error('❌ Не удалось прочитать ошибку:', e);
            }
            
            // Показываем заглушку вместо ошибки
            showNoAssignmentsMessage();
        }

    } catch (error) {
        console.error('❌ Ошибка загрузки данных студента:', error);
        showDemoStudentData();
    }
}


function showNoAssignmentsMessage() {
    const container = document.getElementById('student-assignments-container');
    if (container) {
        container.innerHTML = `
            <div class="no-assignments">
                <p>Не удалось загрузить задания</p>
                <p style="color: #666; font-size: 0.9rem;">Попробуйте позже или обратитесь в поддержку</p>
                <button onclick="loadStudentDashboard()" class="btn btn-secondary">
                    Обновить
                </button>
            </div>
        `;
    }
}

// Отображение заданий студента
/*function renderStudentAssignments(assignments) {
    const container = document.getElementById('student-assignments-container');
    
    if (!container) {
        console.log('⚠️ Контейнер для заданий не найден');
        return;
    }
    
    console.log('📝 Рендерим задания:', assignments);
    
    // Проверяем что assignments - массив
    if (!Array.isArray(assignments)) {
        console.error('❌ assignments не является массивом:', assignments);
        container.innerHTML = `
            <div class="no-assignments">
                <p>Нет активных заданий</p>
            </div>
        `;
        return;
    }
    
    if (assignments.length === 0) {
        container.innerHTML = `
            <div class="no-assignments">
                <p>Нет активных заданий</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = assignments.map(assignment => {
        // Безопасное получение данных
        const title = assignment.title || assignment.lesson?.title || 'Задание';
        const courseName = assignment.course_name || 
                          assignment.enrollment?.course?.title || 
                          'Курс';
                          
        const status = assignment.status || 'pending';
        const dueDate = assignment.due_date || assignment.created_at;
        const feedback = assignment.feedback || assignment.teacher_comment;
        const grade = assignment.grade;
        const photoUrl = assignment.photo_url;
        const assignmentId = assignment.id;
        const lessonTitle = assignment.lesson?.title || title;
        
        // Определяем класс статуса
        let statusClass = 'status-pending';
        let statusText = 'Ожидает проверки';
        
        if (status === 'completed' || status === 'approved') {
            statusClass = 'status-completed';
            statusText = 'Завершено';
        } else if (status === 'rejected') {
            statusClass = 'status-rejected';
            statusText = 'Требует доработки';
        } else if (status === 'in_progress') {
            statusClass = 'status-in-progress';
            statusText = 'В процессе';
        } else if (status === 'submitted' || status === 'under_review') {
            statusClass = 'status-submitted';
            statusText = 'Отправлено на проверку';
        }
        
        return `
        <div class="assignment-card">
            <div class="assignment-header">
                <h4>${title}</h4>
                <span class="course-tag">${courseName}</span>
            </div>
            <div class="assignment-details">
                <p><strong>Статус:</strong> <span class="status ${statusClass}">${statusText}</span></p>
                ${dueDate ? `<p><strong>Срок:</strong> ${formatDate(dueDate)}</p>` : ''}
                ${grade ? `<p><strong>Оценка:</strong> ${grade}/10</p>` : ''}
                ${feedback ? `<p><strong>Комментарий преподавателя:</strong> ${feedback}</p>` : ''}
                ${photoUrl ? `<p><strong>Работа загружена:</strong> Да</p>` : ''}
            </div>
            <div class="assignment-actions">
                ${(status === 'pending' || status === 'submitted' || status === 'under_review') && !photoUrl ? `
                <button onclick="uploadAssignment(${assignmentId}, '${lessonTitle.replace(/'/g, "\\'")}')" 
                        class="btn btn-primary">
                    Загрузить работу
                </button>
                ` : ''}
                
                ${photoUrl ? `
                <button onclick="viewUploadedPhoto('${photoUrl}')" class="btn btn-secondary">
                    Просмотреть работу
                </button>
                ` : ''}
                
                ${photoUrl && (status === 'pending' || status === 'submitted' || status === 'under_review') ? `
                <button onclick="uploadAssignment(${assignmentId}, '${lessonTitle.replace(/'/g, "\\'")}')" 
                        class="btn btn-primary">
                    Обновить работу
                </button>
                ` : ''}
                
                <button onclick="viewAssignment(${assignmentId})" class="btn btn-secondary">
                    Подробнее
                </button>
            </div>
        </div>
        `;
    }).join('');
}*/


function renderStudentAssignments(assignments) {
    const container = document.getElementById('student-assignments-container');
    
    if (!container) {
        console.log('⚠️ Контейнер для заданий не найден');
        return;
    }
    
    console.log('📝 Рендерим задания:', assignments);
    
    // Проверяем что assignments - массив
    if (!Array.isArray(assignments)) {
        console.error('❌ assignments не является массивом:', assignments);
        container.innerHTML = `
            <div class="no-assignments">
                <p>Ошибка загрузки заданий</p>
                <p style="color: #666; font-size: 0.9rem;">Попробуйте обновить страницу</p>
                <button onclick="loadStudentDashboard()" class="btn btn-secondary">
                    Обновить
                </button>
            </div>
        `;
        return;
    }
    
    if (assignments.length === 0) {
        container.innerHTML = `
            <div class="no-assignments">
                <p>Нет активных заданий</p>
                <p style="color: #666; font-size: 0.9rem;">
                    Задания появятся, когда вы начнете проходить уроки с творческими заданиями
                </p>
                <div style="margin-top: 15px;">
                    <a href="/courses" class="btn btn-primary">
                        Выбрать курс
                    </a>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = assignments.map(assignment => {
        // Безопасное получение данных из структуры API
        const assignmentId = assignment.id;
        const lessonId = assignment.lesson_id || assignment.lesson?.id;
        const lessonTitle = assignment.lesson?.title || 'Творческое задание';
        const courseName = assignment.enrollment?.course?.title || 
                          assignment.course_name || 
                          'Курс';
        const status = assignment.status || 'pending';
        const dueDate = assignment.due_date || assignment.created_at;
        const feedback = assignment.teacher_comment || assignment.feedback;
        const grade = assignment.grade;
        const photoUrl = assignment.photo_url;
        const submittedAt = assignment.submitted_at;
        const lesson = assignment.lesson || {};
        
        // Определяем класс статуса
        let statusClass = 'status-pending';
        let statusText = 'Ожидает загрузки';
        let canUpload = false;
        let canUpdate = false;
        
        switch (status) {
            case 'pending':
                statusClass = 'status-pending';
                statusText = 'Ожидает загрузки';
                canUpload = true;
                break;
            case 'submitted':
            case 'under_review':
                statusClass = 'status-submitted';
                statusText = 'Отправлено на проверку';
                canUpdate = true;
                break;
            case 'completed':
            case 'approved':
                statusClass = 'status-completed';
                statusText = 'Завершено';
                break;
            case 'rejected':
                statusClass = 'status-rejected';
                statusText = 'Требует доработки';
                canUpdate = true;
                break;
            case 'in_progress':
                statusClass = 'status-in-progress';
                statusText = 'В процессе';
                canUpload = true;
                break;
            default:
                statusClass = 'status-pending';
                statusText = 'Ожидает загрузки';
                canUpload = true;
        }
        
        // Подготавливаем текст для кнопок
        const safeLessonTitle = lessonTitle.replace(/'/g, "\\'").replace(/"/g, '\\"');
        
        return `
        <div class="assignment-card" data-assignment-id="${assignmentId}">
            <div class="assignment-header">
                <h4>${lessonTitle}</h4>
                <span class="course-tag">${courseName}</span>
            </div>
            
            <div class="assignment-details">
                <p><strong>Статус:</strong> <span class="status ${statusClass}">${statusText}</span></p>
                ${dueDate ? `<p><strong>Срок сдачи:</strong> ${formatDate(dueDate)}</p>` : ''}
                ${submittedAt ? `<p><strong>Отправлено:</strong> ${formatDate(submittedAt)}</p>` : ''}
                ${grade !== null && grade !== undefined ? `<p><strong>Оценка:</strong> ${grade}/10</p>` : ''}
                ${feedback ? `<p><strong>Комментарий преподавателя:</strong> ${feedback}</p>` : ''}
                ${photoUrl ? `<p><strong>Работа загружена:</strong> Да</p>` : ''}
            </div>
            
            <div class="assignment-actions">
                ${canUpload && !photoUrl ? `
                <button onclick="uploadAssignment(${assignmentId}, '${safeLessonTitle}', ${lessonId})" 
                        class="btn btn-primary">
                    📤 Загрузить работу
                </button>
                ` : ''}
                
                ${photoUrl ? `
                <button onclick="viewUploadedPhoto('${photoUrl}')" class="btn btn-secondary">
                    👁️ Просмотреть работу
                </button>
                ` : ''}
                
                ${canUpdate && photoUrl ? `
                <button onclick="uploadAssignment(${assignmentId}, '${safeLessonTitle}', ${lessonId})" 
                        class="btn btn-primary">
                    🔄 Обновить работу
                </button>
                ` : ''}
                
                <button onclick="goToLesson(${lessonId})" class="btn btn-secondary">
                    📚 Перейти к уроку
                </button>
                
                ${feedback || grade ? `
                <button onclick="showAssignmentDetails(${assignmentId})" class="btn btn-secondary">
                    📋 Подробнее
                </button>
                ` : ''}
            </div>
        </div>
        `;
    }).join('');
}

// Переход к уроку
function goToLesson(lessonId) {
    if (lessonId) {
        window.location.href = `/lesson.html?id=${lessonId}`;
    } else {
        alert('ID урока не найден');
    }
}

// Показать детали задания
function showAssignmentDetails(assignmentId) {
    alert(`Детали задания #${assignmentId} скоро будут доступны`);
}

// Демо-данные для студента (если API недоступно)
function showDemoStudentData() {
    console.log('🎭 Показываем демо-данные для студента');
    
    const demoCourses = [
        {
            id: 1,
            title: 'Основы фотографии для начинающих',
            description: 'Научитесь основам композиции, работы с освещением и настройками камеры.',
            level: 'basic',
            teacher_name: 'Анна Фотографова',
            enrolled_at: new Date().toISOString(),
            progress: 65,
            enrollment_id: 1
        }
    ];
     const demoAssignments = JSON.parse(localStorage.getItem('demo_assignments') || '[]');
    renderStudentCourses(demoCourses);
    updateStudentStats(demoCourses);
    
    // Показываем демо-задания
    document.getElementById('student-assignments-container').innerHTML = `
        <div class="assignment-card">
            <h4>Практика: Съемка с разной экспозицией</h4>
            <p>Курс: Основы фотографии для начинающих</p>
            <p>Статус: <span class="status status-pending">Ожидает проверки</span></p>
            <button class="btn btn-primary">Посмотреть задание</button>
        </div>
    `;
}


// Отображение курсов студента
function renderStudentCourses(courses) {
    const container = document.getElementById('student-courses-container');
    
    console.log('🎨 Рендерим курсы:', courses);
    
    // Проверяем что courses - массив
    if (!Array.isArray(courses)) {
        console.error('❌ courses не является массивом:', courses);
        console.log('🔍 Тип courses:', typeof courses);
        console.log('🔍 Значение courses:', courses);
        
        // Пробуем преобразовать
        if (courses && typeof courses === 'object') {
            // Пробуем найти массив в объекте
            for (const key in courses) {
                if (Array.isArray(courses[key])) {
                    courses = courses[key];
                    console.log('🔄 Найден массив в ключе:', key);
                    break;
                }
            }
        }
        
        // Если все еще не массив, показываем сообщение
        if (!Array.isArray(courses)) {
            container.innerHTML = `
                <div class="no-courses">
                    <p>Ошибка загрузки курсов</p>
                    <p style="color: #666; font-size: 0.9rem;">Данные пришли в неверном формате</p>
                    <a href="/courses" class="btn btn-primary">Выбрать курс</a>
                </div>
            `;
            return;
        }
    }
    
    if (courses.length === 0) {
        container.innerHTML = `
            <div class="no-courses">
                <p>Вы еще не записаны на курсы</p>
                <a href="/courses" class="btn btn-primary">Выбрать курс</a>
            </div>
        `;
        return;
    }

    container.innerHTML = courses.map(course => {
        // Логируем каждый курс для отладки
        console.log('📝 Обрабатываем курс:', course);
        
        // Безопасное получение данных
        const courseId = course.id || course.course_id || 0;
        const enrollmentId = course.enrollment_id || course.id || 0;
        const title = course.title || 'Без названия';
        const description = course.description || 'Описание отсутствует';
        const level = course.level || 'basic';
        const teacherName = course.teacher_name || course.teacher || 'Не указан';
        const enrolledDate = course.enrolled_at || course.created_at || new Date().toISOString();
        const progress = course.progress || course.progress_percentage || 0;
        
        return `
        <div class="course-card">
            <div class="course-header">
                <span class="course-level ${level}">
                    ${getLevelText(level)}
                </span>
                <h3>${title}</h3>
            </div>
            <p>${description.substring(0, 100)}${description.length > 100 ? '...' : ''}</p>
            <div class="course-meta">
                <span>Преподаватель: ${teacherName}</span>
                <span>Записан: ${formatDate(enrolledDate)}</span>
            </div>
            <div class="progress-container">
                <div class="progress-label">
                    <span>Прогресс:</span>
                    <span>${progress}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
            </div>
            <div class="course-actions">
                <a href="/first_course?id=${courseId}" class="btn btn-primary">
                    Продолжить обучение
                </a>
                <button onclick="unenroll(${enrollmentId})" class="btn btn-secondary">
                    Отписаться
                </button>
            </div>
        </div>
        `;
    }).join('');
    
    console.log('✅ Курсы отрендерены успешно');
}

function viewUploadedPhoto(photoUrl) {
    console.log('👁️ Просмотр фото:', photoUrl);
    
    const modal = document.createElement('div');
    modal.className = 'photo-modal-overlay';
    modal.innerHTML = `
        <div class="photo-modal">
            <div class="photo-modal-header">
                <h3>Просмотр работы</h3>
                <button onclick="closePhotoModal()" class="close-btn">&times;</button>
            </div>
            <div class="photo-modal-body">
                <img src="${photoUrl}" alt="Работа студента" 
                     onerror="this.src='/images/placeholder.jpg'">
            </div>
            <div class="photo-modal-footer">
                <a href="${photoUrl}" target="_blank" class="btn btn-primary">
                    Открыть в новой вкладке
                </a>
                <button onclick="closePhotoModal()" class="btn btn-secondary">
                    Закрыть
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closePhotoModal() {
    const modal = document.querySelector('.photo-modal-overlay');
    if (modal) modal.remove();
}

window.viewUploadedPhoto = viewUploadedPhoto;
window.closePhotoModal = closePhotoModal;

//ЗАГРУЗКА ЗАДАНИЙ
/*async function uploadAssignment(assignmentId, lessonTitle) {
    console.log('📤 Загрузка задания ID:', assignmentId, 'Урок:', lessonTitle);
    try {
        // Сначала получим данные о задании, чтобы узнать lesson_id
        const token = localStorage.getItem('auth_token');
        const assignmentInfo = await getAssignmentInfo(assignmentId);
        
        if (!assignmentInfo || !assignmentInfo.lesson_id) {
            alert('Не удалось получить информацию о задании');
            return;
        }

        const lessonId = assignmentInfo.lesson_id;
        
        // Создаем модальное окно для загрузки
        const modal = document.createElement('div');
        modal.className = 'upload-modal-overlay';
        
        modal.innerHTML = `
    <div class="upload-modal">
        <div class="upload-modal-header">
            <h3>${lessonTitle}</h3>
            <button onclick="closeUploadModal()" class="close-btn" aria-label="Закрыть">&times;</button>
        </div>
        <div class="upload-modal-body">
            <form id="assignment-upload-form" enctype="multipart/form-data">
                <input type="hidden" name="lesson_id" value="${lessonId}">
                
                <div class="form-group">
                    <label for="assignment-photo">Выберите фотографию для задания</label>
                    
                    <!-- Стилизованный контейнер для input[type="file"] -->
                    <div class="file-input-wrapper">
                        <!-- Настоящий input, скрытый -->
                        <input type="file" 
                               id="assignment-photo" 
                               name="photo" 
                               accept="image/*,.jpg,.jpeg,.png,.heic,.raw"
                               required
                               style="position: absolute; left: -9999px; opacity: 0;">
                        
                        <!-- Кастомная кнопка, которая выглядит красиво -->
                        <div class="file-input-custom" id="custom-file-button">
                            <div class="file-input-icon">📁</div>
                            <div class="file-input-text">Нажмите для выбора файла</div>
                            <div class="file-input-hint">или перетащите сюда</div>
                        </div>
                        
                        <!-- Будет показывать имя выбранного файла -->
                        <div id="selected-file-info" style="display: none; margin-top: 10px;">
                            <div style="display: flex; align-items: center; gap: 10px; background: #f0f9ff; padding: 12px; border-radius: 8px; border: 2px solid #3498db;">
                                <span style="font-size: 20px;">📄</span>
                                <div style="flex: 1;">
                                    <div style="font-weight: 500; color: #2c3e50;" id="selected-file-name"></div>
                                    <div style="font-size: 0.85rem; color: #666;" id="selected-file-size"></div>
                                </div>
                                <button type="button" onclick="clearFileSelection()" style="background: none; border: none; color: #e74c3c; cursor: pointer; font-size: 18px;">
                                    ✕
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <p class="file-info">Поддерживаемые форматы: JPG, PNG, HEIC, RAW. Максимальный размер: 50 МБ</p>
                </div>
                
                <div class="form-group">
                    <label for="assignment-comment">Комментарий к работе (необязательно)</label>
                    <textarea id="assignment-comment" 
                              name="comment" 
                              placeholder="Расскажите о своей работе, какие техники использовали, что хотели передать..."
                              rows="4"></textarea>
                </div>
                
                <div class="upload-preview" id="upload-preview">
                    <div class="preview-placeholder">
                        <div class="icon">📷</div>
                        <p>Здесь будет предпросмотр вашей фотографии</p>
                    </div>
                </div>
                
                <div id="upload-status"></div>
                
                <div class="upload-actions">
                    <button type="submit" class="btn btn-primary ripple" id="submit-button" disabled>
                        <span style="display: inline-flex; align-items: center; gap: 8px;">
                            📤 Отправить на проверку
                        </span>
                    </button>
                    <button type="button" onclick="closeUploadModal()" class="btn btn-secondary">
                        Отмена
                    </button>
                </div>
            </form>
        </div>
    </div>
`;
        
        document.body.appendChild(modal);
        
        // ========== ДОБАВЛЯЕМ ОБРАБОТЧИКИ ДЛЯ КАСТОМНОЙ КНОПКИ ==========
        
        // Получаем элементы
        const fileInput = document.getElementById('assignment-photo');
        const customButton = document.getElementById('custom-file-button');
        const selectedFileInfo = document.getElementById('selected-file-info');
        const selectedFileName = document.getElementById('selected-file-name');
        const selectedFileSize = document.getElementById('selected-file-size');
        const submitButton = document.getElementById('submit-button');
        const previewDiv = document.getElementById('upload-preview');

        // Клик по кастомной кнопке открывает настоящий input
        customButton.addEventListener('click', function(e) {
            e.preventDefault();
            fileInput.click();
        });

        // Drag & Drop
        customButton.addEventListener('dragover', function(e) {
            e.preventDefault();
            customButton.parentElement.classList.add('drag-over');
        });

        customButton.addEventListener('dragleave', function(e) {
            e.preventDefault();
            customButton.parentElement.classList.remove('drag-over');
        });

        customButton.addEventListener('drop', function(e) {
            e.preventDefault();
            customButton.parentElement.classList.remove('drag-over');
            
            if (e.dataTransfer.files.length > 0) {
                fileInput.files = e.dataTransfer.files;
                handleFileSelect(e.dataTransfer.files[0]);
            }
        });

        // Обработчик изменения файла
        fileInput.addEventListener('change', function(e) {
            if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
            }
        });

        // Функция обработки выбранного файла
        function handleFileSelect(file) {
            console.log('📁 Выбран файл:', file.name, 'размер:', file.size);
            
            // Проверка размера
            if (file.size > 50 * 1024 * 1024) {
                alert('❌ Файл слишком большой! Максимальный размер: 50 МБ');
                fileInput.value = '';
                selectedFileInfo.style.display = 'none';
                submitButton.disabled = true;
                return;
            }
            
            // Обновляем кастомную кнопку
            customButton.innerHTML = `
                <div class="file-input-icon">✅</div>
                <div class="file-input-text">Файл выбран</div>
                <div class="file-input-hint">Нажмите для выбора другого файла</div>
            `;
            customButton.style.background = 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)';
            
            // Показываем информацию о файле
            selectedFileName.textContent = file.name;
            selectedFileSize.textContent = formatFileSize(file.size);
            selectedFileInfo.style.display = 'block';
            
            // Активируем кнопку отправки
            submitButton.disabled = false;
            
            // Показываем предпросмотр
            showPreview(file);
        }

        // Функция очистки выбора файла
        window.clearFileSelection = function() {
            fileInput.value = '';
            selectedFileInfo.style.display = 'none';
            submitButton.disabled = true;
            
            // Восстанавливаем кастомную кнопку
            customButton.innerHTML = `
                <div class="file-input-icon">📁</div>
                <div class="file-input-text">Нажмите для выбора файла</div>
                <div class="file-input-hint">или перетащите сюда</div>
            `;
            customButton.style.background = 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)';
            
            // Очищаем предпросмотр
            previewDiv.innerHTML = `
                <div class="preview-placeholder">
                    <div class="icon">📷</div>
                    <p>Здесь будет предпросмотр вашей фотографии</p>
                </div>
            `;
        };

        // Функция форматирования размера файла
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        // Функция показа предпросмотра
        function showPreview(file) {
            previewDiv.innerHTML = `
                <div style="text-align: center; color: #666; padding: 20px;">
                    <div class="spinner-small"></div>
                    <p>Загружаем предпросмотр...</p>
                </div>
            `;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                previewDiv.innerHTML = `
                    <div style="text-align: center;">
                        <img src="${e.target.result}" 
                             alt="Предпросмотр" 
                             style="max-width: 100%; max-height: 300px; border-radius: 10px; box-shadow: 0 6px 20px rgba(0,0,0,0.15);">
                        <div style="margin-top: 15px; color: #555; font-size: 0.9rem;">
                            <p style="margin: 5px 0;"><strong>Разрешение:</strong> Загрузка...</p>
                        </div>
                    </div>
                `;
                
                // Получаем размеры изображения
                const img = new Image();
                img.onload = function() {
                    const resolutionEl = previewDiv.querySelector('p');
                    if (resolutionEl) {
                        resolutionEl.innerHTML = `<strong>Разрешение:</strong> ${img.width} × ${img.height} пикселей`;
                    }
                };
                img.src = e.target.result;
            };
            
            reader.onerror = function() {
                previewDiv.innerHTML = `
                    <div style="text-align: center; color: #e74c3c; padding: 20px;">
                        <div style="font-size: 48px;">❌</div>
                        <p>Не удалось загрузить предпросмотр</p>
                    </div>
                `;
            };
            
            reader.readAsDataURL(file);
        }
        
        // ========== КОНЕЦ ДОБАВЛЕННОГО КОДА ==========
        
        // Обработчик отправки формы (оставляем ваш существующий код, но с небольшими изменениями)
        const form = document.getElementById('assignment-upload-form');
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const token = localStorage.getItem('auth_token');
            const formData = new FormData(form);
            
            // Показываем индикатор загрузки
            const statusDiv = document.getElementById('upload-status');
            submitButton.disabled = true;
            submitButton.innerHTML = `
                <span style="display: inline-flex; align-items: center; gap: 8px;">
                    <div class="spinner-small" style="width: 20px; height: 20px; border-width: 2px;"></div>
                    Загрузка...
                </span>
            `;
            
            statusDiv.innerHTML = `
                <div class="uploading">
                    <div class="spinner-small"></div>
                    <p style="margin-top: 10px; font-weight: 500;">Загружаем вашу работу...</p>
                    <p style="font-size: 0.9rem; opacity: 0.8;">Это может занять некоторое время</p>
                </div>
            `;
            
            try {
                const response = await fetch('/api/assignments/submit', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
                
                const result = await response.json();
                console.log('📥 Ответ сервера:', result);
                
                if (response.ok && result.success) {
                    statusDiv.innerHTML = `
                        <div class="upload-success">
                            <div style="font-size: 48px; margin-bottom: 15px;">✅</div>
                            <p style="font-size: 1.2rem; font-weight: 600; margin-bottom: 10px;">Работа успешно загружена!</p>
                            <p>${result.message}</p>
                            <p style="font-size: 0.9rem; margin-top: 15px; color: #2e7d32;">
                                Страница обновится через 3 секунды...
                            </p>
                        </div>
                    `;
                    
                    // Обновляем список заданий через 3 секунды
                    setTimeout(() => {
                        closeUploadModal();
                        loadStudentDashboard();
                    }, 3000);
                } else {
                    statusDiv.innerHTML = `
                        <div class="upload-error">
                            <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
                            <p style="font-size: 1.2rem; font-weight: 600; margin-bottom: 10px;">Ошибка загрузки</p>
                            <p>${result.error || result.message || 'Неизвестная ошибка'}</p>
                        </div>
                    `;
                    submitButton.disabled = false;
                    submitButton.innerHTML = `
                        <span style="display: inline-flex; align-items: center; gap: 8px;">
                            📤 Отправить на проверку
                        </span>
                    `;
                }
            } catch (error) {
                console.error('Ошибка загрузки:', error);
                statusDiv.innerHTML = `
                    <div class="upload-error">
                        <div style="font-size: 48px; margin-bottom: 15px;">🌐</div>
                        <p style="font-size: 1.2rem; font-weight: 600; margin-bottom: 10px;">Ошибка сети</p>
                        <p>Проверьте подключение к интернету и попробуйте снова</p>
                    </div>
                `;
                submitButton.disabled = false;
                submitButton.innerHTML = `
                    <span style="display: inline-flex; align-items: center; gap: 8px;">
                        📤 Отправить на проверку
                    </span>
                `;
            }
        });
        
    } catch (error) {
        console.error('Ошибка создания модального окна:', error);
        alert('Не удалось открыть форму загрузки');
    }
}*/
async function uploadAssignment(assignmentId, lessonTitle, lessonId) {
    console.log('📤 Загрузка задания ID:', assignmentId, 'Урок:', lessonTitle, 'Lesson ID:', lessonId);
    
    try {
        const token = localStorage.getItem('auth_token');
        let finalLessonId = lessonId;
        
        if (!finalLessonId && token) {
            const assignmentInfo = await getAssignmentInfo(assignmentId);
            if (assignmentInfo && assignmentInfo.lesson_id) {
                finalLessonId = assignmentInfo.lesson_id;
                console.log('📡 Получили Lesson ID из API:', finalLessonId);
            }
        }
        
        if (!finalLessonId) {
            console.error('❌ Не удалось получить Lesson ID');
            alert('Не удалось получить информацию о задании');
            return;
        }
        
        console.log('✅ Используем Lesson ID:', finalLessonId);
        
        // модальное окно для загрузки
        const modal = document.createElement('div');
        modal.className = 'upload-modal-overlay';
        
        modal.innerHTML = `
    <div class="upload-modal">
        <div class="upload-modal-header">
            <h3>${lessonTitle}</h3>
            <button onclick="closeUploadModal()" class="close-btn" aria-label="Закрыть">&times;</button>
        </div>
        <div class="upload-modal-body">
            <form id="assignment-upload-form" enctype="multipart/form-data">
                <!-- ВАЖНО: используем finalLessonId -->
                <input type="hidden" name="lesson_id" value="${finalLessonId}">
                
                <div class="form-group">
                    <label for="assignment-photo">Выберите фотографию для задания</label>
                    
                    <!-- Стилизованный контейнер для input[type="file"] -->
                    <div class="file-input-wrapper">
                        <!-- Настоящий input, скрытый -->
                        <input type="file" 
                               id="assignment-photo" 
                               name="photo" 
                               accept="image/*,.jpg,.jpeg,.png,.heic,.raw"
                               required
                               style="position: absolute; left: -9999px; opacity: 0;">
                        
                        <!-- Кастомная кнопка, которая выглядит красиво -->
                        <div class="file-input-custom" id="custom-file-button">
                            <div class="file-input-icon">📁</div>
                            <div class="file-input-text">Нажмите для выбора файла</div>
                            <div class="file-input-hint">или перетащите сюда</div>
                        </div>
                        
                        <!-- Будет показывать имя выбранного файла -->
                        <div id="selected-file-info" style="display: none; margin-top: 10px;">
                            <div style="display: flex; align-items: center; gap: 10px; background: #f0f9ff; padding: 12px; border-radius: 8px; border: 2px solid #3498db;">
                                <span style="font-size: 20px;">📄</span>
                                <div style="flex: 1;">
                                    <div style="font-weight: 500; color: #2c3e50;" id="selected-file-name"></div>
                                    <div style="font-size: 0.85rem; color: #666;" id="selected-file-size"></div>
                                </div>
                                <button type="button" onclick="clearFileSelection()" style="background: none; border: none; color: #e74c3c; cursor: pointer; font-size: 18px;">
                                    ✕
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <p class="file-info">Поддерживаемые форматы: JPG, PNG, HEIC, RAW. Максимальный размер: 50 МБ</p>
                </div>
                
                <div class="form-group">
                    <label for="assignment-comment">Комментарий к работе (необязательно)</label>
                    <textarea id="assignment-comment" 
                              name="comment" 
                              placeholder="Расскажите о своей работе, какие техники использовали, что хотели передать..."
                              rows="4"></textarea>
                </div>
                
                <div class="upload-preview" id="upload-preview">
                    <div class="preview-placeholder">
                        <div class="icon">📷</div>
                        <p>Здесь будет предпросмотр вашей фотографии</p>
                    </div>
                </div>
                
                <div id="upload-status"></div>
                
                <div class="upload-actions">
                    <button type="submit" class="btn btn-primary ripple" id="submit-button" disabled>
                        <span style="display: inline-flex; align-items: center; gap: 8px;">
                            📤 Отправить на проверку
                        </span>
                    </button>
                    <button type="button" onclick="closeUploadModal()" class="btn btn-secondary">
                        Отмена
                    </button>
                </div>
            </form>
        </div>
    </div>
`;
        
        document.body.appendChild(modal);
        
        //ОБРАБОТЧИКИ ДЛЯ КАСТОМНОЙ КНОПКИ
        
        // Получаем элементы
        const fileInput = document.getElementById('assignment-photo');
        const customButton = document.getElementById('custom-file-button');
        const selectedFileInfo = document.getElementById('selected-file-info');
        const selectedFileName = document.getElementById('selected-file-name');
        const selectedFileSize = document.getElementById('selected-file-size');
        const submitButton = document.getElementById('submit-button');
        const previewDiv = document.getElementById('upload-preview');

        // Клик по кастомной кнопке открывает настоящий input
        customButton.addEventListener('click', function(e) {
            e.preventDefault();
            fileInput.click();
        });

        // Drag & Drop
        customButton.addEventListener('dragover', function(e) {
            e.preventDefault();
            customButton.parentElement.classList.add('drag-over');
        });

        customButton.addEventListener('dragleave', function(e) {
            e.preventDefault();
            customButton.parentElement.classList.remove('drag-over');
        });

        customButton.addEventListener('drop', function(e) {
            e.preventDefault();
            customButton.parentElement.classList.remove('drag-over');
            
            if (e.dataTransfer.files.length > 0) {
                fileInput.files = e.dataTransfer.files;
                handleFileSelect(e.dataTransfer.files[0]);
            }
        });

        // Обработчик изменения файла
        fileInput.addEventListener('change', function(e) {
            if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
            }
        });

        // Функция обработки выбранного файла
        function handleFileSelect(file) {
            console.log('📁 Выбран файл:', file.name, 'размер:', file.size);
            
            // Проверка размера
            if (file.size > 50 * 1024 * 1024) {
                alert('❌ Файл слишком большой! Максимальный размер: 50 МБ');
                fileInput.value = '';
                selectedFileInfo.style.display = 'none';
                submitButton.disabled = true;
                return;
            }
            
            // Обновляем кастомную кнопку
            customButton.innerHTML = `
                <div class="file-input-icon">✅</div>
                <div class="file-input-text">Файл выбран</div>
                <div class="file-input-hint">Нажмите для выбора другого файла</div>
            `;
            customButton.style.background = 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)';
            
            // Показываем информацию о файле
            selectedFileName.textContent = file.name;
            selectedFileSize.textContent = formatFileSize(file.size);
            selectedFileInfo.style.display = 'block';
            
            // Активируем кнопку отправки
            submitButton.disabled = false;
            
            // Показываем предпросмотр
            showPreview(file);
        }

        // Функция очистки выбора файла
        window.clearFileSelection = function() {
            fileInput.value = '';
            selectedFileInfo.style.display = 'none';
            submitButton.disabled = true;
            
            // Восстанавливаем кастомную кнопку
            customButton.innerHTML = `
                <div class="file-input-icon">📁</div>
                <div class="file-input-text">Нажмите для выбора файла</div>
                <div class="file-input-hint">или перетащите сюда</div>
            `;
            customButton.style.background = 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)';
            
            // Очищаем предпросмотр
            previewDiv.innerHTML = `
                <div class="preview-placeholder">
                    <div class="icon">📷</div>
                    <p>Здесь будет предпросмотр вашей фотографии</p>
                </div>
            `;
        };

        // Функция форматирования размера файла
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        // Функция показа предпросмотра
        function showPreview(file) {
            previewDiv.innerHTML = `
                <div style="text-align: center; color: #666; padding: 20px;">
                    <div class="spinner-small"></div>
                    <p>Загружаем предпросмотр...</p>
                </div>
            `;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                previewDiv.innerHTML = `
                    <div style="text-align: center;">
                        <img src="${e.target.result}" 
                             alt="Предпросмотр" 
                             style="max-width: 100%; max-height: 300px; border-radius: 10px; box-shadow: 0 6px 20px rgba(0,0,0,0.15);">
                        <div style="margin-top: 15px; color: #555; font-size: 0.9rem;">
                            <p style="margin: 5px 0;"><strong>Разрешение:</strong> Загрузка...</p>
                        </div>
                    </div>
                `;
                
                // Получаем размеры изображения
                const img = new Image();
                img.onload = function() {
                    const resolutionEl = previewDiv.querySelector('p');
                    if (resolutionEl) {
                        resolutionEl.innerHTML = `<strong>Разрешение:</strong> ${img.width} × ${img.height} пикселей`;
                    }
                };
                img.src = e.target.result;
            };
            
            reader.onerror = function() {
                previewDiv.innerHTML = `
                    <div style="text-align: center; color: #e74c3c; padding: 20px;">
                        <div style="font-size: 48px;">❌</div>
                        <p>Не удалось загрузить предпросмотр</p>
                    </div>
                `;
            };
            
            reader.readAsDataURL(file);
        }

        // Обработчик отправки формы
        const form = document.getElementById('assignment-upload-form');
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const token = localStorage.getItem('auth_token');
            const formData = new FormData(form);
            
            // Показываем индикатор загрузки
            const statusDiv = document.getElementById('upload-status');
            submitButton.disabled = true;
            submitButton.innerHTML = `
                <span style="display: inline-flex; align-items: center; gap: 8px;">
                    <div class="spinner-small" style="width: 20px; height: 20px; border-width: 2px;"></div>
                    Загрузка...
                </span>
            `;
            
            statusDiv.innerHTML = `
                <div class="uploading">
                    <div class="spinner-small"></div>
                    <p style="margin-top: 10px; font-weight: 500;">Загружаем вашу работу...</p>
                    <p style="font-size: 0.9rem; opacity: 0.8;">Это может занять некоторое время</p>
                </div>
            `;
            
            try {
                const response = await fetch('/api/assignments/submit', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
                
                const result = await response.json();
                console.log('📥 Ответ сервера:', result);
                
                if (response.ok && result.success) {
                    statusDiv.innerHTML = `
                        <div class="upload-success">
                            <div style="font-size: 48px; margin-bottom: 15px;">✅</div>
                            <p style="font-size: 1.2rem; font-weight: 600; margin-bottom: 10px;">Работа успешно загружена!</p>
                            <p>${result.message}</p>
                            <p style="font-size: 0.9rem; margin-top: 15px; color: #2e7d32;">
                                Страница обновится через 3 секунды...
                            </p>
                        </div>
                    `;
                    
                    // Обновляем список заданий через 3 секунды
                    setTimeout(() => {
                        closeUploadModal();
                        loadStudentDashboard();
                    }, 3000);
                } else {
                    statusDiv.innerHTML = `
                        <div class="upload-error">
                            <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
                            <p style="font-size: 1.2rem; font-weight: 600; margin-bottom: 10px;">Ошибка загрузки</p>
                            <p>${result.error || result.message || 'Неизвестная ошибка'}</p>
                        </div>
                    `;
                    submitButton.disabled = false;
                    submitButton.innerHTML = `
                        <span style="display: inline-flex; align-items: center; gap: 8px;">
                            📤 Отправить на проверку
                        </span>
                    `;
                }
            } catch (error) {
                console.error('Ошибка загрузки:', error);
                statusDiv.innerHTML = `
                    <div class="upload-error">
                        <div style="font-size: 48px; margin-bottom: 15px;">🌐</div>
                        <p style="font-size: 1.2rem; font-weight: 600; margin-bottom: 10px;">Ошибка сети</p>
                        <p>Проверьте подключение к интернету и попробуйте снова</p>
                    </div>
                `;
                submitButton.disabled = false;
                submitButton.innerHTML = `
                    <span style="display: inline-flex; align-items: center; gap: 8px;">
                        📤 Отправить на проверку
                    </span>
                `;
            }
        });
        
    } catch (error) {
        console.error('Ошибка создания модального окна:', error);
        alert('Не удалось открыть форму загрузки');
    }
}


window.closeUploadModal = function() {
    const modal = document.querySelector('.upload-modal-overlay');
    if (modal) {
        modal.style.animation = 'fadeIn 0.3s ease-out reverse';
        setTimeout(() => modal.remove(), 300);
    }
};

// Функция для получения информации о задании
async function getAssignmentInfo(assignmentId) {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/assignments/${assignmentId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.assignment;
        }
        
        // Если нет отдельного эндпоинта, используем общий список
        const assignmentsResponse = await fetch('/api/assignments/my-assignments', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (assignmentsResponse.ok) {
            const data = await assignmentsResponse.json();
            const assignment = data.assignments?.find(a => a.id == assignmentId);
            return assignment;
        }
        
        return null;
    } catch (error) {
        console.error('Ошибка получения информации о задании:', error);
        return null;
    }
}

function closeUploadModal() {
    const modal = document.querySelector('.upload-modal-overlay');
    if (modal) modal.remove();
}

const style = document.createElement('style');
style.textContent = `
    .spinner-small {
        width: 30px;
        height: 30px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 10px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

window.uploadAssignment = uploadAssignment;
window.closeUploadModal = closeUploadModal;

// Обновление статистики студента
function updateStudentStats(courses) {
    if (!courses || courses.length === 0) {
        safeSetText('stat-courses', '0');
        safeSetText('stat-progress', '0%');
        return;
    }
    
    const totalCourses = courses.length;
    const avgProgress = courses.reduce((sum, course) => sum + (course.progress || 0), 0) / totalCourses;
    
    safeSetText('stat-courses', totalCourses.toString());
    safeSetText('stat-progress', Math.round(avgProgress) + '%');
}
