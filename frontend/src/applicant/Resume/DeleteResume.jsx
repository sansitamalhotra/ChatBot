import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState, useMemo } from "react";
import { NavLink, Link, useNavigate, useParams, useHistory  } from "react-router-dom";
import API from "../../helpers/API";

import { useAuth } from "../../Context/AuthContext";
import HeaderSidebar from "../components/HeadeSidebar";
import Footer from "../components/Footer";
import moment from 'moment';

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Select from 'react-select'
import countryList from 'react-select-country-list';

import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Checkbox from '@mui/material/Checkbox';

import "./ApplicantProfile.css";

import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";


const DeleteResume = () => {

    const [auth, setAuth] = useAuth();
    const params = useParams();
    const navigate = useNavigate();


    const [id, setId] = useState("");
    
    const [applicantResume, setApplicantResume] = useState([]);
    const [resume, setResume] = useState("");

    


    const [loading, setLoading] = useState(false);

    

    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});



   

    useEffect(() => {
        fetchResume();
      }, []);

    const fetchResume = async () => {
        try 
        {
            const { data } = await API.get(`/api/v1/resume/applicant-resume/${params.id}`);
            setId(data.applicantResume._id);
            setApplicantResume(data.applicantResume);
            setResume(data.applicantResume.resume._id);
        } catch (error) {
          console.log(error);
        }
    };

    const handleDeleteResumeSubmit = async () => {
        try
        {
            await API.delete(`/api/v1/resume/delete-resume/${params.id}`);
            notifySucc("Applicant Resume Has Been Deleted Successfully...");
            navigate(`/Applicant/Profile/${auth?.user?.userId}`);
        }
        catch(error)
        {
            console.log(error);
            notifyErr("Opps!!! FAILED.. Something went wrong, Education Qualification DELETE Failed.");
        }
    };

const handleCancel = () => {
    navigate(`/Applicant/Profile/${auth?.user?.userId}`);
};

    return (
        <>
        <HeaderSidebar /> 
        <ChangePageTitle customPageTitle={`${auth?.user?.firstname} ${auth?.user?.lastname} Delete Resume | ProsoftSynergies`}  /> 
        <div className="app-wrapper">
            <div className="app-content pt-3 p-md-3 p-lg-4">
                <div className="container-xl">
                    <div className="position-relative mb-3">
                        <div className="row g-3 justify-content-between">
                            <div className="col-auto col-md-10 mx-auto">
                                <div className="appcontent">
                                    <h1 className="app-page-title mb-10">
                                        <i class="fas fa-graduation-cap stroke-transparent me-2"></i>
                                        Confirm Delete
                                    </h1>
                                    <ul>
                                        <li>
                                            <p class="tags">         
                                                {applicantResume.resume}<br />
                                                <span>
                                                </span>
                                                <div className="mx-auto mt-5 mb-5">
                                                    <button 
                                                        type="submit" 
                                                        className="btn btn-danger rounded-0"
                                                        onClick={handleDeleteResumeSubmit}
                                                    >
                                                        <i className="fas fa-trash"></i> Delete
                                                    </button>
                                                    <Link to={`/Applicant/Profile/${auth?.user?.userId}`} className="ms-3 btn btn-warning rounded-0" onClick={handleCancel}>
                                                    <i className="fas fa-times"></i> Cancel
                                                    </Link>
                                                </div>
                                            </p>
                                        </li>
                                    </ul>
                                </div>
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

export default DeleteResume;