import React, { useRef, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import API from '../../helpers/API';
import { useAuth } from "../../Context/AuthContext";
import { LogoutLink } from '../Logout/Logout';
import { LogoutNavbarLink } from '../Logout/LogoutNavbar';

import moment from "moment";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import $ from 'jquery';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import './assets/vendors/mdi/css/materialdesignicons.min.css';
import './assets/vendors/ti-icons/css/themify-icons.css';
import './assets/vendors/css/vendor.bundle.base.css';
import './assets/vendors/font-awesome/css/font-awesome.min.css';
import './assets/vendors/bootstrap-datepicker/bootstrap-datepicker.min.css';
import './assets/css/style.css';

// Fixed imports - import default exports
import initOffCanvas from './assets/js/off-canvas';
import misc from './assets/js/misc';
import settings from './assets/js/settings';
import todolist from './assets/js/todolist';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';

const initialState = { first_name: "", last_name: "", phone: "" };

const PageApplicantHome = () => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [messageDropdownOpen, setMessageDropdownOpen] = useState(false);

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
    if (messageDropdownOpen) setMessageDropdownOpen(false);
  };

  useEffect(() => {
    // Initialize all custom JS functionality
    initOffCanvas();
    misc(); // Call the default export function
    settings(); // Call the default export function
    todolist(); // Call the default export function
    
    // Set up Bootstrap components
    $('[data-toggle="minimize"]').on('click', function() {
      $('body').toggleClass('sidebar-icon-only');
    });

    $('[data-toggle="offcanvas"]').on('click', function() {
      $('.sidebar-offcanvas').toggleClass('active');
    });

    // Handle fullscreen toggle
    $('#fullscreen-button').on('click', function() {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    });
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  // Toggle sidebar (desktop)
  const toggleMinimize = () => {
    $('body').toggleClass('sidebar-icon-only');
  };
  // Toggle sidebar (mobile)
  const toggleMobileSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  // Handle click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (!event.target.closest('.dropdown')) {
        setProfileDropdownOpen(false);
        setMessageDropdownOpen(false);
        setNotificationDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Initialize all custom JS functionality
    initOffCanvas();
    misc();
    settings();
    todolist();
   // Set up fullscreen toggle
    const fullscreenButton = document.getElementById('fullscreen-button');
    if (fullscreenButton) {
      fullscreenButton.addEventListener('click', () => {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
      });
    }
   // Cleanup
    return () => {
      if (fullscreenButton) {
        fullscreenButton.removeEventListener('click', () => {});
      }
    };
  }, [])
  //===============================================================
  const canonicalUrl = window.location.href; // Get the current URL
  const [auth, setAuth] = useAuth();
  const [user, setUser] = useState({});
  const params = useParams();

  const navigate = useNavigate();

  const notifyErr = (msg) =>
    toast.error(msg, {
      position: "top-center",
      autoClose: 20000,
      closeOnClick: true,
      pauseOnHover: true,
      theme: "light"
    });
  const notifySucc = (msg) =>
    toast.success(msg, {
      position: "top-center",
      autoClose: 20000,
      closeOnClick: true,
      pauseOnHover: true,
      theme: "light"
    });

  const fetchRegUserById = async () => {
    try {
      const { data } = await API.get(`/users/fetchRegUserById/${params._id}`);
      setUser(data.user);
    } catch (error) {
      console.log(error);
    }
  };

  // initial Registered User Details
  useEffect(() => {
    if (params?._id) fetchRegUserById();
  }, [params?._id]);

  const handleLogout = () => {
    setAuth({ ...auth, user: null, token: "" });
    localStorage.removeItem("userAuthDetails");
    notifySucc("You have Logged Out Successfully!!!");
    navigate(location.state || "/Test-Login");
  };

  //assigning location variable
  const location = useLocation();


