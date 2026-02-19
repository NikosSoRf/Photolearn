// Загрузка дашборда преподавателя
async function loadTeacherDashboard() {
    console.log('👨‍🏫 Загружаем дашборд преподавателя');
    
    try {
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
            console.error('❌ Токен отсутствует');
            showEmptyTeacherCourses();
            return;
        }
        
        // Загружаем курсы преподавателя
        console.log('📡 Загружаем курсы преподавателя...');
        const courses = await loadTeacherCourses();
        
        console.log('📚 Полученные курсы:', courses);
        
        if (courses && courses.length > 0) {
            renderTeacherCourses(courses);
            updateTeacherStats(courses);
        } else {
            console.log('ℹ️ Курсы не найдены, показываем пустое состояние');
            showEmptyTeacherCourses();
        }
        
        // Загружаем работы на проверку
        await loadTeacherAssignments();
        
        //показываем секцию проверки работ
        setTimeout(() => {
            const checkNav = document.querySelector('#teacher-nav a[href="#check"]');
            if (checkNav) {
                checkNav.click();
            }
        }, 500);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки данных преподавателя:', error);
        showEmptyTeacherCourses();
    }
}

// Загрузка курсов преподавателя
async function loadTeacherCourses() {
    try {
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
            console.error('❌ Токен отсутствует');
            return [];
        }
        
        const endpoints = [
            '/api/courses/teacher/simple',   
            '/api/courses/teacher/my-courses',    // Из routes/courses.js 
            '/api/dashboard/teacher-courses',     // Из routes/dashboard.js 
            '/api/dashboard/courses/my-teaching'  
        ];
        
        for (const endpoint of endpoints) {
            try {
                console.log(`📡 Пробуем endpoint: ${endpoint}`);
                const response = await fetch(endpoint, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log(`✅ Нашли рабочий endpoint: ${endpoint}`);
                    
                    // Проверяем разные форматы ответа
                    if (result.courses) {
                        return result.courses;
                    } else if (result.data) {
                        return result.data;
                    } else if (Array.isArray(result)) {
                        return result;
                    } else if (result.success && result.courses) {
                        return result.courses;
                    }
                } else if (response.status !== 404) {
                    console.warn(`⚠️ ${endpoint} вернул ${response.status}`);
                }
            } catch (error) {
                console.warn(`❌ Ошибка в ${endpoint}:`, error.message);
            }
        }
        
        console.log('ℹ️ Все endpointы недоступны, возвращаем пустой массив');
        return [];
        
    } catch (error) {
        console.error('❌ Ошибка загрузки курсов:', error);
        return [];
    }
}

