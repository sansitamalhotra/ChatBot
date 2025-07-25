const Subscriber = require("../models/subscriberModel");
const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");

const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

module.exports = {
    subscribe: async (req, res) => {
        const { email } = req.body;

        try 
        {
            const existingSubscriber = await Subscriber.findOne({ email });
            if (existingSubscriber) {
                return res.status(400).json({ message: 'Email is Already Subscribed!!' });
            }
            const newSubscriber = new Subscriber({ email });
            await newSubscriber.save();
            res.status(201).send({ message: 'You have Subscribed Successfully!' });
        }
        catch (error)
        {
            console.log(error);
            res.status(400).send({ message: 'Subscription Failed!', error });
        }
    },
    unsubscribe: async (req, res) => {
        const { email, reason } = req.body;
        try {
          const subscription = await Subscriber.findOneAndUpdate(
            { email },
            { subscribed: false, unsubscribeReason: reason },
            { new: true }
          );
      
          if (!subscription) {
            return res.status(404).json({ message: 'Email not found' });
          }
      
          await subscription.deleteOne();
      
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
      
          //const emailAddresses = ["kenny.offor@thethinkbeyond.com"];
          const emailAddresses = ["hrpspl@prosoftsynergies.com"];
      
          emailAddresses.forEach((emailTo) => {
            // Configure Email Options
            const mailOptions = {
              from: "ProsoftSynergies <hrpspl@prosoftsynergies.com>",
              to: emailTo,
              subject: `Unsubscribe Email: ${subscription.email}`,
              text: `A User with Email Address ${subscription.email} has Requested to be Unsubscribed from our Mass Mailer.\n\nUnsubscribe Reason: ${subscription.unsubscribeReason}`,
            };
            // Send Emails
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.log("Error occurred while sending emails", error);
                console.log(error);
              } else {
                console.log("Email sent successfully", info.response);
              }
            });
          });
      
          res.status(200).send({ message: 'Unsubscribed successfully!' });
        } catch (error) {
          console.log(error);
          res.status(400).json({ message: 'Failed to unsubscribe', error: error.message });
        }
    },

    fetchAllSubscribers: async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
    
        const startIndex = (page - 1) * limit;
        const result = {};
        try {
            const totalSubscribers = await Subscriber.countDocuments();
            const subscribers = await Subscriber.find().lean().sort({ subscriptionDate: -1 }).limit(limit).skip(startIndex);
    
            const numSubscribersInDB = subscribers.length;
    
            const endIndex = startIndex + numSubscribersInDB;
    
            if (endIndex < totalSubscribers) {
                result.next = { page: page + 1, limit: limit };
            }
            if (startIndex > 0) {
                result.previous = { page: page - 1, limit: limit };
            }
    
            result.result = subscribers;
            result.numSubscribersInDB = numSubscribersInDB;
            result.totalSubscribers = totalSubscribers;
    
            console.log("Registered Users List:", result);
    
            res.status(200).json(result);
        } catch (error) {
            console.log(error);
            res.status(500).send({ success: false, message: "Something Went Wrong Trying to Fetch Subscribers From Database", error: error.message });
        }
    },
    
};
