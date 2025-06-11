# Book Review API

A RESTful API built with Node.js and Express for managing books and reviews. This application allows users to register, authenticate, add books, and submit reviews with a clean web interface.

## 🛠️ Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Session-based authentication with bcrypt for password hashing
- **Template Engine**: EJS for server-side rendering
- **Styling**: HTML, CSS, JavaScript

## 📋 Features

### Authentication
- User registration and login
- Session-based authentication
- Password hashing with bcrypt
- Protected routes for authenticated users

### Book Management
- Add new books (authenticated users only)
- View all books with pagination
- Filter books by author and genre
- Search books by title or author
- View detailed book information with reviews

### Review System
- Submit reviews for books (one review per user per book)
- View average ratings and review counts
- Update and delete your own reviews
- Paginated review display

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB](https://www.mongodb.com/) (local or MongoDB Atlas)
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd book-review-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/bookreview
   SESSION_SECRET=your-secret-key-here
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Run the application**
   ```bash
   # For development (with auto-restart)
   nodemon src/index.js
   
   # For production
   node src/index.js
   ```

6. **Access the application**
   Open your browser and navigate to: `http://localhost:5000`

## 📖 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /signup
Content-Type: application/json

{
  "username": "john_doe",
  "password": "securepassword123"
}
```

#### Login User
```http
POST /login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "securepassword123"
}
```

### Book Endpoints

#### Add New Book
```http
POST /books
Content-Type: application/json
Authentication: Required (Session)

{
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "genre": "Fiction",
  "description": "A classic American novel",
  "publishedYear": 1925,
  "isbn": "978-0-7432-7356-5"
}
```

#### Get All Books
```http
GET /books?page=1&limit=10&author=Fitzgerald&genre=Fiction
```

#### Get Book Details
```http
GET /books/:id?page=1&limit=5
```

#### Search Books
```http
GET /search?q=gatsby&page=1&limit=10
```

### Review Endpoints

#### Submit Review
```http
POST /books/:id/reviews
Content-Type: application/json
Authentication: Required (Session)

{
  "rating": 5,
  "comment": "Amazing book! Highly recommended."
}
```

#### Update Review
```http
PUT /reviews/:id
Content-Type: application/json
Authentication: Required (Session)

{
  "rating": 4,
  "comment": "Updated review content"
}
```

#### Delete Review
```http
DELETE /reviews/:id
Authentication: Required (Session)
```

## 🗄️ Database Schema

### User Collection
```javascript
{
  username: String (unique, required),
  password: String (hashed, required),
  createdAt: Date (default: now)
}
```

### Book Collection
```javascript
{
  title: String (required),
  author: String (required),
  genre: String (required),
  description: String,
  publishedYear: Number,
  isbn: String (unique, required),
  addedBy: String (username who added the book),
  createdAt: Date (default: now)
}
```

### Review Collection
```javascript
{
  bookId: ObjectId (reference to Book),
  username: String (reviewer username),
  rating: Number (1-5, required),
  comment: String,
  createdAt: Date (default: now),
  updatedAt: Date
}
```

## 📝 Example Usage with cURL

### Register a new user
```bash
curl -X POST http://localhost:5000/signup \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'
```

### Login
```bash
curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}' \
  -c cookies.txt
```

### Add a book (requires authentication)
```bash
curl -X POST http://localhost:5000/books \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "To Kill a Mockingbird",
    "author": "Harper Lee",
    "genre": "Fiction",
    "description": "A gripping tale of racial injustice",
    "publishedYear": 1960,
    "isbn": "978-0-06-112008-4"
  }'
```

### Get all books
```bash
curl http://localhost:5000/books?page=1&limit=5
```

### Search books
```bash
curl "http://localhost:5000/search?q=mockingbird"
```

## 🎯 Project Structure

```
book-review-api/
├── src/
│   ├── index.js          # Main application file
│   ├── config.js         # Database configuration and models
│   ├── views/            # EJS templates
│   │   ├── login.ejs
│   │   ├── signup.ejs
│   │   └── home.ejs
│   └── public/           # Static files (CSS, JS, images)
├── .env                  # Environment variables
├── package.json          # Project dependencies
└── README.md            # Project documentation
```

## 🔧 Configuration

The application uses the following configuration:
- **Port**: 5000 (configurable via environment variable)
- **Session Secret**: Configurable via environment variable
- **Database**: MongoDB connection string configurable via environment variable

## 🚨 Design Decisions & Assumptions

1. **Authentication**: Used session-based authentication instead of JWT for simplicity and better integration with the web interface.

2. **Database**: MongoDB chosen for its flexibility with document structure and ease of setup.

3. **One Review Per User**: Each user can only submit one review per book to prevent spam.

4. **Pagination**: Implemented pagination for books and reviews to handle large datasets efficiently.

5. **Case-Insensitive Search**: Search functionality is case-insensitive for better user experience.

6. **Password Security**: Passwords are hashed using bcrypt with salt rounds of 10.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request




---

**Happy Coding! 📚✨**
