import ChangePageTitle from "../../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link, useNavigate, useLocation, useParams } from "react-router-dom";
import API from "../../../helpers/API";

import { useAuth } from "../../../Context/AuthContext";

import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import Header from '../../../components/Header/Header';
import Footer from '../../../components/Footer/Footer';

import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import '../auth.css';


const ChangePassword = () => {

    const [auth, setAuth] = useAuth();
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    const [visible, setVisible] = useState(false);

    

    const handleLogout = () => {
        setAuth({ ...auth, user: null, token: "" });
        localStorage.removeItem("userAuthDetails");
        notifySucc("You have Logged Out Successfully!!!");
        navigate(location.state || "/Login");
    };

    useEffect(() => {
        handleLogout();
    }, [handleLogout]);

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
                // handleLogout();
            }
        }
        catch (error) 
        {
            console.log(error);
            notifyErr("Something Went Wrong, Trying to Update your Password. Try Again Later !!.");
        }
    }

        return (
            <>
            <Header />
            <ChangePageTitle customPageTitle="Change Password | ProfostSynergies" />  
            <div className="container-xxl py-5">
                <div className="container">
                    <div className="row">
                        <div className="col-md-8 mx-auto">
                            <div className="wrapper">
                                <div className="inner">
                                    <form onSubmit={handleSubmit} className="authform">
                                        <h3>Update Password</h3>
                                        <div className="form-wrapper">
                                            <div className="row">
                                                <div className="col-md-12">
                                                    <label for="">Old Password:</label>
                                                    <input 
                                                        type={visible ? "text" : "password"} 
                                                        className="authInputFields form-control" 
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
                                                <div className="col-md-12">
                                                    <label for="">New Password:</label>
                                                    <input 
                                                        type={visible ? "text" : "password"} 
                                                        className="authInputFields form-control" 
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
                                                <div className="col-md-12">
                                                    <label for="">Confirm Password:</label>
                                                    <input 
                                                        type={visible ? "text" : "password"} 
                                                        name="confirmPassword"
                                                        className="authInputFields form-control" 
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
                                            </div>
                                        </div>  
                                        <button type="submit" className="authbtn mb-4">Update Password</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
            </>
        );
};

export default ChangePassword;