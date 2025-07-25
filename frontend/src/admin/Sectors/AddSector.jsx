import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import API from '../../helpers/API';
import AddSectorForm from "../components/Forms/AddSectorForm";
import { EditOutlined, DeleteOutlined  } from '@ant-design/icons';
import { Form, Input, Button, Modal } from "antd";

import HeaderSidebar from "../components/HeadeSidebar";
import Footer from "../components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";


const AddSector = () => {

    

    const navigate = useNavigate();
    const [sector, setSector] = useState("");
    const [sectors, setSectors] = useState([]);
    const [sectorName, setSectorName] = useState("");
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

            const { data } = await API.post("/api/v1/sector/addSector",{ sectorName });

              if (data.success) {
                notifySucc(`New Sector: ${sectorName} has been Added Successfully!!`);
                setSectorName("");
                navigate("/Admin/Sectors/Manage-Sectors");
                fetchSectors();                
              } else {
                notifyErr(data.message);
              }
            } catch (error) {
              console.log(error);
              notifyErr("Opps!!! FAILED.. Something went wrong, New Sector Failed to be added.");
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

    const handleUpdate = async (e) => {

        e.preventDefault();
        try
        {
            const { data } = await API.put(`/api/v1/sector/updateSector/${selected._id}`, { sectorName: updatedName });
            if (data.success) {
                notifySucc(`${updatedName} has been Updated Successfully!!`);
                setSelected(null);
                setUpdatedName("");
                setVisible(false);
                fetchSectors();
            } else {
                notifyErr(data.message);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Updating This Sector Name");
        }
    };

    // Delete Sector By ID
    const handleDelete = async (cId) => {
        try
        {
            const { data } = await API.delete(`/api/v1/sector/deleteSectorById/${cId}`, { sectorName: updatedName });
            if (data.success) {
                notifySucc("Sector has been Deleted Successfully!!");
                navigate(0);
                fetchSectors();
            } else {
                notifyErr(data.message);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Deleting This Sector");
        }
    }



    return (
        <>  
            <HeaderSidebar />
            <ChangePageTitle customPageTitle=" Admin Add New Sector | Prosoft Synergies " /> 
            <div className="app-wrapper">
                <div className="app-content pt-3 p-md-3 p-lg-4">
                    <div className="container-xl">
                        <div className="position-relative mb-3">
                            <div className="row g-3 justify-content-between">
                                <div className="col-auto">
                                    <h1 className="app-page-title mb-0">Add New Sector</h1>
                                </div>
                            </div>
                        </div>
                        <div className="app-card app-card-notification shadow-sm mb-4">
                            <div className="app-card-body p-4">
                                <div className="notification-content">
                                    <AddSectorForm handleSubmit={handleSubmit}
                                        value={sectorName}
                                        setValue={setSectorName} 
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
                        <AddSectorForm value={updatedName} setValue={setSectorName} handleSubmit={handleUpdate} />
                    </Modal>
                </div>
                <Footer />
            </div>
        </>
    );

};


export default AddSector;