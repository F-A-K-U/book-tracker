// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const MongoStore = require('connect-mongo');
const axios = require('axios'); // Para Google Books API
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/booktracker'
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/booktracker', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Schemas (mantén los que ya tienes)
const UserSchema = new mongoose.Schema({
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    avatar: { type: String },
    createdAt: { type: Date, default: Date.now },
    isAdmin: { type: Boolean, default: false }
});

const BookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String },
    genre: { type: String },
    totalPages: { type: Number, required: true },
    coverImage: { type: String },
    thumbnail: { type: String }, // Para imágenes de Google Books
    isbn: { type: String },
    publishedDate: { type: String }, // Cambiado a String para Google Books
    publisher: { type: String }, // Agregado para Google Books
    googleId: { type: String }, // ID de Google Books
    previewLink: { type: String }, // Link de vista previa de Google Books
    rating: { type: Number, min: 0, max: 5 },
    createdAt: { type: Date, default: Date.now },
});

const ReadingProgressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    currentPage: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['reading', 'completed', 'paused', 'wishlist'],
        default: 'reading'
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    notes: { type: String },
    rating: { type: Number, min: 0, max: 5 },
    updatedAt: { type: Date, default: Date.now }
});

ReadingProgressSchema.index({ userId: 1, bookId: 1 }, { unique: true });

const User = mongoose.model('User', UserSchema);
const Book = mongoose.model('Book', BookSchema);
const ReadingProgress = mongoose.model('ReadingProgress', ReadingProgressSchema);

// Configuración OAuth Google (mantén tu configuración)
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
            user = new User({
                googleId: profile.id,
                email: profile.emails[0].value,
                name: profile.displayName,
                avatar: profile.photos[0].value
            });
            await user.save();
        }

        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Middleware de autenticación
const requireAuth = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'No autorizado' });
};

// Función auxiliar para extraer ISBN
function extractISBN(identifiers) {
    if (!identifiers || identifiers.length === 0) return '';
    
    const isbn13 = identifiers.find(id => id.type === 'ISBN_13');
    if (isbn13) return isbn13.identifier;
    
    const isbn10 = identifiers.find(id => id.type === 'ISBN_10');
    if (isbn10) return isbn10.identifier;
    
    return identifiers[0]?.identifier || '';
}

// RUTAS DE AUTENTICACIÓN (mantén las que ya tienes)
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
    }
);

app.get('/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cerrar sesión' });
        }
        res.json({ message: 'Sesión cerrada exitosamente' });
    });
});

app.get('/auth/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.status(401).json({ error: 'No autenticado' });
    }
});

