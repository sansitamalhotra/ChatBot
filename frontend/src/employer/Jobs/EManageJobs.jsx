import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import API from "../../helpers/API";
import { sanitize } from "dompurify";
import { useAuth } from "../../Context/AuthContext";

import { EditOutlined, DeleteOutlined, DownloadOutlined  } from '@ant-design/icons';
import { Form, Input, Button, Modal } from "antd";

import EHeaderSidebar from "../components/EHeaderSidebar";
import Footer from "../components/Footer";

import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";


const ManageJobs = () => {

    const [auth, setAuth] = useAuth();

    const [jobs, setJobs] = useState([]);
    const [totalJobsFound, setTotalJobsFound] = useState(0);
    const [totalJobsFromDatabase, setTotalJobsFromDatabase] = useState(0);

    const navigate = useNavigate();

    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });
        
    useEffect(() => {
        fetchAlJobs();
    }, []);
        
    const fetchAlJobs = async () => {

        try
        {
            const response = await API.get("/api/v1/job/fetchAllJobs");
            setJobs(response.data.results);
            setTotalJobsFromDatabase(response.data.totalJobsFromDatabase);
        }
        catch (error)
        {
            console.error(error);
            notifyErr("Opps!!, Something Went Wrong, Jobs could not be Retrieved at this Moment. Refresh the Page in A While...");
        }

    };

    const downloadFile = async (id) => {

        try
        {            
            const result = await API.get(`/api/v1/job/download/${id}`, {
                responseType: 'blob'
              });
            const blob = new Blob([result.data], { type: result.data.type });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = jobs.filePath;
            link.click();
        }
        catch (error)
        {
            console.log(error);
            if (error.response && error.response.status === 400) {
                notifyErr('Error while downloading file. Try again later');
            }
        }
    };

    return (

        <>
            <EHeaderSidebar />
            <ChangePageTitle customPageTitle=" Admin Manage Jobs| Prosoft Synergies " />             
            <div className="app-wrapper">
                <div className="app-content pt-3 p-md-3 p-lg-4">
                    <div className="container-xl">
                        <div className="position-relative mb-3">
                            <div className="row g-3 justify-content-between">
                                <div className="col-auto">
                                    <h1 className="app-page-title mb-0">Manage Jobs</h1>
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
                                                    <th className="cell">Job Slug</th>
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
                                                                    <td className="cell">{j.slug}</td>
                                                                    <td className="cell">
                                                                        <button onClick={() => downloadFile(j.id)}>
                                                                            <DownloadOutlined />
                                                                        </button>
                                                                    </td>
                                                                    <td className="cell">
                                                                        <button className="btn-sm app-btn-secondary rounded-0 me-3">
                                                                            <EditOutlined />
                                                                        </button>
                                                                        <Button                                
                                                                            className="btn-sm app-btn-secondary rounded-0"
                                                                            type="danger"
                                                                            icon={<DeleteOutlined />}
                                                                            >        
                                                                        </Button>
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={3} style={{ fontWeight: '300' }}>
                                                                No Jobs Posted Yet...
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
                                    <li className="page-item disabled">
                                        <a className="page-link" href="#" tabindex="-1" aria-disabled="true">Previous</a>
                                    </li>
                                    <li className="page-item active"><a className="page-link" href="#">1</a></li>
                                    <li className="page-item"><a className="page-link" href="#">2</a></li>
                                    <li className="page-item"><a className="page-link" href="#">3</a></li>
                                    <li className="page-item">
                                        <a className="page-link" href="#">Next</a>
                                    </li>
                                    </ul>
                                </nav>
                            </div>
                            <div className="tab-pane fade" id="add-new-country" role="tabpanel" aria-labelledby="add-new-country-tab">
                                <div className="app-card app-card-countries-table mb-5">
                                    <div className="app-card-body mt-5">
                                        <div className="row mt-5">
                                            {/* <div className="col-md-6 mx-auto mt-5">
                                                <AddCountryForm handleSubmit={handleSubmit}
                                                    value={countryName}
                                                    setValue={setCountryName} 
                                                /> 
                                            </div> */}
                                        </div>
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

export default ManageJobs;