import React, { Suspense, lazy, useState, useEffect } from "react";
import {
  // eslint-disable-next-line
  BrowserRouter as Router,
  Routes,
  Route,
  useParams,
  useLocation
} from "react-router-dom";
import API from './helpers/API';

import { useAuth } from "./Context/AuthContext";

// import ChatWindow from "./features/Chat/ChatWindow";
// import AgentChatPage from "./features/Chat/AgentChatPage";
// import { initializeClient, createConversation, sendMessage, listenConversation } from "./features/Chat/ClientChat";

import FavIconLogo from "./assets/img/FaviIcon-Logo.png";

// eslint-disable-next-line
import { ToastContainer, toast } from "react-toastify";
import styled from "styled-components";
import "./App.css";


import { AdminRoute } from "./routes/AdminRoute";

import { ApplicantRoute } from "./routes/ApplicantRoute";
import { EmployerRoute } from "./routes/EmployerRoute";


// const Home = lazy(() => import("./features/Home/Home"));
// const About = lazy(() => import("./features/AboutUs/About-Us"));
// const OurMission = lazy(() => import("./features/AboutUs/OurMission/Our-Mission"));
// const OurVision = lazy(() => import("./features/AboutUs/OurVision/Our-Vision"));
// const Employers = lazy(() => import("./features/Employers/Employers"));
// const Jobs = lazy(() => import("./features/Jobs/Jobs"));
// const JobDetails = lazy(() => import("./features/Jobs/JobDetails"));
// const ContactUs = lazy(() => import("./features/Contact/Contact-Us"));
// const ThankYou = lazy(() => import("./features/Contact/ThankYou"));
// const ResumeUpload = lazy(() => import("./features/ResumeUpload/Upload-Resume"));
// const Login = lazy(() => import("./features/Account/Login/Login"));
// const Register = lazy(() => import("./features/Account/Register/Register"));
// const EmailVerification = lazy(() => import('./features/Account/EmailConfirmation/EmailVerification'));
// Apply Job Form
// const ApplyJobForm = lazy(() => import("./features/Account/ApplyJob/ApplyJobForm"));
// UnAuthorized Page
const UnAuthorized = lazy(() => import('./features/UnAuthorized/UnAuthorized'));
// Password Resources
const ForgotPasswordReset = lazy(() => import("./features/Account/ForgotPasswordReset/ForgotPasswordReset"));
const ResetPassword = lazy(() => import("./features/Account/ForgotPasswordReset/ResetPassword"));





// *****************************************************************************************
const TestHome = lazy(() => import("./Pages/Home"));


const TestAdminDashboardHome = lazy(() => import('./Pages/Admin/Home'));
const JobSearchInterface = lazy(() => import('./Pages/JobSearchInterface'));

const TestLogin = lazy(() => import('./Pages/Login/Login'));
const TestRegister = lazy(() => import('./Pages/Register/Register'));

const TestAboutUs = lazy(() => import('./Pages/About/AboutUs'));
const TestContactUs = lazy(() => import('./Pages/Contact/TestContactUs'));
const WhoWeAre = lazy(() => import('./Pages/About/WhoWeAre'));
const OurLocations = lazy(() => import('./Pages/About/OurLocations'));
const ITRecruitment = lazy(() => import('./Pages/Business/ITRecruitment/ITRecruitment'));
const GovtMinistryRecruitment = lazy(() => import('./Pages/Business/GovtMinistry/GovtMinistryRecruitment'));
const HealthCareMedicalRecruitment = lazy(() => import('./Pages/Business/HealthcareMedicalRecruitment/HealthcareMedicalRecruitment'));
const ManufacturingRecruitment = lazy(() => import('./Pages/Business/ManufacturingRecruitment/ManufacturingRecruitment'));
const AdminOfficeSupportRecruitment = lazy(() => import('./Pages/Business/AdminOfficeSupportRecruitment/AdminOfficeSupportRecruitment'));
const TransportLogisticsRecruitment = lazy(() => import('./Pages/Business/TransportLogisticsRecruitment/TransportLogisticsRecruitment'));
const ConstructionInfrastructureRecruitment = lazy(() => import('./Pages/Business/ConstructionInfrastructureRecruitment/ConstructionInfrastructureRecruitment'));
const EducationRecruitment = lazy(() => import('./Pages/Education/EducationRecruitment'));
const PermanentRecruitment = lazy(() => import('./Pages/Employers/PermanentRecruitment/PermanentRecruitment'));
const TailoredSolutionsForEmployers = lazy(() => import('./Pages/Employers/TailoredSolutionsForEmployers/TailoredSolutionsForEmployers'));
const FluidWorkforce = lazy(() => import('./Pages/Employers/FluidWorkforce/FluidWorkforce'));
const ProsoftSynergiesPrivacyPolicy = lazy(() => import('./Pages/ProsoftSynergiesPrivacyPolicy/ProsoftSynergiesPrivacyPolicy'));

