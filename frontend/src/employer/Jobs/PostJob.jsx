import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import API from "../../helpers/API";
import EHeaderSidebar from "../components/EHeaderSidebar";
import Footer from "../components/Footer";

import AppScript from "../scripts/maindashboard";

import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

const PostJob = () => {

    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [filePath, setFilePath] = useState(null);
    const filePathInputRef = useRef(null);

    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" }); 


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

    

    return (
        <>
            <EHeaderSidebar />
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
                <Footer />
            </div>
        </>
    );

};


export default PostJob;