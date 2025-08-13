import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";

import { Link, useParams, useNavigate } from "react-router-dom";
import API from "../../helpers/API";
import HeaderSidebar from "../components/HeadeSidebar";
import Footer from "../components/Footer";

import { useAuth } from "../../Context/AuthContext";

import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from "dayjs";

import moment from "moment";

import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

import { Editor } from "@tinymce/tinymce-react";

const DeleteJob = () => {

    const editorRef = useRef(null);

    const log = () => {
      if (editorRef.current) {
        console.log(editorRef.current.getContent());
      }
    };

    const navigate = useNavigate();  
    const [deadlineDate, setDeadlineDate] = useState("");
    const [countries, setCountries] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [qualifications, setQualifications] = useState([]);
    const [workExperiences, setWorkExperiences] = useState([]);
    const [workModes, setWorkModes] = useState([]);
    const [sectors, setSectors] = useState([]);

    const [country, setCountry] = useState("");
    const [province, setProvince] = useState("");

    const [jobData, setJobData] = useState({
        title: "",
        description: "",
        deadlineDate: null,
        qualification: "",
        workExperience: "",
        workMode: "",
        sector: "",
        country: "",
        province: "",
        city: "",
    });
    

    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" }); 


    const notify = (msg,   isError = false) => {
        isError ? toast.error(msg) : toast.success(msg, {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });
    };


    const [auth, setAuth] = useAuth();
    const params = useParams();
    const [job, setJob] = useState({});

    const [id, setId] = useState("");

    // initialize job for update
    useEffect(() => {
        fetchSingleJob();
      }, [params.slug]);

    const fetchSingleJob = async () => {
        try 
        {
          const { data } = await API.get(`/api/v1/job/job/${params.slug}`);
          setJobData(prev => ({ ...prev, ...data.job }));;
          setJob(data.job);
          setCountry(data.country);
          setProvince(data.province);
        } catch (error) {
          console.log(error);
        }
    };

    const handleDeleteJobSubmit = async () => {

        try
        {
            await API.delete(`/api/v1/job/deleteJob/${params.slug}`);
            notifySucc("Job Has Been Deleted Successfully...");
            navigate("/Admin/Jobs/Manage-Jobs");
        }
        catch(error)
        {
            console.log(error);
            notifyErr("Opps!!! FAILED.. Something went wrong, Job DELETE Failed.");
        }
    };

    return (
        <>
            {/* <HeaderSidebar /> */}
            <ChangePageTitle customPageTitle={jobData.title} />  
            <HeaderSidebar /> 
            <div className="app-wrapper">
                <div className="app-content pt-3 p-md-3 p-lg-4">
                    <div className="container-xl">
                       <h1 className="app-page-title p-4">
                            Delete This Job: <span className="ms-3 text-uppercase fs-2 text-decoration-underline text-info">{jobData.title}</span>
                        </h1>
                        <div className="row gy-4">
                            <div className="col-12 col-lg-9 mx-auto">
                                <div className="app-card app-card-account shadow-sm d-flex flex-column align-items-start">
                                    <div className="app-card-body px-4 w-100">
                                        <div className="item border-bottom py-3">
                                            <div className="row justify-content-between align-items-center">
                                                <div className="col-auto">
                                                    <div className="item-label">
                                                        <div className="d-block mb-2">
                                                            Job Title: {" "}
                                                        </div>
                                                        <strong>{jobData.title}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="item border-bottom py-3">
                                            <div className="row justify-content-between align-items-center">
                                                <div className="col-auto">
                                                    <div className="item-label">
                                                        <div className="d-block mb-2">
                                                           Job SEO Slug: {" "}
                                                        </div>
                                                        <strong>
                                                            {jobData.slug}
                                                        </strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="item border-bottom py-3">
                                            <div className="row justify-content-between align-items-center">
                                                <div className="col-auto">
                                                    
                                                    <div className="d-block mb-2">
                                                        Job Description: {" "}
                                                    </div>
                                                    <div className="item-label" dangerouslySetInnerHTML={{ __html: jobData.description }}></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="item border-bottom py-3">
                                            <div className="row justify-content-between align-items-center">
                                                <div className="col-auto">
                                                    <div className="item-label">
                                                        <div className="d-block mb-2">
                                                            Job Qialification: {" "}
                                                        </div>
                                                        <strong>
                                                            {jobData?.qualification?.qualificationName}
                                                        </strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="item border-bottom py-3">
                                            <div className="row justify-content-between align-items-center">
                                                <div className="col-auto">
                                                    <div className="item-label">
                                                        <div className="d-block mb-2">
                                                            Job Experience: {" "}
                                                        </div>
                                                        <strong>{jobData?.workExperience?.workExperienceName}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="item border-bottom py-3">
                                            <div className="row justify-content-between align-items-center">
                                                <div className="col-auto">
                                                    <div className="item-label">
                                                        <div className="d-block mb-2">
                                                            Job Sector: {" "}
                                                        </div>
                                                        <strong>{jobData?.sector?.sectorName}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="item border-bottom py-3">
                                            <div className="row justify-content-between align-items-center">
                                                <div className="col-auto">
                                                    <div className="item-label">
                                                        <div className="d-block mb-2">
                                                            Job Location: {" "}
                                                        </div>
                                                        <strong>{jobData?.country?.countryName}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="item border-bottom py-3">
                                            <div className="row justify-content-between align-items-center">
                                                <div className="col-auto">
                                                    <div className="item-label">
                                                        <div className="d-block mb-2">
                                                             Job Province / State: {" "}
                                                        </div>
                                                        <strong>{jobData?.province?.provinceName}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="item border-bottom py-3">
                                            <div className="row justify-content-between align-items-center">
                                                <div className="col-auto">
                                                    <div className="item-label">
                                                        <div className="d-block mb-2">
                                                             Work Mode: {" "}
                                                        </div>
                                                        <strong>{jobData?.workMode?.workModeName}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="item border-bottom py-3">
                                            <div className="row justify-content-between align-items-center">
                                                <div className="col-auto">
                                                    <div className="item-label">
                                                        <div className="d-block mb-2">
                                                             Job Posted: {" "}
                                                        </div>
                                                        <strong>
                                                        {moment
                                                        .utc(new Date(jobData.jobPostDate))
                                                        .local()
                                                        .startOf("second")
                                                        .fromNow(true)
                                                        }{" "} ago
                                                        </strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="item border-bottom py-3">
                                            <div className="row justify-content-between align-items-center">
                                                <div className="col-auto">
                                                    <div className="item-label">
                                                        <div className="d-block mb-2">
                                                             Deadline Date: {" "}
                                                        </div>
                                                        <strong>
                                                            {moment(jobData.deadlineDate).format("ll")}
                                                        </strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mx-auto mt-5 mb-5">
                                        <button 
                                            type="submit" 
                                            className="btn btn-primary rounded-0"
                                            onClick={handleDeleteJobSubmit}
                                        >
                                            <i className="fas fa-trash"></i> Delete Job
                                        </button>
                                        <Link to="/Admin/Jobs/Manage-Jobs" className="ms-3 btn btn-warning rounded-0" onClick={() => { window.location.href = "/Admin/Jobs/Manage-Jobs" }}>
                                        <i className="fas fa-times"></i> Cancel
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <br />
                <Footer />
            </div>
        </>
    );

};


export default DeleteJob;