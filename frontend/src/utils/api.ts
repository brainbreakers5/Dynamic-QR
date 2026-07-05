const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function apiRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body: any = null,
  token: string | null = null
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('qr_auth_token') : null);

  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (response.status === 401 && typeof window !== 'undefined') {
    // Session expired, clear storage
    localStorage.removeItem('qr_auth_token');
    localStorage.removeItem('qr_user');
    if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/signup') && window.location.pathname !== '/') {
      window.location.href = '/login?expired=true';
    }
  }

  // Handle redirects and plain text response for 302/short URLs (though the browser handles redirects directly, we might hit endpoints directly)
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

export { API_URL };
