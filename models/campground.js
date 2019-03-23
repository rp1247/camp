
var mongoose = require("mongoose");
var Comment = require("./comment");
var Review = require("./review");


var campgroundSchema = new mongoose.Schema({
    name: String,
    image: String,
    description: String,
    location:String,
    lat:Number,
    price:String,
    lng:Number,
    createdAt:{type:Date, default:Date.now()},
    user: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user"
        },
        username: String
    },
    comment: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "comment"
        }
    ],
    review: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "review"
        }
    ],
    rating: {
        type: Number,
        default: 0
    }
   
},{
    timestamps:true
}
);

module.exports = mongoose.model("campground", campgroundSchema);