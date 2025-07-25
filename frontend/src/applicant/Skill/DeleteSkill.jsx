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


const DeleteSkill = () => {

    const [auth, setAuth] = useAuth();
    const [users, setUsers] = useState([]);
    const [user, setUser] = useState({});
    const params = useParams();
    const navigate = useNavigate();


    const [skills, setSkills] = useState([]);
    const [skill, setSkill] = useState('');
    const [id, setId] = useState(''); // Added id state for storing applicantSkill id
    const [newSkill, setNewSkill] = useState(''); // Added state for newSkill
    
    


    const [isChecked, setIsChecked] = useState(false);
    const [dateDisabled, setDateDisabled] = useState(false);

    const [country, setCountry] = useState("");
    const [countries, setCountries] = useState([]);

    const [showEQF, setShowEQF] = useState(false);

    const handleCloseEQF = () => setShowEQF(false);
    const handleShowEQF = () => setShowEQF(true);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchApplicantSkills();
        fetchSkill();
    }, []);

    const fetchApplicantSkills = async () => {
        try {
          setLoading(true);
          const response = await API.get(`/api/v1/applicant/skills/${params.userId}`);
          setSkills(response.data.result);
          setLoading(false);
        } catch (error) {
          console.log(error);
          setLoading(false);
          notifyErr(error.response.data.message);
        }
    };

    

    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});


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
            notifyErr(error.data.message);      
        }      
    };


    const fetchSkill = async () => {
    try {
        const { data } = await API.get(`/api/v1/applicant/skill/${params.id}`);
        setId(data.applicantSkill._id); // Updated to set the id from data.applicantSkill
        setNewSkill(data.applicantSkill);
    } catch (error) {
        console.log(error);
    }
    };

    const handleDeleteSkillSubmit = async () => {
        try
        {
            await API.delete(`/api/v1/applicant/delete-skill/${params.id}`);
            setSkills(skills.filter((skill) => skill._id !== params.id));
            notifySucc("Skill Has Been Deleted Successfully...");
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
        <ChangePageTitle customPageTitle={`${auth?.user?.firstname} ${auth?.user?.lastname} Delete Skills | ProsoftSynergies`}  /> 
        <div className="app-wrapper">
            <div className="app-content pt-3 p-md-3 p-lg-4">
                <div className="container-xl">
                    <div className="position-relative mb-3">
                        <div className="row g-3 justify-content-between">
                            <div className="col-auto col-md-10 mx-auto">
                                <div className="appcontent">
                                    <h1 className="app-page-title mb-10"><i class="fas fa-graduation-cap stroke-transparent me-2"></i>Confirm Delete {skills?.name}</h1>
                                    <ul>
                                        <li>
                                            <p class="tags">         
                                                {skills?.name}<br />
                                                <span></span>
                                                <div className="mx-auto mt-5 mb-5">
                                                    <button 
                                                        type="submit" 
                                                        className="btn btn-danger rounded-0"
                                                        onClick={handleDeleteSkillSubmit}
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

export default DeleteSkill;