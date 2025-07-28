import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { useRef, useEffect, useState } from "react";
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

const UpdateJob = () => {

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
        const selectedCountry = e.target.value;
        setJobData((prevData) => ({ ...prevData, country: selectedCountry, province: "", city: "" }));

        if (selectedCountry) {
        // Fetch provinces by countryId
        API.get(`/api/v1/job/provinces/${selectedCountry}`).then((response) => {
            setProvinces(response.data);
        });
        } else {
            setProvinces([]);
            setCities([]);
        }
    };

    const handleProvinceChange = (e) => {

        const selectedProvince = e.target.value;
        setJobData((prevData) => ({ ...prevData, province: selectedProvince, city: "" }));

        if (selectedProvince) {
          // Fetch cities by provinceId
          API.get(`/api/v1/job/cities/${selectedProvince}`).then((response) => {
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

    
    

    const handleUpdateJobSubmit = async (e) => {
        e.preventDefault();
        try
        {          
            const { data } = await API.put(`/api/v1/job/updateJob/${params.slug}`, jobData);
            notify(data.message, !data.success);
            if (data.success) navigate("/Admin/Jobs/Manage-Jobs");
        
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Opps!!! FAILED.. Something went wrong, Job UPDATE Failed.", true);
        }
    };

    return (
        <>
            <HeaderSidebar />
            <ChangePageTitle customPageTitle={jobData.title} />             

            <div className="app-wrapper">
                <div className="app-content pt-3 p-md-3 p-lg-4">
                    <div className="container-xl">
                        <div className="position-relative mb-3">
                            <div className="row g-3 justify-content-between">
                                <div className="col-auto">
                                    <h1 className="app-page-title p-4">
                                        Update This Job: <span className="ms-3 text-uppercase fs-2 text-decoration-underline text-info">{jobData.title}</span>
                                    </h1>
                                </div>
                            </div>
                        </div>
                        <div className="app-card app-card-notification shadow-sm mb-4">
                            <div className="app-card-body p-4">
                                <div className="notification-content">
                                    <form onSubmit={handleUpdateJobSubmit}>                                               
                                        <div className="col-md-9 mx-auto">
                                            <div className="md-form mb-4">
                                                <label for="title" className="mb-3">Job Title</label>
                                                <input 
                                                    type="text" 
                                                    id="title" 
                                                    className="form-control rounded-0" 
                                                    name="title"
                                                    value={jobData.title}
                                                    onChange={(e) => setJobData(prev => ({ ...prev, title: e.target.value }))}
                                                    />                                                    
                                            </div> 
                                            <div className="text-editor md-form mb-4">
                                                <label for="title" className="mb-3">Job Description</label>
                                                <Editor
                                                    onInit={(evt, editor) => (editorRef.current = editor)}
                                                    initialValue={jobData.description}
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
                                                    scriptLoading={true}
                                                    id="description"
                                                    name="description"
                                                    textareaName="description" 
                                                    onChange={(e) => setJobData({ ...jobData, description: e.target.getContent() })}
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
                                                                value={jobData.qualification}
                                                                // onChange={(e) => setQualification(e.target.value)}
                                                                onChange={(e) => setJobData({ ...jobData, qualification: e.target.value })}
                                                            >
                                                                <option>{jobData?.qualification?.qualificationName}</option>
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
                                                                value={jobData.workExperience}
                                                                onChange={(e) => setJobData({ ...jobData, workExperience: e.target.value })}
                                                            >
                                                                <option>{jobData?.workExperience?.workExperienceName}</option>
                                                                {workExperiences.map((we) => (
                                                                    <option key={we._id} value={we._id}>
                                                                        {we.workExperienceName}
                                                                    </option>
                                                                ))}
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
                                                                value={jobData.sector}
                                                                onChange={(e) => setJobData({ ...jobData, sector: e.target.value })}
                                                            >
                                                                <option>{jobData?.sector?.sectorName}</option>
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
                                                                value={jobData.workMode}
                                                                // onChange={(e) => setWorkMode(e.target.value)}
                                                                onChange={(e) => setJobData({ ...jobData, workMode: e.target.value })}
                                                            >
                                                                <option>{job?.workMode?.workModeName}</option>
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
                                                                value={jobData.country}
                                                                onChange={handleCountryChange}
                                                            >
                                                                <option>{jobData?.country?.countryName}</option>
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
                                                                value={jobData.province}
                                                                onChange={handleProvinceChange}
                                                            >
                                                                <option>{jobData?.province?.provinceName}</option>
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
                                             
                                            <div class="md-form mb-4">
                                            Deadline Date: {moment(jobData.deadlineDate).format("ll")}                               
                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                <DemoContainer components={['DateTimePicker', 'DateTimePicker']}>                                                    
                                                    <DateTimePicker
                                                    label="Deadline Date"
                                                    value={deadlineDate ? dayjs(deadlineDate) : null}
                                                    onChange={(value) => setJobData({ ...jobData, deadlineDate: value })}
                                                    />
                                                </DemoContainer>
                                                </LocalizationProvider>
                                            </div>
                                            <div className="text-xs-left">
                                                <button type="submit" className="btn btn-primary rounded-0">
                                                    Save Changes
                                                </button>
                                                <Link to="/Admin/Jobs/Manage-Jobs" className="ms-3 btn btn-warning rounded-0" onClick={() => { window.location.href = "/Admin/Jobs/Manage-Jobs" }}>
                                                    Cancel
                                                </Link>
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


export default UpdateJob;