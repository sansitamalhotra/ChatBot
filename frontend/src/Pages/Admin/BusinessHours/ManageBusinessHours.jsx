//frontend/src/Pages/Admin/BusinessHours/ManageBusinessHours.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import API from '../../../helpers/API';
import './BusinessHours.css';

// Import Modal Components
import BusinessHoursModalForm from './Forms/BusinessHoursModalForm';
import { HolidayModal, SpecialHoursModal } from './Forms/BusinessHoursModalForm';

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

// import default exports
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

const ManageBusinessHours = () => {
  const [businessHours, setBusinessHours] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schedule, setSchedule] = useState(null);

  const [holidayMoreThan30Days, setHolidayMoreThan30Days] = useState(null);
  const [showHolidayMoreThan30DaysInfo, setShowHolidayMoreThan30DaysInfo] = useState(false);
  
  const canonicalUrl = window.location.href; 
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

  // Modal states
  const [modals, setModals] = useState({
    businessHours: false,
    holiday: false,
    specialHours: false
  });

  // Edit states
  const [editData, setEditData] = useState({
    businessHours: null,
    holiday: null,
    specialHours: null
  });

  const refreshAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchBusinessHours(),
        fetchBusinessHoursStatus(),
        fetchForthcomingSchedule()
      ]);
      
      // If holiday Beyond 30 Days data was previously loaded, refresh it too
      if (holidayMoreThan30Days) {
        console.log('Refreshing Holidays Beyond 30 Days data for updated data fetching...');
        await fetchHolidayMoreThan30Days();
      }
      
      notifySucc('Data Refreshed Successfully!');
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Error refreshing data');
      notifyErr('Error refreshing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchBusinessHours(),
          fetchBusinessHoursStatus(),
          fetchForthcomingSchedule()
        ]);
      } catch (err) {
        console.error('Error initializing data:', err);
        setError('Failed to load business hours data');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const fetchBusinessHours = async () => {
    try {
      const response = await API.get('/api/v1/businessHours/fetchBusinessHours');
      if (response.data && response.data.success) {
        setBusinessHours(response.data.data.businessHours);
        setError(null);
      } else {
        console.log('No business hours configuration found');
      }
    } catch (err) {
      console.error('Error fetching business hours:', err);
      if (err.message && !err.message.includes('404')) {
        setError('Error fetching business hours: ' + err.message);
      }
    }
  };

  const fetchBusinessHoursStatus = async () => {
    try {
      const response = await API.get('/api/v1/businessHours/checkBusinessHoursStatus');
      if (response.data && response.data.success) {
        setStatus(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching business hours status:', err);
    }
  };

  const fetchHolidayMoreThan30Days = async (showSuccessMessage = false) => {
    try {
      console.log('Fetching Holidays More Than 30 Days data...');
      setLoading(true);
      
      const response = await API.get('/api/v1/businessHours/holidaysMoreThan30Days');
      
      if (response.data && response.data.success) {
        console.log('=== HOLIDAYS MORE THAN 30 DAYS RESPONSE ===');
        console.log('Full response:', response.data.data);
        
        // Log holidays with descriptions
        if (response.data.data.holidays) {
          console.log('Holidays with descriptions:', response.data.data.holidays.map(h => ({
            name: h.name,
            description: h.description,
            hasDescription: !!h.description
          })));
        }        
        setHolidayMoreThan30Days(response.data.data);
        setShowHolidayMoreThan30DaysInfo(true);
        
        if (showSuccessMessage) {
          notifySucc('Holidays Beyond 30 Days Data Refreshed Successfully!');
        }
      } else {
        notifyErr('Failed to fetch Holidays Beyond 30 Days  data');
      }
    } catch (err) {
      console.error('Error fetching Holidays Beyond 30 Days  data:', err);
      notifyErr('Error fetching Holidays Beyond 30 Days  data: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchForthcomingSchedule = async () => {
    try {
      console.log('=== FRONTEND: Fetching forthcoming schedule ===');
      setLoading(true);
      
      const response = await API.get('/api/v1/businessHours/fetchForthComingSchedule');
      
      if (response.data && response.data.success) {
        console.log('=== FRONTEND RECEIVED DATA ===');
        console.log('Full response:', response.data);
        console.log('Response data structure:', {
          holidays: response.data.data.holidays?.length || 0,
          specialHours: response.data.data.specialHours?.length || 0,
          regularHours: !!response.data.data.regularHours
        });
               
        if (response.data.data.holidays && response.data.data.holidays.length > 0) {
          console.log('Holidays received:', response.data.data.holidays.length);
          response.data.data.holidays.forEach((holiday, index) => {
            console.log(`Holiday ${index}:`, {
              name: holiday.name,
              date: holiday.date,
              description: holiday.description || 'No description',
              hasDescription: !!holiday.description,
              recurring: holiday.recurring
            });
          });
        } else {
          console.log('No Holidays Received in Response');
        }
        
        setSchedule(response.data.data);
        setError(null);
      } else {
        console.error('Invalid response format:', response.data);
        setError('Invalid response format from server');  
        console.log('Main fetch failed, attempting to fetch Holidays Beyond 30 Days data...');
        await fetchHolidayMoreThan30Days();
      }
    } catch (err) {
      console.error('Error fetching forthcoming schedule:', err);
      setError('Error fetching schedule: ' + (err.response?.data?.message || err.message)); 
      console.log('Main fetch failed with error, attempting to fetch Holidays Beyond 30 Days data...');
      await fetchHolidayMoreThan30Days();
    } finally {
      setLoading(false);
    }
  };

  const createDefaultConfiguration = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await API.post('/api/v1/businessHours/addDefaultBusinessHoursConfiguration');
      if (response.data && response.data.success) {
        setBusinessHours(response.data.data);
        await fetchBusinessHoursStatus();
        await fetchForthcomingSchedule();
        if (holidayMoreThan30Days) {
          console.log('Refreshing Holiday data after creating default config...');
          await fetchHolidayMoreThan30Days();
        }
        
        notifySucc('Default business hours configuration created successfully!');
      } else {
        setError(response.data?.message || 'Failed to create default configuration');
        notifyErr(response.data?.message || 'Failed to create default configuration');
      }
    } catch (err) {
      console.error('Error creating default configuration:', err);
      const errorMsg = 'Error creating default configuration: ' + (err.message || 'Unknown error');
      setError(errorMsg);
      notifyErr(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchBusinessHours(),
        fetchBusinessHoursStatus(),
        fetchForthcomingSchedule()
      ]);
      notifySucc('Holidays Data refreshed successfully!');
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Error refreshing data');
      notifyErr('Error refreshing data');
    } finally {
      setLoading(false);
    }
  };

  // Modal handlers
  const openModal = (modalType, editData = null) => {
    setModals(prev => ({ ...prev, [modalType]: true }));
    if (editData) {
      setEditData(prev => ({ ...prev, [modalType]: editData }));
    }
  };

  const closeModal = (modalType) => {
    setModals(prev => ({ ...prev, [modalType]: false }));
    setEditData(prev => ({ ...prev, [modalType]: null }));
  };

  const handleModalSuccess = async (modalType, successMessage) => {
    closeModal(modalType);  
    // Use the new refreshAllData function that also updates holiday data
    await refreshAllData();  
    if (successMessage) {
      notifySucc(successMessage);
    }
  };

  // Delete handlers
  const handleDeleteHoliday = async (holidayIndex) => {
    if (!window.confirm('Are You Sure You Want To Delete This Holiday?')) return;
    
    try {
      setLoading(true);
      // Remove holiday from businessHours
      const updatedBusinessHours = { ...businessHours };
      updatedBusinessHours.holidays.splice(holidayIndex, 1);
      
      const response = await API.put(`/api/v1/businessHours/updateBusinessHours/${businessHours._id}`, updatedBusinessHours);
      if (response.data && response.data.success) {
        await refreshAllData();
        notifySucc('Holiday Deleted Successfully!');
      } else {
        setError('Failed to delete holiday');
        notifyErr('Failed to delete holiday');
      }
    } catch (err) {
      console.error('Error deleting holiday:', err);
      const errorMsg = 'Error deleting holiday: ' + err.message;
      setError(errorMsg);
      notifyErr(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSpecialHours = async (specialIndex) => {
    if (!window.confirm('Are you sure you want to delete these special hours?')) return;
    
    try {
      setLoading(true);
      const updatedBusinessHours = { ...businessHours };
      updatedBusinessHours.specialHours.splice(specialIndex, 1);
      
      const response = await API.put(`/api/v1/businessHours/updateBusinessHours/${businessHours._id}`, updatedBusinessHours);
      if (response.data && response.data.success) {
        await refreshAllData();
        notifySucc('Special hours deleted successfully!');
      } else {
        setError('Failed to delete special hours');
        notifyErr('Failed to delete special hours');
      }
    } catch (err) {
      console.error('Error deleting special hours:', err);
      const errorMsg = 'Error deleting special hours: ' + err.message;
      setError(errorMsg);
      notifyErr(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusClass = () => {
    if (!status) return 'status-closed';
    if (status.isOpen && !status.isNearClosing) return 'status-open';
    if (status.isOpen && status.isNearClosing) return 'status-warning';
    return 'status-closed';
  };

  const getStatusIndicator = () => {
    if (!status) return 'closed';
    if (status.isOpen && !status.isNearClosing) return 'open';
    if (status.isOpen && status.isNearClosing) return 'warning';
    return 'closed';
  };

  const getStatusMessage = () => {
    if (!status) return 'Status unavailable';
    if (status.isOpen && !status.isNearClosing) return 'Currently Open';
    if (status.isOpen && status.isNearClosing) return 'Open - Closing Soon';
    return 'Currently Closed';
  };

  if (loading) {
    return (
      <div className="business-hours-container">
        <Helmet>
          <title>Business Hours Management</title>
        </Helmet>
        <div className="business-hours-header">
          <h1 className="business-hours-title">Business Hours Management</h1>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading business hours...</p>
        </div>
      </div>
    );
  }

  const goToDashboard = () => {
    setLoading(true);
    navigate('/Admin/Dashboard');
  };

  return (
    <div className="container-scroller business-hours-container fade-in">
      <Helmet>
        <link rel="canonical" href={canonicalUrl} />
        <title>Admin Business Hours Management | ProsoftSynergies</title>
        <meta name="description" content="Admin Business Hours Management | ProsoftSynergies" />
      </Helmet>
      <Navbar 
        toggleMinimize={toggleMinimize} 
        toggleMobileSidebar={toggleMobileSidebar} 
      />
      <div className="business-hours-header mt-5">
        <h1 className="business-hours-title">Business Hours Management</h1>
        <div className="business-hours-actions">
          {businessHours ? (
            <>
              <button 
                className="btn btn-success ms-2"
                onClick={() => openModal('businessHours', businessHours)}
              >
                <span><i className='fas fa-edit'></i></span> Update Settings
              </button>
              <button 
                className="btn btn-warning"
                onClick={refreshData}
                disabled={loading}
              >
                <span><i className="fas fa-refresh"></i></span> Refresh
              </button>
              <button 
                className="btn btn-info"
                onClick={goToDashboard}
                disabled={loading}
              >
                <span><i className="fas fa-home"></i></span> Dashboard
              </button>
            </>
          ) : (
            <button 
              className="btn-primary"
              onClick={createDefaultConfiguration}
              disabled={loading}
            >
              <span><i className="fas fa-bolt fa-stack-3x"></i></span> Create Default Setup
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
          <button 
            onClick={() => setError(null)} 
            className="alert-close-btn"
          >
            <span><i className="fas fa-times"></i></span>
          </button>
        </div>
      )}

      <div className="business-hours-grid">
        {/* Current Status Card */}
        <div className="business-hours-card">
          <h2 className="card-title">
            <span><i className="fas fa-chart-bar fa-5x"></i></span> Current Status
          </h2>
          
          <div className={`current-status ${getStatusClass()}`}>
            <div className={`status-indicator ${getStatusIndicator()}`}></div>
            <span>{getStatusMessage()}</span>
          </div>

          {status && (
            <div className="hours-details">
              <div className="hours-row">
                <span className="hours-label">Current Time:</span>
                <span className="hours-value">{status.currentTime}</span>
              </div>
              <div className="hours-row">
                <span className="hours-label">Timezone:</span>
                <span className="hours-value">{status.timezone}</span>
              </div>
              {status.nextAvailable && (
                <div className="hours-row">
                  <span className="hours-label">Next Available:</span>
                  <span className="hours-value">{status.nextAvailable}</span>
                </div>
              )}
              {status.minutesUntilClosing > 0 && (
                <div className="hours-row">
                  <span className="hours-label">Minutes Until Closing:</span>
                  <span className="hours-value">{status.minutesUntilClosing}</span>
                </div>
              )}
            </div>
          )}
        </div>        
        {/* Configuration Card */}
        <div className="business-hours-card">
          <h2 className="card-title">
            <span><i className="fas fa-cog"></i></span> Main Settings
          </h2>
          
          {businessHours ? (
            <div className="hours-details">
              <div className="hours-row">
                <span className="hours-label">Working Hours:</span>
                <span className="hours-value">
                  {formatTime(businessHours.workingHours.start)} - {formatTime(businessHours.workingHours.end)}
                </span>
              </div>
              <div className="hours-row">
                <span className="hours-label">Timezone:</span>
                <span className="hours-value">{businessHours.timezone}</span>
              </div>
              <div className="hours-row">
                <span className="hours-label">Active:</span>
                <span className="hours-value">{businessHours.isActive ? 'Yes' : 'No'}</span>
              </div>
              <div className="hours-row">
                <span className="hours-label">Last Updated:</span>
                <span className="hours-value">
                  {new Date(businessHours.updatedAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="working-days-section">
                <span className="hours-label">Working Days:</span>
                <div className="working-days">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                    <span 
                      key={day}
                      className={`day-badge ${businessHours.workingDays.includes(day) ? 'active' : ''}`}
                    >
                      {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="card-actions">
                <button 
                  className="btn btn-success btn-sm"
                  onClick={() => openModal('businessHours', businessHours)}
                >
                  <i className="fas fa-edit"></i> Edit Setting
                </button>
              </div>
            </div>
          ) : (
            <div className="no-data">
              <div className="no-data-icon"><i className="fas fa-exclamation-triangle"></i></div>
              <p>No business hours configuration found</p>
              <p className="no-data-subtitle">
                Create a default configuration to get started
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Settings Overview */}
      {businessHours && businessHours.settings && (
        <div className="business-hours-card settings-overview-card">
          <h2 className="card-title">
            <span><i className="fas fa-wrench"></i></span> Settings Overview
          </h2>
          
          <div className="business-hours-grid no-margin">
            <div>
              <h4 className="settings-section-title">Chat Management</h4>
              <div className="hours-details">
                <div className="hours-row">
                  <span className="hours-label">Auto Close After Hours:</span>
                  <span className="hours-value">
                    {businessHours.settings.autoCloseChatsAfterHours ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="hours-row">
                  <span className="hours-label">Warning Minutes:</span>
                  <span className="hours-value">
                    {businessHours.settings.warningMinutesBeforeClose || 30} minutes
                  </span>
                </div>
                <div className="hours-row">
                  <span className="hours-label">New Chat Cutoff:</span>
                  <span className="hours-value">
                    {businessHours.settings.allowNewChatsMinutesBeforeClose || 15} minutes before close
                  </span>
                </div>
              </div>
            </div>            
            <div>
              <h4 className="settings-section-title">Messages</h4>
              <div className="hours-details">
                <div className="hours-row">
                  <span className="hours-label">Outside Hours:</span>
                  <span className="hours-value settings-truncated">
                    {businessHours.outsideHoursMessage?.substring(0, 50)}...
                  </span>
                </div>
                <div className="hours-row">
                  <span className="hours-label">Weekend Message:</span>
                  <span className="hours-value settings-truncated">
                    {businessHours.settings.weekendMessage?.substring(0, 50)}...
                  </span>
                </div>
                <div className="hours-row">
                  <span className="hours-label">Holiday Message:</span>
                  <span className="hours-value settings-truncated">
                    {businessHours.settings.holidayMessage?.substring(0, 50)}...
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {schedule && (
        <div className="business-hours-card">
          <h2 className="card-title">
            <span><i className="fas fa-calendar"></i></span> Forthcoming Schedule (Next 30 Days)
          </h2>
          
          <div className="business-hours-grid no-margin">
            <div>
              <div className="section-header">
                <h4 className="settings-section-title">Holidays</h4>
                <button 
                  className="btn btn-success btn-sm"
                  onClick={() => openModal('holiday')}
                  disabled={!businessHours}
                >
                  <i className="fas fa-plus"></i> Add Holiday
                </button>
              </div>
              
              {schedule && schedule.holidays && schedule.holidays.length > 0 ? (
                <div className="business-hours-list">
                  {schedule.holidays.map((holiday, index) => {
                      // Validate holiday data
                      if (!holiday || !holiday.name || !holiday.date) {
                          console.warn('Invalid holiday data at index', index, holiday);
                          return null;
                      }

                      const holidayDate = new Date(holiday.date);
                      if (isNaN(holidayDate.getTime())) {
                          console.warn('Invalid holiday date:', holiday.date);
                          return null;
                      }

                      console.log(`Rendering holiday ${index}:`, {
                          name: holiday.name,
                          description: holiday.description,
                          hasDescription: !!holiday.description
                      });

                      return (
                          <div key={`holiday-${index}-${holiday.name}`} className="list-item">
                              <div className="item-info">
                                  <div className="item-title">{holiday.name}</div>
                                  <div className="item-subtitle">
                                      {holidayDate.toLocaleDateString()} 
                                      {holiday.recurring && ' (Recurring)'}
                                  </div>
                                  {holiday.description && holiday.description.trim() !== '' && (
                                      <div className="item-description">
                                          <i className="fas fa-info-circle"></i>
                                          {holiday.description}
                                      </div>
                                  )}
                              </div>
                              <div className="item-actions">
                                  <button 
                                      className="btn-icon btn-secondary"
                                      onClick={() => openModal('holiday', { ...holiday, index })}
                                      title="Edit Holiday"
                                  >
                                      <i className="fas fa-edit"></i>
                                  </button>
                                  <button 
                                      className="btn-icon btn-danger"
                                      onClick={() => handleDeleteHoliday(index)}
                                      title="Delete Holiday"
                                  >
                                      <i className="fas fa-trash"></i>
                                  </button>
                              </div>
                          </div>
                      );
                  })}
              </div>
          ) : (
              <div className="no-data">
                  <div className="no-data-icon"><i className='fas fa-gift'></i></div>
                  <p>No holidays scheduled for the next 30 days</p>
                  {businessHours && businessHours.holidays && businessHours.holidays.length > 0 && (
                      <p className="no-data-subtitle">
                          {businessHours.holidays.length} holiday(s) exist but none in the next 30 days
                      </p>
                  )}
              </div>
          )}
            </div>
            
            <div>
              <div className="section-header">
                <h4 className="settings-section-title">Special Hours</h4>
                <button 
                  className="btn btn-success btn-sm"
                  onClick={() => openModal('specialHours')}
                  disabled={!businessHours}
                >
                  <i className="fas fa-plus"></i> Add Special Hours
                </button>
              </div>
              
              {schedule.specialHours && schedule.specialHours.length > 0 ? (
                <div className="business-hours-list">
                  {schedule.specialHours.map((special, index) => (
                    <div key={index} className="list-item">
                      <div className="item-info">
                        <div className="item-title">
                          {new Date(special.date).toLocaleDateString()}
                        </div>
                        <div className="item-subtitle">
                          {special.isClosed ? 'Closed' : 
                            special.hours && special.hours.start && special.hours.end ?
                            `${formatTime(special.hours.start)} - ${formatTime(special.hours.end)}` :
                            'Special hours'
                          }
                        </div>
                        {special.reason && (
                          <div className="item-subtitle special-reason">
                            {special.reason}
                          </div>
                        )}
                      </div>
                      <div className="item-actions">
                        <button 
                          className="btn-icon btn-secondary"
                          onClick={() => openModal('specialHours', { ...special, index })}
                          title="Edit Special Hours"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          className="btn-icon btn-danger"
                          onClick={() => handleDeleteSpecialHours(index)}
                          title="Delete Special Hours"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">
                  <div className="no-data-icon"><i className="fas fa-clock"></i></div>
                  <p>No special hours scheduled</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="business-hours-card beyond-30days-card">
        <h2 className="card-title">
          <span><i className="fas fa-champagne-glasses"></i></span> Holidays Beyond 30 Days Details
        </h2>
        
        <div className="beyond-30days-actions">
          <button 
            className="btn btn-info btn-sm beyond-30days-btn"
            onClick={fetchHolidayMoreThan30Days}
            disabled={loading}
          >
            <i className="fas fa-search"></i> 
            {loading ? 'Loading...' : 'Display Holidays More Than 30 Days Details'}
          </button>
          
          {holidayMoreThan30Days && (
            <button 
              className="btn btn-outline-secondary btn-sm beyond-30days-btn"
              onClick={() => setShowHolidayMoreThan30DaysInfo(!showHolidayMoreThan30DaysInfo)}
            >
              <i className={`fas fa-eye${showHolidayMoreThan30DaysInfo ? '-slash' : ''}`}></i> 
              {showHolidayMoreThan30DaysInfo ? 'Hide' : 'Show'} Details
            </button>
          )}
        </div>
        
        {showHolidayMoreThan30DaysInfo && holidayMoreThan30Days ? (
          <div className="debug-info">
            <div className="business-hours-grid no-margin">
              <div>
                <h4>Current System Info</h4>
                <div className="debug-row">
                  <strong>Current Time:</strong> <span className="debug-success">{holidayMoreThan30Days.currentTime}</span>
                </div>
                <div className="debug-row">
                  <strong>End Time (30 days):</strong> <span className="debug-info-color">{holidayMoreThan30Days.thirtyDaysFromNow}</span>
                </div>
                <div className="debug-row">
                  <strong>Timezone:</strong> <span className="debug-purple">{holidayMoreThan30Days.timezone}</span>
                </div>
                <div className="debug-row">
                  <strong>Total Number Of Holidays Found:</strong> <span className="debug-orange">{holidayMoreThan30Days.totalHolidays}</span>
                </div>
                <div className="debug-row">
                  <strong>Filtered Holidays:</strong> <span className="debug-danger">{holidayMoreThan30Days.filteredHolidays}</span>
                </div>
                <div className="debug-row">
                  <strong>Beyond 30 Days:</strong> <span className="debug-secondary">{holidayMoreThan30Days.beyondThirtyDays}</span>
                </div>
              </div>
              <div>
                <h4>Quick Stats</h4>
                <div className="quick-stats">
                  <div className="stat-box stat-box-blue">
                    <div className="stat-number stat-number-blue">
                      {holidayMoreThan30Days.totalHolidays || 0}
                    </div>
                    <div className="stat-label">Total</div>
                  </div>
                  <div className="stat-box stat-box-green">
                    <div className="stat-number stat-number-green">
                      {holidayMoreThan30Days.filteredHolidays || 0}
                    </div>
                    <div className="stat-label">Next 30 Days</div>
                  </div>
                  <div className="stat-box stat-box-orange">
                    <div className="stat-number stat-number-orange">
                      {holidayMoreThan30Days.holidays ? holidayMoreThan30Days.holidays.filter(h => h.recurring).length : 0}
                    </div>
                    <div className="stat-label">Recurring</div>
                  </div>
                  <div className="stat-box stat-box-pink">
                    <div className="stat-number stat-number-pink">
                      {holidayMoreThan30Days.beyondThirtyDays || 0}
                    </div>
                    <div className="stat-label">Beyond 30 Days</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="holidays-section">
              <h4 className="holidays-section-title">
                <i className="fas fa-list"></i> All Holidays
                {holidayMoreThan30Days.holidays && (
                  <span className="holidays-count-badge">
                    {holidayMoreThan30Days.holidays.length} Total
                  </span>
                )}
              </h4>
              
              {holidayMoreThan30Days.holidays && holidayMoreThan30Days.holidays.length > 0 ? (
                <div className="accordion holidays-accordion" id="holidaysAccordion">
                  {holidayMoreThan30Days.holidays.map((holiday, index) => {
                    console.log(`Rendering accordion for holiday ${index}:`, {
                      name: holiday.name,
                      description: holiday.description,
                      hasDescription: !!holiday.description
                    });

                    return (
                      <div className="accordion-item" key={index}>
                        <h2 className="accordion-header" id={`heading-${index}`}>
                          <button 
                            className={`accordion-button collapsed ${holiday.isWithinRange ? 'within-range' : 'beyond-range'}`}
                            type="button" 
                            data-bs-toggle="collapse" 
                            data-bs-target={`#collapse-${index}`}
                            aria-expanded="false" 
                            aria-controls={`collapse-${index}`}
                          >
                            <div className="accordion-header-flex">
                              <div className="accordion-header-left">
                                <span>{holiday.name}</span>
                                {holiday.recurring && (
                                  <span className="badge badge-recurring">
                                    RECURRING
                                  </span>
                                )}
                                
                                {holiday.description && holiday.description.trim() !== '' && (
                                  <span className="badge badge-has-description">
                                    <i className="fas fa-info-circle"></i> HAS DESCRIPTION
                                  </span>
                                )}
                              </div>
                              <span className={`badge badge-status ${holiday.isWithinRange ? 'badge-within-range' : 'badge-beyond-range'}`}>
                                {holiday.isWithinRange ? 'WITHIN 30 DAYS' : 'BEYOND 30 DAYS'}
                              </span>
                            </div>
                          </button>
                        </h2>
                        <div 
                          id={`collapse-${index}`} 
                          className="accordion-collapse collapse" 
                          aria-labelledby={`heading-${index}`}
                          data-bs-parent="#holidaysAccordion"
                        >
                          <div className="accordion-body">                            
                            {holiday.description && holiday.description.trim() !== '' ? (
                              <div className="holiday-description-box">
                                <div className="holiday-description-header">
                                  <i className="fas fa-scroll"></i>
                                  Holiday Description
                                </div>
                                <div className="holiday-description-text">
                                  "{holiday.description}"
                                </div>
                              </div>
                            ) : (
                              <div className="no-description-warning">
                                <i className="fas fa-exclamation-triangle"></i>
                                No description provided for this holiday
                              </div>
                            )}
                            <div className="holiday-details-grid">
                              <div className="holiday-detail-item">
                                <strong>Date:</strong> 
                                <code className="holiday-detail-code">
                                  {holiday.formattedDate}
                                </code>
                              </div>
                              <div className="holiday-detail-item">
                                <strong>Days from now:</strong> 
                                <code className={`holiday-detail-code ${holiday.daysFromNow < 0 ? 'negative' : 'positive'}`}>
                                  {holiday.daysFromNow}
                                </code>
                              </div>
                              <div className="holiday-detail-item">
                                <strong>Valid date:</strong>
                                <span className={`validation-result ${holiday.isValid ? 'valid' : 'invalid'}`}>
                                  {holiday.isValid ? (
                                  <><i className="fas fa-check text-success"></i> Yes</>
                                ) : (
                                  <><i className="fas fa-times text-danger"></i> No</>
                                )}
                                </span>
                              </div>
                              <div className="holiday-detail-item">
                                <strong>Type:</strong>
                                <span className={`holiday-status-badge ${holiday.recurring ? 'recurring' : 'one-time'}`}>
                                  {holiday.recurring ? 'Recurring' : 'One-time'}
                                </span>
                              </div>
                              <div className="holiday-detail-item">
                                <strong>Status:</strong>
                                <span className={`holiday-range-badge ${holiday.isWithinRange ? 'upcoming' : 'future'}`}>
                                  {holiday.isWithinRange ? 'UPCOMING' : 'FUTURE'}
                                </span>
                              </div>
                              <div className="holiday-detail-item">
                                <strong>Has Description:</strong>
                                <span className={`validation-result ${(holiday.description && holiday.description.trim() !== '') ? 'valid' : 'invalid'}`}>                                 
                                  {(holiday.description && holiday.description.trim() !== '') ? (
                                    <><i className="fas fa-check text-success"></i> Yes</>
                                  ) : (
                                    <><i className="fas fa-times text-danger"></i> No</>
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <i className="fas fa-inbox"></i>
                  <p>No Holidays Found</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="info-placeholder">
            <i className="fas fa-info-circle"></i>
            <p>
              {holidayMoreThan30Days ? 'Click "Show Details" to view information' : 'Click "Display Holidays More Than 30 Days Details" to load data'}
            </p>
          </div>
        )}
      </div>
      
      <div className="business-hours-card">
        <h2 className="card-title">
          <span><i className="fas fa-bolt"></i></span> Quick Actions
        </h2>
        
        <div className="business-hours-actions quick-actions-grid">
          <button 
            className="btn btn-success"
            onClick={() => openModal('businessHours', businessHours)}
            disabled={!businessHours}
          >
            <span><i className="fas fa-edit"></i></span> Add/Update Hours
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => openModal('holiday')}
            disabled={!businessHours}
          >
            <span><i className='fas fa-gift'></i></span> Manage Holidays
          </button>
          <button 
            className="btn btn-warning"
            onClick={() => openModal('specialHours')}
            disabled={!businessHours}
          >
            <span><i className='fas fa-star'></i></span> Special Hours
          </button>
          {!businessHours && (
            <button 
              className="btn btn-success" 
              onClick={createDefaultConfiguration}
              disabled={loading}
            >
              <span><i className='fas fa-rocket'></i></span> Quick Setup
            </button>
          )}
        </div>
      </div>

      {/* Modal Components */}
      <BusinessHoursModalForm
        isOpen={modals.businessHours}
        onClose={() => closeModal('businessHours')}
        onSuccess={() => handleModalSuccess('businessHours', 'Business hours updated successfully!')}
        editData={editData.businessHours}
        businessHoursId={businessHours?._id}
      />

      <HolidayModal
        isOpen={modals.holiday}
        onClose={() => closeModal('holiday')}
        onSuccess={() => handleModalSuccess('holiday', 'Holiday saved successfully!')}
        editData={editData.holiday}
        businessHoursId={businessHours?._id}
      />

      <SpecialHoursModal
        isOpen={modals.specialHours}
        onClose={() => closeModal('specialHours')}
        onSuccess={() => handleModalSuccess('specialHours', 'Special hours saved successfully!')}
        editData={editData.specialHours}
        businessHoursId={businessHours?._id}
      />
      <Footer />
    </div>
  );
};

export default ManageBusinessHours;