const AddTestJob = lazy(() => import('./Pages/Admin/Jobs/AddTestJob'));
const ManageTestJobs = lazy(() => import('./Pages/Admin/Jobs/ManageTestJobs'));

const ManageAdminJobTestQualifications = lazy(() => import('./Pages/Admin/Qualifications/ManageAdminJobTestQualifications'));
const AddTestQualification = lazy(() => import('./Pages/Admin/Qualifications/AddTestQualification'));
const ManageAdminTestWorkExperiences = lazy(() => import('./Pages/Admin/WorkExperiences/ManageAdminTestWorkExperiences'));
const AddTestWorkExperience = lazy(() => import('./Pages/Admin/WorkExperiences/AddTestWorkExperience'));
const ManageAdminTestWorkModes = lazy(() => import('./Pages/Admin/WorkModes/ManageAdminTestWorkModes'));
const AddTestWorkMode = lazy(() => import('./Pages/Admin/WorkModes/AddTestWorkMode'));
const AddTestCountry = lazy(() => import('./Pages/Admin/Countries/AddTestCountry'));
const ManageAdminJobTestCountries = lazy(() => import('./Pages/Admin/Countries/ManageAdminTestCountries'));
const AddTestProvince = lazy(() => import('./Pages/Admin/Provinces/AddTestProvince'));
const ManageAdminTestProvinces = lazy(() => import('./Pages/Admin/Provinces/ManageAdminTestProvinces'));
const AddTestSector = lazy(() => import('./Pages/Admin/Sectors/AddTestSector'));
const ManageAdminTestSectors = lazy(() => import('./Pages/Admin/Sectors/ManageAdminTestSectors'));
const AddTestSalary = lazy(() => import('./Pages/Admin/Salaries/AddTestSalary'));
const ManageAdminTestSalaries = lazy(() => import('./Pages/Admin/Salaries/ManageAdminTestSalaries'));
const AllContactUsMessages = lazy(() => import('./Pages/Admin/ContactMessages/AllContactUsMessages'));
const TestViewContactMessage = lazy(() => import('./Pages/Admin/ContactMessages/TestViewContactMessage'));
const TestAdminSubscribers = lazy(() => import('./Pages/Admin/Subscribers/TestAdminSubscribers'));
const ManageAdminTestWorkAuthorizations = lazy(() => import('./Pages/Admin/WorkAuthorizations/ManageAdminTestWorkAuthorizations'));
const AddTestWorkAuthorization = lazy(() => import('./Pages/Admin/WorkAuthorizations/AddTestWorkAuthorization'));
const AdminTestChangePassword = lazy(() => import('./Pages/Admin/Account/AdminTestChangePassword'));
// *****************************************************************************************

// Admin Resources
// const AdminDashboardHome = lazy(() => import('./admin/Home'));
// const PostJob = lazy(() => import("./admin/Jobs/PostJob"));
// const UpdateJob = lazy(() => import("./admin/Jobs/UpdateJob"));
// const DeleteJob = lazy(() => import("./admin/Jobs/DeleteJob"));
// const ManageJobs = lazy(() => import("./admin/Jobs/ManageJobs"));
// const AppliedJobs = lazy(() => import("./admin/Jobs/AppliedJobs"));
// const AddCountry = lazy(() => import("./admin/Countries/AddCountry"));
// const ManageCountries = lazy(() => import("./admin/Countries/ManageCountries"));
// const AddQualification = lazy(() => import("./admin/Qualifications/AddQualification"));
// const ManageQualifications = lazy(() => import("./admin/Qualifications/ManageQualifications"));
// const AddWorkExperience = lazy(() => import("./admin/WorkExperiences/AddWorkExperience"));
// const ManageWorkExperiences = lazy(() => import("./admin/WorkExperiences/ManageWorkExperiences"));
// const AddWorkMode = lazy(() => import("./admin/WorkModes/AddWorkMode"));
// const ManageWorkModes = lazy(() => import("./admin/WorkModes/ManageWorkModes"));
// const AddProvince = lazy(() => import("./admin/Provinces/AddProvince"));
// const ManageProvinces = lazy(() => import("./admin/Provinces/ManageProvinces"));
// const AddCity = lazy(() => import("./admin/Cities/AddCity"));
// const ManageCities = lazy(() => import("./admin/Cities/ManageCities"));
// const AddSector = lazy(() => import("./admin//Sectors/AddSector"));
// const ManageSectors = lazy(() => import("./admin/Sectors/ManageSectors"));
// const AddWorkAuthorization = lazy(() => import("./admin/WorkAuthorizations/AddWorkAuthorization"));
// const ManageWorkAuthorizations = lazy(() => import("./admin/WorkAuthorizations/ManageWorkAuthorizations"));
// const AddSalary = lazy(() => import("./admin/Salaries/AddSalary"));
// const ManageSalaries = lazy(() => import("./admin/Salaries/ManageSalaries"));
// const ManageContactMessages = lazy(() => import("./admin/ContactMessages/ManageContactMessages"));
// const ViewContactMessage = lazy(() => import("./admin/ContactMessages/ViewContactMessage"));
// const DeleteContactMessage = lazy(() => import("./admin//ContactMessages/DeleteContactMessage"));
// const AdminChangePassword = lazy(() => import("./admin/ChangePassword/ChangePassword"));
// const Subscribers = lazy(() => import("./admin//Subscribers/Subscribers"));


