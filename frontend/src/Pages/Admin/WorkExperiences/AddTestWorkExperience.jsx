import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate  } from 'react-router-dom';
import { Helmet } from "react-helmet";
import API from '../../../helpers/API';

import { LogoutLink } from '../../Logout/Logout';
import { LogoutNavbarLink } from '../../Logout/LogoutNavbar';

import AddTestWorkExperienceForm from './AddTestWorkExperienceForm';
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

const Loader = () => (
  <div className="container text-center">
    <div className="spinner-border" role="status">
      <span className="sr-only">Loading...</span>
    </div>
  </div>
);

const AddTestWorkExperience = () => {
 
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
    navigate('/Admin/Test-Manage-Qualifications'); // Replace '/desired-path' with the actual path you want to navigate to
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
const [workExperience, setWorkExperience] = useState("");
const [workExperiences, setWorkExperiences] = useState([]);
const [workExperienceName, setWorkExperienceName] = useState("");
const [visible, setVisible] = useState(false);
const [selected, setSelected] = useState(null);
const [updatedName, setUpdatedName] = useState("");

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const { data } = await API.post("/api/v1/workExperience/addWorkExperience", {
      workExperienceName
    });

    if (data.success) {
      notifySucc(
        `New Work Experience: ${workExperienceName} has been Added Successfully!!`
      );
      setWorkExperienceName("");
      navigate("/Admin/Test-Manage-Work-Experiences");
      fetchWorkExperiences();
    } else {
      notifyErr(data.message);
    }
  } catch (error) {
    console.log(error);
    notifyErr(
      "Opps!!! FAILED.. Something went wrong, New Work Experience Failed to be added."
    );
  }
};

useEffect(() => {
  fetchWorkExperiences();
}, []);

const fetchWorkExperiences = async () => {
  try {
    const { data } = await API.get("/api/v1/workExperience/fetchWorkExperiences");
    if (data?.success) {
      setWorkExperiences(data?.workExperiences);
    }
  } catch (error) {
    console.log(error);
    notifyErr(
      "Oppss!!, FAILED, Something went Wrong Retrieving all Work Experiences"
    );
  }
};

const handleUpdate = async (e) => {
  e.preventDefault();
  try {
    const { data } = await API.put(
      `/api/v1/workExperience/updateWorkExperience/${selected._id}`,
      { workExperienceName: updatedName }
    );
    if (data.success) {
      notifySucc(`${updatedName} has been Updated Successfully!!`);
      navigate("/Admin/Test-Manage-Work-Experiences");
      setSelected(null);
      setUpdatedName("");
      setVisible(false);
      fetchWorkExperiences();
    } else {
      notifyErr(data.message);
    }
  } catch (error) {
    console.log(error);
    notifyErr(
      "Oppss!!, FAILED, Something went Wrong Updating This Work Experience"
    );
  }
};

const handleDelete = async (cId) => {
  try {
    const { data } = await API.delete(
      `/api/v1/workExperience/deleteWorkExperienceById/${cId}`,
      { workExperienceName: updatedName }
    );
    if (data.success) {
      notifySucc("Work Experience has been Deleted Successfully!!");
      fetchWorkExperiences();
    } else {
      notifyErr(data.message);
    }
  } catch (error) {
    console.log(error);
    notifyErr(
      "Oppss!!, FAILED, Something went Wrong Deleting This Work Experience"
    );
  }
};

  return (
      <div className="container-scroller">
        <Helmet>
          <link rel="canonical" href={canonicalUrl} />
          <title>Admin Add Qualification | ThinkBeyond</title>
            <meta
            name="description"
            content="Admin Add Qualification | ThinkBeyond"
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
                      <h4 className="card-title">Add New Qualification Form</h4>
                      <AddTestWorkExperienceForm
                        handleSubmit={handleSubmit}
                        value={workExperienceName}
                        setValue={setWorkExperienceName}
                      />
                    </div>
                    <Modal
                        onCancel={() => setVisible(false)}
                        footer={null}
                        open={visible}
                    >
                        <AddTestWorkExperienceForm
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

export default AddTestWorkExperience;
