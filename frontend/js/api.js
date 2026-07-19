const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://dynamicqr-xpoq.onrender.com';

function getAuthToken() {
  return localStorage.getItem('qr_auth_token');
}

function getUser() {
  const savedUser = localStorage.getItem('qr_user');
  if (savedUser) {
    try {
      return JSON.parse(savedUser);
    } catch (e) {
      return null;
    }
  }
  return null;
}

function checkAuth() {
  const token = getAuthToken();
  const user = getUser();
  if (!token || !user) {
    localStorage.removeItem('qr_auth_token');
    localStorage.removeItem('qr_user');
    window.location.href = '/login';
    return null;
  }
  return { token, user };
}

function checkNotAuth() {
  const token = getAuthToken();
  const user = getUser();
  if (token && user) {
    window.location.href = '/dashboard';
  }
}

async function apiRequest(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (response.status === 401) {
    localStorage.removeItem('qr_auth_token');
    localStorage.removeItem('qr_user');
    if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
      window.location.href = '/login?expired=true';
    }
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    return data;
  } else {
    const text = await response.text();
    if (!response.ok) {
      throw new Error(text || 'Something went wrong');
    }
    return text;
  }
}

function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = '';
  if (type === 'success') icon = '✓ ';
  if (type === 'error') icon = '✗ ';
  
  toast.innerHTML = `
    <span>${icon}${message}</span>
    <span class="toast-close">&times;</span>
  `;

  container.appendChild(toast);

  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.remove();
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s ease';
    setTimeout(() => toast.remove(), 500);
  }, 5000);
}
