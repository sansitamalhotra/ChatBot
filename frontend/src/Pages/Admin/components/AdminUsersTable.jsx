import React, { useEffect, useState } from 'react';
import API from '../../../helpers/API';
import { useSocket } from '../../../Context/SocketContext';
import moment from 'moment';

const AdminUsersTable = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socket = useSocket();

  // Fetch admins with session info from backend API on component mount
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await API.get('api/v1/admin/fetchAdminWithSession');
      console.log('Fetched admins data:', data); // Debug log
      
      if (data.success && data.admins) {
        setAdmins(data.admins);
      } else {
        console.error('Invalid response structure:', data);
        setError('Invalid response from server');
      }
    } catch (error) {
      console.error('Failed to fetch admins:', error);
      setError('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Handle real-time updates from socket
  useEffect(() => {
    if (!socket) return;

    const handleStatusChanged = ({ userId, status, loginLatestSession, userInfo }) => {
      // Debug log — remove or comment out in production
      console.log('Socket user:statusChanged received:', { userId, status, loginLatestSession, userInfo });

      setAdmins((prevAdmins) => {
        const idx = prevAdmins.findIndex(admin => admin._id.toString() === userId.toString());
        if (idx !== -1) {
          // Update existing admin entry
          const updated = [...prevAdmins];
          updated[idx] = {
            ...updated[idx],
            currentStatus: status,
            loginLatestSession: loginLatestSession || updated[idx].loginLatestSession,
            ...userInfo,
          };
          return updated;
        } else if (userInfo) {
          // Add new admin entry
          return [...prevAdmins, {
            _id: userId,
            currentStatus: status,
            loginLatestSession,
            ...userInfo,
          }];
        }
        return prevAdmins;
      });
    };

    socket.on('user:statusChanged', handleStatusChanged);
    return () => socket.off('user:statusChanged', handleStatusChanged);
  }, [socket]);

  // Interval to trigger re-render every second for live durations
  useEffect(() => {
    const interval = setInterval(() => {
      setAdmins(prev => [...prev]); // shallow clone to trigger re-render
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Format duration given milliseconds
  const formatDuration = (ms) => {
    if (!ms || ms < 0) return '00:00:00';
    return moment.utc(ms).format('HH:mm:ss');
  };

  // Render loading/error states
  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <h4 className="card-title">Admin Users Status</h4>
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-body">
          <h4 className="card-title">Admin Users Status</h4>
          <div className="alert alert-danger">{error}</div>
          <button className="btn btn-primary" onClick={fetchAdmins}>Retry</button>
        </div>
      </div>
    );
  }

  // Render admin users table
  return (
    <div className="card">
      <div className="card-body">
        <h4 className="card-title">Admin Users Status</h4>
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
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
                  <td colSpan="5" className="text-center">No admin users found</td>
                </tr>
              ) : (
                admins.map((admin) => {
                  const session = admin.loginLatestSession;
                  const loginTime = session?.loginTime ? new Date(session.loginTime) : null;
                  const logoutTime = session?.logoutTime ? new Date(session.logoutTime) : null;
                  const status = admin.currentStatus || 'offline';

                  let sinceTime = null;
                  let durationMs = 0;

                  if (session) {
                    if (session.sessionStatus === 'active') {
                      sinceTime = loginTime;
                      durationMs = Date.now() - loginTime;
                    } else if (session.sessionStatus === 'ended') {
                      sinceTime = logoutTime || loginTime;
                      durationMs = logoutTime ? logoutTime - loginTime : 0;
                    }
                  }

                  return (
                    <tr key={admin._id}>
                      <td>{`${admin.firstname || ''} ${admin.lastname || ''}`.trim()}</td>
                      <td>{admin.email || 'N/A'}</td>
                      <td>{sinceTime ? sinceTime.toLocaleString() : 'Not Logged In'}</td>
                      <td>{formatDuration(durationMs)}</td>
                      <td>
                        <span className={`badge ${
                          status === 'active' ? 'badge-success' :
                          status === 'idle' ? 'badge-warning' :
                          status === 'away' ? 'badge-info' : 'badge-secondary'}`}>
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
        <div className="mt-3">
          <small className="text-muted">Total Admin Users: {admins.length}</small>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersTable;
