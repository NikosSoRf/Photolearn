class AssignmentUploader {
    constructor() {
        this.modal = null;
        this.currentAssignmentId = null;
        this.fileInput = null;
        this.previewContainer = null;
    }

    // Показать модальное окно загрузки
    showUploadModal(assignmentId, assignmentTitle = 'Задание') {
        console.log('📤 Открываем загрузку для задания:', assignmentId);
        
        // Создаем модальное окно
        this.modal = document.createElement('div');
        this.modal.className = 'upload-modal-overlay';
        this.modal.innerHTML = `
            <div class="upload-modal">
                <div class="modal-header">
                    <h3>📷 Загрузка работы</h3>
                    <button class="close-btn" onclick="assignmentUploader.closeModal()">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="assignment-info">
                        <h4>${assignmentTitle}</h4>
                        <p>Загрузите вашу фотографию для проверки преподавателем</p>
                    </div>
                    
                    <div class="upload-area" id="uploadDropZone">
                        <div class="upload-icon">📤</div>
                        <p class="upload-text">Перетащите фото сюда или кликните для выбора</p>
                        <p class="upload-hint">Поддерживаются: JPG, PNG, GIF, BMP (до 50 МБ)</p>
                        <input type="file" id="photoFileInput" accept="image/*" style="display: none;">
                    </div>
                    
                    <div class="preview-container" id="photoPreview" style="display: none;">
                        <h5>Предпросмотр:</h5>
                        <div class="image-preview">
                            <img id="previewImage" alt="Предпросмотр">
                        </div>
                        <button onclick="assignmentUploader.removePreview()" class="btn btn-secondary">
                            Удалить
                        </button>
                    </div>
                    
                    <div class="form-group">
                        <label for="assignmentComment">Комментарий (необязательно):</label>
                        <textarea 
                            id="assignmentComment" 
                            rows="3" 
                            placeholder="Опишите вашу работу, если нужно..."
                        ></textarea>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button onclick="assignmentUploader.closeModal()" class="btn btn-secondary">
                        Отмена
                    </button>
                    
                    <button id="submitUploadBtn" class="btn btn-primary" disabled>
                    Отправить на проверку
                     </button>
                </div>
                
                <div class="upload-progress" style="display: none;">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill"></div>
                    </div>
                    <p class="progress-text" id="progressText">Загрузка...</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.modal);
        this.currentAssignmentId = assignmentId;
        
        // Инициализируем события
        this.initEvents();
    }

    // Инициализация событий
    initEvents() {
        const uploadArea = document.getElementById('uploadDropZone');
        this.fileInput = document.getElementById('photoFileInput');
        this.previewContainer = document.getElementById('photoPreview');
        
        // Клик по области загрузки
        uploadArea.addEventListener('click', () => {
            this.fileInput.click();
        });
         const submitBtn = document.getElementById('submitUploadBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.submitUpload();
        });
         }
        // Изменение файла
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                this.handleFileSelect(e.target.files[0]);
            }
        });
        
        // Drag & Drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                this.handleFileSelect(e.dataTransfer.files[0]);
            }
        });
    }

    // Обработка выбранного файла
    handleFileSelect(file) {
        console.log('📁 Выбран файл:', file.name, file.size);
        
        // Проверка размера (50 МБ)
        if (file.size > 50 * 1024 * 1024) {
            alert('Файл слишком большой! Максимальный размер: 50 МБ');
            return;
        }
        
        // Проверка типа
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert('Неподдерживаемый формат файла!');
            return;
        }
        
        // Показываем предпросмотр
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('previewImage');
            preview.src = e.target.result;
            this.previewContainer.style.display = 'block';
            
            // Активируем кнопку отправки
            document.getElementById('submitUploadBtn').disabled = false;
        };
        reader.readAsDataURL(file);
    }

    // Удалить предпросмотр
    removePreview() {
        this.fileInput.value = '';
        this.previewContainer.style.display = 'none';
        document.getElementById('submitUploadBtn').disabled = true;
    }

    // Отправка на сервер
    /*async submitUpload() {
        if (!this.fileInput.files[0]) {
            alert('Выберите файл для загрузки');
            return;
        }
        
        const submitBtn = document.getElementById('submitUploadBtn');
        const progressBar = document.querySelector('.upload-progress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        // Показываем прогресс
        submitBtn.disabled = true;
        progressBar.style.display = 'block';
        
        const formData = new FormData();
        formData.append('photo', this.fileInput.files[0]);
        formData.append('lesson_id', this.currentAssignmentId);
        formData.append('comment', document.getElementById('assignmentComment').value);
        
        try {
            const token = localStorage.getItem('auth_token');
            
            // Имитируем прогресс загрузки
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 5;
                if (progress > 90) clearInterval(progressInterval);
                progressFill.style.width = progress + '%';
                progressText.textContent = `Загрузка ${progress}%`;
            }, 100);
            
            const response = await fetch('/api/assignments/submit', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            clearInterval(progressInterval);
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Успешная загрузка:', result);
                
                progressFill.style.width = '100%';
                progressText.textContent = 'Успешно!';
                
                // Сообщение об успехе
                setTimeout(() => {
                    this.showSuccessMessage(result.message || 'Работа успешно загружена!');
                    this.closeModal();
                    
                    // Обновляем список заданий если он есть на странице
                    if (typeof loadStudentDashboard === 'function') {
                        loadStudentDashboard();
                    }
                }, 1000);
                
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка загрузки');
            }
            
        } catch (error) {
            console.error('❌ Ошибка загрузки:', error);
            
            // Показываем ошибку
            progressFill.style.background = '#e74c3c';
            progressText.textContent = 'Ошибка: ' + error.message;
            progressText.style.color = '#e74c3c';
            
            setTimeout(() => {
                submitBtn.disabled = false;
                progressBar.style.display = 'none';
            }, 2000);
        }
    }*/
// В assignment-upload.js найдите функцию submitUpload и замените ее:
/*async submitUpload() {
    if (!this.fileInput || !this.fileInput.files[0]) {
        alert('Выберите файл для загрузки');
        return;
    }

    const file = this.fileInput.files[0];
    const lessonId = this.currentAssignmentId;
    const comment = document.getElementById('assignmentComment')?.value || '';
    
    console.log('📤 Отправка файла:', file.name, 'размер:', file.size, 'урок:', lessonId);
    
    const submitBtn = document.getElementById('submitUploadBtn');
    const progressBar = document.querySelector('.upload-progress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    // Показываем прогресс
    submitBtn.disabled = true;
    if (progressBar) progressBar.style.display = 'block';
    
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('lesson_id', lessonId);
    formData.append('comment', comment);
    
    try {
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
            throw new Error('Требуется авторизация');
        }
        
        console.log('📡 Отправляем запрос на /api/assignments/submit');
        
        // Важно: НЕ добавляем Content-Type header при FormData!
        const response = await fetch('/api/assignments/submit', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // НЕ добавляем 'Content-Type': 'multipart/form-data' - браузер сам установит с boundary
            },
            body: formData
        });
        
        console.log('📨 Статус ответа:', response.status);
        console.log('📨 URL ответа:', response.url);
        
        const result = await response.json();
        console.log('📨 Ответ сервера:', result);
        
        if (response.ok && result.success) {
            // Успешная загрузка
            if (progressFill) {
                progressFill.style.width = '100%';
                progressFill.style.background = '#2ecc71';
            }
            if (progressText) {
                progressText.textContent = '✅ Успешно!';
                progressText.style.color = '#2ecc71';
            }
            
            // Сообщение об успехе
            setTimeout(() => {
                this.showSuccessMessage(result.message || 'Работа успешно загружена!');
                this.closeModal();
                
                // Обновляем страницу урока если мы на ней
                if (window.location.pathname.includes('lesson.html')) {
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                }
                
                // Обновляем список заданий в дашборде если он есть
                if (typeof loadStudentDashboard === 'function') {
                    setTimeout(loadStudentDashboard, 1500);
                }
            }, 1000);
            
        } else {
            throw new Error(result.error || 'Ошибка загрузки');
        }
        
    } catch (error) {
        console.error('❌ Ошибка загрузки:', error);
        
        // Показываем ошибку
        if (progressFill) {
            progressFill.style.background = '#e74c3c';
            progressFill.style.width = '100%';
        }
        if (progressText) {
            progressText.textContent = '❌ Ошибка: ' + error.message;
            progressText.style.color = '#e74c3c';
        }
        
        setTimeout(() => {
            if (submitBtn) submitBtn.disabled = false;
            if (progressBar) progressBar.style.display = 'none';
        }, 3000);
    }
}*/
   async submitUpload() {
    console.log('🔄 submitUpload вызван!');
    
    if (!this.fileInput || !this.fileInput.files || this.fileInput.files.length === 0) {
        alert('Выберите файл для загрузки');
        return;
    }
    
    const file = this.fileInput.files[0];
    const lessonId = this.currentAssignmentId;
    const comment = document.getElementById('assignmentComment')?.value || '';
    
    console.log('📤 Отправка файла:', file.name, 'урок:', lessonId);
    
    const submitBtn = document.getElementById('submitUploadBtn');
    const progressBar = document.querySelector('.upload-progress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    // Показываем прогресс
    submitBtn.disabled = true;
    if (progressBar) progressBar.style.display = 'block';
    if (progressFill) progressFill.style.width = '0%';
    if (progressText) progressText.textContent = 'Подготовка...';
    
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('lesson_id', lessonId);
    formData.append('comment', comment);
    
    console.log('📦 FormData создан, полей:', Array.from(formData.keys()));
    
    try {
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
            throw new Error('Требуется авторизация');
        }
        
        console.log('📡 Отправляем запрос на /api/assignments/submit');
        console.log('🔑 Токен:', token.substring(0, 20) + '...');
        
        // Имитируем прогресс
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 10;
            if (progress > 70) clearInterval(progressInterval);
            if (progressFill) {
                progressFill.style.width = progress + '%';
                progressFill.style.background = '#3498db';
            }
            if (progressText) {
                progressText.textContent = `Загрузка ${progress}%`;
            }
        }, 200);
        
        // Отправляем запрос
        const response = await fetch('/api/assignments/submit', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        clearInterval(progressInterval);
        
        console.log('📨 Ответ получен, статус:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Успешный ответ:', result);
            
            // Показываем успех
            if (progressFill) {
                progressFill.style.width = '100%';
                progressFill.style.background = '#2ecc71';
            }
            if (progressText) {
                progressText.textContent = '✅ Успешно!';
                progressText.style.color = '#2ecc71';
            }
            
            setTimeout(() => {
                this.showSuccessMessage(result.message || 'Работа успешно загружена!');
                this.closeModal();
                
                // Обновляем страницу если нужно
                if (window.location.pathname.includes('lesson.html')) {
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                }
            }, 1000);
            
        } else {
            // Пробуем получить текст ошибки
            let errorMessage = 'Ошибка сервера';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || 'Неизвестная ошибка';
            } catch (e) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            
            throw new Error(errorMessage);
        }
        
    } catch (error) {
        console.error('❌ Ошибка загрузки:', error);
        
        // Показываем ошибку
        if (progressFill) {
            progressFill.style.background = '#e74c3c';
            progressFill.style.width = '100%';
        }
        if (progressText) {
            progressText.textContent = '❌ Ошибка: ' + error.message;
            progressText.style.color = '#e74c3c';
        }
        
        // Возвращаем кнопку в исходное состояние
        setTimeout(() => {
            if (submitBtn) submitBtn.disabled = false;
            if (progressBar) progressBar.style.display = 'none';
        }, 3000);
    }
} 

// Показать сообщение об успехе
    showSuccessMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'success-message';
        messageDiv.innerHTML = `
            <div class="success-content">
                <span class="success-icon">✅</span>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(messageDiv);
        
        // Автоматически скрыть через 5 секунд
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    // Закрыть модальное окно
    closeModal() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
            this.currentAssignmentId = null;
        }
    }
}

// Создаем глобальный экземпляр
const assignmentUploader = new AssignmentUploader();

// Глобальные функции для вызова из HTML
window.uploadAssignment = function(assignmentId, assignmentTitle) {
     if (typeof assignmentUploader !== 'undefined') {
        assignmentUploader.showUploadModal(assignmentId, assignmentTitle);
    } else {
        console.error('❌ AssignmentUploader не загружен');
        alert('Система загрузки не инициализирована. Обновите страницу.');
    }
};

window.assignmentUploader = assignmentUploader;