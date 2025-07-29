const http = require('http');
const { Server } = require('socket.io');
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require('jsonwebtoken');
const User = require('./models/userModel');
const ActivitySession = require('./models/activitySessionModel');

dotenv.config();
const dbConnect = require("./configs/dbConnect");
const app = express();

// Create an HTTP server for socket integration
const server = http.createServer(app);

// Parse application/json
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuration
const PORT = process.env.PORT || 8000;
dbConnect();

// Core Middleware
app.use(express.json());
app.use(cookieParser());

let allowedOrigins = [];
if (process.env.ALLOW_ORIGINS) {
  try {
    allowedOrigins = JSON.parse(process.env.ALLOW_ORIGINS);
    if (!Array.isArray(allowedOrigins)) {
      throw new Error('ALLOW_ORIGINS is not an array');
    }
  } catch (err) {
    console.error('Error parsing ALLOW_ORIGINS from .env:', err);
    allowedOrigins = allowedOrigins;
  }
} else {
  console.warn('ALLOW_ORIGINS environment variable is not set. Using default origins.');
  allowedOrigins = allowedOrigins;
}

app.use(cors({
  credentials: true,
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// Additional CORS headers - consider merging with the above CORS config
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Socket.IO Configuration for Employee Utility Time Optimization Phase 2
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT'],
    credentials: true,
  }
});


// Socket Authentication Middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication Failed: Missing Token!'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!decoded?._id) {
      return next(new Error('Authentication Failed: Invalid Token!'));
    }

    const user = await User.findById(decoded._id).select('-password').lean();
    if (!user) {
      return next(new Error('Authentication Failed: User Not Found!'));
    }

    // Attach user object to socket
    socket.user = user;
    next();

  } catch (err) {
    console.error('Socket Authentication Error:', err.message);
    return next(new Error('Authentication Failed!'));
  }
});

// Helper Functions for Socket Operations
const createUserInfo = (user) => ({
  _id: user._id,
  firstname: user.firstname,
  lastname: user.lastname,
  email: user.email,
  role: user.role,
  photo: user.photo,
});

const findOrCreateActiveSession = async (userId) => {
  try {
    let session = await ActivitySession.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      sessionStatus: 'active'
    });

    if (!session) {
      session = new ActivitySession({
        userId: new mongoose.Types.ObjectId(userId),
        loginTime: new Date(),
        sessionStatus: 'active',
        totalIdleTime: 0,
        totalWorkTime: 0,
      });
      await session.save();
      console.log(`Created new active session for user: ${userId}`);
    }

    return session;
  } catch (error) {
    console.error(`Error finding/creating session for user ${userId}:`, error);
    throw error;
  }
};

const getAllAdminsWithSessions = async () => {
  try {
    const admins = await User.find({ role: 1 }).select('-password').lean();
    
    const adminsWithSession = await Promise.all(admins.map(async (admin) => {
      const loginLatestSession = await ActivitySession.findOne({
        userId: new mongoose.Types.ObjectId(admin._id),
      }).sort({ loginTime: -1 }).lean();
      
      return {
        ...admin,
        loginLatestSession,
        currentStatus: admin.currentStatus || 'offline'
      };
    }));

    return adminsWithSession;
  } catch (error) {
    console.error('Error fetching admins with sessions:', error);
    throw error;
  }
};

const updateUserStatus = async (userId, status, additionalFields = {}) => {
  try {
    const updateData = {
      currentStatus: status,
      lastActivity: new Date(),
      ...additionalFields
    };

    await User.findByIdAndUpdate(userId, updateData, { new: true });
    console.log(`Updated user ${userId} status to: ${status}`);
  } catch (error) {
    console.error(`Error updating user ${userId} status:`, error);
    throw error;
  }
};

