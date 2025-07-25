import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import API from '../../helpers/API';
import AddQualificationForm from "../components/Forms/AddQualificationForm";
import { EditOutlined, DeleteOutlined  } from '@ant-design/icons';
import { Form, Input, Button, Modal } from "antd";

import HeaderSidebar from "../components/HeadeSidebar";
import Footer from "../components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";


const AddQualification = () => {

    

    const navigate = useNavigate();
    const [qualification, setQualification] = useState("");
    const [qualifications, setQualifications] = useState([]);
    const [qualificationName, setQualificationName] = useState("");
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

            const { data } = await API.post("/api/v1/qualification/addQualification", { qualificationName });

              if (data.success) {
                notifySucc(`New Quaification: ${qualificationName} has been Added Successfully!!`);
                setQualificationName("");
                navigate("/Admin/Qualifications/Manage-Qualifications");
                fetchQualifications();                
              } else {
                notifyErr(data.message);
              }
            } catch (error) {
              console.log(error);
              notifyErr("Opps!!! FAILED.. Something went wrong, New Qualification Failed to be added.");
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
                    setQualification(data?.qualification);
                }
            }
            catch (error)
            {
                console.log(error);
                notifyErr("Oppss!!, FAILED, Something went Wrong Retrieving all Qualifications");
            }
    };

    const handleUpdate = async (e) => {

        e.preventDefault();
        try
        {
            const { data } = await API.put(`/api/v1/qualification/updateQualification/${selected._id}`, { qualificationName: updatedName });
            if (data.success) {
                notifySucc(`${updatedName} has been Updated Successfully!!`);
                navigate("/Admin/Qualifications/Manage-Qualifications");
                setSelected(null);
                setUpdatedName("");
                setVisible(false);
                fetchQualifications();
            } else {
                notifyErr(data.message);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Updating This Qualification");
        }
    };

    const handleDelete = async (qId) => {
        try
        {
            const { data } = await API.delete(`/api/v1/qualification/deleteQualificationById/${qId}`, { qualificationName: updatedName });
            if (data.success) {
                notifySucc("Qualification has been Deleted Successfully!!");
                fetchQualifications();
            } else {
                notifyErr(data.message);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Deleting This Qualification");
        }
    }



    return (
        <>  
            <HeaderSidebar />
            <ChangePageTitle customPageTitle=" Admin Add Qualification | Prosoft Synergies " /> 
            <div className="app-wrapper">
                <div className="app-content pt-3 p-md-3 p-lg-4">
                    <div className="container-xl">
                        <div className="position-relative mb-3">
                            <div className="row g-3 justify-content-between">
                                <div className="col-auto">
                                    <h1 className="app-page-title mb-0">Add New Qualification</h1>
                                </div>
                            </div>
                        </div>
                        <div className="app-card app-card-notification shadow-sm mb-4">
                            <div className="app-card-body p-4">
                                <div className="notification-content">
                                    <AddQualificationForm handleSubmit={handleSubmit}
                                        value={qualificationName}
                                        setValue={setQualificationName} 
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
                        <AddQualificationForm value={updatedName} setValue={setUpdatedName} handleSubmit={handleUpdate} />
                    </Modal>
                </div>
                <Footer />
            </div>
        </>
    );

};


export default AddQualification;