import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link, useNavigate, useLocation, useParams } from "react-router-dom";
import API from "../../helpers/API";
import { useAuth } from "../../Context/AuthContext";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import HeaderSidebar from "../components/HeadeSidebar";
import Footer from "../components/Footer";

import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";



const ChangePassword = () => {

    const [auth, setAuth] = useAuth();
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    const [visible, setVisible] = useState(false);

    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});


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
        try
        {
            const response = await API.put(`/api/v1/auth/Account/Change-Password`, {
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
        }
        catch (error) 
        {
            console.log(error);
            notifyErr("Something Went Wrong, Trying to Update your Password. Try Again Later !!.");
        }
    }

    const handleLogout = () => {
        setAuth({ ...auth, user: null, token: "" });
        localStorage.removeItem("userAuthDetails");
        notifySucc("You have Logged Out Successfully!!!");
        navigate(location.state || "/Login");
    };

    // useEffect(() => {
    //     handleLogout();
    // }, []);

    return (
        <>
        <HeaderSidebar />
        <ChangePageTitle customPageTitle=" Change Password | ProfostSynergies " /> 

        <div className="app-wrapper">
            <div className="app-content pt-3 p-md-3 p-lg-4">
                <div className="container-xl">
                    <div className="position-relative mb-3">
                        <div className="row g-3 justify-content-between">
                            <div className="col-auto">
                                <h1 className="app-page-title mb-0">Change Password</h1>
                            </div>
                        </div>
                    </div>
                    <div className="app-card app-card-notification shadow-sm mb-4">
                        <div className="app-card-body p-4">
                            <div className="notification-content">
                                <form onSubmit={handleSubmit} className="authform">
                                    <div className="col-md-6 mx-auto">
                                        <div className="md-form mb-4">
                                            <label for="oldPassword" className="mb-3">Old Password:</label>
                                            <input 
                                                type={visible ? "text" : "password"} 
                                                id="oldPassword" 
                                                className="form-control rounded-0" 
                                                name="oldPassword"
                                                value={oldPassword}
                                                onChange={(e) => setOldPassword(e.target.value)}
                                            /> 
                                            {visible ? (
                                            <AiOutlineEye
                                                className="absolute right-2 top-2 cursor-pointer"
                                                size={25}
                                                onClick={() => setVisible(false)}
                                            />
                                            ) : (
                                            <AiOutlineEyeInvisible
                                                className="absolute right-2 top-2 cursor-pointer"
                                                size={25}
                                                onClick={() => setVisible(true)}
                                            />
                                            )}                                                   
                                        </div> 
                                        <div className="md-form mb-4">
                                            <label for="newPassword" className="mb-3">New Password:</label>
                                            <input 
                                                type={visible ? "text" : "password"} 
                                                id="newPassword" 
                                                className="form-control rounded-0" 
                                                name="newPassword"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                            /> 
                                            {visible ? (
                                            <AiOutlineEye
                                                className="absolute right-2 top-2 cursor-pointer"
                                                size={25}
                                                onClick={() => setVisible(false)}
                                            />
                                            ) : (
                                            <AiOutlineEyeInvisible
                                                className="absolute right-2 top-2 cursor-pointer"
                                                size={25}
                                                onClick={() => setVisible(true)}
                                            />
                                            )}                                                   
                                        </div> 
                                        <div className="md-form mb-4">
                                            <label for="confirmPassword" className="mb-3">Confirm Password:</label>
                                            <input 
                                                type={visible ? "text" : "password"} 
                                                id="confirmPassword" 
                                                className="form-control rounded-0" 
                                                name="confirmPassword"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            /> 
                                            {visible ? (
                                            <AiOutlineEye
                                                className="absolute right-2 top-2 cursor-pointer"
                                                size={25}
                                                onClick={() => setVisible(false)}
                                            />
                                            ) : (
                                            <AiOutlineEyeInvisible
                                                className="absolute right-2 top-2 cursor-pointer"
                                                size={25}
                                                onClick={() => setVisible(true)}
                                            />
                                            )}                                                   
                                        </div>
                                        <div className="text-xs-left">
                                            <button type="submit" className="btn btn-primary rounded-0 text-white">
                                                <i className="fas fa-lock"></i> Update Password
                                            </button>
                                        </div>
                                    </div>
                                </form>                                
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}

export default ChangePassword;