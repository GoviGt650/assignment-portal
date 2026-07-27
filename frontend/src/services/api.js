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
        'Cannot reach the API server. Start the backend: cd backend && npm run dev'
      ));
    }
    const message = error.response?.data?.detail || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
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
  exportAll: (params) => api.get('/submissions/export/all', { params }),
};

export const dashboardApi = {
  teacher: () => api.get('/dashboard/teacher'),
  student: () => api.get('/dashboard/student'),
};

export function downloadFile(url, filename) {
  const token = localStorage.getItem('token');
  return fetch(url.startsWith('http') ? url : `${API_URL.replace('/api', '')}${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => {
      if (!res.ok) throw new Error('Download failed');
      return res.blob();
    })
    .then((blob) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    });
}

export default api;
