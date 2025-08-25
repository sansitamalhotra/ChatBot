//server/server.js
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
const { setupSocketHandlers } = require('./services/socketService')
const { logWithIcon } = require('./services/consoleIcons');

dotenv.config();
const dbConnect = require("./configs/dbConnect");
const app = express();

// Create an HTTP Server For Socket Integration
const server = http.createServer(app);

app.set('trust proxy', true);

// Parse application/json and urlencoded
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
    // Clean up the environment variable by removing line breaks and extra whitespace
    const cleanedOrigins = process.env.ALLOW_ORIGINS
      .replace(/\n/g, '') // Remove line breaks
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim(); // Remove leading/trailing whitespace
    
    allowedOrigins = JSON.parse(cleanedOrigins);
    if (!Array.isArray(allowedOrigins)) {
      throw new Error('ALLOW_ORIGINS is not an array');
    }
    logWithIcon.success(`Parsed ${allowedOrigins.length} allowed origins successfully`);
  } catch (err) {
    logWithIcon.error(`Error parsing ALLOW_ORIGINS from .env:`, err);
    logWithIcon.warning(`Raw ALLOW_ORIGINS value: "${process.env.ALLOW_ORIGINS}"`);
    
    // Fallback: try to extract URLs manually if JSON parsing fails
    try {
      const urlPattern = /https?:\/\/[^\s",\]]+/g;
      const extractedUrls = process.env.ALLOW_ORIGINS.match(urlPattern);
      if (extractedUrls && extractedUrls.length > 0) {
        allowedOrigins = extractedUrls;
        logWithIcon.warning(`Fallback: Extracted ${allowedOrigins.length} URLs from ALLOW_ORIGINS`);
      } else {
        allowedOrigins = [];
      }
    } catch (fallbackErr) {
      logWithIcon.error(`Fallback parsing also failed:`, fallbackErr);
      allowedOrigins = [];
    }
  }
} else {
  logWithIcon.warning(`ALLOW_ORIGINS env not set. Defaulting to *`);
  allowedOrigins = ['*'];
}

// CORS Configuration
app.use(cors({
  credentials: true,
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// --- SOCKET.IO SETUP ---
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT'],
    credentials: true,
  },
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000  // 25 seconds
});

app.use((req, res, next) => {
  req.app.set('socketio', io);
  next();
});


// Socket Authentication Middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const isGuest = socket.handshake.auth.guest;
    
    // Handle guest users (no authentication required)
    if (isGuest === true || !token) {
      logWithIcon.guest('Guest socket connection - no authentication required');
      socket.user = {
        isGuest: true,
        role: 'guest', // String role for guests
        _id: null,
        userId: null,
        firstname: 'Guest',
        lastname: 'User',
        email: null,
        photo: 'https://img.freepik.com/premium-vector/account-icon-user-icon-vector-graphics_292645-552.jpg?w=300'
      };
      return next(); // Allow guest connection
    }

    // Handle authenticated users
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!decoded?.id && !decoded?.userId) {
      logWithIcon.error(`Socket auth failed: Invalid token payload`, decoded);
      return next(new Error('Authentication Failed: Invalid Token!'));
    }

    // Handle both token formats
    const userId = decoded.id || decoded.userId;
    const user = await User.findById(userId).select('-password').lean();
    if (!user) {
      logWithIcon.error(`Socket auth failed: User not found (ID: ${userId})`);
      return next(new Error('Authentication Failed: User Not Found!'));
    }

    // Set authenticated user properties for socket
    socket.user = {
      _id: user._id,
      userId: user._id, // Add both for compatibility
      role: user.role,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      photo: user.photo,
      isGuest: false
    };
    
    logWithIcon.success(`Socket authenticated for user: ${user.email} (Role: ${user.role})`);
    next();
  } catch (err) {
    logWithIcon.error('Socket Auth Error:', err.message);
    
    // If token verification fails, check if this should be a guest connection
    if (socket.handshake.auth.guest) {
      logWithIcon.guest('Token invalid but guest flag present - allowing as guest');
      socket.user = {
        isGuest: true,
        role: 'guest',
        _id: null,
        userId: null,
        firstname: 'Guest',
        lastname: 'User',
        email: null,
        photo: null
      };
      return next();
    }
    
    next(new Error('Authentication Failed: Invalid Token!'));
  }
});

// Ping-pong handler
io.on('connection', (socket) => {
  socket.on('ping', (timestamp) => {
    socket.emit('pong', timestamp);
  });
});

setupSocketHandlers(io);

// Environment configuration
const environment = process.env.NODE_ENV;
//const environment = process.env.NODE_ENV_PROD;

// IMPORTANT: API routes must be defined BEFORE serving static files and catch-all route
// Auth Routes
app.use("/api/v1/admin", require("./routes/adminRoutes"));
app.use("/api/v1/superAdmin", require("./routes/superAdminRoutes"));
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
// app.use('/api/v1/liveAgent', require('./routes/liveAgentRoutes'));
// app.use('/api/v1/chats', require('./routes/chatRoutes'));
app.use("/api/v1/users", require("./routes/userRoutes"));
app.use("/api/v1/photo", require("./routes/uploadUserPhotoRoutes"));

app.use("/api/v1/businessHours", require("./routes/businessHoursRoutes"));
app.use("/api/v1/onlineStatus", require("./routes/onlineStatusRoutes"));
app.use("/api/v1/guestUsers", require("./routes/guestUserRoutes"));

app.use('/api/v1/admin/chat', require("./routes/adminChatRoutes"));

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
    logWithIcon.success(`Created directory: ${dirPath}`);
  }
});

// Verify frontend build path exists and has content
if (fs.existsSync(staticPaths.frontend)) {
  const buildFiles = fs.readdirSync(staticPaths.frontend);
  logWithIcon.clipboard(`Frontend Build Directory Content: ${buildFiles.length} files found`);
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
    logWithIcon.broadcast(`Serving ${key} at ${urlPath} from ${dirPath}`);
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



// NOW serve frontend static files AFTER API routes are defined
app.use(express.static(staticPaths.frontend));
logWithIcon.success(`Serving Frontend Static Files From: ${staticPaths.frontend}`);

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
logWithIcon.error(`[ERROR] ${req.method} ${req.path}: ${err.stack || err}`);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // If error is related to static files
  if (req.path.startsWith('/uploads/')) {
    logWithIcon.error(`Static file error for path: ${req.path}`);
  }
  
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

// Start the server
server.listen(PORT, function () { 
  logWithIcon.success(
    `%%%%%%%====== ProsoftSynergies API Server is running Successfully on Port:${PORT} ${environment} MODE =======%%%%%%%%`.bgCyan.white.bold
  );
  logWithIcon.success(`@@@@@@@====== Frontend static files served from: ${staticPaths.frontend} =======@@@@@@@`.bgBlue.white.bold);

  logWithIcon.success(`Health check available at: http://localhost:${PORT}/health`);
});
module.exports = { app, server, io };
