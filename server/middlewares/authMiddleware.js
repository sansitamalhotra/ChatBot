const JWT = require('jsonwebtoken')
const User = require('../models/userModel');


// Protected Route Token Base
const requireLogin = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authorization token missing' });
    }
    
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }
    
    const decoded = JWT.verify(token, process.env.JWT_SECRET_KEY);
    
    // Query User full document here
    const user = await User.findById(decoded._id);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(401).json({ success: false, message: 'User account is blocked' });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({ success: false, message: 'User account is not verified' });
    }

    // Additional validation: Check if user status is logout
    // This prevents using old tokens after logout
    if (user.status === 'logout' || user.currentStatus === 'offline') {
      return res.status(401).json({ 
        success: false, 
        message: 'Session expired. Please login again.',
        requireLogin: true 
      });
    }

    // Update last activity timestamp for active users
    if (user.currentStatus === 'active') {
      user.lastActivity = new Date();
      await user.save();
    }
    
    req.user = user; // attach full mongoose doc for later use
    next();
    
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired. Please login again.',
        requireLogin: true 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. Please login again.',
        requireLogin: true 
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token',
      requireLogin: true 
    });
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
