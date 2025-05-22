const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true, // Ensure unique emails
        trim: true
    },
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    idNumber: {
        type: String,
        required: true,
        unique: true
    }
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps

// Create the User model
const User = mongoose.model('User', userSchema);

module.exports = User; // Export the User model