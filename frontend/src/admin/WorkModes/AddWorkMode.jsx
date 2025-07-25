import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import API from '../../helpers/API';
import AddWorkModeForm from "../components/Forms/AddWorkModeForm";
import { EditOutlined, DeleteOutlined  } from '@ant-design/icons';
import { Form, Input, Button, Modal } from "antd";

import HeaderSidebar from "../components/HeadeSidebar";
import Footer from "../components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";


const AddWorkMode = () => {    

    const navigate = useNavigate();
    const [workMode, setWorkMode] = useState("");
    const [workModes, setWorkModes] = useState([]);
    const [workModeName, setWorkModeName] = useState("");
    const [visible, setVisible] = useState(false);
    const [selected, setSelected] = useState(null);
    const [updatedName, setUpdatedName] = useState("");


    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });  


    const handleSubmit = async (e) => {  
        e.preventDefault();
        try { 

        const { data } = await API.post("/api/v1/workMode/addWorkMode", { workModeName });

            if (data.success) {
            notifySucc(`New Work Mode: ${workModeName} has been Added Successfully!!`);
            setWorkModeName("");
            navigate("/Admin/WorkModes/Manage-Work-Modes");
            fetchWorkModes();                
            } else {
            notifyErr(data.message);
            }
        } catch (error) {
            console.log(error);
            notifyErr("Opps!!! FAILED.. Something went wrong, New Work Mode Failed to be added.");
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
                    setWorkModes(data?.workMode);
                }
            }
            catch (error)
            {
                console.log(error);
                notifyErr("Oppss!!, FAILED, Something went Wrong Retrieving all Work Modes");
            }
    };

    const handleUpdate = async (e) => {

        e.preventDefault();
        try
        {
            const { data } = await API.put(`/api/v1/workMode/updateWorkMode/${selected._id}`, { workModeName: updatedName });
            if (data.success) {
                notifySucc(`${updatedName} has been Updated Successfully!!`);
                navigate("/Admin/WorkModes/Manage-WorkModes");
                setSelected(null);
                setUpdatedName("");
                setVisible(false);
                fetchWorkModes();
            } else {
                notifyErr(data.message);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Updating This Work Mode");
        }
    };

    const handleDelete = async (cId) => {
        try
        {
            const { data } = await API.delete(`/api/v1/workMode/deleteWorkModeById/${cId}`, { workModeName: updatedName });
            if (data.success) {
                notifySucc("Work Mode has been Deleted Successfully!!");
                fetchWorkModes();
            } else {
                notifyErr(data.message);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Deleting This Work Mode");
        }
    }



    return (
        <>  
            <HeaderSidebar />
            <ChangePageTitle customPageTitle=" Admin Add Work Mode | Prosoft Synergies " /> 
            <div className="app-wrapper">
                <div className="app-content pt-3 p-md-3 p-lg-4">
                    <div className="container-xl">
                        <div className="position-relative mb-3">
                            <div className="row g-3 justify-content-between">
                                <div className="col-auto">
                                    <h1 className="app-page-title mb-0">Add New Work Mode</h1>
                                </div>
                            </div>
                        </div>
                        <div className="app-card app-card-notification shadow-sm mb-4">
                            <div className="app-card-body p-4">
                                <div className="notification-content">
                                    <AddWorkModeForm handleSubmit={handleSubmit}
                                        value={workModeName}
                                        setValue={setWorkModeName} 
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
                        <AddWorkModeForm value={updatedName} setValue={setUpdatedName} handleSubmit={handleUpdate} />
                    </Modal>
                </div>
                <Footer />
            </div>
        </>
    );

};


export default AddWorkMode;