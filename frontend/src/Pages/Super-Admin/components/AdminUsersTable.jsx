import React, { useEffect, useState, useCallback, useRef } from 'react';
import moment from 'moment';
import API from '../../../helpers/API';
import { useSocket } from '../../../Context/SocketContext';

import './AdminUsersTable.css';

const VALID_USER_STATUSES = ['offline', 'online', 'active', 'idle', 'away'];

const AdminUsersTable = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [newAdminIds, setNewAdminIds] = useState([]);
  const [updatedAdminIds, setUpdatedAdminIds] = useState([]);
  const [showIp, setShowIp] = useState(false);

  const { socket, isConnected, connectionStatus, error: socketError, reconnect } = useSocket();

  const intervalRef = useRef(null);
  const updateIntervalRef = useRef(null);
  const isInitialLoad = useRef(true);
  const statusUpdateRef = useRef({});

  // Validate status to known statuses or fallback to offline
  const validateStatus = useCallback((status) => {
    return VALID_USER_STATUSES.includes(status) ? status : 'offline';
  }, []);

  // Clear animation state for "new" or "updated" admins after delay
  const clearAnimationState = useCallback((userId, type) => {
    setTimeout(() => {
      if (type === 'new') {
        setNewAdminIds(prev => prev.filter(id => id !== userId));
      } else if (type === 'updated') {
        setUpdatedAdminIds(prev => prev.filter(id => id !== userId));
      }
    }, 2000);
  }, []);

  // Fetch admins with sessions from backend
  const fetchAdmins = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      else setIsRefreshing(true);
      setError(null);

      const { data } = await API.get('api/v1/superAdmin/fetchAdminWithSession');

      if (data.success && data.admins) {
        setAdmins(prevAdmins => {
          const newAdmins = data.admins.map(admin => ({
            ...admin,
            currentStatus: validateStatus(admin.currentStatus)
          }));

          if (!isInitialLoad.current) {
            newAdmins.forEach(newAdmin => {
              const existingAdmin = prevAdmins.find(admin => admin._id === newAdmin._id);
              if (existingAdmin) {
                const statusChanged = existingAdmin.currentStatus !== newAdmin.currentStatus;
                const sessionChanged = existingAdmin.loginLatestSession?.loginTime !== newAdmin.loginLatestSession?.loginTime;

                if (statusChanged || sessionChanged) {
                  setUpdatedAdminIds(prev => {
                    if (!prev.includes(newAdmin._id)) {
                      clearAnimationState(newAdmin._id, 'updated');
                      return [...prev, newAdmin._id];
                    }
                    return prev;
                  });
                }
              }
              else {
                setNewAdminIds(prev => {
                  if (!prev.includes(newAdmin._id)) {
                    clearAnimationState(newAdmin._id, 'new');
                    return [...prev, newAdmin._id];
                  }
                  return prev;
                });
              }
            });
          }
          isInitialLoad.current = false;

          // Debug log all statuses and IPs
          console.log("Fetched Admin Users:", newAdmins.map(a => ({
            id: a._id,
            status: a.currentStatus,
            ip: a.loginLatestSession?.ipAddress || 'no-ip'
          })));

          return newAdmins;
        });
      } else {
        throw new Error(data.message || 'Invalid server response');
      }
    } catch (err) {
      setError(`Failed to fetch admin data: ${err.message}`);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [clearAnimationState, validateStatus]);

  // Handle status change events from socket
  const handleStatusChanged = useCallback((data) => {
    const { userId, status, loginLatestSession, userInfo, timestamp, ipAddress } = data;
    if (!userId) return;

    const validatedStatus = validateStatus(status);
    const now = Date.now();
    const lastUpdate = statusUpdateRef.current[userId] || 0;

    // Bypass debounce for immediate updates
    const shouldBypassDebounce = true;
    if (!shouldBypassDebounce && now - lastUpdate < 500) return;
    statusUpdateRef.current[userId] = now;

    setAdmins(prev => {
      const existingIndex = prev.findIndex(a => a._id === userId);
      const isNew = existingIndex === -1;

      if (isNew && userInfo) {
        setNewAdminIds(prevIds => {
          if (!prevIds.includes(userId)) {
            clearAnimationState(userId, 'new');
            return [...prevIds, userId];
          }
          return prevIds;
        });
      } else if (!isNew) {
        const existingAdmin = prev[existingIndex];
        if (existingAdmin.currentStatus !== validatedStatus) {
          setUpdatedAdminIds(prevIds => {
            if (!prevIds.includes(userId)) {
              clearAnimationState(userId, 'updated');
              return [...prevIds, userId];
            }
            return prevIds;
          });
        }
      }

      if (existingIndex !== -1) {
        return prev.map(admin => {
          if (admin._id === userId) {
            return {
              ...admin,
              currentStatus: validatedStatus,
              loginLatestSession: {
                ...(loginLatestSession || admin.loginLatestSession),
                ipAddress: ipAddress || loginLatestSession?.ipAddress || admin.loginLatestSession?.ipAddress
              },
              lastActivity: timestamp ? new Date(timestamp) : new Date(),
              ...(userInfo && {
                firstname: userInfo.firstname || admin.firstname,
                lastname: userInfo.lastname || admin.lastname,
                email: userInfo.email || admin.email,
                photo: userInfo.photo || admin.photo,
                role: userInfo.role || admin.role
              })
            };
          }
          return admin;
        });
      }

      if (userInfo) {
        return [
          ...prev,
          {
            _id: userId,
            firstname: userInfo.firstname || 'Unknown',
            lastname: userInfo.lastname || 'User',
            email: userInfo.email || '',
            role: userInfo.role || 1,
            photo: userInfo.photo || '',
            currentStatus: validatedStatus,
            loginLatestSession: {
              ...loginLatestSession,
              ipAddress: ipAddress || loginLatestSession?.ipAddress
            },
            lastActivity: timestamp ? new Date(timestamp) : new Date()
          }
        ];
      }

      return prev;
    });
  }, [clearAnimationState, validateStatus]);

  // Treat "activityLogged" similar to "statusChanged" event
  const handleUserActivity = useCallback((data) => {
    handleStatusChanged({
      ...data,
      status: data.status || 'active'
    });
  }, [handleStatusChanged]);

  useEffect(() => {
    fetchAdmins();

    intervalRef.current = setInterval(() => {
      fetchAdmins(true);
    }, 30000);

    updateIntervalRef.current = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(updateIntervalRef.current);
    };
  }, [fetchAdmins]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const statusHandler = (data) => handleStatusChanged(data);
    const activityHandler = (data) => handleUserActivity(data);
    const initialStatusHandler = (adminsData) => {
      if (adminsData && Array.isArray(adminsData)) {
        setAdmins(adminsData.map(admin => ({
          ...admin,
          currentStatus: validateStatus(admin.currentStatus)
        })));
      }
    };

    socket.on('statusChanged', statusHandler);
    socket.on('activityLogged', activityHandler);
    socket.on('admin:initialStatusList', initialStatusHandler);

    socket.emit('admin:requestStatusList');

    return () => {
      if (socket) {
        socket.off('statusChanged', statusHandler);
        socket.off('activityLogged', activityHandler);
        socket.off('admin:initialStatusList', initialStatusHandler);
      }
    };
  }, [socket, isConnected, handleStatusChanged, handleUserActivity, validateStatus]);

  const calculateSessionDuration = useCallback((session, currentStatus) => {
    if (!session || !session.loginTime) return 0;

    const loginTimeMs = new Date(session.loginTime).getTime();
    const now = currentTime;

    if (session.sessionStatus === 'active' || currentStatus !== 'offline') {
      const baseDuration = now - loginTimeMs;
      const idleTime = session.totalIdleTime || 0;
      return Math.max(0, baseDuration - idleTime);
    }

    // For ended sessions or offline status
    return session.totalWorkTime || 0;
  }, [currentTime]);

  const formatDuration = useCallback((ms) => {
    if (!ms || ms < 0) return '00:00:00';
    return moment.utc(ms).format('HH:mm:ss');
  }, []);

  const getStatusDisplay = useCallback((status) => {
    const validStatus = validateStatus(status);
    const statusConfig = {
      online: { label: 'Online', class: 'bg-primary rounded-5', icon: 'fa-circle' },
      active: { label: 'Active', class: 'bg-success ', icon: 'fa-circle' },
      idle: { label: 'Idle', class: 'bg-warning text-dark rounded-5', icon: 'fa-clock' },
      away: { label: 'Away', class: 'bg-info rounded-5', icon: 'fa-user-clock' },
      offline: { label: 'Offline', class: 'bg-secondary rounded-5', icon: 'fa-minus-circle' }
    };
    return statusConfig[validStatus] || statusConfig.offline;
  }, [validateStatus]);

  const renderConnectionStatus = () => {
    if (connectionStatus === 'connected') {
      return <span className="text-success"><i className="fas fa-wifi"></i> Connected</span>;
    }
    if (connectionStatus.startsWith('connecting') || connectionStatus.startsWith('reconnecting')) {
      return (
        <span className="text-warning">
          <div className="spinner-border spinner-border-sm me-1" role="status"></div>
          {connectionStatus}
        </span>
      );
    }
    return (
      <div>
        <span className="text-danger"><i className="fas fa-wifi"></i> Disconnected</span>
        <button className="btn btn-sm btn-outline-danger ms-2" onClick={reconnect}>
          Reconnect
        </button>
      </div>
    );
  };

  if (loading && isInitialLoad.current) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Loading admin users...</p>
      </div>
    );
  }

  if (error && admins.length === 0) {
    return (
      <div className="alert alert-danger">
        <i className="fas fa-exclamation-triangle me-2"></i>
        {error}
        <div className="mt-2">
          <button className="btn btn-sm btn-primary me-2" onClick={() => fetchAdmins()}>
            Retry
          </button>
          <button className="btn btn-sm btn-outline-primary" onClick={reconnect}>
            Reconnect Socket
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-users-table-container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Admin Users Status</h5>
        <div>
          <button
            className={`btn btn-sm me-2 ${showIp ? 'btn-info' : 'btn-outline-secondary'}`}
            onClick={() => setShowIp(!showIp)}
          >
            <i className={`fas fa-${showIp ? 'eye-slash' : 'eye'} me-1`}></i>
            {showIp ? 'Hide IPs' : 'Show IPs'}
          </button>
          {renderConnectionStatus()}
        </div>
      </div>

      {isRefreshing && (
        <div className="refresh-indicator mb-2">
          <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
          <span className="ms-2 text-muted small">Updating...</span>
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-hover">
          <thead className="table-light sticky-top">
            <tr>
              <th>Name</th>
              <th>Email</th>
              {showIp && <th>IP Address</th>}
              <th>Logged In Since</th>
              <th>Session Duration</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {admins.length === 0 ? (
              <tr>
                <td colSpan={showIp ? "6" : "5"} className="text-center py-4 text-muted">
                  No admin users found
                </td>
              </tr>
            ) : (
              admins.map(admin => {
                const loginTime = admin.loginLatestSession?.loginTime
                  ? new Date(admin.loginLatestSession.loginTime)
                  : null;
                const durationMs = calculateSessionDuration(admin.loginLatestSession, admin.currentStatus);
                const statusDisplay = getStatusDisplay(admin.currentStatus);
                const isNew = newAdminIds.includes(admin._id);
                const isUpdated = updatedAdminIds.includes(admin._id);
                const ipAddress = admin.loginLatestSession?.ipAddress || 'N/A';

                return (
                  <tr
                    key={admin._id}
                    className={`admin-row ${isNew ? 'fade-in' : ''} ${isUpdated ? 'updating-row' : ''}`}
                  >
                    <td className="name-cell">
                      <div className="d-flex align-items-center">
                        {admin.photo && (
                          <img
                            src={admin.photo}
                            alt={`${admin.firstname} ${admin.lastname}`}
                            className="admin-avatar me-2"
                            style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                          />
                        )}
                        <span>{admin.firstname} {admin.lastname}</span>
                      </div>
                    </td>
                    <td className="email-cell">{admin.email}</td>
                    {showIp && (
                      <td className="ip-cell">
                        <span className="font-monospace">{ipAddress}</span>
                      </td>
                    )}
                    <td className="login-time-cell">
                      {loginTime ? loginTime.toLocaleString() : <span className="text-muted">Not logged in</span>}
                    </td>
                    <td className="duration-cell">
                      <span className="font-monospace">{formatDuration(durationMs)}</span>
                    </td>
                    <td className="status-cell">
                      <span className={`badge status-badge ${statusDisplay.class}`}>
                        <i className={`fas me-1 ${statusDisplay.icon}`}></i>
                        {statusDisplay.label}
                        {admin.currentStatus === 'idle' && <i className="fas fa-hourglass-half ms-1"></i>}
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
