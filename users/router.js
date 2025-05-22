// users/router.js
const express = require("express");
const controller = require("./controller");
const router = express.Router();
const authMiddleware = require("../middleware/auth"); // Adjust based on actual path

// Define routes for user signup and signin
router.post("/signup", controller.signup);
router.post("/signin", controller.signin);
router.get("/profile", authMiddleware, controller.getProfile);
router.get("/bookings", authMiddleware, controller.getUserBookings);
router.post("/change-password", authMiddleware, controller.changePassword); // Change password route

// Add a test route
router.get("/", (req, res) => {
    res.json({ message: "Users API is working" });
});

module.exports = router; // Export the router