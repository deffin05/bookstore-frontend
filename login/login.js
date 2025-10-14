const API_BASE = 'http://localhost:8000/api/token/';
const loginForm = document.getElementById('loginForm');
const messageDiv = document.getElementById('message');
const submitBtn = document.getElementById('submitBtn');

function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type} show`;
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing In...';

    try {
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('Login successful!', 'success');

            localStorage.setItem('accessToken', data.access);
            localStorage.setItem('refreshToken', data.refresh);
            window.location.pathname = '../..'
        } else {
            const errorMsg = data.detail || data.message || 'Invalid credentials';
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

async function isLoggedIn() {
    if (!localStorage.getItem('accessToken')) return false;

    const accessResponse = await fetch(API_BASE + 'verify/', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ "token": localStorage.getItem('accessToken') })
    });

    if (accessResponse.status == 200) {
        return true;
    };

    const refreshResponse = await fetch(API_BASE + 'refresh/', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ "refresh": localStorage.getItem('refreshToken') })
    });

    if (refreshResponse.status == 200) {
        localStorage.setItem('accessToken', (await refreshResponse.json()).access)
        return true;
    }

    return false;
}

async function checkLogged() {
    const logged = await isLoggedIn();
    if (logged) {
        window.location.pathname = '../..';
    }
}
window.onload = checkLogged;