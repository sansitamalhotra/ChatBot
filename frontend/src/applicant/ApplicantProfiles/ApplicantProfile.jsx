import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link, useNavigate, useParams } from "react-router-dom";
import API from "../../helpers/API";

import { useAuth } from "../../Context/AuthContext";
import HeaderSidebar from "../components/HeadeSidebar";
import Footer from "../components/Footer";
import moment from 'moment';
import { Editor } from "@tinymce/tinymce-react";
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';


import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Checkbox from '@mui/material/Checkbox';

import "./ApplicantProfile.css";

import { toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";





const initialState = {first_name: "", last_name: "", phone: ""};

const ApplicantProfile = () => {

    const editorRef = useRef(null);

    const log = () => {
      if (editorRef.current) {
        console.log(editorRef.current.getContent());
      }
    };

    const [auth, setAuth] = useAuth();
    const [users, setUsers] = useState([]);
    const params = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState({});
    const [appliedJobCount, setAppliedJobCount] = useState(0);
    const [countries, setCountries] = useState([]);
    const [countryName, setCountryName] = useState("");
    const [photo, setPhoto] = useState(null);
    const [loading, setLoading] = useState(false);
    const [jobsApplied, setApplicantAppliedJobs] = useState({});
    const [data, setData] = useState(initialState);
    const [job, setJob] = useState({});
    const [applied, setApplied] = useState(false);

    const [github, setGithub] = useState('');
    const [linkedin, setLinkedin] = useState('');
    const [gender, setGender] = useState('');

    const [resume, setResume] = useState('');
    const [resumes, setResumes] = useState('');
    
    const [experiences, setExperiences] = useState([]);


    // ==========================================

    const [applicantEducations, setApplicantEducations] = useState([]);
    const [qualifications, setQualifications] = useState([]);
    const [qualification, setQualification] = useState("");
    const [institution, setInstitution] = useState("");
    const [fieldOfStudy, setFieldOfStudy] = useState("");
    const [startYear, setStartYear] = useState("");
    const [finishYear, setFinishYear] = useState("");
    const [current, setCurrent] = useState(false);


 
    const [skills, setSkills] = useState([]);
    const [newSkill, setNewSkill] = useState('');

    const [designation, setDesignation] = useState([]);
    const [company, setCompany] = useState("");
    const [responsibilities, setResponsibilities] = useState("");

    const [applicantExperiences, setApplicantExperiences] = useState([]);
    const [applicantExperience, setApplicantExperience] = useState("");
   


    const [isChecked, setIsChecked] = useState(false);
    const [dateDisabled, setDateDisabled] = useState(false);

    const [country, setCountry] = useState("");
    
    const [showEQF, setShowEQF] = useState(false);

    const handleCloseEQF = () => setShowEQF(false);
    const handleShowEQF = () => setShowEQF(true);


    const [showPhotoForm, setShowPhotoForm] = useState(false);

    const handleClosePhotoForm = () => setShowPhotoForm(false);
    const handleShowPhotoForm = () => setShowPhotoForm(true);



    const [showSkillsForm, setShowSkillsForm] = useState(false);

    const handleCloseSkillsForm = () => setShowSkillsForm(false);
    const handleShowSkillsForm = () => setShowSkillsForm(true);
    
    const [showJEF, setShowJEF] = useState(false);

    const handleCloseJEF = () => setShowJEF(false);
    const handleShowJEF = () => setShowJEF(true); 

    const [uploading, setUploading] = useState(false);
    
          

    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});    


    useEffect(() => {
        if (params?._id) fetchAppliedJobsCountByApplicants();
    }, [params?._id]);


    const fetchAppliedJobsCountByApplicants = async () => {
        try
        {
            const response = await API.get(`/api/v1/users/fetchAppliedJobsCountByApplicants/${params._id}/appliedJobsCount`);
            const data = await response.json();
            setAppliedJobCount(data.appliedJobCount);
        }
        catch (error)
        {
            console.log("Error in Fetching Registered User Applied Jobs Count", error);
        }
    };
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
        fetchEducationHistory();
        fetchQualifications();
        fetchApplicantSkills();
        fetchJobExperiences();
        fetchResumes();
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
            navigate(0);
    
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

    const fetchResumes =  async () => {
        try
        {
            setLoading(true);
            const response = await API.get(`/api/v1/resume/applicant-resumes/${params.userId}`);
            setResumes(response.data.result);
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

    // const handlePhotoChange = (e) => {
    //     setPhoto(e.target.files[0]);    
    // };

    const handleUpdateSkills = async (e) => {
        e.preventDefault();
        try {
            const config = {
                headers: {
                'Content-Type': 'application/json',
                },
            };
            // const response = await API.post('/api/v1/applicant/add-skills',{ skill: newSkill }, config );
            const response = await API.post('/api/v1/applicant/add-skills', { skills: newSkill.split(',') }, config);
            if (response.data.success) {
                notifySucc(response.data.message);
                setSkills([...skills, ...response.data.newSkills]);
                setNewSkill('');
                navigate(0); // Define the navigate function or remove this line if not needed
            }
            
        } catch (error) {
        console.error(error);
        notifyErr(error.response.data.message);
        }
    };

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

    const handleJExperienceSubmit = async (e) => {
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
            if (response.data.success)
            {
                notifySucc(response.data.message);
                setDesignation("");
                setCompany("");
                setResponsibilities("");
                setStartYear("");
                setFinishYear("");
                setCountry("");
                setCurrent("");
                navigate(0);
            }
    
        } catch (error) {
            console.error('Failed to Add New Job Experience', error);
            notifyErr("Oops! Something went wrong. Failed to add new Job Experience.");
        }
    };

    const fetchJobExperiences =  async () => {
        try
        {
            setLoading(true);
            const response = await API.get(`/api/v1/applicant/job-exerience/${params.userId}`);
            setApplicantExperiences(response.data.result);
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
        const fetchUserPhoto = async () => {
            try
            {
                const response = await API.get(`/api/v1/auth/user-photo/${params.userId}`);
                setPhoto(response.data);
                //notifySucc("User Photo Retrieved Successfully!!");
            }
            catch (error)
            {
                console.log(error);
                notifyErr("Something Went Wrong Retrieving User Photo");
            }
        };
        fetchUserPhoto();
      }, [params.userId]);

    const handleUploadUserPhoto =  async (e) => {
        e.preventDefault();        
        
        try {
            const formData = new FormData();        
            formData.append('photo', photo);
            if (!photo) {
                notifyErr("Please select a photo to update.");
                return;
            }
            const response = await API.put(`/api/v1/auth/upload-user-photo`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            notifySucc(response.data.message); 
            setPhoto('');
            navigate(0);
            console.log(response.data.message); 
        } catch (error) {    
            console.error(error);  
            if (error.response && error.response.data && error.response.data.message) {
                notifyErr(error.response.data.message);
            } else {
                notifyErr("An error occurred while updating the photo.");
            }  
        }   
    };
      

    return (
        <>
        <HeaderSidebar /> 
        <ChangePageTitle customPageTitle={`${auth?.user?.firstname} ${auth?.user?.lastname} | ProsoftSynergies`}  /> 

        <div className="app-wrapper">
            <div className="app-content pt-3 p-md-3 p-lg-4">
                <div className="container-xl">
                    <div className="position-relative mb-5">
                        <div className="row g-3 justify-content-between">
                            <div className="col-auto">
                                <h1 className="app-page-title mb-0">
                                    Applicant Profile Setting
                                </h1>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-lg-4">
                            <div className="card rounded-0">
                                <div className="card-body">
                                    <div className="d-flex flex-column align-items-center text-center">
                                        <span>
                                            {user.photo ? (
                                                <img src={user.photo} alt={`${user?.firstname} ${user?.lastname} Photo`} width="120" height="120" />
                                            ) : (
                                                <img src={auth?.user?.photo} alt={`${auth?.user?.firstname} Photo`} width="120" height="120" />
                                            )}
                                            <div className="col-md-9 mx-auto">
                                                <div className="md-form mb-4">
                                                    {/* <input 
                                                        type="file" 
                                                        id="photo" 
                                                        className="form-control rounded-0" 
                                                        name="photo"
                                                        accept=".png,.jpg,.jpeg"
                                                        onChange={handlePhotoChange}
                                                    /> */}
                                                </div>
                                            </div>
                                            <div className="text-center mt-5">
                                                {/* <button type="submit" className="btn btn-primary rounded-0" onClick={handleUploadUserPhoto}>
                                                <i className="fas fa-plus"></i> Update Photo
                                                </button> */}
                                            </div> 
                                        </span>
                                    </div>
                                    <hr className="my-4" />
                                    <ul className="list-group list-group-flush">
                                        <li className="list-group-item d-flex justify-content-between align-items-center flex-wrap">
                                            <h6 className="mb-0"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="me-2"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>LinkedIn:</h6>
                                            <span className="text-secondary">

                                            </span>
                                        </li>
                                        <li className="list-group-item d-flex justify-content-between align-items-center flex-wrap">
                                            <h6 class="mb-0"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="me-2"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>Github:</h6>
                                            <span className="text-secondary">
                                                
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-8">
                            <div className="card rounded-0">
						        <div className="card-body rounded-0">
                                    <div className="row mb-3">
                                        <div className="col-sm-3">
                                            <h6 className="mb-0">Full Name</h6>
                                        </div>
                                        <div className="col-sm-9 text-secondary">
                                            {user.firstname} {user.lastname}
                                        </div>
                                    </div>
                                    <hr />
                                    <div className="row mb-3">
                                        <div class="col-sm-3">
                                            <h6 class="mb-0">Email</h6>
                                        </div>
                                        <div class="col-sm-9 text-secondary">
                                        {user.email} 
                                        </div>
                                    </div>
                                    <hr />
                                    <div className="row mb-3">
                                        <div className="col-sm-3">
                                            <h6 className="mb-0">Phone</h6>
                                        </div>
                                        <div className="col-sm-9 text-secondary">
                                        {user.phone}
                                        </div>
                                    </div>
                                    <hr />
                                    <div className="row mb-3">
                                        <div className="col-sm-3">
                                            <h6 className="mb-0">Country</h6>
                                        </div>
                                        <div className="col-sm-9 text-secondary">
                                        {user.country?.countryName} 
                                        </div>
                                    </div>
                                    <hr />
                                    <div className="row mb-3">
                                        <div className="col-sm-3">
                                            <h6 className="mb-0">Account Status:</h6>
                                        </div>
                                        <div className="col-sm-9 text-secondary">
                                        {user.isVerified === true && "Verified"}
                                        </div>
                                    </div>
                                    <hr />
                                    <div className="row mb-3">
                                        <div className="col-sm-3">
                                            <h6 className="mb-0">Applied Jobs:</h6>
                                        </div>
                                        <div className="col-sm-9 text-secondary">
                                        {appliedJobCount}
                                        </div>
                                    </div>
                                    <hr />
                                    <div className="row mb-3">
                                        <div className="col-sm-3">
                                            <h6 className="mb-0">Joined On:</h6>
                                        </div>
                                        <div className="col-sm-9 text-secondary">
                                        {/* {auth?.user?.registeredDate} */}
                                        {moment(user.registeredDate).format('MMMM Do, YYYY')}
                                        </div>
                                    </div>
                                    <hr />
                                    <div className="row">
                                        {/* <div className="col-sm-12">
                                        <Link className="btn btn-primary rounded-0" target="__blank" to={`/Account/Applicant/Update/${user.userId}`}>Update</Link>
                                        </div> */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row g-3 justify-content-between">
                        <div className="col-auto col-md-12 mt-5">
                            <div className="appcontent">
                                <h1 className="app-page-title mb-10"><i class="fas fa-graduation-cap stroke-transparent me-2"></i>Education History</h1>
                                <ul>
                                    <li>
                                        {applicantEducations.length > 0 ? (
                                            applicantEducations.map((q) => {
                                                return (
                                                    <li key={q._id}>
                                                        <p className="tags">         
                                                            {q.qualification?.qualificationName} | {" "} {q.institution} | {q.country?.country_name}<br />
                                                            <span>
                                                            {q.fieldOfStudy} | {" "} 
                                                                <span>
                                                                    {moment(q.startYear).format("MMMM Do, YYYY")}
                                                                    {" - "}
                                                                    {q.finishYear === null && q.current !== null ? (
                                                                        q.current = "Present"
                                                                    ) : q.finishYear === null && q.current === null ? (
                                                                        "No date available"
                                                                    ) : (
                                                                        moment(q.finishYear).format("MMMM Do, YYYY")
                                                                    )}
                                                                </span>
                                                            </span>
                                                            <div className="d-flex justify-content-end actionicons">
                                                                <Link className="d-block me-3" to={`/Applicant/Academic-Qualification/Update/${q._id}`}>
                                                                    <i className="fas fa-pencil stroke-transparent-blue"></i>
                                                                </Link>
                                                                <Link className="d-block" to={`/Applicant/Delete-Education/${q._id}`}>
                                                                    <i className="fas fa-trash text-danger"></i>
                                                                </Link>
                                                            </div>
                                                        </p>
                                                    </li>
                                                )
                                            })
                                        ) : (<li>No Education History Updated Yet.</li>)}
                                    </li>
                                </ul>
                                <Button onClick={handleShowEQF} className="rounded-0"><i className="fas fa-plus"></i> Add new</Button>
                            </div>
                            <div className="appcontent">
                                <h1 className="app-page-title mb-10"><i class="fas fa-briefcase stroke-transparent me-2"></i>Work Experience</h1>
                                <ul>
                                    <li>
                                    {applicantExperiences.length > 0 ? (
                                            applicantExperiences.map((e) => {
                                                return (
                                                    <li key={e._id}>
                                                        <p className="tags">
                                                            {e.designation}<br />
                                                            <span>{e.company}{" "}, {e.country?.country_name} | {" "}
                                                                <span>
                                                                {moment(e.startYear).format("MMMM Do, YYYY")}
                                                                    {" - "}
                                                                    {e.finishYear === null && e.current !== null ? (
                                                                        e.current = "Present"
                                                                    ) : e.finishYear === null && e.current === null ? (
                                                                        "No date available"
                                                                    ) : (
                                                                        moment(e.finishYear).format("MMMM Do, YYYY")
                                                                    )}
                                                                </span>
                                                            </span>
                                                            <div className="d-flex justify-content-end actionicons">
                                                                <Link className="d-block me-3" to={`/Applicant/Applicant-Experience/Update/${e._id}`}>
                                                                    <i className="fas fa-pencil stroke-transparent-blue"></i>
                                                                </Link>
                                                                <Link className="d-block" to={`/Applicant/Delete-Applicant-Experience/${e._id}`}>
                                                                    <i className="fas fa-trash text-danger"></i>
                                                                </Link>
                                                            </div>
                                                        </p>
                                                    </li>
                                                )
                                            })
                                        ) : (<li>No Job Experience Updated Yet.</li>)}
                                    </li>
                                </ul>
                                <Button onClick={handleShowJEF} className="rounded-0 me-2">
                                    <i className="fas fa-plus"></i> Add New
                                </Button>
                            </div>
                            <div className="appcontent">
                                <h1 className="app-page-title mb-10"><i class="fas fa-microscope stroke-transparent me-2"></i>Skills</h1>
                                <ul className="skilllist">
                                    {skills.length > 0 ? (
                                        skills.map((s) => {
                                            return (
                                            <li key={s._id}>
                                                <p className="tags">
                                                {s?.name}<br />
                                                <span></span>
                                                <div className="d-flex justify-content-end actionicons">
                                                    <Link className="d-block me-3" to={`/Applicant/Skill/Update/${s._id}`}>
                                                    <i className="fas fa-pencil stroke-transparent-blue"></i>
                                                    </Link>
                                                    <Link className="d-block" to={`/Applicant/Delete-Skill/${s._id}`}>
                                                    <i className="fas fa-trash text-danger"></i>
                                                    </Link>
                                                </div>
                                                </p>
                                            </li>
                                            );
                                        })
                                        ) : (
                                        <li>No Applicant Skill Updated Yet.</li>
                                        )}
                                </ul>
                                <Button onClick={handleShowSkillsForm} className="rounded-0 me-2">
                                    <i className="fas fa-plus"></i> Add New
                                </Button>
                            </div>
                            <div className="appcontent">
                                <h1 className="app-page-title mb-10"><i class="fas fa-briefcase stroke-transparent me-2"></i>Resumes</h1>
                                <ul>
                                    <li>
                                        <p className="tags">
                                            <div className="plans">
                                                {resumes.length > 0 ? (
                                                    resumes.map((r) => {
                                                        return (
                                                            <>
                                                            <label key={r._id} className="plan basic-plan mb-3" htmlFor="resume">
                                                                <div className="plan-content">
                                                                    <div className="plan-details me-5">
                                                                        <p>
                                                                            <Link to={r.resume} download={r.resume}>
                                                                            <i className="fas fa-file fa-3x me-4"></i>
        
                                                                            </Link> 
                                                                            <b style={{fontSize: "20px"}}>
                                                                                Uploaded On:</b> {moment(r.uploadedOn).format("MMMM DD, YYYY")}
                                                                        </p>
                                                                    </div>
                                                                    <Link className="ms-5 d-block" to={`/Applicant/Delete-Resume/${r._id}`}>
                                                                    <i className="fas fa-trash text-danger"></i>
                                                                </Link>
                                                                </div>
                                                            </label>
                                                            </>
                                                        )
                                                    })
                                                ) : (<><span>No Resume Uploaded Yet!!!.</span></>)}
                                            </div>
                                        </p>                                        
                                    </li>
                                </ul>
                                <Link to={`/Resume-Upload/${auth?.user?.userId}`} className="rounded-0 me-2" onClick={() => { window.location.href = `/Resume-Upload/${auth?.user?.userId}` }}>
                                    <i className="fas fa-plus"></i> Add New
                                </Link>
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

            {/* Applicant Skill Form Starts ======================================= */}
            <Modal show={showSkillsForm} onHide={handleCloseSkillsForm} className="modal-lg">
                <Modal.Header closeButton>
                    <div className="position-relative mb-3">
                        <div className="row g-3 justify-content-between">
                            <div className="col-auto">
                                <h1 className="app-page-title mb-0">Update Skills</h1>
                            </div>
                        </div>
                    </div>
                </Modal.Header>
                    <Modal.Body className="EQF">
                        <div className="app-card app-card-notification shadow-sm mb-4">
                            <div className="app-card-body p-4">
                                <div className="notification-content">
                                    <form onSubmit={handleUpdateSkills}>
                                        <div className="col-md-9 mx-auto">
                                            <div className="md-form mb-4">
                                                <label for="SkillName" className="mb-3">Skill Title:</label>                                                
                                                <input type="text" id="newSkill" name="newSkill" className="form-control rounded-0" value={newSkill} onChange={(e) => setNewSkill(e.target.value)}  />
                                                <small><span>Enter Skills Separated By Comma:</span></small>                                                    
                                            </div>
                                        </div>
                                        <div className="text-center mt-5">
                                            <button type="submit" className="btn btn-primary rounded-0">
                                            <i className="fas fa-plus"></i> Update Skills
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-danger" className="rounded-0" onClick={handleCloseSkillsForm}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
            {/* Applicant Skill Form Ends ========================================= */}

            {/* Applicant Job Experience Form Starts ======================================= */}
            <Modal show={showJEF} onHide={handleCloseJEF} className="modal-lg">
                <Modal.Header closeButton>
                    <div className="position-relative mb-3">
                            <div className="row g-3 justify-content-between">
                                <div className="col-auto">
                                    <h1 className="app-page-title mb-0">Add Job Experience</h1>
                                </div>
                            </div>
                        </div>
                </Modal.Header>
                <Modal.Body className="JEF">
                    <div className="app-card-body p-4">
                        <div className="notification-content">
                            <div className="position-relative mb-5">
                                <div className="row g-3 justify-content-center">
                                    <div className="col-auto">
                                        <h1 className="app-page-title mb-0">Add Job Experiences</h1>
                                    </div>
                                </div>
                            </div>
                                <form onSubmit={handleJExperienceSubmit}>
                                    <div className="col-md-9 mx-auto">
                                        <div className="md-form mb-4">
                                            <label htmlFor="designation" className="mb-3">Designation: </label>
                                            <div className="form-wrapper">
                                                <input 
                                                    type="text" 
                                                    id="designation" 
                                                    className="form-control rounded-0" 
                                                    name="designation"
                                                    value={designation}
                                                    onChange={(e) => setDesignation(e.target.value)}
                                                />  
                                            </div>                                                  
                                        </div>
                                        <div className="md-form mb-4">
                                            <label htmlFor="company" className="mb-3">Company Name:</label>
                                            <input 
                                                type="text" 
                                                id="company" 
                                                className="form-control rounded-0" 
                                                name="company"
                                                value={company}
                                                onChange={(e) => setCompany(e.target.value)}
                                            />                                                    
                                        </div>
                                        <div className="md-form mb-4">
                                            <label htmlFor="responsibilities" className="mb-3">Responsibilities:</label>
                                            <Editor
                                                apiKey='bjtql0shvx4aby67sj2ph0k92px24y0o8v9pykxkt8d2vyb7'
                                                onInit={(evt, editor) => (editorRef.current = editor)}
                                                initialValue=""
                                                init={{
                                                    height: 500,
                                                    menubar: true,
                                                    plugins:
                                                    "searchreplace, autolink, directionality, visualblocks, visualchars, image, link, media, codesample, table, charmap, pagebreak, nonbreaking, anchor, insertdatetime, advlist, lists, wordcount, help, charmap, emoticons, autosave",
                                                    toolbar:
                                                    "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat",
                                                    font_formats:
                                                    "Andale Mono=andale mono,times; Arial=arial,helvetica,sans-serif; Arial Black=arial black,avant garde; Book Antiqua=book antiqua,palatino; Comic Sans MS=comic sans ms,sans-serif; Courier New=courier new,courier; Georgia=georgia,palatino; Helvetica=helvetica; Impact=impact,chicago; Oswald=oswald; Symbol=symbol; Tahoma=tahoma,arial,helvetica,sans-serif; Terminal=terminal,monaco; Times New Roman=times new roman,times; Trebuchet MS=trebuchet ms,geneva; Verdana=verdana,geneva; Webdings=webdings; Titillium Web=titillium; Wingdings=wingdings,zapf dingbats",
                                                    content_style:
                                                    "@import url('https://fonts.googleapis.com/css2?family=Titillium+Web:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600&family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap'); body { font-family: Titillium Web, sans-serif; }",
                                                    height: 500,
                                                }}
                                                id="responsibilities"
                                                name="responsibilities"
                                                onChange={(e) =>
                                                    setResponsibilities(e.target.getContent())
                                                }
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
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-danger" className="rounded-0" onClick={handleCloseJEF}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
            {/* Applicant Job Experience Form Ends ========================================= */}
            <Footer />
        </div>
        </>
    );
};

export default ApplicantProfile;
