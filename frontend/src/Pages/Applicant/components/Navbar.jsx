// Navbar.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import API from "../../../helpers/API";
import { useAuth } from "../../../Context/AuthContext";
import { LogoutNavbarLink } from '../../Logout/LogoutNavbar';
import LogoSvg from '../assets/images/PSPL-Logo.png';
import LogoSvgMini from '../assets/images/FaviIcon-Logo.png';

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Navbar = ({ toggleMinimize, toggleMobileSidebar }) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [messageDropdownOpen, setMessageDropdownOpen] = useState(false);

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
    if (messageDropdownOpen) setMessageDropdownOpen(false);
  };

  // Handle click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (!event.target.closest('.dropdown')) {
        setProfileDropdownOpen(false);
        setMessageDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const handleLogout = () => {
    setAuth({ ...auth, user: null, token: "" });
    localStorage.removeItem("userAuthDetails");
    notifySucc("You have Logged Out Successfully!!!");
    navigate(location.state || "/Login");
  };

  //assigning location variable
  const location = useLocation();

  return (
    <nav className="navbar default-layout-navbar col-lg-12 col-12 p-0 fixed-top d-flex flex-row">
          <div className="text-center navbar-brand-wrapper d-flex align-items-center justify-content-start">
            <Link className="navbar-brand brand-logo" to="/" onClick={() => {window.location.href = "/";}}>
              <img src={LogoSvg} alt="ThinkBeyond Logo" />
            </Link>
            <Link className="navbar-brand brand-logo-mini" to="/" onClick={() => {window.location.href = "/";}}><img src={LogoSvgMini} alt="ThinkBeyond Logo" /></Link>
          </div>
          <div className="navbar-menu-wrapper d-flex align-items-stretch">
            <button className="navbar-toggler navbar-toggler align-self-center" type="button" data-toggle="minimize" onClick={toggleMinimize}>
              <span className="mdi mdi-menu"></span>
            </button>
            <div className="search-field d-none d-md-block">
              <form className="d-flex align-items-center h-100" action="#">
                <div className="input-group">
                  <div className="input-group-prepend bg-transparent">
                    <i className="input-group-text border-0 mdi mdi-magnify"></i>
                  </div>
                  <input type="text" className="form-control bg-transparent border-0" placeholder="Search projects" />
                </div>
              </form>
            </div>
            <ul className="navbar-nav navbar-nav-right">
              <li className="nav-item nav-profile dropdown">
                <Link className={`nav-link dropdown-toggle ${profileDropdownOpen ? 'show' : ''}`}  id="profileDropdown" to="#" data-bs-toggle="dropdown" aria-expanded="false" onClick={(e) => {
                    e.preventDefault();
                    toggleProfileDropdown();
                  }}>
                  <div className="nav-profile-img">
                   <img 
                      className="profile-image" 
                      src={`${auth?.user?.photo?.startsWith('/uploads/userAvatars/') ? process.env.REACT_APP_API_URL + auth.user.photo : auth?.user?.photo || user?.photo}`}
                      alt={`${auth?.user?.firstname} ${auth?.user?.lastname}`}
                      aria-label="User profile photo"
                      role="button"
                      style={{borderRadius: "50%"}}
                    />
                    <span className="availability-status online"></span>
                  </div>
                  <div className="nav-profile-text">
                    <p className="mb-1 text-black">
                      {auth.user?.firstname} {" "} {auth.user?.lastname}                       
                    </p>
                  </div>
                </Link>
                <div className={`dropdown-menu navbar-dropdown ${profileDropdownOpen ? 'show' : ''}`} aria-labelledby="profileDropdown">
                  <Link className="dropdown-item" to="#">
                    <i className="mdi mdi-briefcase me-2 text-success"></i> Applied Jobs 
                  </Link>
                  <div className="dropdown-divider"></div>
                  <Link className="dropdown-item" to={`/Profile/${auth?.user?.userId}`}>
                    <i className="mdi mdi-account-network me-2 text-success"></i> Account 
                  </Link>
                  <div className="dropdown-divider"></div>                  
                  <LogoutNavbarLink className="dropdown-item">
                    <i className="mdi mdi-logout me-2 text-success"></i>
                    Logout
                  </LogoutNavbarLink>
                </div>
              </li>
              <li className="nav-item dropdown">
                <Link className="nav-link count-indicator dropdown-toggle" id="messageDropdown" to="#" data-bs-toggle="dropdown" aria-expanded="false">
                  <b>Links</b>
                </Link>
                <div className="dropdown-menu dropdown-menu-end navbar-dropdown preview-list" aria-labelledby="messageDropdown">
                  <h6 className="p-3 mb-0">Page Links</h6>
                  <div className="dropdown-divider"></div>
                  <Link className="dropdown-item preview-item" to="/">
                    <i className='mdi mdi-home me-2'></i>
                    <div className="preview-item-content d-flex align-items-start flex-column justify-content-center">
                      <h6 className="preview-subject ellipsis mb-1 font-weight-normal">Home</h6>
                    </div>
                  </Link>
                  <div className="dropdown-divider"></div>
                  <Link className="dropdown-item preview-item" to="/Search-Jobs">
                    <i className='mdi mdi-briefcase me-2'></i>
                    <div className="preview-item-content d-flex align-items-start flex-column justify-content-center">
                      <h6 className="preview-subject ellipsis mb-1 font-weight-normal">Search Jobs</h6>
                    </div>
                  </Link>
                  <div className="dropdown-divider"></div>
                  <Link className="dropdown-item preview-item" to='/About-Us'>    
                    <i className='mdi mdi-theater me-2'></i>                
                    <div className="preview-item-content d-flex align-items-start flex-column justify-content-center">
                      <h6 className="preview-subject ellipsis mb-1 font-weight-normal">About Us</h6>
                    </div>
                  </Link>
                  <div className="dropdown-divider"></div>               
                </div>
              </li>
            </ul>
            <button className="navbar-toggler navbar-toggler-right d-lg-none align-self-center" type="button" data-toggle="offcanvas" onClick={toggleMobileSidebar}>
              <span className="mdi mdi-menu"></span>
            </button>
          </div>
        </nav>
  );
};

export default Navbar;
