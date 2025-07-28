// Sidebar.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import API from "../../../helpers/API";
import { useAuth } from "../../../Context/AuthContext";
import { LogoutLink } from '../../Logout/Logout';

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Sidebar = ({ isOpen }) => {

  const [auth, setAuth] = useAuth();
  const [user, setUser] = useState({});
  const params = useParams();

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

  const fetchRegUserById = async () => {
    try {
      const { data } = await API.get(`/users/fetchRegUserById/${params._id}`);
      setUser(data.user);
    } catch (error) {
      console.log(error);
    }
  };

  // initial Registered User Details
  useEffect(() => {
    if (params?._id) fetchRegUserById();
  }, [params?._id]);


  //assigning location variable
  const location = useLocation();
  return (
    <nav className={`sidebar sidebar-offcanvas ${isOpen ? 'active' : ''}`} id="sidebar">
        <ul className="nav">
          <li className="nav-item">
            <Link className="nav-link" to="/Applicant-Profile-Dashboard">
              <span className="menu-title">Dashboard</span>
              <i className="mdi mdi-home menu-icon"></i>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" data-bs-toggle="collapse" to="#appied-jobs" aria-expanded="false" aria-controls="appied-jobs">
              <span className="menu-title">Applied Jobs</span>
              <i className="menu-arrow"></i>
              <i className="mdi mdi-briefcase menu-icon"></i>
            </Link>
            <div className="collapse" id="appied-jobs">
              <ul className="nav flex-column sub-menu">
                <li className="nav-item">
                  <Link className="nav-link" to="/Applicant/Applied-Job">Applied Jobs List</Link>
                </li>
              </ul>
            </div>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to={`/Profile/${auth?.user?.userId}`}>
              <span className="menu-title">Profile</span>
              <i className="mdi mdi-account-network menu-icon"></i>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/User-Change-Password" onClick={() => {window.location.href = "/User-Change-Password";}}>
              <span className="menu-title">Change Password</span>
              <i className="mdi mdi-repeat menu-icon"></i>
            </Link>
          </li>
          <li className="nav-item">
            <LogoutLink className="nav-link">
              <span className="menu-title">Logout</span>
              <i className="mdi mdi-logout menu-icon"></i>
            </LogoutLink>
          </li>
        </ul>
    </nav>
  );
};

export default Sidebar;