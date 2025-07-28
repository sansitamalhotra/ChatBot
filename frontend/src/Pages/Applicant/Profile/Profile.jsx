import React, { useRef, useEffect, useState, useCallback } from "react";
import { Helmet } from "react-helmet";
import { Link, useNavigate, useParams } from 'react-router-dom';
import API from '../../../helpers/API';
import { useAuth } from "../../../Context/AuthContext";

import moment from "moment";

import { Editor } from "@tinymce/tinymce-react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";

import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import Checkbox from "@mui/material/Checkbox";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import $ from 'jquery';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import '../assets/vendors/mdi/css/materialdesignicons.min.css';
import '../assets/vendors/ti-icons/css/themify-icons.css';
import '../assets/vendors/css/vendor.bundle.base.css';
import '../assets/vendors/font-awesome/css/font-awesome.min.css';
import '../assets/vendors/bootstrap-datepicker/bootstrap-datepicker.min.css';
import './style.css';
import './Profile.css';
import '../assets/css/style.css';

// Fixed imports - import default exports
import initOffCanvas from '../assets/js/off-canvas';
import misc from '../assets/js/misc';
import settings from '../assets/js/settings';
import todolist from '../assets/js/todolist';

import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';


const initialState = { first_name: "", last_name: "", phone: "" };
const Profile = () => {
  
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
//   ===================================================
    const canonicalUrl = window.location.href; // Get the current URL
    const editorRef = useRef(null);

    const log = () => {
        if (editorRef.current) {
        console.log(editorRef.current.getContent());
        }
    };

    const [auth, setAuth] = useAuth();
    const params = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState({});
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

    // %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
    const fileInputRef = useRef(null);

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
      const { data } = await API.get(`/api/v1/users/fetchRegUserById/${params._id}`);
      setUser(data.user);
      
      // Update auth context to ensure persistent photo across refreshes
      if (data.user.photo) {
        setAuth(prevAuth => ({
          ...prevAuth,
          user: {
            ...prevAuth.user,
            photo: data.user.photo
          }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      notifyErr('Failed to load user profile');
    }
  };

  useEffect(() => {
    if (params?._id) fetchRegUserById();
  }, [params?._id]);

  
  
    const fetchRegUserCountryName = async () => {
      try {
        const response = await API.get(`/api/v1/users/fetchRegUserCountryName/${params._id}/country`);
        const data = await response.json();
        setCountryName(data);
      } catch (error) {
        console.log("Error in Fetching Registered User Country Name", error);
      }
    };
  
    useEffect(() => {
      if (params?._id) fetchRegUserCountryName();
    }, [params?._id]);
  
    useEffect(() => {
      if (params?._id) fetchAppliedJobsCountByApplicants();
    }, [params?._id]);
  
    const fetchAppliedJobsCountByApplicants = async () => {
      try {
        const response = await API.get( `/api/v1/users/fetchAppliedJobsCountByApplicants/${params._id}/appliedJobsCount`);
        const data = await response.json();
        setAppliedJobCount(data.appliedJobCount);
      } catch (error) {
        console.log(
          "Error in Fetching Registered User Applied Jobs Count",
          error
        );
      }
    };
  
    useEffect(() => {
      fetchApplicantAppliedJobs();
    }, []);
  
    const fetchApplicantAppliedJobs = async () => {
      try {
        const response = await API.get("/api/v1/apply/appliedApplicants");
        const appliedJobs = response.data; 
        setApplicantAppliedJobs(appliedJobs);
      } catch (error) {
        console.log(error);
      }
    };
  
    const handleCheckboxChange = (event) => {
      setIsChecked(event.target.checked);
      setCurrent(event.target.checked);
      setDateDisabled(event.target.checked);
    };
  
    useEffect(() => {
      fetchLoggedInUserById();
      fetchApplicantCountries();
      fetchQualifications();
      fetchEducationHistory();
      fetchJobExperiences();
      fetchApplicantSkills();
      fetchResumes();
    }, []);
    const fetchQualifications = async () => {
      try {
        const { data } = await API.get("/api/v1/qualification/fetchQualifications");;
        if (data?.success) {
          setQualifications(data?.qualifications);
        }
      } catch (error) {
        console.log(error);
        notifyErr(
          "Oppss!!, FAILED, Something went Wrong Retrieving all Qualifications"
        );
      }
    };
  
    const fetchLoggedInUserById = async () => {
      try {
        setLoading(true);
        const response = await API.get(
          `/api/v1/applicant/loggedInUser/${params.userId}`
        );
        const { user: userData } = response.data;
        setUser(userData);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
        notifyErr(error.response.data.message);
      }
    };
    const fetchApplicantCountries = async () => {
      try {
        const { data } = await API.get("/api/v1/applicant/countries");
        if (data?.success) {
          setCountries(data?.country);
        }
      } catch (error) {
        console.log(error);
        notifyErr(
          "Oppss!!, FAILED, Something went Wrong Retrieving all Countries"
        );
      }
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const formData = new FormData();
        formData.append("qualification", qualification);
        formData.append("institution", institution);
        formData.append("fieldOfStudy", fieldOfStudy);
        formData.append("startYear", startYear);
        formData.append("finishYear", finishYear);
        formData.append("current", current);
        formData.append("country", country);
        const config = {
          headers: {
            "Content-Type": "application/json"
          }
        };
  
        const response = await API.post(
          "/api/v1/applicant/add-education",
          formData,
          config
        );
        notifySucc(response.data.message);
        setQualification("");
        setInstitution("");
        setFieldOfStudy("");
        setStartYear("");
        setFinishYear("");
        setCountry("");
        setCurrent("");
        navigate(0);
      } catch (error) {
        console.error("Failed to Add New Education", error);
        notifyErr(
          "Oops! Something went wrong. Failed to add new education qualification."
        );
      }
    };
  
    const fetchEducationHistory = async () => {
      try {
        setLoading(true);
        const response = await API.get(
          `/api/v1/applicant/education-history/${params.userId}`
        );
        setApplicantEducations(response.data.result);
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
        notifyErr(error.response.data.message);
      }
    };
  
    const handleJExperienceSubmit = async (e) => {
      e.preventDefault();    
      try {
          const formData = new FormData();
          formData.append('designation', designation);
          formData.append('company', company);
          formData.append('responsibilities', responsibilities);
          formData.append('startYear', startYear);
          formData.append('finishYear', finishYear);
          formData.append('current', current);
          formData.append('country', country);    
          const config = {
              headers: {
                  "Content-Type": "application/json",
              },
          };    
          const response = await API.post('/api/v1/applicant/add-experience', formData, config);
          notifySucc(response.data.message);
          setDesignation("");
          setCompany("");
          setResponsibilities("");
          setStartYear("");
          setFinishYear("");
          setCountry("");
          setCurrent("");
          navigate(0);
  
      } catch (error) {
          console.error('Failed to Add New Education', error);
          notifyErr("Oops! Something went wrong. Failed to add new Job Experience.");
      }
    };
  
    const fetchJobExperiences = async () => {
      try {
        setLoading(true);
        const response = await API.get(`/api/v1/applicant/job-exerience/${params.userId}}`);
        setApplicantExperiences(response.data.result);
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
        notifyErr(error.response.data.message);
      }
    };
  
    const handleUpdateSkills = async (e) => {
      e.preventDefault();
      try {
        const config = {
          headers: {
            "Content-Type": "application/json"
          }
        };
        // const response = await API.post('/api/v1/applicant/add-skills',{ skill: newSkill }, config );
        const response = await API.post(
          "/api/v1/applicant/add-skills",
          { skills: newSkill.split(",") },
          config
        );
        if (response.data.success) {
          notifySucc(response.data.message);
          setSkills([...skills, ...response.data.newSkills]);
          setNewSkill("");
          navigate(0); // Define the navigate function or remove this line if not needed
        }
      } catch (error) {
        console.error(error);
        notifyErr(error.response.data.message);
      }
    };
  
    const fetchApplicantSkills = async () => {
      try {
        setLoading(true);
        const response = await API.get(`/api/v1/applicant/skills/${params.userId}`);
        setSkills(response.data.result);
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
        notifyErr(error.response.data.message);
      }
    };
  
    const fetchResumes = async () => {
      try {
        setLoading(true);
        const response = await API.get(
          `/api/v1/resume/applicant-resumes/${params.userId}`
        );
        setResumes(response.data.result);
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
        notifyErr(error.response.data.message);
      }
    };
  
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("userId")) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
  }, []);

    
