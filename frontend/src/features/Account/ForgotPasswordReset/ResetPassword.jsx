import ChangePageTitle from "../../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link, useNavigate, useLocation, useParams } from "react-router-dom";
import API from "../../../helpers/API";

import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

import { useAuth } from "../../../Context/AuthContext";
import Header from '../../../components/Header/Header';
import Footer from '../../../components/Footer/Footer';

import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import '../auth.css';


const ResetPassword = () => {

    
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [auth, setAuth] = useAuth();

    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

    const [showPassword, setShowPassword] = useState();
    const [visible, setVisible] = useState(false)

    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});


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
        try
        {
            const response = await API.post(`/api/v1/auth/reset-password/${params.id}/${params.resetToken}`, {
                password,
                confirmPassword
            });
            if (response.status === 200) {
                setPassword("");
                setConfirmPassword("");
                notifySucc("Your Password has been Updated Successfully !!.");
                navigate('/Login');
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
            <ChangePageTitle customPageTitle="Reset Password | ProfostSynergies" />  
            <div className="container-xxl py-5">
                <div className="container">
                    <div className="row">
                        <div className="col-md-8 mx-auto">
                            <div className="wrapper">
                                <div className="inner">
                                    <form onSubmit={handleSubmit} className="authform">
                                        <h3>Reset Password</h3>
                                        <div className="form-wrapper">
                                            <div className="row">
                                                <div className="col-md-12">
                                                    <label for="">Password:</label>
                                                    <input 
                                                        type={visible ? "text" : "password"} 
                                                        className="authInputFields form-control" 
                                                        name="password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
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
                                        <button type="submit" className="authbtn mb-4">Reset Password</button>
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

export default ResetPassword;