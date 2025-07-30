import React, { useEffect, useState, useCallback, useRef } from 'react';
import API from '../../../helpers/API';
import { useSocket } from '../../../Context/SocketContext';
import moment from 'moment';
import './AdminUsersTable.css';

const AdminUsersTable = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now()); // Added missing state
  const [newAdminIds, setNewAdminIds] = useState([]);
  const [updatedAdminIds, setUpdatedAdminIds] = useState([]);
  
  const socket = useSocket();
  const intervalRef = useRef(null);
  const updateIntervalRef = useRef(null); // Added missing ref
  const lastFetchTime = useRef(Date.now());
  const isInitialLoad = useRef(true);

  // Memoized function to clear animation states
  const clearAnimationState = useCallback((userId, type) => {
    setTimeout(() => {
      if (type === 'new') {
        setNewAdminIds(prevIds => prevIds.filter(id => id !== userId));
      } else if (type === 'updated') {
        setUpdatedAdminIds(prevIds => prevIds.filter(id => id !== userId));
      }
    }, 1500);
  }, []);

  // Enhanced fetch function with better error handling and loading states
  const fetchAdmins = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);
      
      const { data } = await API.get('api/v1/superAdmin/fetchAdminWithSession');
      
      if (data.success && data.admins) {
        setAdmins(prevAdmins => {
          // Only update if data has actually changed
          const prevAdminsString = JSON.stringify(prevAdmins);
          const newAdminsString = JSON.stringify(data.admins);
          
          if (prevAdminsString !== newAdminsString && !isInitialLoad.current) {
            // Mark existing admins as updated if their data changed
            data.admins.forEach(newAdmin => {
              const existingAdmin = prevAdmins.find(admin => admin._id === newAdmin._id);
              if (existingAdmin) {
                const adminChanged = JSON.stringify(existingAdmin) !== JSON.stringify(newAdmin);
                if (adminChanged) {
                  setUpdatedAdminIds(prev => {
                    if (!prev.includes(newAdmin._id)) {
                      clearAnimationState(newAdmin._id, 'updated');
                      return [...prev, newAdmin._id];
                    }
                    return prev;
                  });
                }
              }
            });
          }
          
          isInitialLoad.current = false;
          return data.admins;
        });
        lastFetchTime.current = Date.now();
      } else {
        setError('Invalid response from server');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Failed to fetch admin data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [clearAnimationState]);

  // Optimized socket handler with debouncing
  const handleStatusChanged = useCallback(({ userId, status, loginLatestSession, userInfo }) => {
    setAdmins(prev => {
      const existingIndex = prev.findIndex(a => a._id === userId);
      const isNew = existingIndex === -1;

      if (isNew) {
        setNewAdminIds(prevIds => {
          if (!prevIds.includes(userId)) {
            clearAnimationState(userId, 'new');
            return [...prevIds, userId];
          }
          return prevIds;
        });
      } else {
        setUpdatedAdminIds(prevIds => {
          if (!prevIds.includes(userId)) {
            clearAnimationState(userId, 'updated');
            return [...prevIds, userId];
          }
          return prevIds;
        });
      }

      if (existingIndex !== -1) {
        return prev.map(admin => 
          admin._id === userId
            ? { 
                ...admin, 
                currentStatus: status,
                loginLatestSession: loginLatestSession || admin.loginLatestSession
              }
            : admin
        );
      }
      
      return [
        ...prev,
        {
          _id: userId,
          firstname: userInfo?.firstname || '',
          lastname: userInfo?.lastname || '',
          email: userInfo?.email || '',
          role: userInfo?.role || 1,
          photo: userInfo?.photo || '',
          currentStatus: status,
          loginLatestSession
        }
      ];
    });
  }, [clearAnimationState]);

  // Calculate session duration with proper currentTime dependency
  const calculateSessionDuration = useCallback((session) => {
    if (!session || !session.loginTime) return 0;
    
    if (session.sessionStatus === 'active') {
      return currentTime - new Date(session.loginTime).getTime();
    }
    
    if (session.sessionStatus === 'ended' && session.logoutTime) {
      return new Date(session.logoutTime).getTime() - new Date(session.loginTime).getTime();
    }
    
    return 0;
  }, [currentTime]);

  // Format duration helper
  const formatDuration = useCallback((ms) => {
    if (!ms || ms < 0) return '00:00:00';
    return moment.utc(ms).format('HH:mm:ss');
  }, []);

  // Retry handler
  const handleRetry = useCallback(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // Main effect for initialization
  useEffect(() => {
    // Initial fetch
    fetchAdmins();
    
    // Set up background refresh interval
    intervalRef.current = setInterval(() => {
      fetchAdmins(true); // Background fetch
    }, 10000); // 10 seconds interval

    // Set up real-time duration update interval
    updateIntervalRef.current = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000); // Update every second for real-time duration

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [fetchAdmins]);

  // Socket effect
  useEffect(() => {
    if (!socket) return;

    socket.on('user:statusChanged', handleStatusChanged);
    
    return () => {
      socket.off('user:statusChanged', handleStatusChanged);
    };
  }, [socket, handleStatusChanged]);

  // Loading state
  if (loading && isInitialLoad.current) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading admin status...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="alert alert-danger">
        {error} 
        <button 
          className="btn btn-sm btn-primary ms-2" 
          onClick={handleRetry}
          disabled={loading}
        >
          {loading ? 'Retrying...' : 'Retry'}
        </button>
      </div>
    );
  }

  return (
    <div className="admin-users-table-container">
      {isRefreshing && (
        <div className="refresh-indicator">
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">Refreshing...</span>
          </div>
          <span className="ms-2 text-muted small">Updating...</span>
        </div>
      )}
      
      <div className="table-responsive">
        <table className="table table-hover">
          <thead className="table-light sticky-top">
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Logged In Since</th>
              <th>Session Duration</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {admins.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-muted">
                  No admin users found
                </td>
              </tr>
            ) : (
              admins.map((admin) => {
                const loginTime = admin.loginLatestSession?.loginTime 
                  ? new Date(admin.loginLatestSession.loginTime) 
                  : null;
                
                const durationMs = calculateSessionDuration(admin.loginLatestSession);
                const status = admin.currentStatus || 'offline';
                const isNew = newAdminIds.includes(admin._id);
                const isUpdated = updatedAdminIds.includes(admin._id);

                return (
                  <tr 
                    key={admin._id} 
                    className={`
                      admin-row
                      ${isNew ? 'fade-in' : ''} 
                      ${isUpdated ? 'updating-row' : ''}
                    `.trim()}
                  >
                    <td className="name-cell">
                      <div className="d-flex align-items-center">
                        {admin.photo && (
                          <img 
                            src={admin.photo} 
                            alt={`${admin.firstname} ${admin.lastname}`}
                            className="admin-avatar me-2"
                          />
                        )}
                        <span>{admin.firstname} {admin.lastname}</span>
                      </div>
                    </td>
                    <td className="email-cell">{admin.email}</td>
                    <td className="login-time-cell">
                      {loginTime ? (
                        <span title={loginTime.toISOString()}>
                          {loginTime.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted">Not logged in</span>
                      )}
                    </td>
                    <td className="duration-cell">
                      <span className="font-monospace">{formatDuration(durationMs)}</span>
                    </td>
                    <td className="status-cell">
                      <span className={`badge status-badge ${
                        status === 'active' ? 'bg-success' :
                        status === 'idle' ? 'bg-warning text-dark' : 'bg-secondary'
                      }`}>
                        <i className={`status-icon ${
                          status === 'active' ? 'fas fa-circle' :
                          status === 'idle' ? 'fas fa-clock' : 'fas fa-minus-circle'
                        }`}></i>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsersTable;
