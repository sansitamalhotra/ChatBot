import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import API from '../../helpers/API';
import AddSalaryForm from "../components/Forms/AddSalaryForm";
import { EditOutlined, DeleteOutlined  } from '@ant-design/icons';
import { Form, Input, Button, Modal } from "antd";

import HeaderSidebar from "../components/HeadeSidebar";
import Footer from "../components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";


const AddSalary = () => {

    

    const navigate = useNavigate();
    const [salary, setSalary] = useState("");
    const [salaries, setSalaries] = useState([]);
    const [salaryName, setSalaryName] = useState("");
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

        const { data } = await API.post("/api/v1/salary/addSalary", { salaryName });

            if (data.success) {
            notifySucc(`New Salary Type Name: ${salaryName} has been Added Successfully!!`);
            setSalaryName("");
            navigate("/Admin/Salaries/Manage-Salaries");
            fetchSalaries();                
            } else {
            notifyErr(data.message);
            }
        } catch (error) {
            console.log(error);
            notifyErr("Opps!!! FAILED.. Something went wrong, New Salary Type Name Failed to be added.");
        }
    };
    useEffect(() => {
        fetchSalaries();
    }, []);

    const fetchSalaries = async () => {
        try
        {
            const { data } = await API.get("/api/v1/salary/fetchSalaries");
            if (data?.success) {
                setSalaries(data?.salary);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Retrieving all Salary Types");
        }
    };

    const handleUpdate = async (e) => {

        e.preventDefault();
        try
        {
            const { data } = await API.put(`/api/v1/salary/updateSalary/${selected._id}`, { salaryName: updatedName });
            if (data.success) {
                notifySucc(`${updatedName} has been Updated Successfully!!`);
                navigate("/Admin/Salaries");
                setSelected(null);
                setUpdatedName("");
                setVisible(false);
                fetchSalaries();
            } else {
                notifyErr(data.message);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Updating This Salary Type Name");
        }
    };

    const handleDelete = async (cId) => {
        try
        {
            const { data } = await API.delete(`/api/v1/salary/deleteSalaryById/${cId}`, { salaryName: updatedName });
            if (data.success) {
                notifySucc("Salary Type has been Deleted Successfully!!");
                fetchSalaries();
            } else {
                notifyErr(data.message);
            }
        }
        catch (error)
        {
            console.log(error);
            notifyErr("Oppss!!, FAILED, Something went Wrong Deleting This Salary Type Name");
        }
    }



    return (
        <>  
            <HeaderSidebar />
            <ChangePageTitle customPageTitle=" Admin Add Salary Type | ProsoftSynergies " /> 
            <div className="app-wrapper">
                <div className="app-content pt-3 p-md-3 p-lg-4">
                    <div className="container-xl">
                        <div className="position-relative mb-3">
                            <div className="row g-3 justify-content-between">
                                <div className="col-auto">
                                    <h1 className="app-page-title mb-0">Add New Salary Type</h1>
                                </div>
                            </div>
                        </div>
                        <div className="app-card app-card-notification shadow-sm mb-4">
                            <div className="app-card-body p-4">
                                <div className="notification-content">
                                    <AddSalaryForm handleSubmit={handleSubmit}
                                        value={salaryName}
                                        setValue={setSalaryName} 
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
                        <AddSalaryForm value={updatedName} setValue={setUpdatedName} handleSubmit={handleUpdate} />
                    </Modal>
                </div>
                <Footer />
            </div>
        </>
    );

};


export default AddSalary;