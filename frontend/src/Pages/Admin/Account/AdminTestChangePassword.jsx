import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation  } from 'react-router-dom';
import { Helmet } from "react-helmet";
import API from '../../../helpers/API';
import { LogoutLink } from '../../Logout/Logout';
import { LogoutNavbarLink } from '../../Logout/LogoutNavbar';

import { useAuth } from "../../../Context/AuthContext";

import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Editor } from "@tinymce/tinymce-react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

import $ from 'jquery';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import '../assets/vendors/mdi/css/materialdesignicons.min.css';
import '../assets/vendors/ti-icons/css/themify-icons.css';
import '../assets/vendors/css/vendor.bundle.base.css';
import '../assets/vendors/font-awesome/css/font-awesome.min.css';
import '../assets/vendors/bootstrap-datepicker/bootstrap-datepicker.min.css';
import '../assets/css/style.css';

// Fixed imports - import default exports
import initOffCanvas from '../assets/js/off-canvas';
import misc from '../assets/js/misc';
import settings from '../assets/js/settings';
import todolist from '../assets/js/todolist';

import LogoSvg from '../assets/images/Test-Logo.png';
import LogoSvgMini from '../assets/images/Test-Logo-Mini.png';

import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { SidebarOpen } from 'lucide-react';



const Loader = () => (
  <div className="container text-center">
    <div className="spinner-border" role="status">
      <span className="sr-only">Loading...</span>
    </div>
  </div>
);

const AdminTestChangePassword = () => {

  const visitSaleChartRef = useRef(null);
  const trafficChartRef = useRef(null);
  const visitSaleChartLegendRef = useRef(null);
  const trafficChartLegendRef = useRef(null);
  const [isProBannerVisible, setIsProBannerVisible] = useState(true);

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [messageDropdownOpen, setMessageDropdownOpen] = useState(false);

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
    if (messageDropdownOpen) setMessageDropdownOpen(false);
  };

  const toggleMessageDropdown = () => {
    setMessageDropdownOpen(!messageDropdownOpen);
    if (profileDropdownOpen) setProfileDropdownOpen(false);
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

  const closeBanner = () => {
    setIsProBannerVisible(false);
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);

  // Toggle dropdowns
  

  const toggleNotificationDropdown = () => {
    setNotificationDropdownOpen(!notificationDropdownOpen);
    setProfileDropdownOpen(false);
    setMessageDropdownOpen(false);
  };

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
  // ===============================
  const canonicalUrl = window.location.href; // Get the current URL
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const emailRegex = /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/;
  const [auth, setAuth] = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState();
  const [visible, setVisible] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      notifyErr("Email Field Cannot be Empty");
      return;
    }
    if (!emailRegex.test(email)) {
      notifyErr("Invalid Email Address");
      return;
    }
    if (!password) {
      notifyErr("Password Field Cannot be Empty");
      return;
    }

    try {
    } catch (error) {
      console.log(error);
      {
        notifyErr("Something Went Wrong, Login Failed!!!. Try Again Later");
      }
    }
  };


    return (
        <>        
        <div className="container-scroller">
          <Helmet>
            <link rel="canonical" href={canonicalUrl} />
            <title>Admin Update Password| ThinkBeyond</title>
            <meta name="description" content="Admin Update Password | Thinkbeyond" />
          </Helmet>
            <Navbar 
              toggleMinimize={toggleMinimize} 
              toggleMobileSidebar={toggleMobileSidebar} 
            />
            <div className="container-fluid page-body-wrapper">
            {/* Sidebar */}
              <Sidebar isOpen={sidebarOpen} />
              <div className="main-panel">
                  <div className="content-wrapper">
                  <div className="page-header">
                      <h3 className="page-title">
                      <span className="page-title-icon bg-gradient-primary text-white me-2">
                          <i className="mdi mdi-lock"></i>
                      </span> Change Password
                      </h3>
                  </div>        
                  <div className="row">
                      <div className="col-9 grid-margin mx-auto">
                      <div className="card">
                          <div className="card-body">
                              <h4 className="card-title">Update Password</h4>
                              <form onSubmit={handleLoginSubmit} className="forms-sample" encType="multipart/form-data">
                                  <div className="form-group">
                                      <label for="">Old Password</label>
                                      <input 
                                        type={visible ? "text" : "password"}
                                        className="form-control" 
                                        placeholder="Old Password" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                      />
                                      {visible ? (
                                        <AiOutlineEye
                                          className="absolute right-2 top-2 cursor-pointer"
                                          size={25}
                                          onClick={() => setVisible(false)}
                                        />
                                      ) : (
                                        <AiOutlineEyeInvisible
                                          className="absolute right-2 top-2 cursor-pointer"
                                          size={25}
                                          onClick={() => setVisible(true)}
                                        />
                                      )}
                                  </div>  
                                  <div className="form-group">
                                    <label for="">New Password:</label>
                                    <input
                                      type={visible ? "text" : "password"}
                                      className="form-control"
                                      placeholder="New Password" 
                                      value={password}
                                      onChange={(e) => setPassword(e.target.value)}
                                    />
                                    {visible ? (
                                      <AiOutlineEye
                                        className="absolute right-2 top-2 cursor-pointer"
                                        size={25}
                                        onClick={() => setVisible(false)}
                                      />
                                    ) : (
                                      <AiOutlineEyeInvisible
                                        className="absolute right-2 top-2 cursor-pointer"
                                        size={25}
                                        onClick={() => setVisible(true)}
                                      />
                                    )}
                                  </div>  
                                  <div className="form-group">
                                    <label for="">Confirm Password:</label>
                                    <input
                                      type={visible ? "text" : "password"}
                                      className="form-control"
                                      placeholder="Confirm New Password" 
                                      value={password}
                                      onChange={(e) => setPassword(e.target.value)}
                                    />
                                    {visible ? (
                                      <AiOutlineEye
                                        className="absolute right-2 top-2 cursor-pointer"
                                        size={25}
                                        onClick={() => setVisible(false)}
                                      />
                                    ) : (
                                      <AiOutlineEyeInvisible
                                        className="absolute right-2 top-2 cursor-pointer"
                                        size={25}
                                        onClick={() => setVisible(true)}
                                      />
                                    )}
                                  </div>                
                                  <button type="submit" className="btn btn-gradient-primary me-2" disabled={loading}>
                                    <i className='mdi mdi-repeat me-2'></i>
                                  {loading ? <Loader /> : "Update Password"}
                                  </button>
                              </form>
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
      </>
    );
};

export default AdminTestChangePassword;