// Applicant Private Resources
// const ApplicantDashboardHome = lazy(() => import('./applicant/Home'));
// const ApplicantProfile = lazy(() => import("./applicant/ApplicantProfiles/ApplicantProfile"));
// const ApplicantChangePassword = lazy(() => import("./applicant/ChangePassword/ChangePassword"));
// const ProfileSetting = lazy(() => import("./applicant/ApplicantProfiles/ProfileSetting"));
// const AcademicQualification = lazy(() => import("./applicant/Education/AcademicQualification"));
// const AddEducation = lazy(() => import("./applicant/Education/AddEducation"));
// const DeleteEducation = lazy(() => import("./applicant//Education/DeleteEducation"));
// const DeleteSkill = lazy(() => import("./applicant/Skill/DeleteSkill"));
// const AddJobExperience = lazy(() => import("./applicant/Experience/AddJobExperience"));
// const DeleteApplicantExperience = lazy(() => import("./applicant/Experience/DeleteApplicatExperience"));
// const DeleteResume = lazy(() => import("./applicant/Resume/DeleteResume"));



const EmailVerification = lazy(() => import('./Pages/EmailConfirmation/PageEmailVerification'));
const ForgotPassword = lazy(() => import('./Pages/PasswordActions/ForgotPassword'));
const PasswordResetLink = lazy(() => import('./Pages/PasswordActions/PasswordResetLink'));
const PageChangePassword = lazy(() => import('./Pages/PasswordActions/ChangePassword'));
// *************************** Pages Applicant Dashboard Start *********************************************
const TestApplicantDashboard = lazy(() => import('./Pages/Applicant/ApplicantHome'));
const PageProfile = lazy(() => import('./Pages/Applicant/Profile/Profile'));
const ApplicantResumeUpload = lazy(() => import('./Pages/ResumesCV/ApplicantResumeUpload'));
// *************************** Pages Applicant Dashboard End ***********************************************


// Employer Private Resources
const EmployerDashboardHome = lazy(() => import("./employer/Home"));
const EPostJob = lazy(() => import("./employer/Jobs/PostJob"));
const EManageJobs = lazy(() => import("./employer/Jobs/EManageJobs"));
const EAppliedJobs = lazy(() => import("./employer/Jobs/EAppliedJobs"));


// Unsubscribe
const Unsubscribe = lazy(() => import("./features/Unsubscribe/Unsubscribe"));

// const Loader = ({ style }) => (
//   <div className="container text-center">
//       <div className="spinner-border" role="status" style={style}>
//           <span className="sr-only">Loading...</span>
//       </div>
//   </div>
// );

const Loader = ({ style }) => (
  <div style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    width: "100%"
  }}>
    <div className="spinner-border" role="status" style={{
      ...style,
      position: "relative",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden"
    }}>
      <span className="sr-only" style={{
        position: "absolute",
        width: "70%",
        height: "70%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1
      }}>
        <img 
          src={FavIconLogo} 
          alt="PSPL FavIcon Logo" 
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            borderRadius: "50%" 
          }}
        />
      </span>
    </div>
  </div>
);


