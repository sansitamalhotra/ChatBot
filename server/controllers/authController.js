const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/userModel");
const Country = require("../models/countryModel");
const Token = require("../models/emailTokenModel");
const ResetToken = require("../models//resetPasswordTokenModel");
const { GenerateAccessToken, GenerateRefreshToken } = require("../utils/jwt");
const sendMail = require("../services/SendEmail");
const { errorResponse, successResponse } = require("../configs/appResponse");
const smtpTransport = require("nodemailer-smtp-transport");
const multer = require('multer');
const sharp = require('sharp');
const uploadPhoto = multer({ dest: './uploads/UserProfilePhotos' });


module.exports = {
    // ================= Register New User Method Starts Here ======================== //
    registerController: async (req, res) => {
        try {
          const { firstname, lastname, email, password, confirmPassword, phone, country, workAuthorization } =
            req.body;
    
          // Validations
          const requiredFields = [
            "firstname",
            "lastname",
            "email",
            "password",
            "confirmPassword",
            "phone",
            "country",
            "workAuthorization"
          ];
          const missingFields = requiredFields.filter((field) => !req.body[field]);
    
          if (missingFields.length > 0) {
            return res.send({
              success: false,
              message: `${missingFields.join(", ")} is Required!!`,
            });
          }
    
          // Check if User Already Exists
          const emailExist = await User.findOne({ email });
    
          if (emailExist) {
            return res
              .status(401)
              .send({
                success: false,
                message: "User Already Exists, Kindly Login",
              });
          }
    
          // Save to Database
          const user = await new User({
            firstname,
            lastname,
            email,
            password,
            confirmPassword,
            phone,
            country,
            workAuthorization
          }).save();
    
          const token = await new Token({
            userId: user._id,
            token: crypto.randomBytes(32).toString("hex"),
          }).save();
    
          // Frontend URL
          // const url = `${process.env.FRONTEND_BASE_URL}/${user.id}/verify/${token.token}`;
          const url = `${process.env.FRONTEND_BASE_URL}/Email-Account-Verification/${user.id}/${token.token}`;
    
          // Send Verification Email To User
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
          
    
          await transporter.sendMail({
            from: "hrpspl@prosoftsynergies.com",
            to: user.email,
            subject: "ProSoft Email Verification to Complete Your Account Registration!!",
            text: "<b>ProSoft Email Verification</b>",
            html: `<p>Kindly click on the link to verify your account with ProSoft. <br /><br /><a href="${url}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px; text-align: center; font-family: Trebuchet MS, sans-serif", border-radius: 0>Click to Confirm</a></p>
            
            `,
          });
    
          res.status(201).send({
            success: true,
            message: `User Registration Successful! We've sent a Verification Email to ${user.email} to complete your registration.`,
            user,
          });
        } catch (error) {
          console.log(error);
          res.status(500).send({
            success: false,
            message:
              "Something Went Wrong, Server Unable to Process Your Request at this Moment!",
            error,
          });
        }
    },
    // ================= Register New User Method Ends Here ======================== //

    // ================= Login User Method Starts Here ======================== //
    loginController: async (req, res) => {
        try {

          
          const { email, password } = req.body;
    
          // Validate Credentials
          if (!email || !password) { 
            return res.status(404).send({ success: false, message: "Invalid Email or Password" });
          }
    
          // const user = await User.findOne({ email }).select("+password");
          const user = await User.findOne( {email: req.body.email });
    
          if (!user) {
            return res.status(404).send({ success: false, message: "Email is either not Confirmed or Registered." });
          }
    
          if (!user.isVerified) {
            let token = await Token.findOne({ userId: user._id });
            if (!token) {
              token = await new Token({
                userId: user._id,
                token: crypto.randomBytes(32).toString("hex"),
              }).save();
    
              // frontend url DEVELOPMENT
              const url = `${process.env.FRONTEND_BASE_URL}/${user.id}/verify/${token.token}`;
    
              // frontend url PRODUCTION
              //const url = `${process.env.FRONTEND_BASE_URL_PROD}/${user.id}/verify/${token.token}`;
    
              await sendMail(user.email, "Verify Your ProSoft Email Account", url);
            }
            return res
              .status(400)
              .send({
                success: true,
                message: `An Email has been sent to ${user.email} to complete your Registration. Check Your email.`,
              });
          }
    
          const isMatch =  await user.matchPassword(password);
          console.log("password: ", isMatch);
    
          if (!isMatch) {
            return res.status(400).send({ success: false, message: "Incorrect Email or Password!!" });
          }
    
          // Generate Token for Login/Authentication
          
          const token = jwt.sign(
            {
              
              _id: user._id,
              email: user.email,
              firstname: user.firstname,
              lastname: user.lastname,
              role: user.role,
              photo: user.photo,
              phone: user.phone,
              isVerified: user.isVerified,
              isBlocked: user.isBlocked,
              country: user.country,
              workAuthorization: user.workAuthorization,
              appliedJobs: user.appliedJobs,
              jobsPostedBy: user.jobsPostedBy,
              registeredDate: user.registeredDate,
              status: user.status
            },
            `${process.env.JWT_SECRET_KEY}`,
            { expiresIn: "7d" }
          );
          console.log("userId: ", user._id.toString());
          console.log("token:", token);

          const logUser = await User.findByIdAndUpdate(
            user._id,
            { status: 'login', updatedAt: Date.now() },
            { new: true }
          );
    
          res.status(200).send({
            success: true,
            message: "You are LoggedIn Successfully!!!",
            user: {
              userId: user._id.toString(),
              email: user.email,
              firstname: user.firstname,
              lastname: user.lastname,
              role: user.role,
              phone: user.phone,
              photo: user.photo,
              isVerified: user.isVerified,
              isBlocked: user.isBlocked,
              country: user.country,
              workAuthorization: user.workAuthorization,
              appliedJobs: user.appliedJobs,
              jobsPostedBy: user.jobsPostedBy,
              registeredDate: user.registeredDate,
              status: user.status,
            },
            token, logUser
          });
        } catch (error) {
          console.log(error);
          res
            .status(500)
            .send({
              success: false,
              message:
                "Something Went Wrong, SERVER Unable to Process Your Request at this Moment!!!",
            });
        }
      },
    // ================= Login User Method Ends Here ======================== //

    // ------------------- Verify Your Email Account Method Starts Here --------------------------- //
    regUserVerifyToken: async (req, res, next) => {
      try {
        const user = await User.findOne({ _id: req.params.id });
  
        if (!user)
          return res
            .status(400)
            .send({ success: false, message: "USER NOT FOUND !!!" });
  
        const token = await Token.findOne({
          userId: user._id,
          token: req.params.token,
        });
        if (!token) {
          return res.status(400).send({ success: false, message: "Email is either verified or Invalid token provided. Kindly request a new verification link or Login." });
      }
        else {             
            await User.findOneAndUpdate({ _id: user._id },{ isVerified: true },{ new: true, useFindAndModify: false });
            await token.deleteOne();
            return res.status(200).send({ success: true, message: "Email Successfully VERIFIED !!!" });
        } 

      } catch (error) {
        console.log(error);
        return res
          .status(500)
          .send({
            success: false,
            message: "SERVER UNREACHABLE while trying to Verify Your Email",
          });
      }
    },
// ------------------- Verify Your Email Account Method Ends Here --------------------------- //

// ================= Logout User Method Starts Here ======================== //
    logoutController: async (req, res) => {

        try
        {
          const { user } = req;

          if (!user) {
            return res.status(404).json(errorResponse(4, 'ACCESS DENIED', 'Kindly Login to Continue'));
          }

          // update user Authentication Status as well as updatedAt time
          await User.findByIdAndUpdate(user._id, { status: 'logout', updatedAt: Date.now() }, { new: true });

          // now remove cookie and userAuthDetails stored in the localStorage
          res.clearCookie('userAuthDetails');

          // action response
          res.status(200).json(successResponse(0, 'SUCCESS', 'You Have Logged Out Successfully..'));
        }
        catch (error)
        {
          res.status(500).json(errorResponse(2, 'Logout Failed, Server Side Error', error));
        }
    },
// ================= Logout User Method Ends Here ======================== //

// ================= Forgot Password Reset Starts Here =================== //

  forgotPasswordResetController: async (req, res) => {
    try {
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        return res.status(404).send({ message: "User not found!" });
      }

      let resetToken = await ResetToken.findOne({ userId: user._id });

      if (!resetToken) {
        resetToken = new ResetToken({
          userId: user._id,
        });
      }

      resetToken = await new ResetToken({
        userId: user._id,
        resetToken: crypto.randomBytes(32).toString("hex"),
      }).save();

      await resetToken.save();

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

      //const resetUrl = `${process.env.FRONTEND_BASE_URL}/reset-password/${user.id}/${resetToken.resetToken}`;
      const resetUrl = `${process.env.FRONTEND_BASE_URL}/Password-Reset-Link/${user.id}/${resetToken.resetToken}`;
      const mailOptions = {
        from: process.env.USER,
        to: user.email,
        subject: "Password Reset",
        text: "<b>ProSoft Email Verification</b>",
        html: `<p>Kindly Click on this link to reset your password with ProSoft. <br /><a href="${resetUrl}" class="btn btn-lg -btn-success" style="color: 'green'">Click To Verify</a></p>`, 
      };

      await transporter.sendMail(mailOptions);

      res
        .status(200)
        .send({ message: "Password Reset Token Email has been sent successfully!" });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message });
    }
  },

  // ================= Forgot Password Reset Ends Here =================== //


  // ================= Password Reset Starts Here =================== //
  resetPasswordController: async (req, res, next) => {
    try {
      const { id: userId, resetToken } = req.params;
      const { password: newPassword } = req.body;

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).send({ success: false, message: "User not found." });
      }

      const token = await ResetToken.findOne({ userId, resetToken });
      if (!token) {
        return res.status(404).send({ success: false, message: "Password reset token has expired. Request a new one." });
      }

      await User.findByIdAndUpdate(user._id, { password: hashedPassword });
      await token.deleteOne();

      return res.status(200).send({ success: true, message: "Password updated successfully." });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message });
    }
  },
  // ================= Password Reset End =================== //

   // ================= Change Password Starts =================== //

   changePasswordController: async (req, res) => {      
      const { oldPassword, newPassword, confirmPassword } = req.body;
      const userId = req.user._id;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).send({ success: false, message: "Email is either not Confirmed or Registered." });
      }
      const isOldPasswordMatched =  await user.matchPassword(oldPassword, user.password);
      console.log("Old Password: ", isOldPasswordMatched);
    
      if (!isOldPasswordMatched) {
        return res.status(401).send({ success: false, message: "Old password is incorrect!!" });
      }

      if (newPassword === oldPassword) {
        return res.status(400).send({ success: false, message: "New password cannot be the same as old password" });
      }
      if (newPassword !== confirmPassword) {
        return res.status(400).send({ success: false, message: "New password and confirm password do not match" });
      }
      user.password = newPassword;
      console.log("New Password :", newPassword);
      await user.save();
      return res.status(200).send({ success: true, message: "Password Changed successfully." });
   },
   // ================= Change Password Ends =================== //

   // Refactored code with best practices