// Socket.IO connection handler
io.on('connection', async (socket) => {
  const userId = socket.user._id.toString();
  const isAdmin = socket.user.role === 1;

  console.log(`User Connected Via Socket.IO: ${userId}, Admin: ${isAdmin}`);

  // Join personal room for targeted emits
  socket.join(userId);

  try {
    // Handle admin connections
    if (isAdmin) {
      socket.join('admins');
      console.log(`Admin ${userId} joined 'admins' room`);

      // Update user status to 'active' when they connect
      await updateUserStatus(userId, 'active');

      // Find or create an active session for this admin
      const session = await findOrCreateActiveSession(userId);
      
      // Get the updated session as lean object
      const loginLatestSession = await ActivitySession.findById(session._id).lean();

      // Prepare user info for broadcast
      const userInfo = createUserInfo(socket.user);

      // Emit to all admins that this admin is now active
     io.to('admins').emit('user:statusChanged', {
        userId,
        status,
        loginLatestSession: updatedSession,   // session object
        userInfo: {
          _id: user._id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          role: user.role,
          photo: user.photo,
        }
      });

      console.log(`Emitted user:statusChanged for admin login: ${userId}`);

      // Send initial admin status snapshot to the newly connected admin
      try {
        const adminsWithSession = await getAllAdminsWithSessions();
        socket.emit('admin:initialStatusList', adminsWithSession);
      } catch (err) {
        console.error('Error sending initial admin status list:', err);
      }
    }
  } catch (error) {
    console.error(`Error handling admin connection for user ${userId}:`, error);
  }

  // Handle user activity events
  socket.on('user:activity', async (data) => {
    try {
      const { status } = data;
      const now = new Date();

      if (!status) {
        console.warn(`Invalid status received from user ${userId}`);
        return;
      }

      // Update user's current status and last activity time
      await updateUserStatus(userId, status);

      // Find the current active activity session for this user
      const session = await ActivitySession.findOne({ 
        userId: new mongoose.Types.ObjectId(userId), 
        sessionStatus: 'active' 
      });

      if (!session) {
        console.warn(`No active session found for user ${userId} on activity update`);
        return;
      }

      // Handle idle start/end times and update session totals
      if (status === 'idle') {
        if (!session.idleStart) {
          session.idleStart = now;
          await session.save();
        }
      } else if (status === 'active') {
        if (session.idleStart) {
          const idleDurationMs = now - session.idleStart;
          session.totalIdleTime = (session.totalIdleTime || 0) + idleDurationMs;
          session.idleStart = null;

          // Update total work time = total session time - idle time
          const totalSessionDuration = now - session.loginTime;
          session.totalWorkTime = totalSessionDuration - session.totalIdleTime;

          await session.save();
        }
      }

      // Reload updated session as plain object
      const loginLatestSession = await ActivitySession.findById(session._id).lean();

      // Prepare user info for frontend update
      const userInfo = createUserInfo(socket.user);

      // Emit user status update with session and user info to all admins
      io.to('admins').emit('user:statusChanged', {
        userId,
        status,
        loginLatestSession,
        userInfo,
      });

      console.log(`Emitted user:statusChanged for user ${userId} with status: ${status}`);

    } catch (err) {
      console.error('Error in user:activity handler:', err);
    }
  });

  // Handle socket disconnect
  socket.on('disconnect', async (reason) => {
    try {
      const userId = socket.user._id.toString();
      const now = new Date();

      // Update the user status to offline and other fields as needed
      await User.findByIdAndUpdate(userId, {
        currentStatus: 'offline',
        status: 'logout',
        currentSessionId: null,
        lastActivity: now,
        updatedAt: now,
      });

      // Find the active session and mark it ended
      const session = await ActivitySession.findOne({
        userId,
        sessionStatus: 'active',
      }).sort({ loginTime: -1 });

      if (session) {
        session.logoutTime = now;
        session.sessionStatus = 'ended';
        await session.save();
      }

      // Reload updated session as plain object if exists
      const loginLatestSession = session ? await ActivitySession.findById(session._id).lean() : null;

      // Prepare minimal user info
      const userInfo = {
        _id: socket.user._id,
        firstname: socket.user.firstname,
        lastname: socket.user.lastname,
        email: socket.user.email,
        role: socket.user.role,
        photo: socket.user.photo,
      };

      // Emit to 'admins' room the status change event
      io.to('admins').emit('user:statusChanged', {
        userId,
        status: 'offline',
        loginLatestSession,
        userInfo,
      });

      console.log(`User ${userId} disconnected (${reason}). Emitted offline status to admins.`);

    } catch (err) {
      console.error('Error handling socket disconnect:', err);
    }
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error(`Socket error for user ${userId}:`, error);
  });
});

// Environment configuration
const environment = process.env.NODE_ENV;
//const environment = process.env.NODE_ENV_PROD;

// API Routes section
const staticPaths = {
  frontend: path.resolve(__dirname, './frontend/build'),
  jobFiles: path.resolve(__dirname, './uploads/JobFiles'),
  resumeFiles: path.resolve(__dirname, './uploads/ResumeFiles'),
  jobApplicationFiles: path.resolve(__dirname, './uploads/JobApplicationFiles'),
  userPhotos: path.resolve(__dirname, './uploads/UserPhotos'),
  applicantResume: path.resolve(__dirname, './uploads/ApplicantResume'),
  userAvatars: path.resolve(__dirname, './uploads/userAvatars')
};

// Create directories if they don't exist
const fs = require('fs');
const { timeStamp } = require('console');
Object.values(staticPaths).forEach(dirPath => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
});

