import React, { useState, useEffect } from 'react';
import { Search, Book, Plus, Star, Calendar, User, Globe, X, Loader2, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

const GoogleBooksSearch = ({ onAddBook, onClose, isOpen }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [totalItems, setTotalItems] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedBook, setSelectedBook] = useState(null);
    const [addingBook, setAddingBook] = useState(null);
    
    const resultsPerPage = 10;

    // Función para buscar libros
    const searchBooks = async (query, page = 1) => {
        if (!query.trim()) {
            setError('Por favor ingresa un término de búsqueda');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            const startIndex = (page - 1) * resultsPerPage;
            const response = await fetch(
                `/api/books/search-google?query=${encodeURIComponent(query)}&maxResults=${resultsPerPage}&startIndex=${startIndex}`,
                {
                    credentials: 'include'
                }
            );

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            setSearchResults(data.books || []);
            setTotalItems(data.totalItems || 0);
            setCurrentPage(page);

            if (data.books.length === 0) {
                setError('No se encontraron libros para esta búsqueda');
            }

        } catch (error) {
            console.error('Error buscando libros:', error);
            setError('Error al buscar libros. Inténtalo nuevamente.');
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    // Manejar submit del formulario de búsqueda
    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        searchBooks(searchQuery, 1);
    };

    // Agregar libro a la biblioteca personal
    const handleAddToLibrary = async (book) => {
        setAddingBook(book.googleId);
        
        try {
            const response = await fetch('/api/books/add-from-google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ googleBookData: book })
            });

            if (!response.ok) {
                throw new Error('Error al agregar el libro');
            }

            const savedBook = await response.json();
            
            // Llamar a la función del componente padre para actualizar la lista
            if (onAddBook) {
                onAddBook(savedBook);
            }

            // Mostrar mensaje de éxito
            alert(`"${book.title}" agregado a tu biblioteca exitosamente!`);

        } catch (error) {
            console.error('Error agregando libro:', error);
            alert('Error al agregar el libro a tu biblioteca');
        } finally {
            setAddingBook(null);
        }
    };

    // Cambiar página
    const changePage = (newPage) => {
        if (newPage >= 1 && newPage <= Math.ceil(totalItems / resultsPerPage)) {
            searchBooks(searchQuery, newPage);
        }
    };

    // Componente de tarjeta de libro - ADAPTADO PARA MÓVIL
    const BookCard = ({ book }) => (
        <div className="bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20 hover:border-white/30 transition-all duration-300">
            <div className="flex space-x-3 sm:space-x-4">
                {/* Thumbnail */}
                <div className="flex-shrink-0">
                    {book.thumbnail ? (
                        <img
                            src={book.thumbnail}
                            alt={book.title}
                            className="w-12 h-16 sm:w-16 sm:h-24 object-cover rounded-lg shadow-md"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                    ) : (
                        <div className="w-12 h-16 sm:w-16 sm:h-24 bg-gray-600/50 rounded-lg flex items-center justify-center">
                            <Book className="h-4 w-4 sm:h-6 sm:w-6 text-gray-300" />
                        </div>
                    )}
                </div>

                {/* Información del libro */}
                <div className="flex-1 min-w-0">
                    <h3 
                        className="text-white font-semibold mb-1 line-clamp-2 cursor-pointer hover:text-blue-200 transition-colors text-sm sm:text-base"
                        onClick={() => setSelectedBook(book)}
                    >
                        {book.title}
                    </h3>
                    
                    <div className="flex items-center text-white/70 text-xs sm:text-sm mb-2">
                        <User className="h-3 w-3 mr-1" />
                        <span className="truncate">{book.author}</span>
                    </div>

                    <div className="flex flex-wrap gap-1 sm:gap-2 text-xs text-white/60 mb-2 sm:mb-3">
                        {book.totalPages > 0 && (
                            <span className="flex items-center">
                                <Book className="h-3 w-3 mr-1" />
                                {book.totalPages} páginas
                            </span>
                        )}
                        
                        {book.publishedDate && (
                            <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(book.publishedDate).getFullYear()}
                            </span>
                        )}

                        {book.averageRating > 0 && (
                            <span className="flex items-center">
                                <Star className="h-3 w-3 mr-1 text-yellow-400" />
                                {book.averageRating}
                            </span>
                        )}
                    </div>

                    {book.description && (
                        <p className="text-white/60 text-xs sm:text-sm line-clamp-2 mb-2 sm:mb-3">
                            {book.description.replace(/<[^>]*>/g, '')}
                        </p>
                    )}

                    {/* Botones - ADAPTADOS PARA MÓVIL */}
                    <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                        <button
                            onClick={() => setSelectedBook(book)}
                            className="flex-1 py-1.5 px-2 sm:px-3 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 rounded-lg text-xs sm:text-sm transition-colors flex items-center justify-center"
                        >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver detalles
                        </button>
                        
                        <button
                            onClick={() => handleAddToLibrary(book)}
                            disabled={addingBook === book.googleId}
                            className="flex-1 py-1.5 px-2 sm:px-3 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 rounded-lg text-xs sm:text-sm transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                            {addingBook === book.googleId ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <>
                                    <Plus className="h-3 w-3 mr-1" />
                                    Agregar
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // Modal de detalles del libro - ADAPTADO PARA MÓVIL
    const BookDetailsModal = ({ book, onClose }) => {
        if (!book) return null;

        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-lg sm:text-xl font-bold text-white pr-4 line-clamp-2">{book.title}</h2>
                        <button
                            onClick={onClose}
                            className="text-white/70 hover:text-white transition-colors flex-shrink-0"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 mb-6">
                        {book.thumbnail && (
                            <div className="flex justify-center sm:justify-start">
                                <img
                                    src={book.mediumThumbnail || book.thumbnail}
                                    alt={book.title}
                                    className="w-24 h-36 sm:w-32 sm:h-48 object-cover rounded-lg shadow-lg"
                                />
                            </div>
                        )}
                        
                        <div className="flex-1 space-y-2 sm:space-y-3">
                            <div>
                                <span className="text-white/70 text-xs sm:text-sm">Autor(es):</span>
                                <p className="text-white text-sm sm:text-base">{book.author}</p>
                            </div>
                            
                            {book.publisher && (
                                <div>
                                    <span className="text-white/70 text-xs sm:text-sm">Editorial:</span>
                                    <p className="text-white text-sm sm:text-base">{book.publisher}</p>
                                </div>
                            )}
                            
                            {book.publishedDate && (
                                <div>
                                    <span className="text-white/70 text-xs sm:text-sm">Fecha de publicación:</span>
                                    <p className="text-white text-sm sm:text-base">{book.publishedDate}</p>
                                </div>
                            )}
                            
                            {book.totalPages > 0 && (
                                <div>
                                    <span className="text-white/70 text-xs sm:text-sm">Páginas:</span>
                                    <p className="text-white text-sm sm:text-base">{book.totalPages}</p>
                                </div>
                            )}
                            
                            {book.isbn && (
                                <div>
                                    <span className="text-white/70 text-xs sm:text-sm">ISBN:</span>
                                    <p className="text-white text-sm sm:text-base">{book.isbn}</p>
                                </div>
                            )}
                            
                            {book.genre && (
                                <div>
                                    <span className="text-white/70 text-xs sm:text-sm">Género:</span>
                                    <p className="text-white text-sm sm:text-base">{book.genre}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {book.description && (
                        <div className="mb-4 sm:mb-6">
                            <h3 className="text-white font-semibold mb-2 text-sm sm:text-base">Descripción:</h3>
                            <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
                                {book.description.replace(/<[^>]*>/g, '')}
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                        <button
                            onClick={() => handleAddToLibrary(book)}
                            disabled={addingBook === book.googleId}
                            className="flex-1 py-2 sm:py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center text-sm sm:text-base"
                        >
                            {addingBook === book.googleId ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Plus className="h-4 w-4 mr-2" />
                            )}
                            Agregar a mi biblioteca
                        </button>
                        
                        {book.previewLink && (
                            <a
                                href={book.previewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-2 sm:py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors text-center flex items-center justify-center text-sm sm:text-base"
                            >
                                <Globe className="h-4 w-4 mr-2" />
                                Vista previa
                            </a>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-lg flex items-center justify-center p-2 sm:p-4 z-40">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] border border-white/20 shadow-2xl flex flex-col">
                {/* Header - ADAPTADO PARA MÓVIL */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/20 flex-shrink-0">
                    <h2 className="text-lg sm:text-2xl font-bold text-white">Buscar en Google Books</h2>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                </div>

                {/* Buscador - ADAPTADO PARA MÓVIL */}
                <div className="p-4 sm:p-6 border-b border-white/20 flex-shrink-0">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-white/50" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar por título, autor, ISBN..."
                                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-lg sm:rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-sm sm:text-base"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg sm:rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center text-sm sm:text-base"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                            ) : (
                                <>
                                    <Search className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                    <span className="hidden sm:inline">Buscar</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Contenido - SCROLLABLE */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {error && (
                        <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-3 sm:p-4 rounded-xl mb-4 text-sm sm:text-base">
                            {error}
                        </div>
                    )}

                    {searchResults.length > 0 && (
                        <>
                            <div className="mb-4 text-white/70 text-xs sm:text-sm">
                                Mostrando {searchResults.length} de {totalItems} resultados
                            </div>

                            <div className="space-y-3 sm:space-y-4 mb-6">
                                {searchResults.map((book) => (
                                    <BookCard key={book.googleId} book={book} />
                                ))}
                            </div>

                            {/* Paginación - ADAPTADA PARA MÓVIL */}
                            {totalItems > resultsPerPage && (
                                <div className="flex items-center justify-center space-x-2 sm:space-x-4 pb-4">
                                    <button
                                        onClick={() => changePage(currentPage - 1)}
                                        disabled={currentPage === 1 || loading}
                                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    
                                    <span className="text-white/70 text-xs sm:text-sm px-2 sm:px-3">
                                        {currentPage} de {Math.ceil(totalItems / resultsPerPage)}
                                    </span>
                                    
                                    <button
                                        onClick={() => changePage(currentPage + 1)}
                                        disabled={currentPage === Math.ceil(totalItems / resultsPerPage) || loading}
                                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {!loading && !error && searchResults.length === 0 && searchQuery && (
                        <div className="text-center py-8 sm:py-12">
                            <Book className="h-12 w-12 sm:h-16 sm:w-16 text-white/30 mx-auto mb-4" />
                            <p className="text-white/60 text-sm sm:text-base">No se encontraron libros para tu búsqueda</p>
                        </div>
                    )}

                    {!searchQuery && (
                        <div className="text-center py-8 sm:py-12">
                            <Search className="h-12 w-12 sm:h-16 sm:w-16 text-white/30 mx-auto mb-4" />
                            <p className="text-white/60 text-sm sm:text-base">Ingresa un término de búsqueda para comenzar</p>
                        </div>
                    )}
                </div>

                {/* Modal de detalles */}
                <BookDetailsModal 
                    book={selectedBook} 
                    onClose={() => setSelectedBook(null)} 
                />
            </div>
        </div>
    );
};

export default GoogleBooksSearch;