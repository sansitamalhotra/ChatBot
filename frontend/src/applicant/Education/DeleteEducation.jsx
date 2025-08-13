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


const DeleteEducation = () => {

    const [auth, setAuth] = useAuth();
    const params = useParams();
    const navigate = useNavigate();


    const [id, setId] = useState("");
    const [applicantEducations, setApplicantEducations] = useState([]);
    const [applicantEducation, setApplicantEducation] = useState([]);
    const [qualifications, setQualifications] = useState([]);
    const [qualification, setQualification] = useState("");
    const [institution, setInstitution] = useState("");
    const [fieldOfStudy, setFieldOfStudy] = useState("");
    const [startYear, setStartYear] = useState("");
    const [finishYear, setFinishYear] = useState("");
    const [current, setCurrent] = useState(false);

    


    const [isChecked, setIsChecked] = useState(false);
    const [dateDisabled, setDateDisabled] = useState(false);

    const [country, setCountry] = useState("");
    const [countries, setCountries] = useState([]);

    const [showEQF, setShowEQF] = useState(false);

    const handleCloseEQF = () => setShowEQF(false);
    const handleShowEQF = () => setShowEQF(true);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchQualifications();
    }, []);

    const fetchQualifications = async () => {
        try
        {
            const { data } = await API.get("/api/v1/qualification/fetchQualifications");
            if (data?.success) {
                setQualifications(data?.qualifications);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Retrieving all Qualifications");
        }
    };

    useEffect(() => {
        fetchApplicantCountries();
    }, []);

    const fetchApplicantCountries = async () => {
            try
            {
                const { data } = await API.get("/api/v1/applicant/countries");
                if (data?.success) {
                    setCountries(data?.country);
                }
            }
            catch (error)
            {
                console.log(error);
                notifyErr("Oppss!!, FAILED, Something went Wrong Retrieving all Countries");
            }
    };

    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});


    const handleCheckboxChange = (event) => {
        setIsChecked(event.target.checked);    
        setCurrent(event.target.checked);    
        setDateDisabled(event.target.checked);    
      };

    const handleSubmit = async (e) => {
        e.preventDefault();    
        try {
            const formData = new FormData();
            formData.append('qualification', qualification);
            formData.append('institution', institution);
            formData.append('fieldOfStudy', fieldOfStudy);
            formData.append('startYear', startYear);
            formData.append('finishYear', finishYear);
            formData.append('current', current);
            formData.append('country', country);    
            const config = {
                headers: {
                    "Content-Type": "application/json",
                },
            };
    
            const response = await API.post('/api/v1/applicant/add-education', formData, config);
            notifySucc(response.data);
            setQualification("");
            setInstitution("");
            setFieldOfStudy("");
            setStartYear("");
            setFinishYear("");
            setCountry("");
            setCurrent("");
            navigate("/Applicant/Academic-Qualification");
    
        } catch (error) {
            console.error('Failed to Add New Education', error);
            notifyErr("Oops! Something went wrong. Failed to add new education qualification.");
        }
    };

    const fetchEducationHistory =  async () => {
        try
        {
            setLoading(true);
            const response = await API.get(`/api/v1/applicant/education-history/${params.userId}`);
            setApplicantEducations(response.data.result);
            setLoading(false);
        }
        catch (error)
        {
            console.log(error);
            setLoading(false);
            notifyErr(error.response.data.message);
        }
    };

    useEffect(() => {
        fetchEducation();
        fetchRegisteredUserById();
        fetchEducationHistory();
      }, []);

    const fetchEducation = async () => {
        try 
        {
            const { data } = await API.get(`/api/v1/applicant/education/${params.id}`);
            setId(data.applicantEdu._id);
            setApplicantEducation(data.applicantEdu);
            setQualification(data.applicantEdu.qualification._id);
            setInstitution(data.applicantEdu.institution);
            setFieldOfStudy(data.applicantEdu.fieldOfStudy);
            setStartYear(data.applicantEdu.startYear);
            setFinishYear(data.applicantEdu.finishYear);
            setCountry(data.applicantEdu.country._id);
            setCurrent(data.applicantEdu.current);
        } catch (error) {
          console.log(error);
        }
    };
    const fetchRegisteredUserById = async () => {

    };

    const handleDeleteEducationSubmit = async () => {
        try
        {
            await API.delete(`/api/v1/applicant/delete-education/${params.id}`);
            notifySucc("Education Qualification Has Been Deleted Successfully...");
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
        <ChangePageTitle customPageTitle={`${auth?.user?.firstname} ${auth?.user?.lastname} Delete Education | ProsoftSynergies`}  /> 
        <div className="app-wrapper">
            <div className="app-content pt-3 p-md-3 p-lg-4">
                <div className="container-xl">
                    <div className="position-relative mb-3">
                        <div className="row g-3 justify-content-between">
                            <div className="col-auto col-md-10 mx-auto">
                                <div className="appcontent">
                                    <h1 className="app-page-title mb-10"><i class="fas fa-graduation-cap stroke-transparent me-2"></i>Delete Education: {applicantEducation.institution}</h1>
                                    <ul>
                                        <li>
                                            <p class="tags">         
                                                {applicantEducation.qualification?.qualificationName} | {" "} {applicantEducation.institution} | {applicantEducation.country?.country_name}<br />
                                                <span>
                                                {applicantEducation.fieldOfStudy} | 
                                                <span> {" "}
                                                {moment(applicantEducation.startYear).format("MMMM Do, YYYY")}
                                                {" "}{" - "}{moment(applicantEducation.finishYear).format("MMMM Do, YYYY")}
                                                </span>
                                                </span>
                                                <div className="mx-auto mt-5 mb-5">
                                                    <button 
                                                        type="submit" 
                                                        className="btn btn-danger rounded-0"
                                                        onClick={handleDeleteEducationSubmit}
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

export default DeleteEducation;