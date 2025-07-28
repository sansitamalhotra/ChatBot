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
app.use(cors({
  credentials: true,
  origin: ['https://prosoftsynergies.com', 'http://localhost:3000', 'https://server.prosoftsynergies.com', 'http://localhost:8000'],
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
    origin: ['https://prosoftsynergies.com', 'http://localhost:3000', 'https://server.prosoftsynergies.com', 'http://localhost:8000'],
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

// Middleware to Authenticate Socket Connection using JWT Token that will be sent in handshake.auth.token
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication for Hanshake Failed: Missing Token!!!'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!decoded || !decoded._id) {
      return next(new Error('Authentication for Handshake Failed: Token is Invalid!!!'));
    }

    const user = await User.findById(decoded._id);
    if (!user) {
      return next(new Error('Authentication for Handshake Failed: User NOT FOUND!!!'));
    }

    socket.user = user // now we attach complete user document to socket onject
    console.log('User Document After Socket Connection!!!: ', user);
    next();

  }
  catch (error) {
    console.error('Socket.IO Authentication Failed: ', error);
    next(new Error('Authentication Failed!!!'));
  }
});

io.on('connection', (socket) => {
  console.log(`User Connected Successfully Via Socket: ${socket.user._id}`);

  // Optionally we can join a room named by Agent/userId if we wish to target events to this particular user
  socket.join(socket.user._id.toString());

  // Now we connect our socket to Listen to user Activity events, example { status: 'active' | 'idle', timestamp }
  socket.on('user:activity', async (data) => {
    try {
      const userId = socket.user._id;
      const status = data.status;
      const now = new Date();

      // Updating the User Document in terms of currentStatus and lastActivity
      await User.findByIdAndUpdate(userId, {
        currentStatus: status,
        lastActivity: now,
      });

      // Find current active session
      const session = await ActivitySession.findOne({ userId, sessionStatus: 'active' });
      
      if (!session) {
        // No active session, optionally create or skip
        return;
      }

      if (status === 'idle') {
      // Mark start of idle period
      if (!session.idleStart) {
        session.idleStart = now;
        await session.save();
        }
      } else if (status === 'active') {
        // User became active, calculate idle duration and update totals
        if (session.idleStart) {
          const idleDurationMs = now - session.idleStart; // milliseconds
          session.totalIdleTime = (session.totalIdleTime || 0) + idleDurationMs;
          session.idleStart = null;

          // Optionally update totalWorkTime = (now - loginTime) - totalIdleTime
          const totalSessionDuration = now - session.loginTime;
          session.totalWorkTime = totalSessionDuration - session.totalIdleTime;

          await session.save();
        }
      }
      // Broadcast user status change globally (optional)
      io.emit('user:statusChanged', { userId, status, timestamp: now });
      console.log(`Emitted user:statusChanged for user ${userId} status ${status}`);

    } catch (emitErr) {
      console.error('Error handling user activity socket event:', emitErr);
      console.error('Error emitting user:statusChanged:', emitErr);
    }
  });

  socket.on('disconnect', async () => {
    try {
      console.log(`User disconnected via socket: ${socket.user._id}`);

      // Update user status to offline on disconnect
      await User.findByIdAndUpdate(socket.user._id, {
        currentStatus: 'offline',
        lastActivity: new Date(),
      });

      io.emit('user:statusChanged', { userId: socket.user._id, status: 'offline', timestamp: new Date() });
      console.log(`Emitted user:statusChanged for user ${socket.user._id} status offline`);
    }
    catch (error) {
      console.error('Error during socket disconnect handling:', error);
    }
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
});
