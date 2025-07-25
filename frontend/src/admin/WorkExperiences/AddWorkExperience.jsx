import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import API from '../../helpers/API';
import AddWorkExperienceForm from "../components/Forms/AddWorkExperienceForm";
import { EditOutlined, DeleteOutlined  } from '@ant-design/icons';
import { Form, Input, Button, Modal } from "antd";

import HeaderSidebar from "../components/HeadeSidebar";
import Footer from "../components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";


const AddWorkExperience = () => {

    

    const navigate = useNavigate();
    const [workExperience, setWorkExperience] = useState("");
    const [workExperiences, setWorkExperiences] = useState([]);
    const [workExperienceName, setWorkExperienceName] = useState("");
    const [visible, setVisible] = useState(false);
    const [selected, setSelected] = useState(null);
    const [updatedName, setUpdatedName] = useState("");


    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });  


    const handleSubmit = async (e) => {  
        
        e.preventDefault();
            
        try 
        { 

            const { data } = await API.post("/api/v1/workExperience/addWorkExperience", { workExperienceName });

            if (data.success) {
            notifySucc(`New Work Experience: ${workExperienceName} has been Added Successfully!!`);
            setWorkExperienceName("");
            navigate("/Admin/WorkExperiences/Manage-Work-Experiences");
            fetchWorkExperiences();                
            } else {
            notifyErr(data.message);
            }
        } catch (error) {
            console.log(error);
            notifyErr("Opps!!! FAILED.. Something went wrong, New Work Experience Failed to be added.");
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

    const handleUpdate = async (e) => {

        e.preventDefault();
        try
        {
            const { data } = await API.put(`/api/v1/workExperience/updateWorkExperience/${selected._id}`, { workExperienceName: updatedName });
            if (data.success) {
                notifySucc(`${updatedName} has been Updated Successfully!!`);
                navigate("/Admin/Provinces");
                setSelected(null);
                setUpdatedName("");
                setVisible(false);
                fetchWorkExperiences();
            } else {
                notifyErr(data.message);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Updating This Work Experience");
        }
    };

    const handleDelete = async (cId) => {
        try
        {
            const { data } = await API.delete(`/api/v1/workExperience/deleteWorkExperienceById/${cId}`, { workExperienceName: updatedName });
            if (data.success) {
                notifySucc("Work Experience has been Deleted Successfully!!");
                fetchWorkExperiences();
            } else {
                notifyErr(data.message);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Deleting This Work Experience");
        }
    };



    return (
        <>  
            <HeaderSidebar />
            <ChangePageTitle customPageTitle=" Admin Add Work Experience | Prosoft Synergies " /> 
            <div className="app-wrapper">
                <div className="app-content pt-3 p-md-3 p-lg-4">
                    <div className="container-xl">
                        <div className="position-relative mb-3">
                            <div className="row g-3 justify-content-between">
                                <div className="col-auto">
                                    <h1 className="app-page-title mb-0">Add New Work Experience</h1>
                                </div>
                            </div>
                        </div>
                        <div className="app-card app-card-notification shadow-sm mb-4">
                            <div className="app-card-body p-4">
                                <div className="notification-content">
                                    <AddWorkExperienceForm handleSubmit={handleSubmit}
                                        value={workExperienceName}
                                        setValue={setWorkExperienceName} 
                                    />                                      
                                </div>
                            </div>
                        </div>
                    </div>
                    <Modal
                        onCancel={() => setVisible(false)}
                        footer={null}
                        open={visible}
                    >
                        <AddWorkExperienceForm value={updatedName} setValue={setUpdatedName} handleSubmit={handleUpdate} />
                    </Modal>
                </div>
                <Footer />
            </div>
        </>
    );

};


export default AddWorkExperience;