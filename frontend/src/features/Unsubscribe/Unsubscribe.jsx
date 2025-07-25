import ChangePageTitle from "../../utils/ChangePageTitle";
import React, {  useRef, useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";

import API from "../../helpers/API";

import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';

import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

import "./Unsubscribe.css";


const Unsubscribe = () => {

    
    const [email, setEmail] = useState('');
    const [unsubscribeReason, setUnsubscribeReason] = useState('');
    const emailRegex = /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/;
    const navigate = useNavigate();

    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });
      const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    const handleOptionChange = (e) => {
        setUnsubscribeReason(e.target.value);
    };

    const isButtonDisabled = !email || !unsubscribeReason;


    const handleUnsubscribe = async (e) => {

        e.preventDefault();

        if (!email) {
            notifyErr("Email Field Cannot be Empty");
            return
        } 
        if (!emailRegex.test(email)) {
                notifyErr("Invalid Email Address");
                return
        }

        try
        {
            await API.post('/api/v1/subscribers/unsubscribe', { email, reason: unsubscribeReason });
            notifySucc("You have Successfully UnSubscribed.");
            setEmail("");
            setUnsubscribeReason('');
            navigate(`/`);
        }
        catch (error)
        {
            console.log(error);
            notifyErr(error.response.data.message);
            setEmail("");
            setUnsubscribeReason('');
        }
    };

    return (

        <>
        <Header />
        <ChangePageTitle customPageTitle="Unsubscribe Email NewsLetter | ProfostSynergies" />
        <div className="container-xxl py-5">
            <div className="container">
                <div className="row g-5 align-items-center">                    
                    <div className="col-lg-8 mx-auto wow fadeIn" data-wow-delay="0.5s">
                        <h1 className="mb-5">We wish to know what put you off!</h1>

                        <label className="">
                            <input 
                                className="form-control"
                                type="email"
                                placeholder="Enter Your Email" 
                                value={email}
                                onChange={handleEmailChange}
                            />
                        </label>
                        <label className="radio">
                            <input 
                                type="radio" 
                                name="Not interested" 
                                value="Not interested" 
                                checked={unsubscribeReason === 'Not interested'}
                                onChange={handleOptionChange}
                            />
                            <span>Not interested</span>
                        </label>
                        <label className="radio">
                            <input 
                                type="radio" 
                                name="Too many Emails"
                                value="Too many Emails" 
                                checked={unsubscribeReason === 'Too many Emails'}
                                onChange={handleOptionChange}
                            />
                            <span>Too many Emails</span>
                        </label>
                        <label className="radio">
                            <input 
                                type="radio" 
                                name="Content not Relevant"
                                value="Content not Relevant" 
                                checked={unsubscribeReason === 'Content not Relevant'}
                                onChange={handleOptionChange}
                            />
                            <span>Content not Relevant</span>
                        </label>
                        <label className="radio">
                            <input 
                                type="radio" 
                                name="Not Needed Anymore"
                                value="Not Needed Anymore" 
                                checked={unsubscribeReason === 'Not Needed Anymore'}
                                onChange={handleOptionChange}
                            />
                            <span>Not Needed Anymore</span>
                        </label>
                        <label className="radio">
                            <input 
                                type="radio" 
                                name="Other reasons"
                                value="Other reasons" 
                                checked={unsubscribeReason === 'Other reasons'}
                                onChange={handleOptionChange}
                            />
                            <span>Other reasons</span>
                        </label>                                
                                
                        <div className="feedback__btns">
                            <button onClick={handleUnsubscribe} type="button" className="unSubscribeBTN btn btn-primary" disabled={isButtonDisabled}>Unsubscribe</button>
                            <button onClick={() => navigate('/')} type="button" className="unSubscribeBTN btn btn-warning">Yes, Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <Footer />
        </>
    );
};

export default Unsubscribe;