import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState, useMemo } from "react";
import { NavLink, Link, useNavigate, useParams, useHistory  } from "react-router-dom";
import API from "../../helpers/API";

import { useAuth } from "../../Context/AuthContext";
import HeaderSidebar from "../components/HeadeSidebar";
import Footer from "../components/Footer";
import moment from 'moment';

import { Editor } from "@tinymce/tinymce-react";
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Checkbox from '@mui/material/Checkbox';

import "./ApplicantProfile.css";

import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";


const AddJobExperience = () => {

    const editorRef = useRef(null);

    const log = () => {
      if (editorRef.current) {
        console.log(editorRef.current.getContent());
      }
    };


    const [auth, setAuth] = useAuth();
    const params = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState({});

    const [designation, setDesignation] = useState([]);
    const [company, setCompany] = useState("");
    const [responsibilities, setResponsibilities] = useState("");
    const [startYear, setStartYear] = useState("");
    const [finishYear, setFinishYear] = useState("");
    const [current, setCurrent] = useState(false);


    
    const [isChecked, setIsChecked] = useState(false);
    const [dateDisabled, setDateDisabled] = useState(false);

    const [country, setCountry] = useState("");
    const [countries, setCountries] = useState([]);

    const [loading, setLoading] = useState(false);


    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});

    const handleCheckboxChange = (event) => {
        setIsChecked(event.target.checked);    
        setCurrent(event.target.checked);    
        setDateDisabled(event.target.checked);    
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

    const handleSubmit = async (e) => {
        e.preventDefault();    
        try {
            const formData = new FormData();
            formData.append('designation', designation);
            formData.append('company', company);
            formData.append('responsibilities', responsibilities);
            formData.append('startYear', startYear);
            formData.append('finishYear', finishYear);
            formData.append('current', current);
            formData.append('country', country);    
            const config = {
                headers: {
                    "Content-Type": "application/json",
                },
            };    
            const response = await API.post('/api/v1/applicant/add-experience', formData, config);
            notifySucc(response.data.message);
            setDesignation("");
            setCompany("");
            setResponsibilities("");
            setStartYear("");
            setFinishYear("");
            setCountry("");
            setCurrent("");
            navigate(0);
    
        } catch (error) {
            console.error('Failed to Add New Education', error);
            notifyErr("Oops! Something went wrong. Failed to add new Job Experience.");
        }
    };
    
    

    return (
        <>
           
        </>
    )
};

export default AddJobExperience;
