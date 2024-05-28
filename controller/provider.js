const provProfile = require("../model/provider");
const multer = require("multer");
const signup = require("../model/signup");
const jobpost = require("../model/JobPost");

const storage = multer.diskStorage({
  //destintation of uploading file
  destination: function (req, file, picture) {
    picture(null, "uploads");
  },
  filename: function (req, file, picture) {
    picture(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage }).single("profilePicture");
const provProfileAction = async (req, res) => {
  // Using Multer to handle the file upload
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err);
    } else if (err) {
      return res.status(500).json(err);
    }
    console.log(req.session.email);
    // checking req.file is defined or not
    const profilePicture = req.file ? req.file.filename : null;
    if (req.session.email != null) {
      const prov = await signup.findOne({ email: req.session.email });

      const { phoneNo, cnic, address, dob, gender, hometown, skills, about } =
        req.body;
      skills.shift(); // removing the first null value and shifting the other values to left;
      const addProfile = new provProfile({
        fullname: prov.fullname,
        phoneNo: phoneNo,
        email: prov.email,
        cnic: cnic,
        address: address,
        dob: dob,
        gender: gender,
        hometown: hometown,
        skills: skills,
        about: about,
        profilePicture: profilePicture,
      });

      try {
        await addProfile.save();
        console.log("Profile Added successfully!");
      } catch (error) {
        console.error("Error adding in Profile:", error);
      }

      // Redirect or send a response as needed
      res.redirect("/");
    }
  });
};

const updateProfile = async (req, res) => {
  const { phoneNo, address, hometown, skills } = req.body;
  if (phoneNo != undefined || address != undefined || hometown != undefined) {
    if (phoneNo != undefined) {
      await provProfile.updateOne(
        { email: req.session.email },
        { phoneNo: phoneNo }
      );
    }
    if (address != undefined) {
      await provProfile.updateOne(
        { email: req.session.email },
        { address: address }
      );
    }
    if (hometown != undefined) {
      await provProfile.updateOne(
        { email: req.session.email },
        { hometown: hometown }
      );
    }

    res.status(200).json({ message: "Profile updated successfully!!" });
  } else {
    res.status(404).render("404");
  }
};

// const jobViewAction = async (req, res) => {

const jobView = async (req, res) => {
  try {
    const profile = await provProfile
      .find({ email: req.session.email })
      .limit(1);
      console.log("Profile"+profile)
    const provider = await provProfile.findOne({ email: req.session.email });

    if (profile.length != 0) {
      const skil = "skills";
      const skill = profile[0][skil];
      const jobs = await jobpost.find({
        skill: { $in: skill },
        status: "Unassigned",
      });
      if(jobs.length != 0)
        {
      const providerId = await signup.findOne({ fullname: req.session.user });
      const seekerId = await signup.findOne({ fullname: jobs[0].fullname });
      console.log("seeekekeke", seekerId);
      console.log("Id", provider["_id"]);
      res.render("jobView", {
        job: jobs,
        temp: "id",
        xyz:provider["_id"],
        seekerID: seekerId._id,
        providerID: providerId._id,
      });
    }
    else {
      const jobs = [];
      res.render("jobView", { job: jobs });
    }
    } else {
      const jobs = [];
      res.render("jobView", { job: jobs });
    }
  } catch (err) {
    console.log(err);
  }
};

