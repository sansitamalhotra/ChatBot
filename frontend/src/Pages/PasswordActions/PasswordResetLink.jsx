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

const PagePasswordResetLink = () => {
    const canonicalUrl = window.location.href; 
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    

    const navigate = useNavigate();
    const params = useParams();

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password === "" || confirmPassword === "") {
        notifyErr("Pasword Fields are REQUIRED !!.");
        return;
        }
        if (password !== confirmPassword) {
        notifyErr("Passwords does not Match !!.");
        return;
        }
        try {
        const response = await API.post(
            `/auth/Password-Reset-Link/${params.id}/${params.resetToken}`,
            {
            password,
            confirmPassword
            }
        );
        if (response.status === 200) {
            setPassword("");
            setConfirmPassword("");
            notifySucc("Your Password has been Updated Successfully !!.");
            navigate("/Test-Login");
        }
        } catch (error) {
        console.log(error);
        notifyErr(
            "Something Went Wrong, Trying to Update your Password. Try Again Later !!."
        );
        }
    };

    return (
        <>
        <Helmet>
            <link rel="canonical" href={canonicalUrl} />
            <title>Password Reset Form | ThinkBeyond </title>
            <meta
                name="description"
                content="Reset Your ThinkBeyond Account Password. Access Your Job Opportunities Seamlessly. Offices in Canada, the US, and India. Secure, Quick, and Easy Password Recovery."
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
                        <h1>Password Reset Form</h1>
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
                        <h3 className="text-center heading ">Password Reset Form</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <input
                                    type="password"
                                    id="password"
                                    placeholder="Password"
                                    className="loginFormInput form- col-md-6 mx-auto mb-3"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    placeholder="Confirm Password"
                                    className="loginFormInput form- col-md-6 mx-auto mb-3"
                                    value={confirmPassword}
                                    name="confirmPassword"
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                            <div className="loginbtn">
                                <button type="submit" className="btn-block btn-color">Update Password</button>
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

export default PagePasswordResetLink;