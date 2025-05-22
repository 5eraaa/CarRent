// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const userRouter = require("./users/router");
const carRouter = require("./cars/router"); // Import the car router
require("dotenv").config();

const app = express();

// Enhanced CORS configuration
app.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware to parse JSON bodies
app.use(express.json());

// Define API routes BEFORE static file serving
// This ensures our API routes take precedence

// Basic route for health checks
app.get("/api", (req, res) => {
  res.json({ message: "Welcome to CarRent API", status: "online" });
});

// Use the user router with /api prefix
app.use("/api/users", userRouter);

// Use the car router with /api prefix
app.use("/api/cars", carRouter); // Add this line to use car routes

// Serve static files from the public directory AFTER API routes
app.use(express.static("public"));

// Catch-all route for SPA - redirect all other requests to index.html
app.get("*", (req, res) => {
  // Only redirect non-API routes to index.html
  if (!req.path.startsWith("/api/")) {
    res.sendFile("index.html", { root: "./public" });
  } else {
    res.status(404).json({ error: "API endpoint not found" });
  }
});

// Connect to MongoDB with better error handling
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
    console.error("MongoDB connection error details:", err);
    console.error("Please check your MONGODB_URI environment variable");
  });

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}`);
});