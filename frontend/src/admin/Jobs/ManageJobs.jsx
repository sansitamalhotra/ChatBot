import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { useRef, useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { Link, useParams, useNavigate } from "react-router-dom";
import download from 'downloadjs';
import API from "../../helpers/API";
import { sanitize } from "dompurify";
import { useAuth } from "../../Context/AuthContext";

import AddJobForm from "../components/Forms/AddJobForm";

import { EditOutlined, DeleteOutlined, DownloadOutlined, EyeOutlined  } from '@ant-design/icons';

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';

import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import HeaderSidebar from "../components/HeadeSidebar";
import Footer from "../components/Footer";

import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

import { Editor } from "@tinymce/tinymce-react";


const ManageJobs = ({ userId }) => {

    const [auth, setAuth] = useAuth();
    const params = useParams();

    const [jobs, setJobs] = useState([]);
    const [job, setJob] = useState({});
    const [visible, setVisible] = useState(false);
    const [selected, setSelected] = useState(null);
    const [updatedName, setUpdatedName] = useState("");

    const [numJobsInDB, setNumJobsInDB] = useState(0);
    const [totalJobs, setTotalJobs] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [jobsPerPage, setJobsPerPage] = useState(5);
    const [loading, setLoading] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [id, setId] = useState("");

    const [sectors, setSectors] = useState([]);
    const [countries, setCountries] = useState([]);
    

    
    const [title, setTitle] = useState("");
    const [filePath, setFilePath] = useState(null);
    const filePathInputRef = useRef(null);

    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const [lgShow, setLgShow] = useState(false);



    const editorRef = useRef(null);

    const log = () => {
      if (editorRef.current) {
        console.log(editorRef.current.getContent());
      }
    };

   


    const navigate = useNavigate();

    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });
        
   useEffect(() => {
        fetchAllJobs();
        window.scrollTo({ top: 0 });
        if (window.history.pushState) {
            window.history.pushState(null, null, `/Admin/Jobs/Manage-Jobs?page=${currentPage}`);
        }
    }, [currentPage, jobsPerPage]);
        
    const fetchAllJobs = async () => {

        try
        {
            setLoading(true);
            const response = await API.get(`/api/v1/job/fetchJobsByRecruiter/${userId}/?page=${currentPage}`);
            setJobs(response.data.result);
            setTotalJobs(response.data.totalJobs);
            setNumJobsInDB(response.data.numJobsInDB);
            localStorage.setItem("refresh", response.data.result);
            setLoading(false);
            setSelectedJob(null);
        }
        catch (error)
        {
            console.log(error);
            setLoading(false);
            notifyErr(error.response.data.message);
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

    const downloadFile = async (slug) => {

        try {
            const res = await API.get(`/api/v1/job/download/${slug}`, { responseType: "blob"  } );
            const blob = new Blob([res.data], { type: res.data.type });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = job.filePath;
            link.click();
            notifySucc('File Downloaded Successfully!!!');
          } 
          catch (error) 
          {
            console.error(error);
            notifyErr('Matrix File Download Failed!!!', error);
          }
    };

    const handleAddJobSubmit = async (e) => {

        e.preventDefault();
        try
        {
            const formData = new FormData();
            formData.append('title', title);
            formData.append("filePath", filePathInputRef.current.files[0]);

            const response = await API.post('/api/v1/job/addJob', formData,  {
                headers: {
                  "Content-Type": "multipart/form-data",
                  "Access-Control-Allow-Origin": "*",
                  "Access-Control-Max-Age": 86400,
                }});
            notifySucc(response.data);
            navigate("/Admin/Dashboard");
        }
        catch (error)
        {
            console.error('Something Went Wrong, Failed to Add New Job', error);
            notifyErr("Opps!!! FAILED.. Something went wrong, New Job Failed to be added.");
        }

    };

   
    const fetchJob = async () => {
        try 
        {
          const { data } = await API.get(`/api/v1/job/job-details/${params.slug}`);
          setJob(data.job);
        } catch (error) {
          console.log(error);
        }
    };
    
      // initial Job Details
    useEffect(() => {
        if (params?.slug) fetchJob();
    }, [params?.slug]);

      // Delete Job
    const handleDeleteJobSubmit = async () => {

        try
        {
            let answer = window.prompt("Are You Sure You Want to DELETE This Job?");

            if (!answer) return;
            await API.delete(`/api/v1/job/deleteJob/${params.id}`);
            notifySucc("Job Has Been Deleted Successfully...");
            navigate("/Admin/Dashboard");
        }
        catch(error)
        {
            console.log(error);
            notifyErr("Opps!!! FAILED.. Something went wrong, Job DELETE Failed.");
        }
    };

    const generatePageNumbers = () => {

        const maxPaginationNumbers = 5;
        const startPage = Math.max(1, currentPage - Math.floor(maxPaginationNumbers / 2));
        const endPage = Math.min(startPage + maxPaginationNumbers - 1, totalPages);
      
        return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
    };

    const totalPages = Math.ceil(totalJobs / jobsPerPage);


    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };
      
    const prevPage = () => {
        if (currentPage  > 1) {
            setCurrentPage(currentPage -  1);
        }
    };
  
    
    const pagination = (pageNumber) => setCurrentPage(pageNumber);
 

    const pageNumbers = generatePageNumbers();



    return (

        <>
            <HeaderSidebar />
            <ChangePageTitle customPageTitle=" Admin Manage Jobs| Prosoft Synergies " />             
            <div className="app-wrapper">
                <div className="app-content pt-3 p-md-3 p-lg-4">
                    <div className="container-xl">
                        <div className="position-relative mb-3">
                            <div className="row g-3 justify-content-between">
                                <div className="col-auto">
                                    <h1 className="app-page-title mb-0">Manage Jobs</h1>
                                    (<strong><span>Page {currentPage} of {" "} {numJobsInDB} Jobs Found</span></strong>)
                                    <p>
                                    (<strong><span>You Have  {numJobsInDB} Active Jobs:  </span></strong>)
                                    </p>
                                </div>
                            </div>
                        </div>
                        <nav id="countries-table-tab" className="countries-table-tab app-nav-tabs nav shadow-sm flex-column flex-sm-row mb-4">
                            <Link className="flex-sm-fill text-sm-center nav-link active" id="countries-all-tab" data-bs-toggle="tab" to="#countries-all" role="tab" aria-controls="countries-all" aria-selected="true">
                                Manage Jobs
                            </Link>
                            <Link className="flex-sm-fill text-sm-center nav-link"  id="add-new-country-tab" data-bs-toggle="tab" to="#add-new-country" role="tab" aria-controls="add-new-country" aria-selected="false">
                                Post New Job
                            </Link>
                        </nav>
                        <div className="tab-content" id="countries-table-tab-content">
                            <div className="tab-pane fade show active" id="countries-all" role="tabpanel" aria-labelledby="countries-all-tab">
                                <div className="app-card app-card-countries-table shadow-sm mb-5">
                                    <div className="app-card-body">
                                        <div className="table-responsive">
                                            <table className="table app-table-hover mb-0 text-left">
                                                <thead>
                                                    <tr>
                                                        
                                                    {/* <th class="cell">Id</th> */}
                                                    <th className="cell">Job Title</th>
                                                    <th className="cell">Job Qualification</th>
                                                    <th className="cell">Job Experience</th>
                                                    <th className="cell">Job Country</th>
                                                    <th className="cell">Work Mode</th>
                                                    <th className="cell">Job File</th>
                                                    <th className="cell">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {jobs.length > 0 ? (
                                                        jobs.map((j) => {
                                                            return (
                                                                <tr key={j._id}>
                                                                    <td className="cell">
                                                                        <span className="truncate">{j.title}</span>
                                                                    </td>
                                                                    <td className="cell">{j?.qualification?.qualificationName}</td>
                                                                    <td className="cell">{j?.workExperience?.workExperienceName}</td>
                                                                    <td className="cell">{j?.country?.countryName}</td>
                                                                    <td className="cell">{j?.workMode?.workModeName}</td>
                                                                    <td className="cell">
                                                                        <button  onClick={() => downloadFile(j?.filePath)} className="btn btn-outline btn-sm rounded-0">
                                                                            <DownloadOutlined />
                                                                        </button>
                                                                    </td>
                                                                    <td className="cell">
                                                                        <button className="btn-sm app-btn-secondary rounded-0 me-3"
                                                                        >
                                                                            <EyeOutlined />
                                                                        </button>
                                                                        {/* <button 
                                                                            className="btn-sm app-btn-secondary rounded-0 me-3"
                                                                            onClick={() => setLgShow(true)}
                                                                        >
                                                                            <EditOutlined />
                                                                        </button> */}
                                                                        <Link 
                                                                            className="btn-sm app-btn-secondary rounded-0 me-3"
                                                                            to={`/Admin/Jobs/Update-Job/${j.slug}`}
                                                                            onClick={() => { window.location.href = `/Admin/Jobs/Update-Job/${j.slug}` }}
                                                                        >
                                                                            <EditOutlined />
                                                                        </Link>

                                                                        <Link                                
                                                                            className="btn-sm app-btn-secondary rounded-0 me-3"
                                                                            to={`/Admin/Jobs/Delete-Job/${j.slug}`}
                                                                            >    
                                                                            <DeleteOutlined />    
                                                                        </Link>
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={3} style={{ fontWeight: '300' }}>
                                                                No Job Found.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                       
                                    </div>
                                </div>
                                <nav className="app-pagination">
                                    <ul className="pagination justify-content-center">
                                        <li className="page-item">
                                            <button className="page-link" onClick={prevPage}
                                            disabled={currentPage === 1}>Previous</button>
                                        </li>
                                        {pageNumbers.map((number) => (
                                            <li key={number} className={currentPage === number ? "page-item active disabled" : ""}>
                                                <Link
                                                onClick={() => pagination(number)}
                                                disabled={currentPage === totalPages}
                                                to="#"
                                                className="page-link"
                                                >
                                                {number}
                                                </Link>
                                            </li>
                                        ))}
                                        <li className="page-item">
                                            <button className="page-link" onClick={nextPage} disabled={currentPage === totalPages}>Next</button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                            <div className="tab-pane fade" id="add-new-country" role="tabpanel" aria-labelledby="add-new-country-tab">
                                <div className="app-card app-card-countries-table mb-5">
                                    <div className="app-card-body mt-5">
                                        <div className="row mt-5">
                                            <div className="col-md-9 mx-auto mt-5">
                                                <form onSubmit={handleAddJobSubmit} encType="multipart/form-data">                                               
                                                    <div className="col-md-8 ma-auto">
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
                                                        <div className="md-form mb-4">
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
                                                        </div> 
                                                        <div className="text-xs-left">
                                                            <button type="submit" className="btn btn-primary rounded-0">Add New Job</button>
                                                        </div>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
            <Modal 
                size="lg"
                show={lgShow}
                onHide={() => setLgShow(false)}
                aria-labelledby="example-modal-sizes-title-lg">
                <Modal.Header closeButton>
                    <Modal.Title>Update This Job: {job.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form>
                        <div className="col-md-9 mx-auto">
                            <div className="md-form mb-4">
                                <label for="title" className="mb-3">Job Title</label>
                                <input 
                                    type="text" 
                                    id="title" 
                                    className="form-control rounded-0" 
                                    name="title"
                                    />                                                    
                            </div> 
                            <div className="text-editor md-form mb-4">
                                <label for="title" className="mb-3">Job Description</label>
                                <Editor
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
                                    // onChange={(e) =>
                                    //     setDescription(e.target.getContent())
                                    // }
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
                                            >
                                                <option>Select Qualification</option>
                                                {/* {qualifications.map((q) => {
                                                    return (
                                                        <option key={q._id} value={q._id}>
                                                            {q.qualificationName}
                                                        </option>
                                                    );
                                                })} */}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <label for="workExperienceId" className="mb-3">Job Work Experience</label>
                                        <div className="form-wrapper">
                                            <select 
                                                class="form-control workExperiences rounded-0" 
                                                name="workExperience"
                                                
                                            >
                                                <option>Select Work Experience</option>
                                                {/* {workExperiences.map((we) => {
                                                    return (
                                                        <option key={we._id} value={we._id}>
                                                            {we.workExperienceName}
                                                        </option>
                                                    );
                                                })} */}
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
                                            >
                                                <option>Select Job Sector</option>
                                                {/* {sectors.map((s) => {
                                                    return (
                                                        <option key={s._id} value={s._id}>
                                                            {s.sectorName}
                                                        </option>
                                                    );
                                                })} */}
                                            </select>                                            
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <label for="workModeId" className="mb-3">Work Mode</label>
                                        <div className="form-wrapper">
                                            <select 
                                                class="form-control workModes rounded-0" 
                                                name="workMode"
                                            >
                                                <option>Select Work Mode</option>
                                                {/* {workModes.map((wm) => {
                                                    return (
                                                        <option key={wm._id} value={wm._id}>
                                                            {wm.workModeName}
                                                        </option>
                                                    );
                                                })} */}
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
                                                // onChange={handleCountryChange}
                                            >
                                                <option>Select Country</option>
                                                {/* {countries.map((c) => {
                                                    return (
                                                        <option key={c._id} value={c._id}>
                                                            {c.countryName}
                                                        </option>
                                                    );
                                                })} */}
                                            </select>                                            
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <label for="provinceId" className="mb-3">Province / State</label>
                                        <div className="form-wrapper">
                                            <select 
                                                class="form-control provinces rounded-0" 
                                                name="province"
                                                // onChange={handleProvinceChange}
                                            >
                                                <option>Select Province / State</option>
                                                {/* {provinces.map((p) => {
                                                    return (
                                                        <option key={p._id} value={p._id}>
                                                            {p.provinceName}
                                                        </option>
                                                    );
                                                })} */}
                                            </select>                                            
                                        </div>
                                    </div>
                                </div>
                            </div>                           
                            <div class="md-form mb-4">
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DemoContainer components={['DateTimePicker', 'DateTimePicker']}>                                                    
                                        <DateTimePicker
                                        label="Deadline Date"
                                        // value={deadlineDate}
                                        // onChange={(value) => setDeadlineDate(value)}
                                        />
                                    </DemoContainer>
                                </LocalizationProvider>
                            </div>
                            <div className="text-xs-left">
                                <button type="submit" className="btn btn-primary rounded-0">Save Changes</button>
                            </div>
                        </div>
                    </form>
                </Modal.Body>
            </Modal>
        </>
    );

};

export default ManageJobs;