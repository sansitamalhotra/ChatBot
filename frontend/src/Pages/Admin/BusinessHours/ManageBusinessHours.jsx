//frontend/src/Pages/Admin/BusinessHours/ManageBusinessHours.jsx - Fixed
import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import API from '../../../helpers/API';
import './BusinessHours.css';

const ManageBusinessHours = () => {
  const [businessHours, setBusinessHours] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schedule, setSchedule] = useState(null);

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
        // Not necessarily an error - might just be no configuration
        console.log('No business hours configuration found');
      }
    } catch (err) {
      console.error('Error fetching business hours:', err);
      // Don't set this as an error since it might be expected for new setups
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
      // Don't show error for status check failures
    }
  };

  const fetchForthcomingSchedule = async () => {
    try {
      const response = await API.get('/api/v1/businessHours/fetchForthComingSchedule');
      if (response.data && response.data.success) {
        setSchedule(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching schedule:', err);
      // Don't show error for schedule fetch failures
    }
  };

  const createDefaultConfiguration = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await API.post('/api/v1/businessHours/addDefaultBusinessHoursConfiguration');
      if (response.data && response.data.success) {
        setBusinessHours(response.data.data);
        // Refresh status after creating default config
        await fetchBusinessHoursStatus();
        await fetchForthcomingSchedule();
      } else {
        setError(response.data?.message || 'Failed to create default configuration');
      }
    } catch (err) {
      console.error('Error creating default configuration:', err);
      setError('Error creating default configuration: ' + (err.message || 'Unknown error'));
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
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Error refreshing data');
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
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '20px' }}>Loading business hours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="business-hours-container fade-in">
      <Helmet>
        <title>Business Hours Management</title>
      </Helmet>
      
      <div className="business-hours-header">
        <h1 className="business-hours-title">Business Hours Management</h1>
        <div className="business-hours-actions">
          {businessHours ? (
            <>
              <Link to="/admin/business-hours/add" className="btn-primary ms-2">
                <span><i className='fas fa-plus fa-2x'></i></span> Update Configuration
              </Link>
              <button 
                className="btn-secondary"
                onClick={refreshData}
                disabled={loading}
              >
                <span><i class="fab fa-nfc-symbol fa-2x"></i></span> Refresh
              </button>
            </>
          ) : (
            <button 
              className="btn-primary"
              onClick={createDefaultConfiguration}
              disabled={loading}
            >
              <span><i class="fas fa-bolt fa-2x"></i></span> Create Default Setup
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
          <button 
            onClick={() => setError(null)} 
            style={{ float: 'right', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <span><i class="fas fa-close fa-2x"></i></span>
          </button>
        </div>
      )}

      <div className="business-hours-grid">
        {/* Current Status Card */}
        <div className="business-hours-card">
          <h2 className="card-title">
            <span><i class="fas fa-chart-bar fa-2x"></i></span> Current Status
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
            <span><i class="fas fa-gear fa-2x"></i></span> Configuration
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
              
              <div style={{ marginTop: '20px' }}>
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
            </div>
          ) : (
            <div className="no-data">
              <div className="no-data-icon"><i class="fas fa-triangle-exclamation fa-2x"></i></div>
              <p>No business hours configuration found</p>
              <p style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                Create a default configuration to get started
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Settings Overview */}
      {businessHours && businessHours.settings && (
        <div className="business-hours-card" style={{ marginBottom: '30px' }}>
          <h2 className="card-title">
            <span><i class="fas fa-wrench fa-2x"></i></span> Settings Overview
          </h2>
          
          <div className="business-hours-grid" style={{ margin: 0 }}>
            <div>
              <h4 style={{ marginBottom: '15px', color: '#495057' }}>Chat Management</h4>
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
              <h4 style={{ marginBottom: '15px', color: '#495057' }}>Messages</h4>
              <div className="hours-details">
                <div className="hours-row">
                  <span className="hours-label">Outside Hours:</span>
                  <span className="hours-value" style={{ fontSize: '0.8rem' }}>
                    {businessHours.outsideHoursMessage?.substring(0, 50)}...
                  </span>
                </div>
                <div className="hours-row">
                  <span className="hours-label">Weekend Message:</span>
                  <span className="hours-value" style={{ fontSize: '0.8rem' }}>
                    {businessHours.settings.weekendMessage?.substring(0, 50)}...
                  </span>
                </div>
                <div className="hours-row">
                  <span className="hours-label">Holiday Message:</span>
                  <span className="hours-value" style={{ fontSize: '0.8rem' }}>
                    {businessHours.settings.holidayMessage?.substring(0, 50)}...
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forthcoming Schedule */}
      {schedule && (
        <div className="business-hours-card">
          <h2 className="card-title">
            <span><i class="fas fa-calendar fa-2x"></i></span> Forthcoming Schedule (Next 30 Days)
          </h2>
          
          <div className="business-hours-grid" style={{ margin: 0 }}>
            <div>
              <h4 style={{ marginBottom: '15px', color: '#495057' }}>Holidays</h4>
              {schedule.holidays && schedule.holidays.length > 0 ? (
                <div className="business-hours-list">
                  {schedule.holidays.map((holiday, index) => (
                    <div key={index} className="list-item">
                      <div className="item-info">
                        <div className="item-title">{holiday.name}</div>
                        <div className="item-subtitle">
                          {new Date(holiday.date).toLocaleDateString()} 
                          {holiday.recurring && ' (Recurring)'}
                        </div>
                        {holiday.description && (
                          <div className="item-subtitle" style={{ marginTop: '5px' }}>
                            {holiday.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">
                  <div className="no-data-icon"><i className='fas fa-gifts fa-2x'></i></div>
                  <p>No holidays scheduled</p>
                </div>
              )}
            </div>
            
            <div>
              <h4 style={{ marginBottom: '15px', color: '#495057' }}>Special Hours</h4>
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
                          <div className="item-subtitle" style={{ marginTop: '5px' }}>
                            {special.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">
                  <div className="no-data-icon"><i class="fas fa-clock fa-2x"></i></div>
                  <p>No special hours scheduled</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="business-hours-card">
        <h2 className="card-title">
          <span><i class="fas fa-bolt fa-2x"></i></span> Quick Actions
        </h2>
        
        <div className="business-hours-actions" style={{ justifyContent: 'flex-start', gap: '20px' }}>
          <Link to="/admin/business-hours/add" className="btn-primary">
            <span><i class="fas fa-pen-to-square fa-2x"></i></span> Add/Update Hours
          </Link>
          <Link to="/admin/business-hours/holidays" className="btn-secondary">
            <span><i className='fas fa-gifts fa-2x me-2'></i></span> Manage Holidays
          </Link>
          <Link to="/admin/business-hours/special" className="btn-secondary">
            <span><i className='fas fa-star fa-2x me-2'></i></span> Special Hours
          </Link>
          {!businessHours && (
            <button 
              className="btn-primary" 
              onClick={createDefaultConfiguration}
              disabled={loading}
            >
              <span><i className='fas fa-rocket fa-2x me-2'></i></span> Quick Setup
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageBusinessHours;
