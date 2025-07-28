import ChangePageTitle from "../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";

import { useDispatch } from 'react-redux';
import { useAuth } from "../Context/AuthContext";

import { ToastContainer, toast } from "react-toastify";
import styled from "styled-components";

import EHeaderSidebar from "./components/EHeaderSidebar";
import Footer from "./components/Footer";


const EmployerDashboardHome = () => {

    // const [auth, setAuth] = useAuth();
    // const dispatch = useDispatch();
    // const navigate = useNavigate();
    // const location = useLocation();

    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});

    const StyledContainer = styled(ToastContainer)`
        &&&.Toastify__toast-container {
        }
        .Toastify__toast {
        width: 550px !important;
        height: 200px;
        font-family: Trebuchet-ms;
        font-weight: bold;
        }
        .Toastify__toast-body {
        width: 550px !important;
        height: 200px
        font-family: Trebuchet-ms;
        }
        .Toastify__progress-bar {    
        }
  `;

//   const handleLogout = () => {

//     setAuth({ ...auth, user: null, token: "" });
//     localStorage.removeItem("userAuthDetails");
//     notifySucc("You have Logged Out Successfully!!!");
//     navigate(location.state || "/Login");
// };

    return (

        <>
            <ChangePageTitle customPageTitle=" Admin Dashboard Home | Prosoft Synergies " /> 

            <EHeaderSidebar />
            
            <div class="app-wrapper">
                <div class="app-content pt-3 p-md-3 p-lg-4">
                    <div class="container-xl">
                        <h1 class="app-page-title">Employer Dashboard</h1>
                        <div class="app-card alert alert-dismissible shadow-sm mb-4 border-left-decoration" role="alert">
                            <div class="inner">
                                <div class="app-card-body p-3 p-lg-4">
                                    <h3 class="mb-3">Employer Home!</h3>
                                    <div class="row gx-5 gy-3">
                                        <div class="col-12 col-lg-9">
                                            <div>
                                                Here You can effectively manage all the administrative resources by utilizing the functionalities of creating, reading, updating, or deleting.                                            
                                            </div>
                                        </div>
                                        <div class="col-12 col-lg-3">
                                            <Link class="btn app-btn-primary rounded-0" to="/Employer/Jobs/Manage-Jobs">
                                                <svg width="1em" height="1em" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-arrow-right me-2">
                                                    <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"/>
                                                </svg>
                                                Go To Employer Jobs
                                            </Link>
                                        </div>
                                    </div>
                                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                </div>
                            </div>
                        </div>
                        <div class="row g-4 mb-4">
                            <div class="col-6 col-lg-4">
                                <div class="app-card app-card-stat shadow-sm h-100">
                                    <div class="app-card-body p-3 p-lg-4">
                                        <h4 class="stats-type mb-1">Total Active Jobs</h4>
                                        <div class="stats-figure">918</div>
                                    </div>
                                    <Link class="app-card-link-mask" href="/Employer/Manage-Jobs"></Link>
                                </div>
                            </div>
                            <div class="col-6 col-lg-4">
                                <div class="app-card app-card-stat shadow-sm h-100">
                                    <div class="app-card-body p-3 p-lg-4">
                                        <h4 class="stats-type mb-1">Total Applicants</h4>
                                        <div class="stats-figure">790</div>
                                    </div>
                                    <Link class="app-card-link-mask" href="/Employer/Users"></Link>
                                </div>
                            </div>
                            <div class="col-6 col-lg-4">
                                <div class="app-card app-card-stat shadow-sm h-100">
                                    <div class="app-card-body p-3 p-lg-4">
                                        <h4 class="stats-type mb-1">Applied Jobs</h4>
                                        <div class="stats-figure">1225</div>
                                    </div>
                                    <Link class="app-card-link-mask" href="/Employer/Applied-Jobs"></Link>
                                </div>
                            </div>
                        </div>
                        <div class="row g-4 mb-4">
                            <div class="col-12 col-lg-12">
                                <div class="app-card app-card-progress-list h-100 shadow-sm">
                                    <div class="app-card-header p-3">
                                        <div class="row justify-content-between align-items-center">
                                            <div class="col-auto">
                                                <h4 class="app-card-title">Recent Applicants</h4>
                                            </div>
                                            <div class="col-auto">
                                                <div class="card-header-action">
                                                    <a href="#">View Recent Applicants</a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-12 col-lg-12">
                                <div class="app-card app-card-progress-list h-100 shadow-sm">
                                    <div class="app-card-header p-3">
                                        <div class="row justify-content-between align-items-center">
                                            <div class="col-auto">
                                                <h4 class="app-card-title">Recently Posted Jobs</h4>
                                            </div>
                                            <div class="col-auto">
                                                <div class="card-header-action">
                                                    <a href="#">View All Active Jobs</a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-12 col-lg-12">
                                <div class="app-card app-card-progress-list h-100 shadow-sm">
                                    <div class="app-card-header p-3">
                                        <div class="row justify-content-between align-items-center">
                                            <div class="col-auto">
                                                <h4 class="app-card-title">Recently Applied Jobs</h4>
                                            </div>
                                            <div class="col-auto">
                                                <div class="card-header-action">
                                                    <a href="#">View All Applied Jobs</a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
                <StyledContainer />
            </div>
        </>
    );
};

export default EmployerDashboardHome;