const provider = require("../model/provider");
const ShortlistModel = require("../model/shortlisted");
const signup = require("../model/signup");
const JobPost = require("../model/JobPost");
const stripe = require('stripe')(process.env.STRIP_PRIVATE_KEY)
const getCategory = async (req, res) => {
  const x = req.params.skills;
  console.log("In get category");
  console.log(await provider.find({ skills: x }));
  res.send(await provider.find({ skills: x }));
};

const shortlist = async (req, res) => {
  if (req.session.user === undefined || req.session.user === "Visitor") {
    res.send({ login: "login", message: "Please login to shortlist provider" });
  } else {
    const email = req.session.email;
    const user = await signup.find({ email: email }).limit(1);
    const signedUpAs = user[0]["signedUpAs"];
    if (signedUpAs === "Service Seeker") {
      const skill = req.params.skill;
      const prov_mail = req.params.prov_mail;
      // console.log(skill + " " + prov_mail);
      const shortlisted_by = req.session.email;
      try {
        // Check if shortlisted_by already exists in the database
        const existingShortlist = await ShortlistModel.findOne({
          shortlisted_by,
        });

        if (existingShortlist) {
          // Shortlist entry already exists, check if prov_skill with the same values exists
          const skillExists = existingShortlist.shortlisted.some(
            (entry) => entry.prov_mail === prov_mail && entry.skill === skill
          );

          if (!skillExists) {
            // Prov_skill with the same values does not exist, append new prov_skill to the array
            existingShortlist.shortlisted.push({ prov_mail, skill });
            await existingShortlist.save();
            console.log("Prov_skill added to existing shortlist");
          } else {
            console.log(
              "Prov_skill with the same values already exists in the shortlist"
            );
          }
        } else {
          // Shortlist entry does not exist, create a new entry
          const newShortlistEntry = new ShortlistModel({
            shortlisted_by,
            shortlisted: [{ prov_mail, skill }],
          });

          await newShortlistEntry.save();
          console.log("New shortlist entry created");
        }
      } catch (error) {
        console.error("Error adding to shortlist:", error);
      }
    } else {
      res.send({
        login: "login",
        message: "Login as service seeker not service provider",
      });
    }
  }
};

