import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import API from '../../../helpers/API';

import { LogoutLink } from '../../Logout/Logout';
import { LogoutNavbarLink } from '../../Logout/LogoutNavbar';


import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button, Modal } from "antd";

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
import { SidebarOpen } from 'lucide-react';


const TestViewContactMessage = () => {
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
const log = () => {
  if (editorRef.current) {
    console.log(editorRef.current.getContent());
  }
};
const params = useParams();

const [contact, setContact] = useState({});
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [id, setId] = useState("");

  // initialize Contact Us Message By Id
  useEffect(() => {
    fetchContactMessage();
  }, []);

  const fetchContactMessage = async () => {
    try {
      const { data } = await API.get(`/api/v1/contact/message/${params.id}`);
      setFirstName(data.contact.first_name);
      setContact(data.contact);
      setId(data.contact._id);
      setLastName(contact.last_name);
      setEmail(contact.email);
      setPhone(contact.phone);
      setSubject(contact.subject);
      setMessage(contact.message);
    } catch (error) {
      console.log(error);
    }
  };

  const handleDeleteContactMessageSubmit = async () => {
    try {
      await API.delete(`/contact/delete/${params.id}`);
      notifySucc("Contact Message Has Been Deleted Successfully...");
      navigate("/Admin/All-Contact-Us-Messages");
    } catch (error) {
      console.log(error);
      notifyErr(
        "Opps!!! FAILED.. Something went wrong, Contact Message DELETE Failed."
      );
    }
  };

  const handleCancel = () => {
    navigate('/Admin/All-Contact-Us-Messages'); // Replace '/desired-path' with the actual path you want to navigate to
  };

    return (
      <div className="container-scroller">
        <Helmet>
          <link rel="canonical" href={canonicalUrl} />
          <title>
          {contact.subject
            ? `View Message: ${contact.subject}`
            : "View Contact Message | ThinkBeyond"}
        </title>
        <meta
          name="description"
          content={`View Message With Subject: ${contact.subject || "View Contact Us Message ThinkBeyond"}`}
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
                    <i className="mdi mdi-eye"></i>
                  </span> {contact.subject}
                </h3>
              </div>            
              {/* Stats Cards */}      
              {/* Recent Tickets Table */}
              <div className="row">
                <div className="col-12 grid-margin">
                  <div className="card">
                    <div className="card-body">
                      <h4 className="card-title"> <span>
                      Contact Message Subject:{" "} <strong className='ms-3'>{contact.subject}</strong>
                      <hr/>
                    </span></h4>
                    <p>
                      Full Name: 
                        <strong className='ms-3'>
                          {contact.first_name} {contact.last_name}
                        </strong>
                    </p>
                    <p>
                      Email: 
                      <strong className='ms-3'>{contact.email}</strong>
                    </p>
                    <p>
                      Phone:
                      <strong className='ms-3'>{contact.phone}</strong>
                    </p>
                    <p>
                      Subject:
                      <strong className='ms-3'>{contact.subject}</strong>
                    </p>
                    <p>
                      Message:
                      <div
                            className="item-label"
                            dangerouslySetInnerHTML={{
                              __html: contact.message
                            }}
                          ></div>
                    </p>
                  </div>
                  <div className='col-md-7 mx-auto mb-5'>
                    <button
                        type="submit"
                        className="btn btn-danger rounded-0"
                        onClick={handleDeleteContactMessageSubmit}
                      >
                        <i className="fas fa-trash"></i> Delete Message
                      </button>
                      <button                        
                        className="ms-3 btn btn-success rounded-0"
                        onClick={handleCancel}
                      >
                        <i className="fas fa-times"></i> Cancel
                      </button>
                  </div>
                </div>
              </div>
            </div>            
            {/* Footer */}
            <Footer />
          </div>
      </div>
    </div>
  </div>
  );    
};

export default TestViewContactMessage;