const providerProfile = (req, res) => {
  res.render("provProfile");
};
const dashboard = async (req, res) => {
  const user = await provProfile.findOne({ email: req.session.email });
  const id = user["_id"];
  const comp = await jobpost.find({
    assignProv: id,
    status: "Complete",
    payment: "Complete",
  });
  const cmp = comp.length;
  var cmpPrive = 0;
  for (let i = 0; i < comp.length; i++) {
    cmpPrive += comp[i]["price"] - Math.floor(comp[i]["price"] * 0.1);
  }
  const pend = await jobpost.find({
    assignProv: id,
    status: { $in: ["Complete", "In Progress"] },
    payment: "Pending",
  });
  const pendS = pend.length;
  var pendPrice = 0;
  for (let i = 0; i < pend.length; i++) {
    pendPrice += pend[i]["price"] - Math.floor(pend[i]["price"] * 0.1);
  }

  res.render("prov-dashboard", {
    rec: cmpPrive,
    comp: cmp,
    pend: pendPrice,
    pendS: pendS,
  });
};
const profile = async (req, res) => {
  res.render("profile", {
    profileImage: req.session.image,
    data: await provProfile.findOne({ email: req.session.email }),
  });
};
const stats = async (req, res) => {
  if (req.session.user === undefined || req.session.user === "Visitor") {
    res.render("login", { message: "Please login to get Account details" });
  } else {
    const prov = await provProfile.find({ email: req.session.email });
    console.log("Provider: " + prov);
    const provID = prov[0]["_id"];
    const jobs = await jobpost.find({
      status: "In Progress",
      assignProv: provID,
    });
    res.render("statistics", { jobs: jobs });
  }
};
const completejob = async (req, res) => {
  if (req.session.user === undefined || req.session.user === "Visitor") {
    res.render("login", { message: "Please login to get Account details" });
  } else {
    const prov = await provProfile.find({ email: req.session.email });
    console.log("Provider: " + prov);
    const provID = prov[0]["_id"];
    const jobs = await jobpost.find({ status: "Complete", assignProv: provID });
    res.render("complete", { jobs: jobs });
  }
};
const applyjob = async (req, res) => {
  try {
    console.log(req.query);
    const user = await provProfile.find({ email: req.session.email }).limit(1);
    if (user.length !== 0) {
      const prov_id = user[0]["_id"];
      const price = req.query.price; // Retrieve the price from query parameters

      let update;
      if (price) {
        update = { $push: { reply: { id: prov_id, price: price } } };
      } else {
        update = { $push: { reply: { id: prov_id } } };
      }

      await jobpost.updateOne({ _id: req.query.id }, update);

      res.redirect("/");
    } else {
      var message = "Login to continue further";
      const redirectUrl = "/login?message=" + encodeURIComponent(message);
      res.redirect(redirectUrl);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const assignJobs = async (req, res) => {
  console.log(req.query);
  const user = await provProfile.find({ email: req.session.email }).limit(1);
  if (user.length != 0) {
    const prov = await provProfile.find({ email: req.session.email });
    // console.log("Provider: " + prov);
    const provID = prov[0]["_id"];
    const jobs = await jobpost.find({
      status: "Unapproved",
      assignProv: provID,
    });
    res.render("confirmJob", { jobs: jobs,seekerID: user["_id"],providerID: provID });
  } else {
    var message = "Login to continue further";
      const redirectUrl = "/login?message=" + encodeURIComponent(message);
      res.redirect(redirectUrl);
  }
};
const confirm_job = async (req, res) => {
  const user = await provProfile.find({ email: req.session.email }).limit(1);
  if (user.length != 0) {
    const id = req.query.id;
    await jobpost.updateOne({ _id: id }, { status: "In Progress" });
    res.redirect("/provider/dashboard");
  } else {
    var message = "Login to continue further";
      const redirectUrl = "/login?message=" + encodeURIComponent(message);
      res.redirect(redirectUrl);
  }
};
const reject_job = async (req, res) => {
  const user = await provProfile.find({ email: req.session.email }).limit(1);
  if (user.length != 0) {
    const id = req.query.id;
    await jobpost.updateOne({ _id: id }, { status: "Rejected" });
    res.redirect("/provider/dashboard");
  } else {
    var message = "Login to continue further";
      const redirectUrl = "/login?message=" + encodeURIComponent(message);
      res.redirect(redirectUrl);
  }
};
const rating = async (req, res) => {
  const user = await provProfile.find({ email: req.session.email }).limit(1);
  if (user.length != 0) {
    await jobpost.updateOne({ _id: req.query.job }, { seekRat: "true" });
    await signup.updateOne({ email: req.query.seeker }, { $push: { rating: req.query.value } });
    res.redirect("/provider/dashboard");
  } else {
    var message = "Login to continue further";
      const redirectUrl = "/login?message=" + encodeURIComponent(message);
      res.redirect(redirectUrl);
  }
};
const seekerProf = async (req, res) => {
  const user = await provProfile.find({ email: req.session.email }).limit(1);
  if (user.length != 0) {
    const seeker = await signup.findOne({email:req.query.email});
    const comp = await jobpost.find({email:req.query.email,status:"Complete"});
    const inprog = await jobpost.find({email:req.query.email,status:"In Progress"});
    console.log(seeker)
    res.render("seekerProf",{seeker:seeker,comp:comp.length,inprog:inprog.length});
  } else {
    var message = "Login to continue further";
      const redirectUrl = "/login?message=" + encodeURIComponent(message);
      res.redirect(redirectUrl);
  }
};

module.exports = {
  assignJobs,
  providerProfile,
  completejob,
  provProfileAction,
  jobView,
  dashboard,
  profile,
  updateProfile,
  stats,
  applyjob,
  confirm_job,
  reject_job,
  rating,
  seekerProf
};
