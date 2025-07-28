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



const ManageSalaries = () => {

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

    useEffect(() => {
        fetchSalaries();
    }, []);

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

    // Delete Salary Type By ID
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
            <ChangePageTitle customPageTitle=" Admin Manage Salary Types | ProsoftSynergies " /> 
            <div className="app-wrapper">
                <div className="app-content pt-3 p-md-3 p-lg-4">
                    <div className="container-xl">
                        <div className="row g-3 mb-4 align-items-center justify-content-between">
                            <div className="col-auto">
                                <h1 className="app-page-title mb-0">Manage Salary Types</h1>
                            </div>
                        </div>
                        <nav id="salaries-table-tab" className="salaries-table-tab app-nav-tabs nav shadow-sm flex-column flex-sm-row mb-4">
                            <Link className="flex-sm-fill text-sm-center nav-link active" id="salaries-all-tab" data-bs-toggle="tab" to="#salaries-all" role="tab" aria-controls="salaries-all" aria-selected="true">
                                Manage Salary Types
                            </Link>
                            <Link className="flex-sm-fill text-sm-center nav-link"  id="add-new-salary-tab" data-bs-toggle="tab" to="#add-new-salary" role="tab" aria-controls="add-new-salary" aria-selected="false">
                                Add New Salary Type
                            </Link>
                        </nav>
                        <div className="tab-content" id="salaries-table-tab-content">
                            <div className="tab-pane fade show active" id="salaries-all" role="tabpanel" aria-labelledby="salaries-all-tab">
                                <div className="app-card app-card-salaries-table shadow-sm mb-5">
                                    <div className="app-card-body">
                                        <div className="table-responsive">
                                            <table className="table app-table-hover mb-0 text-left">
                                                <thead>
                                                    <tr>
                                                        
                                                    {/* <th class="cell">Id</th> */}
                                                    <th className="cell">Salary Type Name</th>
                                                    <th className="cell">Salary Type Slug</th>
                                                    <th className="cell">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {salaries.map((s) => {
                                                        return (
                                                            <tr key={s._id}>
                                                                
                                                                <td className="cell">
                                                                    <span className="truncate">
                                                                        {s.salaryName}
                                                                    </span>
                                                                </td>
                                                                <td className="cell">{s.slug}</td>
                                                                <td className="cell">
                                                                    <button className="btn-sm app-btn-secondary rounded-0 me-3" onClick={() => {
                                                                                setVisible(true);
                                                                                setUpdatedName(s.salaryName);
                                                                                setSelected(s);
                                                                            }}>
                                                                        <EditOutlined />
                                                                    </button>
                                                                    <Button  
                                                                        onClick={() => handleDelete(s._id)} 
                                                                        className="btn-sm app-btn-secondary rounded-0"
                                                                        type="danger"
                                                                        icon={<DeleteOutlined />}
                                                                        >        
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                       
                                    </div>
                                </div>
                                {/* <nav className="app-pagination">
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
                                </nav> */}
                            </div>
                            <div className="tab-pane fade" id="add-new-salary" role="tabpanel" aria-labelledby="add-new-salary-tab">
                                <div className="app-card app-card-salaries-table mb-5">
                                    <div className="app-card-body mt-5">
                                        <div className="row mt-5">
                                            <div className="col-md-10 mx-auto mt-5">
                                                <AddSalaryForm handleSubmit={handleSubmit}
                                                    value={salaryName}
                                                    setValue={setSalaryName} 
                                                /> 
                                            </div>
                                        </div>
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
                </div>
                <Footer />
            </div>
        </>
    );

};


export default ManageSalaries;