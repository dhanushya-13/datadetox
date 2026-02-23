export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T | null> {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });

    // 1. Check if the response is OK (status in the range 200-299)
    if (!response.ok) {
      const isAuthRequest = url.includes('/api/auth/login') || url.includes('/api/auth/register');
      
      if (response.status === 401 && !isAuthRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
        throw new Error('Session expired');
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    // 2. Handle empty responses (e.g., 204 No Content)
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json") || response.status === 204) {
      return null;
    }

    // 3. Safely parse JSON
    return await response.json();
  } catch (error) {
    // 4. Catch and log errors properly
    console.error(`API Fetch Error [${url}]:`, error);
    throw error;
  }
}
