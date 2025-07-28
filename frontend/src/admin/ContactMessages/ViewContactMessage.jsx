import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";

import { NavLink, Link, useParams, useNavigate } from "react-router-dom";
import API from "../../helpers/API";
import HeaderSidebar from "../components/HeadeSidebar";
import Footer from "../components/Footer";

import moment from "moment";

import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

import { Editor } from "@tinymce/tinymce-react";


const ViewContactMessage = () => {

    const editorRef = useRef(null);

    const log = () => {
      if (editorRef.current) {
        console.log(editorRef.current.getContent());
      }
    };

    const navigate = useNavigate();
    const params = useParams();

    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" }); 


    const [contact, setContact] = useState({});
    const [first_name, setFirstName] = useState("");
    const [last_name, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");

    const [id, setId] = useState("");

     // initialize Contact Us Message By Id
     useEffect(() => {
        fetchContactMessage();
      }, []);

    const fetchContactMessage = async () => {
        try 
        {
          const { data } = await API.get(`/api/v1/contact/message/${params.id}`);
          setFirstName(data.contact.first_name);
          setContact(data.contact);
          setId(data.contact._id);
          setLastName(contact.last_name);
          setEmail(contact.email);
          setPhone(contact.phone);
          setSubject(contact.subject);
          setMessage(contact.message);
        } catch (error) {
          console.log(error);
        }
    };

    const handleDeleteContactMessageSubmit = async () => {

        try
        {
            await API.delete(`/api/v1/contact/delete/${params.id}`);
            notifySucc("Contact Message Has Been Deleted Successfully...");
            navigate("/Admin/Contact-Messages/Manage-Contact-Us-Messages");
        }
        catch(error)
        {
            console.log(error);
            notifyErr("Opps!!! FAILED.. Something went wrong, Contact Message DELETE Failed.");
        }
    };

    return (
        <>
            <HeaderSidebar />
            <ChangePageTitle customPageTitle={contact.subject} /> 
            <div className="app-wrapper">
                {/* <div className="app-content pt-3 p-md-3 p-lg-4">
                    <div className="container-xl">
                        <div className="position-relative mb-3">
                            <div className="row g-3 justify-content-between">
                                <div className="col-auto">
                                    <h1 className="app-page-title p-4">
                                        <span className="ms-3 text-uppercase fs-2 text-decoration-underline text-info">{contact.subject}</span>
                                    </h1>
                                </div>
                            </div>
                        </div>
                        <div className="app-card app-card-notification shadow-sm mb-4">
                            <div className="app-card-body p-4">
                                <div className="notification-content">
                                    <div className="col-md-10 mx-auto">
                                        <h2>Full Name: <b className="ms-5 text-muted">{contact.first_name} {" "} {contact.last_name}</b></h2>
                                    </div>  
                                    <div className="col-md-10 mx-auto">
                                        <h2>Email: <b className="ms-5 text-muted">{contact.email}</b></h2>
                                    </div>
                                    <div className="col-md-10 mx-auto">
                                        <h2>Phone: <b className="ms-5 text-muted">{contact.phone}</b></h2>
                                    </div> 
                                    <div className="col-md-10 mx-auto">
                                        <h2>Subject: <b className="ms-5 text-muted">{contact.subject}</b></h2>
                                    </div>  
                                    <div className="col-md-10 mx-auto">
                                        <h2>Message: <b className="ms-5 text-muted">{contact.message}</b></h2>
                                    </div> 

                                    <div className="col-md-10 mx-auto">
                                        <div className="text-xs-left">
                                                <button type="submit" className="btn btn-danger rounded-0 text-white">
                                                    Delete
                                                </button>
                                            <Link to="/Admin/Contact-Messages/Manage-Contact-Us-Messages" className="ms-3 btn btn-warning rounded-0 text-white" onClick={() => { window.location.href = "/Admin/Contact-Messages/Manage-Contact-Us-Messages" }}>
                                                Go Back
                                            </Link>
                                        </div>
                                    </div>                    
                                </div>
                            </div>
                        </div>
                    </div>
                </div> */}
                <div className="app-content pt-3 p-md-3 p-lg-4">
                    <div className="container-xl">
                        <h1 className="app-page-title p-4">
                            <span className="ms-3 text-uppercase fs-2 text-decoration-underline text-info">{contact.subject}</span>
                        </h1>
                        <div className="row gy-4">
                            <div className="col-12 col-lg-9 mx-auto">
                                <div className="app-card app-card-account shadow-sm d-flex flex-column align-items-start">
                                    <div className="app-card-body px-4 w-100">
                                        <div className="item border-bottom py-3">
                                            <div className="row justify-content-between align-items-center">
                                                <div className="col-auto">
                                                    <div className="item-label">
                                                        <div className="d-block mb-2">
                                                            Contact Message Subject: {" "}
                                                        </div>
                                                        <strong>{contact.subject}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="item border-bottom py-3">
                                            <div className="row justify-content-between align-items-center">
                                                <div className="col-auto">
                                                    <div className="item-label">
                                                        <div className="d-block mb-2">
                                                           Full Name: {" "}
                                                        </div>
                                                        <strong>
                                                            {contact.first_name}{" "} {contact.last_name}
                                                        </strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="item border-bottom py-3">
                                            <div className="row justify-content-between align-items-center">
                                                <div className="col-auto">
                                                    <div className="item-label">
                                                        <div className="d-block mb-2">
                                                           Email: {" "}
                                                        </div>
                                                        <strong>
                                                            {contact.email}
                                                        </strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="item border-bottom py-3">
                                            <div className="row justify-content-between align-items-center">
                                                <div className="col-auto">
                                                    <div className="item-label">
                                                        <div className="d-block mb-2">
                                                           Phone: {" "}
                                                        </div>
                                                        <strong>
                                                            {contact.phone}
                                                        </strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="item border-bottom py-3">
                                            <div className="row justify-content-between align-items-center">
                                                <div className="col-auto">
                                                    <div className="item-label">
                                                        <div className="d-block mb-2">
                                                           Subject: {" "}
                                                        </div>
                                                        <strong>
                                                            {contact.subject}
                                                        </strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="item border-bottom py-3">
                                            <div className="row justify-content-between align-items-center">
                                                <div className="col-auto">
                                                    
                                                    <div className="d-block mb-2">
                                                        Message: {" "}
                                                    </div>
                                                    <div className="item-label" dangerouslySetInnerHTML={{ __html: contact.message }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mx-auto mt-5 mb-5">
                                        <button 
                                            type="submit" 
                                            className="btn btn-primary rounded-0"
                                            onClick={handleDeleteContactMessageSubmit}
                                        >
                                            <i className="fas fa-trash"></i> Delete Message
                                        </button>
                                        <Link to="/Admin/Contact-Messages/Manage-Contact-Us-Messages" className="ms-3 btn btn-warning rounded-0" onClick={() => { window.location.href = "/Admin/Contact-Messages/Manage-Contact-Us-Messages" }}>
                                        <i className="fas fa-times"></i> Cancel
                                        </Link>
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

export default ViewContactMessage;