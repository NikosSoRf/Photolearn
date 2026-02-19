document.addEventListener('DOMContentLoaded', function() {
    console.log('Courses list page loaded');
    loadCourses();
});

async function loadCourses() {
    const grid = document.querySelector('.courses-grid');
    
    if (!grid) {
        console.error('Courses grid element not found!');
        return;
    }
    
    // Показываем спиннер загрузки
    grid.innerHTML = `
        <div class="loading-courses" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
            <div class="spinner"></div>
            <p>Загрузка курсов...</p>
        </div>
    `;

    try {
        console.log('Fetching courses from API...');
        const response = await fetch('/api/courses/public/home');
        const courses = await response.json();
        
        console.log('Courses received:', courses);
        
        if (!response.ok) {
            throw new Error(courses.error || 'Ошибка загрузки курсов');
        }
        
        renderCourses(courses);
        
    } catch (error) {
        console.error('Error loading courses:', error);
        showError('Не удалось загрузить курсов. Попробуйте обновить страницу.');
    }
}

function renderCourses(courses) {
    const grid = document.querySelector('.courses-grid');
    
    if (!grid) {
        console.error('Courses grid element not found!');
        return;
    }
    
    // Очищаем контейнер
    grid.innerHTML = '';
    
    if (!courses || courses.length === 0) {
        grid.innerHTML = `
            <div class="no-courses" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <p style="font-size: 1.2rem; margin-bottom: 20px;">Курсы пока не добавлены</p>
                <button onclick="createTestCourse()" class="btn btn-primary">
                    Создать тестовый курс
                </button>
                <p style="margin-top: 10px; font-size: 0.9rem; color: #666;">
                    (только для разработки)
                </p>
                <div style="margin-top: 20px;">
                    <p style="color: #666; font-size: 0.9rem;">
                        После создания обновите страницу
                    </p>
                </div>
            </div>
        `;
        return;
    }
    
    // Рендерим каждый курс
    courses.forEach(course => {
        const courseCard = createCourseCard(course);
        grid.appendChild(courseCard);
    });
}

function createCourseCard(course) {
    const card = document.createElement('div');
    card.className = 'course-card';
    
    const levelClass = getLevelClass(course.level);
    const levelText = getLevelText(course.level);
    const priceText = course.price === 0 || course.price === '0.00' ? 'Бесплатно' : `${course.price} у.е.`;
    
    let teacherName = course.teacher;
    if (typeof course.teacher === 'object' && course.teacher !== null) {
        teacherName = course.teacher.name || `${course.teacher.first_name} ${course.teacher.last_name}`;
    }
    
    // Определяем текст для кнопки
    let buttonText = course.price === 0 || course.price === '0.00' ? 'Начать обучение' : 'Выбрать курс';
    
    card.innerHTML = `
        <div class="course-level ${levelClass}">${levelText}</div>
        <h3>${course.title}</h3>
        <p>${course.description || 'Описание курса скоро будет добавлено.'}</p>
        <div class="course-info">
            <span>📚 ${course.modules_count || '8'} модулей</span>
            <span>⏱ ${course.duration || '8 недель'}</span>
        </div>
        <div class="course-teacher">Преподаватель: ${teacherName || 'Фотограф'}</div>
        <div class="course-price">${priceText}</div>
        <a href="/first_course.html?id=${course.id}" class="btn btn-primary">
            ${buttonText}
        </a>
    `;
    
    return card;
}

function getLevelClass(level) {
    const levelMap = {
        'basic': 'basic',
        'advanced': 'advanced', 
        'specialized': 'specialized'
    };
    return levelMap[level] || 'basic';
}

function getLevelText(level) {
    const textMap = {
        'basic': 'Базовый',
        'advanced': 'Продвинутый',
        'specialized': 'Специализация'
    };
    return textMap[level] || 'Базовый';
}

function handleCourseSelect(courseId) {
    window.location.href = `/course.html?id=${courseId}`;
}

async function createTestCourse() {
    try {
        const response = await fetch('/api/dev/create-test-data');
        const result = await response.json();
        
        if (response.ok) {
            alert(result.message || 'Тестовый курс создан! Обновите страницу.');
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            alert('Ошибка: ' + result.error);
        }
    } catch (error) {
        alert('Ошибка создания тестового курса: ' + error.message);
    }
}

function showError(message) {
    const grid = document.querySelector('.courses-grid');
    if (grid) {
        grid.innerHTML = `<div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #e74c3c;">${message}</div>`;
    }
}


// CSS для спиннера
const style = document.createElement('style');
style.textContent = `
    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);