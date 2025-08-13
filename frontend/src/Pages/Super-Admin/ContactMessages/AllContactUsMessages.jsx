import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import API from '../../../helpers/API';
import moment from "moment";
import { LogoutLink } from '../../Logout/Logout';
import { LogoutNavbarLink } from '../../Logout/LogoutNavbar';

import {
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";

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
import './ContactMessages.css';

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


const AllContactUsMessages = () => {
  const canonicalUrl = window.location.href; // Get the current URL 

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
// ======================================
const [contacts, setContacts] = useState([]);
const [contact, setContact] = useState({});
const [numRegContactUsFormMessagesInDB, setNumRegContactUsFormMessagesInDB] =
  useState(0);
const [totalContactUsFormMessages, setTotalContactUsFormMessages] =
  useState(0);
const [currentPage, setCurrentPage] = useState(1);
const [contactsPerPage, setContactsPerPage] = useState(10);
const [loading, setLoading] = useState(false);
const [full_name, setFull_Name] = useState("");
const [selectedContact, setSelectedContact] = useState(null);

useEffect(() => {
    fetchContactMessages();
    window.scrollTo({ top: 0 });
    if (window.history.pushState) {
      window.history.pushState(
        null,
        null,
        `/Admin/All-Contact-Us-Messages?page=${currentPage}`
      );
    }
  }, [currentPage, contactsPerPage]);

  const fetchContactMessages = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/api/v1/contact/messages/?page=${currentPage}`);
      
      // Check if response and response.data are defined
      if (response && response.data) {
        setContacts(response.data.result);
        setTotalContactUsFormMessages(response.data.totalContactUsFormMessages);
        setNumRegContactUsFormMessagesInDB(response.data.numRegContactUsFormMessagesInDB);
        localStorage.setItem("refresh", JSON.stringify(response.data.result)); // Store as JSON string
      } else {
        throw new Error("Unexpected response structure");
      }
      
      setLoading(false);
      setSelectedContact(null);
    } catch (error) {
      console.log(error);
      setLoading(false);
      // Notify user of the error
      notifyErr(error.response ? error.response.data.message : "An error occurred while fetching messages.");
    }
  };

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
  const totalPages = Math.ceil(totalContactUsFormMessages / contactsPerPage);


    return (
      <div className="container-scroller">
        <Helmet>
          <link rel="canonical" href={canonicalUrl} />
          <title>Admin View All Contact Us Messages| ThinkBeyond</title>
          <meta name="description" content="All Contact Us Messages | ThinkBeyond" />
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
                    <i className="mdi mdi-message-text-outline"></i>
                  </span> View All Incoming Messages From Contact Us Page
                </h3>
                <strong>
                    <span>
                      Page {currentPage} of {numRegContactUsFormMessagesInDB}{" "}
                      Messages Found
                    </span>
                </strong>
              </div>            
              {/* Stats Cards */}      
              {/* Recent Tickets Table */}
              <div className="row">
                <div className="col-12 grid-margin">
                  <div className="card">
                    <div className="card-body">
                      <h4 className="card-title">List Messages From Users</h4>
                      <div className="table-responsive">
                        <table className="table">
                          <thead>
                            <tr>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Subject</th>
                                <th>Phone</th>
                                <th>Message</th>
                                <th>Received On</th>
                                <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                          {contacts.length > 0 ? (
                            contacts.map((c) => {
                                const truncatedMessage = c.message.substring(0, 70);
                                const hasMoreText = c.message.length > 70;
                                const truncatedSubject = c.subject.substring(0, 15);
                                const hasMoreSubjectText = c.subject.length > 15;

                                return (
                                    <tr key={c._id}>
                                        <td className="cell">
                                            <span className="truncate">
                                                {c.first_name} {c.last_name}
                                            </span>
                                        </td>
                                        <td className="cell">
                                            <span className="truncate">{c.email}</span>
                                        </td>
                                        <td className="cell">
                                            <span className="truncate">
                                                {/* {c.subject} */}
                                                {truncatedSubject}
                                                {hasMoreSubjectText && 
                                                    <span>... {" "}</span>
                                                }
                                            </span>
                                        </td>
                                        <td className="cell">
                                            <span className="truncate">{c.phone}</span>
                                        </td>
                                        <td className="cell">
                                            <div className="message-preview">
                                                {truncatedMessage}
                                                {hasMoreText && 
                                                <span>...{" "} 
                                                    {" "}<Link to={`/Admin/Test-View-Contact-Message/${c._id}`}>{" "}{" "}
                                                    {" "}{" "}<EyeOutlined />
                                                    </Link>
                                                </span>}
                                            </div>
                                        </td>
                                        <td className="cell">
                                            {moment
                                                .utc(new Date(c.createdAt))
                                                .local()
                                                .startOf("seconds")
                                                .fromNow(true)}{" "}
                                            ago
                                        </td>
                                        <td className="cell">
                                            <Link
                                                className="btn-sm app-btn-secondary rounded-0 me-3"
                                                to={`/Admin/Contact-Messages/Delete-Message/${c._id}`}
                                            >
                                                <DeleteOutlined />
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={5} style={{ fontWeight: "400px" }}>
                                    <h1>No Messages Found In the Database</h1>
                                </td>
                            </tr>
                        )}                      
                          </tbody>
                        </table>
                      </div>
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

export default AllContactUsMessages;
