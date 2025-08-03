import React, { useState, useEffect } from 'react';
import { Book, User, BarChart3, LogOut, BookOpen, Star, TrendingUp, Menu, X } from 'lucide-react';
import Books from './components/Book';
import Progress from './components/Progress';
import Dashboard from './components/Dashboard';

const App = () => {
    const [user, setUser] = useState(null);
    const [books, setBooks] = useState([]);
    const [progress, setProgress] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState('dashboard');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    useEffect(() => {
        if (user) {
            loadUserData();
        }
    }, [user]);

    const checkAuthStatus = async () => {
        try {
            const response = await fetch('/auth/user', {
                credentials: 'include'
            });
            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUserData = async () => {
        try {
            const [booksRes, progressRes, statsRes] = await Promise.all([
                fetch('/api/books', { credentials: 'include' }),
                fetch('/api/progress', { credentials: 'include' }),
                fetch('/api/stats', { credentials: 'include' })
            ]);

            if (booksRes.ok) {
                const booksData = await booksRes.json();
                setBooks(booksData.books || []);
            }

            if (progressRes.ok) {
                const progressData = await progressRes.json();
                setProgress(progressData || []);
            }

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData || {});
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    const handleLogin = () => {
        window.location.href = '/auth/google';
    };

    const handleLogout = async () => {
        try {
            await fetch('/auth/logout', { credentials: 'include' });
            setUser(null);
            setBooks([]);
            setProgress([]);
            setStats({});
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

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

    const handleViewChange = (view) => {
        setCurrentView(view);
        setMobileMenuOpen(false); // Cerrar menú móvil al seleccionar
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
                    <div className="text-white text-xl">Cargando...</div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center p-6">
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 text-center max-w-md w-full border border-white/20 shadow-2xl">
                    <div className="mb-8">
                        <div className="bg-gray-200/20 p-4 rounded-2xl shadow-lg inline-block mb-4">
                            <Book className="h-16 w-16 text-white" />
                        </div>
                        <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Inter Black, sans-serif' }}>
                            BookTracker
                        </h1>
                        <p className="text-white/80 text-lg">
                            Organiza y rastrea tu progreso de lectura
                        </p>
                    </div>

                    <button
                        onClick={handleLogin}
                        className="bg-emerald-600/80 hover:bg-emerald-600 text-white font-bold cursor-pointer py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                        Iniciar sesión con Google
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 p-3 sm:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-6 sm:mb-12">
                    <div className="bg-gray-200/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-white/20 shadow-2xl">
                        {/* Desktop Header */}
                        <div className="hidden lg:flex items-center justify-between">
                            <div className="flex items-center space-x-6">
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-16 h-16 rounded-full ring-4 ring-white/20"
                                />
                                <div>
                                    <h1 className="text-3xl font-black text-white" style={{ fontFamily: 'Inter Black, sans-serif' }}>
                                        Hola, {user.name.split(' ')[0]}
                                    </h1>
                                    <p className="text-white/80">
                                        Bienvenido a tu biblioteca personal
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <nav className="flex space-x-2">
                                    {['dashboard', 'books', 'progress'].map((view) => (
                                        <button
                                            key={view}
                                            onClick={() => setCurrentView(view)}
                                            className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 cursor-pointer ${
                                                currentView === view
                                                    ? 'bg-white/20 text-white shadow-lg'
                                                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                                            }`}
                                        >
                                            {view === 'dashboard' && 'Panel'}
                                            {view === 'books' && 'Libros'}
                                            {view === 'progress' && 'Progreso'}
                                        </button>
                                    ))}
                                </nav>

                                <button
                                    onClick={handleLogout}
                                    className="p-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 transition-all duration-300"
                                >
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Mobile Header */}
                        <div className="lg:hidden">
                            {/* Top Bar */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full ring-2 ring-white/20"
                                    />
                                    <div>
                                        <h1 className="text-lg sm:text-xl font-black text-white" style={{ fontFamily: 'Inter Black, sans-serif' }}>
                                            Hola, {user.name.split(' ')[0]}
                                        </h1>
                                        <p className="text-white/80 text-sm hidden sm:block">
                                            Tu biblioteca personal
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 transition-all duration-300"
                                    >
                                        <LogOut className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Navigation Bar (Alternative - Bottom Tab Style) */}
                        <div className="lg:hidden mt-4 sm:hidden">
                            <nav className="flex justify-around bg-white/5 rounded-xl p-2">
                                {[
                                    { key: 'dashboard', label: 'Panel', icon: BarChart3 },
                                    { key: 'books', label: 'Libros', icon: BookOpen },
                                    { key: 'progress', label: 'Progreso', icon: TrendingUp }
                                ].map(({ key, label, icon: Icon }) => (
                                    <button
                                        key={key}
                                        onClick={() => setCurrentView(key)}
                                        className={`flex flex-col items-center space-y-1 p-2 rounded-lg font-medium transition-all duration-300 cursor-pointer min-w-0 flex-1 ${
                                            currentView === key
                                                ? 'bg-white/20 text-white shadow-lg'
                                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span className="text-xs">{label}</span>
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>
                </header>

                {/* Dashboard */}
                {currentView === 'dashboard' && (
                    <Dashboard stats={stats} progress={progress} />
                )}

                {/* Books View */}
                {currentView === 'books' && (
                    <Books 
                        books={books}
                        setBooks={setBooks}
                        progress={progress}
                        setProgress={setProgress}
                        loadUserData={loadUserData}
                    />
                )}

                {/* Progress View */}
                {currentView === 'progress' && (
                    <Progress 
                        progress={progress}
                        setProgress={setProgress}
                        books={books}
                    />
                )}
            </div>
        </div>
    );
};

export default App;