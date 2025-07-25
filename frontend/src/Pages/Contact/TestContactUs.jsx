import React, { useState } from "react";
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
    const navigate = useNavigate();
  
    // Using react-hook-form for better validation performance
    const {
      register,
      handleSubmit,
      formState: { errors },
      reset
    } = useForm();

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
                                {/* Ontario Location */}
                                <div className="location-column mt-5">
                                    <div className="location-content">
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
                                                    id="gmap_canvas" 
                                                    src="https://maps.google.com/maps?width=520&height=334&hl=en&q=71%20Fleming%20Crescent,%20Caledonia,%20ON,%20N3W%201V3%20Caledonia+(ThinkBeyond%20Canada%20Address)&t=&z=12&ie=UTF8&iwloc=B&output=embed"
                                                    title="Google Map"
                                                ></iframe>
                                                <noscript><iframe src="https://www.google.com/maps/embed/v1/place?q=Unit+3%2F10+Moore+Street%2C+++++++++Acacia+Ridge+QLD+4110&key=AIzaSyD09zQ9PNDNNy9TadMuzRV_UsPUoWKntt8" aria-hidden="true"></iframe></noscript>
                                            </div>
                                        </div>
                                        </div>
                                        <div className="red-text">
                                        <div className="location-title-container">
                                            <h2 className="location-title">
                                            <span className="red-text">Ontario CA</span>
                                            </h2>
                                        </div>
                                        </div>
                                        <div className="dark-text">
                                        <div className="location-address-container">
                                            <div className="location-address">
                                            <p className="address-text">
                                                71 Fleming Crescent,<br />
                                                Caledonia, ON, N3W 1V3
                                            </p>
                                            </div>
                                        </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* India Location */}
                                <div className="location-column mt-5">
                                    <div className="location-content-center">
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
                                                    id="gmap_canvas" 
                                                    src="https://maps.google.com/maps?width=520&height=334&hl=en&q=528,%20Sector%2082,%20Area%20Mohali,%20Punjab%20140306%20Punjab+(ThinkBeyond%20Punjab%20India%20Address)&t=&z=12&ie=UTF8&iwloc=B&output=embed"
                                                    title="Google Map"
                                                ></iframe>
                                                <noscript><iframe src="https://www.google.com/maps/embed/v1/place?q=Level+2%2F104+Frome+St%2C++++++++Adelaide+SA+5000&key=AIzaSyD09zQ9PNDNNy9TadMuzRV_UsPUoWKntt8" aria-hidden="true"></iframe></noscript>
                                            </div>
                                        </div>
                                        </div>
                                        <div className="red-text">
                                        <div className="location-title-container">
                                            <h2 className="location-title">
                                            <span className="red-text">India</span>
                                            </h2>
                                        </div>
                                        </div>
                                        <div className="dark-text">
                                        <div className="location-address-container">
                                            <div className="location-address">
                                            <p className="address-text">
                                                528, Sector 82, Area <br />
                                                Mohali, Punjab 140306
                                            </p>
                                            </div>
                                        </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* New York Location */}
                                <div className="location-column mt-5">
                                    <div className="location-content-center">
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
                                                    id="gmap_canvas" 
                                                    src="https://maps.google.com/maps?width=520&height=334&hl=en&q=3013%20Durango%20Hills%20Dr,%20Leander,%20TX%2078641%20Leander+(ThinkBeyond%20US%20Address)&t=&z=12&ie=UTF8&iwloc=B&output=embed" 
                                                    title="Google Map"
                                                ></iframe>
                                                <noscript><iframe src="https://www.google.com/maps/embed/v1/place?q=Level+2%2F104+Frome+St%2C++++++++Adelaide+SA+5000&key=AIzaSyD09zQ9PNDNNy9TadMuzRV_UsPUoWKntt8" aria-hidden="true"></iframe></noscript>
                                            </div>
                                        </div>
                                        </div>
                                        <div className="red-text">
                                        <div className="location-title-container">
                                            <h2 className="location-title">
                                            <span className="red-text">New York US</span>
                                            </h2>
                                        </div>
                                        </div>
                                        <div className="dark-text">
                                        <div className="location-address-container">
                                            <div className="location-address">
                                            <p className="address-text">
                                                3013 Durango Hills Dr,<br />
                                                Leander, TX 78641
                                            </p>
                                            </div>
                                        </div>
                                        </div>
                                    </div>
                                </div>
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
