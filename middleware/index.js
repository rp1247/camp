var campground = require("../models/campground.js");
var comment = require("../models/comment.js");
var review = require("../models/review.js");

var middlewareObj = {};

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in");
    res.redirect("/login");
};
middlewareObj.userAuthentication = function(req,res,next){
    if(req.isAuthenticated()){
        campground.findById(req.params.id,function(err,campground){
            if(err || !campground){
                req.flash("error", "Campground not found");
                res.redirect("back");
            }else{
                if(campground.user.id.equals(req.user._id)){
                    next();
                }else{
                    req.flash("error", "You do not have permission to do that");
                    res.redirect("back");
                }
            }
        });
    }else{
        req.flash("error", "Illegal routing");
        res.redirect("back");
    }
};
middlewareObj.commentAuthorization = function(req,res,next){
    if(req.isAuthenticated()){
        comment.findById(req.params.c_id,function(err,comment){
            if(err || !comment){
                req.flash("error", "Comment not found");
                res.redirect("back");
            }else{
                if(comment.author.id.equals(req.user._id)){
                    next();
                }else{
                    req.flash("error", "You do not have permission to do that");
                    res.redirect("back");
                }
            }
        });
    }else{
        req.flash("error", "Illegal routing");
        res.redirect("back");
    }
};
middlewareObj.uniqueReview = function (req, res, next) {
    if (req.isAuthenticated()) {
        campground.findById(req.params.id).populate("review").exec(function (err, campground) {
            if (err || !campground) {
                req.flash("error", "Campground not found.");
                res.redirect("back");
            } else {
                // check if req.user._id exists in foundCampground.reviews
                var foundUserReview = campground.review.some(function (review) {
                    return review.user.id.equals(req.user._id);
                });
                if (foundUserReview) {
                    req.flash("error", "You already wrote a review.");
                    return res.redirect("back");
                }
                // if the review was not found, go to the next middleware
                next();
            }
        });
    } else {
        req.flash("error", "You need to login first.");
        res.redirect("back");
    }
};
middlewareObj.checkReviewOwnership = function(req, res, next) {
    if(req.isAuthenticated()){
        review.findById(req.params.r_id, function(err, foundReview){
            if(err || !foundReview){
                res.redirect("back");
            }  else {
                // does user own the comment?
                if(foundReview.user.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};
module.exports = middlewareObj;