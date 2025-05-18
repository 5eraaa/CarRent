const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
// Other routes to be added here

const path = require('path');

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));



module.exports = app;
