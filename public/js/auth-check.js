
(function() {
    console.log('🔐 auth-check.js загружен');
    
    const token = localStorage.getItem('auth_token');
    const currentPath = window.location.pathname;
    
    console.log('📍 Текущий путь:', currentPath);
    console.log('🔑 Токен в localStorage:', token ? token.substring(0, 20) + '...' : 'Нет');
    
    // Список защищенных страниц (требуют авторизации)
    const protectedPages = [
        '/dashboard',
        '/dashboard.html',
        '/profile',
        '/my-courses',
        '/assignments'
    ];
    
    // Список страниц авторизации (куда не нужно заходить если уже авторизован)
    const authPages = [
        '/login',
        '/login.html',
        '/register',
        '/register.html'
    ];
    
    // Проверяем защищенные страницы
    const isProtectedPage = protectedPages.some(page => 
        currentPath.includes(page.replace('.html', ''))
    );
    
    // Проверяем страницы авторизации
    const isAuthPage = authPages.some(page => 
        currentPath.includes(page.replace('.html', ''))
    );
    
    console.log('📊 Защищенная страница:', isProtectedPage);
    console.log('📊 Страница авторизации:', isAuthPage);
    
    // ====== ПРАВИЛА ПЕРЕНАПРАВЛЕНИЯ ======
    
    if (!token && isProtectedPage) {
        console.log('🚫 Правило 1: Нет токена на защищенной странице');
        console.log('🔄 Перенаправляем на /login');
        window.location.href = '/login';
        return;
    }
    
    if (token && isAuthPage) {
        console.log('✅ Правило 2: Есть токен на странице авторизации');
        console.log('🔄 Перенаправляем на /dashboard');
        // Небольшая задержка чтобы видеть сообщение
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 500);
        return;
    }
    
    if (token && isProtectedPage) {
        console.log('🔍 Правило 3: Проверяем валидность токена');
        try {
            // Проверяем формат JWT токена
            const parts = token.split('.');
            if (parts.length !== 3) {
                console.error('❌ Неверный формат токена');
                localStorage.removeItem('auth_token');
                if (isProtectedPage) {
                    window.location.href = '/login';
                }
                return;
            }
            
            // Проверяем срок действия токена 
            const payload = JSON.parse(atob(parts[1]));
            const now = Math.floor(Date.now() / 1000);
            
            if (payload.exp && payload.exp < now) {
                console.error('❌ Токен истек');
                localStorage.removeItem('auth_token');
                if (isProtectedPage) {
                    window.location.href = '/login';
                }
                return;
            }
            
            console.log('✅ Токен валиден');
            console.log('👤 Данные из токена:', {
                id: payload.userId || payload.id,
                email: payload.email,
                role: payload.role,
                exp: new Date(payload.exp * 1000).toLocaleString()
            });
            
        } catch (error) {
            console.error('❌ Ошибка проверки токена:', error);
            localStorage.removeItem('auth_token');
            if (isProtectedPage) {
                window.location.href = '/login';
            }
        }
    }
    
    console.log('✅ Все проверки пройдены');
})();

