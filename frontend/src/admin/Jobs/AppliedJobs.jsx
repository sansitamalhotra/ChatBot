import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";

import HeaderSidebar from "../components/HeadeSidebar";
import Footer from "../components/Footer";


const AppliedJobs = () => {

    return (

        <>  <HeaderSidebar />
            <ChangePageTitle customPageTitle=" Admin Applied Jobs| Prosoft Synergies " /> 
            <div className="app-wrapper">
                <div className="app-content pt-3 p-md-3 p-lg-4">
                    <div className="container-xl">
                        <div className="position-relative mb-3">
                            <div className="row g-3 justify-content-between">
                                <div className="col-auto">
                                    <h1 className="app-page-title mb-0">Applied Jobs</h1>
                                </div>
                            </div>
                        </div>
                        <div className="app-card app-card-notification shadow-sm mb-4">
                            <div className="app-card-body p-4">
                                <div className="notification-content">
                                    <h1>Content or Table Here..</h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        </>
    );

};

export default AppliedJobs;