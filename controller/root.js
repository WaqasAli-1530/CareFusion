const signup = require("../model/signup");
const provProfile = require("../model/provider");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const service = require("../routers/services");
const complain_ = require("../model/complain");
const adminn = require("../model/admin");
const job = require("../model/JobPost");
const avail = require("../model/availform");
const signupAction = async (req, res) => {
  const { name, uname, emailId, pass, service } = req.body;

  const sname = await signup.find({ username: uname });
  const semail = await signup.find({ email: emailId });
  if (sname.length == 0 && semail.length == 0) {
    const saveSignup = new signup({
      fullname: name,
      username: uname,
      email: emailId,
      password: pass[0],
      signedUpAs: service,
    });
    try {
      await saveSignup.save();
      console.log("Data saved successfully!");
    } catch (error) {
      console.error("Error saving data:", error);
    }
    res.cookie('user', name, { maxAge: 900000, httpOnly: true });
    res.cookie('email', emailId, { maxAge: 900000, httpOnly: true });
    res.redirect("/login");
  } else {
    var message = "Username or Email already exists";
    const redirectUrl = "/signup?message=" + encodeURIComponent(message);
    res.redirect(redirectUrl);
  }
};

const loginAction = async (req, res) => {
  const { username, password } = req.body;

  const user = await signup.find(req.body).limit(1);
  
  const admn = await adminn.findOne(req.body);

  // console.log(user)
  let alreadyProv= false;
  if (user.length != 0) {
    if(user[0].signedUpAs === "Service Seeker"){
      let profileImage = "";
      res.cookie('user', user[0].fullname, {maxAge: 900000,  httpOnly: true });
    res.cookie('email', user[0].email, {maxAge: 900000, httpOnly: true });
    res.cookie('signUpAs', user[0].signedUpAs, {maxAge: 900000,  httpOnly: true });
    const profile = await provProfile.findOne({ email: user[0].email });
    console.log(req.cookies.signUpAs)
      res.render("home", {
        user: user[0].signedUpAs,
        profileImage: profileImage,
      });
    }
    else{
      const prov = await provProfile.findOne({email: user[0].email});
      let profileImage = "";
      if (prov){
      if(!prov.blocked) {
        res.cookie('user', user[0].fullname, { maxAge: 900000,  httpOnly: true });
    res.cookie('email', user[0].email, {maxAge: 900000,  httpOnly: true });
    res.cookie('signUpAs', user[0].signedUpAs, {maxAge: 900000,   httpOnly: true });
        
    const profile = await provProfile.findOne({ email: user[0].email });
    if (profile) {
      let profileImage = profile.profilePicture;
      res.cookie('image', profileImage, {maxAge: 900000,  httpOnly: true });
      alreadyProv = true;
    }
    else{
      alreadyProv = false;
    }
    res.render("home", {
      user: user[0].signedUpAs,
      profileImage: profileImage,
      alreadyProv: alreadyProv
    });
   }
   else{
    res.render("block");
  }
 }else{
  console.log("sadar");
  res.cookie('user', user[0].fullname, { maxAge: 900000,  httpOnly: true });
    res.cookie('email', user[0].email, { maxAge: 900000,  httpOnly: true });
    res.cookie('signUpAs', user[0].signedUpAs, {maxAge: 900000,   httpOnly: true });
   
    res.render("home", {
      user: user[0].signedUpAs,
      profileImage: profileImage,
    });
 }
   
   }
  } else if (admn && admn.length != 0) {
    res.cookie('user', "Admin", { maxAge: 900000, httpOnly: true });
        const totalProv = await provProfile.find();
        const active = await job.find({status: "In Progress"});
        const comp = await job.find({status: "Complete"});
        res.render("admin", {noOfProv: totalProv.length, activeReq: active.length, completed: comp.length});
  } else {
    var message = "Invalid uername or password";
    const redirectUrl = "/login?message=" + encodeURIComponent(message);
    res.redirect(redirectUrl);
  }
};

