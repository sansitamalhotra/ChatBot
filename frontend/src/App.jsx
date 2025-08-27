//frontend/src/App.jsx
import { useUserIdleTracker } from "./hooks/useUserIdleTracker"; 
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
import { useLogout } from "./Pages/Logout/LogoutNavbar";

import FavIconLogo from "./assets/img/FaviIcon-Logo.png";

// eslint-disable-next-line
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styled from "styled-components";
import "./App.css";


import { SuperAdminRoute } from "./routes/SuperAdminRoute";
import { AdminRoute } from "./routes/AdminRoute";
import { ApplicantRoute } from "./routes/ApplicantRoute";
import { EmployerRoute } from "./routes/EmployerRoute";

// import AdminChatSession from './components/AdminChat/AdminChatSession';

const UnAuthorized = lazy(() => import('./features/UnAuthorized/UnAuthorized'));
// Password Resources
const ForgotPasswordReset = lazy(() => import("./features/Account/ForgotPasswordReset/ForgotPasswordReset"));
const ResetPassword = lazy(() => import("./features/Account/ForgotPasswordReset/ResetPassword"));
// *****************************************************************************************
const TestHome = lazy(() => import("./Pages/Home"));

const TestAdminDashboardHome = lazy(() => import('./Pages/Admin/Home'));
const SuperAdminDashboardHome = lazy(() => import('./Pages/Super-Admin/Home'));
// const AdminChatSession = lazy(() => import('./components/AdminChat/AdminChatSession'));

const AdminLiveChat = lazy(() => import('./Pages/Admin/AdminLiveChat/AdminLiveChat'));
const AdminChatList = lazy(() => import('./Pages/Admin/AdminChatList/AdminChatList'));

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
const ManageBusinessHours = lazy(() => import('./Pages/Admin/BusinessHours/ManageBusinessHours'));

// *****************************************************************************************

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
  const [user, setUser] = useState({});
  const params = useParams();
  const { handleLogout } = useLogout();

  // Fetch user by param _id if available
  useEffect(() => {
    const fetchRegUserById = async () => {
      if (!params?._id) return;
      try {
        const { data } = await API.get(`/api/v1/users/fetchRegUserById/${params._id}`);
        if (data?.user) setUser(data.user);
      } catch (error) {
        console.error(error);
      }
    };
    fetchRegUserById();
  }, [params?._id]);

  // Sync localStorage user auth details on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("userAuthDetails");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error('Failed to parse "userAuthDetails" from localStorage:', e);
      }
    }
  }, []);

  const isAdmin = auth?.user?.role === 1;

  // Initialize idle tracker only once user and auth are ready
  useUserIdleTracker({
    onAutoLogout: isAdmin ? handleLogout : undefined
  });

  return (
    <div className="container-fluid bg-white p-0 App">           
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

          {/* Admin Routes */}
          <Route path="/" element={<AdminRoute />}>
            {/* ##################################################################### */}
            <Route path="/Admin/Dashboard" element={<TestAdminDashboardHome />} />
            <Route path="admin/chat/session/:sessionId" element={<AdminLiveChat />} />
            <Route path="Admin/Chat-List" element={<AdminChatList />} />            
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

            <Route path="/Admin/Manage-Business-Hours" element={<ManageBusinessHours />} />
            {/* ##################################################################### */}
          </Route>

          {/* Super Admin Routes */}
          <Route path="/" element={<SuperAdminRoute />}>
            {/* ##################################################################### */}
            <Route path="/Super-Admin/Dashboard" element={<SuperAdminDashboardHome />} />
            <Route path="/Super-Admin/Add-Job" element={<AddTestJob />} />
            <Route path="/Super-Admin/Manage-Jobs" element={<ManageTestJobs />} />
            <Route path="/Super-Admin/Manage-Qualifications" element={<ManageAdminJobTestQualifications />} />
            <Route path="/Super-Admin/Add-Qualification" element={<AddTestQualification />} />
            <Route path="/Super-Admin/Manage-Work-Experiences" element={<ManageAdminTestWorkExperiences />} />
            <Route path="/Super-Admin/Add-Work-Experience" element={<AddTestWorkExperience />} />
            <Route path="/Super-Admin/Manage-Work-Modes" element={<ManageAdminTestWorkModes />} />
            <Route path="/Super-Admin/Add-Work-Mode" element={<AddTestWorkMode />} />
            <Route path="/Super-Admin/Add-Country" element={<AddTestCountry />} />
            <Route path="/Super-Admin/Manage-Countries" element={<ManageAdminJobTestCountries />} />
            <Route path="/Super-Admin/Add-Province" element={<AddTestProvince />} />
            <Route path="/Super-Admin/Manage-Provinces" element={<ManageAdminTestProvinces />} />
            <Route path="/Super-Admin/Add-Sector" element={<AddTestSector />} />
            <Route path="/Super-Admin/Manage-Sectors" element={<ManageAdminTestSectors />} />
            <Route path="/Super-Admin/Add-Salary" element={<AddTestSalary />} />
            <Route path="/Super-Admin/Manage-salaries" element={<ManageAdminTestSalaries />} />

            <Route path="/Super-Admin/Manage-BusinessHours" element={<ManageBusinessHours />}/>
            
            <Route path="/Super-Admin/All-Contact-Us-Messages" element={<AllContactUsMessages />} />
            <Route path="/Super-Admin/View-Contact-Message/:id" element={<TestViewContactMessage />} />
            <Route path="/Super-Admin/Email-Subscribers" element={<TestAdminSubscribers />} />

            <Route path="/Super-Admin/Add-Work-Authorization" element={<AddTestWorkAuthorization />} />
            <Route path="/Super-Admin/Manage-Work-Authorizations" element={<ManageAdminTestWorkAuthorizations />} />
            <Route path="/Super-Admin/Change-Password" element={<AdminTestChangePassword />} />
            {/* ##################################################################### */}
          </Route>          
          {/* Applicant Routes */}
          <Route path="/" element={<ApplicantRoute />}>
            {/* @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ */}
            <Route path="/Applicant-Profile-Dashboard" element={<TestApplicantDashboard />} />
            {/* <Route path={`/Profile/${auth?.user?.userId}`} element={<PageProfile />} /> */}
            <Route path="/Applicant/Profile/:userId" element={<PageProfile />} />
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