// Отображение курсов преподавателя
function renderTeacherCourses(courses) {
    const container = document.getElementById('teacher-courses-container');
    
    if (!container) {
        console.error('❌ Контейнер курсов преподавателя не найден');
        return;
    }
    
    if (!Array.isArray(courses) || courses.length === 0) {
        showEmptyTeacherCourses();
        return;
    }
    
    container.innerHTML = courses.map(course => {
        const studentCount = course.student_count || course.enrollments?.length || 0;
        const assignmentsPending = course.assignments_pending || 0;
        const courseId = course.id || course.course_id;
        
        if (!courseId) {
            console.warn('❌ У курса нет ID:', course);
            return '';
        }
        
        return `
        <div class="course-card teacher-course-card">
            <div class="course-header">
                <span class="course-level ${course.level || 'basic'}">
                    ${getLevelText(course.level || 'basic')}
                </span>
                <h3>${course.title || 'Без названия'}</h3>
            </div>
            <p>${course.description ? (course.description.length > 100 ? course.description.substring(0, 100) + '...' : course.description) : 'Описание отсутствует'}</p>
            
            <div class="course-stats">
                <span class="stat-item">👥 ${studentCount} студентов</span>
                <span class="stat-item">📝 ${assignmentsPending} работ на проверку</span>
                <span class="stat-item">📅 Создан: ${formatDate(course.created_at)}</span>
            </div>
            
            <div class="course-actions">
                <button onclick="window.location.href='/edit-course.html?id=${courseId}'" class="btn btn-primary">
                    Управлять курсом
                </button>
                <button onclick="viewCourseStudents(${courseId})" class="btn btn-secondary">
                    Студенты (${studentCount})
                </button>
                <button onclick="deleteCourseFromDashboard(${courseId})" class="btn btn-danger" style="background: #f56565; color: white;">
                 Удалить
                </button>
            </div>
        </div>
        `;
    }).filter(Boolean).join(''); 
}
// Просмотр студентов курса
async function viewCourseStudents(courseId) {
    console.log('👥 Просмотр студентов курса:', courseId);
    
    try {
        const token = localStorage.getItem('auth_token');
        
        const endpoints = [
            `/api/courses/${courseId}/students`,
            `/api/courses/${courseId}/enrollments`,
            `/api/teacher/courses/${courseId}/students`,
            `/api/dashboard/course/${courseId}/students`
        ];
        
        let students = [];
        
        for (const endpoint of endpoints) {
            try {
                console.log(`📡 Пробуем эндпоинт: ${endpoint}`);
                const response = await fetch(endpoint, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log(`✅ Эндпоинт ${endpoint} сработал:`, result);
                    
                    // Проверяем разные форматы ответа
                    if (result.students && Array.isArray(result.students)) {
                        students = result.students;
                        break;
                    } else if (result.enrollments && Array.isArray(result.enrollments)) {
                        // Преобразуем записи на курс в студентов
                        students = result.enrollments.map(enrollment => {
                            const student = enrollment.enrollmentStudent || enrollment.student || {};
                            return {
                                ...student,
                                enrolled_at: enrollment.enrolled_at || enrollment.created_at,
                                progress: enrollment.progress || 0
                            };
                        });
                        break;
                    } else if (Array.isArray(result)) {
                        students = result;
                        break;
                    } else if (result.data && Array.isArray(result.data)) {
                        students = result.data;
                        break;
                    }
                } else {
                    console.warn(`⚠️ ${endpoint} вернул ${response.status}`);
                }
            } catch (error) {
                console.warn(`❌ Ошибка в ${endpoint}:`, error.message);
            }
        }
        
        console.log('📊 Полученные студенты:', students);
        
        if (students.length === 0) {
            // пробуем получить студентов из локальных данных 
            const localData = localStorage.getItem(`course_${courseId}_students`);
            if (localData) {
                try {
                    students = JSON.parse(localData);
                    console.log('💾 Используем локальные данные о студентах');
                } catch (e) {
                    console.warn('❌ Ошибка парсинга локальных данных');
                }
            }
        }
        
        if (students.length === 0) {
            alert('На этом курсе пока нет студентов');
            return;
        }
        
        // Сохраняем данные локально
        localStorage.setItem(`course_${courseId}_students`, JSON.stringify(students));
        
        showStudentsModal(students, courseId);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки студентов:', error);
        
        // Попробуем показать демо-данные
        if (confirm('Не удалось загрузить список студентов. Показать демо-данные?')) {
            showDemoStudentsModal(courseId);
        }
    }
}
// Обновление статистики преподавателя
function updateTeacherStats(courses) {
    if (!courses || !Array.isArray(courses)) return;
    
    const totalCourses = courses.length;
    const totalStudents = courses.reduce((sum, course) => 
        sum + (course.student_count || course.enrollments?.length || 0), 0);
    
    const statCourses = document.getElementById('stat-courses');
    const statAssignments = document.getElementById('stat-assignments');
    
    if (statCourses) {
        const numberElement = statCourses.querySelector('.stat-number');
        if (numberElement) {
            numberElement.textContent = totalCourses;
        }
    }
    
    if (statAssignments) {
        const totalAssignments = courses.reduce((sum, course) => 
            sum + (course.assignments_pending || 0), 0);
        const numberElement = statAssignments.querySelector('.stat-number');
        if (numberElement) {
            numberElement.textContent = totalAssignments;
        }
        statAssignments.style.display = 'block';
    }
}

