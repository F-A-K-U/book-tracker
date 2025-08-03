# Book Tracker

### Welcome to Book Tracker!

A web application to track your reading progress, manage your book collection, and discover new books.

### Features

- **User Authentication**: Sign up and log in using Google OAuth.
- **Book Management**: Add, edit, and delete books from your collection.
- **Reading Progress**: Track your reading progress with custom statuses.
- **Search Functionality**: Search for books by title, author, or genre.
- **Responsive Design**: Works seamlessly on both desktop and mobile devices.

### Technologies Used
- **Frontend**: React, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB
- **Authentication**: Google OAuth

### Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/F-A-K-U/book-tracker.git

    cd book-tracker
    ```
2. **Install dependencies**:
   - For the backend:
   ```bash
   cd backend
   npm install
   ```
   - For the frontend:
   ```bash
   cd frontend
   npm install
   ```
3. **Environment Variables**:
   - Create a `.env` file in the `backend` directory using the `.env.example` as a template.
   - Fill in the required environment variables such as `MONGODB_URI`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`, `FRONTEND_URL`, and `PORT`.
4. **Run the application**:
   - Start the backend server:
   ```bash
   cd backend
   npm start
   ```
   - Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```