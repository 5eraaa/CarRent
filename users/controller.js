const bcrypt = require("bcryptjs")
const User = require("./model")
const { generateToken } = require("../utils/tokens")
const Car = require("../cars/model")

const signup = async (req, res) => {
    const signUpInfo = req.body
    const { email, name, password, confirmPassword, phone, idNumber } = signUpInfo

    if (!email || !name || !password || !confirmPassword || !phone || !idNumber)
        return res.status(400).json({ error: "All fields are required" })

    if (password !== confirmPassword) return res.status(400).json({ error: "Passwords do not match" })

    try {
        const existingUser = await User.findOne({ $or: [{ email }, { idNumber }] })
        if (existingUser) return res.status(400).json({ error: "Email or ID already in use" })

        const hashedPassword = await bcrypt.hash(password, 10)
        const newUser = new User({ email, name, password: hashedPassword, phone, idNumber })
        await newUser.save()

        res.status(201).json({ message: "User created successfully" })
    } catch (error) {
        res.status(500).json({ error: "Server error" })
    }
}

const signin = async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) return res.status(400).json({ error: "Email and password are required" })

    try {
        const user = await User.findOne({ email })
        if (!user) return res.status(400).json({ error: "Invalid Email" })

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) return res.status(400).json({ error: "Invalid password" })

        const token = generateToken(user)
        res.json({ token })
    } catch (error) {
        res.status(500).json({ error: "Server error" })
    }
}

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password")

        if (!user) return res.status(404).json({ error: "User not found" })

        res.json(user)
    } catch (error) {
        res.status(500).json({ error: "Server error" })
    }
}

const getUserBookings = async (req, res) => {
    try {
        console.log("Fetching bookings for user:", req.user.id)

        // Find all cars reserved by this user
        const reservedCars = await Car.find({ reserved_by: req.user.id })
        console.log("Found reserved cars:", reservedCars.length)

        // Return an empty array if no bookings are found
        if (!reservedCars.length) {
            console.log("No reserved cars found for user")
            return res.json([])
        }

        // Transform car data into booking format with full details
        const bookings = reservedCars.map((car) => {
            console.log("Processing car:", car._id, car.name)

            // Create a default reservation if none exists
            const defaultReservation = {
                start_time: new Date(),
                end_time: new Date(new Date().getTime() + 60 * 60 * 1000), // Default 1 hour
                hours: 1,
                minutes: 0,
                total_price: car.price_per_hour || 10,
            }

            return {
                _id: car._id,
                car: {
                    _id: car._id,
                    name: car.name || "Unknown Car",
                    image: car.image || null,
                    price_per_hour: car.price_per_hour || 10,
                    seats: car.seats || 4,
                    transmission: car.transmission || "automatic",
                    fuel_type: car.fuel_type || "gasoline",
                    description: car.description || "No description available",
                },
                reservation: car.reservation_details || defaultReservation,
                status: "active", // Default status
            }
        })

        console.log("Sending bookings data:", JSON.stringify(bookings, null, 2))
        res.json(bookings)
    } catch (error) {
        console.error("Error in getUserBookings:", error)
        res.status(500).json({
            error: "Failed to fetch bookings",
            details: error.message,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
        })
    }
}

const changePassword = async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Check if all required fields are provided
    if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // Check if new password and confirmation match
    if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: "New passwords do not match" });
    }

    try {
        // Find the user by ID from the authenticated request
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if the current password is correct
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Current password is incorrect" });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword; // Update user's password
        await user.save(); // Save the updated user object

        res.json({ message: "Password changed successfully" });
    } catch (error) {
        res.status(500).json({ error: "Server error", details: error.message });
    }
};

module.exports = { signup, signin, getProfile, getUserBookings, changePassword }
