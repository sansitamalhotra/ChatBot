import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import API from "../../helpers/API";
import { useAuth } from "../../Context/AuthContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TestHomeHeader from '../TestHomeHeader';
import Footer from '../Footer';

import './style.css';
import './About.css';
const PageChangePassword = () => {
    const canonicalUrl = window.location.href; 
    const [auth, setAuth] = useAuth();
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    const [visible, setVisible] = useState(false);

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
        if (oldPassword === "" || newPassword === "" || confirmPassword === "") {
        notifyErr("Pasword Fields are REQUIRED !!.");
        return;
        }
        if (newPassword !== confirmPassword) {
        notifyErr("Passwords does not Match !!.");
        return;
        }
        try {
        const response = await API.put(`/auth/Account/Change-Password`, {
            oldPassword,
            newPassword,
            confirmPassword
        });
        if (response.status === 200) {
            notifySucc("Your Password has been Updated Successfully !!.");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setTimeout(() => {
            handleLogout();
            }, 5000);
        }
        } catch (error) {
        console.log(error);
        notifyErr(
            "Something Went Wrong, Trying to Update your Password. Try Again Later !!."
        );
        }
    };

    const handleLogout = () => {
        setAuth({ ...auth, user: null, token: "" });
        localStorage.removeItem("userAuthDetails");
        notifySucc("You have Logged Out Successfully!!!");
        navigate(location.state || "/Test-Login");
    };   

    return (
        <>
        <Helmet>
            <link rel="canonical" href={canonicalUrl} />
            <title> Change / Update Your ThinkbBeyond Account Password | ThinkBeyond </title>
            <meta
            name="description"
            content="Change / Update  Your ThinkbBeyond Account Password | Thinkbeyond"
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
                        <h1>Change Your ThinkBeyond Account Password</h1>                       
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
                        <h3 className="text-center heading ">Change / Update Password</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <input
                                    type="password"
                                    id="password"
                                    placeholder="Password"
                                    className="loginFormInput form- col-md-6 mx-auto mb-3"
                                    name="oldPassword"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <input
                                    type="password"
                                    id="newPassword"
                                    placeholder="New Password"
                                    className="loginFormInput form- col-md-6 mx-auto mb-3"
                                    name="newPassword"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    placeholder="Confirm Password"
                                    className="loginFormInput form- col-md-6 mx-auto mb-3"
                                    name="confirmPassword"
                                    value={confirmPassword}
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

export default PageChangePassword;