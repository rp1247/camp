var mongoose = require("mongoose");

var reviewSchema = new mongoose.Schema({
    rating:{
        type: Number,
        // Making the star rating required
        required: "Please provide a rating (1-5 stars).",
        // Defining min and max values
        min: 1,
        max: 5,
        validate: {
            validator: Number.isInteger,
            message: "{VALUE} is not an integer value."
        }
    },
    // review text
    text: {
        type: String
    },
    user: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user"
        },
        username: String
    },
    
    campground: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "campground"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("review", reviewSchema);