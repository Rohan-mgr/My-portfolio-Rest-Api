const nodemailer = require("nodemailer");
const sgTransport = require("nodemailer-sendgrid-transport");

const mailer = nodemailer.createTransport(
  {
    host: process.env.NODEMAILER_HOST,
    port: process.env.NODEMAILER_PORT,
    secure: true, // upgrade later with STARTTLS
    auth: {
      user: process.env.NODEMAILER_USERNAME,
      pass: process.env.NODEMAILER_PASSWORD,
    },
  }
  // sgTransport({
  //   auth: {
  //     api_key: process.env.SENDGRID_API_KEY,
  //   },
  // })
);

const sendEmail = async ({ admin, resetToken }) => {
  console.log(admin?.email, "admin email");
  console.log(
    process.env.NODEMAILER_USERNAME,
    typeof process.env.NODEMAILER_USERNAME,
    "mailer email"
  );
  await mailer.sendMail(
    {
      to: admin?.email,
      from: process.env.NODEMAILER_USERNAME,
      fromname: "Rohan Rana Magar",
      subject: "Password Reset",
      html: `<div style="text-align: center;">
      <img style="width: 150px; " src="cid:my_logo"/>
        <h2>Greeting, ${admin?.fullName || ""}</h2>
        <p>You requested a password reset</p>
        <p>Click this <a href="https://rohanmagar.com/new-password/${
          admin._id
        }/${resetToken}" target="_self">Link</a> to set a new password</p>
        <p>This link only valid for 1 day.</p>
      </div>`,
      attachments: [
        {
          filename: "portfolio-logo.png",
          path: __dirname + "/portfolio-logo.png",
          cid: "my_logo", //same cid value as in the html img src
        },
      ],
    },
    function (err, res) {
      if (err) {
        console.log(err);
        throw err;
      }
      console.log(res, "mail");
    }
  );
};

module.exports = {
  sendEmail,
};
