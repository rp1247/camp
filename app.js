require("dotenv").config();
var express = require("express");
var app = express();
var bodyP = require("body-parser");
var mongoose = require("mongoose");
var user = require("./models/user.js");
var expressValidator = require("express-validator");
app.use(bodyP.urlencoded({extended: true}));
app.use(expressValidator());
app.use(express.static(__dirname+"/public"));
var methodOverride = require("method-override");
var passport = require("passport");
var localStratergy = require("passport-local");
var passportLocalMongoose=require("passport-local-mongoose");
var middleware = require("./middleware/index.js");
var NodeGeocoder = require("node-geocoder");
var crypto = require("crypto");
var nodemailer = require("nodemailer");
var async = require("async");

var options = {
  provider: "google",
  httpAdapter: "https",
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);
var flash = require("connect-flash");
app.use(flash());
app.use(require("express-session")({
    secret: "Elgamal algo",
    resave:false,
    saveUninitialized:false
})
);
app.use(function(req,res,next){
   res.locals.currentUser = req.user;
   res.locals.error = req.flash("error");
   res.locals.success=req.flash("success");
   next();
});
app.use(methodOverride("_method"));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStratergy(user.authenticate()));
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());
mongoose.connect("mongodb+srv://rp1247:Kingkong007!@ycluster-jwv5q.mongodb.net/test?retryWrites=true",{ useNewUrlParser: true }); 
var campground = require("./models/campground.js");
var comment = require("./models/comment.js");
var review = require("./models/review.js");

app.get("/", function(req,res){
    res.render("landing.ejs",{currentUser:req.user});
});

app.get("/campground/new",middleware.isLoggedIn,function(req,res){
    res.render("form.ejs",{currentUser:req.user});
});

app.post("/campground", middleware.isLoggedIn, function(req, res){
  // get data from form and add to campgrounds array
  var name = req.body.name;
  var image = req.body.image;
  var desc = req.body.description;
  var user = {
      id: req.user._id,
      username: req.user.username
  };
  var price = req.body.price;
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      console.log(err);  
      req.flash("error","Invalid");
      return res.redirect("back");
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    var newCampground = {name: name, image: image, description: desc, user:user,price:price, location: location, lat: lat, lng: lng};
    // Create a new campground and save to DB
    campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to campgrounds page
            req.flash("success", "Created New CampSite, "+ newlyCreated.name);
            res.redirect("/campground");
        }
    });
  });
});

app.get("/campground",function(req, res) {
    if(req.query.campground){
        const regex = new RegExp(escapeRegex(req.query.campground), "gi");
        campground.find({name:regex},function(err,campground){
        if(err){
            console.log(err);
        }else{
            res.render("index.ejs",{campground:campground,currentUser:req.user});
        }
    });    
    }else{
        campground.find({},function(err,campground){
        if(err){
            console.log(err);
        }else{
            res.render("index.ejs",{campground:campground,currentUser:req.user});
        }
    });    
    }
});

app.get("/campground/:id",function(req,res){
    campground.findById(req.params.id).populate("comment").exec(function(err,campground){
        if(err || !campground){
            req.flash("error","Campground not found");
            res.redirect("back");
        }else{
            console.log(req.user);
            res.render("show.ejs",{campground:campground,currentUser:req.user});
        }
    });
});

app.get("/campground/:id/comment/new", middleware.isLoggedIn, function(req, res) {
    campground.findById(req.params.id,function(err,campground){
        if(err || !campground){
            req.flash("error","Campground not found");
        }else{
            res.render("cform.ejs",{campground:campground,currentUser:req.user});
        }
    });
});
app.post("/campground/:id/comment", function(req, res){
   campground.findById(req.params.id, function(err, campground){
       if(err || !campground){
           req.flash("error","Campground not found");
           res.redirect("/campground");
       } else {
        comment.create(req.body.comment, function(err, comment){
           if(err){
               console.log(err);
           } else {
               comment.author.id=req.user._id;
               comment.author.username=req.user.username;
               comment.save();
               campground.comment.push(comment);
               campground.save();
               req.flash("success","Comment Created!");
               res.redirect("/campground/" + campground._id);
           }
        });
       }
   });
});
app.get("/register", function(req, res) {
    res.render("userForm.ejs");
});
app.post("/register",function(req,res){
    var newUser = new user({username: req.body.username, email:req.body.email, firstName:req.body.first, lastName:req.body.last});
    user.register(newUser, req.body.password, function(err,user){
        if(err || !user){
            req.flash("error",err.message);
            return res.redirect("back");
        }else{
            console.log("Entering else");
            passport.authenticate("local")(req, res, function(){
                console.log("inside else");
                req.flash("success", "Welcome to YelpCamp, " + user.username);
                res.redirect("/campground");    
            
        });
            console.log("User created");
        }
    });
});
app.get("/login",function(req, res) {
    res.render("loginForm.ejs");
});
app.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/campground",
        failureRedirect: "back"
    }), function(req, res){
});

