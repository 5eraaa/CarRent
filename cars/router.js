const express = require("express")
const controller = require("./controller")

const router = express.Router()

// Route to get car details by ID (query parameter)
// This needs to be before the /:id route to avoid conflicts
router.get("/details", controller.getCarDetailsById)

// Route to get all cars
router.get("/", controller.getAllCars)

// Route to get a specific car by ID
router.get("/:id", controller.getCarById)

// Route to reserve a car
router.post("/:id/reserve", controller.reserveCar)

// Route to cancel a reservation
router.post("/:id/cancel", controller.cancelReservation)

// Route to add a review for a specific car
router.post("/:id/reviews", controller.addReview)

module.exports = router
