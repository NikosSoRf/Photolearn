document.addEventListener('DOMContentLoaded', function() {
    console.log('Create course page loaded');
    
    // Проверяем авторизацию и роль
    checkAuthAndRole(['teacher']);
    
    // Настраиваем форму
    const form = document.getElementById('create-course-form');
    if (form) {
        form.addEventListener('submit', handleCreateCourse);
    }
});

async function handleCreateCourse(event) {
    event.preventDefault();
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
        showMessage('Ошибка авторизации. Пожалуйста, войдите снова.', 'error');
        return;
    }
    
    // Собираем данные формы
    const courseData = {
        title: document.getElementById('course-title').value.trim(),
        description: document.getElementById('course-description').value.trim(),
        level: document.getElementById('course-level').value,
        price: parseFloat(document.getElementById('course-price').value) || 0,
        video_call_link: document.getElementById('video-call-link').value.trim() || null
    };
    
    // Валидация
    if (!courseData.title) {
        showMessage('Пожалуйста, введите название курса', 'error');
        return;
    }
    
    if (!courseData.description) {
        showMessage('Пожалуйста, введите описание курса', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/courses', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(courseData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showMessage('✅ Курс успешно создан! Перенаправляем...', 'success');
            
            // Перенаправляем на страницу управления курсом
            /*setTimeout(() => {
                if (result.course && result.course.id) {
                    window.location.href = `/edit-course.html?id=${result.course.id}`;
                } else {
                    window.location.href = '/dashboard.html';
                }
            }, 2000);*/
            // АВТОМАТИЧЕСКАЯ ПЕРЕАДРЕСАЦИЯ В ЛК через 2 секунды
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 2000);
            
            // Дополнительно показываем кнопку для быстрого перехода
            setTimeout(() => {
                const container = document.getElementById('message-container');
                if (container) {
                    container.innerHTML += `
                        <div style="margin-top: 15px;">
                            <button onclick="window.location.href='/dashboard.html'" 
                                    class="btn btn-primary"
                                    style="background: #667eea; color: white; padding: 10px 20px;">
                                ⚡ Перейти в личный кабинет сейчас
                            </button>
                        </div>
                    `;
                }
            }, 500);
            
        } else {
            showMessage(`❌ Ошибка: ${result.message || 'Не удалось создать курс'}`, 'error');
        }
        
    } catch (error) {
        console.error('Error creating course:', error);
        showMessage('❌ Ошибка сети. Пожалуйста, попробуйте снова.', 'error');
    }
}

function showMessage(message, type) {
    const container = document.getElementById('message-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="message ${type}" style="padding: 15px; border-radius: 8px; margin: 20px 0;">
            ${message}
        </div>
    `;
    container.style.display = 'block';
    
    // Автоматически скрыть через 5 секунд
    setTimeout(() => {
        container.style.display = 'none';
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
        alert('У вас нет прав для доступа к этой странице');
        window.location.href = '/dashboard.html';
        return false;
    }
    
    return true;
}