const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }
    
    if (user.isBlocked) {
      return next(new Error('Authentication error: Account blocked'));
    }
    
    // Attach user info to socket
    socket.user = {
      _id: user._id,
      userId: user._id.toString(),
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
      photo: user.photo
    };
    
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};

module.exports = socketAuthMiddleware;
