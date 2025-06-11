const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const collection = require("./config");
const session = require("express-session");
const { User, Book, Review } = require("./config");

const app = express();

// Session configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// convert data into json format
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static("public"));

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (req.session.username) {
        next();
    } else {
        res.status(401).json({ error: "Authentication required" });
    }
};

// Auth Routes
app.get("/", (req, res) => {
    res.render("login");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.get("/home", requireAuth, async (req, res) => {
    try {
        const books = await Book.find().limit(6).sort({ createdAt: -1 });
        const totalBooks = await Book.countDocuments();
        const totalReviews = await Review.countDocuments();
        
        res.render("home", { 
            username: req.session.username,
            books: books,
            totalBooks: totalBooks,
            totalReviews: totalReviews
        });
    } catch (error) {
        console.error("Error loading home page:", error);
        res.status(500).send("Error loading home page");
    }
});

// Register user 
app.post("/signup", async (req, res) => {
    try {
        const data = {
            username: req.body.username,
            password: req.body.password
        }

        const existinguser = await User.findOne({username: data.username});
        if(existinguser){
            return res.send("User already exists. Please try a different username.");
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);
        
        const userData = {
            username: data.username,
            password: hashedPassword
        };

        await User.insertMany([userData]);
        console.log("User registered successfully");
        res.redirect("/");
        
    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).send("An error occurred during signup. Please try again.");
    }
});

// Login user
app.post("/login", async (req, res) => {
    try {
        const check = await User.findOne({username: req.body.username});
        
        if(!check) {
            return res.send("Username not found");
        }
        
        const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
        
        if(isPasswordMatch) {
            req.session.username = req.body.username;
            console.log("Login successful for user:", req.body.username);
            res.redirect("/home");
        } else {
            res.send("Wrong password");
        }
        
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).send("An error occurred during login. Please try again.");
    }
});

// Logout
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

// ===== BOOK API ROUTES =====

// Add a new book (POST /books)
app.post("/books", requireAuth, async (req, res) => {
    try {
        const { title, author, genre, description, publishedYear, isbn } = req.body;
        
        const existingBook = await Book.findOne({ isbn });
        if (existingBook) {
            return res.status(400).json({ error: "Book with this ISBN already exists" });
        }

        const newBook = new Book({
            title,
            author,
            genre,
            description,
            publishedYear: parseInt(publishedYear),
            isbn,
            addedBy: req.session.username
        });

        const savedBook = await newBook.save();
        res.status(201).json({ message: "Book added successfully", book: savedBook });
    } catch (error) {
        console.error("Error adding book:", error);
        res.status(500).json({ error: "Error adding book" });
    }
});

// Get all books with pagination and filters (GET /books)
app.get("/books", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        let filter = {};
        if (req.query.author) {
            filter.author = new RegExp(req.query.author, 'i');
        }
        if (req.query.genre) {
            filter.genre = new RegExp(req.query.genre, 'i');
        }

        const books = await Book.find(filter)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await Book.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        res.json({
            books,
            pagination: {
                currentPage: page,
                totalPages,
                totalBooks: total,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error("Error fetching books:", error);
        res.status(500).json({ error: "Error fetching books" });
    }
});

// Get book details by ID (GET /books/:id)
app.get("/books/:id", async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ error: "Book not found" });
        }

        // Get reviews with pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const reviews = await Review.find({ bookId: req.params.id })
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const totalReviews = await Review.countDocuments({ bookId: req.params.id });
        
        // Calculate average rating
        const ratingStats = await Review.aggregate([
            { $match: { bookId: book._id } },
            { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
        ]);

        const averageRating = ratingStats.length > 0 ? ratingStats[0].avgRating.toFixed(1) : 0;
        const reviewCount = ratingStats.length > 0 ? ratingStats[0].count : 0;

        res.json({
            book,
            averageRating: parseFloat(averageRating),
            reviewCount,
            reviews,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalReviews / limit),
                totalReviews,
                hasNext: page < Math.ceil(totalReviews / limit),
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error("Error fetching book details:", error);
        res.status(500).json({ error: "Error fetching book details" });
    }
});

// Submit a review (POST /books/:id/reviews)
app.post("/books/:id/reviews", requireAuth, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const bookId = req.params.id;
        const username = req.session.username;

        // Check if book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({ error: "Book not found" });
        }

        // Check if user already reviewed this book
        const existingReview = await Review.findOne({ bookId, username });
        if (existingReview) {
            return res.status(400).json({ error: "You have already reviewed this book" });
        }

        const newReview = new Review({
            bookId,
            username,
            rating: parseInt(rating),
            comment
        });

        const savedReview = await newReview.save();
        res.status(201).json({ message: "Review added successfully", review: savedReview });
    } catch (error) {
        console.error("Error adding review:", error);
        res.status(500).json({ error: "Error adding review" });
    }
});

// Update your own review (PUT /reviews/:id)
app.put("/reviews/:id", requireAuth, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const reviewId = req.params.id;
        const username = req.session.username;

        const review = await Review.findOne({ _id: reviewId, username });
        if (!review) {
            return res.status(404).json({ error: "Review not found or not authorized to update" });
        }

        review.rating = parseInt(rating);
        review.comment = comment;
        review.updatedAt = new Date();

        const updatedReview = await review.save();
        res.json({ message: "Review updated successfully", review: updatedReview });
    } catch (error) {
        console.error("Error updating review:", error);
        res.status(500).json({ error: "Error updating review" });
    }
});

// Delete your own review (DELETE /reviews/:id)
app.delete("/reviews/:id", requireAuth, async (req, res) => {
    try {
        const reviewId = req.params.id;
        const username = req.session.username;

        const review = await Review.findOneAndDelete({ _id: reviewId, username });
        if (!review) {
            return res.status(404).json({ error: "Review not found or not authorized to delete" });
        }

        res.json({ message: "Review deleted successfully" });
    } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({ error: "Error deleting review" });
    }
});

// Search books (GET /search)
app.get("/search", async (req, res) => {
    try {
        const { q, page = 1, limit = 10 } = req.query;
        
        if (!q) {
            return res.status(400).json({ error: "Search query is required" });
        }

        const searchRegex = new RegExp(q, 'i');
        const filter = {
            $or: [
                { title: searchRegex },
                { author: searchRegex }
            ]
        };

        const skip = (page - 1) * limit;
        const books = await Book.find(filter)
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Book.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        res.json({
            books,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalBooks: total,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
            searchQuery: q
        });
    } catch (error) {
        console.error("Error searching books:", error);
        res.status(500).json({ error: "Error searching books" });
    }
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});