// Verify frontend build path exists and has content
if (fs.existsSync(staticPaths.frontend)) {
  const buildFiles = fs.readdirSync(staticPaths.frontend);
  console.log(`Frontend Build Directory Content: ${buildFiles.length} files found`);
  if (buildFiles.length === 0) {
    console.warn('WARNING: Frontend Build Directory Exist But is Empty!');
  }
} else {
  //console.warn(`WARNING: Frontend Build Directory Does Not Exist: ${staticPaths.frontend}`);
}

// Serve upload directories as static
Object.entries(staticPaths).forEach(([key, dirPath]) => {
  if (key !== 'frontend') { // Handle frontend separately
    const urlPath = `/uploads/${path.basename(dirPath)}`;
    app.use(urlPath, express.static(dirPath, {
      fallthrough: true,
      maxAge: 86400000 // Cache for 24 hours
    }));
    console.log(`Serving ${key} at ${urlPath} from ${dirPath}`);
  }
});


// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment,
    port: PORT
  });
});


app.get("/", (req, res) => {
  res.send(
    `<h2 style="color: darkBlue;">ProsoftSynergies Database is Now Connected Successfully on Port ${PORT} ${environment} Mode </h2>`
  );
});

// IMPORTANT: API routes must be defined BEFORE serving static files and catch-all route
// Auth Routes
app.use("/api/v1/admin", require("./routes/adminRoutes"));
app.use("/api/v1/auth", require('./routes/authRoutes'));

// Other Routes
app.use("/api/v1/country/", require('./routes/countryRoutes'));
app.use("/api/v1/sector/", require('./routes/sectorRoutes'));
app.use("/api/v1/workAuthorization/", require("./routes/workAuthorizationRoute"));
app.use("/api/v1/workMode/", require("./routes/workModeRoutes"));
app.use("/api/v1/workExperience/", require("./routes/workExperienceRoutes"));
app.use("/api/v1/qualification/", require("./routes/qualificationRoutes"));
app.use("/api/v1/apply", require("./routes/applicantJobApplicationRoutes"));
app.use("/api/v1/salary", require('./routes/salaryRoutes'));
app.use("/api/v1/province", require("./routes/provinceRoutes"));
app.use("/api/v1/city/", require("./routes/cityRoutes"));
app.use("/api/v1/job/", require("./routes/jobRoutes"));
app.use("/api/v1/contact", require("./routes/contactRoutes"));
app.use("/api/v1/applicant", require("./routes/applicantRoute"));
app.use("/api/v1/resume", require("./routes/resumeRoutes"));
app.use("/api/v1/subscribers", require("./routes/subscribeRoutes"));
app.use('/api/v1/liveAgent', require('./routes/liveAgentRoutes'));
app.use('/api/v1/chats', require('./routes/chatRoutes'));
app.use("/api/v1/users", require("./routes/userRoutes"));
app.use("/api/v1/photo", require("./routes/uploadUserPhotoRoutes"));

// NOW serve frontend static files AFTER API routes are defined
app.use(express.static(staticPaths.frontend));
console.log(`Serving Frontend Static Files From: ${staticPaths.frontend}`);

// This should be after all API routes - catch-all for SPA navigation
app.get('*', (req, res) => {
  // Check for API requests to avoid serving HTML for API paths
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: "API EndPoint Not Found"
    });
  }
  
  // Check if the file exists in the frontend build directory
  const requestedFile = path.join(staticPaths.frontend, req.path);
  
  if (fs.existsSync(requestedFile) && fs.statSync(requestedFile).isFile()) {
    return res.sendFile(requestedFile);
  }
  
  // Otherwise, serve the index.html for client-side routing
  const indexPath = path.join(staticPaths.frontend, 'index.html');
  
  // Check if index.html exists before serving
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  } else {
    return res.status(404).json({
      success: false,
      message: "Frontend not properly built - index.html missing",
      path: indexPath
    });
  }
});

// Error handling middleware - improved with more detailed logging
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}: ${err.stack || err}`);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // If error is related to static files
  if (req.path.startsWith('/uploads/')) {
    console.error(`Static file error for path: ${req.path}`);
  }
  
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

// Start the server
server.listen(PORT, function () { 
  console.log(
    `%%%%%%%====== ProsoftSynergies API Server is running Successfully on Port:${PORT} ${environment} MODE =======%%%%%%%%`.bgCyan.white.bold
  );
  console.log(`@@@@@@@====== Frontend static files served from: ${staticPaths.frontend} =======@@@@@@@`.bgBlue.white.bold);

  console.log(`Health check available at: http://localhost:${PORT}/health`);
});
