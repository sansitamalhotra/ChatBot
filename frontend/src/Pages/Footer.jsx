import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import API from "../helpers/API";
import { useAuth } from "../Context/AuthContext";
import { LogoutNavbarLink } from './Logout/LogoutNavbar';
import { LogoutLink } from './Logout/Logout';
import ChatBotIcon from '../components/ChatBotIcon/ChatBotIcon';
import { FaLinkedin, FaFacebook, FaWhatsapp } from 'react-icons/fa';
import { BsTwitterX } from "react-icons/bs";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import './Footer.css';

const Footer = () => {
    const currentDay = new Date();
    const currentYear = currentDay.getFullYear();

    // ***************************************
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
    <>
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-columns">
          <div className="footer-column">
            <h3>INDUSTRIES & RECRUITMENT SOLUTIONS</h3>
            <ul>
              <li><Link to="/Information-Technology-Recruitment">Information Technology Recruitment</Link></li>
              <li><Link to="/Government-Ministry-Recruitment">Government Ministry Recruitment</Link></li>
              <li><Link to="/Healthcare-&-Medical-Recruitment">Healthcare & Medical Recruitment</Link></li>
              <li><Link to="/Manufacturing-Recruitment">Manufacturing Recruitment</Link></li>
              <li><Link to="/Admin-&-Office-Support-Recruitment">Administration & Office Support Recruitment</Link></li>
              <li><Link to="/Transport-&-Logistics-Recruitment">Transport & Logistics Recruitment</Link></li>
              <li><Link to="/Construction-&-Infrastructure-Recruitment">Construction and Infrastructure Recruitment</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3>EDUCATION SOLUTIONS</h3>
            <ul>
              <li><Link to="/Education-Recruitment">Education Recruitment</Link></li>
              {/* <li><Link to="/#">Register</Link></li> */}
              {/* ******************************************* */}
              {!auth.user ? (
              <>
                <li><Link to="/Register">Register</Link></li>
              </>
              ) : (
              <>
                {auth.user?.role === 1 ? (
                  <>
                  <li>
                    <Link to="/Admin/Dashboard" onClick={() => {window.location.href = "/Admin/Dashboard";}}>
                      Admin Dashboard
                    </Link>
                  </li>                  
                  </>
                  ) : (
                  <>
                  {auth.user?.role === 2 ? (
                      <>
                        <li>
                          <Link to="/Employer/Employer-Dashboard" onClick={() => {window.location.href = "/Employer/Employer-Dashboard";}}>
                            Employer Dashboard
                          </Link>
                        </li>  
                      </>
                      ) : (
                      <>
                        <li>
                          <Link to="/Applicant-Profile-Dashboard" onClick={() => {window.location.href = "/Applicant-Profile-Dashboard";}}>
                            Applicant Dashboard
                          </Link>
                        </li>  
                      </>
                    )}
                  </>
                )}
              </>
              )}  
              {/* ******************************************* */}
            </ul>
          </div>

          <div className="footer-column">
            <h3>FOR JOB SEEKERS</h3>
            <ul>
              <li><Link to="/Search-Jobs">Search Jobs</Link></li>
              {/* <li><Link to="/#">Resume Upload</Link></li> */}
              <li>
                  {!auth.user ? (
                    <>
                      <Link to="/Login">Resume Upload</Link> 
                    </>
                    ) : (
                    <>
                      {(() => {
                        const userRole = auth.user?.role;
                        let linkPath = "/PSPL-Access-Denied";

                        if (userRole === 0) {
                          linkPath = `/Applicant-Resume-Upload/${auth?.user?.userId}`;
                        } else if (userRole === 1) {
                          linkPath = "/PSPL-Access-Denied";
                        } else if (userRole === 2) {
                          linkPath = "/PSPL-Access-Denied";
                        }
                        return (
                          <Link to={linkPath}>Resume Upload</Link> 
                        );
                      })()}
                    </>
                    )}
                </li>
              {/* <li><Link to="/#">Login</Link></li> */}
              {/* ******************************************* */}
              {!auth.user ? (
              <>
                <li><Link to="/#">Login</Link></li>
              </>
              ) : (
              <>
                {auth.user?.role === 1 ? (
                  <>
                  <li>
                    <LogoutLink onClick={() => {window.location.href = "/Login";}}>
                      Logout
                    </LogoutLink>
                  </li>                  
                  </>
                  ) : (
                  <>
                  {auth.user?.role === 2 ? (
                      <>
                        <li>
                          <LogoutLink onClick={() => {window.location.href = "/Login";}}>
                            Logout
                          </LogoutLink>
                        </li>  
                      </>
                      ) : (
                      <>
                        <li>
                          <LogoutLink onClick={() => {window.location.href = "/Login";}}>
                            Logout
                          </LogoutLink>
                        </li>  
                      </>
                    )}
                  </>
                )}
              </>
              )}  
              {/* ******************************************* */}
            </ul>
          </div>

          <div className="footer-column">
            <h3>HEALTH SOLUTIONS</h3>
            <ul>
              <li><Link to="/Behavioral-Health-Solutions">Behavioral Health</Link></li>
              <li><Link to="/Health-Billing-&-Collections-Solutions">Heath & Billing Collections</Link></li>
              <li><Link to="#">HealthCare Mergers & Acquisitions</Link></li>
              <li>
                <Link to="/Behavioral-Health-Credentialing-&-Contracting">Behavioral Health Credentialing & Contracting</Link>
              </li>
            </ul>
          </div>

          <div className="footer-column">
            <h3>ABOUT US</h3>
            <ul>
              <li><Link to="/About-Us">About Us</Link></li>
              <li><Link to="/Who-We-Are">Who We're </Link></li>
              <li><Link to="/Our-Locations">Locations</Link></li>
              <li><Link to="/ThinkBeyond-Privacy-Policy">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="social-section">
            <p>Follow Us</p>
            <div className="social-icons">
              <Link to="https://www.instagram.com/the_thinkbeyond_solutions/" aria-label="LinkedIn" target='_blank'><FaLinkedin /></Link>
              <Link to="https://www.facebook.com/thethinkbeyondsolutions" aria-label="Facebook" target='_blank'><FaFacebook /></Link>
              <Link to="https://x.com/thethinkbeyond8" aria-label="X-Twitter" target='_blank'><BsTwitterX /></Link>
              <Link to="https://wa.me/4169008153" aria-label="X-WhatsApp" target='_blank'><FaWhatsapp /></Link>
            </div>
          </div>

          <div className="bottom-links">
            <Link to="/ProsoftSynergies-Privacy-Policy">Privacy Policy</Link>
            <span className="divider">|</span>
            <a href="#">Accessibility</a>
          </div>
          <div>
            <p className="bottom-links pt-5"> Copyright © {currentYear} <Link to="/" className='ms-2 me-3'>ProsoftSynergies.</Link> All Right Reserved{" "}
            </p>
          </div>
        </div>
      </div>
       <ChatBotIcon />
    </footer>
    </>
  );
};

export default Footer;
