// public/js/debug-enrollment.js
console.log('🔧 DEBUG: Enrollment check');
console.log('URL:', window.location.href);
console.log('Token:', localStorage.getItem('auth_token'));
console.log('User role:', localStorage.getItem('user_role'));
console.log('Pending course:', localStorage.getItem('pending_course_enrollment'));

// Проверяем API записи
async function testEnrollmentAPI(courseId) {
    try {
        const response = await fetch(`/api/courses/${courseId}/enroll`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        });
        console.log('API Response:', response.status, await response.json());
    } catch (error) {
        console.error('API Error:', error);
    }
}