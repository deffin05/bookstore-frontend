const API_SIGN_UP = 'http://localhost:8000/users/';
const API_AUTH = 'http://localhost:8000/api/token/';
const loginForm = document.getElementById('loginForm');
const messageDiv = document.getElementById('message');
const submitBtn = document.getElementById('submitBtn');

// Form inputs
const usernameInput = document.getElementById('username');
const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const passwordCheckInput = document.getElementById('passwordCheck');

function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type} show`;
}

function validateForm() {
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const passwordCheck = passwordCheckInput.value;

    if (!username || !email || !password || !passwordCheck) {
        showMessage('Please fill in all required fields', 'error');
        return false;
    }

    if (password !== passwordCheck) {
        showMessage('Passwords do not match', 'error');
        return false;
    }

    if (password.length < 8) {
        showMessage('Password must be at least 8 characters long', 'error');
        return false;
    }

    if (password.length > 32) {
        showMessage('Password must be at most 32 characters long', 'error');
        return false;
    }

    return true;
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing up...';

    const userData = {
        username: usernameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value
    };

    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();

    if (firstName) {
        userData.first_name = firstName;
    }

    if (lastName) {
        userData.last_name = lastName;
    }

    try {
        const response = await fetch(API_SIGN_UP, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('Sign up successful!', 'success');

            const tokenResponse = await fetch(API_AUTH, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const tokenData = await tokenResponse.json();

            localStorage.setItem('accessToken', tokenData.access);
            localStorage.setItem('refreshToken', tokenData.refresh);
            window.location.pathname = '../..'
        } else {
            let errorMsg = data.detail || data.message || 'Invalid credentials';

            if (data.username) {
                errorMsg = `Username: ${data.username[0]}`;
            } else if (data.email) {
                errorMsg = `Email: ${data.email[0]}`;
            } else if (data.password) {
                errorMsg = `Password: ${data.password[0]}`;
            } else if (data.detail) {
                errorMsg = data.detail;
            } else if (data.message) {
                errorMsg = data.message;
            } else if (data.non_field_errors) {
                errorMsg = data.non_field_errors[0];
            }
            showMessage(errorMsg, 'error');
        }
    } catch (error) {
        showMessage('Connection error. Please check your API URL.', 'error');
        console.error('Error:', error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
    }
});

passwordCheckInput.addEventListener('input', () => {
    if (passwordCheckInput.value && passwordInput.value !== passwordCheckInput.value) {
        passwordCheckInput.setCustomValidity('Passwords do not match');
    } else {
        passwordCheckInput.setCustomValidity('');
    }
});