const getShortlisted = async (req, res) => {
  if (req.session.user === undefined || req.session.user === "Visitor") {
    res.send({ login: "login", message: "Login to get shortlisted provider" });
  } else {
    const email = req.session.email;
    const user = await signup.find({ email: email }).limit(1);
    const signedUpAs = user[0]["signedUpAs"];
    if (signedUpAs === "Service Seeker") {
      const shortlisted_by = req.session.email;

      try {
        // Find the shortlist entry based on shortlisted_by
        const shortlistEntry = await ShortlistModel.findOne({ shortlisted_by });
        if (
          !shortlistEntry ||
          shortlistEntry == null ||
          shortlistEntry.length === 0
        ) {
          // console.log('Shortlist entry not found');
          res.send([]);
          return null;
        }
        // Extract skills and email from the shortlist entry
        const { shortlisted } = shortlistEntry;

        // Find provProfile entries based on matching email and skill in shortlisted array
        const provProfileEntries = await provider.find({
          $or: shortlisted.map((entry) => ({
            skills: entry.skill,
            email: entry.prov_mail,
          })),
        });

        if (!provProfileEntries || provProfileEntries.length === 0) {
          // console.log('No matching ProvProfile entries found');
          res.send([{}]);
          return null;
        }
        // Add a 'category' property to each matching profile entry
        provProfileEntries.forEach((profile) => {
          var matchingEntry = shortlisted.find(
            (entry) => entry.prov_mail === profile.email
          );
          if (matchingEntry) {
            // console.log("Matching Entry:", matchingEntry);
            profile.skills = [matchingEntry.skill];
          }
        });
        res.send(provProfileEntries);
      } catch (error) {
        console.error("Error finding profiles by shortlist:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    } else {
      res.send({
        login: "login",
        message: "Login as service seeker not service provider",
      });
    }
  }
};
const jobPostAction = async (req, res) => {
  const {
    jobRole,
    address,
    detail,
    price,
    city,
    pincode,
    date,
    gender,
    language,
    start_date,
    end_date,
    start_time,
    end_time,
  } = req.body;
  const userData = await signup.findOne({ email: req.session.email });
  const current = new Date();
  const jobPost = {
    fullname: userData["fullname"],
    email: userData["email"],
    address: address,
    gender: gender,
    hometown: city,
    detail: detail,
    skill: jobRole,
    date: date,
    language: language,
    pincode: pincode,
    start_date: start_date,
    end_date: end_date,
    start_time: start_time,
    end_time: end_time,
    price: price,
    date: current.toISOString().split("T")[0],
  };
  res.render("jobPostCard", jobPost);
};

const deleteShortlistedObject = async (req, res) => {
  try {
    const shortlisted_by = req.session.email;
    const prov_mail = req.params.email;
    // Find the document with the given shortlisted_by value
    const shortlistDoc = await ShortlistModel.findOne({ shortlisted_by });

    if (shortlistDoc) {
      // Filter out the object with the specified prov_mail from the shortlisted array
      shortlistDoc.shortlisted = shortlistDoc.shortlisted.filter(
        (item) => item.prov_mail !== prov_mail
      );

      // Check if shortlisted array is empty after filtering
      if (shortlistDoc.shortlisted.length === 0) {
        // If empty, delete the entire document
        await ShortlistModel.deleteOne({ shortlisted_by });
        console.log(
          `Object with prov_mail: ${prov_mail} removed, and shortlist deleted for shortlisted_by: ${shortlisted_by}`
        );
      } else {
        // Save the updated document
        await shortlistDoc.save();
        console.log(
          `Object with prov_mail: ${prov_mail} removed from shortlist for shortlisted_by: ${shortlisted_by}`
        );
      }

      res.send({ result: "okay" });
    } else {
      console.log(`No shortlist found for shortlisted_by: ${shortlisted_by}`);
      res.status(404).send({ result: "not found" });
    }
  } catch (error) {
    console.error("Error removing from shortlist:", error);
    res.status(500).send({ result: "error" });
  }
};
const jobPostCard = async (req, res) => {
  console.log(req.query);
  const x = new JobPost(req.query);
  await x.save();
  res.redirect("/");
};

const update_account = async (req, res) => {
  const email = req.session.email;
  try {
    await signup.updateOne(
      {
        email: email,
      },
      {
        $set: {
          fullname: req.body.fullname,
          phoneno: req.body.phone,
          username: req.body.username,
          address: req.body.address,
        },
      }
    );
    console.log(req.body);

    res.redirect("/seeker/dashboard");
  } catch (err) {
    console.log(err);
  }
};

const dashboard = async (req, res) => {
  if (req.session.user === undefined || req.session.user === "Visitor") {
    res.render("login", { message: "Please login to get dashboard" });
  } else {
    const email = req.session.email;
    const user = await signup.find({ email: email }).limit(1);
    const signedUpAs = user[0]["signedUpAs"];
    if (signedUpAs === "Service Seeker") {
      res.render("seeker-dashboard");
    } else {
      var message = "Login as service seeker not service provider";
      const redirectUrl = "/login?message=" + encodeURIComponent(message);
      res.redirect(redirectUrl);
    }
  }
};
const seekerDA = async (req, res) => {
  if (req.session.user === undefined || req.session.user === "Visitor") {
    res.render("login", { message: "Please login to get Account details" });
  } else {
    const email = req.session.email;
    const user = await signup.find({ email: email }).limit(1);
    const signedUpAs = user[0]["signedUpAs"];
    if (signedUpAs === "Service Seeker") {
      res.render("seeker-DA", { account: user[0] });
    } else {
      var message = "Login as service seeker not service provider";
      const redirectUrl = "/login?message=" + encodeURIComponent(message);
      res.redirect(redirectUrl);
    }
  }
};
const seekerDJ = async (req, res) => {
  if (req.session.user === undefined || req.session.user === "Visitor") {
    res.render("login", { message: "Please login to get Account details" });
  } else {
    const email = req.session.email;
    const user = await signup.find({ email: email }).limit(1);
    const signedUpAs = user[0]["signedUpAs"];
    if (signedUpAs === "Service Seeker") {
      const jobs = await JobPost.find({ email: email });
      res.render("seeker-DJ", { job: jobs });
    } else {
      var message = "Login as service seeker not service provider";
      const redirectUrl = "/login?message=" + encodeURIComponent(message);
      res.redirect(redirectUrl);
    }
  }
};
const seekerDW = async (req, res) => {
  if (req.session.user === undefined || req.session.user === "Visitor") {
    res.render("login", { message: "Please login to get Account details" });
  } else {
    const email = req.session.email;
    const user = await signup.find({ email: email }).limit(1);
    const signedUpAs = user[0]["signedUpAs"];
    if (signedUpAs === "Service Seeker") {
      const jobs = await JobPost.find({ email: email });
      const workers = [];
      for (let i = 0; i < jobs.length; i++) {
        if (jobs[i]["assignProv"] != "") {
          workers.push(jobs[i]["assignProv"]);
        }
      }
      console.log(workers);

      const work = await provider.find({ _id: { $in: workers } });
      res.render("seeker-DW", { providers: work });
    } else {
      var message = "Login as service seeker not service provider";
      const redirectUrl = "/login?message=" + encodeURIComponent(message);
      res.redirect(redirectUrl);
    }
  }
};
const seekerDB = async (req, res) => {
  if (req.session.user === undefined || req.session.user === "Visitor") {
    res.render("login", { message: "Please login to get Account details" });
  } else {
    const email = req.session.email;
    const user = await signup.find({ email: email }).limit(1);
    const signedUpAs = user[0]["signedUpAs"];
    if (signedUpAs === "Service Seeker") {
      const jobs = await JobPost.find({ email: email, status: "In Progress" });
      res.render("seeker-DB", { job: jobs });
    } else {
      var message = "Login as service seeker not service provider";
      const redirectUrl = "/login?message=" + encodeURIComponent(message);
      res.redirect(redirectUrl);
    }
  }
};
const seekerDIN = async (req, res) => {
  if (req.session.user === undefined || req.session.user === "Visitor") {
    res.render("login", { message: "Please login to get Account details" });
  } else {
    const email = req.session.email;
    const user = await signup.find({ email: email }).limit(1);
    const signedUpAs = user[0]["signedUpAs"];
    if (signedUpAs === "Service Seeker") {
      const jobs = await JobPost.find({ email: email,status:"Complete" });
      res.render("seeker-DCS",{ job: jobs,key:process.env.STRIP_PUBLIC_KEY });
    } else {
      var message = "Login as service seeker not service provider";
      const redirectUrl = "/login?message=" + encodeURIComponent(message);
      res.redirect(redirectUrl);
    }
  }
};
const payment = async (req, res) => {
  if (req.session.user === undefined || req.session.user === "Visitor") {
    res.render("login", { message: "Please login to get Account details" });
  } else {
    const email = req.session.email;
    const user = await signup.find({ email: email }).limit(1);
    const signedUpAs = user[0]["signedUpAs"];
    if (signedUpAs === "Service Seeker") {
      // strip payment
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
            amount: req.body.price,     // Charging Rs 25
            description: 'Service Completed',
            currency: 'pkr',
            customer: customer.id
        });
    })
    .then(async (charge) => {
      await JobPost.updateOne(
        { _id: req.query.id },
        { $set: { payment: "Complete"} }
      ); 
        res.redirect("/seeker/dashboard")  // If no error occurs
    })
    .catch((err) => {
        res.send(err)       // If some error occurs
    });

    // end
    } else {
      var message = "Login as service seeker not service provider";
      const redirectUrl = "/login?message=" + encodeURIComponent(message);
      res.redirect(redirectUrl);
    }
  }
};
const seekerDJR = async (req, res) => {
  if (req.session.user === undefined || req.session.user === "Visitor") {
    res.render("login", { message: "Please login to get Account details" });
  } else {
    const email = req.session.email;
    const user = await signup.find({ email: email }).limit(1);
    const signedUpAs = user[0]["signedUpAs"];
    if (signedUpAs === "Service Seeker") {
      if (req.query.status == "Unassigned") {
        const jobs = await JobPost.findOne({ _id:req.query.id });
        const _reply = jobs.reply;
        if (_reply !== 0) {
          const reply = [];
          for (let i = 0; i < _reply.length; i++) {
            reply.push(_reply[i].id);
          }
          const data = []
          for(let i = 0; i < reply.length; i++)
            {
              var cmp = await JobPost.find({ assignProv: reply[i], status: "Complete" });
              var cmp = cmp.length;
              var prg = await JobPost.find({ assignProv: reply[i], status: "In Progress" });
              var prg = prg.length;
              data.push({
                comp: cmp,
                prog: prg,
                id: reply[i]
              })
            }
            console.log(data)
          const providers = await provider.find({ _id: { $in: reply } });
          res.render("seeker-DJR", {
            providers: providers,
            skill: req.query.skill,
            id: req.query.id,
            status: req.query.status,
            bid: _reply,
            data: data
          });
        } else {
          res.redirect("/seeker/dashboard");
        }
      } else {
        const ptr = await provider.findOne({ _id: req.query.assignProv });
        const pr = [ptr];
        const data = [];
        var cmp = await JobPost.find({ assignProv: req.query.assignProv, status: "Complete" });
        var cmp = cmp.length;
        var prg = await JobPost.find({ assignProv: req.query.assignProv, status: "In Progress" });
        var prg = prg.length;
        var pri = await JobPost.findOne({ _id: req.query.id });
        var pri = pri.price;
        console.log(pri);
        data.push({
          comp: cmp,
          prog: prg,
          id: req.query.assignProv
        })
        res.render("seeker-DJR", {
          providers: pr,
          skill: req.query.skill,
          id: req.query.id,
          status: req.query.status,
          data: data,
          bid: [{price: pri,id: req.query.assignProv}]

        });
      }
    } else {
      var message = "Login as service seeker not service provider";
      const redirectUrl = "/login?message=" + encodeURIComponent(message);
      res.redirect(redirectUrl);
    }
  }
};
const seekerDJRA = async (req, res) => {
  if (req.session.user === undefined || req.session.user === "Visitor") {
    res.render("login", { message: "Please login to get Account details" });
  } else {
    const email = req.session.email;
    const user = await signup.find({ email: email }).limit(1);
    const signedUpAs = user[0]["signedUpAs"];
    if (signedUpAs === "Service Seeker") {
      await JobPost.updateOne(
        { _id: req.query.jobID },
        { $pull: { reply: { $ne: req.query.provID } } }
      );
      await JobPost.updateOne(
        { _id: req.query.jobID },
        { $set: { status: "In Progress",payment: "Pending", assignProv: req.query.provID } }
      );
      await provider.updateOne(
        { _id: req.query.provID },
        { $push: { jobs: req.query.jobID } }
      );
      const price = req.query.price;
      if(price != undefined)
        {
          await JobPost.updateOne(
            { _id: req.query.jobID },
            { $set: { price: price } }
          );
        }
      res.render("seeker-dashboard");
    } else {
      var message = "Login as service seeker not service provider";
      const redirectUrl = "/login?message=" + encodeURIComponent(message);
      res.redirect(redirectUrl);
    }
  }
};
const seekerDJRI = async (req, res) => {
  if (req.session.user === undefined || req.session.user === "Visitor") {
    res.render("login", { message: "Please login to get Account details" });
  } else {
    const email = req.session.email;
    const user = await signup.find({ email: email }).limit(1);
    const signedUpAs = user[0]["signedUpAs"];
    if (signedUpAs === "Service Seeker") {
      await JobPost.updateOne(
        { _id: req.query.jobID },
        { $pull: { reply: req.query.provID } }
      );
      console.log(req.query.skill);
      res.render("seeker-dashboard");
    } else {
      var message = "Login as service seeker not service provider";
      const redirectUrl = "/login?message=" + encodeURIComponent(message);
      res.redirect(redirectUrl);
    }
  }
};
const seekerDJD = async (req, res) => {
  if (req.session.user === undefined || req.session.user === "Visitor") {
    res.render("login", { message: "Please login to get Account details" });
  } else {
    const email = req.session.email;
    const user = await signup.find({ email: email }).limit(1);
    const signedUpAs = user[0]["signedUpAs"];
    if (signedUpAs === "Service Seeker") {
      const query = req.query.job;
      await JobPost.deleteOne({ _id: query });
      res.redirect("/seeker/seekerDJ");
    } else {
      var message = "Login as service seeker not service provider";
      const redirectUrl = "/login?message=" + encodeURIComponent(message);
      res.redirect(redirectUrl);
    }
  }
};

