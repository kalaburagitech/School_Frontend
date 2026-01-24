import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://school-backend-61j7.onrender.com/api',
    timeout: 30000, // 30 second timeout for large operations
    headers: {
        'Content-Type': 'application/json',
    }
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Add timestamp to prevent caching
        if (config.method === 'get') {
            config.params = {
                ...config.params,
                _t: Date.now()
            };
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        // Handle file downloads
        if (response.config.responseType === 'blob') {
            return response;
        }

        // Handle success messages
        if (response.data?.message) {
            // Optional: Show toast notification
            console.log('Success:', response.data.message);
        }

        return response;
    },
    (error) => {
        // Handle errors
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    // Token expired, redirect to login
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                    break;
                case 403:
                    alert('You do not have permission to perform this action.');
                    break;
                case 404:
                    alert('Resource not found.');
                    break;
                case 500:
                    alert('Server error. Please try again later.');
                    break;
                default:
                    alert(error.response.data?.message || 'An error occurred');
            }
        } else if (error.request) {
            alert('Network error. Please check your connection.');
        } else {
            alert('Request failed. Please try again.');
        }

        return Promise.reject(error);
    }
);

// File upload helper
export const uploadFile = async (file, endpoint, onProgress = null) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post(endpoint, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: onProgress
    });
};

// Download file helper
export const downloadFile = async (endpoint, filename) => {
    const response = await api.get(endpoint, {
        responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
};

export default api;