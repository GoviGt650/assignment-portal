import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject(new Error(
        'Cannot reach the API server. On mobile, use the same WiFi as the dev PC and start the backend: cd backend && npm run dev'
      ));
    }
    const status = error.response.status;
    if (status === 502 || status === 503 || status === 504) {
      return Promise.reject(new Error('Server is starting up. Wait a moment and try again.'));
    }
    const message = error.response?.data?.detail || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export const healthApi = {
  check: () => api.get('/health'),
};

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  sendRegisterOtp: (email) => api.post('/auth/otp/send/register', { email }),
  sendForgotPasswordOtp: (data) => api.post('/auth/otp/send/forgot-password', data),
  lookupForgotPassword: (data) => api.post('/auth/forgot-password/lookup', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  sendChangeEmailOtp: (email) => api.post('/auth/otp/send/change-email', { email }),
  sendChangePasswordOtp: () => api.post('/auth/otp/send/change-password'),
  sendSetupEmailOtp: (email) => api.post('/auth/otp/send/setup-email', { email }),
  sendChangeUsernameOtp: () => api.post('/auth/otp/send/change-username'),
  setupEmail: (data) => api.patch('/auth/account/setup-email', data),
  updateEmail: (data) => api.patch('/auth/account/email', data),
  updateUsernameWithOtp: (data) => api.patch('/auth/account/username', data),
  updatePasswordWithOtp: (data) => api.patch('/auth/account/password', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data),
  getStudents: (params) => api.get('/auth/students', { params }),
};

export const assignmentApi = {
  list: (params) => api.get('/assignments', { params }),
  get: (id) => api.get(`/assignments/${id}`),
  create: (formData) => api.post('/assignments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, formData) => api.put(`/assignments/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  remove: (id) => api.delete(`/assignments/${id}`),
};

export const submissionApi = {
  list: (params) => api.get('/submissions', { params }),
  listAwaiting: (params) => api.get('/submissions/awaiting', { params }),
  get: (id) => api.get(`/submissions/${id}`),
  history: () => api.get('/submissions/history'),
  submit: (assignmentId, formData) => api.post(
    `/submissions/assignment/${assignmentId}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  ),
  submitFiles: (assignmentId, formData) => api.post(
    `/submissions/assignment/${assignmentId}/files`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  ),
  updateStatus: (id, data) => api.patch(`/submissions/${id}/status`, data),
  updateFeedback: (id, feedback) => api.patch(`/submissions/${id}/feedback`, { feedback }),
  exportAll: (params) => api.get('/submissions/export/all', { params }),
};

export const dashboardApi = {
  teacher: () => api.get('/dashboard/teacher'),
  student: () => api.get('/dashboard/student'),
};

export function resolveFileUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;

  const apiRoot = API_URL.replace(/\/api\/?$/, '');
  const path = url.startsWith('/api')
    ? url
    : (url.startsWith('/') ? url : `/${url}`);

  // Local dev: API_URL=/api → relative path (Vite proxy). Production: full Render URL.
  return apiRoot ? `${apiRoot}${path}` : path;
}

export async function fetchFileBlob(url) {
  const token = localStorage.getItem('token');
  const fileUrl = resolveFileUrl(url);

  const res = await fetch(fileUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const contentType = res.headers.get('Content-Type') || '';

  if (!res.ok) {
    let detail = 'Could not load file';
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      // response was not JSON
    }
    throw new Error(`${detail} (${res.status})`);
  }

  const blob = await res.blob();
  const type = contentType || blob.type || 'application/octet-stream';

  if (blob.size === 0) {
    throw new Error('File is empty — it may not have been uploaded correctly.');
  }

  if (type.includes('text/html')) {
    throw new Error(
      'File request returned a web page instead of the file. Check VITE_API_URL points to your backend API.'
    );
  }

  if (type.includes('application/json')) {
    const text = await blob.text();
    try {
      const parsed = JSON.parse(text);
      throw new Error(parsed.detail || 'Could not load file');
    } catch (err) {
      if (err instanceof Error && err.message !== 'Unexpected token') {
        throw err;
      }
      throw new Error('Could not load file');
    }
  }

  return { blob, contentType: type };
}

export function downloadFile(url, filename) {
  return fetchFileBlob(url)
    .then(({ blob }) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    });
}

export default api;