// RUTAS DE GOOGLE BOOKS API - NUEVAS/CORREGIDAS
app.get('/api/books/search-google', requireAuth, async (req, res) => {
    try {
        const { query, maxResults = 10, startIndex = 0 } = req.query;
        
        if (!query || query.trim().length === 0) {
            return res.status(400).json({ 
                error: 'El parámetro query es requerido' 
            });
        }

        // URL de la Google Books API
        const googleBooksUrl = 'https://www.googleapis.com/books/v1/volumes';
        
        // Parámetros para la búsqueda
        const params = {
            q: query.trim(),
            maxResults: Math.min(parseInt(maxResults), 40),
            startIndex: parseInt(startIndex),
            printType: 'books',
            orderBy: 'relevance'
        };

        // Si tienes una API Key de Google Books, agrégala aquí
        if (process.env.GOOGLE_BOOKS_API_KEY) {
            params.key = process.env.GOOGLE_BOOKS_API_KEY;
        }

        console.log('Buscando en Google Books:', params);

        // Hacer la petición a Google Books API
        const response = await axios.get(googleBooksUrl, { params });
        
        if (!response.data || !response.data.items) {
            return res.json({
                books: [],
                totalItems: 0,
                message: 'No se encontraron libros para esta búsqueda'
            });
        }

        // Formatear los datos
        const formattedBooks = response.data.items.map(book => {
            const volumeInfo = book.volumeInfo || {};
            const imageLinks = volumeInfo.imageLinks || {};
            
            return {
                googleId: book.id,
                title: volumeInfo.title || 'Título no disponible',
                authors: volumeInfo.authors || ['Autor desconocido'],
                author: (volumeInfo.authors || ['Autor desconocido']).join(', '),
                description: volumeInfo.description || '',
                pageCount: volumeInfo.pageCount || 0,
                totalPages: volumeInfo.pageCount || 0,
                categories: volumeInfo.categories || [],
                genre: (volumeInfo.categories || []).join(', '),
                publishedDate: volumeInfo.publishedDate || '',
                publisher: volumeInfo.publisher || '',
                language: volumeInfo.language || 'es',
                isbn: extractISBN(volumeInfo.industryIdentifiers || []),
                thumbnail: imageLinks.thumbnail || imageLinks.smallThumbnail || '',
                smallThumbnail: imageLinks.smallThumbnail || '',
                mediumThumbnail: imageLinks.medium || imageLinks.thumbnail || '',
                previewLink: volumeInfo.previewLink || '',
                infoLink: volumeInfo.infoLink || '',
                averageRating: volumeInfo.averageRating || 0,
                ratingsCount: volumeInfo.ratingsCount || 0,
                maturityRating: volumeInfo.maturityRating || 'NOT_MATURE'
            };
        });

        res.json({
            books: formattedBooks,
            totalItems: response.data.totalItems || 0,
            startIndex: parseInt(startIndex),
            maxResults: parseInt(maxResults),
            query: query
        });

    } catch (error) {
        console.error('Error en búsqueda de Google Books:', error);
        
        if (error.response) {
            return res.status(error.response.status).json({
                error: 'Error en la API de Google Books',
                details: error.response.data?.error?.message || 'Error desconocido'
            });
        } else if (error.request) {
            return res.status(503).json({
                error: 'Error de conexión con Google Books API'
            });
        } else {
            return res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    }
});

// Endpoint para agregar un libro desde Google Books
app.post('/api/books/add-from-google', requireAuth, async (req, res) => {
    try {
        const { googleBookData } = req.body;
        
        if (!googleBookData) {
            return res.status(400).json({ error: 'Datos del libro requeridos' });
        }

        // Verificar si el libro ya existe (por ISBN o googleId)
        let existingBook = null;
        if (googleBookData.isbn) {
            existingBook = await Book.findOne({ isbn: googleBookData.isbn });
        }
        if (!existingBook && googleBookData.googleId) {
            existingBook = await Book.findOne({ googleId: googleBookData.googleId });
        }

        let book;
        if (existingBook) {
            // Si el libro ya existe, usarlo
            book = existingBook;
            console.log('Libro ya existe en la base de datos:', book.title);
        } else {
            // Crear nuevo libro
            const bookToSave = {
                title: googleBookData.title || 'Título no disponible',
                author: googleBookData.author || 'Autor desconocido',
                totalPages: googleBookData.totalPages || 0,
                genre: googleBookData.genre || '',
                isbn: googleBookData.isbn || '',
                description: googleBookData.description || '',
                thumbnail: googleBookData.thumbnail || '',
                googleId: googleBookData.googleId || '',
                publishedDate: googleBookData.publishedDate || '',
                publisher: googleBookData.publisher || '',
                previewLink: googleBookData.previewLink || '' // Almacenar el link de vista previa
            };

            book = new Book(bookToSave);
            await book.save();
            console.log('Nuevo libro creado:', book.title);
        }

        // Verificar si ya existe progreso para este usuario y libro
        let existingProgress = await ReadingProgress.findOne({
            userId: req.user._id,
            bookId: book._id
        });

        if (existingProgress) {
            return res.status(400).json({ 
                error: 'Este libro ya está en tu biblioteca',
                book: book
            });
        }

        // Crear progreso de lectura para el usuario
        const progress = new ReadingProgress({
            userId: req.user._id,
            bookId: book._id,
            currentPage: 0,
            status: 'reading'
        });

        await progress.save();
        await progress.populate('bookId');

        // Retornar el libro con el progreso
        const responseBook = {
            ...book.toObject(),
            _id: book._id
        };

        res.status(201).json(responseBook);

    } catch (error) {
        console.error('Error al agregar libro desde Google:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({ error: 'El libro ya existe en la base de datos' });
        }
        
        res.status(500).json({ 
            error: 'Error al agregar el libro a tu biblioteca',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// RUTAS DE LIBROS (mantén tus rutas existentes, pero agrega esta corrección para obtener libros del usuario)
app.get('/api/books', requireAuth, async (req, res) => {
    try {
        // Obtener solo los libros que están en el progreso del usuario
        const userProgress = await ReadingProgress.find({ userId: req.user._id })
            .populate('bookId')
            .sort({ updatedAt: -1 });

        // Extraer solo los libros
        const books = userProgress.map(progress => progress.bookId).filter(book => book);

        res.json({
            books,
            total: books.length
        });
    } catch (error) {
        console.error('Error obteniendo libros:', error);
        res.status(500).json({ error: error.message });
    }
});

// MANTÉN TODAS TUS OTRAS RUTAS EXISTENTES
app.post('/api/books', requireAuth, async (req, res) => {
    try {
        const book = new Book(req.body);
        await book.save();

        // Crear progreso de lectura para el usuario
        const progress = new ReadingProgress({
            userId: req.user._id,
            bookId: book._id,
            currentPage: 0,
            status: 'reading'
        });

        await progress.save();
        
        res.status(201).json(book);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'El libro ya existe (ISBN duplicado)' });
        }
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/books/:id', requireAuth, async (req, res) => {
    try {
        const bookId = req.params.id;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({ error: 'ID de libro inválido' });
        }

        // Validaciones básicas
        if (updateData.title && updateData.title.trim().length < 2) {
            return res.status(400).json({ error: 'El título debe tener al menos 2 caracteres' });
        }

        if (updateData.author && updateData.author.trim().length < 2) {
            return res.status(400).json({ error: 'El autor debe tener al menos 2 caracteres' });
        }

        if (updateData.totalPages) {
            const pages = parseInt(updateData.totalPages);
            if (!pages || pages < 1 || pages > 10000) {
                return res.status(400).json({ error: 'El número de páginas debe estar entre 1 y 10,000' });
            }
            updateData.totalPages = pages;
        }

        // Sanitizar datos
        if (updateData.title) updateData.title = updateData.title.trim();
        if (updateData.author) updateData.author = updateData.author.trim();
        if (updateData.genre) updateData.genre = updateData.genre.trim();
        if (updateData.description) updateData.description = updateData.description.trim();

        const updatedBook = await Book.findByIdAndUpdate(
            bookId,
            { ...updateData, updatedAt: new Date() },
            { new: true, runValidators: true }
        );

        if (!updatedBook) {
            return res.status(404).json({ error: 'Libro no encontrado' });
        }

        res.json(updatedBook);

    } catch (error) {
        console.error('Error actualizando libro:', error);
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ error: validationErrors.join(', ') });
        }

        if (error.code === 11000) {
            return res.status(400).json({ error: 'El ISBN ya existe para otro libro' });
        }

        res.status(500).json({ error: 'Error interno del servidor al actualizar el libro' });
    }
});

