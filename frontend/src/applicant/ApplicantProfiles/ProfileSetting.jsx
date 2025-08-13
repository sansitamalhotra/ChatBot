import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link, useNavigate, useParams } from "react-router-dom";
import API from "../../helpers/API";

import { useAuth } from "../../Context/AuthContext";
import HeaderSidebar from "../components/HeadeSidebar";
import Footer from "../components/Footer";
import moment from 'moment';

import "./ApplicantProfile.css";

import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import {
    LockOutlined,
    MailOutlined,
    PhoneOutlined,
    UserOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
    UploadOutlined,
} from "@ant-design/icons";

const ProfileSetting = () => {
    const [auth, setAuth] = useAuth();
    const params = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState({});
    const [applicant, setApplicant] = useState({});
    const [github, setGithub] = useState('');
    const [linkedin, setLinkedin] = useState('');
    const [gender, setGender] = useState('');
    const [skills, setSkills] = useState([]);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [academicQualifications, setAcademicQualifications] = useState([]);
    const [experiences, setExperiences] = useState([]);
       

    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});


    useEffect(() => {
        API.get('/applicant/profile').then(response => {
            setApplicant(response.data);
            setGithub(response.data.github);
            setLinkedin(response.data.linkedin);
            setGender(response.data.gender);
            setSkills(response.data.skills);
            setProfilePhoto(response.data.profilePhoto);
            setAcademicQualifications(response.data.academicQualifications);
            setExperiences(response.data.experiences);
        })
        .catch(error => {
            console.log(error);
        });
    }, []);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        const formData = new FormData()
        formData.append('github', github);
        formData.append('linkedin', linkedin);
        formData.append('gender', gender);
        formData.append('skills', skills);
        if (profilePhoto) {
            formData.append('profilePhoto', profilePhoto);
        }
        formData.append('academicQualifications', academicQualifications);
        formData.append('experiences', experiences);
        try
        {
            const response = await API.put('/api/v1/applicant/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setApplicant(response.data);            
        }
        catch (error)
        {
            console.log(error);
        }
    };

    const handleAcademicInputChange = (event, index, field) => {
        const updatedQualifications = [...academicQualifications];
        updatedQualifications[index] = {
          ...updatedQualifications[index],
          [field]: event.target.value,
        };
        setAcademicQualifications(updatedQualifications);
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
                    <div className="app-card app-card-notification shadow-sm mb-4">
                        <div className="app-card-body p-4">
                            <div className="notification-content">
                                <form encType="multipartmultipart/form-data" onSubmit={handleUpdateProfile}>
                                    <div className="col-md-6 mx-auto">
                                        <div className="md-form mb-4">
                                            <label for="github" className="mb-3">GitHub:</label>
                                            <input 
                                                type="text" 
                                                id="github" 
                                                className="form-control rounded-0" 
                                                name="github"
                                                value={github} onChange={(event) => setGithub(event.target.value)}
                                            />                                                    
                                        </div> 
                                        <div className="md-form mb-4">
                                            <label for="linkedin" className="mb-3">LinkedIn:</label>
                                            <input 
                                                type="text" 
                                                id="linkedin" 
                                                className="form-control rounded-0" 
                                                name="linkedin"
                                                value={linkedin} onChange={(event) => setLinkedin(event.target.value)}
                                            />                                                    
                                        </div>
                                        <div className="md-form mb-4">
                                            <label>Gender:</label>
                                            <select 
                                            className="form-control qualifications rounded-0"
                                            value={gender} 
                                            onChange={(event) => setGender(event.target.value)}>
                                            <option value="">Select</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Nonbinary">Nonbinary</option>
                                            <option value="Decline to State">Decline to State</option>
                                            <option value="other">Other</option>
                                            </select>                                                   
                                        </div>
                                        <div className="md-form mb-4">
                                            <label for="skills" className="mb-3">Skills:</label>
                                            <input 
                                                type="text" 
                                                id="skills" 
                                                className="form-control rounded-0" 
                                                name="skills"
                                                value={skills} onChange={(event) => setSkills(event.target.value)}
                                            />
                                            <small><span>Enter Skills Separated By Comma:</span></small>                                                    
                                        </div> 
                                        <div className="md-form mb-4">
                                            <UploadOutlined
                                                style={{ marginRight: "5px", marginTop: "50PX;" }}
                                            />
                                            <label for="profilePhoto"> Profile Photo:</label>
                                            <input type="file" className="form-control rounded-0" accept=".pdf,.jpeg,.jpg,.png,.svg .gif" onChange={(event) => setProfilePhoto(event.target.files[0])} />
                                            <span>
                                                <small>
                                                (Accepted File Types: jpeg, jpg, png, gif & svg only)
                                                </small>
                                            </span>
                                        </div>
                                        <div className="md-form mb-4">
                                            <label for="academicQualifications"> Academic Qualifications:</label>   
                                        </div>
                                    </div>
                                </form>
                            </div>  
                        </div>                    
                    </div>
                </div>
            </div>
        </div>
        <Footer />
        </>
    );
};

export default ProfileSetting;