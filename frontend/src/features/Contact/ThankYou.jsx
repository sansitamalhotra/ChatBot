import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";


import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';


import "./Contact.css";


const ThankYou = () => { 
    
    return(
        <div>
            <Header />
            <ChangePageTitle customPageTitle="Thank You For Contacting Us | ProsoftSynergies" />
            <div className="container-fluid page-header py-5">
                <div className="container text-center py-5">
                    <h1 className="display-2 text-white mb-4 animated slideInDown">Thank You For Contacting Us</h1>
                    <nav aria-label="breadcrumb animated slideInDown">
                        <ol className="breadcrumb justify-content-center mb-0">
                            <li className="breadcrumb-item">
                                <Link to="/">Home</Link>
                            </li>
                            <li className="breadcrumb-item" aria-current="page">
                                Thank You For Contacting Us
                            </li>
                        </ol>
                    </nav>
                </div>
            </div>
            <div className="container-fluid py-5 mt-3">
                <div className="container py-5">
                    <div className="text-center mx-auto pb-5 wow fadeIn" data-wow-delay=".3s" style={{maxWidth: "800px"}}>
                        <h1 className="text-primary thankyou">Thank you for getting in touch!</h1>
                        <p className="mb-3 thankyou">One of our customer service team will be in touch with you shortly to address your message.</p>
                    </div>
                </div> 
            </div>
           
            <Footer />
        </div>
    ); 
}


export default ThankYou;