uploadUserPhoto: async (req, res) => {
  try {
      const userId = req.user._id;
      const user = await User.findById(userId);
      const photo = req.file.filename;

      if (!user) {
          return res.status(404).json({
              message: "User Not Authenticated Yet, Kindly Login or Register !!!"
          });
      }
      if (!photo) {
          return res.status(404).json({
              message: "No Photo Uploaded !!!"
          });
      }

      const updatedUserPhoto = await User.findByIdAndUpdate(user._id, { photo: photo }, { new: true });

      console.log("User Photo :", updatedUserPhoto.photo);

      return res.status(200).send({
          success: true,
          message: "Profile Photo Updated successfully.",
          photo: updatedUserPhoto.photo
      });
  } catch (error) {
      console.log(error);
      res.status(500).json({ error: "An Error Occurred While Creating Updating User Photo" });
  }
},

  fetchUserPhoto: async (req, res) => {
    
    try
    {
        const userId = req.user._id;
        const user = await User.findById(userId);
        console.log({ 'User ID Detail': user });
        
        if (!user) {
          return res.status(404).json({
          message: "User Not Authenticated Yet, Kindly Login or Register !!!",
          });
        }
        console.log("User ID :", user);
        console.log("User Photo :", user.photo);

        

        if (!user.photo) {
          return res.status(404).send({ message: 'Profile photo not found' });
        }
        res.set('Content-Type', 'image/jpeg');
        //res.redirect(process.env.BACKEND_BASE_URL + '/uploads/' + user.photo);
        res.send(user.photo);
    }
    catch (error)
    {
      console.error(error);
      res.status(500).json({ message: 'Error getting User Profile Photo' });
    }
    
  }, 
}
