import ChangePageTitle from "../../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import API from "../../../helpers/API";

import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

import { useAuth } from "../../../Context/AuthContext";
import Header from '../../../components/Header/Header';
import Footer from '../../../components/Footer/Footer';

import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import '../auth.css';


const ForgotPasswordReset = () => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const emailRegex = /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/;
    const [auth, setAuth] = useAuth();
    

    const navigate = useNavigate();
    const location = useLocation();

    const [showPassword, setShowPassword] = useState();
    const [visible, setVisible] = useState(false)

    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});


    const handleInputChange = (e) => {
        setEmail(e.target.value);
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();

        try
        {
            const response = await API.post("/api/v1/auth/forgot-password", { email });
            setEmail("");
            if (response.status === 200) {
                notifySucc("Password Reset Email Link has been Sent to your Email Successfully.!!");
            }
        }
        catch (error)
        {
            if (error.response && error.response.status === 404) {
                notifyErr("Email does not Exist!");
            } else {
                notifyErr("Server not Reachable!!");
            }
        }
    }
    
    return (
        <>
        <Header />
        <ChangePageTitle customPageTitle="Forgot Password Reset | ProfostSynergies" />  
        <div className="container-xxl py-5">
            <div className="container">
                <div className="row">
                    <div className="col-md-8 mx-auto">
                        <div className="wrapper">
                            <div className="inner">
                                <form onSubmit={handleSubmit} className="authform">
                                    <h3>Forgot Password Reset</h3>
                                    <div className="form-wrapper">
                                        <label for="">Email:</label>
                                        <input 
                                            type="email" 
                                            className="authInputFields form-control" 
                                            value={email}
                                            onChange={handleInputChange}
                                        />
                                    </div>  
                                    <button type="submit" className="authbtn mb-4">Submit</button>
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


export default ForgotPasswordReset;