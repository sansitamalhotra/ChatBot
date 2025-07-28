// Navbar.js
import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { LogoutNavbarLink } from '../../Logout/LogoutNavbar';
import LogoSvg from '../assets/images/PSPL-Logo.png';
import LogoSvgMini from '../assets/images/FaviIcon-Logo.png';

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

  return (
    <nav className="navbar default-layout-navbar col-lg-12 col-12 p-0 fixed-top d-flex flex-row">
          <div className="text-center navbar-brand-wrapper d-flex align-items-center justify-content-start">
            <Link className="navbar-brand brand-logo" to="/"><img src={LogoSvg} alt="logo" /></Link>
            <a className="navbar-brand brand-logo-mini" href="index.html"><img src={LogoSvgMini} alt="logo" /></a>
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
                <a className={`nav-link dropdown-toggle ${profileDropdownOpen ? 'show' : ''}`}  id="profileDropdown" href="#" data-bs-toggle="dropdown" aria-expanded="false" onClick={(e) => {
                    e.preventDefault();
                    toggleProfileDropdown();
                  }}>
                  <div className="nav-profile-img">
                    <img src={LogoSvgMini} alt="Profile Photo" />
                    <span className="availability-status online"></span>
                  </div>
                  <div className="nav-profile-text">
                    <p className="mb-1 text-black">Admin Actions</p>
                  </div>
                </a>
                <div className={`dropdown-menu navbar-dropdown ${profileDropdownOpen ? 'show' : ''}`} aria-labelledby="profileDropdown">
                  <Link className="dropdown-item" to="#">
                    <i className="mdi mdi-briefcase me-2 text-success"></i> Admin Jobs 
                  </Link>
                  <div className="dropdown-divider"></div>
                  <Link className="dropdown-item" to="#">
                    <i className="mdi mdi-format-list-bulleted-type me-2 text-success"></i> Job Sectors 
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
                  <Link className="dropdown-item preview-item" to="/Who-We-Are">
                    <i className='mdi mdi-server me-2'></i>
                    <div className="preview-item-content d-flex align-items-start flex-column justify-content-center">
                      <h6 className="preview-subject ellipsis mb-1 font-weight-normal">Who We Are</h6>
                    </div>
                  </Link>                
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