//  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

const changeUserPhoto = async (e) => {
  const file = e.target.files[0];    
  // Comprehensive file validation
  if (!file) return notifyErr("No Photo was Uploaded");    
  const validations = [
    {
      check: file.size > 1024 * 1024,
      message: "Photo is too Large (Max 1MB)"
    },
    {
      check: !['image/jpeg', 'image/png', 'image/jpg'].includes(file.type),
      message: "Kindly Upload a valid Photo (JPEG/PNG/JPG)"
    }
  ];
  const failedValidation = validations.find(val => val.check);
  if (failedValidation) return notifyErr(failedValidation.message);
  try {
    setLoading(true);    
    // Upload photo
    const formData = new FormData();
    formData.append("photo", file);    
    const res = await API.post("/api/v1/photo/upload_photo", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    // Update photo in backend
    await API.post("/api/v1/photo/update_user_photo", { photoUrl: res.data.url });
    
    // Update auth context and local state
    const updatedUser = {
      ...auth.user,
      photo: res.data.url
    };
    setAuth({
      ...auth,
      user: updatedUser
    });
    setUser(prevUser => ({
      ...prevUser,
      photo: res.data.url
    }));
    
    // Retrieve existing userAuthDetails from localStorage
    const storedAuthDetails = JSON.parse(localStorage.getItem("userAuthDetails"));
    
    // Create updated userAuthDetails with new photo
    const updatedAuthDetails = {
      ...storedAuthDetails,
      user: {
        ...storedAuthDetails.user,
        photo: res.data.url
      }
    };
    
    // Update localStorage with comprehensive user details
    localStorage.setItem("userAuthDetails", JSON.stringify(updatedAuthDetails));
    
    // Optional: Keep userPhoto as a backup
    localStorage.setItem('userPhoto', res.data.url);
    
    notifySucc("Successfully Changed Account Photo!");
  } catch (err) {
    notifyErr(err.response?.data?.msg || "Photo upload failed");
  } finally {
    setLoading(false);
  }
};

  const handlePhotoClick = () => {
    fileInputRef.current.click();
  };
  
// Render profile details helper function
const renderProfileDetail = (label) => {
  switch (label) {
    case 'Fullname':
      return `${auth.user?.firstname || ''} ${auth.user?.lastname || ''}`;
    case 'Email':
      return auth.user?.email || 'N/A';
    case 'Phone':
      return auth.user?.phone || 'Not provided';
    case 'Account Status':
      // Defensive check for user and isVerified
      return user && user.isVerified ? 'Verified' : 'Unverified';
    case 'Applied Jobs':
      return user && user.appliedJobs?.length ? user.appliedJobs.length : 0;
    case 'Date Joined':
      return user && user.registeredDate ? moment(user.registeredDate).format("MMMM Do, YYYY") : 'N/A';
    case 'Location':
      return user && user.country?.countryName ? user.country.countryName : 'Not specified';
    default:
      return '';
  }
};

// =========================
const handleAddExperienceSubmit = async (e) => {
    e.preventDefault();    
    try {
        const formData = new FormData();
        formData.append('designation', designation);
        formData.append('company', company);
        formData.append('responsibilities', responsibilities);
        formData.append('startYear', startYear);
        formData.append('finishYear', finishYear);
        formData.append('current', current);
        formData.append('country', country);    
        const config = {
            headers: {
                "Content-Type": "application/json",
            },
        };    
        const response = await API.post('/api/v1/applicant/add-experience', formData, config);
        notifySucc(response.data.message);
        setDesignation("");
        setCompany("");
        setResponsibilities("");
        setStartYear("");
        setFinishYear("");
        setCountry("");
        setCurrent("");
        navigate(0);

    } catch (error) {
        console.error('Failed to Add New Education', error);
        notifyErr("Oops! Something went wrong. Failed to add new Job Experience.");
    }
};


  
  return(
        <>
          <div className="container-scroller">
            <Helmet>
                <link rel="canonical" href={canonicalUrl} />
                <title>
                  {auth?.user?.firstname && auth?.user?.lastname
                    ? `${auth.user.firstname} ${auth.user.lastname}`
                    : "Profile | ThinkBeyond"}
                </title>
                <meta
                  name="description"
                  content={`${auth?.user?.firstname || ""} ${auth?.user?.lastname || ""} Profile | ThinkBeyond`}
                />
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
                  <div className="row">
                    <div className="col-12 grid-margin">
                      <div className="page-header">
                        <h3 className="page-title">
                          <span className="page-title-icon bg-gradient-primary text-white me-2">
                            <i className="mdi mdi-account-alert"></i>
                          </span> {auth?.user?.firstname} {auth?.user?.lastname} Account Details
                        </h3>
                        <nav aria-label="breadcrumb">
                          <ul className="breadcrumb">
                            <li className="breadcrumb-item active" aria-current="page">
                              <span></span>Overview <i className="mdi mdi-alert-circle-outline icon-sm text-primary align-middle"></i>
                            </li>
                          </ul>
                        </nav>
                      </div>                      
                    </div>
                    <div className="col-12 col-lg-12 mb-4">
                      <div className="app-card app-card-account shadow-sm d-flex flex-column align-items-start">
                        <div className="app-card-header p-3 border-bottom-0">
                          <div className="row align-items-center gx-3">
                            <div className="col-auto">
                              <div className="app-icon-holder">
                                <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                  <path fill-rule="evenodd" d="M17 10v1.126c.367.095.714.24 1.032.428l.796-.797 1.415 1.415-.797.796c.188.318.333.665.428 1.032H21v2h-1.126c-.095.367-.24.714-.428 1.032l.797.796-1.415 1.415-.796-.797a3.979 3.979 0 0 1-1.032.428V20h-2v-1.126a3.977 3.977 0 0 1-1.032-.428l-.796.797-1.415-1.415.797-.796A3.975 3.975 0 0 1 12.126 16H11v-2h1.126c.095-.367.24-.714.428-1.032l-.797-.796 1.415-1.415.796.797A3.977 3.977 0 0 1 15 11.126V10h2Zm.406 3.578.016.016c.354.358.574.85.578 1.392v.028a2 2 0 0 1-3.409 1.406l-.01-.012a2 2 0 0 1 2.826-2.83ZM5 8a4 4 0 1 1 7.938.703 7.029 7.029 0 0 0-3.235 3.235A4 4 0 0 1 5 8Zm4.29 5H7a4 4 0 0 0-4 4v1a2 2 0 0 0 2 2h6.101A6.979 6.979 0 0 1 9 15c0-.695.101-1.366.29-2Z" clip-rule="evenodd"/>
                                </svg>                               
                              </div>
                            </div>
                            <div className="col-auto">
                              <h4 className="app-card-title">{auth?.user?.firstname} {auth?.user?.lastname} Profile</h4>
                            </div>
                          </div>
                        </div>
                         <div className="app-card-body px-4 w-100">
                            {['Profile', 'Fullname', 'Email', 'Phone', 'Account Status', 'Applied Jobs', 'Date Joined', 'Location'].map((label, index) => (
                            <div className="item border-bottom py-3" key={index}>
                              <div className="row justify-content-between align-items-center">
                                 <div className="col-auto">
                                    <div className="item-label mb-2">
                                      <strong>{label}</strong>
                                    </div>
                                    <div className="item-data">
                                    {label === 'Profile' ? (
                                        <div 
                                          className={`profile-photo-wrapper ${loading ? 'loading' : ''}`} 
                                          onClick={handlePhotoClick}
                                        >
                                          <img 
                                              className="profile-image" 
                                              src={auth?.user?.photo ? 
                                                  (auth.user.photo.startsWith('/uploads/userAvatars/') ? 
                                                      `${process.env.REACT_APP_API_URL}${auth.user.photo}` : 
                                                      auth.user.photo) : 
                                                  user?.photo || 'https://cdn.iconscout.com/icon/free/png-512/free-account-120-267516.png?f=webp&w'} // Fallback to a default photo if none exists
                                              alt={`${auth?.user?.firstname} ${auth?.user?.lastname}`}
                                              aria-label={`${auth?.user?.firstname} ${auth?.user?.lastname}`}
                                              role="button"
                                              style={{borderRadius: "50%"}}
                                            />
                                          <span>
                                            <p>Change Photo</p>
                                            <input
                                              type="file"
                                              ref={fileInputRef}
                                              style={{ display: "none" }}
                                              name="photo"
                                              accept="image/jpeg,image/png,image/jpg"
                                              onChange={changeUserPhoto}
                                            />
                                          </span>
                                        </div>
                                      ) : renderProfileDetail(label, auth, user)}
                                    </div>
                                 </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="app-card-footer p-4 mt-auto">                         
                          <Button className="rounded-0 me-2">
                            <i className="fas fa-edit"></i> Update Profile
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-lg-12 mb-4">
                      <div className="app-card app-card-account shadow-sm d-flex flex-column align-items-start">
                        <div className="app-card-header p-3 border-bottom-0">
                          <div className="row align-items-center gx-3">
                            <div className="col-auto">
                              <div className="app-icon-holder">
                                <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.6144 7.19994c.3479.48981.5999 1.15357.5999 1.80006 0 1.6569-1.3432 3-3 3-1.6569 0-3.00004-1.3431-3.00004-3 0-.67539.22319-1.29865.59983-1.80006M6.21426 6v4m0-4 6.00004-3 6 3-6 2-2.40021-.80006M6.21426 6l3.59983 1.19994M6.21426 19.8013v-2.1525c0-1.6825 1.27251-3.3075 2.95093-3.6488l3.04911 2.9345 3-2.9441c1.7026.3193 3 1.9596 3 3.6584v2.1525c0 .6312-.5373 1.1429-1.2 1.1429H7.41426c-.66274 0-1.2-.5117-1.2-1.1429Z"/>
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="app-card-body px-4 w-100">
                          <div className="appcontent">
                            <h1 className="app-page-title mb-10">
                              <i class="fas fa-graduation-cap stroke-transparent me-2"></i>
                              Education History
                            </h1>
                            <ul>
                              <li>
                                {applicantEducations.length > 0 ? (
                                  applicantEducations.map((q) => {
                                    return (
                                      <li key={q._id} className="mb-5">
                                        <hr />
                                        <p className="tags">
                                          {q.qualification?.qualificationName} |{" "}
                                          {q.institution} | {q.country?.country_name}
                                          <br />
                                          <span>
                                            {q.fieldOfStudy} |{" "}
                                            <span>
                                              {moment(q.startYear).format(
                                                "MMMM Do, YYYY"
                                              )}
                                              {" - "}
                                              {q.finishYear === null && q.current !== null
                                                ? (q.current = "Present")
                                                : q.finishYear === null &&
                                                    q.current === null
                                                  ? "No date available"
                                                  : moment(q.finishYear).format(
                                                      "MMMM Do, YYYY"
                                                    )}
                                            </span>
                                          </span>
                                          <div className="d-flex justify-content-end actionicons">
                                            <Link
                                              className="d-block me-3"
                                              to={`/Applicant/Academic-Qualification/Update/${q._id}`}
                                            >
                                              <i className="fas fa-pencil stroke-transparent-blue"></i>
                                            </Link>
                                            <Link
                                              className="d-block"
                                              to={`/Applicant/Delete-Education/${q._id}`}
                                            >
                                              <i className="fas fa-trash text-danger"></i>
                                            </Link>
                                          </div>
                                        </p>
                                      </li>
                                    );
                                  })
                                ) : (
                                  <li>No Education History Updated Yet.</li>
                                )}
                              </li>
                            </ul>
                            <Button onClick={handleShowEQF} className="rounded-0">
                              <i className="fas fa-plus"></i> Add new
                            </Button>
                            <div className="d-flex">
                              {/* Education Qualification Form Starts ========================== */}
                              <Modal
                                show={showEQF}
                                onHide={handleCloseEQF}
                                size="lg"
                                aria-labelledby="contained-modal-title-vcenter"
                                centered
                              >
                                <div className="position-relative mb-3">
                                  <div className="row g-3 justify-content-center">
                                    <div className="col-auto">
                                      <h1 className="app-page-title mb-0">
                                        Add Educational Qualification
                                      </h1>
                                    </div>
                                  </div>
                                </div>
                                <Modal.Header closeButton>
                                  <div className="position-relative mb-3">
                                    <div className="row g-3 justify-content-between">
                                      <div className="col-auto">
                                        <h1 className="app-page-title mb-0">
                                          Add Educational Qualification
                                        </h1>
                                      </div>
                                    </div>
                                  </div>
                                </Modal.Header>
                                <Modal.Body className="EQF">
                                  <div className="app-card app-card-notification shadow-sm mb-4">
                                    <div className="app-card-body p-4">
                                      <div className="notification-content">
                                        <form onSubmit={handleSubmit}>
                                          <div className="col-md-9 mx-auto">
                                            <div className="md-form mb-4">
                                              <label
                                                htmlFor="qualificationId"
                                                className="mb-3"
                                              >
                                                Education Qualification Type:{" "}
                                              </label>
                                              <div className="form-wrapper">
                                                <select
                                                  class="form-control qualifications rounded-0"
                                                  name="qualification"
                                                  value={qualification}
                                                  onChange={(e) =>
                                                    setQualification(e.target.value)
                                                  }
                                                >
                                                  <option>
                                                    Select Qualification Type
                                                  </option>
                                                  {qualifications.map((q) => {
                                                    return (
                                                      <option key={q._id} value={q._id}>
                                                        {q.qualificationName}
                                                      </option>
                                                    );
                                                  })}
                                                </select>
                                              </div>
                                            </div>
                                            <div className="md-form mb-4">
                                              <label
                                                htmlFor="institution"
                                                className="mb-3"
                                              >
                                                Institution Name:
                                              </label>
                                              <input
                                                type="text"
                                                id="institution"
                                                className="form-control rounded-0"
                                                name="institution"
                                                value={institution}
                                                onChange={(e) =>
                                                  setInstitution(e.target.value)
                                                }
                                              />
                                            </div>
                                            <div className="md-form mb-4">
                                              <label
                                                htmlFor="fieldOfStudy"
                                                className="mb-3"
                                              >
                                                Field of Study:
                                              </label>
                                              <input
                                                type="text"
                                                id="fieldOfStudy"
                                                className="form-control rounded-0"
                                                name="fieldOfStudy"
                                                value={fieldOfStudy}
                                                onChange={(e) =>
                                                  setFieldOfStudy(e.target.value)
                                                }
                                              />
                                            </div>
                                            <div className="row">
                                              <div className="col-md-5">
                                                <div class="md-form mb-4">
                                                  <label
                                                    htmlFor="fieldofstudy"
                                                    className="mb-3"
                                                  >
                                                    Start Year:
                                                  </label>
                                                  <LocalizationProvider
                                                    dateAdapter={AdapterDayjs}
                                                  >
                                                    <DemoContainer
                                                      components={[
                                                        "DatePicker",
                                                        "DatePicker"
                                                      ]}
                                                    >
                                                      <DatePicker
                                                        label="Start Year"
                                                        value={startYear}
                                                        onChange={(value) =>
                                                          setStartYear(value)
                                                        }
                                                      />
                                                    </DemoContainer>
                                                  </LocalizationProvider>
                                                </div>
                                              </div>
                                              <div className="col-md-5">
                                                <div class="md-form mb-4">
                                                  <label
                                                    htmlFor="fieldofstudy"
                                                    className="mb-3"
                                                  >
                                                    Finish Year:
                                                  </label>
                                                  <LocalizationProvider
                                                    dateAdapter={AdapterDayjs}
                                                  >
                                                    <DemoContainer
                                                      components={[
                                                        "DatePicker",
                                                        "DatePicker"
                                                      ]}
                                                    >
                                                      <DatePicker
                                                        label="Finish Year"
                                                        disabled={dateDisabled}
                                                        value={finishYear}
                                                        onChange={(value) =>
                                                          setFinishYear(value)
                                                        }
                                                      />
                                                    </DemoContainer>
                                                  </LocalizationProvider>
                                                </div>
                                              </div>
                                              <div className="col-md-2">
                                                <div className="md-form mb-10">
                                                  <label
                                                    htmlFor="current"
                                                    className="mb-3"
                                                  >
                                                    Present
                                                  </label>
                                                  <Checkbox
                                                    label="Solid"
                                                    value={current}
                                                    variant="solid"
                                                    checked={isChecked}
                                                    onChange={handleCheckboxChange}
                                                  />
                                                </div>
                                              </div>
                                            </div>
                                            <div className="md-form mb-4">
                                              <label htmlFor="country" className="mb-3">
                                                Country:{" "}
                                              </label>
                                              <div className="form-wrapper">
                                                <select
                                                  class="form-control qualifications rounded-0"
                                                  name="country"
                                                  value={country}
                                                  onChange={(e) =>
                                                    setCountry(e.target.value)
                                                  }
                                                >
                                                  <option>Select Country</option>
                                                  {countries.map((ac) => {
                                                    return (
                                                      <option key={ac._id} value={ac._id}>
                                                        {ac.country_name} {" | "}{" "}
                                                        {ac.country_code}
                                                      </option>
                                                    );
                                                  })}
                                                </select>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="text-center mt-5">
                                            <button
                                              type="submit"
                                              className="btn btn-primary rounded-0"
                                            >
                                              <i className="fas fa-plus"></i> Add New
                                            </button>
                                          </div>
                                        </form>
                                      </div>
                                    </div>
                                  </div>
                                </Modal.Body>
                                <Modal.Footer>
                                  <Button
                                    variant="outline-danger"
                                    className="rounded-0"
                                    onClick={handleCloseEQF}
                                  >
                                    Close
                                  </Button>
                                </Modal.Footer>
                              </Modal>
                              {/* Education Qualification Form Ends ========================== */}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-lg-12 mb-4">
                      <div className="app-card app-card-account shadow-sm d-flex flex-column align-items-start">
                        <div className="app-card-header p-3 border-bottom-0">
                          <div className="row align-items-center gx-3">
                            <div className="col-auto">
                              <div className="app-icon-holder">
                                <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                  <path fill-rule="evenodd" d="M10 2a3 3 0 0 0-3 3v1H5a3 3 0 0 0-3 3v2.382l1.447.723.005.003.027.013.12.056c.108.05.272.123.486.212.429.177 1.056.416 1.834.655C7.481 13.524 9.63 14 12 14c2.372 0 4.52-.475 6.08-.956.78-.24 1.406-.478 1.835-.655a14.028 14.028 0 0 0 .606-.268l.027-.013.005-.002L22 11.381V9a3 3 0 0 0-3-3h-2V5a3 3 0 0 0-3-3h-4Zm5 4V5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v1h6Zm6.447 7.894.553-.276V19a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-5.382l.553.276.002.002.004.002.013.006.041.02.151.07c.13.06.318.144.557.242.478.198 1.163.46 2.01.72C7.019 15.476 9.37 16 12 16c2.628 0 4.98-.525 6.67-1.044a22.95 22.95 0 0 0 2.01-.72 15.994 15.994 0 0 0 .707-.312l.041-.02.013-.006.004-.002.001-.001-.431-.866.432.865ZM12 10a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2H12Z" clip-rule="evenodd"/>
                                </svg>
                              </div>
                            </div>
                            <div className="col-auto">
                              <h4 className="app-card-title">Experience</h4>
                            </div>
                          </div>
                        </div>
                        <div className="app-card-body px-4 w-100">
                          <div className="appcontent">
                              <ul>
                                <li>
                                  {applicantExperiences.length > 0 ? (
                                    applicantExperiences.map((e) => {
                                      return (
                                        <li key={e._id} className="mb-4">
                                          <p className="tags">
                                            {e.designation}
                                            <br />
                                            <span>
                                              {e.company} , {e.country?.country_name} |{" "}
                                              <span>
                                                {moment(e.startYear).format(
                                                  "MMMM Do, YYYY"
                                                )}
                                                {" - "}
                                                {e.finishYear === null && e.current !== null
                                                  ? (e.current = "Present")
                                                  : e.finishYear === null &&
                                                      e.current === null
                                                    ? "No date available"
                                                    : moment(e.finishYear).format(
                                                        "MMMM Do, YYYY"
                                                      )}
                                              </span>
                                            </span>
                                            <div className="d-flex justify-content-end actionicons">
                                              <Link
                                                className="d-block me-3"
                                                to={`/Applicant/Applicant-Experience/Update/${e._id}`}
                                              >
                                                <i className="fas fa-pencil stroke-transparent-blue"></i>
                                              </Link>
                                              <Link
                                                className="d-block"
                                                to={`/Applicant/Delete-Applicant-Experience/${e._id}`}
                                              >
                                                <i className="fas fa-trash text-danger"></i>
                                              </Link>
                                            </div>
                                          </p>
                                        </li>
                                      );
                                    })
                                  ) : (
                                    <li>No Job Experience Updated Yet.</li>
                                  )}
                                </li>
                              </ul>
                              <Button onClick={handleShowJEF} className="rounded-0 me-2">
                                <i className="fas fa-plus"></i> Add New
                              </Button>
                              <div className="d-flex">
                                {/* Applicant Job Experience Form Starts ======================================= */}
                                <Modal
                                  show={showJEF}
                                  onHide={handleCloseJEF}
                                  size="lg"
                                  aria-labelledby="contained-modal-title-vcenter"
                                  centered
                                >
                                  <Modal.Header closeButton>
                                    <div className="position-relative mb-3">
                                      <div className="row g-3 justify-content-between">
                                        <div className="col-auto">
                                          <h1 className="app-page-title mb-0">
                                            Add Job Experience
                                          </h1>
                                        </div>
                                      </div>
                                    </div>
                                  </Modal.Header>
                                  <Modal.Body className="JEF">
                                    <div className="app-card-body p-4">
                                      <div className="notification-content">
                                        <div className="position-relative mb-5">
                                          <div className="row g-3 justify-content-center">
                                            <div className="col-auto">
                                              <h1 className="app-page-title mb-0">
                                                Add Job Experiences
                                              </h1>
                                            </div>
                                          </div>
                                        </div>
                                        <form onSubmit={handleJExperienceSubmit}>
                                          <div className="col-md-9 mx-auto">
                                            <div className="md-form mb-4">
                                              <label htmlFor="designation" className="mb-3">
                                                Designation:{" "}
                                              </label>
                                              <div className="form-wrapper">
                                                <input
                                                  type="text"
                                                  id="designation"
                                                  className="form-control rounded-0"
                                                  name="designation"
                                                  value={designation}
                                                  onChange={(e) =>
                                                    setDesignation(e.target.value)
                                                  }
                                                />
                                              </div>
                                            </div>
                                            <div className="md-form mb-4">
                                              <label htmlFor="company" className="mb-3">
                                                Company Name:
                                              </label>
                                              <input
                                                type="text"
                                                id="company"
                                                className="form-control rounded-0"
                                                name="company"
                                                value={company}
                                                onChange={(e) => setCompany(e.target.value)}
                                              />
                                            </div>
                                            <div className="md-form mb-4">
                                              <label
                                                htmlFor="responsibilities"
                                                className="mb-3"
                                              >
                                                Responsibilities:
                                              </label>
                                              <Editor
                                                apiKey="yfz87enhl3qfafg5tw4xjj63zww0krvpqtkxbfn6nhc69f3u"
                                                onInit={(evt, editor) =>
                                                  (editorRef.current = editor)
                                                }
                                                initialValue=""
                                                init={{
                                                  selector: "textarea#full-featured",
                                                  height: 500,
                                                  menubar: true,
                                                  plugins:
                                                    "searchreplace, autolink, directionality, visualblocks, visualchars, image, link, media, codesample, table, charmap, pagebreak, nonbreaking, anchor, insertdatetime, advlist, lists, wordcount, help, charmap, emoticons, autosave preview importcss tinydrive searchreplace autolink autosave save directionality visualblocks visualchars fullscreen image link media codesample table charmap pagebreak nonbreaking anchor insertdatetime advlist lists wordcount help charmap quickbars emoticons",
                                                  mobile: {
                                                    plugins:
                                                      "preview powerpaste casechange importcss tinydrive searchreplace autolink autosave save directionality visualblocks visualchars fullscreen image link media codesample table charmap pagebreak nonbreaking anchor tableofcontents insertdatetime advlist lists wordcount help charmap quickbars emoticons"
                                                  },
                                                  menu: {
                                                    tc: {
                                                      title: "Comments",
                                                      items:
                                                        "addcomment showcomments deleteallconversations"
                                                    }
                                                  },
                                                  menubar:
                                                    "file edit view insert format tools table tc help",
                                                  toolbar:
                                                    "undo redo | revisionhistory | aidialog aishortcuts | blocks fontsizeinput | bold italic | align numlist bullist | link image | table math media pageembed | lineheight  outdent indent | strikethrough forecolor backcolor formatpainter removeformat | charmap emoticons checklist | code fullscreen preview | save print | pagebreak anchor codesample footnotes mergetags | addtemplate inserttemplate | addcomment showcomments | ltr rtl casechange | spellcheckdialog a11ycheck",
                                                  autosave_ask_before_unload: true,
                                                  autosave_interval: "30s",
                                                  autosave_prefix: "{path}{query}-{id}-",
                                                  autosave_restore_when_empty: false,
                                                  autosave_retention: "2m",
                                                  image_advtab: true,
                                                  typography_rules: [
                                                    "common/punctuation/quote",
                                                    "en-US/dash/main",
                                                    "common/nbsp/afterParagraphMark",
                                                    "common/nbsp/afterSectionMark",
                                                    "common/nbsp/afterShortWord",
                                                    "common/nbsp/beforeShortLastNumber",
                                                    "common/nbsp/beforeShortLastWord",
                                                    "common/nbsp/dpi",
                                                    "common/punctuation/apostrophe",
                                                    "common/space/delBeforePunctuation",
                                                    "common/space/afterComma",
                                                    "common/space/afterColon",
                                                    "common/space/afterExclamationMark",
                                                    "common/space/afterQuestionMark",
                                                    "common/space/afterSemicolon",
                                                    "common/space/beforeBracket",
                                                    "common/space/bracket",
                                                    "common/space/delBeforeDot",
                                                    "common/space/squareBracket",
                                                    "common/number/mathSigns",
                                                    "common/number/times",
                                                    "common/number/fraction",
                                                    "common/symbols/arrow",
                                                    "common/symbols/cf",
                                                    "common/symbols/copy",
                                                    "common/punctuation/delDoublePunctuation",
                                                    "common/punctuation/hellip"
                                                  ],
                                                  typography_ignore: ["code"],
                                                  importcss_append: true,
                                                  image_caption: true,
                                                  quickbars_selection_toolbar:
                                                    "bold italic | quicklink h2 h3 blockquote quickimage quicktable",
                                                  noneditable_class: "mceNonEditable",
                                                  toolbar_mode: "sliding",
                                                  spellchecker_ignore_list: [
                                                    "Ephox",
                                                    "Moxiecode",
                                                    "tinymce",
                                                    "TinyMCE"
                                                  ],
                                                  tinycomments_mode: "embedded",
                                                  content_style:
                                                    ".mymention{ color: gray; }",
                                                  contextmenu:
                                                    "link image editimage table configurepermanentpen",
                                                  a11y_advanced_options: true,
                                                  font_formats:
                                                    "Andale Mono=andale mono,times; Arial=arial,helvetica,sans-serif; Arial Black=arial black,avant garde; Book Antiqua=book antiqua,palatino; Comic Sans MS=comic sans ms,sans-serif; Courier New=courier new,courier; Georgia=georgia,palatino; Helvetica=helvetica; Impact=impact,chicago; Oswald=oswald; Symbol=symbol; Tahoma=tahoma,arial,helvetica,sans-serif; Terminal=terminal,monaco; Times New Roman=times new roman,times; Trebuchet MS=trebuchet ms,geneva; Verdana=verdana,geneva; Webdings=webdings; Titillium Web=titillium; Wingdings=wingdings,zapf dingbats",
                                                  content_style:
                                                    "@import url('https://fonts.googleapis.com/css2?family=Titillium+Web:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600&family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap'); body { font-family: Titillium Web, sans-serif; }",
                                                  height: 500
                                                }}
                                                id="responsibilities"
                                                name="responsibilities"
                                                onChange={(e) =>
                                                  setResponsibilities(e.target.getContent())
                                                }
                                              />
                                            </div>
                                            <div className="row">
                                              <div className="col-md-5">
                                                <div class="md-form mb-4">
                                                  <label
                                                    htmlFor="fieldofstudy"
                                                    className="mb-3"
                                                  >
                                                    Start Year:
                                                  </label>
                                                  <LocalizationProvider
                                                    dateAdapter={AdapterDayjs}
                                                  >
                                                    <DemoContainer
                                                      components={[
                                                        "DatePicker",
                                                        "DatePicker"
                                                      ]}
                                                    >
                                                      <DatePicker
                                                        label="Start Year"
                                                        value={startYear}
                                                        onChange={(value) =>
                                                          setStartYear(value)
                                                        }
                                                      />
                                                    </DemoContainer>
                                                  </LocalizationProvider>
                                                </div>
                                              </div>
                                              <div className="col-md-5">
                                                <div class="md-form mb-4">
                                                  <label
                                                    htmlFor="fieldofstudy"
                                                    className="mb-3"
                                                  >
                                                    Finish Year:
                                                  </label>
                                                  <LocalizationProvider
                                                    dateAdapter={AdapterDayjs}
                                                  >
                                                    <DemoContainer
                                                      components={[
                                                        "DatePicker",
                                                        "DatePicker"
                                                      ]}
                                                    >
                                                      <DatePicker
                                                        label="Finish Year"
                                                        disabled={dateDisabled}
                                                        value={finishYear}
                                                        onChange={(value) =>
                                                          setFinishYear(value)
                                                        }
                                                      />
                                                    </DemoContainer>
                                                  </LocalizationProvider>
                                                </div>
                                              </div>
                                              <div className="col-md-2">
                                                <div className="md-form mb-10">
                                                  <label htmlFor="current" className="mb-3">
                                                    Present
                                                  </label>
                                                  <Checkbox
                                                    label="Solid"
                                                    value={current}
                                                    variant="solid"
                                                    checked={isChecked}
                                                    onChange={handleCheckboxChange}
                                                  />
                                                </div>
                                              </div>
                                            </div>
                                            <div className="md-form mb-4">
                                              <label htmlFor="country" className="mb-3">
                                                Country:{" "}
                                              </label>
                                              <div className="form-wrapper">
                                                <select
                                                  class="form-control qualifications rounded-0"
                                                  name="country"
                                                  value={country}
                                                  onChange={(e) =>
                                                    setCountry(e.target.value)
                                                  }
                                                >
                                                  <option>Select Country</option>
                                                  {countries.map((ac) => {
                                                    return (
                                                      <option key={ac._id} value={ac._id}>
                                                        {ac.country_name} {" | "}{" "}
                                                        {ac.country_code}
                                                      </option>
                                                    );
                                                  })}
                                                </select>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="text-center mt-5">
                                            <button
                                              type="submit"
                                              className="btn btn-primary rounded-0"
                                            >
                                              <i className="fas fa-plus"></i> Add New
                                            </button>
                                          </div>
                                        </form>
                                      </div>
                                    </div>
                                  </Modal.Body>
                                  <Modal.Footer>
                                    <Button
                                      variant="outline-danger"
                                      className="rounded-0"
                                      onClick={handleCloseJEF}
                                    >
                                      Close
                                    </Button>
                                  </Modal.Footer>
                                </Modal>
                                {/* Applicant Job Experience Form Ends ========================================= */}
                              </div>
                            </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-lg-12 mb-4">
                      <div className="app-card app-card-account shadow-sm d-flex flex-column align-items-start">
                        <div className="app-card-header p-3 border-bottom-0">
                          <div className="row align-items-center gx-3">
                            <div className="col-auto">
                              <div className="app-icon-holder">
                                <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M16 10c0-.55228-.4477-1-1-1h-3v2h3c.5523 0 1-.4477 1-1Z"/>
                                  <path d="M13 15v-2h2c1.6569 0 3-1.3431 3-3 0-1.65685-1.3431-3-3-3h-2.256c.1658-.46917.256-.97405.256-1.5 0-.51464-.0864-1.0091-.2454-1.46967C12.8331 4.01052 12.9153 4 13 4h7c.5523 0 1 .44772 1 1v9c0 .5523-.4477 1-1 1h-2.5l1.9231 4.6154c.2124.5098-.0287 1.0953-.5385 1.3077-.5098.2124-1.0953-.0287-1.3077-.5385L15.75 16l-1.827 4.3846c-.1825.438-.6403.6776-1.0889.6018.1075-.3089.1659-.6408.1659-.9864v-2.6002L14 15h-1ZM6 5.5C6 4.11929 7.11929 3 8.5 3S11 4.11929 11 5.5 9.88071 8 8.5 8 6 6.88071 6 5.5Z"/>
                                  <path d="M15 11h-4v9c0 .5523-.4477 1-1 1-.55228 0-1-.4477-1-1v-4H8v4c0 .5523-.44772 1-1 1s-1-.4477-1-1v-6.6973l-1.16797 1.752c-.30635.4595-.92722.5837-1.38675.2773-.45952-.3063-.5837-.9272-.27735-1.3867l2.99228-4.48843c.09402-.14507.2246-.26423.37869-.34445.11427-.05949.24148-.09755.3763-.10887.03364-.00289.06747-.00408.10134-.00355H15c.5523 0 1 .44772 1 1 0 .5523-.4477 1-1 1Z"/>
                                </svg>
                              </div>
                            </div>
                            <div className="col-auto">
                              <h4 className="app-card-title">Skills</h4>
                            </div>
                          </div>
                        </div>
                        <div className="app-card-body px-4 w-100">
                          <div className="appcontent">
                            <ul className="skilllist">
                              {skills.length > 0 ? (
                                skills.map((s) => {
                                  return (
                                    <li key={s._id} className="mb-4">
                                      <p className="tags">
                                        {s?.name}
                                        <br />
                                        <span></span>
                                        <div className="d-flex justify-content-end actionicons">
                                          <Link
                                            className="d-block me-3"
                                            to={`/Applicant/Skill/Update/${s._id}`}
                                          >
                                            <i className="fas fa-pencil stroke-transparent-blue"></i>
                                          </Link>
                                          <Link
                                            className="d-block"
                                            to={`/Applicant/Delete-Skill/${s._id}`}
                                          >
                                            <i className="fas fa-trash text-danger"></i>
                                          </Link>
                                        </div>
                                      </p>
                                    </li>
                                  );
                                })
                              ) : (
                                <li>No Applicant Skill Updated Yet.</li>
                              )}
                            </ul>
                            <Button
                              onClick={handleShowSkillsForm}
                              className="rounded-0 me-2"
                            >
                              <i className="fas fa-plus"></i> Add New
                            </Button>
                            <div className="d-flex">
                              {/* Applicant Skill Form Starts ======================================= */}
                              <Modal
                                show={showSkillsForm}
                                onHide={handleCloseSkillsForm}
                                size="lg"
                                aria-labelledby="contained-modal-title-vcenter"
                                centered
                              >
                                <Modal.Header closeButton>
                                  <div className="position-relative mb-3">
                                    <div className="row g-3 justify-content-between">
                                      <div className="col-auto">
                                        <h1 className="app-page-title mb-0">
                                          Update Skills
                                        </h1>
                                      </div>
                                    </div>
                                  </div>
                                </Modal.Header>
                                <Modal.Body className="EQF">
                                  <div className="app-card app-card-notification shadow-sm mb-4">
                                    <div className="app-card-body p-4">
                                      <div className="notification-content">
                                        <form onSubmit={handleUpdateSkills}>
                                          <div className="col-md-9 mx-auto">
                                            <div className="md-form mb-4">
                                              <label for="SkillName" className="mb-3">
                                                Skill Title:
                                              </label>
                                              <input
                                                type="text"
                                                id="newSkill"
                                                name="newSkill"
                                                className="form-control rounded-0"
                                                value={newSkill}
                                                onChange={(e) =>
                                                  setNewSkill(e.target.value)
                                                }
                                              />
                                              <small>
                                                <span>
                                                  Enter Skills Separated By Comma:
                                                </span>
                                              </small>
                                            </div>
                                          </div>
                                          <div className="text-center mt-5">
                                            <button
                                              type="submit"
                                              className="btn btn-primary rounded-0"
                                            >
                                              <i className="fas fa-plus"></i> Update
                                              Skills
                                            </button>
                                          </div>
                                        </form>
                                      </div>
                                    </div>
                                  </div>
                                </Modal.Body>
                                <Modal.Footer>
                                  <Button
                                    variant="outline-danger"
                                    className="rounded-0"
                                    onClick={handleCloseSkillsForm}
                                  >
                                    Close
                                  </Button>
                                </Modal.Footer>
                              </Modal>
                              {/* Applicant Skill Form Ends ========================================= */}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-lg-12 mb-4">
                      <div className="app-card app-card-account shadow-sm d-flex flex-column align-items-start">
                        <div className="app-card-header p-3 border-bottom-0">
                          <div className="row align-items-center gx-3">
                            <div className="col-auto">
                              <div className="app-icon-holder">
                                <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M6 16v-3h.375a.626.626 0 0 1 .625.626v1.749a.626.626 0 0 1-.626.625H6Zm6-2.5a.5.5 0 1 1 1 0v2a.5.5 0 0 1-1 0v-2Z"/>
                                  <path fill-rule="evenodd" d="M11 7V2h7a2 2 0 0 1 2 2v5h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2H3a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h6a2 2 0 0 0 2-2Zm7.683 6.006 1.335-.024-.037-2-1.327.024a2.647 2.647 0 0 0-2.636 2.647v1.706a2.647 2.647 0 0 0 2.647 2.647H20v-2h-1.335a.647.647 0 0 1-.647-.647v-1.706a.647.647 0 0 1 .647-.647h.018ZM5 11a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h1.376A2.626 2.626 0 0 0 9 15.375v-1.75A2.626 2.626 0 0 0 6.375 11H5Zm7.5 0a2.5 2.5 0 0 0-2.5 2.5v2a2.5 2.5 0 0 0 5 0v-2a2.5 2.5 0 0 0-2.5-2.5Z" clip-rule="evenodd"/>
                                  <path d="M9 7V2.221a2 2 0 0 0-.5.365L4.586 6.5a2 2 0 0 0-.365.5H9Z"/>
                                </svg>
                              </div>
                            </div>
                            <div className="col-auto">
                              <h4 className="app-card-title">Resumes / CV </h4>
                            </div>
                          </div>
                        </div>
                        <div className="app-card-body px-4 w-100">
                          <div className="appcontent">
                            <ul>
                              <li>
                                <p className="tags">
                                  <div className="plans">
                                    {resumes.length > 0 ? (
                                      resumes.map((r) => {
                                        return (
                                          <>
                                            <label
                                              key={r._id}
                                              className="plan basic-plan mb-3"
                                              htmlFor="resume"
                                            >
                                              <div className="plan-content">
                                                <div className="plan-details me-5">
                                                  <p>
                                                    <Link
                                                      to={r.resume}
                                                      download={r.resume}
                                                    >
                                                      <i className="fas fa-file fa-3x me-4"></i>
                                                    </Link>
                                                    <b style={{ fontSize: "20px" }}>
                                                      Uploaded On:
                                                    </b>{" "}
                                                    {moment(r.uploadedOn).format(
                                                      "MMMM DD, YYYY"
                                                    )}
                                                  </p>
                                                </div>
                                                <Link
                                                  className="ms-5 d-block"
                                                  to={`/Applicant/Delete-Resume/${r._id}`}
                                                >
                                                  <i className="fas fa-trash text-danger"></i>
                                                </Link>
                                              </div>
                                            </label>
                                          </>
                                        );
                                      })
                                    ) : (
                                      <>
                                        <span>No Resume Uploaded Yet!!!.</span>
                                      </>
                                    )}
                                  </div>
                                </p>
                              </li>
                            </ul>
                            <Button
                              className="rounded-0 me-2"
                              onClick={() => {
                                window.location.href = `/Applicant-Resume-Upload/${auth?.user?.userId}`;
                              }}
                            >
                              <i className="fas fa-plus"></i> Add New
                            </Button>
                          </div>                          
                        </div>
                      </div>
                    </div>
                  </div>
                </div>    
                <Footer />            
              </div>
            </div>
          </div>
      </>
    );
};
export default Profile
