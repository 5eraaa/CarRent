const mongoose = require("mongoose")

const reviewSchema = new mongoose.Schema({
    user: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    date: { type: Date, default: Date.now },
})

const reservationDetailsSchema = new mongoose.Schema({
    start_time: { type: Date, default: Date.now },
    end_time: { type: Date },
    hours: { type: Number, default: 1 },
    minutes: { type: Number, default: 0 },
    total_price: { type: Number },
})

const carSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        price_per_hour: { type: Number, required: true },
        description: { type: String, required: true },
        image: { type: String },
        seats: { type: Number, required: true },
        transmission: {
            type: String,
            enum: ["automatic", "manual"],
            required: true,
        },
        fuel_type: {
            type: String,
            enum: ["gasoline", "diesel", "electric", "hybrid"],
            required: true,
        },
        reserved: { type: Boolean, default: false },
        reserved_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        reservation_details: reservationDetailsSchema,
        reviews: [reviewSchema],
    },
    { timestamps: true },
)

module.exports = mongoose.model("Car", carSchema)
