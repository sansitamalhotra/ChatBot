import ChangePageTitle from '../../../utils/ChangePageTitle';

import React, { useState, useEffect } from "react";
import API from "../../../helpers/API";

import { useParams, Link, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

import Header from '../../../components/Header/Header';
import Footer from '../../../components/Footer/Footer';

const EmailVerification = () => {

    const [validUrl, setValidUrl] = useState(false);
    const navigate = useNavigate();
    const param = useParams();

    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });

        useEffect(() => {
            const verifyEmailUrl = async () => {
              try {
                const config = { headers: { 'Content-Type': 'application/json' } };
                const response = await API.get(
                  `/api/v1/auth/${param.id}/verify/${param.token}`,
                  config
                );
                if (response.status === 200) {
                  setValidUrl(true);
                  notifySucc(response.data.message);
                  navigate('/Login');
                }
              } catch (error) {
                console.log(error);
                setValidUrl(false);
                notifyErr(error.response.data.message);
                navigate('/Login');
              }
            };
            verifyEmailUrl();
        }, [param]);

    return (

        <>
        <Header />
        <ChangePageTitle customPageTitle="Email Confirmation | ProfostSynergies" />
        <div className="container-fliud py-5 bg-dark page-header-register mb-5">
                <div className="container my-5 pt-5 pb-4">
                    <h1 className="display-3 text-white mb-3 animated slideInDown">Email Confirmation</h1>
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb text-uppercase">
                            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                            <li className="breadcrumb-item text-white active" aria-current="page">Login</li>
                        </ol>
                    </nav>
                </div>
            </div>
            <div className="container-xxl py-5">
                <div className="container">
                    <div className="row">
                        <div className="col-md-10 mx-auto">
                            <div className="wrapper">
                                <div className="inner">
                                    {validUrl ? (
                                        <div className="form-wrapper">
                                            <h3>Email is Verified Successfully.</h3>
                                            <Link to="/Login">
                                                <button className='btn btn-primary btn-lg rounded-0'>Login</button>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="form-wrapper">
                                            <h3>Email Verification Failed</h3>
                                        </div>
                                    )}
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

export default EmailVerification;