app.get("/logout",function(req, res) {
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/");
});
app.get("/campground/:id/edit",middleware.userAuthentication,function(req, res) {
    campground.findById(req.params.id, function(err, campground) {
        if(err || !campground){
            req.flash("error","Campground not found");
            res.redirect("back");
        }else{
            res.render("edit.ejs",{campground:campground});   
        }
    });
});

// UPDATE CAMPGROUND ROUTE
app.put("/campground/:id", middleware.userAuthentication, function(req, res){
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      req.flash("error", "Invalid address");
      return res.redirect("back");
    }
    req.body.campground.lat = data[0].latitude;
    req.body.campground.lng = data[0].longitude;
    req.body.campground.location = data[0].formattedAddress;

    campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/campground/" + campground._id);
        }
    });
  });
});
app.delete("/campground/:id", middleware.userAuthentication, function(req,res){
    campground.findByIdAndRemove(req.params.id,function(err,campground){
       if(err){
           console.log(err);
       }else{
            console.log(req.params.id);
            console.log(campground.name);
            req.flash("success","Campground Deleted!");
            res.redirect("/campground");     
       }
   });  
});
app.get("/campground/:id/comment/:c_id/edit", middleware.commentAuthorization,function(req, res) {
    var camp_id=req.params.id;
    campground.findById(req.params.id,function(err, campground) {
        if(err || !campground){
            req.flash("error", "Campground not found");
            res.redirect("back");
        }
        comment.findById(req.params.c_id,function(err, comment) {
            if(err || !comment){
                req.flash("error","Comment not found");
                res.redirect("back");
            }else{
                res.render("cedit.ejs",{comment:comment,campground_id:camp_id});
            }
        });
    });
});
app.put("/campground/:id/comment/:c_id", middleware.commentAuthorization,function(req,res){
    comment.findByIdAndUpdate(req.params.c_id,req.body.comment, function(err,comment){
        if(err || !comment){
            req.flash("error","Comment not found");
            res.redirect("back");
        }else{
            req.flash("success","Comment Updated!");
            res.redirect("/campground/"+req.params.id+"/");
        }
    });
});
app.delete("/campground/:id/comment/:c_id", middleware.commentAuthorization,function(req,res){
    comment.findByIdAndDelete(req.params.c_id,function(err,comment){
        if(err){
            console.log(err);
        }else{
            req.flash("success","Comment Deleted!");
            res.redirect("/campground/"+req.params.id+"/");
        }
    });
});


app.post("/forgot", function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString("hex");
        done(err, token);
      });
    },
    function(token, done) {
      user.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash("error", "No account with that email address exists.");
          return res.redirect("/forgot");
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: "gmail", 
        auth: {
          user: "yelpcamp007@gmail.com",
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: "yelpcamp007@gmail.com",
        subject: "YelpCamp Account Password Reset Request",
        text: "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
          "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
          "http://" + req.headers.host + "/reset/" + token + "\n\n" +
          "If you did not request this, please ignore this email and your password will remain unchanged.\n"
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log("mail sent");
        req.flash("success", "An e-mail has been sent to " + user.email + " with further instructions.");
        done(err, "done");
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect("/forgot");
  });
});

app.get("/reset/:token", function(req, res) {
  user.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if(err){
        console.log(err);
    }
    if (!user) {
      req.flash("error", "Password reset token is invalid or has expired.");
      return res.redirect("/forgot");
    }
    res.render("reset.ejs", {token: req.params.token});
  });
});

