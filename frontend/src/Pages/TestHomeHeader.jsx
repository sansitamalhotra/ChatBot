import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import API from "../helpers/API";
import { useAuth } from "../Context/AuthContext";
import { LogoutNavbarLink } from './Logout/LogoutNavbar';

import './assets/vendors/mdi/css/materialdesignicons.min.css';
import './assets/vendors/font-awesome/css/font-awesome.min.css';

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './Header.css';
import Logo from './PSPL-Logo.png';

// Role constants
const ROLE_JOBSEEKER = 0;
const ROLE_ADMIN = 1;
const ROLE_EMPLOYER = 2;
const ROLE_SUPERADMIN = 3;

const TestHomeHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isSticky, setIsSticky] = useState(false);

  const [auth] = useAuth();
  const [user, setUser] = useState({});
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 40);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    setActiveDropdown(null);
  };

  const toggleDropdown = (index, e) => {
    if (window.innerWidth <= 768) {
      e.preventDefault();
      setActiveDropdown(activeDropdown === index ? null : index);
    }
  };

  const handleLinkClick = () => {
    if (window.innerWidth <= 768 && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        !e.target.closest('.nav-links') &&
        !e.target.closest('.menu-toggle') &&
        !e.target.closest('.cta-buttons') &&
        window.innerWidth > 768
      ) {
        setActiveDropdown(null);
      }
    };

    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const notifyErr = (msg) =>
    toast.error(msg, {
      position: "top-center",
      autoClose: 20000,
      closeOnClick: true,
      pauseOnHover: true,
      theme: "light",
    });

  const notifySucc = (msg) =>
    toast.success(msg, {
      position: "top-center",
      autoClose: 20000,
      closeOnClick: true,
      pauseOnHover: true,
      theme: "light",
    });

  const fetchRegUserById = async () => {
    try {
      const { data } = await API.get(`/users/fetchRegUserById/${params._id}`);
      setUser(data.user || {}); // Fixed: Ensure user is always an object
    } catch (error) {
      console.log(error);
      setUser({}); // Fixed: Set empty object on error
    }
  };

  useEffect(() => {
    if (params?._id) fetchRegUserById();
  }, [params?._id]);

  // Helper function to safely check photo path
  const getProfileImageSrc = (userPhoto) => {
    if (!userPhoto) return ''; // Return empty string if no photo
    
    // Safely check if photo starts with specific path
    const isUploadPath = typeof userPhoto === 'string' && userPhoto.startsWith('/uploads/userAvatars/');
    return isUploadPath ? process.env.REACT_APP_API_URL + userPhoto : userPhoto;
  };

  // Helper function to safely get user name
  const getUserDisplayName = (userObj) => {
    const firstName = userObj?.firstname || userObj?.first_name || '';
    const lastName = userObj?.lastname || userObj?.last_name || '';
    return `${firstName} ${lastName}`.trim();
  };

  // Admin menu items
  const renderAdminMenuItems = () => (
    <>
      <li>
        <Link to="/Admin/Dashboard" onClick={() => { window.location.href = "/Admin/Dashboard"; }}>
          <i className="mdi mdi-home menu-icon me-2 text-success"></i> Dashboard
        </Link>
      </li>
      <li>
        <Link to="/Admin/Manage-Jobs" onClick={() => { window.location.href = "/Admin/Manage-Jobs"; }}>
          <i className="mdi mdi-briefcase me-2 text-success menu-icon"></i>Manage Jobs
        </Link>
      </li>
      <li>
        <Link to="/Admin/Manage-Sectors" onClick={() => { window.location.href = "/Admin/Manage-Sectors"; }}>
          <i className="mdi mdi-format-list-bulleted-type me-2 text-success menu-icon"></i>Job Sectors
        </Link>
      </li>
      <li>
        <Link to="/Admin/Manage-Qualifications" onClick={() => { window.location.href = "/Admin/Manage-Qualifications"; }}>
          <i className="mdi mdi-school menu-icon me-2 text-success"></i> Job Qualifications
        </Link>
      </li>
      <li>
        <Link to="/Admin/Manage-Work-Experiences" onClick={() => { window.location.href = "/Admin/Manage-Work-Experiences"; }}>
          <i className="mdi mdi-checkbox-multiple-marked menu-icon me-2 text-success"></i> Job Experiences
        </Link>
      </li>
      <li>
        <Link to="/Admin/Manage-Work-Modes" onClick={() => { window.location.href = "/Admin/Manage-Work-Modes"; }}>
          <i className="mdi mdi-account-convert me-2 text-success"></i> Work Modes
        </Link>
      </li>
    </>
  );

  // Super Admin Menu Items
  const renderSuperAdminMenuItems = () => (
    <>
      <li>
        <Link to="/Super-Admin/Dashboard" onClick={() => { window.location.href = "/Super-Admin/Dashboard"; }}>
          <i className="mdi mdi-home menu-icon me-2 text-success"></i> Dashboard
        </Link>
      </li>
      <li>
        <Link to="/Super-Admin/Manage-Jobs" onClick={() => { window.location.href = "/Super-Admin/Manage-Jobs"; }}>
          <i className="mdi mdi-briefcase me-2 text-success menu-icon"></i>Manage Jobs
        </Link>
      </li>
      <li>
        <Link to="/Super-Admin/Manage-Sectors" onClick={() => { window.location.href = "/Super-Admin/Manage-Sectors"; }}>
          <i className="mdi mdi-format-list-bulleted-type me-2 text-success menu-icon"></i>Job Sectors
        </Link>
      </li>
      <li>
        <Link to="/Super-Admin/Manage-Qualifications" onClick={() => { window.location.href = "/Super-Admin/Manage-Qualifications"; }}>
          <i className="mdi mdi-school menu-icon me-2 text-success"></i> Job Qualifications
        </Link>
      </li>
      <li>
        <Link to="/Super-Admin/Manage-Work-Experiences" onClick={() => { window.location.href = "/Super-Admin/Manage-Work-Experiences"; }}>
          <i className="mdi mdi-checkbox-multiple-marked menu-icon me-2 text-success"></i> Job Experiences
        </Link>
      </li>
      <li>
        <Link to="/Super-Admin/Manage-Work-Modes" onClick={() => { window.location.href = "/Super-Admin/Manage-Work-Modes"; }}>
          <i className="mdi mdi-account-convert me-2 text-success"></i> Work Modes
        </Link>
      </li>
    </>
  );

  const renderLogoutItem = () => (
    <li>
      <LogoutNavbarLink onClick={() => { window.location.href = "/Login"; }}>
        <i className="mdi mdi-logout me-2 text-success"></i>
        Logout
      </LogoutNavbarLink>
    </li>
  );

  return (
    <header className={isSticky ? 'sticky' : ''}>
      <div className="top-bar">
        <Link to="mailto:hrpspl@prosoftsynergies.com" target="_blank" className="login-btn info-link">
          <span className="contact-text" style={{ color: "#03294f" }}>Email Us</span>
          <i className='fas fa-envelope ms-1 fa-2x' style={{ color: "#03294f" }}></i>
        </Link>
        <Link to="https://wa.me/+15129617007" className="login-btn phone-link" target="_blank">
          <span className="contact-text" style={{ color: "#03294f" }}>Let's Connect On WhatsApp</span>
          <i className='fab fa-whatsapp ms-1 fa-2x' style={{ color: "#03294f" }}></i>
        </Link>
      </div>
      <nav className={`main-nav ${isSticky ? 'sticky' : ''}`}>
        <div className="PSPL-Logo logo">
          <Link to="/"><img src={Logo} alt='ProsoftSynergies' /></Link>
        </div>

        <div
          className={`menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        <ul className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
          <li className={activeDropdown === 0 ? 'active' : ''}>
            <Link to="#" className="dropdown-toggle" onClick={(e) => toggleDropdown(0, e)}>
              FOR BUSINESSES
            </Link>
            <div className="mega-menu wide">
              <div className="mega-menu-column">
                <h3>Industries & Recruitment Solutions</h3>
                <ul>
                  <li><Link to="/Information-Technology-Recruitment" onClick={handleLinkClick}>Information Technology Recruitment</Link></li>
                  <li><Link to="/Government-Ministry-Recruitment" onClick={handleLinkClick}>Government Ministry Recruitment</Link></li>
                  <li><Link to="/Healthcare-&-Medical-Recruitment" onClick={handleLinkClick}>Healthcare & Medical Recruitment</Link></li>
                  <li><Link to="/Manufacturing-Recruitment" onClick={handleLinkClick}>Manufacturing Recruitment</Link></li>
                  <li><Link to="/Admin-&-Office-Support-Recruitment" onClick={handleLinkClick}>Administration & Office Support Recruitment</Link></li>
                  <li><Link to="/Transport-&-Logistics-Recruitment" onClick={handleLinkClick}>Transport & Logistics Recruitment</Link></li>
                  <li><Link to="/Construction-&-Infrastructure-Recruitment" onClick={handleLinkClick}>Construction and Infrastructure Recruitment</Link></li>
                </ul>
              </div>
              <div className="mega-menu-column">
                <h3>Education Recruitment & Solutions</h3>
                <ul>
                  <li><Link to="/Education-Recruitment" onClick={handleLinkClick}>Education Recruitment</Link></li>
                </ul>
              </div>
              <div className="mega-menu-column">
                <h3>Health Solutions</h3>
                <ul>
                  <li><Link to="/Behavioral-Health-Solutions" onClick={handleLinkClick}>Behavioral Health</Link></li>
                  <li><Link to="/Health-Billing-&-Collections-Solutions" onClick={handleLinkClick}>Health & Billing Collections</Link></li>
                  <li><Link to="#" onClick={handleLinkClick}>HealthCare Mergers & Acquisitions</Link></li>
                  <li><Link to="#" onClick={handleLinkClick}>Behavioral Health Credentialing & Contracting</Link></li>
                </ul>
              </div>
            </div>
          </li>
          <li className={activeDropdown === 1 ? 'active' : ''}>
            <Link to="#" className="dropdown-toggle" onClick={(e) => toggleDropdown(1, e)}>
              JOB SEEKERS
            </Link>
            <div className="mega-menu">
              <h3>Career Opportunities</h3>
              <ul>
                <li><Link to="/Search-Jobs" onClick={handleLinkClick}>Search Jobs</Link></li>
                <li>
                  {!auth.user ? (
                    <Link to="/Login" onClick={handleLinkClick}>Resume Upload</Link>
                  ) : (() => {
                    let linkPath = "/PSPL-Access-Denied";
                    if (auth.user?.role === ROLE_JOBSEEKER) {
                      linkPath = `/Applicant-Resume-Upload/${auth?.user?.userId}`;
                    } else if (
                      auth.user?.role === ROLE_ADMIN ||
                      auth.user?.role === ROLE_EMPLOYER ||
                      auth.user?.role === ROLE_SUPERADMIN
                    ) {
                      linkPath = "/PSPL-Access-Denied";
                    }
                    return <Link to={linkPath} onClick={handleLinkClick}>Resume Upload</Link>;
                  })()}
                </li>
              </ul>
            </div>
          </li>
          <li className={activeDropdown === 2 ? 'active' : ''}>
            <Link to="#" className="dropdown-toggle" onClick={(e) => toggleDropdown(2, e)}>
              EMPLOYERS
            </Link>
            <div className="mega-menu">
              <h3>ProsoftSynergies Solutions</h3>
              <ul>
                <li><Link to="/Permanent-Hiring-Solutions" onClick={handleLinkClick}>Permanent Hiring Solutions</Link></li>
                <li><Link to="/Tailored-Solutions-For-Employers" onClick={handleLinkClick}>Tailored Solutions For Employers</Link></li>
                <li><Link to="/Fluid-Workforce-Solutions" onClick={handleLinkClick}>Fluid Workforce Solutions</Link></li>
              </ul>
            </div>
          </li>
          <li className={activeDropdown === 3 ? 'active' : ''}>
            <Link to="/About-Us" className="dropdown-toggle" onClick={(e) => toggleDropdown(3, e)}>
              ABOUT US
            </Link>
            <div className="mega-menu">
              <h3>Our Company</h3>
              <ul>
                <li><Link to="/About-Us" onClick={handleLinkClick}>About Us</Link></li>
                <li><Link to="/Who-We-Are" onClick={handleLinkClick}>Who We're</Link></li>
                <li><Link to="/Our-Locations" onClick={handleLinkClick}>Locations</Link></li>
              </ul>
            </div>
          </li>
          <li><Link to="/Contact-Us" onClick={handleLinkClick}>CONTACT US</Link></li>

          {/* Role-Based Mobile Menus */}
          {auth.user && (
            <>
              {auth.user?.role === ROLE_ADMIN && (
                <li className="mobile-more-menu">
                  <li className={activeDropdown === 4 ? 'active' : ''} style={{ marginBottom: "100px" }}>
                    <Link to="#" className="dropdown-toggle" onClick={(e) => toggleDropdown(4, e)}>
                      {getUserDisplayName(auth.user)}
                      <i className='mdi mdi-account-check ms-3 text-primary' style={{ fontSize: "25px" }}></i>
                    </Link>
                    <div className="mega-menu">
                      <h3>Admin Quick Access</h3>
                      <ul>
                        {renderAdminMenuItems()}
                        {renderLogoutItem()}
                      </ul>
                    </div>
                  </li>
                </li>
              )}

              {auth.user?.role === ROLE_SUPERADMIN && (
                <li className="mobile-more-menu">
                  <li className={activeDropdown === 5 ? 'active' : ''} style={{ marginBottom: "100px" }}>
                    <Link to="#" className="dropdown-toggle" onClick={(e) => toggleDropdown(5, e)}>
                      {getUserDisplayName(auth.user)}
                      <i className='mdi mdi-account-check ms-3 text-primary' style={{ fontSize: "25px" }}></i>
                    </Link>
                    <div className="mega-menu">
                      <h3>Super Admin Quick Access</h3>
                      <ul>
                        {renderSuperAdminMenuItems()}
                        {renderLogoutItem()}
                      </ul>
                    </div>
                  </li>
                </li>
              )}

              {auth.user?.role === ROLE_EMPLOYER && (
                <li className="mobile-more-menu">
                  <li className={activeDropdown === 4 ? 'active' : ''} style={{ marginBottom: "100px" }}>
                    <Link to="#" className="dropdown-toggle" onClick={(e) => toggleDropdown(4, e)}>
                      <img
                        className="profile-image me-2"
                        src={getProfileImageSrc(auth?.user?.photo || user?.photo)}
                        alt={getUserDisplayName(auth.user)}
                        aria-label="User profile photo"
                        role="button"
                        style={{ borderRadius: "50%", height: "35px", width: "35px" }}
                      />
                      {getUserDisplayName(auth.user)}
                      <i className='mdi mdi-account-check ms-3 text-primary' style={{ fontSize: "25px" }}></i>
                    </Link>
                    <div className="mega-menu">
                      <h3>Employer Quick Access</h3>
                      <ul>
                        <li>
                          <Link to="#" onClick={handleLinkClick}>
                            <i className="mdi mdi-home menu-icon me-2 text-success"></i> Dashboard
                          </Link>
                        </li>
                        <li><Link to="#" onClick={handleLinkClick}>Account</Link></li>
                        {renderLogoutItem()}
                      </ul>
                    </div>
                  </li>
                </li>
              )}

              {(auth.user?.role !== ROLE_ADMIN && auth.user?.role !== ROLE_SUPERADMIN && auth.user?.role !== ROLE_EMPLOYER) && (
                <li className="mobile-more-menu">
                  <li className={activeDropdown === 4 ? 'active' : ''} style={{ marginBottom: "100px" }}>
                    <Link to="#" className="dropdown-toggle" onClick={(e) => toggleDropdown(4, e)}>
                      <img
                        className="profile-image me-2"
                        src={getProfileImageSrc(auth?.user?.photo || user?.photo)}
                        alt={getUserDisplayName(auth.user)}
                        aria-label="User profile photo"
                        role="button"
                        style={{ borderRadius: "50%", height: "35px", width: "35px" }}
                      />
                      {getUserDisplayName(auth.user)}
                      <i className='mdi mdi-account-check ms-3 text-primary' style={{ fontSize: "25px" }}></i>
                    </Link>
                    <div className="mega-menu">
                      <h3>Job Seeker Quick Access</h3>
                      <ul>
                        <li>
                          <Link to="/Applicant-Profile-Dashboard" onClick={() => { window.location.href = "/Applicant-Profile-Dashboard"; }}>
                            <i className="mdi mdi-home menu-icon me-2 text-success"></i> Dashboard
                          </Link>
                        </li>
                        <li>
                          <Link to={`/Applicant/Profile/${auth?.user?.userId}`} onClick={() => { window.location.href = `/Applicant/Profile/${auth?.user?.userId}`; }}>
                            <i className="mdi mdi-account-key menu-icon me-2 text-success"></i> Account
                          </Link>
                        </li>
                        {renderLogoutItem()}
                      </ul>
                    </div>
                  </li>
                </li>
              )}
            </>
          )}
        </ul>

        <div className="cta-buttons">
          {!auth.user ? (
            <>
              <Link to="/Login" className="cta-btn hPostJob-btn">Post Job</Link>
              <Link to="/Login" className="cta-btn hLogin-btn">Login</Link>
            </>
          ) : (
            <>
              {auth.user?.role === ROLE_ADMIN && (
                <>
                  <Link to="/Admin/Add-Job" className="cta-btn hPostJob-btn" onClick={() => { window.location.href = "/Admin/Add-Job"; }}>Post Job</Link>
                  <div className="cta-dropdown">
                    <li className={activeDropdown === 4 ? 'active' : ''}>
                      <Link to="#" className="dropdown-toggle" onClick={(e) => toggleDropdown(4, e)}>
                        <i className='mdi mdi-account-check me-2 text-primary' style={{ fontSize: "30px" }}></i>
                        {getUserDisplayName(auth.user)}
                      </Link>
                      <div className="mega-menu">
                        <h3>Admin Quick Access</h3>
                        <ul>
                          {renderAdminMenuItems()}
                          {renderLogoutItem()}
                        </ul>
                      </div>
                    </li>
                  </div>
                </>
              )}

              {auth.user?.role === ROLE_SUPERADMIN && (
                <>
                  <Link to="/Super-Admin/Add-Job" className="cta-btn hPostJob-btn" onClick={() => { window.location.href = "/Super-Admin/Add-Job"; }}>Post Job</Link>
                  <div className="cta-dropdown">
                    <li className={activeDropdown === 4 ? 'active' : ''}>
                      <Link to="#" className="dropdown-toggle" onClick={(e) => toggleDropdown(4, e)}>
                        <i className='mdi mdi-account-check me-2 text-primary' style={{ fontSize: "30px" }}></i>
                        {getUserDisplayName(auth.user)}
                      </Link>
                      <div className="mega-menu">
                        <h3>Super Admin Quick Access</h3>
                        <ul>
                          {renderSuperAdminMenuItems()}
                          {renderLogoutItem()}
                        </ul>
                      </div>
                    </li>
                  </div>
                </>
              )}

              {auth.user?.role === ROLE_EMPLOYER && (
                <>
                  <Link to="#" className="cta-btn hPostJob-btn">Post Job</Link>
                  <div className="cta-dropdown">
                    <li className={activeDropdown === 4 ? 'active' : ''}>
                      <Link to="#" className="dropdown-toggle" onClick={(e) => toggleDropdown(4, e)}>
                        <img
                          className="profile-image me-2"
                          src={getProfileImageSrc(auth?.user?.photo || user?.photo)}
                          alt={getUserDisplayName(auth.user)}
                          aria-label="User profile photo"
                          role="button"
                          style={{ borderRadius: "50%", height: "35px", width: "35px" }}
                        />
                        {getUserDisplayName(auth.user)}
                      </Link>
                      <div className="mega-menu">
                        <h3>Employer Quick Access</h3>
                        <ul>
                          <li>
                            <Link to="#" onClick={handleLinkClick}>
                              <i className="mdi mdi-home menu-icon me-2 text-success"></i> Dashboard
                            </Link>
                          </li>
                          <li><Link to="#" onClick={handleLinkClick}>Account</Link></li>
                          {renderLogoutItem()}
                        </ul>
                      </div>
                    </li>
                  </div>
                </>
              )}

              {(auth.user?.role !== ROLE_ADMIN && auth.user?.role !== ROLE_SUPERADMIN && auth.user?.role !== ROLE_EMPLOYER) && (
                <>
                  <Link to="/Search-Jobs" className="cta-btn hPostJob-btn">Find A Job</Link>
                  <div className="cta-dropdown">
                    <li className={activeDropdown === 4 ? 'active' : ''}>
                      <Link to="#" className="dropdown-toggle" onClick={(e) => toggleDropdown(4, e)}>
                        <img
                          className="profile-image me-2"
                          src={getProfileImageSrc(auth?.user?.photo || user?.photo)}
                          alt={getUserDisplayName(auth.user)}
                          aria-label="User profile photo"
                          role="button"
                          style={{ borderRadius: "50%", height: "35px", width: "35px" }}
                        />
                        {getUserDisplayName(auth.user)}
                      </Link>
                      <div className="mega-menu">
                        <h3>Job Seeker Quick Access</h3>
                        <ul>
                          <li>
                            <Link to="/Applicant-Profile-Dashboard" onClick={() => { window.location.href = "/Applicant-Profile-Dashboard"; }}>
                              <i className="mdi mdi-home menu-icon me-2 text-success"></i> Dashboard
                            </Link>
                          </li>
                          <li>
                            <Link to={`/Applicant/Profile/${auth?.user?.userId}`} onClick={() => { window.location.href = `/Applicant/Profile/${auth?.user?.userId}`; }}>
                              <i className="mdi mdi-account-key menu-icon me-2 text-success"></i> Account
                            </Link>
                          </li>
                          {renderLogoutItem()}
                        </ul>
                      </div>
                    </li>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default TestHomeHeader;
