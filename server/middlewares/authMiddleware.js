//server/middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");
exports.GenerateAccessToken = (user) => {
    console.log("Generating token for user:", {
        id: user._id,
        email: user.email,
        role: user.role
    });
    if (!user._id) {
        throw new Error("User ID is required for token generation");
    }
    const tokenPayload = {
        userId: user._id.toString(),
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phone: user.phone,
        role: user.role,
        photo: user.photo,
        country: user.country,
        appliedJobs: user.appliedJobs,
        jobsPostedBy: user.jobsPostedBy,
        status: user.status,
        registeredDate: user.registeredDate,
        isVerified: user.isVerified,
        isBlocked: user.isBlocked,
        workAuthorization: user.workAuthorization
    };    
    console.log("Token payload being signed:", { userId: tokenPayload.userId, role: tokenPayload.role });    
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET_KEY, { expiresIn: "8h" }); 
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        console.log("Token verification successful:", { userId: decoded.userId, role: decoded.role });
    } catch (error) {
        console.error("Token verification failed immediately after creation:", error);
    }    
    return token;
};
exports.GenerateRefreshToken = (userId) => {
    const token = jwt.sign({ userId: userId.toString() }, process.env.REFRESH_TOKEN_SECRET_KEY, {
        expiresIn: "7d",
    });
    return token;
};
const JWT = require('jsonwebtoken');
const User = require('../models/userModel');
const requireLogin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("Auth header received:", authHeader ? "Present" : "Missing");    
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        message: "No authorization header provided" 
      });
    }
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "No token provided" 
      });
    }
    console.log("Verifying token...");
    console.log("JWT_SECRET_KEY exists:", !!process.env.JWT_SECRET_KEY);    
    const decode = JWT.verify(token, process.env.JWT_SECRET_KEY);
    console.log("Token decoded successfully:", { 
      userId: decode.userId, 
      role: decode.role,
      email: decode.email 
    });
    if (!decode.userId) {
      console.error("Token is valid but userId is missing from payload");
      return res.status(401).json({ 
        success: false, 
        message: "Invalid token payload - missing user ID" 
      });
    }    
    req.user = decode;
    next();
  } catch (error) {
    console.error("Authentication error:", error.message);    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: "Token expired" 
      });
    }    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid token" 
      });
    }    
    res.status(401).json({ 
      success: false, 
      message: "Authentication failed" 
    });
  }
};
const isAdmin = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    console.log("isAdmin: Checking user ID:", userId);    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token"
      });
    }    
    const user = await User.findById(userId);
    console.log("isAdmin: User found:", user ? { id: user._id, role: user.role, email: user.email } : "No user found");    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found in database"
      });
    }
    if (user.role === 1) {
      console.log("isAdmin: Access granted for admin user");
      next();
    } else {
      console.log("isAdmin: Access denied - user role is", user.role, "but admin requires role 1");
      return res.status(403).json({
        success: false,
        message: "ACCESS DENIED. You do not have the Authorization to View this Page!!!"
      });
    }
  } catch (error) {
    console.error("isAdmin middleware error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "Something Went Wrong from Admin Middleware"
    });
  }
};
const isSuperAdmin = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    console.log("isSuperAdmin: Checking user ID:", userId);    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token"
      });
    }    
    const user = await User.findById(userId);
    console.log("isSuperAdmin: User found:", user ? { id: user._id, role: user.role, email: user.email } : "No user found");    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found in database"
      });
    }
    if (user.role === 3) {
      console.log("isSuperAdmin: Access granted for super admin user");
      next();
    } else {
      console.log("isSuperAdmin: Access denied - user role is", user.role, "but super admin requires role 3");
      return res.status(403).json({
        success: false,
        message: "ACCESS DENIED. You do not have the Authorization to View this Page!!!"
      });
    }
  } catch (error) {
    console.error("isSuperAdmin middleware error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "Something Went Wrong from Super Admin Middleware"
    });
  }
};
const isRecruiter = async(req, res, next) => {
  try {
    const userId = req.user.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token"
      });
    }    
    const user = await User.findById(userId);
    if (user?.role === 2) {
      next();
    } else {
      res.status(403).send({
        success: false,
        message: "Recruiter ACCESS DENIED. You do not have the Authorization to View this Page!!!"
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Something Went Wrong for from Recruiter Middleware"
    });
  }
};
const isAdminOrSuperAdmin = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token"
      });
    }    
    const user = await User.findById(userId);
    if (user && (user.role === 1 || user.role === 3)) {
      next();
    } else {
      return res.status(403).json({ 
        success: false, 
        message: "ACCESS DENIED. You do not have the Authorization to View this Page!!!" 
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ 
      success: false, 
      error: error.message, 
      message: "Something Went Wrong for from Super Admin Or Admin Middleware" 
    });
  }
};
module.exports = { requireLogin, isAdmin, isSuperAdmin, isAdminOrSuperAdmin, isRecruiter };
