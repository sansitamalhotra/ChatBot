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
                                    <Link to="/Browse-Jobs" className="nav-item me-5" onClick={() => { window.location.href = "/Browse-Jobs" }}>Browse Jobs</Link>
                                        {!auth.user?.role === 1 ? (<></>) : 
                                        (
                                            <>
                                                <a className="dropdown-toggle" id="user-dropdown-toggle" data-bs-toggle="dropdown" href="#" role="button" aria-expanded="false">
                                                    <img src={auth?.user?.photo} alt={auth?.user?.firstname} style={{ width: "40px", height: "40px", borderRadius: "50%"}} />
                                                </a>
                                                <ul class="dropdown-menu" aria-labelledby="user-dropdown-toggle">
                                                    <li>
                                                        <Link className="dropdown-item" to="/Admin/Dashboard">
                                                            Account
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link className="dropdown-item" to="/Admin/Dashboard">
                                                            Dashboard
                                                        </Link>
                                                    </li>
                                                    <li><hr className="dropdown-divider" /></li>
                                                    <li>
                                                        <Link className="dropdown-item" to="/Admin/Jobs/Manage-Jobs">
                                                            Manage Job
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link className="dropdown-item" to="/Admin/Jobs/Post-Job">
                                                            Post Job
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link className="dropdown-item" to="/Admin/Jobs/Applied-Jobs">
                                                            Applied Jobs
                                                        </Link>
                                                    </li>
                                                    <li><hr className="dropdown-divider" /></li>
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
                                                    <li><hr className="dropdown-divider" /></li>
                                                    <li>
                                                        <Link className="dropdown-item" to="/Login" onClick={() => {handleLogout(); window.location.href = "/Login";}}>
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
                            <Link className="app-logo" to="/" onClick={() => { window.location.href = "/" }}>
                                <img className="logo-icon me-2" src="../../assets/img/admin.png" alt="Admin Logo" />
                                <span className="logo-text">
                                    Admin
                                </span>
                            </Link>
            
                        </div>
                        
                        <nav id="app-nav-main" class="app-nav app-nav-main flex-grow-1">
                            <ul class="app-menu list-unstyled accordion" id="menu-accordion">
                                <li class="nav-item">
                                    
                                    <Link class="nav-link active" to="/Admin/Dashboard" onClick={() => { window.location.href = "/Admin/Dashboard" }}>
                                        <span class="nav-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-houses-fill" viewBox="0 0 16 16">
                                            <path d="M7.207 1a1 1 0 0 0-1.414 0L.146 6.646a.5.5 0 0 0 .708.708L1 7.207V12.5A1.5 1.5 0 0 0 2.5 14h.55a2.5 2.5 0 0 1-.05-.5V9.415a1.5 1.5 0 0 1-.56-2.475l5.353-5.354z"/>
                                            <path d="M8.793 2a1 1 0 0 1 1.414 0L12 3.793V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v3.293l1.854 1.853a.5.5 0 0 1-.708.708L15 8.207V13.5a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 4 13.5V8.207l-.146.147a.5.5 0 1 1-.708-.708z"/>
                                            </svg>
                                        </span>
                                        <span class="nav-link-text">Dashboard</span>
                                    </Link>
                                </li>
                                <li class="nav-item has-submenu">
                                    <a class="nav-link submenu-toggle" href="#" data-bs-toggle="collapse" data-bs-target="#submenu-1" aria-expanded="false" aria-controls="submenu-1">
                                        <span class="nav-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-briefcase-fill" viewBox="0 0 16 16">
                                            <path d="M6.5 1A1.5 1.5 0 0 0 5 2.5V3H1.5A1.5 1.5 0 0 0 0 4.5v1.384l7.614 2.03a1.5 1.5 0 0 0 .772 0L16 5.884V4.5A1.5 1.5 0 0 0 14.5 3H11v-.5A1.5 1.5 0 0 0 9.5 1zm0 1h3a.5.5 0 0 1 .5.5V3H6v-.5a.5.5 0 0 1 .5-.5"/>
                                            <path d="M0 12.5A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5V6.85L8.129 8.947a.5.5 0 0 1-.258 0L0 6.85z"/>
                                            </svg>
                                        </span>
                                        <span class="nav-link-text">Admin Jobs</span>
                                        <span class="submenu-arrow">
                                            <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-chevron-down" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                                            </svg>
                                        </span>
                                    </a>
                                    <div id="submenu-1" class="collapse submenu submenu-1" data-bs-parent="#menu-accordion">
                                        <ul class="submenu-list list-unstyled">
                                            <li class="submenu-item">
                                                <Link class="submenu-link" to="/Admin/Jobs/Manage-Jobs" onClick={() => { window.location.href = "/Admin/Jobs/Manage-Jobs" }}>
                                                    Manage Jobs
                                                </Link>
                                            </li>
                                            <li class="submenu-item">
                                                <Link class="submenu-link" to="/Admin/Jobs/Post-Job" onClick={() => { window.location.href = "/Admin/Jobs/Post-Job" }}>
                                                    Post New Job
                                                </Link>
                                            </li>
                                            <li class="submenu-item">
                                                <Link class="submenu-link" to="/Admin/Jobs/Applied-Jobs" onClick={() => { window.location.href = "/Admin/Jobs/Applied-Jobs" }}>
                                                    Applied Jobs
                                                </Link>
                                            </li>
                                        </ul>
                                    </div>
                                </li>


                                {/* Contact Us Form Messages Starts =================  */}
                                <li class="nav-item has-submenu">
                                    <a class="nav-link submenu-toggle" href="#" data-bs-toggle="collapse" data-bs-target="#submenu-q" aria-expanded="false" aria-controls="submenu-q">
                                        <span class="nav-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-envelope-at-fill" viewBox="0 0 16 16">
                                            <path d="M2 2A2 2 0 0 0 .05 3.555L8 8.414l7.95-4.859A2 2 0 0 0 14 2zm-2 9.8V4.698l5.803 3.546zm6.761-2.97-6.57 4.026A2 2 0 0 0 2 14h6.256A4.5 4.5 0 0 1 8 12.5a4.49 4.49 0 0 1 1.606-3.446l-.367-.225L8 9.586zM16 9.671V4.697l-5.803 3.546.338.208A4.5 4.5 0 0 1 12.5 8c1.414 0 2.675.652 3.5 1.671"/>
                                            <path d="M15.834 12.244c0 1.168-.577 2.025-1.587 2.025-.503 0-1.002-.228-1.12-.648h-.043c-.118.416-.543.643-1.015.643-.77 0-1.259-.542-1.259-1.434v-.529c0-.844.481-1.4 1.26-1.4.585 0 .87.333.953.63h.03v-.568h.905v2.19c0 .272.18.42.411.42.315 0 .639-.415.639-1.39v-.118c0-1.277-.95-2.326-2.484-2.326h-.04c-1.582 0-2.64 1.067-2.64 2.724v.157c0 1.867 1.237 2.654 2.57 2.654h.045c.507 0 .935-.07 1.18-.18v.731c-.219.1-.643.175-1.237.175h-.044C10.438 16 9 14.82 9 12.646v-.214C9 10.36 10.421 9 12.485 9h.035c2.12 0 3.314 1.43 3.314 3.034zm-4.04.21v.227c0 .586.227.8.581.8.31 0 .564-.17.564-.743v-.367c0-.516-.275-.708-.572-.708-.346 0-.573.245-.573.791"/>
                                            </svg>
                                        </span>
                                        <span class="nav-link-text">Contact Us Messages</span>
                                        <span class="submenu-arrow">
                                            <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-chevron-down" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                                            </svg>
                                        </span>
                                    </a>
                                    <div id="submenu-q" class="collapse submenu submenu-q" data-bs-parent="#menu-accordion">
                                        <ul class="submenu-list list-unstyled">
                                            <li class="submenu-item">
                                                <Link class="submenu-link" to="/Admin/Contact-Messages/Manage-Contact-Us-Messages" onClick={() => { window.location.href = "/Admin/Contact-Messages/Manage-Contact-Us-Messages" }}>
                                                    View All Messages
                                                </Link>
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                {/* Contact Us Form Messages Ends ===================== */}


                                {/*Job Qualification Starts ========================== */}
                                <li class="nav-item has-submenu">
                                    <a class="nav-link submenu-toggle" href="#" data-bs-toggle="collapse" data-bs-target="#submenu-q" aria-expanded="false" aria-controls="submenu-q">
                                        <span class="nav-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-mortarboard-fill" viewBox="0 0 16 16">
                                            <path d="M8.211 2.047a.5.5 0 0 0-.422 0l-7.5 3.5a.5.5 0 0 0 .025.917l7.5 3a.5.5 0 0 0 .372 0L14 7.14V13a1 1 0 0 0-1 1v2h3v-2a1 1 0 0 0-1-1V6.739l.686-.275a.5.5 0 0 0 .025-.917z"/>
                                            <path d="M4.176 9.032a.5.5 0 0 0-.656.327l-.5 1.7a.5.5 0 0 0 .294.605l4.5 1.8a.5.5 0 0 0 .372 0l4.5-1.8a.5.5 0 0 0 .294-.605l-.5-1.7a.5.5 0 0 0-.656-.327L8 10.466z"/>
                                            </svg>
                                        </span>
                                        <span class="nav-link-text">Job Qualifications</span>
                                        <span class="submenu-arrow">
                                            <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-chevron-down" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                                            </svg>
                                        </span>
                                    </a>
                                    <div id="submenu-q" class="collapse submenu submenu-q" data-bs-parent="#menu-accordion">
                                        <ul class="submenu-list list-unstyled">
                                            <li class="submenu-item">
                                                <Link class="submenu-link" to="/Admin/Qualifications/Manage-Qualifications" onClick={() => { window.location.href = "/Admin/Qualifications/Manage-Qualifications" }}>
                                                    Manage Qualifications
                                                </Link>
                                            </li>
                                            <li class="submenu-item">
                                                <Link class="submenu-link" to="/Admin/Qualifications/Add-Qualification" onClick={() => { window.location.href = "/Admin/Qualifications/Add-Qualification" }}>
                                                    Add New Qualification
                                                </Link>
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                 {/* Job Qualification Ends =========================== */}

                                 {/*Work Experience Starts ========================== */}
                                <li class="nav-item has-submenu">
                                    <a class="nav-link submenu-toggle" href="#" data-bs-toggle="collapse" data-bs-target="#submenu-we" aria-expanded="false" aria-controls="submenu-we">
                                        <span class="nav-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-book-fill" viewBox="0 0 16 16">
                                            <path d="M8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783"/>
                                            </svg>
                                        </span>
                                        <span class="nav-link-text">Work Experiences</span>
                                        <span class="submenu-arrow">
                                            <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-chevron-down" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                                            </svg>
                                        </span>
                                    </a>
                                    <div id="submenu-we" class="collapse submenu submenu-we" data-bs-parent="#menu-accordion">
                                        <ul class="submenu-list list-unstyled">
                                            <li class="submenu-item">
                                                <Link class="submenu-link" to="/Admin/WorkExperiences/Manage-Work-Experiences" onClick={() => { window.location.href = "/Admin/WorkExperiences/Manage-Work-Experiences" }}>
                                                    Manage Work Experiences
                                                </Link>
                                            </li>
                                            <li class="submenu-item">
                                                <Link class="submenu-link" to="/Admin/WorkExperiences/Add-Work-Experience" onClick={() => { window.location.href = "/Admin/WorkExperiences/Add-Work-Experience" }}>
                                                    Add Work Experience
                                                </Link>
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                 {/* Work Experience Ends =========================== */}

                                 {/*Work Mode Starts ========================== */}
                                <li class="nav-item has-submenu">
                                    <a class="nav-link submenu-toggle" href="#" data-bs-toggle="collapse" data-bs-target="#submenu-wm" aria-expanded="false" aria-controls="submenu-wm">
                                        <span class="nav-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-calendar-week-fill" viewBox="0 0 16 16">
                                            <path d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v1h16V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4zM16 14V5H0v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2M9.5 7h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5m3 0h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5M2 10.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5"/>
                                            </svg>
                                        </span>
                                        <span class="nav-link-text">Work Modes</span>
                                        <span class="submenu-arrow">
                                            <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-chevron-down" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                                            </svg>
                                        </span>
                                    </a>
                                    <div id="submenu-wm" class="collapse submenu submenu-wm" data-bs-parent="#menu-accordion">
                                        <ul class="submenu-list list-unstyled">
                                            <li class="submenu-item">
                                                <Link class="submenu-link" to="/Admin/WorkModes/Manage-Work-Modes" onClick={() => { window.location.href = "/Admin/WorkModes/Manage-Work-Modes" }}>
                                                    Manage Work Modes
                                                </Link>
                                            </li>
                                            <li class="submenu-item">
                                                <Link class="submenu-link" to="/Admin/WorkModes/Add-Work-Mode" onClick={() => { window.location.href = "/Admin/WorkModes/Add-Work-Mode" }}>
                                                    Add Work Mode
                                                </Link>
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                 {/* Work Mode Ends =========================== */}


                                <li class="nav-item has-submenu">
                                    <a class="nav-link submenu-toggle" href="#" data-bs-toggle="collapse" data-bs-target="#submenu-2" aria-expanded="false" aria-controls="submenu-2">
                                        <span class="nav-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-flag-fill" viewBox="0 0 16 16">
                                                <path d="M14.778.085A.5.5 0 0 1 15 .5V8a.5.5 0 0 1-.314.464L14.5 8l.186.464-.003.001-.006.003-.023.009a12 12 0 0 1-.397.15c-.264.095-.631.223-1.047.35-.816.252-1.879.523-2.71.523-.847 0-1.548-.28-2.158-.525l-.028-.01C7.68 8.71 7.14 8.5 6.5 8.5c-.7 0-1.638.23-2.437.477A20 20 0 0 0 3 9.342V15.5a.5.5 0 0 1-1 0V.5a.5.5 0 0 1 1 0v.282c.226-.079.496-.17.79-.26C4.606.272 5.67 0 6.5 0c.84 0 1.524.277 2.121.519l.043.018C9.286.788 9.828 1 10.5 1c.7 0 1.638-.23 2.437-.477a20 20 0 0 0 1.349-.476l.019-.007.004-.002h.001"/>
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
                                </li> 
                                 {/*Provinces Starts ========================== */}
                                 <li class="nav-item has-submenu">
                                    <a class="nav-link submenu-toggle" href="#" data-bs-toggle="collapse" data-bs-target="#submenu-prov" aria-expanded="false" aria-controls="submenu-prov">
                                        <span class="nav-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-signpost-split-fill" viewBox="0 0 16 16">
                                            <path d="M7 16h2V6h5a1 1 0 0 0 .8-.4l.975-1.3a.5.5 0 0 0 0-.6L14.8 2.4A1 1 0 0 0 14 2H9v-.586a1 1 0 0 0-2 0V7H2a1 1 0 0 0-.8.4L.225 8.7a.5.5 0 0 0 0 .6l.975 1.3a1 1 0 0 0 .8.4h5z"/>
                                            </svg>
                                        </span>
                                        <span class="nav-link-text">Job Provinces</span>
                                        <span class="submenu-arrow">
                                            <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-chevron-down" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                                            </svg>
                                        </span>
                                    </a>
                                    <div id="submenu-prov" class="collapse submenu submenu-prov" data-bs-parent="#menu-accordion">
                                        <ul class="submenu-list list-unstyled">
                                            <li class="submenu-item">
                                                <Link class="submenu-link" to="/Admin/Provinces/Manage-Provinces" onClick={() => { window.location.href = "/Admin/Provinces/Manage-Provinces" }}>
                                                    Manage Provinces
                                                </Link>
                                            </li>
                                            <li class="submenu-item">
                                                <Link class="submenu-link" to="/Admin/Provinces/Add-Province" onClick={() => { window.location.href = "/Admin/Provinces/Add-Province" }}>
                                                    Add New Province
                                                </Link>
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                 {/* Provinces Ends =========================== */}

                                 {/*Cities Starts ========================== */}
                                 <li class="nav-item has-submenu">
                                    <a class="nav-link submenu-toggle" href="#" data-bs-toggle="collapse" data-bs-target="#submenu-city" aria-expanded="false" aria-controls="submenu-city">
                                        <span class="nav-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pin-map-fill" viewBox="0 0 16 16">
                                            <path fill-rule="evenodd" d="M3.1 11.2a.5.5 0 0 1 .4-.2H6a.5.5 0 0 1 0 1H3.75L1.5 15h13l-2.25-3H10a.5.5 0 0 1 0-1h2.5a.5.5 0 0 1 .4.2l3 4a.5.5 0 0 1-.4.8H.5a.5.5 0 0 1-.4-.8z"/>
                                            <path fill-rule="evenodd" d="M4 4a4 4 0 1 1 4.5 3.969V13.5a.5.5 0 0 1-1 0V7.97A4 4 0 0 1 4 3.999z"/>
                                            </svg>
                                        </span>
                                        <span class="nav-link-text">Job Cities</span>
                                        <span class="submenu-arrow">
                                            <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-chevron-down" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                                            </svg>
                                        </span>
                                    </a>
                                    <div id="submenu-city" class="collapse submenu submenu-city" data-bs-parent="#menu-accordion">
                                        <ul class="submenu-list list-unstyled">
                                            <li class="submenu-item">
                                                <Link class="submenu-link" to="/Admin/Cities/Manage-Cities" onClick={() => { window.location.href = "/Admin/Cities/Manage-Cities" }}>
                                                    Manage Cities
                                                </Link>
                                            </li>
                                            <li class="submenu-item">
                                                <Link class="submenu-link" to="/Admin/Cities/Add-City" onClick={() => { window.location.href = "/Admin/Cities/Add-City" }}>
                                                    Add New City
                                                </Link>
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                 {/* Cities Ends =========================== */}

                                <li class="nav-item has-submenu">
                                    <a class="nav-link submenu-toggle" href="#" data-bs-toggle="collapse" data-bs-target="#submenu-sector" aria-expanded="false" aria-controls="submenu-sector">
                                        <span class="nav-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-book-half" viewBox="0 0 16 16">
                                            <path d="M8.5 2.687c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783"/>
                                            </svg>
                                        </span>
                                        <span class="nav-link-text">Job Sectors</span>
                                        <span class="submenu-arrow">
                                            <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-chevron-down" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                                            </svg>
                                        </span>
                                    </a>
                                    <div id="submenu-sector" class="collapse submenu submenu-2" data-bs-parent="#menu-accordion">
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
                                </li> 
                                <li class="nav-item has-submenu">
                                    <a class="nav-link submenu-toggle" href="#" data-bs-toggle="collapse" data-bs-target="#submenu-4" aria-expanded="false" aria-controls="submenu-4">
                                        <span class="nav-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-passport-fill" viewBox="0 0 16 16">
                                            <path d="M8 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/>
                                            <path d="M2 3.252a1.5 1.5 0 0 1 1.232-1.476l8-1.454A1.5 1.5 0 0 1 13 1.797v.47A2 2 0 0 1 14 4v10a2 2 0 0 1-2 2H4a2 2 0 0 1-1.51-.688 1.5 1.5 0 0 1-.49-1.11V3.253ZM5 8a3 3 0 1 0 6 0 3 3 0 0 0-6 0m0 4.5a.5.5 0 0 0 .5.5h5a.5.5 0 0 0 0-1h-5a.5.5 0 0 0-.5.5"/>
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
                                </li> 
                                {/* Salary Types Starts =============== */}
                                <li className="nav-item has-submenu mb-5">
                                        <Link className="nav-link submenu-toggle" to="#" data-bs-toggle="collapse" data-bs-target="#submenu-ss" aria-expanded="false" aria-controls="submenu-ss">
                                            <span className="nav-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-currency-rupee" viewBox="0 0 16 16">
                                                <path d="M4 3.06h2.726c1.22 0 2.12.575 2.325 1.724H4v1.051h5.051C8.855 7.001 8 7.558 6.788 7.558H4v1.317L8.437 14h2.11L6.095 8.884h.855c2.316-.018 3.465-1.476 3.688-3.049H12V4.784h-1.345c-.08-.778-.357-1.335-.793-1.732H12V2H4z"/>
                                                </svg>
                                            </span>
                                            <span className="nav-link-text">Salary Types</span>
                                            <span className="submenu-arrow">
                                                <svg width="1em" height="1em" viewBox="0 0 16 16" className="bi bi-chevron-down" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                                                </svg>
                                            </span>
                                        </Link>
                                        <div id="submenu-ss" className="collapse submenu submenu-ss" data-bs-parent="#menu-accordion">
                                            <ul className="submenu-list list-unstyled">
                                                <li className="submenu-item">
                                                    <Link className="submenu-link" to="/Admin/Salaries/Manage-Salaries">
                                                        Manage Salaries
                                                    </Link>
                                                </li>
                                                <li className="submenu-item">
                                                    <Link className="submenu-link" to="/Admin/Salaries/Add-Salary">
                                                        Add New Salary Type
                                                    </Link>
                                                </li>
                                            </ul>
                                        </div>
                                    </li> 
                                    <li className="nav-item mt-5">
                                        <Link className="nav-link" to="/Admin/Subscribers"  onClick={() => { window.location.href = "/Admin/Subscribers" }}>
                                            <span className="nav-icon">
                                            <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="m3.62 6.389 8.396 6.724 8.638-6.572-7.69-4.29a1.975 1.975 0 0 0-1.928 0L3.62 6.39Z"/>
                                            <path d="m22 8.053-8.784 6.683a1.978 1.978 0 0 1-2.44-.031L2.02 7.693a1.091 1.091 0 0 0-.019.199v11.065C2 20.637 3.343 22 5 22h14c1.657 0 3-1.362 3-3.043V8.053Z"/>
                                            </svg>
                                            </span>
                                            <span className="nav-link-text">Email Subscribers</span>
                                        </Link>
                                    </li>
                                    <li className="nav-item mb-5">
                                        <Link className="nav-link" to="/Account/Change-Password"  onClick={() => { window.location.href = "/Account/Change-Password" }}>
                                            <span className="nav-icon">
                                                <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd"><path d="M23.621 9.012c.247.959.379 1.964.379 3 0 6.623-5.377 11.988-12 11.988s-12-5.365-12-11.988c0-6.623 5.377-12 12-12 2.581 0 4.969.822 6.927 2.211l1.718-2.223 1.935 6.012h-6.58l1.703-2.204c-1.62-1.128-3.582-1.796-5.703-1.796-5.52 0-10 4.481-10 10 0 5.52 4.48 10 10 10 5.519 0 10-4.48 10-10 0-1.045-.161-2.053-.458-3h2.079zm-7.621 7.988h-8v-6h1v-2c0-1.656 1.344-3 3-3s3 1.344 3 3v2h1v6zm-5-8v2h2v-2c0-.552-.448-1-1-1s-1 .448-1 1z"/></svg>
                                            </span>
                                            <span className="nav-link-text">Change Password</span>
                                        </Link>
                                    </li>
                                {/* Salary Types Ends ================= */} 		    
                            </ul>
                        </nav>
                        <div class="app-sidepanel-footer">
                            <nav class="app-nav app-nav-footer">
                                <ul class="app-menu footer-menu list-unstyled">
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
                                        <Link className="nav-link" to="/Login" onClick={() => {handleLogout(); window.location.href = "/Login";}}>
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