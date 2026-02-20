// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
    events: `${API_BASE_URL}/api/events`,
    announcements: `${API_BASE_URL}/api/announcements`,
    faculty: `${API_BASE_URL}/api/faculty`,
    gallery: `${API_BASE_URL}/api/gallery`,
    contacts: `${API_BASE_URL}/api/contacts`,
    login: `${API_BASE_URL}/api/auth/login`,
    upload: `${API_BASE_URL}/api/upload`,
    images: `${API_BASE_URL}/api/images`,
};

export default API_BASE_URL;
