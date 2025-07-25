import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import API from '../../../helpers/API';

import { LogoutLink } from '../../Logout/Logout';
import { LogoutNavbarLink } from '../../Logout/LogoutNavbar';

import moment from "moment";


import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


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

const TestAdminSubscribers = () => {
  const canonicalUrl = window.location.href; // Get the current URL/ =========================================

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
  }, []);

  const [lgShow, setLgShow] = useState(false);

  const editorRef = useRef(null);

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
// =================
const [subscribers, setSubscribers] = useState([]);
const [numSubscribersInDB, setNumSubscribersInDB] = useState(0);
const [totalSubscribers, setTotalSubscribers] = useState(0);
const [loading, setLoading] = useState(false);

const [currentPage, setCurrentPage] = useState(1);
const [subscribersPerPage, setSubscribersPerPage] = useState(20);

useEffect(() => {
    const fetchAllSubscribers = async () => {
      try {
        setLoading(true);
        const response = await API.get(
          `/subscribers/allSubscribers?page=${currentPage}`
        );
        setSubscribers(response.data.result);
        setTotalSubscribers(response.data.totalSubscribers);
        setNumSubscribersInDB(response.data.numSubscribersInDB);
        console.log(
          "Registered Users List Number: ",
          response.data.numSubscribersInDB
        );
        localStorage.setItem("refresh", response.data.result);
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
        notifyErr(error);
      }
    };

    fetchAllSubscribers();
    window.scrollTo({ top: 0 });
    if (window.history.pushState) {
      window.history.pushState(
        null,
        null,
        `/Admin/Test-Email-Subscribers?page=${currentPage}`
      );
    }
  }, [currentPage, subscribersPerPage]);


    return (
      <div className="container-scroller">
        <Helmet>
            <link rel="canonical" href={canonicalUrl} />
            <title>Subscribers to Our Posted Job Email Notifications | ThinkBeyond</title>
            <meta
            name="description"
            content="Subscribers to Our Posted Job Email Notifications | ThinkBeyond"
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
              <div className="page-header">
                <h3 className="page-title">
                  <span className="page-title-icon bg-gradient-primary text-white me-2">
                    <i className="mdi mdi-at"></i>
                  </span> Posted Job Email Notification Subscribers
                </h3>
              </div>            
              {/* Stats Cards */}      
              {/* Recent Tickets Table */}
              <div className="row">
                <div className="col-12 grid-margin">
                  <div className="card">
                    <div className="card-body">
                      <h4 className="card-title">Email Notification Subscribers List</h4>
                      <div className="table-responsive">
                        <table className="table">
                          <thead>
                            <tr>
                                <th>No</th>
                                <th>Emails</th>
                                <th>Subscribed On</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subscribers.map((s, index) => {
                                return (
                                <tr key={s._id}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <span>{s.email}</span>
                                    </td>
                                    <td>
                                        {moment(s.subscriptionDate).format("ll")}
                                    </td>
                                </tr>
                                );
                            })}                                            
                          </tbody>
                        </table>
                      </div>
                      <nav className="app-pagination mt-5">
                            
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

export default TestAdminSubscribers;