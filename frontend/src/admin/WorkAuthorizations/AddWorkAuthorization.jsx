import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import API from '../../helpers/API';
import AddWorkAuthorizationForm from "../components/Forms/AddWorkAuthorizationForm"
import { EditOutlined, DeleteOutlined  } from '@ant-design/icons';
import { Form, Input, Button, Modal } from "antd";

import HeaderSidebar from "../components/HeadeSidebar";
import Footer from "../components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";


const AddWorkAuthorization = () => {

    

    const navigate = useNavigate();
    const [workAuthorization, setWorkAuthorization] = useState("");
    const [workAuthorizations, setWorkAuthorizations] = useState([]);
    const [workAuthorizationName, setWorkAuthorizationName] = useState("");
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

            const { data } = await API.post("/api/v1/workAuthorization/addWorkAuthorization",{ workAuthorizationName });

              if (data.success) {
                notifySucc(`New Work Authorization: ${workAuthorizationName} has been Added Successfully!!`);
                setWorkAuthorization("");
                navigate("/Admin/WorkAuthorizations/Manage-Work-Authorizations");
                fetchWorkAuthorizations();                
              } else {
                notifyErr(data.message);
              }
            } catch (error) {
              console.log(error);
              notifyErr("Opps!!! FAILED.. Something went wrong, New Work Authorization Type Failed to be added.");
            }
        };

    useEffect(() => {
        fetchWorkAuthorizations();
    }, []);

    const fetchWorkAuthorizations = async () => {
            try
            {
                const { data } = await API.get("/api/v1/workAuthorization/fetchWorkAuthorizations");
                if (data?.success) {
                    setWorkAuthorizations(data?.workAuthorization);
                }
            }
            catch (error)
            {
                console.log(error);
                notifyErr("Oppss!!, FAILED, Something went Wrong Retrieving all Work Authorizations");
            }
    };

    const handleUpdate = async (e) => {

        e.preventDefault();
        try
        {
            const { data } = await API.put(`/api/v1/workAuthorization/updateWorkAuthorization/${selected._id}`, { workAuthorizationName: updatedName });
            if (data.success) {
                notifySucc(`${updatedName} has been Updated Successfully!!`);
                setSelected(null);
                setWorkAuthorizationName("");
                setVisible(false);
                fetchWorkAuthorizations();
            } else {
                notifyErr(data.message);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Updating This Work Authorization Type");
        }
    };

    // Delete Work Authorization Type By ID
    const handleDelete = async (cId) => {
        try
        {
            const { data } = await API.delete(`/api/v1/workAuthorization/deleteWorkAuthorizationById/${cId}`, { workAuthorizationName: updatedName });
            if (data.success) {
                notifySucc("Work Authorization Type has been Deleted Successfully!!");
                navigate(0);
                fetchWorkAuthorizations();
            } else {
                notifyErr(data.message);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Deleting This Work Authorization Type");
        }
    }



    return (
        <>  
            <HeaderSidebar />
            <ChangePageTitle customPageTitle=" Admin Add New Work Authorization Type | Prosoft Synergies " /> 
            <div className="app-wrapper">
                <div className="app-content pt-3 p-md-3 p-lg-4">
                    <div className="container-xl">
                        <div className="position-relative mb-3">
                            <div className="row g-3 justify-content-between">
                                <div className="col-auto">
                                    <h1 className="app-page-title mb-0">Add New Work Authorization Type</h1>
                                </div>
                            </div>
                        </div>
                        <div className="app-card app-card-notification shadow-sm mb-4">
                            <div className="app-card-body p-4">
                                <div className="notification-content">
                                    <AddWorkAuthorizationForm handleSubmit={handleSubmit}
                                        value={workAuthorizationName}
                                        setValue={setWorkAuthorizationName} 
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
                        <AddWorkAuthorizationForm value={updatedName} setValue={setWorkAuthorizationName} handleSubmit={handleUpdate} />
                    </Modal>
                </div>
                <Footer />
            </div>
        </>
    );

};


export default AddWorkAuthorization;