// Загрузка работ на проверку
async function loadTeacherAssignments() {
    try {
        const token = localStorage.getItem('auth_token');
        const container = document.getElementById('teacher-check-container');
        
        if (!container) return;
        
        container.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Загрузка работ на проверку...</p>
            </div>
        `;
        
        const response = await fetch('/api/assignments/pending', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            const assignments = result.assignments || result.data || [];
            
            renderTeacherAssignments(assignments);
            updateCourseFilter(assignments);
            
        } else {
            console.warn('⚠️ Не удалось загрузить работы на проверку:', response.status);
            container.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 48px; margin-bottom: 15px;">✅</div>
                    <h3>Нет работ на проверку</h3>
                    <p>Все работы студентов проверены</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('❌ Ошибка загрузки работ:', error);
        const container = document.getElementById('teacher-check-container');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <p>❌ Ошибка загрузки работ</p>
                    <button onclick="loadTeacherAssignments()" class="btn btn-primary">
                        Попробовать снова
                    </button>
                </div>
            `;
        }
    }
}

// Отображение работ для проверки
function renderTeacherAssignments(assignments) {
    const container = document.getElementById('teacher-check-container');
    
    if (!container) return;
    
    if (!Array.isArray(assignments) || assignments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 48px; margin-bottom: 15px;">✅</div>
                <h3>Нет работ на проверку</h3>
                <p>Все работы студентов проверены</p>
            </div>
        `;
        return;
    }
    
    const localReviews = JSON.parse(localStorage.getItem('teacher_reviews') || '{}');
    
    container.innerHTML = assignments.map(assignment => {
        const student = assignment.enrollment?.enrollmentStudent || assignment.student || {};
        const course = assignment.enrollment?.course || assignment.course || {};
        const lesson = assignment.lesson || {};
        
        const studentName = student.first_name && student.last_name 
            ? `${student.first_name} ${student.last_name}`
            : student.email || student.name || 'Студент';
        
        const studentInitials = studentName.charAt(0).toUpperCase();
        const localReview = localReviews[assignment.id];
        const displayGrade = localReview ? localReview.grade : assignment.grade;
        const displayStatus = localReview ? 'оценено' : (assignment.status || 'ожидает');
        
        return `
        <div class="assignment-check-card" data-assignment-id="${assignment.id}">
            <div class="assignment-check-info">
                <h4>${lesson.title || 'Задание'}</h4>
                <div class="assignment-student-info">
                    <div class="avatar">${studentInitials}</div>
                    <span><strong>${studentName}</strong></span>
                    <span>•</span>
                    <span>${course.title || 'Курс'}</span>
                </div>
                <div class="assignment-meta">
                    <span>📅 ${formatDate(assignment.submitted_at || assignment.created_at)}</span>
                    <span>📷 ${assignment.photo_url ? 'Фото загружено' : 'Без фото'}</span>
                    ${displayGrade ? `<span>⭐ Оценка: ${displayGrade}/10</span>` : ''}
                    <span class="status-badge">${displayStatus}</span>
                </div>
            </div>
            <div class="assignment-actions">
                <button onclick="openReviewModal(${assignment.id})" class="btn btn-primary">
                    ${localReview ? 'Изменить оценку' : 'Проверить'}
                </button>
            </div>
        </div>
        `;
    }).join('');
}

// Обновление фильтра курсов
function updateCourseFilter(assignments) {
    const filterSelect = document.getElementById('filter-course');
    if (!filterSelect) return;
    
    // Очищаем существующие опции (кроме первой)
    while (filterSelect.options.length > 1) {
        filterSelect.remove(1);
    }
    
    // Получаем уникальные курсы из заданий
    const courses = {};
    assignments.forEach(assignment => {
        const course = assignment.enrollment?.course || assignment.course;
        if (course && course.id) {
            courses[course.id] = course.title || `Курс ${course.id}`;
        }
    });
    
    // Добавляем новые опции
    Object.entries(courses).forEach(([id, title]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = title;
        filterSelect.appendChild(option);
    });
}

// Создание курса
function createCourse() {
    console.log('➕ Перенаправляем на страницу создания курса');
    window.location.href = '/create-course.html';
}

// Управление курсом
function manageCourse(courseId) {
    console.log('🛠️ Перенаправляем на редактирование курса:', courseId);
    window.location.href = `/edit-course.html?id=${courseId}`;
}

// Просмотр студентов курса
async function viewCourseStudents(courseId) {
    console.log('👥 Просмотр студентов курса:', courseId);
    
    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/courses/${courseId}/students`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            const students = result.students || [];
            
            if (students.length === 0) {
                alert('На этом курсе пока нет студентов');
                return;
            }
            
            showStudentsModal(students, courseId);
            
        } else {
            console.warn('⚠️ Не удалось загрузить студентов:', response.status);
            alert('Не удалось загрузить список студентов');
        }
        
    } catch (error) {
        console.error('❌ Ошибка загрузки студентов:', error);
        alert('Ошибка при загрузке студентов');
    }
}

