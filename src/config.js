
const mongoose = require("mongoose");
const connect = mongoose.connect("mongodb://localhost:27017/bookstore");

connect.then(() => {
    console.log("Connected to MongoDB");
})
.catch((err) => {
    console.log(err);
})

// User Schema
const LoginSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});

// Book Schema
const BookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    genre: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    publishedYear: {
        type: Number,
        required: true
    },
    isbn: {
        type: String,
        unique: true,
        required: true
    },
    addedBy: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Review Schema
const ReviewSchema = new mongoose.Schema({
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    comment: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure one review per user per book
ReviewSchema.index({ bookId: 1, username: 1 }, { unique: true });

// Collections
const User = mongoose.model("users", LoginSchema);
const Book = mongoose.model("books", BookSchema);
const Review = mongoose.model("reviews", ReviewSchema);

module.exports = { User, Book, Review };