const findWorker = (req, res) => {
  const user = req.session.user;
  // console.log(user);
  res.render("findWorker", { user });
};

const postJob = async (req, res) => {
  if (req.session.user === undefined || req.session.user === "Visitor") {
    res.render("login", { message: "Please login to post a job" });
  } else {
    const email = req.session.email;
    const user = await signup.find({ email: email }).limit(1);
    const signedUpAs = user[0]["signedUpAs"];
    if (signedUpAs === "Service Seeker") {
      res.render("postJob");
    } else {
      var message = "Login as service seeker not service provider";
      const redirectUrl = "/login?message=" + encodeURIComponent(message);
      res.redirect(redirectUrl);
    }
  }
};
const jobAssign = async (req, res) => {
  if (req.session.user === undefined || req.session.user === "Visitor") {
    res.render("login", { message: "Please login to post a job" });
  } else {
    const email = req.session.email;
    const user = await signup.find({ email: email }).limit(1);
    const signedUpAs = user[0]["signedUpAs"];
    if (signedUpAs === "Service Seeker") {
      res.render("jobAssign", {
        skill: req.query.skill,
        provEmail: req.query.provEmail,
        gen: req.query.gen,
      });
    } else {
      var message = "Login as service seeker not service provider";
      const redirectUrl = "/login?message=" + encodeURIComponent(message);
      res.redirect(redirectUrl);
    }
  }
};
const seekerDSL = async (req, res) => {
  if (req.session.user === undefined || req.session.user === "Visitor") {
    res.render("login", { message: "Please login to get shortlist" });
  } else {
    const email = req.session.email;
    const user = await signup.find({ email: email }).limit(1);
    const signedUpAs = user[0]["signedUpAs"];
    if (signedUpAs === "Service Seeker") {
      const shortlist = await ShortlistModel.find({
        shortlisted_by: req.session.email,
      });
      if (shortlist.length != 0) {
        const x = shortlist[0]["shortlisted"];
        const prov = [];
        for (let i = 0; i < x.length; i++) {
          prov.push(x[i]["prov_mail"]);
        }
        const provid = await provider.find({ email: { $in: prov } });
        const data = []
          for(let i = 0; i < provid.length; i++)
            {
              var cmp = await JobPost.find({ assignProv: provid[i]["_id"], status: "Complete" });
              var cmp = cmp.length;
              var prg = await JobPost.find({ assignProv: provid[i]["_id"], status: "In Progress" });
              var prg = prg.length;
              data.push({
                comp: cmp,
                prog: prg,
                id: provid[i]["_id"]
              })
            }
        res.render("seeker-DSL", { providers: provid, xv: x,data:data });
      } else {
        res.render("seeker-DSL", { providers: [], xv: "" });
      }
    } else {
      var message = "Login as service seeker not service provider";
      const redirectUrl = "/login?message=" + encodeURIComponent(message);
      res.redirect(redirectUrl);
    }
  }
};

