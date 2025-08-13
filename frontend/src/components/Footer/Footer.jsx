import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useAuth } from "../../Context/AuthContext";

import API from "../../helpers/API";

import { toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

const Footer = () => {

    const currentDay = new Date();
    const currentYear = currentDay.getFullYear();

    const [auth, setAuth] = useAuth();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const emailRegex = /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/;

    const notifyErr = (msg) => toast.error(msg, 
      {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });
    const notifySucc = (msg) => toast.success(msg, 
      {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });


    
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


    const handleSubscribe = async (e) => {
      e.preventDefault();

        if (!email) {
              notifyErr("Email Field Cannot be Empty");
              return
        } 
        if (!emailRegex.test(email)) {
              notifyErr("Invalid Email Address");
              return
        }
        try
        {
          await API.post('/api/v1/subscribers/subscribe', { email });
          notifySucc("You have Successfully Subscribed.");
          setEmail("");
        }
        catch (error)
        {
          console.log(error);
          notifyErr(error.response.data.message);
          setEmail("");
        }
    };


    return (
    <>
        <div
        className="container-fluid bg-dark text-white-50 footer pt-5 mt-5 wow fadeIn"
        data-wow-delay="0.1s"
      >
        <div className="container py-5">
          <div className="row g-5">
            <div className="col-lg-3 col-md-6">
              <img src="../../assets/img/ProsoftSynergies.jpeg" alt="ProsoftSynergies-Logo" className="footerLogo me-5"/>
              <div className="d-flex pt-2">
                <Link className="btn btn-outline-light btn-social" to="https://twitter.com/Prosoftsyn46522" target="_blank">
                  <i className="fab fa-twitter"></i>
                </Link>
                <Link className="btn btn-outline-light btn-social" to="https://www.facebook.com/prosoftsynergies/" target="_blank">
                  <i className="fab fa-facebook-f"></i>
                </Link>
                <Link className="btn btn-outline-light btn-social" to="https://instagram.com/hrpspl_123?igshid=OGQ5ZDc2ODk2ZA==" target="_blank">
                  <i className="fab fa-instagram"></i>
                </Link>
                <Link className="btn btn-outline-light btn-social" to="https://www.linkedin.com/company/prosoft-synergies-private-limited/" target="_blank">
                  <i className="fab fa-linkedin-in"></i>
                </Link>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <h5 className="text-white mb-4">Quick Links</h5>
              <Link className="btn btn-link text-white-50" to="/About-Us">
                About Us
              </Link>
              <Link className="btn btn-link text-white-50" to="/Contact-Us">
                Contact Us
              </Link>
              <Link className="btn btn-link text-white-50" to="/Browse-Jobs">
                Browse Jobs
              </Link>
              <Link className="btn btn-link text-white-50" to="/About-Us/Our-Vision">
                Our Vision
              </Link>
            </div>
            <div className="col-lg-3 col-md-6">
              <h5 className="text-white mb-4">Quick Links</h5>
              <Link className="btn btn-link text-white-50" to="/Employers">
                Employers
              </Link>
              <Link className="btn btn-link text-white-50" to="/About-Us/Our-Mission">
                Our Mission
              </Link>              
              {!auth.user ? 
              (
              <>
                <Link className="btn btn-link text-white-50" to="/Login">
                  Login / Register
                </Link>
              </>
              ) : (
              <>
              {auth.user?.role === 1 ? (
              <>
                <Link className="btn btn-link text-white-50" to="/Admin/Dashboard">
                  Admin Dashboard
                </Link>
                <Link to="/Login" className="btn btn-link text-white-50" onClick={handleLogout}>
                Logout
              </Link>
              </>) : (
              <>
              </>)}
              {auth.user?.role === 2 ? (
              <>
               <Link className="btn btn-link text-white-50" to="/Employer/Dashboard">
                  Employer Dashboard
                </Link>
                <Link to="/Login" className="btn btn-link text-white-50" onClick={handleLogout}>
                Logout
              </Link>
              </>) : (<></>)}
              {auth.user?.role === 0 ? (
              <>
              <Link className="btn btn-link text-white-50" to={`/Applicant/Profile/${auth?.user?.userId}`}>
                  Account
                </Link>
                <Link to="/Login" className="btn btn-link text-white-50" onClick={handleLogout}>
                Logout
              </Link>
              </>) : (<></>)}
              </>
              )}
            </div>
            
            <div className="col-lg-3 col-md-6">
              <h5 className="text-white mb-4">Newsletter</h5>
              <p>
                Stay in the loop with our daily job postings by subscribing to
                our Newsletter
              </p>
              <div
                className="position-relative mx-auto"
                style={{ maxWidth: "400px" }}
              >
                <input
                  className="form-control bg-transparent w-100 py-3 ps-4 pe-5"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  style={{ color: "white" }}
                />
                <button
                  type="button"
                  onClick={handleSubscribe}
                  className="btn btn-primary py-2 position-absolute top-0 end-0 mt-2 me-2"
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="container">
          <div className="copyright">
            <div className="row">
              <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
                &copy;{" "}  {currentYear} &nbsp;
                <Link className="" to="/">
                  ProsoftSynergies
                </Link>
                , All Right Reserved.
              </div>
            </div>
          </div>
        </div>
        {/* <Link to="#" className="btn btn-lg btn-primary btn-lg-square back-to-top">
        <i className="bi bi-arrow-up"></i>
      </Link> */}
      </div>
    </>
    );
}

export default Footer;
