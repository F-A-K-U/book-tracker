import axios from 'axios';

// Configuración base de axios
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
    withCredentials: true,
    timeout: 10000,
});

// Interceptor para manejo de errores
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Redireccionar al login si no está autenticado
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

// Servicios de autenticación
export const authService = {
    getCurrentUser: () => api.get('/auth/user'),
    logout: () => api.get('/auth/logout'),
};

// Servicios de libros
export const bookService = {
    getBooks: (params = {}) => api.get('/api/books', { params }),
    getBook: (id) => api.get(`/api/books/${id}`),
    createBook: (data) => api.post('/api/books', data),
    updateBook: (id, data) => api.put(`/api/books/${id}`, data),
    deleteBook: (id) => api.delete(`/api/books/${id}`),
};

// Servicios de progreso
export const progressService = {
    getProgress: () => api.get('/api/progress'),
    getBookProgress: (bookId) => api.get(`/api/progress/${bookId}`),
    updateProgress: (data) => api.post('/api/progress', data),
    deleteProgress: (id) => api.delete(`/api/progress/${id}`),
};

// Servicios de estadísticas
export const statsService = {
    getUserStats: () => api.get('/api/stats'),
};

// Utilidades para manejo de errores
export const handleApiError = (error) => {
    if (error.response) {
        // Error de respuesta del servidor
        const message = error.response.data?.error || 'Error del servidor';
        console.error('API Error:', message);
        return message;
    } else if (error.request) {
        // Error de red
        console.error('Network Error:', error.request);
        return 'Error de conexión. Verifica tu internet.';
    } else {
        // Error en la configuración de la petición
        console.error('Request Error:', error.message);
        return 'Error en la petición';
    }
};

// Hook personalizado para realizar peticiones
export const useApiCall = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const makeCall = async (apiCall, onSuccess, onError) => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiCall();
            if (onSuccess) onSuccess(response.data);
            return response.data;
        } catch (err) {
            const errorMessage = handleApiError(err);
            setError(errorMessage);
            if (onError) onError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { makeCall, loading, error };
};

// Validaciones del lado del cliente
export const validators = {
    book: {
        title: (value) => {
            if (!value || value.trim().length < 2) {
                return 'El título debe tener al menos 2 caracteres';
            }
            if (value.length > 200) {
                return 'El título no puede exceder 200 caracteres';
            }
            return null;
        },

        author: (value) => {
            if (!value || value.trim().length < 2) {
                return 'El autor debe tener al menos 2 caracteres';
            }
            if (value.length > 100) {
                return 'El autor no puede exceder 100 caracteres';
            }
            return null;
        },

        totalPages: (value) => {
            const pages = parseInt(value);
            if (!pages || pages < 1) {
                return 'El libro debe tener al menos 1 página';
            }
            if (pages > 10000) {
                return 'El número de páginas no puede exceder 10,000';
            }
            return null;
        },

        currentPage: (value, totalPages) => {
            const page = parseInt(value);
            if (page < 0) {
                return 'La página actual no puede ser negativa';
            }
            if (page > totalPages) {
                return 'La página actual no puede exceder el total de páginas';
            }
            return null;
        }
    },

    validateBook: (book) => {
        const errors = {};

        const titleError = validators.book.title(book.title);
        if (titleError) errors.title = titleError;

        const authorError = validators.book.author(book.author);
        if (authorError) errors.author = authorError;

        const pagesError = validators.book.totalPages(book.totalPages);
        if (pagesError) errors.totalPages = pagesError;

        return Object.keys(errors).length > 0 ? errors : null;
    }
};

// Utilidades de formato
export const formatters = {
    date: (date) => {
        return new Date(date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    percentage: (current, total) => {
        if (!total || total === 0) return 0;
        return Math.round((current / total) * 100);
    },

    readingTime: (currentPage, totalPages, startDate) => {
        if (!startDate || currentPage === 0) return null;

        const daysReading = Math.ceil((new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24));
        const pagesPerDay = currentPage / daysReading;
        const remainingPages = totalPages - currentPage;
        const estimatedDays = Math.ceil(remainingPages / pagesPerDay);

        return {
            daysReading,
            pagesPerDay: Math.round(pagesPerDay * 10) / 10,
            estimatedDays: estimatedDays > 0 ? estimatedDays : 0
        };
    }
};

export default api;