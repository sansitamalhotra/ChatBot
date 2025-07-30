import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate  } from 'react-router-dom';
import { Helmet } from "react-helmet";
import API from '../../../helpers/API';

import { LogoutLink } from '../../Logout/Logout';
import { LogoutNavbarLink } from '../../Logout/LogoutNavbar';

import AddTestWorkModeForm from './AddTestWorkModeForm';
import { Modal } from "antd";

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

const Loader = () => (
  <div className="container text-center">
    <div className="spinner-border" role="status">
      <span className="sr-only">Loading...</span>
    </div>
  </div>
);

const AddTestWorkMode = () => {
 
  const canonicalUrl = window.location.href; // Get the current URL
  const navigate = useNavigate();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [messageDropdownOpen, setMessageDropdownOpen] = useState(false);

  const [isProBannerVisible, setIsProBannerVisible] = useState(true);

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

  const handleCancel = () => {
    navigate('/Admin/Manage-Work-Modes'); // Replace '/desired-path' with the actual path you want to navigate to
};

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

//   =======================
const [workMode, setWorkMode] = useState("");
const [workModes, setWorkModes] = useState([]);
const [workModeName, setWorkModeName] = useState("");
const [visible, setVisible] = useState(false);
const [selected, setSelected] = useState(null);
const [updatedName, setUpdatedName] = useState("");

const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post("/api/v1/workMode/addWorkMode", {
        workModeName
      });

      if (data.success) {
        notifySucc(
          `New Work Mode: ${workModeName} has been Added Successfully!!`
        );
        setWorkModeName("");
        navigate("/Admin/Manage-Work-Modes");
        fetchWorkModes();
      } else {
        notifyErr(data.message);
      }
    } catch (error) {
      console.log(error);
      notifyErr(
        "Opps!!! FAILED.. Something went wrong, New Work Mode Failed to be added."
      );
    }
  };

  useEffect(() => {
    fetchWorkModes();
  }, []);

  const fetchWorkModes = async () => {
    try {
      const { data } = await API.get("/api/v1/workMode/fetchWorkModes");
      if (data?.success) {
        setWorkModes(data?.workMode);
      }
    } catch (error) {
      console.log(error);
      notifyErr(
        "Oppss!!, FAILED, Something went Wrong Retrieving all Work Modes"
      );
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.put(
        `/api/v1/workMode/updateWorkMode/${selected._id}`,
        { workModeName: updatedName }
      );
      if (data.success) {
        notifySucc(`${updatedName} has been Updated Successfully!!`);
        navigate("/Admin/Test-Manage-Work-Modes");
        setSelected(null);
        setUpdatedName("");
        setVisible(false);
        fetchWorkModes();
      } else {
        notifyErr(data.message);
      }
    } catch (error) {
      console.log(error);
      notifyErr(
        "Oppss!!, FAILED, Something went Wrong Updating This Work Mode"
      );
    }
  };

  const handleDelete = async (cId) => {
    try {
      const { data } = await API.delete(`/api/v1/workMode/deleteWorkModeById/${cId}`, {
        workModeName: updatedName
      });
      if (data.success) {
        notifySucc("Work Mode has been Deleted Successfully!!");
        fetchWorkModes();
      } else {
        notifyErr(data.message);
      }
    } catch (error) {
      console.log(error);
      notifyErr(
        "Oppss!!, FAILED, Something went Wrong Deleting This Work Mode"
      );
    }
  };

  return (
      <div className="container-scroller">
        <Helmet>
          <link rel="canonical" href={canonicalUrl} />
          <title>Admin Add Work Mode | ThinkBeyond</title>
            <meta
            name="description"
            content="Admin Add Work Mode | ThinkBeyond"
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
                    <i className="mdi mdi-briefcase"></i>
                  </span> Add New Job
                </h3>
              </div>            
              {/* Stats Cards */}      
              {/* Recent Tickets Table */}
              <div className="row">
                <div className="col-9 grid-margin mx-auto">
                  <div className="card">
                    <div className="card-body">
                      <h4 className="card-title">Add New Work Mode Type Form</h4>
                      <AddTestWorkModeForm
                        handleSubmit={handleSubmit}
                        value={workModeName}
                        setValue={setWorkModeName}
                      />
                    </div>
                    <Modal
                        onCancel={() => setVisible(false)}
                        footer={null}
                        open={visible}
                    >
                       <AddTestWorkModeForm
                        value={updatedName}
                        setValue={setUpdatedName}
                        handleSubmit={handleUpdate}
                      />
                    </Modal>
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

export default AddTestWorkMode;
