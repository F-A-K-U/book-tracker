import React from 'react';
import { BookOpen } from 'lucide-react';

const Progress = ({ progress, setProgress, books }) => {

    // Actualizar progreso desde la vista de progreso
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

    return (
        <div className="space-y-12">
            <div className="bg-gray-200/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                <h2 className="text-2xl font-black text-white mb-8" style={{ fontFamily: 'Inter Black, sans-serif' }}>
                    Progreso Detallado
                </h2>

                <div className="space-y-8">
                    {progress.map((item) => (
                        <div key={item._id} className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-lg">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex-1">
                                    <h3 className="text-xl font-black text-white mb-1" style={{ fontFamily: 'Inter Black, sans-serif' }}>
                                        {item.bookId.title}
                                    </h3>
                                    <p className="text-white/80 mb-2" >
                                        por {item.bookId.author}
                                    </p>
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                        item.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                                            item.status === 'reading' ? 'bg-blue-500/20 text-blue-300' :
                                                item.status === 'paused' ? 'bg-yellow-500/20 text-yellow-300' :
                                                    'bg-purple-500/20 text-purple-300'
                                    }`} >
                                        {item.status === 'completed' ? 'Completado' :
                                            item.status === 'reading' ? 'Leyendo' :
                                                item.status === 'paused' ? 'Pausado' : 'Lista de deseos'}
                                    </span>
                                </div>

                                <div className="text-right">
                                    <div className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Inter Black, sans-serif' }}>
                                        {item.percentage}%
                                    </div>
                                    <div className="text-white/70 text-sm" >
                                        {item.currentPage} / {item.bookId.totalPages} páginas
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            item.status === 'completed' ? 'bg-gradient-to-r from-emerald-500 to-blue-600' :
                                                item.status === 'reading' ? 'bg-green-500' :
                                                    item.status === 'paused' ? 'bg-yellow-600' :
                                                        'bg-green-600'
                                        }`}
                                        style={{ width: `${item.percentage}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <input
                                    type="number"
                                    placeholder="Página actual"
                                    min="0"
                                    max={item.bookId.totalPages}
                                    defaultValue={item.currentPage}
                                    onBlur={(e) => updateProgress(item.bookId._id, e.target.value)}
                                    className="flex-1 px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400/50"
                                    
                                />

                                {item.startedAt && (
                                    <div className="text-sm text-white/70" >
                                        Iniciado: {new Date(item.startedAt).toLocaleDateString()}
                                    </div>
                                )}
                            </div>

                            {item.notes && (
                                <div className="mt-6 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                                    <p className="text-white/80 text-sm" >
                                        {item.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}

                    {progress.length === 0 && (
                        <div className="text-center py-16">
                            <div className="bg-gray-200/20 p-4 rounded-2xl shadow-lg inline-block mb-6">
                                <BookOpen className="h-16 w-16 text-white" />
                            </div>
                            <p className="text-white/60 text-lg mb-2" >
                                No tienes progreso registrado aún.
                            </p>
                            <p className="text-white/40 text-sm" >
                                Agrega algunos libros y comienza a leer para ver tu progreso aquí.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Progress;