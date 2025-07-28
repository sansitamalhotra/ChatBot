import React, { useEffect, useState } from 'react';
import API from '../../../helpers/API';
import { useSocket } from '../../../Context/SocketContext';
import moment from 'moment';

const AdminUsersTable = () => {
  const [admins, setAdmins] = useState([]);
  const socket = useSocket();

  // Fetch admins with session info from backend API
  const fetchAdmins = async () => {
    try {
      const { data } = await API.get('/api/v1/admin/fetchAdminsWithSession');
      setAdmins(data.admins);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for status changes from socket
    socket.on('user:statusChanged', ({ userId, status }) => {
      setAdmins((prevAdmins) =>
        prevAdmins.map((admin) =>
          admin._id === userId ? { ...admin, currentStatus: status } : admin
        )
      );
    });

    return () => {
      socket.off('user:statusChanged');
    };
  }, [socket]);

  // Helper to format duration from milliseconds
  const formatDuration = (ms) => {
    if (!ms || ms < 0) return '00:00:00';
    return moment.utc(ms).format('HH:mm:ss');
  };

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
              {admins.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center">
                    No admin users found
                  </td>
                </tr>
              )}
              {admins.map((admin) => {
                const loginTime = admin.latestSession?.loginTime
                  ? new Date(admin.latestSession.loginTime)
                  : null;
                const now = new Date();
                const durationMs = loginTime ? now - loginTime : 0;
                const status = admin.currentStatus || 'offline';

                return (
                  <tr key={admin._id}>
                    <td>{admin.firstname || admin.name || admin.userName || 'N/A'}</td>
                    <td>{admin.email}</td>
                    <td>{loginTime ? loginTime.toLocaleString() : '-'}</td>
                    <td>{formatDuration(durationMs)}</td>
                    <td>
                      <span
                        className={
                          status === 'active'
                            ? 'badge badge-success'
                            : status === 'idle'
                            ? 'badge badge-warning'
                            : 'badge badge-secondary'
                        }
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersTable;
