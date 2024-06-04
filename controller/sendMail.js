const nodemailer = require("nodemailer");
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
  const sendMail = async (to, subject, text) => {
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

  module.exports = sendMail;