const jobAssignAction = async (req, res) => {
  const {
    jobRole,
    start_date,
    start_time,
    end_date,
    end_time,
    address,
    detail,
    city,
    pincode,
    date,
    gender,
    language,
    provEmail,
    price
  } = req.body;
  const userData = await signup.find({ email: req.session.email });
  console.log(userData);
  const prof = await provider.find({ email: provEmail });
  const id = prof[0]["_id"];
  const current = new Date();
  const jobPost = new JobPost({
    fullname: userData[0]["fullname"],
    email: userData[0]["email"],
    address: address,
    gender: gender,
    hometown: city,
    detail: detail,
    skill: jobRole,
    language: language,
    pincode: pincode,
    assignProv: id,
    status: "Unapproved",
    start_date: start_date,
    end_date: end_date,
    start_time: start_time,
    end_time: end_time,
    date: current.toISOString().split("T")[0],
    price: price
  });
  jobPost.save();
  res.redirect("/seeker/dashboard");
};
const deleteShortlistedAssign = async (req, res) => {
  try {
    const shortlisted_by = req.session.email;
    const prov_mail = req.query.email;
    // Find the document with the given shortlisted_by value
    const shortlistDoc = await ShortlistModel.findOne({ shortlisted_by });

    if (shortlistDoc) {
      // Filter out the object with the specified prov_mail from the shortlisted array
      shortlistDoc.shortlisted = shortlistDoc.shortlisted.filter(
        (item) => item.prov_mail !== prov_mail
      );

      // Check if shortlisted array is empty after filtering
      if (shortlistDoc.shortlisted.length === 0) {
        // If empty, delete the entire document
        await ShortlistModel.deleteOne({ shortlisted_by });
        console.log(
          `Object with prov_mail: ${prov_mail} removed, and shortlist deleted for shortlisted_by: ${shortlisted_by}`
        );
      } else {
        // Save the updated document
        await shortlistDoc.save();
        console.log(
          `Object with prov_mail: ${prov_mail} removed from shortlist for shortlisted_by: ${shortlisted_by}`
        );
      }

      res.redirect("/seeker/dashboard");
    } else {
      console.log(`No shortlist found for shortlisted_by: ${shortlisted_by}`);
      res.status(404).send({ result: "not found" });
    }
  } catch (error) {
    console.error("Error removing from shortlist:", error);
    res.status(500).send({ result: "error" });
  }
};

module.exports = {
  getCategory,
  shortlist,
  getShortlisted,
  jobPostAction,
  deleteShortlistedObject,
  dashboard,
  jobPostCard,
  findWorker,
  postJob,
  seekerDA,
  seekerDJ,
  seekerDW,
  seekerDIN,
  seekerDJR,
  seekerDJRA,
  seekerDJRI,
  seekerDB,
  update_account,
  seekerDJD,
  seekerDSL,
  jobAssign,
  jobAssignAction,
  deleteShortlistedAssign,
  payment
};
