const Car = require("./model")
const User = require("../users/model")

// Get all cars
const getAllCars = async (req, res) => {
    try {
        // Extract query parameters
        const { available, sort, minPrice, maxPrice, search } = req.query
        const query = {}

        // If available=true is specified, only return non-reserved cars
        if (available === "true") {
            query.reserved = false
        }

        // Add price range filter if provided
        if (minPrice !== undefined && maxPrice !== undefined) {
            query.price_per_hour = {
                $gte: Number(minPrice),
                $lte: Number(maxPrice),
            }
        } else if (minPrice !== undefined) {
            query.price_per_hour = { $gte: Number(minPrice) }
        } else if (maxPrice !== undefined) {
            query.price_per_hour = { $lte: Number(maxPrice) }
        }

        // Add name search if provided
        if (search) {
            query.name = { $regex: search, $options: "i" } // Case-insensitive search
        }

        // Create a sort configuration based on the sort parameter
        let sortConfig = {}

        if (sort) {
            switch (sort) {
                case "price-desc":
                    sortConfig = { price_per_hour: -1 } // -1 for descending order
                    break
                case "price-asc":
                    sortConfig = { price_per_hour: 1 } // 1 for ascending order
                    break
                case "rating":
                    // For rating, we'll calculate the average rating from reviews
                    // This is a simplified approach - for a more accurate implementation,
                    // you might want to store the average rating as a field in the car document
                    sortConfig = { rating: -1 } // Sort by rating field in descending order
                    break
                default:
                    // Default sorting (newest first, assuming there's a createdAt field)
                    sortConfig = { createdAt: -1 }
            }
        } else {
            // Default sorting if no sort parameter is provided
            sortConfig = { createdAt: -1 }
        }

        console.log("Query:", query)
        console.log("Sort:", sortConfig)

        // Find cars with the specified query and apply sorting
        const cars = await Car.find(query).sort(sortConfig)

        res.status(200).json(cars)
    } catch (error) {
        console.error("Error fetching cars:", error)
        res.status(500).json({ error: "Server error" })
    }
}

// Get a car by ID
const getCarById = async (req, res) => {
    const { id } = req.params

    console.log(`Received request for car with ID: ${id}`)

    try {
        const car = await Car.findById(id)

        if (!car) {
            console.log(`Car with ID ${id} not found`)
            return res.status(404).json({ error: "Car not found" })
        }

        console.log(`Found car: ${car.name}`)
        res.status(200).json(car)
    } catch (error) {
        console.error(`Error fetching car by ID ${id}:`, error)
        res.status(500).json({ error: "Server error", details: error.message })
    }
}

// Add a review to a car
const addReview = async (req, res) => {
    const { id } = req.params
    const { user, rating, comment } = req.body

    try {
        const car = await Car.findById(id)
        if (!car) return res.status(404).json({ error: "Car not found" })

        const review = { user, rating, comment }
        car.reviews.push(review)
        const updatedCar = await car.save()

        res.status(201).json({ message: "Review added successfully", car: updatedCar })
    } catch (error) {
        console.error("Error adding review:", error)
        res.status(500).json({ error: "Server error" })
    }
}

// Function to reserve a car
const reserveCar = async (req, res) => {
    const { id } = req.params
    const { userId, hours, minutes, totalPrice } = req.body

    console.log("Reservation request received:", { id, userId, hours, minutes, totalPrice })

    try {
        const car = await Car.findById(id)
        if (!car) return res.status(404).json({ error: "Car not found" })

        if (car.reserved) {
            return res.status(400).json({ error: "Car is already reserved" })
        }

        // Calculate reservation times
        const startTime = new Date()
        const endTime = new Date()
        endTime.setHours(endTime.getHours() + (Number.parseInt(hours) || 1))
        endTime.setMinutes(endTime.getMinutes() + (Number.parseInt(minutes) || 0))

        console.log("Setting reservation details:", {
            startTime,
            endTime,
            hours: Number.parseInt(hours) || 1,
            minutes: Number.parseInt(minutes) || 0,
            totalPrice: Number.parseFloat(totalPrice) || car.price_per_hour,
        })

        // Reserve the car with details
        car.reserved = true
        car.reserved_by = userId
        car.reservation_details = {
            start_time: startTime,
            end_time: endTime,
            hours: Number.parseInt(hours) || 1,
            minutes: Number.parseInt(minutes) || 0,
            total_price: Number.parseFloat(totalPrice) || car.price_per_hour,
        }

        await car.save()
        console.log("Car reserved successfully:", car._id)

        res.status(200).json({ message: "Car reserved successfully", car })
    } catch (error) {
        console.error("Error reserving car:", error)
        res.status(500).json({ error: "Failed to reserve car", details: error.message })
    }
}

// Function to cancel a reservation
const cancelReservation = async (req, res) => {
    const { id } = req.params

    console.log("Cancellation request received for car:", id)

    try {
        const car = await Car.findById(id)
        if (!car) {
            console.log("Car not found:", id)
            return res.status(404).json({ error: "Car not found" })
        }

        if (!car.reserved) {
            console.log("Car is not reserved:", id)
            return res.status(400).json({ error: "Car is not reserved" })
        }

        // Cancel the reservation
        car.reserved = false
        car.reserved_by = null
        car.reservation_details = null // Clear reservation details

        await car.save()
        console.log("Reservation cancelled successfully for car:", id)

        res.status(200).json({ message: "Reservation cancelled successfully", car })
    } catch (error) {
        console.error("Error cancelling reservation:", error)
        res.status(500).json({ error: "Failed to cancel reservation", details: error.message })
    }
}

const getCarDetailsById = async (req, res) => {
    const { id } = req.query // Get car ID from query parameter
    try {
        const car = await Car.findById(id) // Fetch car from MongoDB
        if (!car) {
            return res.status(404).json({ error: "Car not found" })
        }
        res.json(car) // Send car details as JSON response
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message })
    }
}

// Export functions
module.exports = {
    reserveCar,
    cancelReservation,
    getAllCars,
    getCarById,
    addReview,
    getCarDetailsById,
}