//   ###########################################################
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$=======================
const editorRef = useRef(null);

  const log = () => {
    if (editorRef.current) {
      console.log(editorRef.current.getContent());
    }
  };

  const [users, setUsers] = useState([]);
  const { userId } = useParams();
  const [appliedJobCount, setAppliedJobCount] = useState(0);
  const [countries, setCountries] = useState([]);
  const [countryName, setCountryName] = useState("");
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [jobsApplied, setApplicantAppliedJobs] = useState({});
  const [data, setData] = useState(initialState);
  const [job, setJob] = useState({});
  const [applied, setApplied] = useState(false);

  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [gender, setGender] = useState("");

  const [resume, setResume] = useState("");
  const [resumes, setResumes] = useState("");

  const [experiences, setExperiences] = useState([]);

  const [applicantEducations, setApplicantEducations] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [qualification, setQualification] = useState("");
  const [institution, setInstitution] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [startYear, setStartYear] = useState("");
  const [finishYear, setFinishYear] = useState("");
  const [current, setCurrent] = useState(false);

  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");

  const [designation, setDesignation] = useState([]);
  const [company, setCompany] = useState("");
  const [responsibilities, setResponsibilities] = useState("");

  const [applicantExperiences, setApplicantExperiences] = useState([]);
  const [applicantExperience, setApplicantExperience] = useState("");

  const [isChecked, setIsChecked] = useState(false);
  const [dateDisabled, setDateDisabled] = useState(false);

  const [country, setCountry] = useState("");

  const [showEQF, setShowEQF] = useState(false);

  const handleCloseEQF = () => setShowEQF(false);
  const handleShowEQF = () => setShowEQF(true);

  const [showPhotoForm, setShowPhotoForm] = useState(false);

  const handleClosePhotoForm = () => setShowPhotoForm(false);
  const handleShowPhotoForm = () => setShowPhotoForm(true);

  const [showSkillsForm, setShowSkillsForm] = useState(false);

  const handleCloseSkillsForm = () => setShowSkillsForm(false);
  const handleShowSkillsForm = () => setShowSkillsForm(true);

  const [showJEF, setShowJEF] = useState(false);

  const handleCloseJEF = () => setShowJEF(false);
  const handleShowJEF = () => setShowJEF(true);

  const [uploading, setUploading] = useState(false);

  
  
    return (
      <div className="container-scroller">
        <Helmet>
          <link rel="canonical" href={canonicalUrl} />
          <title>
            {auth?.user?.first_name && auth?.user?.last_name
            ? `${auth.user.first_name} ${auth.user.last_name}`
            : "Profile | ThinkBeyond"
            }
        </title>
          <meta name="description" content="Applicant Dashboard Home | ThinkBeyond" />
        </Helmet>
         <Navbar 
            toggleMinimize={toggleMinimize} 
            toggleMobileSidebar={toggleMobileSidebar} 
          />
        <div className="container-fluid page-body-wrapper">
        {/* Sidebar */}
          <Sidebar isOpen={sidebarOpen} />
        {/* Main Panel */}
        <div className="main-panel">
            <div className="content-wrapper">                          
              {/* Recent Tickets Table */}
              <div className="row">
                <div className="col-12 grid-margin">
                  <div className="page-header">
                    <h3 className="page-title">
                      <span className="page-title-icon bg-gradient-primary text-white me-2">
                        <i className="mdi mdi-briefcase"></i>
                      </span> Applied Jobs List
                    </h3>
                    <nav aria-label="breadcrumb">
                      <ul className="breadcrumb">
                        <li className="breadcrumb-item active" aria-current="page">
                          <span></span>Overview <i className="mdi mdi-alert-circle-outline icon-sm text-primary align-middle"></i>
                        </li>
                      </ul>
                    </nav>
                  </div>
                <div className="card">
                    <div className="card-body">
                      <h4 className="card-title">List Of Applied Jobs</h4>
                      <div className="table-responsive">
                        <table className="table">
                          <thead>
                            <tr>
                            <th>No.</th>
                            <th>Title</th>
                            <th>Qualification</th>
                            <th>Experience</th>
                            <th>Location</th>
                            <th>Work Mode</th>
                            <th>Date Applied</th>
                            <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>                          
                          </tbody>
                        </table>
                      </div>
                      <nav className="app-pagination mt-3">
                        <ul className="pagination justify-content-center">
                          <li className="page-item">
                            <button
                              className="page-link"
                            >
                              Previous
                            </button>
                          </li>
                          <li className="page-item">
                            <button
                              className="page-link"
                            >
                              Next
                            </button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            </div>                                           
            {/* Footer */}
            <Footer />
          </div>
      </div>
    </div>
  );    
};

export default PageApplicantHome;
