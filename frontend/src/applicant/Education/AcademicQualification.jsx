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


const AcademicQualification = () => {

    const [auth, setAuth] = useAuth();
    const params = useParams();
    const navigate = useNavigate();


    const [applicantEducations, setApplicantEducations] = useState([]);
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

    useEffect(() => {
        fetchEducationHistory();
    }, []);

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

    return (
        <>
        <HeaderSidebar /> 
        <ChangePageTitle customPageTitle={`${auth?.user?.firstname} ${auth?.user?.lastname} Education History | ProsoftSynergies`}  /> 
        <div className="app-wrapper">
            <div className="app-content pt-3 p-md-3 p-lg-4">
                <div className="container-xl">
                    <div className="position-relative mb-3">
                        <div className="row g-3 justify-content-between">
                            <div className="col-auto col-md-10 mx-auto">
                                <div className="appcontent">
                                    <h1 className="app-page-title mb-10"><i class="fas fa-graduation-cap stroke-transparent me-2"></i>Education History</h1>
                                    <ul>
                                        <li>
                                            {applicantEducations.length > 0 ? (
                                                applicantEducations.map((q) => {
                                                    return (
                                                        <li key={q._id}>
                                                            <p class="tags">         
                                                                {q.qualification?.qualificationName} | {" "} {q.institution} | {q.country?.country_name}<br />
                                                                <span>
                                                                {q.fieldOfStudy} | 
                                                                <span> {" "}
                                                                {moment(q.startYear).format("MMMM Do, YYYY")}
                                                                {" "}{" - "}{moment(q.finishYear).format("MMMM Do, YYYY")}
                                                                </span>
                                                                </span>
                                                                <div className="d-flex justify-content-end actionicons">
                                                                    <Link className="d-block me-3" to={`/Applicant/Academic-Qualification/Update/${q._id}`}>
                                                                        <i className="fas fa-pencil stroke-transparent-blue"></i>
                                                                    </Link>
                                                                    <Link className="d-block" to={`/Applicant/Academic-Qualification/Delete/${q._id}`}>
                                                                        <i className="fas fa-trash text-danger"></i>
                                                                    </Link>
                                                                </div>
                                                            </p>
                                                        </li>
                                                    )
                                                })
                                            ) : (<li>No Education History Updated Yet.</li>)}
                                        </li>

                                        
                                        {/* <li>
                                            <p class="tags">
                                                Indian Institute of Information Technology-Allahabad<br />
                                                <span>Information Security, MS | 
                                                    <span>1994-1996</span>
                                                </span>
                                                <div className="d-flex justify-content-end actionicons">
                                                    <Link className="d-block me-3" to="#">
                                                        <i className="fas fa-pencil stroke-transparent-blue"></i>
                                                    </Link>
                                                    <Link className="d-block" to="#">
                                                        <i className="fas fa-trash text-danger"></i>
                                                    </Link>
                                                </div>
                                            </p>
                                        </li>
                                        <li>
                                            <p class="tags">
                                                Institute of Engineering and Rural Technology, U.P.T.U. Allahabad<br />
                                                <span>Computer Science & Engineering, B.Tech | 
                                                    <span>1988-1992</span>
                                                </span>
                                                <div className="d-flex justify-content-end actionicons">
                                                    <Link className="d-block me-3" to="#">
                                                        <i className="fas fa-pencil stroke-transparent-blue"></i>
                                                    </Link>
                                                    <Link className="d-block" to="#">
                                                        <i className="fas fa-trash text-danger"></i>
                                                    </Link>
                                                </div>
                                            </p>
                                        </li> */}
                                    </ul>
                                    <Button onClick={handleShowEQF} className="rounded-0">+ Add new</Button>
                                </div>
                                <div className="appcontent">
                                    <h1 className="app-page-title mb-10"><i class="fas fa-briefcase stroke-transparent me-2"></i>Work Experience</h1>
                                    <ul>
                                        <li>
                                            <p class="tags">
                                                Software Developer<br />
                                                <span>
                                                    SM Software Consulting Inc | Canada 
                                                    <span>March, 2014 - June 2022</span>
                                                </span>
                                                <div className="d-flex justify-content-end actionicons">
                                                    <Link className="d-block me-3" to="#">
                                                        <i className="fas fa-pencil stroke-transparent-blue"></i>
                                                    </Link>
                                                    <Link className="d-block" to="#">
                                                        <i className="fas fa-trash text-danger"></i>
                                                    </Link>
                                                </div>
                                            </p>
                                        </li>
                                        <li>
                                            <p class="tags">
                                                Sr. Data Analyst <br />
                                                <span>Information Security, MS | 
                                                    <span>1994-1996</span>
                                                </span>
                                                <div className="d-flex justify-content-end actionicons">
                                                    <Link className="d-block me-3" to="#">
                                                        <i className="fas fa-pencil stroke-transparent-blue"></i>
                                                    </Link>
                                                    <Link className="d-block" to="#">
                                                        <i className="fas fa-trash text-danger"></i>
                                                    </Link>
                                                </div>
                                            </p>
                                        </li>
                                        <li>
                                            <p class="tags">
                                                Front-end Developer<br />
                                                <span>
                                                    Computer Science & Engineering, B.Tech | 
                                                    <span>1988-1992</span>
                                                </span>
                                                <div className="d-flex justify-content-end actionicons">
                                                    <Link className="edit me-3" to="#">
                                                        <i className="fas fa-pencil stroke-transparent-blue"></i>
                                                    </Link>
                                                    <Link className="edit" to="#">
                                                        <i className="fas fa-trash text-danger"></i>
                                                    </Link>
                                                </div>
                                            </p>
                                        </li>
                                    </ul>
                                    <Button className="rounded-0 me-2">
                                        <i className="fas fa-plus"></i> Add New
                                    </Button>
                                </div>
                                <div className="appcontent">
                                    <h1 className="app-page-title mb-10"><i class="fas fa-microscope stroke-transparent me-2"></i>Skills</h1>
                                    <ul className="skilllist">
                                        <li>
                                            Python
                                            <div className="d-flex justify-content-end actionicons">
                                                <Link className="d-block me-3" to="#">
                                                    <i className="fas fa-pencil stroke-transparent-blue"></i>
                                                </Link>
                                                <Link className="d-block" to="#">
                                                    <i className="fas fa-trash text-danger"></i>
                                                </Link>
                                            </div>
                                        </li>
                                        <li>
                                            Java
                                            <div className="d-flex justify-content-end actionicons">
                                                <Link className="d-block me-3" to="#">
                                                    <i className="fas fa-pencil stroke-transparent-blue"></i>
                                                </Link>
                                                <Link className="d-block" to="#">
                                                    <i className="fas fa-trash text-danger"></i>
                                                </Link>
                                            </div>
                                        </li>
                                        <li>
                                            Oracle Database
                                            <div className="d-flex justify-content-end actionicons">
                                                <Link className="edit me-3" to="#">
                                                    <i className="fas fa-pencil stroke-transparent-blue"></i>
                                                </Link>
                                                <Link className="edit" to="#">
                                                    <i className="fas fa-trash text-danger"></i>
                                                </Link>
                                            </div>
                                        </li>
                                        <li>
                                            Express JS
                                            <div className="d-flex justify-content-end actionicons">
                                                <Link className="edit me-3" to="#">
                                                    <i className="fas fa-pencil stroke-transparent-blue"></i>
                                                </Link>
                                                <Link className="edit" to="#">
                                                    <i className="fas fa-trash text-danger"></i>
                                                </Link>
                                            </div>
                                        </li>
                                        <li>
                                            Node JS
                                            <div className="d-flex justify-content-end actionicons">
                                                <Link className="edit me-3" to="#">
                                                    <i className="fas fa-pencil stroke-transparent-blue"></i>
                                                </Link>
                                                <Link className="edit" to="#">
                                                    <i className="fas fa-trash text-danger"></i>
                                                </Link>
                                            </div>
                                        </li>
                                        <li>
                                            React JS
                                            <div className="d-flex justify-content-end actionicons">
                                                <Link className="edit me-3" to="#">
                                                    <i className="fas fa-pencil stroke-transparent-blue"></i>
                                                </Link>
                                                <Link className="edit" to="#">
                                                    <i className="fas fa-trash text-danger"></i>
                                                </Link>
                                            </div>
                                        </li>
                                        <li>
                                            Angular JS
                                            <div className="d-flex justify-content-end actionicons">
                                                <Link className="edit me-3" to="#">
                                                    <i className="fas fa-pencil stroke-transparent-blue"></i>
                                                </Link>
                                                <Link className="edit" to="#">
                                                    <i className="fas fa-trash text-danger"></i>
                                                </Link>
                                            </div>
                                        </li>
                                        <li>
                                            Vue JS
                                            <div className="d-flex justify-content-end actionicons">
                                                <Link className="edit me-3" to="#">
                                                    <i className="fas fa-pencil stroke-transparent-blue"></i>
                                                </Link>
                                                <Link className="edit" to="#">
                                                    <i className="fas fa-trash text-danger"></i>
                                                </Link>
                                            </div>
                                        </li>
                                        <li>
                                            PHP
                                            <div className="d-flex justify-content-end actionicons">
                                                <Link className="edit me-3" to="#">
                                                    <i className="fas fa-pencil stroke-transparent-blue"></i>
                                                </Link>
                                                <Link className="edit" to="#">
                                                    <i className="fas fa-trash text-danger"></i>
                                                </Link>
                                            </div>
                                        </li>
                                        <li>
                                            .NET Framework
                                            <div className="d-flex justify-content-end actionicons">
                                                <Link className="edit me-3" to="#">
                                                    <i className="fas fa-pencil stroke-transparent-blue"></i>
                                                </Link>
                                                <Link className="edit" to="#">
                                                    <i className="fas fa-trash text-danger"></i>
                                                </Link>
                                            </div>
                                        </li>
                                        <li>
                                            JavaScript
                                            <div className="d-flex justify-content-end actionicons">
                                                <Link className="edit me-3" to="#">
                                                    <i className="fas fa-pencil stroke-transparent-blue"></i>
                                                </Link>
                                                <Link className="edit" to="#">
                                                    <i className="fas fa-trash text-danger"></i>
                                                </Link>
                                            </div>
                                        </li>
                                        <li>
                                            JQuery
                                            <div className="d-flex justify-content-end actionicons">
                                                <Link className="edit me-3" to="#">
                                                    <i className="fas fa-pencil stroke-transparent-blue"></i>
                                                </Link>
                                                <Link className="edit" to="#">
                                                    <i className="fas fa-trash text-danger"></i>
                                                </Link>
                                            </div>
                                        </li>
                                        <li>
                                            Laravel
                                            <div className="d-flex justify-content-end actionicons">
                                                <Link className="edit me-3" to="#">
                                                    <i className="fas fa-pencil stroke-transparent-blue"></i>
                                                </Link>
                                                <Link className="edit" to="#">
                                                    <i className="fas fa-trash text-danger"></i>
                                                </Link>
                                            </div>
                                        </li>
                                    </ul>
                                    <Button className="rounded-0 me-2">
                                        <i className="fas fa-plus"></i> Add New
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Education Qualification Form Starts ========================== */}
            <Modal show={showEQF} onHide={handleCloseEQF} className="modal-lg">
                <Modal.Header closeButton>
                    <div className="position-relative mb-3">
                        <div className="row g-3 justify-content-between">
                            <div className="col-auto">
                                <h1 className="app-page-title mb-0">Add Educational Qualification</h1>
                            </div>
                        </div>
                    </div>
                </Modal.Header>
                    <Modal.Body className="EQF">
                        <div className="app-card app-card-notification shadow-sm mb-4">
                            <div className="app-card-body p-4">
                                <div className="notification-content">
                                    <form onSubmit={handleSubmit}>
                                        <div className="col-md-9 mx-auto">
                                            <div className="md-form mb-4">
                                                <label htmlFor="qualificationId" className="mb-3">Education Qualification Type: </label>
                                                <div className="form-wrapper">
                                                    <select 
                                                        class="form-control qualifications rounded-0" 
                                                        name="qualification"
                                                        value={qualification}
                                                        onChange={(e) => setQualification(e.target.value)}
                                                    >
                                                        <option>Select Qualification Type</option>
                                                        {qualifications.map((q) => {
                                                            return (
                                                                <option key={q._id} value={q._id}>
                                                                    {q.qualificationName}
                                                                </option>
                                                            );
                                                        })}    
                                                    </select>
                                                </div>                                                  
                                            </div>
                                            <div className="md-form mb-4">
                                                <label htmlFor="institution" className="mb-3">Institution Name:</label>
                                                <input 
                                                    type="text" 
                                                    id="institution" 
                                                    className="form-control rounded-0" 
                                                    name="institution"
                                                    value={institution}
                                                    onChange={(e) => setInstitution(e.target.value)}
                                                />                                                    
                                            </div>
                                            <div className="md-form mb-4">
                                                <label htmlFor="fieldOfStudy" className="mb-3">Field of Study:</label>
                                                <input 
                                                    type="text" 
                                                    id="fieldOfStudy" 
                                                    className="form-control rounded-0" 
                                                    name="fieldOfStudy"
                                                    value={fieldOfStudy}
                                                    onChange={(e) => setFieldOfStudy(e.target.value)}
                                                />                                                    
                                            </div>
                                            <div className="row">
                                                <div className="col-md-5">
                                                    <div class="md-form mb-4">
                                                        <label htmlFor="fieldofstudy" className="mb-3">Start Year:</label>
                                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                            <DemoContainer components={['DatePicker', 'DatePicker']}>                                                    
                                                                <DatePicker
                                                                    label="Start Year"
                                                                    value={startYear}
                                                                    onChange={(value) => setStartYear(value)}
                                                                />
                                                            </DemoContainer>
                                                        </LocalizationProvider>
                                                    </div>
                                                </div>
                                                <div className="col-md-5">
                                                    <div class="md-form mb-4">
                                                        <label htmlFor="fieldofstudy" className="mb-3">Finish Year:</label>
                                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                            <DemoContainer components={['DatePicker', 'DatePicker']}>                                                    
                                                                <DatePicker
                                                                    label="Finish Year"
                                                                    disabled={dateDisabled}
                                                                    value={finishYear}
                                                                    onChange={(value) => setFinishYear(value)}
                                                                />
                                                            </DemoContainer>
                                                        </LocalizationProvider>
                                                    </div>
                                                </div>
                                                <div className="col-md-2">
                                                    <div className="md-form mb-10">
                                                        <label htmlFor="current" className="mb-3">Present</label>
                                                        <Checkbox label="Solid" 
                                                            value={current} variant="solid" 
                                                            checked={isChecked}
                                                            onChange={handleCheckboxChange} 
                                                        />
                                                        {/* <input
                                                            type="checkbox"
                                                            id="checkbox"
                                                            checked={isChecked}
                                                            onChange={handleCheckboxChange}

                                                        /> */}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="md-form mb-4">
                                                <label htmlFor="country" className="mb-3">Country: </label>
                                                <div className="form-wrapper">
                                                    <select 
                                                        class="form-control qualifications rounded-0" 
                                                        name="country"
                                                        value={country}
                                                        onChange={(e) => setCountry(e.target.value)}
                                                    >
                                                        <option>Select Country</option>
                                                        {countries.map((ac) => {
                                                            return (
                                                                <option key={ac._id} value={ac._id}>
                                                                    {ac.country_name} {" | "} {ac.country_code}
                                                                </option>
                                                            );
                                                        })}    
                                                    </select>
                                                </div>                                                  
                                            </div>
                                        </div>
                                        <div className="text-center mt-5">
                                            <button type="submit" className="btn btn-primary rounded-0">
                                            <i className="fas fa-plus"></i> Add New
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-danger" className="rounded-0" onClick={handleCloseEQF}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
            {/* Education Qualification Form Ends ============================ */}
            <Footer />
        </div>
        </>
    );
};

export default AcademicQualification;