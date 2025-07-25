import React, { Component, useRef, useEffect, useState } from "react";
import {  NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from 'react-redux';
import { useAuth } from "../../Context/AuthContext";

import PopperScript from "../scripts/popper";
import BootstrapScript from "../scripts/bootstrap";
import AppScript from "../scripts/maindashboard";

import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

import '../../assets/admin/css/portal.css';


const HeaderSidebar = () => {

    const [auth, setAuth] = useAuth();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});

    const handleLogout = () => {

        setAuth({ ...auth, user: null, token: "" });
        localStorage.removeItem("userAuthDetails");
        notifySucc("You have Logged Out Successfully!!!");
        navigate(location.state || "/Login");
    };

    return (
        <>
        <PopperScript />
        <BootstrapScript />
        <AppScript />
            <header className="app-header fixed-top">	   	            
                <div className="app-header-inner">  
                    <div className="container-fluid py-2">
                        <div className="app-header-content"> 
                            <div className="row justify-content-between align-items-center">
                                <div className="col-auto">
                                    <a id="sidepanel-toggler" className="sidepanel-toggler d-inline-block d-xl-none" href="#">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" role="img">
                                            <title>Menu</title>
                                            
                                            <path stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="2" d="M4 7h22M4 15h22M4 23h22"></path>
                                        </svg>
                                    </a>
                                </div>

                                <div className="search-mobile-trigger d-sm-none col">
                                    <i className="search-mobile-trigger-icon fa-solid fa-magnifying-glass"></i>
                                </div>

                                <div className="app-search-box col">
                                    <form className="app-search-form">   
                                        <input type="text" placeholder="Search..." name="search" className="form-control search-input" />
                                        <button type="submit" className="btn search-btn btn-primary" value="Search"><i className="fa-solid fa-magnifying-glass"></i></button> 
                                    </form>
                                </div>
                                
                                <div className="app-utilities col-auto">
                                    <div className="app-utility-item app-user-dropdown dropdown">
                                        {!auth.user?.role === 0 ? (<></>) : 
                                        (
                                            <>
                                            <Link to="/" className="nav-item me-5" onClick={() => { window.location.href = "/" }}>
                                                Home
                                            </Link>
                                            <Link to="/Browse-Jobs" className="nav-item me-5" onClick={() => { window.location.href = "/Browse-Jobs" }}>
                                            Browse Jobs
                                            </Link>
                                                <Link className="dropdown-toggle" id="user-dropdown-toggle" data-bs-toggle="dropdown" to="#" role="button" aria-expanded="false">
                                                    <img src={auth?.user?.photo} alt={auth?.user?.firstname} style={{ width: "40px", height: "40px", borderRadius: "50%"}} />
                                                </Link>
                                                <ul className="dropdown-menu" aria-labelledby="user-dropdown-toggle">
                                                    <li>
                                                        <Link className="dropdown-item" to={`/Applicant/Profile/${auth?.user?.userId}`}>
                                                            Account
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link className="dropdown-item" to="/Applicant/Dashboard">
                                                            Dashboard
                                                        </Link>
                                                    </li>
                                                    <li><hr className="dropdown-divider" /></li>
                                                    <li>
                                                        <Link className="dropdown-item" to="#">
                                                            Profile Settings
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link className="dropdown-item" to="#">
                                                            View Account
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link className="dropdown-item" to="#">
                                                            Applied Jobs
                                                        </Link>
                                                    </li>
                                                    {/* <li><hr className="dropdown-divider" /></li>
                                                    <li>
                                                        <Link className="dropdown-item" to="/Admin/Countries/Manage-Countries">
                                                            Manage Countries
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link className="dropdown-item" to="/Admin/Countries/Add-Country">
                                                            Add Country
                                                        </Link>
                                                    </li>
                                                    <li><hr className="dropdown-divider" /></li>
                                                    <li>
                                                        <Link className="dropdown-item" to="/Admin/Sectors/Manage-Sectors">
                                                            Manage Sectors
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link className="dropdown-item" to="/Admin/Sectors/Add-Sector">
                                                            Add Sector
                                                        </Link>
                                                    </li>
                                                    <li><hr className="dropdown-divider" /></li>
                                                    <li>
                                                        <Link className="dropdown-item" to="/Admin/WorkAuthorizations/Manage-Work-Authorizations">
                                                            Manage Work Authorizations
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link className="dropdown-item" to="/Admin/WorkAuthorizations/Add-Work-Authorization">
                                                            Add Work Authorization
                                                        </Link>
                                                    </li>
                                                    <li><hr className="dropdown-divider" /></li> */}
                                                    <li>
                                                        <Link className="dropdown-item" to="/Login" onClick={() => { handleLogout(); window.location.href = "/Login"; }}>
                                                            Logout
                                                        </Link>
                                                    </li>
                                                </ul>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="app-sidepanel" className="app-sidepanel"> 
                    <div id="sidepanel-drop" className="sidepanel-drop"></div>
                    <div className="sidepanel-inner d-flex flex-column">
                        <a href="#" id="sidepanel-close" className="sidepanel-close d-xl-none">&times;</a>
                        <div className="app-branding">
                            <Link className="app-logo" to="/" onClick={() => { window.location.href = "/"; }}>
                                <img className="logo-icon me-2" src="../../assets/admin/images/admin.png" alt="Admin Logo" />
                                <span className="logo-text">
                                    Applicant
                                </span>
                            </Link>
            
                        </div>
                        
                        <nav id="app-nav-main" className="app-nav app-nav-main flex-grow-1">
                            <ul className="app-menu list-unstyled accordion" id="menu-accordion">
                                <li className="nav-item">
                                    
                                    <Link className="nav-link active" to="/Applicant/Dashboard" onClick={() => { window.location.href = "/Applicant/Dashboard" }}>
                                        <span className="nav-icon">
                                            <svg width="1em" height="1em" viewBox="0 0 16 16" className="bi bi-house-door" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path fill-rule="evenodd" d="M7.646 1.146a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 .146.354v7a.5.5 0 0 1-.5.5H9.5a.5.5 0 0 1-.5-.5v-4H7v4a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5v-7a.5.5 0 0 1 .146-.354l6-6zM2.5 7.707V14H6v-4a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v4h3.5V7.707L8 2.207l-5.5 5.5z"/>
                                            <path fill-rule="evenodd" d="M13 2.5V6l-2-2V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5z"/>
                                            </svg>
                                        </span>
                                        <span className="nav-link-text">Dashboard</span>
                                    </Link>
                                </li>
                                {/* <li class="nav-item">
                                   
                                    <a class="nav-link" href="docs.html">
                                        <span class="nav-icon">
                                            <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-folder" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9.828 4a3 3 0 0 1-2.12-.879l-.83-.828A1 1 0 0 0 6.173 2H2.5a1 1 0 0 0-1 .981L1.546 4h-1L.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3v1z"/>
                                            <path fill-rule="evenodd" d="M13.81 4H2.19a1 1 0 0 0-.996 1.09l.637 7a1 1 0 0 0 .995.91h10.348a1 1 0 0 0 .995-.91l.637-7A1 1 0 0 0 13.81 4zM2.19 3A2 2 0 0 0 .198 5.181l.637 7A2 2 0 0 0 2.826 14h10.348a2 2 0 0 0 1.991-1.819l.637-7A2 2 0 0 0 13.81 3H2.19z"/>
                                            </svg>
                                        </span>
                                        <span class="nav-link-text">Docs</span>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    
                                    <a class="nav-link" href="orders.html">
                                        <span class="nav-icon">
                                            <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-card-list" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path fill-rule="evenodd" d="M14.5 3h-13a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13z"/>
                                            <path fill-rule="evenodd" d="M5 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 5 8zm0-2.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0 5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5z"/>
                                            <circle cx="3.5" cy="5.5" r=".5"/>
                                            <circle cx="3.5" cy="8" r=".5"/>
                                            <circle cx="3.5" cy="10.5" r=".5"/>
                                            </svg>
                                        </span>
                                        <span class="nav-link-text">Orders</span>
                                    </a>
                                </li> */}
                                <li className="nav-item has-submenu">
                                    <Link className="nav-link submenu-toggle" to="#" data-bs-toggle="collapse" data-bs-target="#submenu-1" aria-expanded="false" aria-controls="submenu-1">
                                        <span className="nav-icon">
                                            <svg width="1em" height="1em" viewBox="0 0 16 16" className="bi bi-files" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path fill-rule="evenodd" d="M4 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 1a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4z"/>
                                            <path d="M6 0h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2v-1a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1H4a2 2 0 0 1 2-2z"/>
                                            </svg>
                                        </span>
                                        <span className="nav-link-text">Applicant Applied Jobs</span>
                                        <span className="submenu-arrow">
                                            <svg width="1em" height="1em" viewBox="0 0 16 16" className="bi bi-chevron-down" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                                            </svg>
                                        </span>
                                    </Link>
                                    <div id="submenu-1" className="collapse submenu submenu-1"         data-bs-parent="#menu-accordion">
                                        <ul className="submenu-list list-unstyled">
                                            <li class="submenu-item">
                                                <Link className="submenu-link" to="/Applicant/Jobs/Manage-Jobs" onClick={() => { window.location.href = "/Applicant/Jobs/Applied-Jobs" }}>
                                                    View Applied Jobs
                                                </Link>
                                            </li>
                                            <li class="submenu-item">
                                                <Link className="submenu-link" to="/Applicant/Skills/AddSkill" onClick={() => { window.location.href = "/Applicant/Skill/Add-Job" }}>
                                                    Add New Skill
                                                </Link>
                                            </li>
                                            {/* <li class="submenu-item">
                                                <Link class="submenu-link" to="/Admin/Jobs/Applied-Jobs" onClick={() => { window.location.href = "/Admin/Jobs/Applied-Jobs" }}>
                                                    Applied Jobs
                                                </Link>
                                            </li> */}
                                        </ul>
                                    </div>
                                </li>

                                {/* Profile Setting Starts ======================= */}
                                <li className="nav-item has-submenu">
                                    <Link className="nav-link submenu-toggle" to="#" data-bs-toggle="collapse" data-bs-target="#submenu-011" aria-expanded="false" aria-controls="submenu-011">
                                        <span className="nav-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-gear-wide-connected" viewBox="0 0 16 16">
                                            <path d="M7.068.727c.243-.97 1.62-.97 1.864 0l.071.286a.96.96 0 0 0 1.622.434l.205-.211c.695-.719 1.888-.03 1.613.931l-.08.284a.96.96 0 0 0 1.187 1.187l.283-.081c.96-.275 1.65.918.931 1.613l-.211.205a.96.96 0 0 0 .434 1.622l.286.071c.97.243.97 1.62 0 1.864l-.286.071a.96.96 0 0 0-.434 1.622l.211.205c.719.695.03 1.888-.931 1.613l-.284-.08a.96.96 0 0 0-1.187 1.187l.081.283c.275.96-.918 1.65-1.613.931l-.205-.211a.96.96 0 0 0-1.622.434l-.071.286c-.243.97-1.62.97-1.864 0l-.071-.286a.96.96 0 0 0-1.622-.434l-.205.211c-.695.719-1.888.03-1.613-.931l.08-.284a.96.96 0 0 0-1.186-1.187l-.284.081c-.96.275-1.65-.918-.931-1.613l.211-.205a.96.96 0 0 0-.434-1.622l-.286-.071c-.97-.243-.97-1.62 0-1.864l.286-.071a.96.96 0 0 0 .434-1.622l-.211-.205c-.719-.695-.03-1.888.931-1.613l.284.08a.96.96 0 0 0 1.187-1.186l-.081-.284c-.275-.96.918-1.65 1.613-.931l.205.211a.96.96 0 0 0 1.622-.434zM12.973 8.5H8.25l-2.834 3.779A4.998 4.998 0 0 0 12.973 8.5m0-1a4.998 4.998 0 0 0-7.557-3.779l2.834 3.78zM5.048 3.967l-.087.065zm-.431.355A4.98 4.98 0 0 0 3.002 8c0 1.455.622 2.765 1.615 3.678L7.375 8zm.344 7.646.087.065z"/>
                                            </svg>
                                        </span>
                                        <span className="nav-link-text">Applicant Profile Setting</span>
                                        <span className="submenu-arrow">
                                            <svg width="1em" height="1em" viewBox="0 0 16 16" className="bi bi-chevron-down" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                                            </svg>
                                        </span>
                                    </Link>
                                    <div id="submenu-011" className="collapse submenu submenu-011"         data-bs-parent="#menu-accordion">
                                        <ul className="submenu-list list-unstyled">
                                            <li class="submenu-item">
                                                <Link className="submenu-link" to="/Applicant/Profile-Setting" onClick={() => { window.location.href = "/Applicant/Profile-Setting" }}>
                                                    Profile Setting
                                                </Link>
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                {/* Profile Setting Ends ========================= */}
                                {/* <li class="nav-item has-submenu">
                                    <a class="nav-link submenu-toggle" href="#" data-bs-toggle="collapse" data-bs-target="#submenu-2" aria-expanded="false" aria-controls="submenu-2">
                                        <span class="nav-icon">
                                            <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-columns-gap" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path fill-rule="evenodd" d="M6 1H1v3h5V1zM1 0a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1H1zm14 12h-5v3h5v-3zm-5-1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-5zM6 8H1v7h5V8zM1 7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H1zm14-6h-5v7h5V1zm-5-1a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1h-5z"/>
                                            </svg>
                                        </span>
                                        <span class="nav-link-text">Job Countries</span>
                                        <span class="submenu-arrow">
                                            <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-chevron-down" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                                            </svg>
                                        </span>
                                    </a>
                                    <div id="submenu-2" class="collapse submenu submenu-2" data-bs-parent="#menu-accordion">
                                        <ul class="submenu-list list-unstyled">
                                            <li class="submenu-item">
                                                <Link class="submenu-link" to="/Admin/Countries/Manage-Countries" onClick={() => { window.location.href = "/Admin/Countries/Manage-Countries" }}>
                                                    Manage Countries
                                                </Link>
                                            </li>
                                            <li class="submenu-item">
                                                <Link class="submenu-link" to="/Admin/Countries/Add-Country" onClick={() => { window.location.href = "/Admin/Countries/Add-Country" }}>
                                                    Add New Country
                                                </Link>
                                            </li>
                                        </ul>
                                    </div>
                                </li>   */}
                                {/* <li class="nav-item has-submenu">
                                    <a class="nav-link submenu-toggle" href="#" data-bs-toggle="collapse" data-bs-target="#submenu-3" aria-expanded="false" aria-controls="submenu-3">
                                        <span class="nav-icon">
                                            <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-columns-gap" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path fill-rule="evenodd" d="M6 1H1v3h5V1zM1 0a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1H1zm14 12h-5v3h5v-3zm-5-1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-5zM6 8H1v7h5V8zM1 7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H1zm14-6h-5v7h5V1zm-5-1a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1h-5z"/>
                                            </svg>
                                        </span>
                                        <span class="nav-link-text">Job Sectors</span>
                                        <span class="submenu-arrow">
                                            <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-chevron-down" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                                            </svg>
                                        </span>
                                    </a>
                                    <div id="submenu-3" class="collapse submenu submenu-2" data-bs-parent="#menu-accordion">
                                        <ul class="submenu-list list-unstyled">
                                            <li class="submenu-item">
                                                <Link class="submenu-link" to="/Admin/Sectors/Manage-Sectors" onClick={() => { window.location.href = "/Admin/Sectors/Manage-Sectors" }}>
                                                    Manage Job Sectors
                                                </Link>
                                            </li>
                                            <li class="submenu-item">
                                                <Link class="submenu-link" to="/Admin/Sectors/Add-Sector" onClick={() => { window.location.href = "/Admin/Sectors/Add-Sector" }}>
                                                    Add New Job Sector
                                                </Link>
                                            </li>
                                        </ul>
                                    </div>
                                </li>  */}
                                {/* <li class="nav-item has-submenu">
                                    <a class="nav-link submenu-toggle" href="#" data-bs-toggle="collapse" data-bs-target="#submenu-4" aria-expanded="false" aria-controls="submenu-4">
                                        <span class="nav-icon">
                                            <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-columns-gap" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path fill-rule="evenodd" d="M6 1H1v3h5V1zM1 0a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1H1zm14 12h-5v3h5v-3zm-5-1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-5zM6 8H1v7h5V8zM1 7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H1zm14-6h-5v7h5V1zm-5-1a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1h-5z"/>
                                            </svg>
                                        </span>
                                        <span class="nav-link-text">Work Authorization Types</span>
                                        <span class="submenu-arrow">
                                            <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-chevron-down" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                                            </svg>
                                        </span>
                                    </a>
                                    <div id="submenu-4" class="collapse submenu submenu-4" data-bs-parent="#menu-accordion">
                                        <ul class="submenu-list list-unstyled">
                                            <li class="submenu-item">
                                                <Link class="submenu-link" to="/Admin/WorkAuthorizations/Manage-Work-Authorizations" onClick={() => { window.location.href = "/Admin/WorkAuthorizations/Manage-Work-Authorizations" }}>
                                                    Manage Work Authorization Types
                                                </Link>
                                            </li>
                                            <li class="submenu-item">
                                                <Link class="submenu-link" to="/Admin/WorkAuthorizations/Add-Work-Authorization-Type" onClick={() => { window.location.href = "/Admin/WorkAuthorizations/Add-Work-Authorization" }}>
                                                    Add New Work Authorization
                                                </Link>
                                            </li>
                                        </ul>
                                    </div>
                                </li>  		     */}
                                <li className="nav-item mb-5">
                                    <Link className="nav-link" to="/Applicant/Change-Password"  onClick={() => { window.location.href = "/Applicant/Change-Password" }}>
                                        <span className="nav-icon">
                                            <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd"><path d="M23.621 9.012c.247.959.379 1.964.379 3 0 6.623-5.377 11.988-12 11.988s-12-5.365-12-11.988c0-6.623 5.377-12 12-12 2.581 0 4.969.822 6.927 2.211l1.718-2.223 1.935 6.012h-6.58l1.703-2.204c-1.62-1.128-3.582-1.796-5.703-1.796-5.52 0-10 4.481-10 10 0 5.52 4.48 10 10 10 5.519 0 10-4.48 10-10 0-1.045-.161-2.053-.458-3h2.079zm-7.621 7.988h-8v-6h1v-2c0-1.656 1.344-3 3-3s3 1.344 3 3v2h1v6zm-5-8v2h2v-2c0-.552-.448-1-1-1s-1 .448-1 1z"/></svg>
                                        </span>
                                        <span className="nav-link-text">Change Password</span>
                                    </Link>
                                </li>
                            </ul>
                        </nav>
                        <div className="app-sidepanel-footer">
                            <nav className="app-nav app-nav-footer">
                                <ul className="app-menu footer-menu list-unstyled">
                                    {/* <li class="nav-item">
                                        <a class="nav-link" href="settings.html">
                                            <span class="nav-icon">
                                                <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-gear" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                <path fill-rule="evenodd" d="M8.837 1.626c-.246-.835-1.428-.835-1.674 0l-.094.319A1.873 1.873 0 0 1 4.377 3.06l-.292-.16c-.764-.415-1.6.42-1.184 1.185l.159.292a1.873 1.873 0 0 1-1.115 2.692l-.319.094c-.835.246-.835 1.428 0 1.674l.319.094a1.873 1.873 0 0 1 1.115 2.693l-.16.291c-.415.764.42 1.6 1.185 1.184l.292-.159a1.873 1.873 0 0 1 2.692 1.116l.094.318c.246.835 1.428.835 1.674 0l.094-.319a1.873 1.873 0 0 1 2.693-1.115l.291.16c.764.415 1.6-.42 1.184-1.185l-.159-.291a1.873 1.873 0 0 1 1.116-2.693l.318-.094c.835-.246.835-1.428 0-1.674l-.319-.094a1.873 1.873 0 0 1-1.115-2.692l.16-.292c.415-.764-.42-1.6-1.185-1.184l-.291.159A1.873 1.873 0 0 1 8.93 1.945l-.094-.319zm-2.633-.283c.527-1.79 3.065-1.79 3.592 0l.094.319a.873.873 0 0 0 1.255.52l.292-.16c1.64-.892 3.434.901 2.54 2.541l-.159.292a.873.873 0 0 0 .52 1.255l.319.094c1.79.527 1.79 3.065 0 3.592l-.319.094a.873.873 0 0 0-.52 1.255l.16.292c.893 1.64-.902 3.434-2.541 2.54l-.292-.159a.873.873 0 0 0-1.255.52l-.094.319c-.527 1.79-3.065 1.79-3.592 0l-.094-.319a.873.873 0 0 0-1.255-.52l-.292.16c-1.64.893-3.433-.902-2.54-2.541l.159-.292a.873.873 0 0 0-.52-1.255l-.319-.094c-1.79-.527-1.79-3.065 0-3.592l.319-.094a.873.873 0 0 0 .52-1.255l-.16-.292c-.892-1.64.902-3.433 2.541-2.54l.292.159a.873.873 0 0 0 1.255-.52l.094-.319z"/>
                                                <path fill-rule="evenodd" d="M8 5.754a2.246 2.246 0 1 0 0 4.492 2.246 2.246 0 0 0 0-4.492zM4.754 8a3.246 3.246 0 1 1 6.492 0 3.246 3.246 0 0 1-6.492 0z"/>
                                                </svg>
                                            </span>
                                            <span class="nav-link-text">Settings</span>
                                        </a>
                                    </li> */}
                                    
                                    <li className="nav-item">
                                        <Link className="nav-link" to="/Login" onClick={() => { handleLogout(); window.location.href = "/Login"; }}>
                                            <span className="nav-icon">
                                                <svg width="1em" height="1em" viewBox="0 0 16 16" className="bi bi-download" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                <path fill-rule="evenodd" d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                                                <path fill-rule="evenodd" d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                                                </svg>
                                            </span>
                                            <span className="nav-link-text">Logout</span>
                                        </Link>
                                    </li>
                                    
                                    {/* <li class="nav-item">
                                        <a class="nav-link" href="https://themes.3rdwavemedia.com/bootstrap-templates/admin-dashboard/portal-free-bootstrap-admin-dashboard-template-for-developers/">
                                            <span class="nav-icon">
                                                <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-file-person" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                <path fill-rule="evenodd" d="M12 1H4a1 1 0 0 0-1 1v10.755S4 11 8 11s5 1.755 5 1.755V2a1 1 0 0 0-1-1zM4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H4z"/>
                                                <path fill-rule="evenodd" d="M8 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                                                </svg>
                                            </span>
                                            <span class="nav-link-text">License</span>
                                        </a>
                                    </li> */}
                                </ul>
                            </nav>
                        </div>                    
                    </div>
                </div>
            </header>
        </>
    );
};


export default HeaderSidebar;