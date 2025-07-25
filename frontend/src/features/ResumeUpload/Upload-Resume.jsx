import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link, useNavigate, useParams, useLocation } from "react-router-dom";

import API from "../../helpers/API";
import { useAuth } from "../../Context/AuthContext";

import ready from 'document-ready';
import $ from 'jquery';

import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';

import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

import './resume.css';
import { fontSize } from "@mui/system";


const ResumeUpload = () => {

    const [auth, setAuth] = useAuth();
    const [resume, setResume] = useState(null);
    const [uploading, setUploading] = useState(false);
    const params = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(false);

    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});

    ready(() => {
        const $file = $('#resume');
        const $label = $file.next('label');
        const $labelText = $label.find('span');
        const $labelRemove = $('i.remove');
        const labelDefault = $labelText.text();

        // on file change
        $file.on('change', (event) => {
            const fileName = $file.val().split('\\').pop();
            if (fileName) {
            console.log($file);
            $labelText.text(fileName);
            $labelRemove.show();
            } else {
            $labelText.text(labelDefault);
            $labelRemove.hide();
            }
        });

        // Remove file
        $labelRemove.on('click', (event) => {
            $file.val('');
            $labelText.text(labelDefault);
            $labelRemove.hide();
            console.log($file);
        });
    });
    
    const handleResumeOnChange = (e) => {
        setResume(e.target.files[0]);
    };

    const handleUpload = async (e) => {
        e.preventDefault();

        if (!resume) {
            notifyErr("Please select a resume file.");
            return;
        }
        const formData = new FormData();
        formData.append("resume", resume);
        const config = { headers: { "Content-Type": "multipart/form-data" }};
        try
        {
            setLoading(true);
            const response = await API.post(`/api/v1/resume/upload-resume/${params.userId}`, formData, config);
            if (response.status === 201) {
                notifySucc(response.data.message);
                navigate(`/Applicant/Profile/${auth?.user?.userId}`);
            } else {
                console.error('Error uploading resumes');
                notifyErr("Error Trying to Upload Your Resume!!!");
                navigate(`/Applicant/Profile/${auth?.user?.userId}`);
                // setResume("");
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr(error.response?.data?.message);
            navigate(location.state || `/Applicant/Profile/${auth?.user?.userId}`);
            window.location.reload();
        } finally {
            setResume("");
            setLoading(false);
            setUploading(false);
        }
    };

    useEffect(() => {
        fetchLoggedInUserById();
    }, []);

    const fetchLoggedInUserById = async () => {
        try {      
            setLoading(true);
            const response = await API.get(`/api/v1/applicant/loggedInUser/${params.userId}`);
            const { user: userData } = response.data;
            setUser(userData);
            setLoading(false);      
        } catch (error) {      
            console.error(error);      
            setLoading(false);      
            notifyErr(error.response.data.message);      
        }      
    };

    const Loader = ({ style }) => (
        <div className="container text-center">
            <div className="spinner-border" role="status" style={style}>
                <span className="sr-only">Loading...</span>
            </div>
        </div>
    );

    return (
        <>
            <Header />
            <ChangePageTitle customPageTitle={`${auth?.user?.firstname} ${auth?.user?.lastname} | ProsoftSynergies`}  /> 
            <div className="container-fluid py-5 bg-dark page-header-resume-uploads mb-5">
                <div className="container my-5 pt-5 pb-4">
                    <h1 className="display-3 text-white mb-3 animated slideInDown">Resume / CV Upload</h1>
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb text-uppercase">
                            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                            <li className="breadcrumb-item text-white active" aria-current="page">For Job-Seekers Only</li>
                        </ol>
                    </nav>
                </div>
            </div>
            {/* <!-- Header End --> */}
            <div className="container-xxl py-5">
                <div className="container">
                    <div className="resume-wrapper">
                        <h2>Choose Resume File for Upload</h2>
                        <form onSubmit={handleUpload}>
                            <input 
                                type="file" 
                                id="resume" 
                                name="resume" 
                                accept=".pdf,.doc,.docx"
                                onChange={handleResumeOnChange}
                            />
                            <label for="resume">
                                <i className="fa fa-paperclip fa-2x"></i>
                                <span></span>
                            </label>
                            <i className="fas fa-times-circle remove"></i><br /><br />
                            <button type="submit" className="btn btn-sm btn-outline-info fa-2x mt-3 rounded-0" disabled={loading}>
                                {loading ? (
                                   <Loader style={{ width: "80px", height: "80px" }} />
                                ) : (
                                    <>
                                        <i className="fas fa-file-upload"></i>
                                        Upload Resume
                                    </>
                                )}
                                
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}; 


export default ResumeUpload;