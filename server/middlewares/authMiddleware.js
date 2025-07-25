const JWT = require('jsonwebtoken')
const User = require('../models/userModel');


// Protected Route Token Base
const requireLogin = async(req, res, next) => {
    try {
        const decode = JWT.verify(req.headers.authorization, process.env.JWT_SECRET_KEY);
        req.user = decode;
        next();
    } catch (error) {
        console.log(error);
    }
};

// for Admin Routes and Access
const isAdmin = async(req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (user.role !== 1) {
            //  return res.status(401).json({ success: false, message: "ACCESS DENIED. You do not have the Authorization to View this Page!!!"});
            console.log(res.status(401));
        } else {
            next();
        }
    } catch (error) {
        console.log(error);
        res.status(401).send({ success: false, error, message: "Something Went Wrong for from Admin Middleware" });
    }
};

const isRecruiter = async(req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (user.role !== 2) {
            res.status(401).send({ success: false, message: "Recruiter ACCESS DENIED. You do not have the Authorization to View this Page!!!" })
        } else {
            next();
        }
    } catch (error) {
        console.log(error);
        res.status(401).send({ success: false, error, message: "Something Went Wrong for from Recruiter Middleware" });
    }
};


const isApplicant = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (user.role !== 0) {
            res.status(401).send({ success: false, message: "Job Seeker ACCESS DENIED. You do not have the Authorization to View this Page!!!" })
        } else {
            next();
        }
    } catch (error) {
        console.log(error);
        res.status(401).send({ success: false, error, message: "Something Went Wrong for from Applicant Middleware" });
    };
};

const isAuthorized = async (req, res, next) => {
  await User.findById(req.user_id)
    .then((userId) => {
      if (!userId) {
        const error = new Error("User not Found or does not Exist !!!");
        error.statusCode = 404;
        throw error;
      }
      req.role = userId.role;
      next();
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

const isUserAdmin = (req, res, next) => {
  // console.log(req.role);
  if (req.role !== 1) {
    const err = new Error("Not Authorized, Only Admin is Allowed to View this Page!!!");
    err.statusCode = 401;
    next(err);
  }
  next();
};

const isUserRecruiter = (req, res, next) => {
  if (req.role !== 2) {
    const err = new Error("Not Authorized, Only Recruiters are Allowed to View this Page!!!");
    err.statusCode = 401;
    next(err);
  }
  next();
};

const isUser = (req, res, next) => {
  if (req.role !== 0) {
    const err = new Error("Not Authorized, Only Job Applicants are Allowed to View this Page!!!");
    err.statusCode = 401;
    next(err);
  }
  next();
};

module.exports = { requireLogin, isAdmin, isRecruiter, isApplicant, isAuthorized, isUserAdmin, isUserRecruiter, isUser }