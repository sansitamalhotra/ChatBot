
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useAuth } from "../../Context/AuthContext";

import { toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

import  "../../assets/css/bootstrap.min.css";
import "../../assets/css/style.css";
import "../../assets/css/custom.css";
import "../../assets/jobs/css/style.css";
import CustomScript from "./CustomScript";

const Navbar = () => {

    const [auth, setAuth] = useAuth();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});
    
    const handleLogout = () => {

        setAuth({ ...auth, user: null, token: "" });
        localStorage.removeItem("userAuthDetails");
        notifySucc("You have Logged Out Successfully!!!");
        navigate(location.state || "/Login");
    };


      //assigning location variable
      const location = useLocation();
      //destructuring pathname from location
      const { pathname } = location;

      // splitting method to get the name of the path in array
      const splitLocation = pathname.split("/");

  // Hover link and Activation Link
  const [activeLink, setActiveLink] = useState("/");

  const handleSetActiveLink = (link) => {
    setActiveLink(link);
  };

  useEffect(() => {
     // Apply the active class when the component mounts , it stores the current path when the page mounts
     const initialActiveLink = window.location.pathname;
     setActiveLink(initialActiveLink);
  }, []);



  return (

    <>
    <CustomScript />
      <div id="spinner" className="show position-fixed translate-middle w-100 vh-100 top-50 start-50 d-flex align-items-center justify-content-center">
          <div className="spinner-grow text-primary" role="status"></div>
      </div>
      <div className="container-fluid bg-dark py-2 d-none d-md-flex">
          <div className="container">
              <div className="d-flex justify-content-between topbar">
                  <div className="top-info">
                      <small className="me-1 text-white-50">
                        <Link to='javascript:void(0)' onClick={() => window.location = 'mailto:hrpspl@prosoftsynergies.com'} style={{color: "#fff"}} target="_blank">
                          <i className="fas fa-envelope me-1 text-secondary"></i>
                          hrpspl@prosoftsynergies.com
                          </Link>
                      </small>
                  </div>
                  <div id="note" className="text-secondary d-none d-xl-flex">
                    <small className="IND me-5">
                      India: 528, Sector 82, Mohali, Punjab 
                    </small>
                    <small className="CA me-3">
                      Canada: 71 Fleming Crescent, Caledonia, ON, N3W 1V3 
                    </small>
                    <small className="US ms-5">
                      US: 943 Bensch Street, Lansing, MI, 48912 
                    </small>
                  </div>
                  <div className="top-link">
                      <Link to="https://www.facebook.com/prosoftsynergies/" className="bg-light nav-fill btn btn-sm-square rounded-circle" target="_blank">
                        <i className="fab fa-facebook-f text-primary"></i>
                      </Link>
                      <Link to="https://twitter.com/Prosoftsyn46522" className="bg-light nav-fill btn btn-sm-square rounded-circle" target="_blank">
                        <i className="fab fa-twitter text-primary"></i>
                      </Link>
                      <Link to="https://instagram.com/hrpspl_123?igshid=OGQ5ZDc2ODk2ZA==" className="bg-light nav-fill btn btn-sm-square rounded-circle" target="_blank">
                        <i className="fab fa-instagram text-primary"></i>
                      </Link>
                      <Link to="https://www.linkedin.com/company/prosoft-synergies-private-limited/" className="bg-light nav-fill btn btn-sm-square rounded-circle me-0" target="_blank">
                        <i className="fab fa-linkedin-in text-primary"></i>
                      </Link>
                  </div>
              </div>
          </div>
      </div>
      <div className="container-fluid bg-primary">
        <div className="container">
          <nav className="navbar navbar-dark navbar-expand-lg py-0">
            <Link to="/" className="navbar-brand">
                <h1 class="text-white fw-bold d-block">PS<span className="text-secondary">PL</span> </h1>
            </Link>
            <button type="button" className="navbar-toggler me-0" data-bs-toggle="collapse" data-bs-target="#navbarCollapse">
                <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse bg-primary" id="navbarCollapse">
              <div className="navbar-nav ms-auto mx-xl-auto p-0">
                    <Link to="/" className={`nav-item nav-link ${activeLink === "/" ? "active" : ""}`} >
                      Home
                    </Link>
                    <div className="nav-item dropdown">
                        <Link to="/About-Us" className={`nav-link dropdown-toggle ${activeLink === "/About-Us" ? "active" : ""}`} data-bs-toggle="dropdown"
                        >
                          About Us
                        </Link>
                        <div className="dropdown-menu rounded">
                            <Link to="/About-Us" className={`dropdown-item ${activeLink === "/About-Us" ? "active" : ""}`}>
                              Who We're
                            </Link>
                            <Link to="/About-Us/Our-Mission" className={`dropdown-item ${activeLink === "/About-Us" ? "active" : ""}`}>
                              Our Mission
                            </Link>
                            <Link to="/About-Us/Our-Vision" className={`dropdown-item ${activeLink === "/About-Us" ? "active" : ""}`}>
                              Our Vision
                            </Link>
                        </div>
                    </div>
                    <Link to="/Employers" className={`nav-item nav-link ${activeLink === "/Employers" ? "active" : ""}`}>
                      Employers
                    </Link>
                    <Link to="/Browse-Jobs" className={`nav-item nav-link ${activeLink === "/Browse-Jobs" ? "active" : ""}`}>
                      Browse Jobs
                    </Link>                          
                    {(() => {
                      const userRole = auth.user?.role;
                      let linkPath = "/PSPL-Access-Denied";

                      if (userRole === 1) {
                        linkPath = "/Admin/Jobs/Post-Job";
                      } else if (userRole === 2) {
                        linkPath = "/Employer/Jobs/Post-Job";
                      } else if (userRole === 0) {
                        linkPath = "/PSPL-Access-Denied"
                      }

                      return <Link to={linkPath} className={`nav-item nav-link ${activeLink === linkPath ? "active" : ""}`}>Post Job</Link>;
                    })()}
                    <Link to="/Contact-Us" className={`nav-item nav-link ${activeLink === "/Contact-Us" ? "active" : ""}`}>
                      Contact Us
                    </Link>
                    {/* <Link to="/Resume-Upload" className={`nav-item nav-link ${activeLink === "/Resume-Upload" ? "active" : ""}`}>
                      Resume Upload
                    </Link> */}
                    {!auth.user ? (<>
                      <Link to="/Login" className={`nav-item nav-link ${activeLink === `/Resume-Upload/${auth?.user?.userId}` ? "active" : ""}`}>
                      Resume Upload
                    </Link>
                    </>) : (
                      <>
                      {(() => {
                      const userRole = auth.user?.role;
                      let linkPath = "/PSPL-Access-Denied";

                      if (userRole === 0) {
                        linkPath = `/Resume-Upload/${auth?.user?.userId}`;
                      } else if (userRole === 1) {
                        linkPath ="/PSPL-Access-Denied"
                      } else if (userRole === 2) {
                        linkPath = "/PSPL-Access-Denied"
                      }
                      return <Link to={linkPath} className={`nav-item nav-link ${activeLink === linkPath ? "active" : ""}`}>Resume Upload</Link>;
                    })()}
                      </>
                    )}
                </div>
            </div>
            <div className="d-none d-xl-flex flex-shrink-0">
                <div id="phone-tads" className="d-flex align-items-center justify-content-center me-1">
                    <Link to="https://chat.whatsapp.com/CqUJWbi3w7jDs4byFv7eoL" className="position-relative animated tads infinite">
                        <i className="fab fa-whatsapp-square text-white fa-2x"></i>
                        <div className="position-absolute" style={{ top: "-7px", left: "20px" }}>
                            <span><i className="fa fa-comment-dots text-secondary"></i></span>
                        </div>
                    </Link>
                </div>
                <div className="d-flex flex-column pe-1 border-end me-2">
                    <span className="text-white-50 ms-2">Let's Connect on WhatsApp</span>
                    {/* <span className="text-secondary">Call: +1 512 961 7007</span> */}
                </div>
            </div>
            <div className="navbar-nav ms-l mx-xl-l p-0">
                {!auth.user ? 
                (
                  <>
                    <Link to="/Login" className="nav-item nav-link" style={{ fontSize: "20px"}}>
                    Login <i className="fa fa-lock ms-1 fa-1x"></i>
                    </Link>
                  </>
                ) : 
                (
                  <>
                    {
                      auth.user?.role === 1 ? 
                      (
                        <>
                          <div className="nav-item dropdown" style={{marginLeft: "20px"}}>
                              <Link
                                  to="/Admin/Dashboard"
                                  className="nav-link dropdown-toggle"
                                  data-bs-toggle="dropdown"
                              >
                                <img src={auth?.user?.photo} alt={auth?.user?.firstname} style={{ width: "30px", height: "30px", borderRadius: "50%"}} />
                              </Link>
                              <div className="dropdown-menu rounded-0 m-0" >
                                <Link to="/Admin/Dashboard" className="dropdown-item">
                                    {auth?.user?.firstname}{" "}
                                    {auth?.user?.lastname}
                                </Link>
                                <Link to="/Admin/Jobs/Manage-Jobs" className="dropdown-item">
                                  Admin Jobs 
                                </Link>
                                <Link to="/Admin/Jobs/Post-Job" className="dropdown-item">
                                  Post Jobs 
                                </Link>
                                <Link to="/Admin/Qualifications/Manage-Qualifications" className="dropdown-item">
                                  Qualifications 
                                </Link>
                                <Link to="/Admin/WorkExperiences/Manage-Work-Experiences" className="dropdown-item">
                                  Job Experiences
                                </Link>
                                <Link to="/Admin/WorkModes/Manage-Work-Modes" className="dropdown-item">
                                  Work Modes
                                </Link>
                                <Link to="/Admin/Countries/Manage-Countries" className="dropdown-item">
                                  Countries
                                </Link>
                                <Link to="/Admin/Provinces/Manage-Provinces" className="dropdown-item">
                                  Provinces
                                </Link>
                                <Link to="/Admin/Sectors/Manage-Sectors" className="dropdown-item">
                                  Sectors
                                </Link>
                                <Link to="/Admin/WorkAuthorizations/Manage-Work-Authorizations" className="dropdown-item">
                                  Work Authorizations
                                </Link>
                                <hr style={{height: "10px"}}/>
                                <Link to="/Login" className="dropdown-item" onClick={handleLogout}>
                                  Logout
                                </Link>
                              </div>
                          </div>
                        </>
                      ) : 
                      (
                        <></>
                      )
                    }
                    {
                      auth.user?.role === 2 ? 
                      (
                        <>
                          <div className="nav-item dropdown" style={{marginRight: "20px"}}>
                            <Link
                                to="/Employer/Dashboard"
                                className="nav-link dropdown-toggle"
                                data-bs-toggle=""
                            >
                              <img src={auth?.user?.photo} alt={auth?.user?.firstname} style={{ width: "30px", height: "30px", borderRadius: "50%"}} />
                            </Link>
                            <div className="dropdown-menu rounded-0 m-0" >
                              <Link to="/Employer/Dashboard" className="dropdown-item">
                                {auth?.user?.firstname}{" "}
                                {auth?.user?.lastname}
                              </Link>
                              <Link to="/Login" className="dropdown-item" onClick={handleLogout}>
                                Logout
                              </Link>
                            </div>
                          </div>
                        </>
                      ) :
                      (
                        <></>
                      )
                    }
                    {
                      auth.user?.role === 0 ?
                      (
                        <>
                          <div className="nav-item dropdown" style={{marginRight: "20px"}}>
                            <Link
                                to="/Applicant/Dashboard"
                                className="nav-link dropdown-toggle"
                                data-bs-toggle=""
                            >
                              <img src={auth?.user?.photo} alt={auth?.user?.firstname} style={{ width: "30px", height: "30px", borderRadius: "50%"}} />
                            </Link>
                            <div className="dropdown-menu rounded-0 m-0" >
                              <Link to="/Applicant/Dashboard" className="dropdown-item">
                                {auth?.user?.firstname}{" "}
                                {auth?.user?.lastname}
                              </Link>
                              <Link to={`/Applicant/Profile/${auth?.user?.userId}`} className="dropdown-item">
                                Account
                              </Link>
                              <Link to="/Login" className="dropdown-item" onClick={handleLogout}>
                                Logout
                              </Link>
                            </div>
                          </div>
                        </>
                      ) : 
                      (
                        <>
                        </>
                      )
                    }
                  </>
                ) 
              }
            </div>
          </nav>
        </div>
      </div>
    </>
  );
    
}

export default Navbar;


