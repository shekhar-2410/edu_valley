const API_BASE_URL = import.meta.env.VITE_API_URL || ''; 

export const API_ENDPOINTS = {
    events: `${API_BASE_URL}/events`,
    announcements: `${API_BASE_URL}/announcements`,
    faculty: `${API_BASE_URL}/faculty`,
    gallery: `${API_BASE_URL}/gallery`,
    contacts: `${API_BASE_URL}/contacts`,
    login: `${API_BASE_URL}/auth/login`,
    upload: `${API_BASE_URL}/upload`,
    images: `${API_BASE_URL}/images`,
};

export default API_BASE_URL;
