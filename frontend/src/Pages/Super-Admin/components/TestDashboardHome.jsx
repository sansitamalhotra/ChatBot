import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import API from '../../helpers/API';
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
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

import LogoSvg from './assets/images/Test-Logo.png';
import LogoSvgMini from './assets/images/Test-Logo-Mini.png';


import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import Footer from './Footer';
//import { initDashboard } from './assets/js/dashboard';

const TestDashboardHome = ({ userId }) => {
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
  const params = useParams();
  const [jobs, setJobs] = useState([]);
  const [job, setJob] = useState({});
  const [numJobsInDB, setNumJobsInDB] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsPerPage, setJobsPerPage] = useState(5);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [sectors, setSectors] = useState([]);

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

  useEffect(() => {
    fetchAlJobs();
    window.scrollTo({ top: 0 });
    if (window.history.pushState) {
      window.history.pushState(
        null,
        null,
        `/Admin/Test-Manage-Jobs?page=${currentPage}`
      );
    }
  }, [currentPage, jobsPerPage]);

  const fetchAlJobs = async () => {
    try {
      setLoading(true);
      const response = await API.get(
        `/job/fetchJobsByRecruiter/${userId}/?page=${currentPage}`
      );
      setJobs(response.data.result);
      setTotalJobs(response.data.totalJobs);
      setNumJobsInDB(response.data.numJobsInDB);
      localStorage.setItem("refresh", response.data.result);
      setLoading(false);
      setSelectedJob(null);
    } catch (error) {
      console.log(error);
      setLoading(false);
      notifyErr(error.response.data.message);
    }
  };

  useEffect(() => {
    fetchSectors();
  }, []);

  const fetchSectors = async () => {
    try {
      const { data } = await API.get("/sector/fetchSectors");
      if (data?.success) {
        setSectors(data?.sector);
      }
    } catch (error) {
      console.log(error);
      notifyErr("Oppss!!, FAILED, Something went Wrong Retrieving all Sectors");
    }
  };

  const fetchJob = async () => {
    try {
      const { data } = await API.get(`/job/viewJob/${params.slug}`);
      setJob(data.job);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (params?.slug) fetchJob();
  }, [params?.slug]);

  const generatePageNumbers = () => {
    const maxPaginationNumbers = 5;
    const startPage = Math.max(
      1,
      currentPage - Math.floor(maxPaginationNumbers / 2)
    );
    const endPage = Math.min(startPage + maxPaginationNumbers - 1, totalPages);

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  };

  const totalPages = Math.ceil(totalJobs / jobsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  const pagination = (pageNumber) => setCurrentPage(pageNumber);
  const pageNumbers = generatePageNumbers();
  useEffect(() => {
    if (params?.slug) fetchJob();
  }, [params?.slug]);

  // &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [numRegUsersInDB, setNumRegUsersInDB] = useState(0);
  const [totalRegUsers, setTotalRegUsers] = useState(0);
  const [usersPerPage, setUsersPerPage] = useState(20);
  const [selectedUser, setSelectedUser] = useState(null);
  const [applicantAppliedJobs, setApplicantAppliedJobs] = useState([]);
  const [totalAppliedApplicant, setTotalAppliedApplicant] = useState(0);
  const [totalAppliedApplicantCount, setTotalAppliedApplicantCount] =
    useState(0);
  const [applicantAppliedNonITJobs, setApplicantAppliedNonITJobs] = useState(
    []
  );
  const [totalNonITAppliedApplicantCount, setTotalNonITAppliedApplicantCount] =
    useState(0);
  const [applied, setApplied] = useState(false);
  const duration = 50_000;
  const startTime = Date.now();

  // **********************************************
  useEffect(() => {
    const fetchJobData = async () => {
      try {
        setLoading(true);
        const jobResponse = await API.get(`/job/fetchAllJobs`, {
          params: { search: searchTerm }
        });
        const { result, applied, totalJobs, numJobsInDB } = jobResponse.data;
        setJobs(result);
        setApplied(applied);
        setTotalJobs(totalJobs);
        setNumJobsInDB(numJobsInDB);
        localStorage.setItem("refresh", JSON.stringify(result));

        const sectorResponse = await API.get("/job/sectors");
        setSectors(sectorResponse.data.result);
      } catch (error) {
        console.error(error);
        notifyErr(error.response.data.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobData();
    window.scrollTo({ top: 0 });
  }, [currentPage, searchTerm]);

  useEffect(() => {
    const fetchAllRegUsers = async () => {
      try {
        setLoading(true);
        const response = await API.get(
          `/admin/fetchRegisteredUsers?page=${currentPage}`
        );
        setUsers(response.data.result);
        setTotalRegUsers(response.data.totalRegUsers);
        setNumRegUsersInDB(response.data.numRegUsersInDB);
        localStorage.setItem("refresh", response.data.result);
        setLoading(false);
        setSelectedUser(null);
      } catch (error) {
        console.log(error);
        setLoading(false);
        notifyErr(error.response.data.message);
      }
    };

    fetchAllRegUsers();
    window.scrollTo({ top: 0 });
    if (window.history.pushState) {
      window.history.pushState(
        null,
        null,
        `/Super-Admin/Super-Admin-Dashboard?page=${currentPage}`
      );
    }
  }, [currentPage, usersPerPage]);

  useEffect(() => {
    fetchAllApplicantAppliedJobs();
  }, []);

  const fetchAllApplicantAppliedJobs = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/admin/applicantAppliedJobs`);
      setApplicantAppliedJobs(response.data.result);
      setApplied(response.data.applied);
      setTotalAppliedApplicant(response.data.totalAppliedApplicant);
      localStorage.setItem("refresh", response.data.result);
      setLoading(false);
    } catch (error) {
      console.error(error);
      console.log(error);
      setLoading(false);
      notifyErr(error.response.data.message);
    }
  };

  useEffect(() => {
    const updateAppliedApplicant = () => {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(1, elapsedTime / duration);
      const currentCount = Math.floor(progress * totalAppliedApplicant);
      setTotalAppliedApplicantCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(updateAppliedApplicant);
      }
    };
    requestAnimationFrame(updateAppliedApplicant);

    return () => {
      setTotalAppliedApplicantCount(totalAppliedApplicant);
    };
  }, [totalAppliedApplicant]);

  useEffect(() => {
    fetchAllApplicantAppliedNonITJobs();
  }, []);

  const fetchAllApplicantAppliedNonITJobs = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/admin/applicantAppliedNonITJobs`);
      setApplicantAppliedNonITJobs(response.data.result);
      setApplied(response.data.applied);
      setTotalNonITAppliedApplicantCount(
        response.data.totalNonITAppliedApplicants
      ); // Corrected state update
      localStorage.setItem("refresh", JSON.stringify(response.data.result)); // Store as JSON string
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
      notifyErr(error.response?.data?.message || "An error occurred"); // Added optional chaining
    }
  };

    return (
      <div className="container-scroller">
        <Helmet>
          <link rel="canonical" href={canonicalUrl} />
          <title>Admin Dashboard Home | ThinkBeyond</title>
          <meta name="description" content="Admin Dashboard Home | ThinkBeyond" />
        </Helmet>
        <nav className="navbar default-layout-navbar col-lg-12 col-12 p-0 fixed-top d-flex flex-row">
          <div className="text-center navbar-brand-wrapper d-flex align-items-center justify-content-start">
            <Link className="navbar-brand brand-logo" to="/"><img src={LogoSvg} alt="logo" /></Link>
            <a className="navbar-brand brand-logo-mini" href="index.html"><img src={LogoSvgMini} alt="logo" /></a>
          </div>
          <div className="navbar-menu-wrapper d-flex align-items-stretch">
            <button className="navbar-toggler navbar-toggler align-self-center" type="button" data-toggle="minimize" onClick={toggleMinimize}>
              <span className="mdi mdi-menu"></span>
            </button>
            <div className="search-field d-none d-md-block">
              <form className="d-flex align-items-center h-100" action="#">
                <div className="input-group">
                  <div className="input-group-prepend bg-transparent">
                    <i className="input-group-text border-0 mdi mdi-magnify"></i>
                  </div>
                  <input type="text" className="form-control bg-transparent border-0" placeholder="Search projects" />
                </div>
              </form>
            </div>
            <ul className="navbar-nav navbar-nav-right">
              <li className="nav-item nav-profile dropdown">
                <a className={`nav-link dropdown-toggle ${profileDropdownOpen ? 'show' : ''}`}  id="profileDropdown" href="#" data-bs-toggle="dropdown" aria-expanded="false" onClick={(e) => {
                    e.preventDefault();
                    toggleProfileDropdown();
                  }}>
                  <div className="nav-profile-img">
                    <img src={LogoSvgMini} alt="Profile Photo" />
                    <span className="availability-status online"></span>
                  </div>
                  <div className="nav-profile-text">
                    <p className="mb-1 text-black">Admin Actions</p>
                  </div>
                </a>
                <div className={`dropdown-menu navbar-dropdown ${profileDropdownOpen ? 'show' : ''}`} aria-labelledby="profileDropdown">
                  <Link className="dropdown-item" to="#">
                    <i className="mdi mdi-briefcase me-2 text-success"></i> Admin Jobs 
                  </Link>
                  <div className="dropdown-divider"></div>
                  <Link className="dropdown-item" to="#">
                    <i className="mdi mdi-format-list-bulleted-type me-2 text-success"></i> Job Sectors 
                  </Link>
                  <div className="dropdown-divider"></div>                  
                  <LogoutNavbarLink className="dropdown-item">
                    <i className="mdi mdi-logout me-2 text-success"></i>
                    Logoutsss
                  </LogoutNavbarLink>
                </div>
              </li>
              <li className="nav-item dropdown">
                <Link className="nav-link count-indicator dropdown-toggle" id="messageDropdown" to="#" data-bs-toggle="dropdown" aria-expanded="false">
                  <b>Links</b>
                </Link>
                <div className="dropdown-menu dropdown-menu-end navbar-dropdown preview-list" aria-labelledby="messageDropdown">
                  <h6 className="p-3 mb-0">Page Links</h6>
                  <div className="dropdown-divider"></div>
                  <Link className="dropdown-item preview-item" to="/">
                    <i className='mdi mdi-home me-2'></i>
                    <div className="preview-item-content d-flex align-items-start flex-column justify-content-center">
                      <h6 className="preview-subject ellipsis mb-1 font-weight-normal">Home</h6>
                    </div>
                  </Link>
                  <div className="dropdown-divider"></div>
                  <Link className="dropdown-item preview-item" to="/Search-Jobs">
                    <i className='mdi mdi-briefcase me-2'></i>
                    <div className="preview-item-content d-flex align-items-start flex-column justify-content-center">
                      <h6 className="preview-subject ellipsis mb-1 font-weight-normal">IT/Tech Jobs</h6>
                    </div>
                  </Link>
                  <div className="dropdown-divider"></div>
                  <Link className="dropdown-item preview-item" to='/About-Us'>    
                    <i className='mdi mdi-theater me-2'></i>                
                    <div className="preview-item-content d-flex align-items-start flex-column justify-content-center">
                      <h6 className="preview-subject ellipsis mb-1 font-weight-normal">About Us</h6>
                    </div>
                  </Link>
                  <div className="dropdown-divider"></div>
                  <Link className="dropdown-item preview-item" to="/Services">
                    <i className='mdi mdi-server me-2'></i>
                    <div className="preview-item-content d-flex align-items-start flex-column justify-content-center">
                      <h6 className="preview-subject ellipsis mb-1 font-weight-normal">Services</h6>
                    </div>
                  </Link>                
                </div>
              </li>
            </ul>
            <button className="navbar-toggler navbar-toggler-right d-lg-none align-self-center" type="button" data-toggle="offcanvas" onClick={toggleMobileSidebar}>
              <span className="mdi mdi-menu"></span>
            </button>
          </div>
        </nav>
        <div className="container-fluid page-body-wrapper">
        {/* Sidebar */}
          <nav className={`sidebar sidebar-offcanvas ${sidebarOpen ? 'active' : ''}`} id="sidebar">
            <ul className="nav">
              <li className="nav-item">
                <Link className="nav-link" to="/Admin/Test-Admin-Dashboard">
                  <span className="menu-title">Dashboard</span>
                  <i className="mdi mdi-home menu-icon"></i>
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" data-bs-toggle="collapse" to="#admin-jobs" aria-expanded="false" aria-controls="admin-jobs">
                  <span className="menu-title">Admin Jobs</span>
                  <i className="menu-arrow"></i>
                  <i className="mdi mdi-briefcase menu-icon"></i>
                </Link>
                <div className="collapse" id="admin-jobs">
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link className="nav-link" to="/Admin/Test-Add-Job">Add New Job</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/Admin/Test-Manage-Jobs">Manage Jobs</Link>
                    </li>
                  </ul>
                </div>
              </li>
              <li className="nav-item">
                <Link className="nav-link" data-bs-toggle="collapse" to="#admin-jobs-qualifications" aria-expanded="false" aria-controls="admin-jobs-qualifications">
                  <span className="menu-title">Job Qualifications</span>
                  <i className="menu-arrow"></i>
                  <i className="mdi mdi-school menu-icon"></i>
                </Link>
                <div className="collapse" id="admin-jobs-qualifications">
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link className="nav-link" to="/Admin/Test-Add-Qualification">Add Qualifications</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/Admin/Test-Manage-Qualifications">Manage Qualifications</Link>
                    </li>
                  </ul>
                </div>
              </li>
              <li className="nav-item">
                <Link className="nav-link" data-bs-toggle="collapse" to="#admin-work-experiences" aria-expanded="false" aria-controls="admin-work-experiences">
                  <span className="menu-title">Work Experiences</span>
                  <i className="menu-arrow"></i>
                  <i className="mdi mdi-checkbox-multiple-marked menu-icon"></i>
                </Link>
                <div className="collapse" id="admin-work-experiences">
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link className="nav-link" to="/Admin/Test-Add-Work-Experience">Add Work Experience</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/Admin/Test-Manage-Work-Experiences">Manage Work Experiences</Link>
                    </li>
                  </ul>
                </div>
              </li>
              <li className="nav-item">
                <Link className="nav-link" data-bs-toggle="collapse" to="#admin-work-modes" aria-expanded="false" aria-controls="admin-work-modes">
                  <span className="menu-title">Work Mode Types</span>
                  <i className="menu-arrow"></i>
                  <i className="mdi mdi-account-convert menu-icon"></i>
                </Link>
                <div className="collapse" id="admin-work-modes">
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link className="nav-link" to="/Admin/Add-Test-Work-Mode">Add Work Mode</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/Admin/Manage-Test-Work-Modes">Manage Work Modes</Link>
                    </li>
                  </ul>
                </div>
              </li>
              <li className="nav-item">
                <Link className="nav-link" data-bs-toggle="collapse" to="#admin-countries" aria-expanded="false" aria-controls="admin-countries">
                  <span className="menu-title">Countries</span>
                  <i className="menu-arrow"></i>
                  <i className="mdi mdi-map-marker-radius menu-icon"></i>
                </Link>
                <div className="collapse" id="admin-countries">
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link className="nav-link" to="/Admin/Add-Test-Country">Add Country</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/Admin/Manage-Test-Countries">Manage Countries</Link>
                    </li>
                  </ul>
                </div>
              </li>
              <li className="nav-item">
                <Link className="nav-link" data-bs-toggle="collapse" to="#admin-provinces" aria-expanded="false" aria-controls="admin-provinces">
                  <span className="menu-title">Provinces / State</span>
                  <i className="menu-arrow"></i>
                  <i className="mdi mdi-map-marker-circle menu-icon"></i>
                </Link>
                <div className="collapse" id="admin-provinces">
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link className="nav-link" to="/Admin/Add-Test-Province">Add Province</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/Admin/Manage-Test-Provinces">Manage Provinces</Link>
                    </li>
                  </ul>
                </div>
              </li>
              <li className="nav-item">
                <Link className="nav-link" data-bs-toggle="collapse" to="#sectors" aria-expanded="false" aria-controls="sectors">
                  <span className="menu-title">Job Sectors</span>
                  <i className="menu-arrow"></i>
                  <i className="mdi mdi-format-list-bulleted-type menu-icon"></i>
                </Link>
                <div className="collapse" id="sectors">
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link className="nav-link" to="/Admin/Add-Test-Sector"> Add Job Sector </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/Admin/Manage-Test-Sectors"> Manage Job Sectors </Link>
                    </li>
                  </ul>
                </div>
              </li>
              <li className="nav-item">
                <Link className="nav-link" data-bs-toggle="collapse" to="#salaries" aria-expanded="false" aria-controls="salaries">
                  <span className="menu-title">Manage Salaries</span>
                  <i className="menu-arrow"></i>
                  <i className="mdi mdi-currency-usd menu-icon"></i>
                </Link>
                <div className="collapse" id="salaries">
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link className="nav-link" to="/Admin/Add-Test-Salary"> Add Salary </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/Admin/Manage-Test-Salaries"> Manage Salaries </Link>
                    </li>
                  </ul>
                </div>
              </li>
              <li className="nav-item">
                <Link className="nav-link" data-bs-toggle="collapse" to="#workAuthorizations" aria-expanded="false" aria-controls="workAuthorizations">
                  <span className="menu-title">Work Authorizations</span>
                  <i className="menu-arrow"></i>
                  <i className="mdi mdi-file-check menu-icon"></i>
                </Link>
                <div className="collapse" id="workAuthorizations">
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link className="nav-link" to="/Admin/Add-Test-Work-Authorization"> Add Work Authorization </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/Admin/Manage-Test-Work-Authorizations"> Manage Work Authorizations </Link>
                    </li>
                  </ul>
                </div>
              </li>
              <li className="nav-item">
                <Link className="nav-link" data-bs-toggle="collapse" to="#messages" aria-expanded="false" aria-controls="messages">
                  <span className="menu-title">Contact Messages</span>
                  <i className="menu-arrow"></i>
                  <i className="mdi mdi-message-text-outline menu-icon"></i>
                </Link>
                <div className="collapse" id="messages">
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link className="nav-link" to="/Admin/All-Contact-Us-Messages"> All Contact Messages </Link>
                    </li>
                  </ul>
                </div>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/Admin/Test-Email-Subscribers">
                  <span className="menu-title">Email Subscribers</span>
                  <i className="mdi mdi-at menu-icon"></i>
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/Admin/Test-Change-Password">
                  <span className="menu-title">Change Password</span>
                  <i className="mdi mdi-repeat menu-icon"></i>
                </Link>
              </li>
              <li className="nav-item">
                <LogoutLink className="nav-link">
                  <span className="menu-title">Logout</span>
                  <i className="mdi mdi-logout menu-icon"></i>
                </LogoutLink>
              </li>
            </ul>
          </nav>
        {/* Main Panel */}
          <div className="main-panel">
            <div className="content-wrapper">
              <div className="page-header">
                <h3 className="page-title">
                  <span className="page-title-icon bg-gradient-primary text-white me-2">
                    <i className="mdi mdi-home"></i>
                  </span> Dashboard
                </h3>
                <nav aria-label="breadcrumb">
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item active" aria-current="page">
                      <span></span>Overview <i className="mdi mdi-alert-circle-outline icon-sm text-primary align-middle"></i>
                    </li>
                  </ul>
                </nav>
              </div>
              
              {/* Stats Cards */}
              <div className="row">
                <div className="col-md-4 stretch-card grid-margin">
                  <div className="card bg-gradient-danger card-img-holder text-white">
                    <div className="card-body">
                      {/* <img src="./assets/images/dashboard/circle.svg" className="card-img-absolute" alt="circle" /> */}
                      <h4 className="font-weight-normal mb-3">Active Job Openings <i className="mdi mdi-briefcase mdi-24px float-end"></i>
                      </h4>
                      <h2 className="mb-5">{numJobsInDB}</h2>
                      {/* <h6 className="card-text">
                        <Link to="#" className='text-white'>Visit Page</Link>
                      </h6> */}
                    </div>
                  </div>
                </div>
                <div className="col-md-4 stretch-card grid-margin">
                  <div className="card bg-gradient-info card-img-holder text-white">
                    <div className="card-body">
                      {/* <img src="assets/images/dashboard/circle.svg" className="card-img-absolute" alt="circle" /> */}
                      <h4 className="font-weight-normal mb-3">Registered Users <i className="mdi mdi-human-male-female mdi-24px float-end"></i>
                      </h4>
                      <h2 className="mb-5">{numRegUsersInDB}</h2>
                      {/* <h6 className="card-text">
                        <Link to="#" className='text-white'>Visit Page</Link>
                      </h6> */}
                    </div>
                  </div>
                </div>
                <div className="col-md-4 stretch-card grid-margin">
                  <div className="card bg-gradient-success card-img-holder text-white">
                    <div className="card-body">
                      {/* <img src="assets/images/dashboard/circle.svg" className="card-img-absolute" alt="circle" /> */}
                      <h4 className="font-weight-normal mb-3">Active Applicants <i className="mdi mdi-file-document mdi-24px float-end"></i>
                      </h4>
                      <h2 className="mb-5">{totalAppliedApplicantCount}</h2>
                      {/* <h6 className="card-text">
                        <Link to="#" className='text-white'>Visit Page</Link>
                      </h6> */}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Recent Tickets Table */}
              <div className="row">
                <div className="col-12 grid-margin">
                  <div className="page-header">
                    <h3 className="page-title">
                      <span className="page-title-icon bg-gradient-primary text-white me-2">
                        <i className="mdi mdi-briefcase"></i>
                      </span> Active Job List
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
                      <h4 className="card-title">List Of Posted Jobs</h4>
                      <div className="table-responsive">
                        <table className="table">
                          <thead>
                            <tr>
                            <th>No.</th>
                            <th>Job Title</th>
                            <th>Job Qualification</th>
                            <th>Job Experience</th>
                            <th>Job Country</th>
                            <th>Work Mode</th>
                            <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                          {jobs.length > 0 ? (
                            jobs.map((j, index) => {
                              return (
                                <tr key={j._id}>
                                  <td>{index + 1}</td>
                                  <td>
                                    <span className="truncate">{j.title}</span>
                                  </td>
                                  <td>
                                    {j?.jobQualification?.qualificationName}
                                  </td>
                                  <td>
                                    {j?.jobExperience?.workExperienceName}
                                  </td>
                                  <td>
                                    {j?.country?.countryName}
                                  </td>
                                  <td>
                                    {j?.jobModeType?.workModeName}
                                  </td>

                                  <td>
                                    <Link
                                      className="btn-sm app-btn-secondary rounded-0 me-3"
                                      to={`/Admin/Jobs/View-Job/${j.slug}`}
                                      onClick={() => {
                                        window.location.href = `/Admin/Jobs/View-Job/${j.slug}`;
                                      }}
                                    >
                                      <EyeOutlined />
                                    </Link>

                                    <Link
                                      className="btn-sm app-btn-secondary rounded-0 me-3"
                                      to={`/Admin/Jobs/Update-Job/${j.slug}`}
                                      onClick={() => {
                                        window.location.href = `/Admin/Jobs/Update-Job/${j.slug}`;
                                      }}
                                    >
                                      <EditOutlined />
                                    </Link>

                                    <Link
                                      className="btn-sm app-btn-secondary rounded-0 me-3"
                                      to={`/Admin/Jobs/Delete-Job/${j.slug}`}
                                    >
                                      <DeleteOutlined />
                                    </Link>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={3} style={{ fontWeight: "300" }}>
                                No Job Found.
                              </td>
                            </tr>
                          )}                            
                          </tbody>
                        </table>
                      </div>
                      <nav className="app-pagination mt-3">
                        <ul className="pagination justify-content-center">
                          <li className="page-item">
                            <button
                              className="page-link"
                              onClick={prevPage}
                              disabled={currentPage === 1}
                            >
                              Previous
                            </button>
                          </li>
                          {pageNumbers.map((number) => (
                            <li
                              key={number}
                              className={
                                currentPage === number
                                  ? "page-item active disabled"
                                  : ""
                              }
                            >
                              <Link
                                onClick={() => pagination(number)}
                                disabled={currentPage === totalPages}
                                to="#"
                                className="page-link"
                              >
                                {number}
                              </Link>
                            </li>
                          ))}
                          <li className="page-item">
                            <button
                              className="page-link"
                              onClick={nextPage}
                              disabled={currentPage === totalPages}
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
              {/*=========== Registered Users Table Begins ============*/}
              <div className="row">
                <div className="col-12 grid-margin">
                  <div className="page-header">
                    <h3 className="page-title">
                      <span className="page-title-icon bg-gradient-primary text-white me-2">
                        <i className="mdi mdi-account-multiple-plus"></i>
                      </span> Resgitered Users List
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
                      <h4 className="card-title">List Of Registered Users</h4>
                      <div className="table-responsive">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>No.</th>
                              <th>Full Name</th>
                              <th>Email</th>
                              <th>Phone</th>
                              <th>Role</th>
                              <th>Country</th>
                              <th>
                                Verification Status
                              </th>
                              <th>Status</th>
                              <th>Registered Date</th>
                            </tr>
                          </thead>
                          <tbody>
                          {users.length > 0 ? (
                            users.map((u, index) => {
                              return (
                                <tr key={u._id}>
                                  <td>
                                    {index + 1}
                                  </td>
                                  <td>
                                    <span>
                                      {u.first_name} {u.last_name}
                                    </span>
                                  </td>
                                  <td>{u.email}</td>
                                  <td>{u.phone}</td>
                                  <td>
                                    {u.role === 1 ? (
                                      <td>Admin</td>
                                    ) : (
                                      <></>
                                    )}
                                    {u.role === 2 ? (
                                      <td>
                                        Employer
                                      </td>
                                    ) : (
                                      <></>
                                    )}
                                    {u.role === 0 ? (
                                      <td>
                                        Applicant
                                      </td>
                                    ) : (
                                      <></>
                                    )}
                                  </td>
                                  <td>
                                    {u?.country?.countryName}
                                  </td>
                                  <td>
                                    {u.verified ? (
                                      <>Verified</>
                                    ) : (
                                      <>Unverified</>
                                    )}
                                  </td>

                                  <td>{u.status}</td>
                                  <td>
                                    {moment(u.registeredDate).format(
                                      "ll"
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td
                                colSpan={3}
                                style={{ fontWeight: "300" }}
                              >
                                No User Found.
                              </td>
                            </tr>
                          )}                         
                          </tbody>
                        </table>
                      </div>
                      <nav className="app-pagination mt-4">
                        <ul class="pagination justify-content-center">
                          <li className="page-item">
                            <button
                              className="page-link"
                              onClick={prevPage}
                              disabled={currentPage === 1}
                            >
                              Previous
                            </button>
                          </li>                             
                          {pageNumbers.map((number) => (
                            <li
                              key={number}
                              className={
                                currentPage === number
                                  ? "page-item active disabled"
                                  : ""
                              }
                            >
                              <Link
                                onClick={() => pagination(number)}
                                disabled={currentPage === totalPages}
                                to="#"
                                className="page-link"
                              >
                                {number}
                              </Link>
                            </li>
                          ))}
                          <li className="page-item">
                            <button
                              className="page-link"
                              onClick={nextPage}
                              disabled={currentPage === totalPages}
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
              {/*=========== Registered Users Table Ends ============= */}
            </div>            
            {/* Footer */}
            <footer className="footer">
              <div className="d-sm-flex justify-content-center justify-content-sm-between">
                <span className="text-muted text-center text-sm-left d-block d-sm-inline-block">Copyright © 2025 <Link to="/" target="_blank" rel="noreferrer">ThinkBeyond</Link>. All rights reserved.</span>
              </div>
            </footer>
          </div>
      </div>
    </div>
  );    
};

export default TestDashboardHome;
