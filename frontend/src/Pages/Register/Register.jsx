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
    const canonicalUrl = window.location.href;
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
    
    // Enhanced state for better UX
    const [isLoading, setIsLoading] = useState(false);
    // Replace isSubmitting with progress state
    const [submitProgress, setSubmitProgress] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(''); // 'submitting', 'success', 'error'
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [isFormValid, setIsFormValid] = useState(false);

    const emailRegex = /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/;
    function isEmailValid(email) { return /\S+@\S+\.\S+/.test(email); }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])(?=.{8,})/;
    const confirmPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])(?=.{8,})/;
    const phoneRegex = /^\s*(?:\+?(\d{1,3}))?[- (]*(\d{3})[- )]*(\d{3})[- ]*(\d{4})(?: *[x/#]{1}(\d+))?\s*$/;

    // Enhanced toast configurations
    const notifyErr = (msg) => toast.error(msg, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        className: "custom-toast-error"
    });

    const notifySucc = (msg) => toast.success(msg, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        className: "custom-toast-success"
    });

    // Progress simulation function
    const simulateProgress = () => {
        return new Promise((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 15 + 5; // Random increment between 5-20
                if (progress >= 95) {
                    progress = 95; // Stop at 95% until actual response
                    clearInterval(interval);
                    resolve();
                }
                setSubmitProgress(Math.min(progress, 95));
            }, 150); // Update every 150ms
        });
    };

    // Password strength calculator
    const calculatePasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength += 25;
        if (/[A-Z]/.test(password)) strength += 25;
        if (/[a-z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 15;
        if (/[!@#$%^&*]/.test(password)) strength += 10;
        return Math.min(strength, 100);
    };

    // Real-time form validation
    const validateField = (fieldName, value) => {
        const errors = { ...fieldErrors };
        
        switch (fieldName) {
            case 'firstname':
                if (!value.trim()) {
                    errors.firstname = 'First name is required';
                } else {
                    delete errors.firstname;
                }
                break;
            case 'lastname':
                if (!value.trim()) {
                    errors.lastname = 'Last name is required';
                } else {
                    delete errors.lastname;
                }
                break;
            case 'email':
                if (!value.trim()) {
                    errors.email = 'Email is required';
                } else if (!emailRegex.test(value)) {
                    errors.email = 'Invalid email format';
                } else {
                    delete errors.email;
                }
                break;
            case 'phone':
                if (!value.trim()) {
                    errors.phone = 'Phone number is required';
                } else if (!phoneRegex.test(value)) {
                    errors.phone = 'Invalid phone number format';
                } else {
                    delete errors.phone;
                }
                break;
            case 'password':
                if (!value) {
                    errors.password = 'Password is required';
                } else if (!passwordRegex.test(value)) {
                    errors.password = 'Password must contain at least 8 characters, including uppercase, lowercase, number and special character';
                } else {
                    delete errors.password;
                }
                break;
            case 'confirmPassword':
                if (!value) {
                    errors.confirmPassword = 'Please confirm your password';
                } else if (value !== password) {
                    errors.confirmPassword = 'Passwords do not match';
                } else {
                    delete errors.confirmPassword;
                }
                break;
            default:
                break;
        }
        
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Check overall form validity
    useEffect(() => {
        const isValid = firstname.trim() && 
                       lastname.trim() && 
                       email.trim() && 
                       emailRegex.test(email) &&
                       password && 
                       passwordRegex.test(password) &&
                       confirmPassword &&
                       password === confirmPassword &&
                       phone.trim() &&
                       phoneRegex.test(phone) &&
                       country &&
                       workAuthorization &&
                       Object.keys(fieldErrors).length === 0;
        
        setIsFormValid(isValid);
    }, [firstname, lastname, email, password, confirmPassword, phone, country, workAuthorization, fieldErrors]);

    // Enhanced input handlers with validation
    const handleInputChange = (fieldName, value) => {
        // First update the state immediately
        switch (fieldName) {
            case 'firstname':
                setFirstName(value);
                break;
            case 'lastname':
                setLastName(value);
                break;
            case 'email':
                setEmail(value);
                break;
            case 'phone':
                setPhone(value);
                break;
            case 'password':
                setPassword(value);
                setPasswordStrength(calculatePasswordStrength(value));
                break;
            case 'confirmPassword':
                setConfirmPassword(value);
                break;
            default:
                break;
        }
        
        // Then validate after state update (using setTimeout to ensure state is updated)
        setTimeout(() => {
            validateField(fieldName, value);
            if (fieldName === 'password' && confirmPassword) {
                validateField('confirmPassword', confirmPassword);
            }
        }, 0);
    };

    useEffect(() => {
        setIsLoading(true);
        fetchCountries();
    }, []);

    useEffect(() => {
        fetchSectors();
    }, []);

    useEffect(() => {
        fetchWorkAuthorizations();
    }, []);
    
    const fetchCountries = async () => {
        try {
            const { data } = await API.get("/api/v1/country/fetchCountries");
            if (data?.success) {
                setCountries(data?.country);
            }
        } catch (error) {
            console.log(error);
            notifyErr("Failed to load countries. Please refresh the page.");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSectors = async () => {
        try {
            const { data } = await API.get("/api/v1/sector/fetchSectors");
            if (data?.success) {
                setSectors(data?.sector);
            }
        } catch (error) {
            console.log(error);
            notifyErr("Failed to load sectors. Please refresh the page.");
        }
    };

    const fetchWorkAuthorizations = async () => {
        try {
            const { data } = await API.get("/api/v1/workAuthorization/fetchWorkAuthorizations");
            if (data?.success) {
                setWorkAuthorizations(data?.workAuthorization);
            }
        } catch (error) {
            console.log(error);
            notifyErr("Failed to load work authorizations. Please refresh the page.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isSubmitting) return; // Prevent double submission
        
        // Validation logic with individual field checks (preserved exactly)
        if (!firstname.trim()) {
            notifyErr("First Name Field Cannot be Empty");
            return;
        }
        if (!lastname.trim()) {
            notifyErr("Last Name Field Cannot be Empty");
            return;
        }
        if (!email.trim()) {
            notifyErr("Email Field Cannot be Empty");
            return;
        }
        if (!emailRegex.test(email)) {
            notifyErr("Invalid Email Address");
            return;
        }
        if (!password) {
            notifyErr("Password Field Cannot be Empty");
            return;
        }
        if (!passwordRegex.test(password)) {
            notifyErr("Password must contain at least 8 characters, including at least 1 number and 1 includes both lower and uppercase letters and special characters for example #,?,!");
            return;
        }
        if (!confirmPassword) {
            notifyErr("Confirm Password Field Cannot be Empty");
            return;
        }
        if (password !== confirmPassword) {
            notifyErr("Password & Confirm password does Not Matched!!");
            return;
        }
        if (!phone.trim()) {
            notifyErr("Phone Field Cannot be Empty");
            return;
        }
        if (!phoneRegex.test(phone)) {
            notifyErr("Phone Number Cannot be more than 10 Digits");
            return;
        }
        if (!country) {
            notifyErr("Please Select Country Field, It Cannot be Empty");
            return;
        }
        if (!workAuthorization) {
            notifyErr("Please Select Work Authorization Field, It Cannot be Empty");
            return;
        }
      
        // Initialize progress bar
        setIsSubmitting(true);
        setSubmitProgress(0);
        setSubmitStatus('submitting');
        
        try {
            // Start progress simulation
            const progressPromise = simulateProgress();
            
            const config = { headers: { "Content-Type": "application/json" } };
            const data = { firstname, lastname, email, password, confirmPassword, phone, country, workAuthorization };      
            
            // Make API call and wait for both progress and API response
            const [_, res] = await Promise.all([
                progressPromise,
                API.post(`/api/v1/auth/register`, data, config)
            ]);
            
            // Complete progress to 100%
            setSubmitProgress(100);
            
            // Wait a moment to show 100% completion
            setTimeout(() => {
                if (res.data.success) {
                    setSubmitStatus('success');
                    resetRegisterUserForm();
                    notifySucc(res.data.message);
                    // Add a slight delay before navigation to ensure toast is visible
                    setTimeout(() => {
                        navigate("/Login");
                    }, 2000);
                } else {
                    setSubmitStatus('error');
                    notifyErr(res.data.message);
                }
                
                // Reset progress after showing result
                setTimeout(() => {
                    setSubmitProgress(0);
                    setSubmitStatus('');
                    setIsSubmitting(false);
                }, 1500);
            }, 500);
            
        } catch (error) {
            console.log(error);
            // Complete progress to 100% before showing error
            setSubmitProgress(100);
            
            setTimeout(() => {
                setSubmitStatus('error');
                const errorMessage = error.response?.data?.message || "Opps.. Failed!!. Something Went Wrong.. Try Again Later";
                notifyErr(errorMessage);
                
                // Reset progress after showing error
                setTimeout(() => {
                    setSubmitProgress(0);
                    setSubmitStatus('');
                    setIsSubmitting(false);
                }, 1500);
            }, 500);
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
        setFieldErrors({});
        setPasswordStrength(0);
    };

    const location = useLocation();
    const { pathname } = location;
    const splitLocation = pathname.split("/");

    const [activeLink, setActiveLink] = useState("/");

    const handleSetActiveLink = (link) => {
        setActiveLink(link);
    };

    useEffect(() => {
        const initialActiveLink = window.location.pathname;
        setActiveLink(initialActiveLink);
    }, []);

    // Check authentication and redirect if needed
    useEffect(() => {
        const userRole = auth.user?.role;
        if (auth.user && userRole === 1) {
            navigate("/Admin/Dashboard");
        } else if (auth.user && userRole === 2) {
            navigate("/Employer/Dashboard");
        } else if (auth.user && userRole === 3) {
            navigate("/Super-Admin/Dashboard");
        } else if (auth.user && userRole === 0) {
            navigate(`/Applicant/Profile/${auth?.user?.userId}`);
        }
    }, [auth.user, navigate]);

    // Don't render if user is already authenticated
    if (auth.user) {
        return null;
    }

    // Loading component
    const LoadingSpinner = () => (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100px' }}>
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );

    // Password strength indicator
    const PasswordStrengthIndicator = ({ strength }) => {
        const getStrengthColor = () => {
            if (strength < 25) return '#dc3545'; // Red
            if (strength < 50) return '#fd7e14'; // Orange
            if (strength < 75) return '#ffc107'; // Yellow
            return '#198754'; // Green
        };

        const getStrengthText = () => {
            if (strength < 25) return 'Weak';
            if (strength < 50) return 'Fair';
            if (strength < 75) return 'Good';
            return 'Strong';
        };

        return (
            <div className="password-strength-container mt-2">
                <div className="password-strength-bar">
                    <div 
                        className="password-strength-fill"
                        style={{
                            width: `${strength}%`,
                            backgroundColor: getStrengthColor(),
                            height: '4px',
                            borderRadius: '2px',
                            transition: 'width 0.3s ease'
                        }}
                    ></div>
                </div>
                <small style={{ color: getStrengthColor(), fontSize: '12px' }}>
                    Password strength: {getStrengthText()}
                </small>
            </div>
        );
    };

    // Progress Bar Component
    const SubmitProgressBar = ({ progress, status }) => {
        const getProgressColor = () => {
            if (status === 'error') return 'linear-gradient(90deg, #dc3545, #c82333)';
            if (status === 'success') return 'linear-gradient(90deg, #28a745, #20c997)';
            return 'linear-gradient(90deg, #61d7f7, #033b57)';
        };

        const getProgressText = () => {
            if (status === 'success') return 'Registration Successful!';
            if (status === 'error') return 'Registration Failed';
            return `Creating Account... ${Math.round(progress)}%`;
        };

        return (
            <div style={{
                width: '100%',
                marginTop: '10px',
                marginBottom: '10px'
            }}>
                <div style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: '#e9ecef',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: getProgressColor(),
                        borderRadius: '10px',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Animated shimmer effect */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: '-100%',
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                            animation: progress > 0 && progress < 100 ? 'shimmer 1.5s infinite' : 'none'
                        }}></div>
                    </div>
                </div>
                <div style={{
                    textAlign: 'center',
                    marginTop: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: status === 'error' ? '#dc3545' : status === 'success' ? '#28a745' : '#033b57',
                    fontFamily: '"Titillium Web", sans-serif'
                }}>
                    {getProgressText()}
                </div>
                
                {/* Add keyframes for shimmer animation */}
                <style jsx>{`
                    @keyframes shimmer {
                        0% { left: -100%; }
                        100% { left: 100%; }
                    }
                `}</style>
            </div>
        );
    };

    if (isLoading) {
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
                <TestHomeHeader />
                <LoadingSpinner />
                <Footer />
            </>
        );
    }
 
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
            
            <TestHomeHeader />
            <div className="container-fluid px-4 py-5 mx-auto">
                <div className="card card0">
                    <div className="d-flex flex-lg-row flex-column-reverse">
                        <div className="card card1">
                            <div className="row justify-content-center my-auto">
                                <div className="col-md-8 col-10 my-4 headingh3">               
                                    <h3 className="mb-4 text-center heading">We Are ProSoft</h3>
                                    <h6 className="msg-info">Sign Up Account</h6>
                                    
                                    <form onSubmit={handleSubmit} noValidate>
                                        <div className="form-group">
                                            <input
                                                type="text"
                                                id="firstname"
                                                name="firstname"
                                                placeholder="First Name"
                                                className={`loginFormInput form-control ${fieldErrors.firstname ? 'is-invalid' : firstname ? 'is-valid' : ''}`}
                                                value={firstname}
                                                onChange={(e) => handleInputChange('firstname', e.target.value)}
                                                disabled={isSubmitting}
                                                style={{
                                                    transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
                                                }}
                                            />
                                            {fieldErrors.firstname && (
                                                <div className="invalid-feedback d-block">
                                                    <small className="text-danger">{fieldErrors.firstname}</small>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="form-group">
                                            <input
                                                type="text"
                                                id="lastname"
                                                name="lastname"
                                                placeholder="Last Name"
                                                className={`loginFormInput form-control ${fieldErrors.lastname ? 'is-invalid' : lastname ? 'is-valid' : ''}`}
                                                value={lastname}
                                                onChange={(e) => handleInputChange('lastname', e.target.value)}
                                                disabled={isSubmitting}
                                                style={{
                                                    transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
                                                }}
                                            />
                                            {fieldErrors.lastname && (
                                                <div className="invalid-feedback d-block">
                                                    <small className="text-danger">{fieldErrors.lastname}</small>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="form-group">
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                placeholder="Email"
                                                className={`loginFormInput form-control ${fieldErrors.email ? 'is-invalid' : email ? 'is-valid' : ''}`}
                                                value={email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                                disabled={isSubmitting}
                                                style={{
                                                    transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
                                                }}
                                            />
                                            {fieldErrors.email && (
                                                <div className="invalid-feedback d-block">
                                                    <small className="text-danger">{fieldErrors.email}</small>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="form-group">
                                            <input
                                                type="text"
                                                id="phone"
                                                name="phone"
                                                placeholder="Phone Number"
                                                className={`loginFormInput form-control ${fieldErrors.phone ? 'is-invalid' : phone ? 'is-valid' : ''}`}
                                                value={phone}
                                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                                disabled={isSubmitting}
                                                style={{
                                                    transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
                                                }}
                                            />
                                            {fieldErrors.phone && (
                                                <div className="invalid-feedback d-block">
                                                    <small className="text-danger">{fieldErrors.phone}</small>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="form-group">
                                            <div className="input-wrapper position-relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    id="password"
                                                    name="password"
                                                    placeholder="Password"
                                                    className={`loginFormInput form-control ${fieldErrors.password ? 'is-invalid' : password ? 'is-valid' : ''}`}
                                                    value={password}
                                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                                    disabled={isSubmitting}
                                                    style={{
                                                        paddingRight: '45px',
                                                        transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-link position-absolute"
                                                    style={{
                                                        right: '8px',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        border: 'none',
                                                        background: 'none',
                                                        color: '#6c757d',
                                                        padding: '0',
                                                        fontSize: '14px'
                                                    }}
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    disabled={isSubmitting}
                                                >
                                                    <i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                                                </button>
                                            </div>
                                            {fieldErrors.password && (
                                                <div className="invalid-feedback d-block">
                                                    <small className="text-danger">{fieldErrors.password}</small>
                                                </div>
                                            )}
                                            {password && (
                                                <PasswordStrengthIndicator strength={passwordStrength} />
                                            )}
                                        </div>
                                        
                                        <div className="form-group">
                                            <div className="input-wrapper position-relative">
                                                <input
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    id="confirmPassword"
                                                    name="confirmPassword"
                                                    placeholder="Confirm Password"
                                                    className={`loginFormInput form-control ${fieldErrors.confirmPassword ? 'is-invalid' : confirmPassword ? 'is-valid' : ''}`}
                                                    value={confirmPassword}
                                                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                                    disabled={isSubmitting}
                                                    style={{
                                                        paddingRight: '45px',
                                                        transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-link position-absolute"
                                                    style={{
                                                        right: '8px',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        border: 'none',
                                                        background: 'none',
                                                        color: '#6c757d',
                                                        padding: '0',
                                                        fontSize: '14px'
                                                    }}
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    disabled={isSubmitting}
                                                >
                                                    <i className={showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                                                </button>
                                            </div>
                                            {fieldErrors.confirmPassword && (
                                                <div className="invalid-feedback d-block">
                                                    <small className="text-danger">{fieldErrors.confirmPassword}</small>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="form-group registerFormGroup">
                                            <select
                                                id="country"
                                                className={`loginFormInput form-control registerFormInput ${country ? 'is-valid' : ''}`}
                                                name="country"
                                                value={country}
                                                onChange={(e) => setCountry(e.target.value)}
                                                disabled={isSubmitting}
                                                style={{
                                                    transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
                                                }}
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
                                                className={`loginFormInput form-control registerFormInput ${workAuthorization ? 'is-valid' : ''}`}
                                                name="workAuthorization"
                                                value={workAuthorization}
                                                onChange={(e) => setWorkAuthorization(e.target.value)}
                                                disabled={isSubmitting}
                                                style={{
                                                    transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
                                                }}
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
                                        
                                        {/* Progress Bar - Only show when submitting */}
                                        {isSubmitting && (
                                            <SubmitProgressBar 
                                                progress={submitProgress} 
                                                status={submitStatus}
                                            />
                                        )}
                                        
                                        <div className="row justify-content-center my-3 px-2 loginbtn">
                                            <button 
                                                className={`btn-block btn-color enhanced-submit-btn ${!isFormValid || isSubmitting ? 'disabled' : ''}`}
                                                type="submit"
                                                disabled={!isFormValid || isSubmitting}
                                                style={{
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                    transition: 'all 0.3s ease',
                                                    opacity: (!isFormValid || isSubmitting) ? 0.6 : 1,
                                                    transform: isSubmitting ? 'scale(0.98)' : 'scale(1)',
                                                    width: isSubmitting ? '240px' : '200px',
                                                    minWidth: isSubmitting ? '240px' : '200px'
                                                }}
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <i className="fas fa-cog fa-spin me-2"></i>
                                                        Creating Account...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fas fa-user-plus me-2"></i>
                                                        Register
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                            <div className="bottom text-center mb-4">
                                <p className="sm-text mx-auto mb-3">
                                    Already have an Account?
                                    <button className="btn btn-white ms-3" disabled={isSubmitting}>
                                        <Link to="/Login" style={{ 
                                            pointerEvents: isSubmitting ? 'none' : 'auto',
                                            opacity: isSubmitting ? 0.6 : 1 
                                        }}>
                                            <i className="fas fa-sign-in-alt me-1"></i>
                                            Login
                                        </Link>
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
};

export default Register;
