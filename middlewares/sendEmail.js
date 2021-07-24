const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.OAUTH_CLIENT_ID,
  process.env.OAUTH_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({
  refresh_token: process.env.OAUTH_REFRESH_TOKEN
});
const accessToken = oauth2Client.getAccessToken()

module.exports = async (from, to, subject, body) => {
 
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.Emailuser, 
      clientId:  process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      refreshToken: process.env.OAUTH_REFRESH_TOKEN,
      accessToken: accessToken
 }
  });
 
  const payload = {
    from,
    to,
    subject,
    // text: "Hello world?", // plain text body
    html: body // html body
  }
  
  // send mail with defined transport object
  let info = await transporter.sendMail(payload);
  if (info.Error) {
    return false;
  } else if (info.accepted.length > 0) {
    return info;
  }
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
};