import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useNavigate, useLocation, useParams } from "react-router-dom";

import API from "../../helpers/API";
import { useAuth } from "../../Context/AuthContext";

import TestHomeHeader from '../TestHomeHeader';
import Footer from '../Footer';

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


import './Register.css';

const Register = () => {
    const canonicalUrl = window.location.href; // Get the current URL
    const [auth, setAuth] = useAuth();
    const navigate = useNavigate();
    const [visible, setVisible] = useState(false);
    const [country, setCountry] = useState("");
    const [countries, setCountries] = useState([]);
    const [countryName, setCountryName] = useState("");
    const [sector, setSector] = useState("");
    const [sectors, setSectors] = useState([]);
    const [sectorName, setSectorName] = useState("");
    const [workAuthorization, setWorkAuthorization] = useState("");
    const [workAuthorizations, setWorkAuthorizations] = useState([]);
    const [firstname, setFirstName] = useState("");
    const [lastname, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [phone, setPhone] = useState("");


    const emailRegex = /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/;
    function isEmailValid(email) { return /\S+@\S+\.\S+/.test(email); }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])(?=.{8,})/;
    const confirmPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])(?=.{8,})/;
    const phoneRegex = /^\s*(?:\+?(\d{1,3}))?[- (]*(\d{3})[- )]*(\d{3})[- ]*(\d{4})(?: *[x/#]{1}(\d+))?\s*$/;


    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light" });


    useEffect(() => {
        fetchCountries();
    }, []);

    useEffect(() => {
        fetchSectors();
    }, []);

    useEffect(() => {
        fetchWorkAuthorizations();
    }, []);
    
    const fetchCountries = async () => {
            try
            {
                const { data } = await API.get("/api/v1/country/fetchCountries");
                if (data?.success) {
                    setCountries(data?.country);
                }
            }
            catch (error)
            {
                console.log(error);
                notifyErr("Oppss!!, FAILED, Something went Wrong Retrieving all Countries");
            }
    };

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

    const handleSubmit = async (e) => {
        e.preventDefault();
      
        const fields = [
          { name: "firstname", message: "First Name Field Cannot be Empty" },
          { name: "lastname", message: "Last Name Field Cannot be Empty" },
          { name: "email", message: "Email Field Cannot be Empty" },
          { name: "password", message: "Password Field Cannot be Empty" },
          { name: "confirmPassword", message: "Confirm Password Field Cannot be Empty" },
          { name: "phone", message: "Phone Field Cannot be Empty" },
          { name: "email", message: "Invalid Email Address", regex: emailRegex },
          { name: "password", message: "Password must contain at least 8 characters, including at least 1 number and 1 includes both lower and uppercase letters and special characters for example #,?,!", regex: passwordRegex },
          { name: "confirmPassword", message: "Confirm Password must contain at least 8 characters, including at least 1 number and 1 includes both lower and uppercase letters and special characters for example #,?,!", regex: confirmPasswordRegex },
          { name: "phone", message: "Phone Number Cannot be more than 10 Digits", regex: phoneRegex },
          { name: "password", message: "Password & Confirm password does Not Matched!!", condition: password !== confirmPassword },
          { name: "country", message: "Please Select Country Field, It Cannot be Empty" },
          { name: "workAuthorization", message: "Please Select Work Authorization Field, It Cannot be Empty" },
        ];
      
        for (const field of fields) {
          const { name, message, regex, condition } = field;
          const value = eval(name);
      
          if (!value || (regex && !regex.test(value)) || (condition && condition)) {
            notifyErr(message);
            return;
          }
        }
      
        try {
          const config = { headers: { "Content-Type": "application/json" } };
          const data = { firstname, lastname, email, password, confirmPassword, phone, country, workAuthorization };      
          const res = await API.post(`/api/v1/auth/register`, data, config);      
          if (res.data.success) {
            resetRegisterUserForm();
            notifySucc(res.data.message);
            navigate("/Login");
          } else {
            notifyErr(res.data.message);
          }
        } catch (error) {
          console.log(error);
          notifyErr("Opps.. Failed!!. Something Went Wrong.. Try Again Later");
        }
      };
      
      const resetRegisterUserForm = () => {
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
        setPassword('');
        setConfirmPassword('');
        setCountry('');
        setWorkAuthorization('');
      };

      const location = useLocation();

        //destructuring pathname from location
        const { pathname } = location;

        // splitting method to get the name of the path in array
        const splitLocation = pathname.split("/");

    // Hover link and Activation Link
    const [activeLink, setActiveLink] = useState("/");

    const handleSetActiveLink = (link) => {
    setActiveLink(link);
    };

    useEffect(() => {
        // Apply the active class when the component mounts , it stores the current path when the page mounts
        const initialActiveLink = window.location.pathname;
        setActiveLink(initialActiveLink);
    }, []);

 
  return (
    <>
      <Helmet>
        <link rel="canonical" href={canonicalUrl} />
        <title>Register - ProSoft | Canada, US & India ProsoftSynergies</title>
        <meta
          name="description"
          content="Join ProsoftSynergies, One of the Leading Global Job Portal With Offices in Canada, the US, and India. Sign Up Today to Connect with Top Employers and Advance Your Career."
        />
        <meta
          name="keywords"
          content="ProsoftSynergies Website, Job Portal, Register, Sign Up, Careers, Canada Jobs, US Jobs, India Jobs, Global Job Opportunities, Employment, Career Registration"
        />
        <meta name="author" content="ProsoftSynergies" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      {(() => {
        const userRole = auth.user?.role;
        let linkPath = "/Login";
        if (auth.user && userRole === 1) {
          navigate("/Admin/Dashboard");
          window.location.reload();
        } else if (auth.user && userRole === 2) {
          navigate("/Employer/Dashboard");
          window.location.reload();
        } else if (auth.user && userRole === 0) {
          navigate(`/Applicant/Profile/${auth?.user?.userId}`);
          window.location.reload();
        } else if (!auth.user) {
          return (
            <>
             <TestHomeHeader />
                <div className="container-fluid px-4 py-5 mx-auto">
                    <div className="card card0">
                    <div className="d-flex flex-lg-row flex-column-reverse">
                        <div className="card card1">
                        <div className="row justify-content-center my-auto">
                            <div className="col-md-8 col-10 my-4 headingh3"> {/* Changed my-5 to my-4 for better spacing on mobile */}               
                            <h3 className="mb-4 text-center heading">We Are ProSoft</h3>
                            <h6 className="msg-info">Sign Up Account</h6>
                                <form onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            id="firstname"
                                            name="firstname"
                                            placeholder="First Name"
                                            className="loginFormInput form-control"
                                            value={firstname}
                                            onChange={(e) => setFirstName(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            id="lastname"
                                            name="lastname"
                                            placeholder="Last Name"
                                            className="loginFormInput form-control"
                                            value={lastname}
                                            onChange={(e) => setLastName(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            placeholder="Email"
                                            className="loginFormInput form-control"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            id="phone"
                                            name="phone"
                                            placeholder="Phone Number"
                                            className="loginFormInput form-control"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <input
                                          type="password"
                                            id="password"
                                            name="password"
                                            placeholder="Password"
                                            className="loginFormInput form-control"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                      <input
                                          type="password"
                                          placeholder="Confirm Password"
                                          className="loginFormInput form-control"
                                          value={confirmPassword}
                                          onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group registerFormGroup">
                                        <select
                                            id="country"
                                            className="loginFormInput form-control registerFormInput"
                                            name="country"
                                            value={country}
                                            onChange={(e) => setCountry(e.target.value)}
                                        >
                                            <option value="" disabled>Select Country</option>
                                            {countries.map((c) => (
                                                <option key={c._id} value={c._id}>
                                                    {c.countryName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group registerFormGroup">
                                        <select
                                            id="workAuthorization"
                                            className="loginFormInput form-control registerFormInput"
                                            name="workAuthorization"
                                            value={workAuthorization}
                                            onChange={(e) => setWorkAuthorization(e.target.value)}
                                        >
                                            <option value="" disabled>Select Work Authorization</option>
                                            {workAuthorizations.map((wa) => {
                                                return (
                                                    <option key={wa._id} value={wa._id}>
                                                        {wa.workAuthorizationName}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    <div className="row justify-content-center my-3 px-2 loginbtn">
                                        <button className="btn-block btn-color" type="submit">Register</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                        <div className="bottom text-center mb-4">
                            <p className="sm-text mx-auto mb-3">
                            Already have an Account?
                            <button className="btn btn-white ms-3">
                                <Link to="/Login">Login</Link>
                            </button>
                            </p>
                        </div>
                        </div>
                        <div className="card card2">
                        <div className="my-auto mx-md-5 px-md-5 right">
                            <h3 className="text-white">We're More Than Just Recruitment Specialists</h3>
                            <small className="text-white">
                            By leveraging cutting-edge strategies and a deep understanding of the market, we not only fill positions but also foster long-term partnerships that drive business growth and success. Our team is dedicated to crafting tailored solutions that align with the unique needs of each client, ensuring seamless integration of top talent into their organizations.
                            </small>
                        </div>
                        </div>
                    </div>
                    </div>
                </div>
                <Footer />
            </>
                );
            }
            return <navigate to={linkPath} />;
        })()}
    </>
  );
};

export default Register;
