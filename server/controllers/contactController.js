const express = require('express');
const Contact = require('../models/contactModel');
const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");

module.exports = {

    contactFormRequestController: async(req, res, next) => {        
        try
        {
            const { first_name, last_name, email, phone, subject, message } = req.body;
            // Basic validations
            if (!first_name || !last_name || !email || !phone || !subject || !message) {
            return res.status(400).json({ message: 'First Name, Last Name, Email, Phone Number, Subject and Message fields are REQUIRED!!.' });
            }
            // Create a new contact instance
            const contact = new Contact({
            first_name,
            last_name,
            email,
            phone,
            subject,
            message,
            });
            // Save the contact to the database
            const createdContact = await contact.save();
            if (!createdContact)
                return next();
            
           // Configure Nodemailer transporter
            const transporter = nodemailer.createTransport(
                smtpTransport({
                service: "gmail",
                host: "smtp.gmail.com",
                port: 465,
                secure: true,
                auth: {
                    user: process.env.EMAIL_NOTIFICATION_USER,
                    pass: process.env.EMAIL_NOTIFICATION_PASS,
                },
                })
            );

            const emailAddresses = ["hrpspl@prosoftsynergies.com"];
            //const emailAddresses = ["kenny.offor@thethinkbeyond.com"];
            emailAddresses.forEach((emailTo) => {  
                // Send Emails
                const mailOptions = {
                    from: `Contact Us Form Message From: ${first_name} ${last_name} ${email}`,
                    to: emailTo,
                    subject: `Contact Us Form Message Received From: ${contact.first_name} ${contact.last_name}`,
                    text: JSON.stringify(req.body),
                    html: `Below is ${first_name} ${last_name} ${email} Enquiry:<br />
                    First Name: ${first_name} <br/>
                    Last Name: ${last_name} <br/>
                    Email: ${email} <br/>
                    Phone: ${phone} <br/>
                    Subject: ${subject} <br/>
                    <br />
                    Message: <br/>
                    ${message}`
                };
                transporter.sendMail(mailOptions, async (err, data) => {
                    if (err) {
                      console.log(err);
                      return next();
                    } else {
                      await Contact.findByIdAndUpdate(contact._id, {
                        sentConfirmationEmailToUser: true
                      });
                      // now send actual contact us Form to hrteam@thethinkbeyond.com
                      transporter.sendMail(
                        {
                          from: `Contact Us Form Message From: ${first_name} ${last_name} ${email} `,
                          to: emailTo,
                          subject: `Contact Us Form Message Received From: ${contact.first_name} ${contact.last_name}`,
                          text: JSON.stringify(req.body),
                          html: `
                            First Name: ${first_name} <br/>
                            Last Name: ${last_name} <br/>
                            Email: ${email} <br/>
                            Phone: ${phone} <br/>
                            Subject: ${subject} <br/>
                            
                            Message: <br/>
                            ${message}`
                        },
                        async (err, data) => {
                          if (err) {
                            return next();
                          } else {
                            await Contact.findByIdAndUpdate(contact._id, {
                              receivedEmailFromContactForm: true
                            });
                          }
                        }
                      );
                    }
                });
            })

             // send Email Notification to User after Contact Us Form is Submitted Successfully.
            const transporterUser = nodemailer.createTransport(
                smtpTransport({
                    service: "gmail",
                    host: "smtp.gmail.com",
                    port: 465,
                    secure: true,
                    auth: {
                        user: process.env.EMAIL_NOTIFICATION_USER,
                        pass: process.env.EMAIL_NOTIFICATION_PASS,
                    },
                })
            );    
            const userMailOptions = {
                from: "ProsoftSynergies Limited <hrpspl@prosoftsynergies.com>",
                to: email,
                subject: `${first_name} ${last_name} Thank You for Contacting ProsoftSynergies Limited!!`,
                text: JSON.stringify(req.body),
                html: `<b><h3>We kindly request that you refrain from responding to this email. Should you wish to communicate with us, please feel free to send us an email to hrpspl@prosoftsynergies.com
                </h3></b>
                <br />
                <b><h1>Below is Your Enquiry</h1></b>:
                <b><h3>Full Name: ${first_name} ${last_name} </h3></b>
                <b><h3>Email: ${email}</h3></b>
                <b><h3>Phone: ${phone}</h3></b>
                <b><h3>Subject: ${subject} </h3></b>
                
                <b><h3>Message:</h3></b> <br>
                ${message}`
            };
    
          transporterUser.sendMail(userMailOptions, async(error, info) => {
            async (err, data) => {
                if (err) {
                  return next();
                } else {
                  await Contact.findByIdAndUpdate(contact._id, {
                    receivedEmailFromContactForm: true
                  });
                }
              }
          });
          res
          .status(201)
          .json({ message: "Your Message Has been Sent Successfully. Thank You!!!", createdContact });             
        }
        catch (error)
        {
            console.log(error);
        }
    },

    fetchContactMessages: async (req, res) => {
        try
        {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;

            const result = {};

            const totalContactUsFormMessages = await Contact.countDocuments();
            const numRegContactUsFormMessagesInDB = await Contact.countDocuments();

            const contacts = await Contact.find().sort('-createdAt')
                .populate([
                    "first_name",
                    "last_name",
                    "email",
                    "phone",
                    "subject",
                    "message",
                    "sentConfirmationEmailToUser",
                    "receivedEmailFromContactForm"
                ]).limit(limit).skip(startIndex);
            console.log({ "Total Contact Us Form Messages": contacts });

            if (endIndex < numRegContactUsFormMessagesInDB) {
                result.next = { page: page + 1, limit: limit };
            }
            if (startIndex > 0) {
                result.previous = { page: page - 1, limit: limit };
            }

            result.result = contacts;
            result.numRegContactUsFormMessagesInDB = numRegContactUsFormMessagesInDB;
            result.totalContactUsFormMessages = totalContactUsFormMessages;
        
            res.status(200).json(result);

        }
        catch (error)
        {
            console.log(error);
            res.status(500).send({ success: false, message: "Something Went Wrong Trying to Fetch AllContact Us Form Messages From Database", error: error.message });
        }
    },

    fetchContactMessageByIdController: async (req, res) => {
      try {
        const contact = await Contact.findById(req.params.id)
        .populate("first_name")
        .populate("last_name")
        .populate("email")
        .populate("phone")
        .populate("subject")
        .populate("message")
        .populate("createdAt").exec();

        if (!contact) {
          return res.status(404).json({ success: false, message: "Contact Us Form Message Not Found" });
        } 
        res
          .status(200)
          .send({ success: true, message: "Contact Us Form Message Found", contact });
      } catch (error) {
        console.log(error);
        res.status(500).send({
          success: false,
          message: "Something Went Wrong Trying to Fetch This Contact Us Form Message From Database",
          error,
        });
      }
  },
  // delete Contact Us Message
  deleteContactMessageController: async (req, res) => {
    try {
        const deletedMessage = await Contact.findOneAndDelete({ _id: req.params.id });

        if (!deletedMessage) {
            return res.status(404).send({ success: false, message: "Contact Us Message not found" });
        }

        res.status(200).send({ success: true, message: "Contact Us Message deleted successfully", deletedMessage });
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Error while deleting Contact Us Message", error });
    }
  },

};
