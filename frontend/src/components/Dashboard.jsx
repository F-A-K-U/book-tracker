import React from 'react';
import { BookOpen, Star, TrendingUp } from 'lucide-react';

const Dashboard = ({ stats, progress }) => {
    return (
        <div className="space-y-12">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-gradient-to-br from-blue-300/20 to-blue-500/20 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <BookOpen className="h-12 w-12 text-blue-300" />
                        <div className="text-right">
                            <div className="text-3xl font-black text-white" style={{ fontFamily: 'Inter Black, sans-serif' }}>
                                {stats.totalBooks || 0}
                            </div>
                            <div className="text-blue-200" >
                                Libros Total
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-300/20 to-emerald-500/20 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <Star className="h-12 w-12 text-emerald-300" />
                        <div className="text-right">
                            <div className="text-3xl font-black text-white" style={{ fontFamily: 'Inter Black, sans-serif' }}>
                                {stats.completedBooks || 0}
                            </div>
                            <div className="text-emerald-200" >
                                Completados
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900/20 to-pink-500/20 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <TrendingUp className="h-12 w-12 text-purple-300" />
                        <div className="text-right">
                            <div className="text-3xl font-black text-white" style={{ fontFamily: 'Inter Black, sans-serif' }}>
                                {stats.completionRate || 0}%
                            </div>
                            <div className="text-purple-200" >
                                Tasa Completado
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Progress */}
            <div className="bg-gray-200/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                <h2 className="text-2xl font-black text-white mb-8" style={{ fontFamily: 'Inter Black, sans-serif' }}>
                    Progreso Reciente
                </h2>

                <div className="space-y-6">
                    {progress.slice(0, 5).map((item) => (
                        <div key={item._id} className="flex items-center justify-between p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10">
                            <div className="flex-1">
                                <h3 className="text-lg font-medium text-white" >
                                    {item.bookId.title}
                                </h3>
                                <p className="text-white/70" >
                                    por {item.bookId.author}
                                </p>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="text-right">
                                    <div className="text-white font-medium" >
                                        {item.currentPage}/{item.bookId.totalPages}
                                    </div>
                                    <div className="text-sm text-white/70" >
                                        {item.percentage}% completado
                                    </div>
                                </div>

                                <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full transition-all duration-300"
                                        style={{ width: `${item.percentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    {progress.length === 0 && (
                        <div className="text-center py-12">
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

export default Dashboard;