app.delete('/api/books/:id', requireAuth, async (req, res) => {
    try {
        const bookId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({ error: 'ID de libro inválido' });
        }

        // Verificar que el usuario tenga progreso en este libro
        const userProgress = await ReadingProgress.findOne({
            userId: req.user._id,
            bookId: bookId
        });

        if (!userProgress) {
            return res.status(403).json({ error: 'No tienes permisos para eliminar este libro' });
        }

        // Eliminar progreso del usuario
        await ReadingProgress.deleteOne({ _id: userProgress._id });

        // Verificar si otros usuarios tienen progreso en este libro
        const otherProgress = await ReadingProgress.find({ bookId: bookId });

        // Si no hay otros usuarios con progreso, eliminar el libro
        if (otherProgress.length === 0) {
            await Book.findByIdAndDelete(bookId);
            console.log('Libro eliminado completamente de la base de datos');
        }

        res.json({ 
            message: 'Libro eliminado de tu biblioteca exitosamente',
            deletedBookId: bookId
        });

    } catch (error) {
        console.error('Error eliminando libro:', error);
        res.status(500).json({ error: 'Error interno del servidor al eliminar el libro' });
    }
});

app.delete('/api/progress/:id', requireAuth, async (req, res) => {
    try {
        const progressId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(progressId)) {
            return res.status(400).json({ error: 'ID de progreso inválido' });
        }

        const deletedProgress = await ReadingProgress.findOneAndDelete({
            _id: progressId,
            userId: req.user._id
        });

        if (!deletedProgress) {
            return res.status(404).json({ error: 'Progreso no encontrado o no tienes permisos para eliminarlo' });
        }

        res.json({ 
            message: 'Progreso eliminado exitosamente',
            deletedProgressId: progressId 
        });

    } catch (error) {
        console.error('Error eliminando progreso:', error);
        res.status(500).json({ error: 'Error interno del servidor al eliminar el progreso' });
    }
});

