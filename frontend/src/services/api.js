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
  sendForgotPasswordOtp: (email) => api.post('/auth/otp/send/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  sendChangeEmailOtp: (email) => api.post('/auth/otp/send/change-email', { email }),
  sendChangePasswordOtp: () => api.post('/auth/otp/send/change-password'),
  updateEmail: (data) => api.patch('/auth/account/email', data),
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
  if (url.startsWith('/api')) return url;
  const base = API_URL.replace(/\/api\/?$/, '');
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
}

export async function fetchFileBlob(url) {
  const token = localStorage.getItem('token');
  const res = await fetch(resolveFileUrl(url), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Could not load file');
  const blob = await res.blob();
  return {
    blob,
    contentType: res.headers.get('Content-Type') || blob.type || 'application/octet-stream',
  };
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