// Отображение пустого состояния курсов
function showEmptyTeacherCourses() {
    const container = document.getElementById('teacher-courses-container');
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 48px; margin-bottom: 15px;">📚</div>
                <h3>У вас пока нет курсов</h3>
                <p>Создайте свой первый курс для преподавания</p>
                <button onclick="createCourse()" class="btn btn-primary" style="margin-top: 15px;">
                    Создать курс
                </button>
            </div>
        `;
    }
}

// Показ модального окна со студентами
function showStudentsModal(students, courseId) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal" style="max-width: 800px;">
            <div class="modal-header">
                <h3>Студенты курса (${students.length})</h3>
                <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="students-table-container">
                    <table class="students-table">
                        <thead>
                            <tr>
                                <th>Имя</th>
                                <th>Email</th>
                                <th>Дата записи</th>
                                <th>Прогресс</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${students.map(student => `
                                <tr>
                                    <td>${student.first_name || ''} ${student.last_name || ''}</td>
                                    <td>${student.email || ''}</td>
                                    <td>${formatDate(student.enrolled_at)}</td>
                                    <td>
                                        <div class="progress-container">
                                            <div class="progress-bar" style="width: ${student.progress || 0}%"></div>
                                            <span>${student.progress || 0}%</span>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                    Закрыть
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}


// Форматирование даты
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

// Получение текста уровня курса
function getLevelText(level) {
    const levels = {
        'basic': 'Базовый',
        'intermediate': 'Средний',
        'advanced': 'Продвинутый',
        'specialized': 'Специализация'
    };
    return levels[level] || level;
}

// ФУНКЦИИ ДЛЯ МОДАЛЬНОГО ОКНА ПРОВЕРКИ

