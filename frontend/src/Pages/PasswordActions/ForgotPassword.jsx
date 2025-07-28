import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import API from "../../helpers/API";
import { useParams, useNavigate } from "react-router-dom";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TestHomeHeader from '../TestHomeHeader';
import Footer from '../Footer';

import './style.css';
import './About.css';

const PageForgotPassword = () => {
    const canonicalUrl = window.location.href; // Get the current URL
    const [email, setEmail] = useState("");  
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

    const navigate = useNavigate();
    const handleInputChange = (e) => {
        setEmail(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
        const response = await API.post("/auth/forgot-password", {
            email
        });
        setEmail("");
        if (response.status === 200) {
            notifySucc(
            "Password Reset Email Link has been Sent to your Email Successfully.!!"
            );
            navigate("/Test-Login");
        }
        } catch (error) {
        if (error.response && error.response.status === 404) {
            notifyErr("Email does not Exist!");
        } else {
            notifyErr("Server not Reachable!!");
        }
        }
    };

    return (
        <>
        <Helmet>
            <link rel="canonical" href={canonicalUrl} />
            <title>Forgot Password | ThinkBeyond </title>
            <meta
                name="description"
                content="Forgot Your Password? Reset Your Thinkbeyond Website, Job Portal Account Password Easily. Trusted Job Opportunities Across Canada, the US, and India. Secure and Quick Password Recovery."
            />
            <meta
                name="keywords"
                content="ThinkBeyond Website, Job Portal, Login, Sign In, Job Search, Career Opportunities, Canada jobs, US Jobs, India Jobs, Employment, Job Seekers, Employer Login"
            />
            <meta name="author" content="ThinkBeyond" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <TestHomeHeader />
        <section className="about-us-section">
            <div className="about-us-container">
                <div className="about-us-text">
                    <div className="text-content">
                        <h1>Forgot Password Reset Request</h1>
                        {/* <p>
                            Complete Your Registration and Verify Your Email to start exploring Career Opportunities with Thinkbeyond.
                        </p> */}
                    </div>
                </div>
                <div className="about-us-image">
                    <img
                        src="https://images.pexels.com/photos/7372/startup-photos.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                        alt="ThinkBeyond Email Verification"
                    />
                </div>
            </div>
        </section>
        <div className="container">
            <div className="row">
                <div className="col-md-6 mx-auto card">
                    <div className="card">
                        <h3 className="text-center heading ">Forgot Password Reset Request</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <input
                                type="email"
                                id="email"
                                placeholder="Email"
                                className="loginFormInput form- col-md-6 mx-auto mb-3"
                                value={email}
                                onChange={handleInputChange}
                                />
                            </div>
                            <div className="loginbtn">
                                <button type="submit" className="btn-block btn-color">Send Reset Link</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        <Footer />  
        </>
    );
};

export default PageForgotPassword;