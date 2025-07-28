import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import API from "../../helpers/API";
import HeaderSidebar from "../components/HeadeSidebar";
import Footer from "../components/Footer";

import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import { toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

import { Editor } from "@tinymce/tinymce-react";

const PostJob = () => {

    const editorRef = useRef(null);

    const log = () => {
      if (editorRef.current) {
        console.log(editorRef.current.getContent());
      }
    };

    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("")
    //const [filePath, setFilePath] = useState(null);
    //const filePathInputRef = useRef(null);
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
    const [city, setCity] = useState("");

    const [qualification, setQualification] = useState("");
    const [workExperience, setworkExperience] = useState("");
    const [workMode, setWorkMode] = useState("");
    const [sector, setSector] = useState("");

    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" }); 

    
    useEffect(() => {
        // Fetch countries
            API.get('/api/v1/job/fetchCountries').then((res) => {
                setCountries(res.data);
            });
    }, []);

    useEffect(() => {
        // Fetch Cities
            API.get('/api/v1/city/getAllCities').then((res) => {
                setCities(res.data);
            });
    }, []);

    const handleCountryChange = (e) => {

        const countryId = e.target.value;
        setCountry(e.target.value);

        if (countryId) {
        // Fetch provinces by countryId
        API.get(`/api/v1/job/provinces/${countryId}`).then((response) => {
            setProvinces(response.data);
        });
        } else {
            setProvinces([]);
            setCities([]);
        }
    };

    const handleProvinceChange = (e) => {

        const provinceId = e.target.value;
        setProvince(e.target.value);

        if (provinceId) {
          // Fetch cities by provinceId
          API.get(`/api/v1/job/cities/${provinceId}`).then((response) => {
            setCities(response.data);
          });
        } else {
          setCities([]);
        }
    };

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
        fetchWorkExperiences();
    }, []);

    const fetchWorkExperiences = async () => {
        try
        {
            const { data } = await API.get("/api/v1/workExperience/fetchWorkExperiences");
            if (data?.success) {
                setWorkExperiences(data?.workExperiences);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Retrieving all Work Experiences");
        }
    };

    useEffect(() => {
        fetchWorkModes();
    }, []);

    const fetchWorkModes = async () => {
        try
        {
            const { data } = await API.get("/api/v1/workMode/fetchWorkModes");
            if (data?.success) {
                setWorkModes(data?.workModes);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Retrieving all Work Modes");
        }
    };

    useEffect(() => {
        fetchSectors();
    }, []);

    const fetchSectors = async () => {
        try
        {
            const { data } = await API.get("/api/v1/sector/fetchSectors");
            if (data?.success) {
                setSectors(data?.sector);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Retrieving all Sectors");
        }
    };

    const handleAddJobSubmit = async (e) => {
        e.preventDefault();
        try
        {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('qualification', qualification);
            formData.append('workExperience', workExperience);
            formData.append('workMode', workMode);
            formData.append('sector', sector);
            formData.append('country', country);
            formData.append('province', province);
            formData.append("deadlineDate", deadlineDate);
            // formData.append("filePath", filePathInputRef.current.files[0]);
            const response = await API.post('/api/v1/job/postJob', formData);
            notifySucc(response.data);
            navigate("/Admin/Jobs/Manage-Jobs");
        }
        catch (error)
        {
            console.error('Something Went Wrong, Failed to Add New Job', error);
            notifyErr("Opps!!! FAILED.. Something went wrong, New Job Failed to be added.");
        }
    };

    return (
        <>
            <HeaderSidebar />
            <ChangePageTitle customPageTitle=" Admin Post Job | Prosoft Synergies " />             

            <div className="app-wrapper">
                <div className="app-content pt-3 p-md-3 p-lg-4">
                    <div className="container-xl">
                        <div className="position-relative mb-3">
                            <div className="row g-3 justify-content-between">
                                <div className="col-auto">
                                    <h1 className="app-page-title mb-0">Post New Job</h1>
                                </div>
                            </div>
                        </div>
                        <div className="app-card app-card-notification shadow-sm mb-4">
                            <div className="app-card-body p-4">
                                <div className="notification-content">
                                    <form encType="multipartmultipart/form-data" onSubmit={handleAddJobSubmit}>                                               
                                        <div className="col-md-9 mx-auto">
                                            <div className="md-form mb-4">
                                                <label for="title" className="mb-3">Job Title</label>
                                                <input 
                                                    type="text" 
                                                    id="title" 
                                                    className="form-control rounded-0" 
                                                    name="title"
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                    />                                                    
                                            </div> 
                                            <div className="text-editor md-form mb-4">
                                                <label for="title" className="mb-3">Job Description</label>
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
                                                    id="description"
                                                    name="description"
                                                    onChange={(e) =>
                                                        setDescription(e.target.getContent())
                                                    }
                                                />                                                
                                            </div> 
                                            <div className="md-form mb-4">
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <label for="qualificationId" className="mb-3">Job Qualification</label>
                                                        <div className="form-wrapper">
                                                            <select 
                                                                class="form-control qualifications rounded-0" 
                                                                name="qualification"
                                                                value={qualification}
                                                                onChange={(e) => setQualification(e.target.value)}
                                                            >
                                                                <option>Select Qualification</option>
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
                                                    <div className="col-md-6">
                                                        <label for="workExperienceId" className="mb-3">Job Work Experience</label>
                                                        <div className="form-wrapper">
                                                            <select 
                                                                class="form-control workExperiences rounded-0" 
                                                                name="workExperience"
                                                                value={workExperience}
                                                                onChange={(e) => setworkExperience(e.target.value)}
                                                            >
                                                                <option>Select Work Experience</option>
                                                                {workExperiences.map((we) => {
                                                                    return (
                                                                        <option key={we._id} value={we._id}>
                                                                            {we.workExperienceName}
                                                                        </option>
                                                                    );
                                                                })}
                                                            </select>                                            
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="md-form mb-4">
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <label for="sectorId" className="mb-3">Job Sector</label>
                                                        <div className="form-wrapper">
                                                            <select 
                                                                class="form-control sectors rounded-0" 
                                                                name="sector"
                                                                value={sector}
                                                                onChange={(e) => setSector(e.target.value)}
                                                            >
                                                                <option>Select Job Sector</option>
                                                                {sectors.map((s) => {
                                                                    return (
                                                                        <option key={s._id} value={s._id}>
                                                                            {s.sectorName}
                                                                        </option>
                                                                    );
                                                                })}
                                                            </select>                                            
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label for="workModeId" className="mb-3">Work Mode</label>
                                                        <div className="form-wrapper">
                                                            <select 
                                                                class="form-control workModes rounded-0" 
                                                                name="workMode"
                                                                value={workMode}
                                                                onChange={(e) => setWorkMode(e.target.value)}
                                                            >
                                                                <option>Select Work Mode</option>
                                                                {workModes.map((wm) => {
                                                                    return (
                                                                        <option key={wm._id} value={wm._id}>
                                                                            {wm.workModeName}
                                                                        </option>
                                                                    );
                                                                })}
                                                            </select>                                            
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="md-form mb-4">
                                                <div className="row">
                                                    <div className="col-md-6">
                                                    <label for="countryId" className="mb-3">Country</label>
                                                        <div className="form-wrapper">
                                                            <select 
                                                                class="form-control countries rounded-0" 
                                                                name="country"
                                                                onChange={handleCountryChange}
                                                            >
                                                                <option>Select Country</option>
                                                                {countries.map((c) => {
                                                                    return (
                                                                        <option key={c._id} value={c._id}>
                                                                            {c.countryName}
                                                                        </option>
                                                                    );
                                                                })}
                                                            </select>                                            
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label for="provinceId" className="mb-3">Province / State</label>
                                                        <div className="form-wrapper">
                                                            <select 
                                                                class="form-control provinces rounded-0" 
                                                                name="province"
                                                                onChange={handleProvinceChange}
                                                            >
                                                                <option>Select Province / State</option>
                                                                {provinces.map((p) => {
                                                                    return (
                                                                        <option key={p._id} value={p._id}>
                                                                            {p.provinceName}
                                                                        </option>
                                                                    );
                                                                })}
                                                            </select>                                            
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* <div className="md-form mb-4">
                                                <label for="file" className="mb-3">Job File</label> 
                                                {filePath ? filePath.name : "Upload File Attachment"}
                                                <input 
                                                    type="file" 
                                                    id="file"
                                                    name="filePath"
                                                    ref={filePathInputRef}
                                                    className="form-control rounded-0" />   

                                                <div>
                                                    {filePath && (
                                                    <div>
                                                        <file
                                                        src={URL.createObjectURL(filePath)}
                                                        alt="Uploaded File Attachment"
                                                        height={"400px"}
                                                        />
                                                    </div>
                                                    )}
                                                </div>                                            
                                            </div>  */}
                                            <div class="md-form mb-4">
                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                <DemoContainer components={['DateTimePicker', 'DateTimePicker']}>                                                    
                                                    <DateTimePicker
                                                    label="Deadline Date"
                                                    value={deadlineDate}
                                                    onChange={(value) => setDeadlineDate(value)}
                                                    />
                                                </DemoContainer>
                                                </LocalizationProvider>
                                            </div>
                                            <div className="text-xs-left">
                                                <button type="submit" className="btn btn-primary rounded-0">
                                                   <i className="fas fa-plus"></i> Add New Job
                                                </button>
                                            </div>
                                        </div>
                                    </form>                                
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


export default PostJob;