app.post("/reset/:token", function(req, res) {
  async.waterfall([
    function(done) {
      user.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash("error", "Password reset token is invalid or has expired.");
          return res.redirect("back");
        }
        if(req.body.newPass === req.body.confirmPass) {
          user.setPassword(req.body.newPass, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect("back");
        }
      });
    },
    function(user, done) {
      var Transport = nodemailer.createTransport({
        service: "gmail", 
        auth: {
          user: "yelpcamp007@gmail.com",
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: "yelpcamp007@gmail.com",
        subject: "Your password has been changed",
        text: "Hello,\n\n" +
          "This is a confirmation that the password for your account " + user.email + " has just been changed.\n"
      };
      Transport.sendMail(mailOptions, function(err) {
        req.flash("success", "Success! Your password has been changed.");
        done(err);
      });
    }
  ], function(err) {
    res.redirect("/campground");
  });
});


app.get("/forgot",function(req, res) {
    res.render("forgot.ejs");
});

app.get("/campground/:id/review/new",middleware.isLoggedIn, middleware.uniqueReview, function(req, res) {
    campground.findById(req.params.id,function(err, campground) {
        if(err){
            console.log(err);
        }else{
            res.render("review.ejs",{campground:campground});   
        }
    });
});
app.post("/campground/:id/review", middleware.uniqueReview, function(req,res){
    campground.findById(req.params.id).populate("review").exec(function(err, campground){
       if(err || !campground){
           console.log(err.message);
           req.flash("error","Campground not found");
           res.redirect("/campground");
       } else {
        review.create(req.body.rat, function(err, review){
           if(err){
               console.log(err);
           } else {
               review.user.id=req.user._id;
               review.user.username=req.user.username;
               review.save();
               campground.review.push(review);
               campground.rating=avg(campground.review);
               campground.save();
               console.log(campground.rating);
               req.flash("success","Review Added!");
               res.redirect("/campground/" + campground._id);
           }
        });
       }
   });
});
app.get("/campground/:id/review/:r_id/update", middleware.checkReviewOwnership, function(req, res) {
    campground.findById(req.params.id, function(err, campground) {
        console.log(campground);
       
        
        if(err || !campground){
            req.flash("error", "Campground not found");
            res.redirect("/campground/"+campground._id);
        }else{
            review.findById(req.params.r_id, function(err, review) {
                if(err || !review){
                    req.flash("error", "Review not found");
                    res.redirect("/campground/"+campground._id);
                }else{
                    console.log("Entering");
                    res.render("reviewUpdate.ejs",{campground:campground,review:review});
                }
            });
        }
    });
});
app.get("/campground/:id/review/view",  function(req, res) {
    campground.findById(req.params.id).populate("review").exec(function(err, campground) {
        if(err || !campground){
            req.flash("error", "Campground not found");
        }else{
            res.render("reviewShow.ejs",{campground:campground, currentUser:req.user});
        }
    });
});
app.put("/campground/:id/review/:r_id", middleware.checkReviewOwnership, function(req,res){
   review.findByIdAndUpdate(req.params.r_id, req.body.review, function(err, review) {
       if(err || !review){
           req.flash("error", "Review not found");
           res.redirect("/campground");
       }else{
           campground.findById(req.params.id).populate("review").exec(function(err, campground) {
               if(err || !review){
                   req.flash("error", "Campground not found");
                   res.redirect("/campground/"+campground._id);
               }else{
                    campground.rating = avg(campground.review);
                    campground.save();
                    req.flash("success", "Review Updated Successfully");
                    res.redirect("/campground/"+campground._id+"/review/view");     
               }
           });
       }
   });
}); 
app.delete("/campground/:id/review/:r_id/delete",middleware.checkReviewOwnership, function(req,res){
   review.findByIdAndRemove(req.params.r_id, function(err,review){
       if(err || !review){
           req.flash("error", "No review found");
           res.redirect("back");
       }else{
            campground.findByIdAndUpdate(req.params.id, {$pull: {review: req.params.r_id}}, {new: true}).populate("review").exec(function(err, campground) {
                if(err || !campground){
                    req.flash("error", err.message);
                    res.redirect("back");
                }else{
                    campground.rating=avg(campground.review);
                    campground.save();
                    req.flash("success", "Review Removed");
                    res.redirect("/campground/"+campground._id);
                }
            }); 
       }
   }); 
});

function avg(review){
    var avg=0;
    review.forEach(function(r){
       avg+=r.rating; 
    });
    console.log(avg + "  " + review.length);
    if(avg == 0){
        return 0;
    }
    return avg/review.length;
}


function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
app.listen(process.env.PORT,process.env.IP,()=>{
    console.log("listening at "+process.env.PORT);
});