// RUTAS DE PROGRESO (mantén las que ya tienes)
app.get('/api/progress', requireAuth, async (req, res) => {
    try {
        const progress = await ReadingProgress.find({ userId: req.user._id })
            .populate('bookId')
            .sort({ updatedAt: -1 });

        const progressWithPercentage = progress.map(p => ({
            ...p.toObject(),
            percentage: p.bookId.totalPages > 0 ?
                Math.round((p.currentPage / p.bookId.totalPages) * 100) : 0
        }));

        res.json(progressWithPercentage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/progress', requireAuth, async (req, res) => {
    try {
        const { bookId, currentPage, status, notes, rating } = req.body;

        let progress = await ReadingProgress.findOne({
            userId: req.user._id,
            bookId: bookId
        });

        if (progress) {
            progress.currentPage = currentPage;
            progress.status = status || progress.status;
            progress.notes = notes || progress.notes;
            progress.rating = rating || progress.rating;
            progress.updatedAt = new Date();

            if (status === 'completed') {
                progress.completedAt = new Date();
            }
        } else {
            progress = new ReadingProgress({
                userId: req.user._id,
                bookId: bookId,
                currentPage: currentPage,
                status: status || 'reading',
                notes: notes,
                rating: rating
            });
        }

        await progress.save();
        await progress.populate('bookId');

        const progressWithPercentage = {
            ...progress.toObject(),
            percentage: progress.bookId.totalPages > 0 ?
                Math.round((progress.currentPage / progress.bookId.totalPages) * 100) : 0
        };

        res.json(progressWithPercentage);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// RUTA DE ESTADÍSTICAS (mantén la que ya tienes)
app.get('/api/stats', requireAuth, async (req, res) => {
    try {
        const stats = await ReadingProgress.aggregate([
            { $match: { userId: req.user._id } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalBooks = await ReadingProgress.countDocuments({ userId: req.user._id });
        const completedBooks = await ReadingProgress.countDocuments({
            userId: req.user._id,
            status: 'completed'
        });

        res.json({
            totalBooks,
            completedBooks,
            statusBreakdown: stats,
            completionRate: totalBooks > 0 ? Math.round((completedBooks / totalBooks) * 100) : 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📚 Google Books API integrada`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`📋 Rutas de Google Books disponibles:`);
    console.log(`   GET  /api/books/search-google - Búsqueda en Google Books`);
    console.log(`   POST /api/books/add-from-google - Agregar desde Google Books`);
});