// Открытие модального окна для проверки работы
/*async function openReviewModal(assignmentId) {
    console.log('🔍 Открываем проверку работы ID:', assignmentId);
    
    try {
        const token = localStorage.getItem('auth_token');
        
        // Пробуем разные эндпоинты
        const endpoints = [
            `/api/assignments/teacher/${assignmentId}`,  // Новый эндпоинт для преподавателей
            `/api/assignments/${assignmentId}/teacher-view`,  // Альтернативный эндпоинт
            `/api/assignments/${assignmentId}`,  // Общий эндпоинт (если изменили его на поддержку преподавателей)
            `/api/teacher/assignments/${assignmentId}`
        ];
        
        let assignment = null;
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    assignment = result.assignment || result.data || result;
                    break;
                }
            } catch (error) {
                console.warn(`⚠️ ${endpoint} не сработал:`, error.message);
            }
        }
        
        if (assignment) {
            showReviewModal(assignment);
        } else {
            console.error('❌ Не удалось загрузить данные задания');
            alert('Не удалось загрузить данные для проверки. Используем демо-данные.');
            showDemoReviewModal(assignmentId);
        }
        
    } catch (error) {
        console.error('❌ Ошибка открытия проверки:', error);
        showDemoReviewModal(assignmentId);
    }
}*/
// Открытие модального окна для проверки работы
async function openReviewModal(assignmentId) {
    console.log('🔍 Открываем проверку работы ID:', assignmentId);
    
    try {
        const token = localStorage.getItem('auth_token');
        
        // Пробуем эндпоинты в порядке приоритета
        const endpoints = [
            `/api/assignments/teacher/${assignmentId}`,      // Основной эндпоинт для преподавателей
            `/api/assignments/${assignmentId}/teacher`,      // Альтернативный эндпоинт
            `/api/assignments/${assignmentId}`,              
            `/api/teacher/assignments/${assignmentId}`       
        ];
        
        console.log('📡 Пробуем загрузить задание для преподавателя...');
        let assignment = null;
        let workingEndpoint = null;
        
        for (const endpoint of endpoints) {
            try {
                console.log(`🔄 Пробуем: ${endpoint}`);
                const response = await fetch(endpoint, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                console.log(`📊 Ответ от ${endpoint}: ${response.status} ${response.statusText}`);
                
                if (response.ok) {
                    const result = await response.json();
                    console.log(`✅ Успех! ${endpoint} вернул данные`);
                    assignment = result.assignment || result.data || result;
                    workingEndpoint = endpoint;
                    break;
                } else if (response.status === 403) {
                    console.log(`🚫 Доступ запрещен: ${endpoint}`);
                } else if (response.status === 404) {
                    console.log(`❌ Не найдено: ${endpoint}`);
                } else {
                    console.log(`⚠️ Ошибка ${response.status}: ${endpoint}`);
                }
            } catch (error) {
                console.warn(`🚨 Ошибка сети: ${endpoint}`, error.message);
            }
        }
        
        if (assignment) {
            console.log(`🎉 Задание загружено с ${workingEndpoint}:`, assignment);
            showReviewModal(assignment);
        } else {
            console.error('❌ Все эндпоинты не сработали');
            
            // Проверяем доступность API через отладочный эндпоинт
            try {
                const debugResponse = await fetch('/api/assignments/teacher/debug/all', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (debugResponse.ok) {
                    const debugData = await debugResponse.json();
                    console.log('🐛 Отладочная информация:', debugData);
                    
                    if (debugData.assignments_count > 0) {
                        // Ищем задание с нужным ID в отладочных данных
                        const foundAssignment = debugData.assignments.find(a => a.id == assignmentId);
                        if (foundAssignment) {
                            console.log('🎯 Нашли задание в отладочных данных!');
                            showReviewModal(foundAssignment);
                            return;
                        }
                    }
                }
            } catch (debugError) {
                console.warn('⚠️ Отладочный эндпоинт тоже не работает:', debugError.message);
            }
            
            if (confirm('Не удалось загрузить задание. Возможно:\n1. Эндпоинты не настроены на сервере\n2. У вас нет прав\n3. Задание не существует\n\nХотите использовать демо-режим для тестирования интерфейса?')) {
                showDemoReviewModal(assignmentId);
            }
        }
        
    } catch (error) {
        console.error('❌ Критическая ошибка openReviewModal:', error);
        
        if (confirm('Произошла ошибка. Использовать демо-режим?')) {
            showDemoReviewModal(assignmentId);
        }
    }
}
// Демо-модальное окно проверки
function showDemoReviewModal(assignmentId) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal review-modal" style="max-width: 800px;">
            <div class="modal-header">
                <h3>Проверка работы (демо)</h3>
                <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="review-content">
                    <div class="review-image-section">
                        <div class="review-image-container">
                            <div style="text-align: center; padding: 40px; color: #666;">
                                <div style="font-size: 48px; margin-bottom: 15px;">📷</div>
                                <p>Пример работы студента</p>
                                <p style="font-size: 0.9rem; margin-top: 10px;">
                                    Здесь будет загруженная фотография студента
                                </p>
                            </div>
                        </div>
                        <div class="assignment-details">
                            <h4>Информация о задании</h4>
                            <p><strong>Студент:</strong> Иван Иванов</p>
                            <p><strong>Курс:</strong> Основы фотографии</p>
                            <p><strong>Урок:</strong> Практика: Съемка с разной экспозицией</p>
                            <p><strong>Дата отправки:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
                        </div>
                    </div>
                    <div class="review-form-section">
                        <div class="grade-input">
                            <label for="grade-slider">Оценка (0-10)</label>
                            <input type="range" 
                                   id="grade-slider" 
                                   min="0" 
                                   max="10" 
                                   step="0.5" 
                                   value="0"
                                   class="grade-slider">
                            <div class="grade-value" id="grade-value">0</div>
                        </div>
                        
                        <div class="form-group">
                            <label for="review-comment">Комментарий преподавателя</label>
                            <textarea id="review-comment" 
                                      class="comment-textarea"
                                      placeholder="Дайте развернутую обратную связь студенту..."
                                      rows="6">Хорошая работа! Обратите внимание на композицию.</textarea>
                        </div>
                        
                        <div class="review-actions">
                            <button type="button" onclick="alert('✅ Одобрено! (демо)')" 
                                    class="btn btn-approve">
                                ✅ Одобрить
                            </button>
                            <button type="button" onclick="alert('🔄 Отправлено на доработку! (демо)')" 
                                    class="btn btn-reject">
                                🔄 На доработку
                            </button>
                            <button type="button" onclick="alert('💾 Сохранено! (демо)')" 
                                    class="btn btn-save">
                                💾 Сохранить
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Обновляем значение оценки при движении слайдера
    const gradeSlider = modal.querySelector('#grade-slider');
    const gradeValue = modal.querySelector('#grade-value');
    
    if (gradeSlider && gradeValue) {
        gradeSlider.addEventListener('input', function() {
            gradeValue.textContent = this.value;
        });
    }
}

// Показ модального окна проверки
function showReviewModal(assignment) {
    const student = assignment.enrollment?.enrollmentStudent || assignment.student || {};
    const course = assignment.enrollment?.course || assignment.course || {};
    const lesson = assignment.lesson || {};
    
    const studentName = student.first_name && student.last_name 
        ? `${student.first_name} ${student.last_name}`
        : student.email || 'Студент';
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'review-modal-overlay';
    modal.innerHTML = `
        <div class="modal review-modal">
            <div class="modal-header">
                <h3>Проверка работы</h3>
                <button class="close-btn" onclick="closeReviewModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="review-content">
                    <div class="review-image-section">
                        <div class="review-image-container">
                            ${assignment.photo_url ? 
                                `<img src="${assignment.photo_url}" alt="Работа студента" 
                                      style="max-width: 100%; max-height: 400px; border-radius: 8px;">` :
                                `<div style="text-align: center; padding: 40px; color: #666;">
                                    <div style="font-size: 48px;">📷</div>
                                    <p>Работа не содержит изображения</p>
                                </div>`
                            }
                        </div>
                        <div class="assignment-details">
                            <h4>Информация о задании</h4>
                            <p><strong>Студент:</strong> ${studentName}</p>
                            <p><strong>Курс:</strong> ${course.title || 'Не указан'}</p>
                            <p><strong>Урок:</strong> ${lesson.title || 'Не указан'}</p>
                            <p><strong>Дата отправки:</strong> ${formatDate(assignment.submitted_at || assignment.created_at)}</p>
                        </div>
                    </div>
                    <div class="review-form-section">
                        <div class="grade-input">
                            <label for="grade-slider">Оценка (0-10)</label>
                            <input type="range" 
                                   id="grade-slider" 
                                   min="0" 
                                   max="10" 
                                   step="0.5" 
                                   value="${assignment.grade || 0}"
                                   class="grade-slider">
                            <div class="grade-value" id="grade-value">${assignment.grade || 0}</div>
                        </div>
                        
                        <div class="form-group">
                            <label for="review-comment">Комментарий преподавателя</label>
                            <textarea id="review-comment" 
                                      class="comment-textarea"
                                      placeholder="Дайте развернутую обратную связь студенту..."
                                      rows="6">${assignment.teacher_comment || ''}</textarea>
                        </div>
                        
                        <div class="review-actions">
                            <button type="button" onclick="submitReview(${assignment.id}, 'approved')" 
                                    class="btn btn-approve">
                                ✅ Одобрить
                            </button>
                            <button type="button" onclick="submitReview(${assignment.id}, 'needs_revision')" 
                                    class="btn btn-reject">
                                🔄 На доработку
                            </button>
                            <button type="button" onclick="submitReview(${assignment.id})" 
                                    class="btn btn-save">
                                💾 Сохранить
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Обновляем значение оценки при движении слайдера
    const gradeSlider = document.getElementById('grade-slider');
    const gradeValue = document.getElementById('grade-value');
    
    if (gradeSlider && gradeValue) {
        gradeSlider.addEventListener('input', function() {
            gradeValue.textContent = this.value;
        });
    }
}

// Закрытие модального окна проверки
function closeReviewModal() {
    const modal = document.getElementById('review-modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Отправка проверки
async function submitReview(assignmentId, status = null) {
    console.log('📤 Отправляем проверку для задания:', assignmentId, 'Статус:', status);
    
    const grade = prompt('Введите оценку (0-10):', '8.5');
    if (grade === null) return;
    
    const gradeNum = parseFloat(grade);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 10) {
        alert('❌ Оценка должна быть числом от 0 до 10');
        return;
    }
    
    const comment = prompt('Введите комментарий:', 'Хорошая работа!');
    if (comment === null) return;
    
    try {
        const token = localStorage.getItem('auth_token');
        
        const response = await fetch(`/api/assignments/${assignmentId}/review`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                grade: gradeNum,
                teacher_comment: comment,
                status: status || 'reviewed'
            })
        });
        
        if (response.ok) {
            alert('✅ Проверка сохранена успешно!');
            
            // Закрываем модальное окно если оно есть
            const modal = document.querySelector('.modal-overlay');
            if (modal) modal.remove();
            
            // Обновляем список работ
            await loadTeacherAssignments();
            
        } else {
            // Если сервер не отвечает, сохраняем локально
            const reviews = JSON.parse(localStorage.getItem('teacher_reviews') || '{}');
            reviews[assignmentId] = {
                grade: gradeNum,
                comment: comment,
                status: status || 'reviewed',
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('teacher_reviews', JSON.stringify(reviews));
            
            alert('✅ Оценка сохранена локально');
            
            // Закрываем модальное окно
            const modal = document.querySelector('.modal-overlay');
            if (modal) modal.remove();
            
            // Обновляем интерфейс
            await loadTeacherAssignments();
        }
        
    } catch (error) {
        console.error('❌ Ошибка отправки проверки:', error);
        
        // Fallback: сохраняем локально
        const reviews = JSON.parse(localStorage.getItem('teacher_reviews') || '{}');
        reviews[assignmentId] = {
            grade: gradeNum,
            comment: comment,
            status: status || 'reviewed',
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('teacher_reviews', JSON.stringify(reviews));
        
        alert('✅ Оценка сохранена локально (ошибка сети)');
        
        // Закрываем модальное окно
        const modal = document.querySelector('.modal-overlay');
        if (modal) modal.remove();
    }
}
// ФУНКЦИЯ УДАЛЕНИЯ КУРСА (для использования из ЛК) 

async function deleteCourseFromDashboard(courseId) {
    if (!confirm('❌ УДАЛИТЬ КУРС?\n\nЭто действие удалит весь курс, все модули и уроки в нем.\nДействие необратимо!')) {
        return;
    }
    
    if (!confirm('Вы уверены? Это окончательное удаление.')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('auth_token');
        
        const response = await fetch(`/api/courses/${courseId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            alert('✅ Курс успешно удален');
            // Обновляем список курсов
            await loadTeacherDashboard();
        } else {
            const result = await response.json();
            alert(`❌ Ошибка: ${result.message || 'Не удалось удалить курс'}`);
        }
        
    } catch (error) {
        console.error('Error deleting course:', error);
        alert('❌ Ошибка сети при удалении курса');
    }
}

window.loadTeacherDashboard = loadTeacherDashboard;
window.createCourse = createCourse;
window.manageCourse = manageCourse;
window.viewCourseStudents = viewCourseStudents;
window.loadTeacherAssignments = loadTeacherAssignments;
window.openReviewModal = openReviewModal;
window.closeReviewModal = closeReviewModal;
window.submitReview = submitReview;
window.formatDate = formatDate;
window.getLevelText = getLevelText;