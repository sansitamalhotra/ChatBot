import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import TestHomeHeader from '../TestHomeHeader';
import { Link, useNavigate } from "react-router-dom";
import FavIconLogo from "../../assets/img/FaviIcon-Logo.png";

import API from "../../helpers/API";
import Footer from '../Footer';
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './About.css';
import './OurLocations.css';

const TestContactUs = () => {
    const canonicalUrl = window.location.href; 

    const notifyErr = (msg) => {
        toast.error(msg, {
          position: "top-center",
          autoClose: 20000,
          closeOnClick: true,
          pauseOnHover: true,
          theme: "light"
        });
    };
      
    const notifySucc = (msg) => {
        toast.success(msg, {
          position: "top-center",
          autoClose: 20000,
          closeOnClick: true,
          pauseOnHover: true,
          theme: "light"
        });
    };
    const [loading, setLoading] = useState(false);
    const [offices, setOffices] = useState([]);
    const [loadingOffices, setLoadingOffices] = useState(true);
    const navigate = useNavigate();
  
    // Using react-hook-form for better validation performance
    const {
      register,
      handleSubmit,
      formState: { errors },
      reset
    } = useForm();

    // Fetch offices from API
    useEffect(() => {
        const fetchOffices = async () => {
            try {
                setLoadingOffices(true);
                const response = await API.get("/api/v1/offices/fetchAllOffices");
                if (response.data.success) {
                    setOffices(response.data.offices);
                }
            } catch (error) {
                console.error("Error fetching offices:", error);
                notifyErr("Failed to load office locations");
            } finally {
                setLoadingOffices(false);
            }
        };

        fetchOffices();
    }, []);

    // Helper function to generate Google Maps embed URL
    const generateMapUrl = (office) => {
        const fullAddress = `${office.location.address}, ${office.location.city}, ${office.location.state}, ${office.location.postalCode}, ${office.location.country}`;
        const encodedAddress = encodeURIComponent(fullAddress);
        return `https://maps.google.com/maps?width=520&height=334&hl=en&q=${encodedAddress}&t=&z=12&ie=UTF8&iwloc=B&output=embed`;
    };

const LoaderSpinner = ({ style }) => (
  <div style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    width: "100%"
  }}>
    <div className="spinner-border" role="status" style={{
      ...style,
      position: "relative",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden"
    }}>
      <span className="sr-only" style={{
        position: "absolute",
        width: "70%",
        height: "70%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1
      }}>
        <img 
          src={FavIconLogo} 
          alt="PSPL FavIcon Logo" 
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            borderRadius: "50%" 
          }}
        />
      </span>
    </div>
  </div>
);
  
   const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await API.post("/api/v1/contact/contact-form", data);
      if (res.status === 201 || res.status === 200) {
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
        notifySucc(res.data.message || "Your message has been sent successfully. Thank you!");
        setTimeout(() => {
          navigate("/Contact-Us");
          reset();
        }, 2000); // Short delay to allow user to see success message
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Something went wrong. Please try again later.";
      notifyErr(errorMessage);
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    } finally {
      setLoading(false);
    }
  };


    return (
        <>
        <Helmet>
            <link rel="canonical" href={canonicalUrl} />
            <title>Contact Us | ProsoftSynergies </title>
            <meta
                name="description"
                content="Contact Us, One of the Leading Global Job Platform Connecting Employers and Job Seekers Across Canada, the US, and India. Secure Access To Your Account and Explore Endless Career Opportunities."
            />
            <meta
                name="keywords"
                content="ProsoftSynergies Website, Job Portal, Login, Sign In, Job Search, Career Opportunities, Canada jobs, US Jobs, India Jobs, Employment, Job Seekers, Employer Login"
            />
            <meta name="author" content="ProsoftSynergies" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <TestHomeHeader />
        <section className="about-us-section">
            <div className="about-us-container">
                <div className="about-us-text">
                    <h1>Contact Us</h1>
                </div>
                <div className="about-us-image">
                    <img
                        src="https://images.pexels.com/photos/7709177/pexels-photo-7709177.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" // Replace with your actual image URL
                        alt="Contact Us"
                    />
                </div>
            </div>
        </section>
            <div className="containerLocations">
                <div className="inner-container">
                    <div className="content-wrapper">
                        <div className="full-width-column">
                        <div className="content-container">  
                            <div className="form-container">
                                <div className="row">
                                <div className="col-md-8 mx-auto">
                                    <div className="mx-auto pb-5 wow fadeIn" data-wow-delay=".3s">
                                        <h2 className="main-heading mb-3">
                                            <span className="red-text">Let's Connect</span>
                                        </h2>
                                        <p>
                                        Complete the form below to help us understand your needs. We
                                        will connect with you promptly to provide tailored solutions
                                        for your business.
                                        </p>
                                    </div>
                                </div>
                                    <div className="col-md-8 mx-auto">
                                    {loading ? (
                                        <div className="text-center py-5">
                                            <LoaderSpinner style={{ width: "100px", height: "100px" }} />
                                            <p className="mt-3">Sending your message...</p>
                                        </div>
                                    ) : (
                                        <form
                                        onSubmit={handleSubmit(onSubmit)}
                                        className="contact-page-form mb-5"
                                        >
                                        <div className="row col-md-11 mx-auto">
                                            <div className="col-md-6">
                                            <div className="single-input-field">
                                                <input
                                                type="text"
                                                placeholder="First Name"
                                                {...register("first_name", {
                                                    required: "First Name is required",
                                                    minLength: {
                                                    value: 3,
                                                    message: "First name must be at least 3 characters"
                                                    },
                                                    maxLength: {
                                                    value: 20,
                                                    message: "First name cannot exceed 20 characters"
                                                    }
                                                })}
                                                />
                                                {errors.first_name && (
                                                <div className="text-danger mb-2">
                                                    {errors.first_name.message}
                                                </div>
                                                )}
                                            </div>
                                            </div>

                                            <div className="col-md-6">
                                            <div className="single-input-field">
                                                <input
                                                type="text"
                                                placeholder="Last Name"
                                                {...register("last_name", {
                                                    required: "Last Name is required",
                                                    minLength: {
                                                    value: 3,
                                                    message: "Last name must be at least 3 characters"
                                                    },
                                                    maxLength: {
                                                    value: 20,
                                                    message: "Last name cannot exceed 20 characters"
                                                    }
                                                })}
                                                />
                                                {errors.last_name && (
                                                <div className="text-danger mb-2">
                                                    {errors.last_name.message}
                                                </div>
                                                )}
                                            </div>
                                            </div>

                                            <div className="col-md-6">
                                            <div className="single-input-field">
                                                <input
                                                type="email"
                                                placeholder="E-mail"
                                                {...register("email", {
                                                    required: "Email is required",
                                                    pattern: {
                                                    value: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/,
                                                    message: "Invalid email address"
                                                    }
                                                })}
                                                />
                                                {errors.email && (
                                                <div className="text-danger mb-2">
                                                    {errors.email.message}
                                                </div>
                                                )}
                                            </div>
                                            </div>

                                            <div className="col-md-6">
                                            <div className="single-input-field">
                                                <input
                                                type="text"
                                                placeholder="Phone Number"
                                                {...register("phone", {
                                                    required: "Phone number is required",
                                                    pattern: {
                                                    value: /^\d{10,12}$/,
                                                    message: "Phone number must be between 10 and 12 digits"
                                                    }
                                                })}
                                                />
                                                {errors.phone && (
                                                <div className="text-danger mb-2">
                                                    {errors.phone.message}
                                                </div>
                                                )}
                                            </div>
                                            </div>

                                            <div className="col-md-12">
                                            <div className="single-input-field">
                                                <input
                                                type="text"
                                                placeholder="Subject"
                                                {...register("subject", {
                                                    required: "Subject is required",
                                                    minLength: {
                                                    value: 6,
                                                    message: "Subject must be at least 6 characters"
                                                    },
                                                    maxLength: {
                                                    value: 50,
                                                    message: "Subject cannot exceed 50 characters"
                                                    }
                                                })}
                                                />
                                                {errors.subject && (
                                                <div className="text-danger mb-2">
                                                    {errors.subject.message}
                                                </div>
                                                )}
                                            </div>
                                            </div>
                                            <div className="col-md-12">
                                            <div className="single-input-field">
                                                <textarea
                                                placeholder="Write Your Message"
                                                {...register("message", {
                                                    required: "Message is required",
                                                    minLength: {
                                                    value: 10,
                                                    message: "Message must be at least 10 characters"
                                                    },
                                                    maxLength: {
                                                    value: 5000,
                                                    message: "Message cannot exceed 5000 characters"
                                                    }
                                                })}
                                                ></textarea>
                                                {errors.message && (
                                                <div className="text-danger mb-2">
                                                    {errors.message.message}
                                                </div>
                                                )}
                                            </div>
                                            </div>

                                            <div className="single-input-fieldsbtn">
                                            <button type="submit" disabled={loading}>
                                                {loading ? "Sending..." : "Send Now"}
                                            </button>
                                            </div>
                                        </div>
                                        </form>
                                    )}
                                    </div>
                                </div>
                            </div>
                            <div className="red-text mt-5 mb-5">
                                <div className="header-container">
                                    <h2 className="main-heading">
                                        <span className="red-text">Find Our PSPL Local Offices</span>
                                    </h2>
                                </div>
                            </div>
                            <div className="locations-container">
                                {loadingOffices ? (
                                    <div className="text-center py-5">
                                        <LoaderSpinner style={{ width: "60px", height: "60px" }} />
                                        <p className="mt-3">Loading office locations...</p>
                                    </div>
                                ) : offices.length > 0 ? (
                                    offices.map((office, index) => (
                                        <div key={office._id || index} className="location-column mt-5">
                                            <div className={index % 2 === 0 ? "location-content" : "location-content-center"}>
                                                <div className="map-container">
                                                    <div className="map-inner">
                                                        <div className="map-wrapper">
                                                            <iframe 
                                                                className="responsive-map"
                                                                width="420" 
                                                                height="334" 
                                                                frameBorder="0" 
                                                                scrolling="no" 
                                                                marginHeight="0" 
                                                                marginWidth="0" 
                                                                src={generateMapUrl(office)}
                                                                title={`Google Map for ${office.location.city}`}
                                                                loading="lazy"
                                                            ></iframe>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="red-text">
                                                    <div className="location-title-container">
                                                        <h2 className="location-title">
                                                            <span className="red-text">
                                                                {office.location.state}, {office.location.country}
                                                            </span>
                                                        </h2>
                                                    </div>
                                                </div>
                                                <div className="dark-text">
                                                    <div className="location-address-container">
                                                        <div className="location-address">
                                                            <p className="address-text">
                                                                {office.location.address}<br />
                                                                {office.location.city}, {office.location.state}<br />
                                                                {office.location.postalCode}
                                                            </p>
                                                            {office.phone && (
                                                                <p className="contact-text mt-2">
                                                                    <strong>Phone:</strong> <a href={`tel:${office.phone}`}>{office.phone}</a>
                                                                </p>
                                                            )}
                                                            {office.email && (
                                                                <p className="contact-text">
                                                                    <strong>Email:</strong> <a href={`mailto:${office.email}`}>{office.email}</a>
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-5">
                                        <h3>No office locations available</h3>
                                        <p>Please check back later for updated office information.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            </div>
        <Footer />  
        </>
    );
};

export default TestContactUs;