const signOut = (req, res) => {
  res.clearCookie('user'); // Clear the cookie named 'username'
  res.clearCookie('email'); // Clear the cookie named 'username'
  res.clearCookie('signUpAs'); // Clear the cookie named 'username'
  res.clearCookie('image'); // Clear the cookie named 'username'
  res.redirect('/'); // Redirecting to home page
};
const login = (req, res) => {
  const message = req.query.message || "";
  res.render("login", { message });
};
const signUp = (req, res) => {
  const message = req.query.message || "";
  res.render("signup", { message });
};
const forgotAction = async (req, res) => {
  try {
    console.log("Request received in forgotAction");
    var email = req.body.email;
    console.log(req.body);
    const userData = await signup.findOne({ email: email });
    console.log(userData);
    if (userData) {
      const min = 1000;
      const max = 9999;
      const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

      await signup.updateOne(
        { email: email },
        { $set: { token: randomNumber } }
      );

      const recipientEmail = userData.email;
      const emailSubject = "Reset Password";
      const emailBody = `<p>Hello ${userData.fullname} , 
        
        Your <b>OTP</b> for reseting password is:
        
        <h1>${randomNumber}</h1>
        
        Enter this OTP to reset password`;
      sendEmail(recipientEmail, emailSubject, emailBody);

      res.json({ message: "yes", email: email });
    } else {
      //var message = "Email does not exists";
      res.json({ message: "no", email: email });
    }
  } catch (error) {
    console.log(error);
  }
};
function createTransporter() {
  console.log("In Create Transporter");
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 25,
    secure: false,
    auth: {
      user: "official.carefusion@gmail.com",
      pass: "carr vlgu dtrg vfac",
    },
  });
}
// Function to send an email
function sendEmail(to, subject, text) {
  const transporter = createTransporter();
  console.log("Receiver mail : " + to);
  const mailOptions = {
    from: "official.carefusion@gmail.com",

    to: to,
    subject: subject,
    html: text,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

const resetPassword = async (req, res, err) => {
  console.log("In reset password function");
  try {
    console.log("Request received in resetPassword");
    var newPass = req.body.pass[0];
    var email = req.body.email;
    await signup.updateOne(
      { email: email }, // Filter criteria to find the user
      { $set: { password: newPass } } // Update operation
    );
    const message = "Passward updated successfully";
    res.render("login", { message });
  } catch (err) {
    console.log(err);
  }
};

const OTP = async (req, res) => {
  console.log("In OTP function");
  try {
    console.log("Request received in OTP");
    var otp = req.body.otp;
    var email = req.body.email;
    console.log(req.body);
    const userData = await signup.findOne({ email: email });
    console.log(userData);
    if (userData) {
      if (otp == userData.token) {
        res.json({ message: "yes", email: email });
      } else {
        res.json({ message: "no", email: email });
      }
    } else {
      res.send("no");
    }
  } catch (error) {
    console.log(error);
  }
};
const forgetPassword = async (req, res) => {
  const message = req.query.message || "";
  res.render("forget-password", { message });
};
const chatView = async (req,res)=>{
  const { seekerID, providerID } = req.query;
  const user = await signup.findOne({ fullname: req.cookies.user });
  console.log("in root", providerID);
  console.log("signup", user);
  console.log("useroutside", user._id);

  if(user && user.signedUpAs === 'Service Seeker') {
    console.log("user", user._id);
    res.render('chat', { seekerID:user._id, providerID,uname: req.cookies.user });
  }else {
    res.render('chat', { seekerID: providerID, providerID: seekerID,uname: req.cookies.user });
  }
  
}
const complain = async (req,res)=>{
  if (req.cookies.user === undefined || req.cookies.user === "Visitor") {
    res.render("login", { message: "Please login to get Account details" });
  } else {
  res.render("complain");
  }
}
const complaiaction = async (req,res)=>{
  const compla = new complain_({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    service: req.body.service,
    complain: req.body.complain,
    
  });
  try {
    await compla.save();
    console.log("Data saved successfully!");
  } catch (error) {
    console.error("Error saving data:", error);
  }
  res.redirect("/");
}
const security = async (req,res)=>{
  res.render("security");
}
const insurance = async (req,res)=>{
  res.render("insurance");
}
// New Code
// admin 
const admin = async (req, res)=>{
  const totalProv = await provProfile.find();
  const active = await job.find({status: "In Progress"});
  const comp = await job.find({status: "Completed"});
  res.render("admin", {noOfProv: totalProv.length, activeReq: active.length, completed: comp.length});
}
const notification = async (req, res)=>{
  res.render("notifications");
}
const serviceReq = async (req, res)=>{
  const jobReq = await job.find();
  let prov="";
  var arr=[];
  for(var x = 0; x < jobReq.length; x++){
  if(jobReq[x].assignProv){
    prov = await provProfile.findOne({_id: jobReq[x].assignProv}); 
    arr[x] = prov.fullname;
  }
}
  console.log(prov);
  res.render("service-requests", {jobs: jobReq, prov: arr});
}

const complains = async (req, res)=>{
  const comp = await complain_.find();
  res.render("admin-comp", {complaints: comp});
}

const payment = async (req, res)=>{
  const pend = await job.find({
    status: { $in: ["Complete", "In Progress"] },
    payment: { $in: ["Admin", "Complete"] },
  });
  var pendPrice = 0;
  for (let i = 0; i < pend.length; i++) {
    pendPrice += pend[i]["price"] - Math.floor(pend[i]["price"] * 0.9);
  }

  const x = await job.find({
    status: "In Progress",
    payment: "Admin",
  });
  var xv = 0;
  for (let i = 0; i < x.length; i++) {
    xv += x[i]["price"] - Math.floor(x[i]["price"] * 0.1);
  }
  res.render("payment",{earn: pendPrice,pend:xv});
}
const rejAction = async (req,res)=>{
  const jobId = req.params.id;
    try {
        // Find the job by ID
        const jobb = await job.findById(jobId);
        if (!jobb) {
            return res.status(404).json({ message: 'Job not found' });
        }
        console.log(jobb);
        // Delete the job from the database
        await jobb.remove();
        consoe.log("Bye");
        // Respond with success message
        res.status(200).json({ message: 'Job rejected successfully' });
    } catch (err) {
        console.error('Error rejecting job:', err);
        res.status(500).json({ message: 'Failed to reject job' });
    }
}
const settings = async (req, res)=>{
  res.render ("settings");
}
const status = async (req, res)=>{
  const allprov = await provProfile.find();
  res.render("status", {name: req.cookies.name, profiles: allprov});
}

const statusAction = async(req, res)=>{
  try {
    const profile = await provProfile.findById(req.params.id);
    if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
    }
    profile.blocked = !profile.blocked; // Toggle blocked status
    await profile.save();
    res.json({ message: 'Profile status updated' });
} catch (err) {
    res.status(500).json({ message: err.message });
}
}


module.exports = {
  signupAction,
  loginAction,
  forgotAction,
  login,
  signUp,
  forgetPassword,
  signOut,
  resetPassword,
  OTP,
  chatView,
  complain,
  security,
  insurance,
  complaiaction, admin, notification, serviceReq, status,settings, statusAction, rejAction,
  complains, payment 
};
