const nodemailer = require("nodemailer");

exports.contactEmailFunc = (first_name, last_name, email, phone, subject, message) => {
  const msgTitle = "Thank You for Contacting ProsoftSynergies Limited!!";
  const msgBody = `Hello ${first_name} ${last_name}, We are pleased to inform you that your inquiry has been successfully submitted. Our team will promptly respond to your query within the next 24 hours. In the meantime, we kindly suggest exploring our website for the latest job opportunities. We greatly appreciate your patience during this process.<br/>
    
    <br/><b>Below is your Enquiry:</b> <br/><br/>
    Fullname: ${first_name} <br/>
    Fullname: ${last_name} <br/>
    Email: ${email} <br/>
    Phone: ${phone} <br/>
    Phone: ${subject} <br/>
    Message: <br/> ${message} <br/>`;

  const msgContent = `<b>We kindly request that you refrain from responding to this email. Should you wish to communicate with us, please feel free to send us an email to info@prosoftsynergies.com</b>`;

  return `<br/>${msgBody} <br/>
            <br/> ${msgContent} <br/>`;
};
