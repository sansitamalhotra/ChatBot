import ChangePageTitle from "../../utils/ChangePageTitle";
import React, { Component, useRef, useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";


import API from "../../helpers/API";
import { useAuth } from "../../Context/AuthContext";

import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import { useFormik } from "formik";
import * as Yup from "yup";
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { text } from "@fortawesome/fontawesome-svg-core";


const notifyErr = (msg) => {
    toast.error(msg, {
      position: "top-center",
      autoClose: 20000,
      closeOnClick: true,
      pauseOnHover: true,
      theme: "light",
    });
  };
  
  const notifySucc = (msg) => {
    toast.success(msg, {
      position: "top-center",
      autoClose: 20000,
      closeOnClick: true,
      pauseOnHover: true,
      theme: "light",
    });
  };
  
  const digitsOnly = (value) => /^\d+$/.test(value);
  
  const initialValues = {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  };
  
  const validationSchema = Yup.object().shape({
    first_name: Yup.string()
      .required("First Name Field Cannot be Empty")
      .min(3, "First Name Cannot be Less Than 3 Characters")
      .max(20, "First Name Should not be More than 20 Characters"),
    last_name: Yup.string()
      .required("Last Name Field Cannot be Empty")
      .min(3, "Last Name Cannot be Less Than 3 Characters")
      .max(20, "Last Name Should not be More than 20 Characters"),
    email: Yup.string()
      .email("Invalid Email Address")
      .required("Email Field Cannot be Empty"),
    phone: Yup.string()
      .required("Phone Field Cannot be Empty")
      .test("Digits Only", "Numbers Only", digitsOnly)
      .min(10, "Enter minimum 10 digits valid Phone Number")
      .max(12, "Phone Number cannot be more than 12 Digits"),
    subject: Yup.string()
      .required("Subject Field Cannot be Empty")
      .min(6, "Your Subject should not be Less than 6 Characters")
      .max(50, "Your Message should not be more than 50 Characters"),
    message: Yup.string()
      .required("Message Field Cannot be Empty")
      .min(10, "Your Message should not be Less than 10 Characters")
      .max(5000, "Your Message should not be more than 5000 Characters"),
  });

const ContactUs = () => {

    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (values, { resetForm }) => {
        console.log(values);
        setLoading(true);
        try {
        if (await validationSchema.isValid(values)) {
            const res = await API.post("/api/v1/contact/contact-form", values);
            if (res.status === 201) {
            notifySucc(`${res.data.message}`);
            navigate("/Thank-You-For-Contacting-Us");
            setTimeout(() => {
                setLoading(false);
                resetForm();
            }, 500 * 2);
            }
        } else {
            notifyErr("Validation failed. Please check your inputs.");
        }
        } catch (error) {
        notifyErr(`${error}`);
        } finally {
        setLoading(false);
        resetForm();
        }
    };

    const formik = useFormik({
        initialValues,
        validationSchema,
        onSubmit: handleSubmit,
    });

    return (
        <>
            <Header />
            <ChangePageTitle customPageTitle="Contact ProfostSynergies | ProfostSynergies Today" />
            {/* <!-- Header End --> */}
            <div className="container-fliud py-5 bg-dark page-header-contactus mb-5">
                <div className="container my-5 pt-5 pb-4">
                    <h1 className="display-3 text-white mb-3 animated slideInDown">Contact Us</h1>
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb text-uppercase">
                            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                            <li className="breadcrumb-item text-white active" aria-current="page">Get in touch</li>
                        </ol>
                    </nav>
                </div>
            </div>
            {/* <!-- Header End --> */}

            {/* Contact Us Starts Here Starts */}
            <div className="container-xxl py-5">
                <div className="container">
                    <h1 className="text-center mb-5 wow fadeInUp" data-wow-delay="0.1s">
                        Surpass your goals. Exceed expectations. Outrival your competitors. You have the ability to achieve it all.
                    </h1>
                    <div className="row g-4">
                       <div className="col-12">
                            <div className="row gy-4">
                                <div className="col-md-4 wow fadeIn" data-wow-delay="0.1s">
                                    <div className="d-flex align-items-center bg-light rounded p-4">
                                        <div className="bg-white border rounded d-flex flex-shrink-0 align-items-center justify-content-center me-3" style={{ width: "45px", height: "45px"}}>
                                            <i className="fa fa-map-marker-alt text-primary"></i>
                                        </div>
                                        <span><small>Canada: 71 Fleming Crescent, Caledonia, ON, N3W 1V3 </small></span>
                                    </div>
                                </div>
                                <div className="col-md-4 wow fadeIn" data-wow-delay="0.1s">
                                    <div className="d-flex align-items-center bg-light rounded p-4">
                                        <div className="bg-white border rounded d-flex flex-shrink-0 align-items-center justify-content-center me-3" style={{ width: "45px", height: "45px"}}>
                                            <i className="fa fa-map-marker-alt text-primary"></i>
                                        </div>
                                        <span><small>US: 943 Bensch Street, Lansing, MI, 48912 </small></span>
                                    </div>
                                </div>
                                <div className="col-md-4 wow fadeIn" data-wow-delay="0.1s">
                                    <div className="d-flex align-items-center bg-light rounded p-4">
                                        <div className="bg-white border rounded d-flex flex-shrink-0 align-items-center justify-content-center me-3" style={{ width: "45px", height: "45px"}}>
                                            <i className="fa fa-map-marker-alt text-primary"></i>
                                        </div>
                                        <span><small>India: 528, Sector 82, Mohali, Punjab </small></span>
                                    </div>
                                </div>
                            </div>
                       </div>
                       <div className="col-md-6 wow fadeInUp" data-wow-delay="0.1s">
                            <div style={{maxWidth: "100%", listStyle: "none", transition: "none", overflow: "hidden", width: "500px",height: "500px"}}>
                                <div id="embed-ded-map-canvas" style={{height: "100%", width: "100%", maxWidth: "100%"}}>
                                    <iframe style={{height: "100%", width: "100%",border: 0}} frameborder="0" src="https://www.google.com/maps/embed/v1/place?q=71+Fleming+Crescent,+Caledonia,+ON+N3W+1V3,+Canada&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8"></iframe>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="wow fadeInUp" data-wow-delay="0.5s">
                                 <p className="mb-4">
                                    In addition to an employment agency, what you truly require is the most exceptional talent network in the world. Harness the potential of our highly skilled candidates.
                                 </p>
                                 <p className="mb-4">
                                    If you are an employer seeking temporary or permanent staff, kindly complete the form provided below. Our team of consultants will promptly reach out to you to explore how our solutions can add value to your company.
                                 </p>
                                 <form onClick={formik.handleSubmit} noValidate>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <div className="form-floating">
                                                {formik.touched.first_name && formik.errors.first_name && (
                                                    <div className="text-danger mb-2">
                                                    {formik.errors.first_name}
                                                    </div>
                                                )}
                                                <input 
                                                    type={text}
                                                    className="form-control" 
                                                    id="first_name" 
                                                    placeholder="First Name"
                                                    value={formik.values.first_name}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur} 
                                                    />
                                                <label for="name">First Name</label>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-floating">
                                                {formik.touched.last_name && formik.errors.last_name && (
                                                    <div className="text-danger mb-2">
                                                    {formik.errors.last_name}
                                                    </div>
                                                )}
                                                <input 
                                                    type={text}
                                                    className="form-control" 
                                                    id="last_name" 
                                                    placeholder="Last Name" 
                                                    value={formik.values.last_name}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    />
                                                <label for="email">Last Name</label>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-floating">
                                                {formik.touched.email && formik.errors.email && (
                                                    <div className="text-danger mb-2">
                                                    {formik.errors.email}
                                                    </div>
                                                )}
                                                <input 
                                                    type="email" 
                                                    className="form-control" 
                                                    id="email" 
                                                    placeholder="Your Email Addres" 
                                                    value={formik.values.email}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    />
                                                <label for="name">Email</label>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-floating">
                                                {formik.touched.phone && formik.errors.phone && (
                                                    <div className="text-danger mb-2">
                                                    {formik.errors.phone}
                                                    </div>
                                                )}
                                                <input 
                                                    type={text}
                                                    className="form-control" 
                                                    id="phone" 
                                                    placeholder="Your Phone Number"
                                                    value={formik.values.phone}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur} 
                                                    />
                                                <label for="email">Phone Number</label>
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <div className="form-floating">
                                                {formik.touched.subject && formik.errors.subject && (
                                                    <div className="text-danger mb-2">
                                                    {formik.errors.subject}
                                                    </div>
                                                )}
                                                <input 
                                                    type={text}
                                                    className="form-control" 
                                                    id="subject" 
                                                    placeholder="Subject"
                                                    value={formik.values.subject}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur} 
                                                    />
                                                <label for="subject">Subject</label>
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <div className="form-floating">
                                                {formik.touched.message && formik.errors.message && (
                                                    <div className="text-danger mb-2">
                                                    {formik.errors.message}
                                                    </div>
                                                )}
                                                <textarea 
                                                    className="form-control" 
                                                    placeholder="Leave a message here" 
                                                    id="message" 
                                                    value={formik.values.message}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    style={{height: "150px"}}></textarea>
                                                <label for="message">Message</label>
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <button 
                                                disabled={loading}
                                                className="btn btn-primary w-100 py-3"
                                                type={"submit"}
                                                >
                                                    Send Message
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Contact Us Starts Here Ends */}

            <Footer />
        </>
    );
}; 


export default ContactUs;