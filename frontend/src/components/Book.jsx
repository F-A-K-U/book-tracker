import React, { useState } from 'react';
import { Book, Plus, Search, BookOpen, Star, Edit, Trash2, RotateCcw, Globe, Menu, X } from 'lucide-react';
import GoogleBooksSearch from './GoogleBooksSearch';

const Books = ({ books, setBooks, progress, setProgress, loadUserData }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddBook, setShowAddBook] = useState(false);
    const [showGoogleSearch, setShowGoogleSearch] = useState(false);
    const [editingBook, setEditingBook] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [showMobileActions, setShowMobileActions] = useState(false);
    const [newBook, setNewBook] = useState({
        title: '',
        author: '',
        totalPages: '',
        genre: '',
        isbn: '',
        description: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Validación de libro
    const validateBook = (bookData) => {
        const validationErrors = {};
        
        if (!bookData.title || bookData.title.trim().length < 2) {
            validationErrors.title = 'El título debe tener al menos 2 caracteres';
        }
        
        if (!bookData.author || bookData.author.trim().length < 2) {
            validationErrors.author = 'El autor debe tener al menos 2 caracteres';
        }
        
        const pages = parseInt(bookData.totalPages);
        if (!pages || pages < 1) {
            validationErrors.totalPages = 'El libro debe tener al menos 1 página';
        } else if (pages > 10000) {
            validationErrors.totalPages = 'El número de páginas no puede exceder 10,000';
        }

        return validationErrors;
    };

    // Función para manejar libro agregado desde Google Books
    const handleBookAddedFromGoogle = (newBook) => {
        setBooks(prevBooks => [newBook, ...prevBooks]);
        setShowGoogleSearch(false);
        setShowMobileActions(false);
        
        if (loadUserData) {
            loadUserData();
        }
    };

    // Agregar nuevo libro
    const handleAddBook = async (bookData) => {
        setErrors({});
        setLoading(true);
        
        const validationErrors = validateBook(bookData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setLoading(false);
            return;
        }

        try {
            const finalBookData = {
                ...bookData,
                totalPages: parseInt(bookData.totalPages),
                title: bookData.title.trim(),
                author: bookData.author.trim(),
                isbn: bookData.isbn?.trim() || '',
                genre: bookData.genre?.trim() || '',
                description: bookData.description?.trim() || ''
            };

            const response = await fetch('/api/books', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(finalBookData)
            });

            if (response.ok) {
                const book = await response.json();
                setBooks(prevBooks => [book, ...prevBooks]);
                setNewBook({
                    title: '',
                    author: '',
                    totalPages: '',
                    genre: '',
                    isbn: '',
                    description: ''
                });
                setShowAddBook(false);
                setShowMobileActions(false);
                setErrors({});
                
                if (loadUserData) {
                    await loadUserData();
                }
            } else {
                const errorData = await response.json();
                setErrors({ submit: errorData.error || 'Error al agregar el libro' });
            }
        } catch (error) {
            console.error('Error adding book:', error);
            setErrors({ submit: 'Error de conexión. Verifica tu internet.' });
        } finally {
            setLoading(false);
        }
    };

    // Editar libro existente
    const handleEditBook = async (bookData) => {
        setErrors({});
        setLoading(true);
        
        const validationErrors = validateBook(bookData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setLoading(false);
            return;
        }

        try {
            const finalBookData = {
                ...bookData,
                totalPages: parseInt(bookData.totalPages),
                title: bookData.title.trim(),
                author: bookData.author.trim(),
                isbn: bookData.isbn?.trim() || '',
                genre: bookData.genre?.trim() || '',
                description: bookData.description?.trim() || ''
            };

            const response = await fetch(`/api/books/${bookData._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(finalBookData)
            });

            if (response.ok) {
                const updatedBook = await response.json();
                setBooks(prevBooks => 
                    prevBooks.map(book => 
                        book._id === bookData._id ? updatedBook : book
                    )
                );
                setEditingBook(null);
                setErrors({});
                
                if (loadUserData) {
                    await loadUserData();
                }
            } else {
                const errorData = await response.json();
                setErrors({ submit: errorData.error || 'Error al actualizar el libro' });
            }
        } catch (error) {
            console.error('Error updating book:', error);
            setErrors({ submit: 'Error de conexión. Verifica tu internet.' });
        } finally {
            setLoading(false);
        }
    };

    // Eliminar libro
    const handleDeleteBook = async (bookId, bookTitle) => {
        setDeleteTarget({ id: bookId, title: bookTitle, type: 'book' });
        setShowDeleteModal(true);
    };

    // Eliminar progreso
    const handleDeleteProgress = async (progressId, bookTitle) => {
        setDeleteTarget({ id: progressId, title: bookTitle, type: 'progress' });
        setShowDeleteModal(true);
    };

    // Confirmar eliminación
    const confirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            const endpoint = deleteTarget.type === 'book' 
                ? `/api/books/${deleteTarget.id}` 
                : `/api/progress/${deleteTarget.id}`;

            const response = await fetch(endpoint, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                if (deleteTarget.type === 'book') {
                    setBooks(prevBooks => prevBooks.filter(book => book._id !== deleteTarget.id));
                    setProgress(prevProgress => 
                        prevProgress.filter(p => p.bookId._id !== deleteTarget.id)
                    );
                } else {
                    setProgress(prevProgress => 
                        prevProgress.filter(p => p._id !== deleteTarget.id)
                    );
                }
                if (loadUserData) {
                    await loadUserData();
                }
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Error de conexión al eliminar.');
        } finally {
            setShowDeleteModal(false);
            setDeleteTarget(null);
        }
    };

    // Actualizar progreso
    const updateProgress = async (bookId, currentPage) => {
        try {
            const pageNum = parseInt(currentPage);
            if (isNaN(pageNum) || pageNum < 0) return;

            const book = books.find(b => b._id === bookId);
            if (book && pageNum > book.totalPages) {
                alert(`La página no puede ser mayor a ${book.totalPages}`);
                return;
            }

            const response = await fetch('/api/progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    bookId,
                    currentPage: pageNum
                })
            });

            if (response.ok) {
                const updatedProgress = await response.json();
                setProgress(prev => {
                    const index = prev.findIndex(p => p.bookId._id === bookId);
                    if (index >= 0) {
                        const newProgress = [...prev];
                        newProgress[index] = updatedProgress;
                        return newProgress;
                    }
                    return [...prev, updatedProgress];
                });
            }
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    };

    // Función auxiliar para el botón de lectura
    const ReadButton = ({ book, isMobile = false, size = 14 }) => {
        const handleReadClick = () => {
            let readUrl = null;
            
            // Prioridad: previewLink almacenado > generar URL con googleId > mostrar mensaje
            if (book.previewLink) {
                readUrl = book.previewLink;
            } else if (book.googleId) {
                readUrl = `https://books.google.com/books?id=${book.googleId}&printsec=frontcover&source=gbs_ge_summary_r&cad=0#v=onepage&q&f=false`;
            }
            
            if (readUrl) {
                // Abrir en nueva pestaña
                window.open(readUrl, '_blank', 'noopener,noreferrer');
            } else {
                // Mostrar mensaje si no hay link disponible
                alert('Vista previa no disponible para este libro');
            }
        };

        const buttonClasses = isMobile 
            ? "w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 text-sm flex items-center justify-center space-x-2"
            : "flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md text-sm flex items-center justify-center space-x-1";

        return (
            <button
                onClick={handleReadClick}
                className={buttonClasses}
                title={book.previewLink ? "Leer vista previa" : "Abrir en Google Books"}
            >
                <BookOpen size={size} />
                <span>{isMobile ? "Leer vista previa" : "Leer"}</span>
            </button>
        );
    };

    const filteredBooks = books.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Componente de formulario manual - ADAPTADO PARA MÓVIL
    const BookForm = ({ book, onSubmit, onCancel, title, isEditing = false }) => {
        const [localBook, setLocalBook] = useState({
            title: book?.title || '',
            author: book?.author || '',
            totalPages: book?.totalPages || '',
            genre: book?.genre || '',
            isbn: book?.isbn || '',
            description: book?.description || '',
            _id: book?._id || undefined
        });

        React.useEffect(() => {
            setLocalBook({
                title: book?.title || '',
                author: book?.author || '',
                totalPages: book?.totalPages || '',
                genre: book?.genre || '',
                isbn: book?.isbn || '',
                description: book?.description || '',
                _id: book?._id || undefined
            });
        }, [book]);

        const handleInputChange = (field, value) => {
            setLocalBook(prev => ({ ...prev, [field]: value }));
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            onSubmit(localBook);
        };

        return (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-lg flex items-center justify-center p-3 sm:p-6 z-50">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 max-w-md w-full border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto">
                    <h3 className="text-xl sm:text-2xl font-black text-white mb-4 sm:mb-6" style={{ fontFamily: 'Inter Black, sans-serif' }}>
                        {title}
                    </h3>

                    {errors.submit && (
                        <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-3 rounded-xl sm:rounded-2xl mb-4 text-sm">
                            {errors.submit}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                        <div>
                            <input
                                type="text"
                                placeholder="Título del libro"
                                value={localBook.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-sm sm:text-base"
                                required
                            />
                            {errors.title && <p className="text-red-300 text-xs sm:text-sm mt-1">{errors.title}</p>}
                        </div>

                        <div>
                            <input
                                type="text"
                                placeholder="Autor"
                                value={localBook.author}
                                onChange={(e) => handleInputChange('author', e.target.value)}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-sm sm:text-base"
                                required
                            />
                            {errors.author && <p className="text-red-300 text-xs sm:text-sm mt-1">{errors.author}</p>}
                        </div>

                        <div>
                            <input
                                type="number"
                                placeholder="Total de páginas"
                                value={localBook.totalPages}
                                onChange={(e) => handleInputChange('totalPages', e.target.value)}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-sm sm:text-base"
                                required
                                min="1"
                            />
                            {errors.totalPages && <p className="text-red-300 text-xs sm:text-sm mt-1">{errors.totalPages}</p>}
                        </div>

                        <input
                            type="text"
                            placeholder="Género"
                            value={localBook.genre}
                            onChange={(e) => handleInputChange('genre', e.target.value)}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-sm sm:text-base"
                        />

                        <input
                            type="text"
                            placeholder="ISBN"
                            value={localBook.isbn}
                            onChange={(e) => handleInputChange('isbn', e.target.value)}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-sm sm:text-base"
                        />

                        <textarea
                            placeholder="Descripción (opcional)"
                            value={localBook.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows="3"
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-none text-sm sm:text-base"
                        />

                        <div className="flex space-x-2 sm:space-x-4 pt-2 sm:pt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    onCancel();
                                    setErrors({});
                                }}
                                className="flex-1 py-2 sm:py-3 px-3 sm:px-6 bg-red-600/10 backdrop-blur-lg border border-white/20 text-white rounded-xl sm:rounded-2xl font-medium transition-all duration-300 hover:bg-red-600/30 cursor-pointer hover:scale-105 text-sm sm:text-base"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-2 sm:py-3 px-3 sm:px-6 bg-emerald-600 hover:bg-emerald-500 cursor-pointer text-white rounded-xl sm:rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 text-sm sm:text-base"
                            >
                                {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Agregar')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    // Modal de confirmación de eliminación - ADAPTADO PARA MÓVIL
    const ConfirmDeleteModal = () => {
        if (!showDeleteModal || !deleteTarget) return null;

        const isBook = deleteTarget.type === 'book';
        const title = isBook ? "Eliminar Libro" : "Eliminar Progreso";
        const message = isBook 
            ? `¿Estás seguro de que deseas eliminar "${deleteTarget.title}"? Esta acción eliminará el libro y todo su progreso de lectura.`
            : `¿Estás seguro de que deseas eliminar tu progreso de lectura para "${deleteTarget.title}"? El libro se mantendrá en la biblioteca.`;

        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 z-50">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 max-w-md w-full border border-white/20 shadow-2xl">
                    <h3 className="text-xl sm:text-2xl font-black text-white mb-3 sm:mb-4" style={{ fontFamily: 'Inter Black, sans-serif' }}>
                        {title}
                    </h3>
                    
                    <p className="text-white/80 mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed">
                        {message}
                    </p>

                    <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-3 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 text-xs sm:text-sm">
                        ⚠️ Esta acción no se puede deshacer.
                    </div>

                    <div className="flex space-x-2 sm:space-x-4">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="flex-1 py-2 sm:py-3 px-3 sm:px-6 bg-white/10 backdrop-blur-lg border border-white/20 text-white rounded-xl sm:rounded-2xl font-medium transition-all duration-300 hover:bg-white/20 hover:scale-105 text-sm sm:text-base"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="flex-1 py-2 sm:py-3 px-3 sm:px-6 bg-red-500/50 hover:from-red-600 hover:to-pink-700 text-white rounded-xl sm:rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Componente de tarjeta de libro - ADAPTADO PARA MÓVIL
    const BookCard = ({ book }) => {
        const bookProgress = progress.find(p => p.bookId._id === book._id);
        const percentage = bookProgress ? bookProgress.percentage : 0;
        const [showActions, setShowActions] = useState(false);

        return (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-300 group">
                <div className="mb-4 sm:mb-6">
                    <div className="flex items-start justify-between mb-2">
                        <h3 className="text-base sm:text-lg font-black text-white group-hover:text-blue-200 transition-colors line-clamp-2 flex-1" style={{ fontFamily: 'Inter Black, sans-serif' }}>
                            {book.title}
                        </h3>
                        {/* Indicador de libro de Google Books */}
                        {book.googleId && (
                            <div className="ml-2 flex-shrink-0">
                                <div className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                                    <Globe className="h-3 w-3" />
                                    <span className="hidden sm:inline">Google</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <p className="text-white/80 mb-1 text-sm sm:text-base">
                        por {book.author}
                    </p>
                    <p className="text-xs sm:text-sm text-white/60">
                        {book.totalPages} páginas{book.genre && ` • ${book.genre}`}
                    </p>
                </div>

                {book.description && (
                    <p className="text-xs sm:text-sm text-white/70 mb-4 sm:mb-6 line-clamp-3">
                        {book.description}
                    </p>
                )}

                <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-white/70">Progreso</span>
                        <span className="text-xs sm:text-sm text-white font-medium">{percentage}%</span>
                    </div>

                    <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-600 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="number"
                            placeholder="Página actual"
                            min="0"
                            max={book.totalPages}
                            defaultValue={bookProgress?.currentPage || 0}
                            onBlur={(e) => updateProgress(book._id, e.target.value)}
                            className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl text-white placeholder-white/50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                        />
                        <span className="text-xs sm:text-sm text-white/70">/ {book.totalPages}</span>
                    </div>
                </div>

                {/* Botones de acción - ADAPTADOS PARA MÓVIL */}
                <div className="mt-4 sm:mt-6">
                    {/* Mobile: Botón para mostrar/ocultar acciones */}
                    <div className="sm:hidden">
                        <button
                            onClick={() => setShowActions(!showActions)}
                            className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2"
                        >
                            <Menu className="h-4 w-4" />
                            <span>{showActions ? 'Ocultar acciones' : 'Mostrar acciones'}</span>
                        </button>
                        
                        {showActions && (
                            <div className="grid grid-cols-1 gap-2 mt-3">
                                <button
                                    onClick={() => setEditingBook(book)}
                                    className="w-full bg-purple-700 hover:to-purple-500 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 text-sm flex items-center justify-center space-x-2"
                                >
                                    <Edit size={14} />
                                    <span>Editar libro</span>
                                </button>
                                
                                <button
                                    onClick={() => handleDeleteProgress(bookProgress?._id, book.title)}
                                    disabled={!bookProgress}
                                    className={`w-full font-medium py-2 px-4 rounded-lg transition-all duration-300 text-sm flex items-center justify-center space-x-2 ${
                                        bookProgress 
                                            ? 'bg-blue-500/60 text-white' 
                                            : 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
                                    }`}
                                >
                                    <RotateCcw size={14} />
                                    <span>Reiniciar progreso</span>
                                </button>

                                <button
                                    onClick={() => handleDeleteBook(book._id, book.title)}
                                    className="w-full bg-red-600 hover:bg-red-500 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 text-sm flex items-center justify-center space-x-2"
                                >
                                    <Trash2 size={14} />
                                    <span>Eliminar libro</span>
                                </button>

                                {/* Botón de lectura para libros de Google Books - MÓVIL */}
                                {book.googleId && (
                                    <ReadButton book={book} isMobile={true} size={14} />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Desktop: Botones horizontales con hover */}
                    <div className="hidden sm:flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                            onClick={() => setEditingBook(book)}
                            className="flex-1 bg-blue-600 hover:bg-blue-400 cursor-pointer text-white font-bold py-2 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md text-sm flex items-center justify-center space-x-1"
                        >
                            <Edit size={14} />
                            <span>Editar</span>
                        </button>
                        
                        <button
                            onClick={() => handleDeleteProgress(bookProgress?._id, book.title)}
                            disabled={!bookProgress}
                            className={`flex-1 font-bold py-2 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md text-sm flex items-center justify-center cursor-pointer space-x-1 ${
                                bookProgress 
                                    ? 'bg-yellow-600 hover:from-yellow-600 hover:to-orange-700 text-white' 
                                    : 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
                            }`}
                            title="Eliminar solo el progreso, mantener el libro"
                        >
                            <RotateCcw size={14} />
                            <span>Reset</span>
                        </button>

                        <button
                            onClick={() => handleDeleteBook(book._id, book.title)}
                            className="flex-1 bg-red-400/60 hover:bg-red-600 cursor-pointer text-white font-bold py-2 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md text-sm flex items-center justify-center space-x-1"
                        >
                            <Trash2 size={14} />
                            <span>Eliminar</span>
                        </button>

                        {/* Botón de lectura para libros de Google Books */}
                        {book.googleId && (
                            <button
                                onClick={() => {
                                    // Obtener el link de vista previa desde Google Books API
                                    const previewUrl = `https://books.google.com/books?id=${book.googleId}&printsec=frontcover&source=gbs_ge_summary_r&cad=0#v=onepage&q&f=false`;
                                    window.open(previewUrl, '_blank', 'noopener,noreferrer');
                                }}
                                className="bg-green-700 hover:bg-green-500 cursor-pointer text-white font-bold py-2 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md text-sm flex items-center justify-center space-x-1"
                                title="Leer vista previa en Google Books"
                            >
                                <BookOpen size={14} />
                                <span>Leer</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Modal de acciones móviles para agregar libros
    const MobileActionsModal = () => {
        if (!showMobileActions) return null;

        return (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-lg flex items-end justify-center p-4 z-40 sm:hidden">
                <div className="bg-white/10 backdrop-blur-xl rounded-t-3xl w-full border border-white/20 shadow-2xl">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Agregar Libro</h3>
                            <button
                                onClick={() => setShowMobileActions(false)}
                                className="text-white/70 hover:text-white"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={() => {
                                    setShowGoogleSearch(true);
                                    setShowMobileActions(false);
                                }}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3"
                            >
                                <Globe className="h-6 w-6" />
                                <span>Buscar en Google Books</span>
                            </button>
                            
                            <button
                                onClick={() => {
                                    setShowAddBook(true);
                                    setShowMobileActions(false);
                                }}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3"
                            >
                                <Plus className="h-6 w-6" />
                                <span>Agregar Manualmente</span>
                            </button>
                        </div>

                        <p className="text-white/60 text-sm mt-4 text-center">
                            Busca en millones de libros con Google o agrega tu libro manualmente
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 sm:space-y-12">
            <div className="bg-gray-200/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-white/20 shadow-2xl">
                {/* Header - ADAPTADO PARA MÓVIL */}
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl font-black text-white" style={{ fontFamily: 'Inter Black, sans-serif' }}>
                        Mi Biblioteca
                    </h2>

                    {/* Desktop: Botones horizontales */}
                    <div className="hidden sm:flex space-x-3">
                        <button
                            onClick={() => setShowGoogleSearch(true)}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2 cursor-pointer"
                        >
                            <Globe className="h-5 w-5" />
                            <span>Buscar en Google</span>
                        </button>
                        
                        <button
                            onClick={() => setShowAddBook(true)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2 cursor-pointer"
                        >
                            <Plus className="h-5 w-5" />
                            <span>Agregar Manual</span>
                        </button>
                    </div>

                    {/* Mobile: Botón FAB estilo */}
                    <button
                        onClick={() => setShowMobileActions(true)}
                        className="sm:hidden bg-green-500/60 hover:from-emerald-500 hover:to-blue-500 text-white p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 active:scale-95"
                    >
                        <Plus className="h-6 w-6" />
                    </button>
                </div>

                {/* Buscador - ADAPTADO PARA CELULAR */}
                <div className="mb-6 sm:mb-8">
                    <div className="relative">
                        <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-white/50" />
                        <input
                            type="text"
                            placeholder="Buscar libros..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent text-sm sm:text-base"
                        />
                    </div>
                </div>

                {/* Grid de libros - RESPONSIVE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                    {filteredBooks.map((book) => (
                        <BookCard key={book._id} book={book} />
                    ))}
                </div>

                {/* Estado vacío - ADAPTADO PARA MÓVIL */}
                {filteredBooks.length === 0 && (
                    <div className="text-center py-12 sm:py-16">
                        <div className="bg-gray-200/20 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg inline-block mb-4 sm:mb-6">
                            <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
                        </div>
                        <p className="text-white/60 text-base sm:text-lg mb-4 px-4">
                            {searchTerm ? 'No se encontraron libros que coincidan con tu búsqueda.' : 'No hay libros en tu biblioteca aún.'}
                        </p>
                        {!searchTerm && (
                            <>
                                {/* Desktop: Botones horizontales */}
                                <div className="hidden sm:flex justify-center space-x-4">
                                    <button
                                        onClick={() => setShowGoogleSearch(true)}
                                        className="bg-blue-600/90 hover:bg-blue-600 cursor-pointer text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
                                    >
                                        <Globe className="h-5 w-5" />
                                        <span>Buscar en Google Books</span>
                                    </button>
                                    
                                    <button
                                        onClick={() => setShowAddBook(true)}
                                        className="bg-emerald-600/90 hover:bg-emerald-600 cursor-pointer text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
                                    >
                                        <Plus className="h-5 w-5" />
                                        <span>Agregar manualmente</span>
                                    </button>
                                </div>

                                {/* Mobile: Botones verticales */}
                                <div className="sm:hidden space-y-3 px-4">
                                    <button
                                        onClick={() => setShowGoogleSearch(true)}
                                        className="w-full bg-blue-600/90 hover:bg-blue-600 cursor-pointer text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-3"
                                    >
                                        <Globe className="h-5 w-5" />
                                        <span>Buscar en Google Books</span>
                                    </button>
                                    
                                    <button
                                        onClick={() => setShowAddBook(true)}
                                        className="w-full bg-emerald-600/90 hover:bg-emerald-600 cursor-pointer text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-3"
                                    >
                                        <Plus className="h-5 w-5" />
                                        <span>Agregar manualmente</span>
                                    </button>
                                    
                                    <p className="text-white/50 text-sm mt-4">
                                        Encuentra millones de libros con Google o agrega uno personalizado
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* MODALES */}
            {showAddBook && (
                <BookForm
                    book={newBook}
                    onSubmit={handleAddBook}
                    onCancel={() => {
                        setShowAddBook(false);
                        setErrors({});
                        setNewBook({
                            title: '',
                            author: '',
                            totalPages: '',
                            genre: '',
                            isbn: '',
                            description: ''
                        });
                    }}
                    title="Agregar Nuevo Libro"
                    isEditing={false}
                />
            )}

            {editingBook && (
                <BookForm
                    book={editingBook}
                    onSubmit={handleEditBook}
                    onCancel={() => {
                        setEditingBook(null);
                        setErrors({});
                    }}
                    title="Editar Libro"
                    isEditing={true}
                />
            )}

            {/* Google Books Search Modal */}
            <GoogleBooksSearch
                isOpen={showGoogleSearch}
                onClose={() => setShowGoogleSearch(false)}
                onAddBook={handleBookAddedFromGoogle}
            />

            {/* Mobile Actions Modal */}
            <MobileActionsModal />

            {/* Delete Confirmation Modal */}
            <ConfirmDeleteModal />
        </div>
    );
};

export default Books;