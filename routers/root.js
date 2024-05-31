const express = require("express");
const router = express.Router();
const {signupAction,insurance,complaiaction,loginAction,security,chatView,complain,forgotAction,login,signUp, 
    forgetPassword,  signOut,OTP,resetPassword, admin, notification, serviceReq, status,settings, statusAction, 
    rejAction, complains, payment } = require("../controller/root")



router.route("/").get((req,res)=>{
    if(req.cookies.signUpAs === undefined) {
        req.cookies.signUpAs = "Visitor";
    } res.render("home", {user: req.cookies.signUpAs,profileImage:""})});
router.route("/login").get(login);
router.route("/signup").get(signUp);
router.route("/T&C-PP").get((req,res)=>{res.render("T&C-PP")})
router.route("/signupAction").post(signupAction);
router.route("/loginAction").post(loginAction);
router.route("/forgotAction").post(forgotAction);
router.route("/forgotPassword").get(forgetPassword);
router.route("/signout").get(signOut);
router.route("/chat").get(chatView);
router.route("/OTP").post(OTP);
router.route("/resetpassword").post(resetPassword);
router.route("/otpform").get(async(req,res)=>{
    console.log("Rendering otp form");
    const message = req.query.message;
    const email = req.query.email;
    console.log("Message"+message);
    res.render("otp",{message,email})
});
router.route("/resetform").get(async(req,res)=>{
    console.log("Reseting password");
    const message = req.query.message;
    const email = req.query.email;
    console.log("Message"+message);
    res.render("pass",{message,email})
});

router.route("/resetpassword").get(resetPassword);
router.route("/complain").get(complain);
router.route("/security").get(security);
router.route("/insurance").get(insurance);
router.route("/complaiaction").post(complaiaction);


// strip code receiver

const stripe = require('stripe')(process.env.STRIP_PRIVATE_KEY)


router.route('/strip').get((req, res) => {
  res.render('strip', {
     key: process.env.STRIP_PUBLIC_KEY
  })
})

router.route('/payment').post((req, res) => {
 
    // Moreover you can take more details from user
    // like Address, Name, etc from form
    stripe.customers.create({
        email: req.body.stripeEmail,
        source: req.body.stripeToken,
        name: 'Gourav Hammad',
        address: {
            line1: 'TC 9/4 Old MES colony',
            postal_code: '452331',
            city: 'Indore',
            state: 'Madhya Pradesh',
            country: 'India',
        }
    })
    .then((customer) => {
 
        return stripe.charges.create({
            amount: 2500*100,     // Charging Rs 25
            description: 'Web Development Product',
            currency: 'pkr',
            customer: customer.id
        });
    })
    .then((charge) => {
        res.send("Success")  // If no error occurs
    })
    .catch((err) => {
        res.send(err)       // If some error occurs
    });
})

router.route("/admin").get(admin);
router.route("/notifications").get(notification);
router.route("/settings").get(settings);
router.route("/serviceReq").get(serviceReq);
router.route("/status").get(status);
router.route("/profiles/:id/block").post(statusAction);
router.route("/jobs/:id/reject").delete(rejAction);
router.route("/admin-comp").get(complains);
router.route("/payment").get(payment);
router.route("/submit-rating").get( (req, res) => {
    const rating = req.body.rating;
    console.log('Received rating:', rating);
    res.json({ message: 'Rating received successfully' });
  });

module.exports = router;