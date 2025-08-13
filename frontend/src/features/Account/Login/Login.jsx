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


const Login = () => {

     
     
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const emailRegex = /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/;
    const [auth, setAuth] = useAuth();
    


    const navigate = useNavigate();
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


    const [showPassword, setShowPassword] = useState();
    const [visible, setVisible] = useState(false)

    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            notifyErr("Email Field Cannot be Empty");
            return
        } 
        if (!emailRegex.test(email)) {
            notifyErr("Invalid Email Address");
            return
        }
        if (!password) {
            notifyErr("Password Field Cannot be Empty");
            return
        }
        try
        {            
           const res = await API.post("/api/v1/auth/login", { email, password });   
           console.log(res);        
            if (res.data.success) {
                
                notifySucc(res.data && res.data.message);
                setAuth({ ...auth, user: res.data.user, token: res.data.token });
                localStorage.setItem("userAuthDetails", JSON.stringify(res.data));
                if (res.data.user.role === 1) {
                    navigate(location.state || "/Admin/Dashboard");
                    window.location.reload();
                } else if (res.data.user.role === 2) {
                    navigate(location.state || "/Employer/Dashboard");
                    window.location.reload();
                } else if (res.data.user.role === 0) {
                    navigate(location.state || "/Applicant/Dashboard");
                    window.location.reload();
                }
            } else {
                notifyErr(res.data.message);
            }
        }
        catch (error)
        {
            console.log(error)
            {
                notifyErr("Something Went Wrong, Login Failed!!!. Try Again Later");
            }
        }
    };

    

    return (
        <>
        {(() => {
        const userRole = auth.user?.role;
            let linkPath = "/Login";
            if (auth.user && userRole === 1) {
                navigate("/Admin/Dashboard");
            } else if (auth.user && userRole === 2) {
                navigate("/Employer/Dashboard");
            } else if (auth.user && userRole === 0) {
                navigate("/Applicant/Dashboard");
            } else if (!auth.user) {
                return (
                    <>

                    <Header />
                    <ChangePageTitle customPageTitle="Login | ProfostSynergies" />  
                    <div className="container-xxl py-5">
                        <div className="container">
                            <div className="row">
                                <div className="col-md-8 mx-auto">
                                    <div className="wrapper">
                                        <div className="inner">
                                            <form onSubmit={handleLoginSubmit} className="authform">
                                                <h3>Login</h3>
                                                <div className="form-wrapper">
                                                    <label for="">Email:</label>
                                                    <input 
                                                        type="email" 
                                                        className="authInputFields form-control" 
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                    />
                                                </div>  
                                                <div className="form-wrapper">
                                                    <label for="">Password:</label>
                                                    <input 
                                                        type={visible ? "text" : "password"} 
                                                        className="authInputFields form-control" 
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
                                                <div className="authcheckbox mr-5">
                                                    <label>
                                                        <input type="checkbox" />Remeber Me?
                                                        <span class="checkmark"></span>
                                                    </label>
                                                    <label>
                                                        <Link to="/Account/Forgot-Password">
                                                            Forgot Password
                                                        </Link>
                                                    </label>
                                                </div>
                                                <button type="submit" className="authbtn mb-4">Login</button>
                                                <div className="mb-5">
                                                    <label>
                                                        <span className="mr-5">Don't Have an Account?</span> &nbsp;
                                                        <Link to="/Register">
                                                            Register
                                                        </Link>
                                                    </label>
                                                </div>
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
            }
            return <navigate to={linkPath} />
        })()}
        </>
    );
}; 


export default Login;