function App() {

  const StyledContainer = styled(ToastContainer)`
        &&&.Toastify__toast-container {
        }
        .Toastify__toast {
        width: 550px !important;
        height: 200px;
        font-family: Trebuchet-ms;
        font-weight: bold;
        }
        .Toastify__toast-body {
        width: 550px !important;
        height: 200px;
        font-family: Trebuchet-ms;
        }
        .Toastify__progress-bar {    
        }
  `;
// eslint-disable-next-line
  const [auth, setAuth] = useAuth();
  // eslint-disable-next-line
  const [user, setUser] = useState({});
  const params = useParams();


const fetchRegUserById = async () => {
  try 
  {
    const { data } = await API.get(`/api/v1/users/fetchRegUserById/${params._id}`);
    setUser(data.user);
  } catch (error) {
    console.log(error);
  }
};

  // initial Registered User Details
  // Fetch Registered User Details
  // eslint-disable-next-line
useEffect(() => {
  if (params?._id) fetchRegUserById();
  // eslint-disable-next-line
}, [params?._id]);

useEffect(() => {
  const userId = JSON.parse(localStorage.getItem("userAuthDetails"));
  if (userId) {
    setUser(userId);
  }
  // eslint-disable-next-line
}, []);

  

// const [showChatWindow, setShowChatWindow] = useState(false);
// const [messages, setMessages] = useState([]);
// const [conversationId, setConversationId] = useState(null);
// const [loading, setLoading] = useState(false);
// const [showQuickReplies, setShowQuickReplies] = useState(false);
// const [showLiveAgentForm, setShowLiveAgentForm] = useState(false); 
//   const [speakToAgent, setSpeakToAgent] = useState(false); 
//   // eslint-disable-next-line
// const [userDetails, setUserDetails] = useState({ fullName: '', email: '', phoneNumber: '' });
// const [quickReplies, setQuickReplies] = useState([
//   { id: 1, label: "Search for Jobs" },
//   { id: 2, label: "Find Talent" },
//   { id: 3, label: "FAQ" },
//   { id: 4, label: "Speak to a Live Agent" },
//   { id: 5, label: "Learn About Us" },
// ]);
// const [typingStatus, setTypingStatus] = useState(false);
// const location = useLocation();
// const shouldShowChatIcon = !["/agent/chat"].includes(location.pathname); // Hide the chat icon on agent chat page
// const socket = io(process.env.BACKEND_SERVER_API, {
//     withCredentials: true,
//     // path: '/socket.io'
// });

// const handleOpenChat = async () => {
//   try {
//     if (!conversationId) {
//       console.log("Initializing Botpress conversation...");
//       await initializeClient();
//       const conversation = await createConversation();
//       setConversationId(conversation);
//     }
//     setShowChatWindow(true);
//   } catch (error) {
//     console.error("Error opening chat:", error);
//   }
// };

// const handleCloseChat = () => {
//   setShowChatWindow(false);
// };

// const handleSendMessage = async (input) => {
//   try {
//     if(!speakToAgent){
//       setMessages((prevMessages) => [...prevMessages, { content: input, role: "user" }]);
//     }
//     setLoading(true);
//     setShowQuickReplies(false);

//     if (input.trim().toLowerCase() === "speak to a live agent") {
//       const currentTime = new Date();
//       const currentHour = currentTime.getHours();
    
//       if (currentHour >= 0 && currentHour < 24) { // Between 8 AM and 6 PM
//         setLoading(false);
//         console.log("User requested to speak to a live agent.");
//         setShowLiveAgentForm(true);
//       } 
//       else {
//         setMessages((prevMessages) => [
//           ...prevMessages,
//           {
//             content: "Sorry! Live agents are only available between 8 AM and 6 PM. Please try again during those hours.",
//             role: "bot",
//           },
//         ]);
//         setShowQuickReplies(true);
//       }
//     } else {
//       setLoading(false);
//       if (speakToAgent) {
//         const messageData = {
//           chatId: conversationId,
//           sender: "user",
//           content: input,
//         };
//         socket.emit("stopUserTyping", { chatId: conversationId });
//         await API.post("/api/v1/chats/createOrAppendChat", messageData);
//         socket.emit("sendMessage", messageData);
        
//       }
//       else{
//         // Default behavior: Send message to Botpress
//         console.log(`Sending message: "${input}" to conversation ID: ${conversationId}`);
//         // eslint-disable-next-line
//         const botResponse = await sendMessage(conversationId, input);
//       }
//     }    

//   } catch (error) {
//     console.error("Error in handleSendMessage:", error);
//     setMessages((prevMessages) => [
//       ...prevMessages,
//       { content: "An error occurred. Please try again later.", role: "bot" },
//     ]);
//   }
// };

// const handleSubmitLiveAgentForm = async () => {
//   try {
//     const { fullName, email, phoneNumber } = userDetails;

//     if (!fullName || !email || !phoneNumber) {
//       setMessages((prevMessages) => [
//         ...prevMessages,
//         { content: "Please fill out all fields before submitting.", role: "bot" },
//       ]);
//       return;
//     }

//     setShowLiveAgentForm(false);
//     setLoading(true);


//     const notificationResponse = await API.post('/api/v1/liveAgent/request', {
//       userMessage: `Full Name: ${fullName}\nEmail: ${email}\nPhone: ${phoneNumber}`,
//     });

//     // Create the chat in the MongoDB database
//     const chatResponse = await API.post('/api/v1/chats/createOrAppendChat', {
//       chatId: conversationId,
//       sender: "user",
//       content: `Full Name: ${fullName}\nEmail: ${email}\nPhone: ${phoneNumber}`,
//       userDetails: {
//         name: fullName,
//         email: email,
//         phone: phoneNumber
//       }
//     });
    
//     socket.emit("newChat", chatResponse.data.chat);

//     if (notificationResponse.data.success && chatResponse.data.success) {
//       setConversationId(chatResponse.data.chat.chatId);
//       setLoading(false);
//       setMessages((prevMessages) => [
//         ...prevMessages,
//         { content: `Name: ${fullName}\nPhone: ${phoneNumber}\nEmail: ${email}`, role: "user" },
//         { content: "Your request has been sent to a live agent. Someone will contact you shortly.", role: "bot" }
//       ]);
//       setSpeakToAgent(true);
//     }
//   } catch (error) {
//     console.error("Error submitting live agent request:", error);
//     setMessages((prevMessages) => [
//       ...prevMessages,
//       { content: "An error occurred. Please try again later.", role: "bot" },
//     ]);
//     setLoading(false);
//   }
// };

// const fetchUserChatMessages = async () => {
//   try {
//     if (!conversationId) return;

//     const response = await API.get(`/api/v1/chats/fetchChatById/${conversationId}`);

//     const fetchedMessages = response.data?.chat?.messages || [];

//     const formattedMessages = fetchedMessages.map((message) => ({
//       content: message.content,
//       role: message.sender === "user" ? "user" : "bot"
//     }));

//     setMessages(formattedMessages);
//   } catch (error) {
//     console.error("Error fetching user chat messages:", error);
//   }
// };


// useEffect(() => {
//   if (conversationId) {
//     socket.emit("joinChat", conversationId);
//   }
// }, [conversationId, socket]);


// useEffect(() => {
//   let typingTimeout;

//   const handleTypingResponse = ({ chatId: typingChatId, isTyping }) => {
//     if (typingChatId === conversationId) {
//       setTypingStatus(isTyping);

//       if (isTyping) {
//         clearTimeout(typingTimeout);
//         typingTimeout = setTimeout(() => {
//           setTypingStatus(false);
//         }, 2000);
//       }
//     }
//   };
  
//   socket.on("stopAgentTypingIndicator", ({ chatId }) => {
//     if (chatId === conversationId) {
//       clearTimeout(typingTimeout);
//       setTypingStatus(false);
//     }
//   });
  
//   socket.on("typingResponse", handleTypingResponse);
  

//   return () => {
//     clearTimeout(typingTimeout);
//     socket.off("stopAgentTypingIndicator");
//     socket.off("typingResponse", handleTypingResponse);
//   };
// }, [conversationId, socket]);



// useEffect(() => {
//   socket.on("receiveMessage", (message) => {
//     if (message.chatId === conversationId) {
//       setMessages((prevMessages) => [
//         ...prevMessages,
//         {
//           content: message.content,
//           role: message.sender === "user" ? "user" : "bot"
//         }
//       ]);
//     }
//   });

//   return () => {
//     socket.off("receiveMessage");
//   };
// }, [conversationId]);



// useEffect(() => {
//   if (speakToAgent) {
//     fetchUserChatMessages();
//   }
// }, [speakToAgent]);


// useEffect(() => {
//   const setupRealtimeListener = async () => {
//     try {
//       const listener = await listenConversation(conversationId, (event) => {
//         setMessages((prevMessages) => [
//           ...prevMessages,
//           { content: event.payload.text, role: "bot" },
//         ]);
//         setLoading(false); // Stop typing indicator
//         setShowQuickReplies(true);
//       });

//       console.log("Real-time listener set up successfully:", listener);
//     } catch (error) {
//       console.error("Error setting up real-time listener:", error);
//     }
//   };

//   if (conversationId) {
//     //Welcome message
//     setMessages((prevMessages) => [
//       ...prevMessages,
//       { content: "Hello! I'm ProsBot, your Customer Support Assistant. How may I assist you today?", role: "bot" },
//     ]);

//     setShowQuickReplies(true);

//     setupRealtimeListener();
//   }
// }, [conversationId]);
  return (
    <div className="container-fluid bg-white p-0 App">
      {/* {shouldShowChatIcon && (
        <button
          onClick={handleOpenChat}
          className="position-fixed bottom-0 end-0 m-4 d-flex align-items-center justify-content-center rounded-circle text-white p-3 border-0 chatIcon"
          style={{
            fontSize: '25px',
            background: 'linear-gradient(90deg, #00c6ff, #0072ff)',
          }}
          aria-label="Open Chat"
        >
          <i className="fas fa-comments"></i>
        </button>
      )} */}

      {/* <ChatWindow
        showChatWindow={showChatWindow}
        messages={messages}
        loading={loading}
        quickReplies={quickReplies}
        showQuickReplies={showQuickReplies}
        handleCloseChat={handleCloseChat}
        handleSendMessage={handleSendMessage}
        showLiveAgentForm={showLiveAgentForm}
        userDetails={userDetails}
        setUserDetails={setUserDetails}
        handleSubmitLiveAgentForm={handleSubmitLiveAgentForm}
        typingStatus={typingStatus}
        conversationId={conversationId}
      /> */}
      
      <Suspense fallback={<Loader style={{ width: "100px", height: "100px" }} />}>
        <Routes>

          {/* ************************************** */}
          <Route path="/" element={<TestHome />} />
          <Route path="About-Us" element={<TestAboutUs />} />

          <Route path="/Search-Jobs" element={<JobSearchInterface />} />
          <Route path="/Login" element={<TestLogin />} />
          <Route path="/Register" element={<TestRegister />} />
          <Route path="/Email-Account-Verification/:id/:token" element={<EmailVerification />} />
          <Route path="/Forgot-Password-Reset-Request" element={<ForgotPassword />} />
          <Route path="/Password-Reset-Link/:id/:resetToken" element={<PasswordResetLink />} />
          <Route path="/Contact-Us" element={<TestContactUs />} />
          <Route path="Who-We-Are" element={<WhoWeAre />} />
          <Route path="Our-Locations" element={<OurLocations />} />

          <Route path="/Information-Technology-Recruitment" element={<ITRecruitment />} />
          <Route path="/Government-Ministry-Recruitment" element={<GovtMinistryRecruitment />} />
          <Route path="/Healthcare-&-Medical-Recruitment" element={<HealthCareMedicalRecruitment />} />
          <Route path="/Manufacturing-Recruitment" element={<ManufacturingRecruitment />} />
          <Route path="/Admin-&-Office-Support-Recruitment" element={<AdminOfficeSupportRecruitment />} />
          <Route path="/Transport-&-Logistics-Recruitment" element={<TransportLogisticsRecruitment />} />
          <Route path="/Construction-&-Infrastructure-Recruitment" element={<ConstructionInfrastructureRecruitment />} />
          <Route path="/Education-Recruitment" element={<EducationRecruitment />} />
          <Route path="/Permanent-Hiring-Solutions" element={<PermanentRecruitment />} />
          <Route path="/Tailored-Solutions-For-Employers" element={<TailoredSolutionsForEmployers />} />
          <Route path="/Fluid-Workforce-Solutions" element={<FluidWorkforce />} />
          <Route path="/ProsoftSynergies-Privacy-Policy" element={<ProsoftSynergiesPrivacyPolicy />} />
          {/* ************************************** */}

          {/* <Route path="/" element={<Home />} />
          <Route path="/About-Us" element={<About />} />
          <Route path="/About-Us/Our-Mission" element={<OurMission />} />
          <Route path="/About-Us/Our-Vision" element={<OurVision />} />
          <Route path="/Employers" element={<Employers />} />
          <Route path="/Browse-Jobs" element={<Jobs />} />
          <Route path="/Job-Details/:slug" element={<JobDetails />} /> */}
          

          {/* <Route path="/Contact-Us" element={<ContactUs />} />
          <Route path="/Thank-You-For-Contacting-Us" element={<ThankYou />} /> */}

          {/* <Route path="/Resume-Upload" element={<ResumeUpload />} /> */}

          {/* <Route path="/Login" element={<Login />} />
          <Route path="/Register" element={<Register />} />
          <Route path="/:id/verify/:token" element={<EmailVerification />} />

          <Route path="/Account/Forgot-Password" element={<ForgotPasswordReset />} />
          <Route path="/reset-password/:id/:resetToken" element={<ResetPassword />} /> */}

          {/* <Route path="/Admin/Home" element={<AdminHome />} />
          */}
          {/* <Route path="/Admin/Dashboard" element={<AdminDashboardHome />} /> */}
          
          {/* <Route path="/Admin/Jobs/Manage-Jobs" element={<ManageJobs />} /> 
          <Route path="/Admin/Jobs/Applied-Jobs" element={<AppliedJobs />} /> 

          <Route path="/Admin/Countries/Add-Country" element={<AddCountry />} /> 
          <Route path="/Admin/Countries/Manage-Countries" element={<ManageCountries />} /> 

          <Route path="/Admin/Sectors/Add-Sector" element={<AddSector />} /> 
          <Route path="/Admin/Sectors/Manage-Sectors" element={<ManageSectors />} /> 

          <Route path="/Admin/WorkAuthorizations/Add-Work-Authorization" element={<AddWorkAuthorization />} />
          <Route path="/Admin/WorkAuthorizations/Manage-Work-Authorizations" element={<ManageWorkAuthorizations />} /> */}


          {/* Admin Routes */}
          <Route path="/" element={<AdminRoute />}>
            {/* <Route path="/Admin/Dashboard" element={<AdminDashboardHome />} /> */}


            {/* ##################################################################### */}
            <Route path="/Admin/Dashboard" element={<TestAdminDashboardHome />} />
            <Route path="/Admin/Add-Job" element={<AddTestJob />} />
            <Route path="/Admin/Manage-Jobs" element={<ManageTestJobs />} />
            <Route path="/Admin/Manage-Qualifications" element={<ManageAdminJobTestQualifications />} />
            <Route path="/Admin/Add-Qualification" element={<AddTestQualification />} />
            <Route path="/Admin/Manage-Work-Experiences" element={<ManageAdminTestWorkExperiences />} />
            <Route path="/Admin/Add-Work-Experience" element={<AddTestWorkExperience />} />
            <Route path="/Admin/Manage-Work-Modes" element={<ManageAdminTestWorkModes />} />
            <Route path="/Admin/Add-Work-Mode" element={<AddTestWorkMode />} />
            <Route path="/Admin/Add-Country" element={<AddTestCountry />} />
            <Route path="/Admin/Manage-Countries" element={<ManageAdminJobTestCountries />} />
            <Route path="/Admin/Add-Province" element={<AddTestProvince />} />
            <Route path="/Admin/Manage-Provinces" element={<ManageAdminTestProvinces />} />
            <Route path="/Admin/Add-Sector" element={<AddTestSector />} />
            <Route path="/Admin/Manage-Sectors" element={<ManageAdminTestSectors />} />
            <Route path="/Admin/Add-Salary" element={<AddTestSalary />} />
            <Route path="/Admin/Manage-salaries" element={<ManageAdminTestSalaries />} />
            
            <Route path="/Admin/All-Contact-Us-Messages" element={<AllContactUsMessages />} />
            <Route path="/Admin/View-Contact-Message/:id" element={<TestViewContactMessage />} />
            <Route path="/Admin/Email-Subscribers" element={<TestAdminSubscribers />} />

            <Route path="/Admin/Add-Work-Authorization" element={<AddTestWorkAuthorization />} />
            <Route path="/Admin/Manage-Work-Authorizations" element={<ManageAdminTestWorkAuthorizations />} />
            <Route path="/Admin/Change-Password" element={<AdminTestChangePassword />} />
            {/* ##################################################################### */}



            {/* <Route path="/Admin/Jobs/Post-Job" element={<PostJob />} /> 
            <Route path="/Admin/Jobs/Update-Job/:slug" element={<UpdateJob />} />
            <Route path="/Admin/Jobs/Delete-Job/:slug" element={<DeleteJob />} />
            <Route path="/Admin/Jobs/Manage-Jobs" element={<ManageJobs />} /> 
            <Route path="/Admin/Jobs/Applied-Jobs" element={<AppliedJobs />} /> 

            <Route path="/Admin/Qualifications/Add-Qualification" element={<AddQualification />} />
            <Route path="/Admin/Qualifications/Manage-Qualifications" element={<ManageQualifications />} />

            <Route path="/Admin/WorkExperiences/Add-Work-Experience" element={<AddWorkExperience />} />
            <Route path="/Admin/WorkExperiences/Manage-Work-Experiences" element={<ManageWorkExperiences />} />

            <Route path="/Admin/WorkModes/Add-Work-Mode" element={<AddWorkMode />} />
            <Route path="/Admin/WorkModes/Manage-Work-Modes" element={<ManageWorkModes />} />

            <Route path="/Admin/Countries/Add-Country" element={<AddCountry />} /> 
            <Route path="/Admin/Countries/Manage-Countries" element={<ManageCountries />} /> 

            <Route path="/Admin/Provinces/Add-Province" element={<AddProvince />}  />
            <Route path="/Admin/Provinces/Manage-Provinces" element={<ManageProvinces />} />

            <Route path="/Admin/Cities/Add-City" element={<AddCity />} />
            <Route path="/Admin/Cities/Manage-Cities" element={<ManageCities />} />

            <Route path="/Admin/Sectors/Add-Sector" element={<AddSector />} /> 
            <Route path="/Admin/Sectors/Manage-Sectors" element={<ManageSectors />} /> 

            <Route path="/Admin/Salaries/Add-Salary" element={<AddSalary />} /> 
            <Route path="/Admin/Salaries/Manage-Salaries" element={<ManageSalaries />} /> 

            <Route path="/Admin/Contact-Messages/Manage-Contact-Us-Messages" element={<ManageContactMessages />} />
            <Route path="/Admin/Contact-Messages/View-Message/:id" element={<ViewContactMessage />} />
            <Route path="/Admin/Contact-Messages/Delete-Message/:id" element={<DeleteContactMessage />} />

            <Route path="/Admin/WorkAuthorizations/Add-Work-Authorization" element={<AddWorkAuthorization />} />
            <Route path="/Admin/WorkAuthorizations/Manage-Work-Authorizations" element={<ManageWorkAuthorizations />} />
            <Route path="/Account/Change-Password" element={<AdminChangePassword />} /> 
            <Route path="/Admin/Subscribers" element={<Subscribers />} />  */}
            {/* <Route path="/agent/chat" element={<AgentChatPage />} /> */}
          </Route>
          

          {/* Applicant Routes */}
          <Route path="/" element={<ApplicantRoute />}>
            {/* <Route path="/Applicant/Dashboard" element={<ApplicantDashboardHome />} />
            <Route path="/Account/Apply-Job/:slug" element={<ApplyJobForm />} />
            <Route path={`/Applicant/Profile/${auth?.user?.userId}`} element={<ApplicantProfile />} />
            <Route path="/Applicant/Change-Password" element={<ApplicantChangePassword />} /> 
            <Route path="/Applicant/Profile-Setting" element={<ProfileSetting />} /> 
            <Route path={`/Applicant/Academic-Qualification/${auth?.user?.userId}`} element={<AcademicQualification />} /> 
            <Route path="/Applicant/Add-Education/:userId" element={<AddEducation />} /> 
            <Route path="/Applicant/Delete-Education/:id" element={<DeleteEducation />} />
            <Route path="/Applicant/Delete-Skill/:id" element={<DeleteSkill />} />
            <Route path="/Applicant/Add-Job-Experience" element={<AddJobExperience />} />
            <Route path="/Applicant/Delete-Applicant-Experience/:id" element={<DeleteApplicantExperience />} />
            <Route path={`/Resume-Upload/${auth?.user?.userId}`} element={<ResumeUpload />} />
            <Route path="/Applicant/Delete-Resume/:id" element={<DeleteResume />} /> */}


            {/* @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ */}
            <Route path="/Applicant-Profile-Dashboard" element={<TestApplicantDashboard />} />
            <Route path={`/Profile/${auth?.user?.userId}`} element={<PageProfile />} />
            
            <Route path={`/Applicant-Resume-Upload/${auth?.user?.userId}`} element={<ApplicantResumeUpload />}  />
            <Route path="/User-Change-Password" element={<PageChangePassword />} />
            {/* @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ */}

          </Route>
          

          {/* Employer Routes */}
          <Route path="/" element={<EmployerRoute />}>
            <Route path="/Employer/Dashboard" element={<EmployerDashboardHome />} />
            <Route path="/Employer/Jobs/Post-Job" element={<EPostJob />} /> 
            <Route path="/Employer/Jobs/Manage-Jobs" element={<EManageJobs />} /> 
            <Route path="/Employer/Jobs/Applied-Jobs" element={<EAppliedJobs />} /> 
          </Route>
          <Route path="/PSPL-Access-Denied" element={<UnAuthorized />} />
          <Route path="/Unsubscribe" element={<Unsubscribe />} />
        </Routes>
      </Suspense>
      <StyledContainer />
    </div>
  );
}

export default App;
