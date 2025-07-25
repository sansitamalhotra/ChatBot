import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ApplyJobApplicationModal.css";
import API from "../../helpers/API";
import { useAuth } from "../../Context/AuthContext";
import { toast } from "react-toastify";

const ApplyJobApplicationModal = ({ isOpen, onClose, jobData, onApplicationSuccess }) => {
  const [auth] = useAuth();
  const [salaries, setSalaries] = useState([]);
  const [salary, setSalary] = useState("");
  const [rate, setRate] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [jobDetails, setJobDetails] = useState(null);
  const [applicationMethod, setApplicationMethod] = useState(null); // "resume" or "email"
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const params = useParams();
  const [resume, setResume] = useState(null);
  const [jobMatrix, setJobMatrix] = useState(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState(null);

  // Functions for toast notifications
  const notifySucc = (message) => {
    toast.success(message, {
      position: "top-center",
      autoClose: 5000,
      closeOnClick: true,
      pauseOnHover: true,
      theme: "light"
    });
  };

  const notifyErr = (message) => {
    toast.error(message, {
      position: "top-center",
      autoClose: 5000,
      closeOnClick: true,
      pauseOnHover: true,
      theme: "light"
    });
  };

  const fetchJob = async () => {
    try {
      const { data } = await API.get(`/api/v1/job/viewJob/${params.slug}`);
      setJob(data.job);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchSalaries();
  }, []);

  // Use jobData from props if available
  useEffect(() => {
    if (jobData) {
      setJobDetails(jobData);
    }
  }, [jobData]);

  useEffect(() => {
    if (params?.slug) fetchJob();
  }, [params?.slug]);

  // Fetch job details when modal opens if jobData is not provided
  useEffect(() => {
    if (isOpen) {
      fetchSalaries();      
      // Only fetch job details if not already provided via props
      if (!jobData && params?.slug) {
        fetchJobDetails(params.slug);
      }
    }
  }, [isOpen, params?.slug, jobData]);

  const fetchJobDetails = async (slug) => {
    setIsLoading(true);
    try {
      const response = await API.get(`/api/v1/job/viewJob/${slug}`);
      setJobDetails(response.data.job);
    } catch (error) {
      console.error("Error fetching job details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSalaries = async () => {
    try {
      const { data } = await API.get("/api/v1/salary/fetchSalaries");
      if (data?.success) {
        setSalaries(data?.salary);
      }
    } catch (error) {
      console.log(error);
      notifyErr("Failed to retrieve salary types");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) { // 5MB max
      setResumeFile(file);
      setResume(file);
      uploadResume(file);
    } else if (file) {
      notifyErr("File size must be less than 5MB");
      setResumeFile(null);
    }
  };

  const uploadResume = async (file) => {
    setIsLoading(true);
    setUploadProgress(0);
    setUploadSuccess(false);
    
    // Simulate upload progress
    const simulateUpload = () => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploadProgress(100);
          setUploadSuccess(true);
          setIsLoading(false);
          notifySucc("Resume uploaded successfully!");
        } else {
          setUploadProgress(progress);
        }
      }, 300);
    };
    
    // Start the simulated upload
    simulateUpload();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add("drag-over");
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("drag-over");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("drag-over");
    
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size <= 5 * 1024 * 1024) { // 5MB max
        const allowedTypes = [".doc", ".docx", ".pdf"];
        const fileExtension = "." + file.name.split('.').pop().toLowerCase();
        
        if (allowedTypes.includes(fileExtension)) {
          setResumeFile(file);
          setResume(file);
          uploadResume(file);
        } else {
          notifyErr("Only DOC, DOCX or PDF files are supported");
        }
      } else {
        notifyErr("File size must be less than 5MB");
      }
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const validateStep1 = () => {
    let isValid = true;
    
    if (!resumeFile) {
      notifyErr("Resume is required");
      isValid = false;
    }
    
    if (!salary) {
      notifyErr("Salary expectation is required");
      isValid = false;
    }
    
    return isValid;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      handleSubmitJobApplicationForm();
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const startApplication = () => {
    if (resumeFile && uploadSuccess) {
      setApplicationMethod("resume");
      setCurrentStep(1);
    } else {
      notifyErr("Please upload your resume to continue");
    }
  };

  // Reset form function to clear all form state
  const resetForm = () => {
    setSalary("");
    setRate("");
    setResumeFile(null);
    setResume(null);
    setCurrentStep(1);
    setApplicationMethod(null);
    setUploadProgress(0);
    setUploadSuccess(false);
  };

  const handleSubmitJobApplicationForm = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
  
    const formData = new FormData();
    formData.append("resume", resume);
    formData.append("jobMatrix", jobMatrix);
    formData.append("salary", salary);
    formData.append("rate", rate);
  
    const config = {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    };
    
    // Get job slug from jobDetails or params
    const jobSlug = jobDetails?.slug || params?.slug;
    
    if (!jobSlug) {
      notifyErr("Failed to Fetch This JOB ID Details. Check Your Code Logic & try again.");
      setIsLoading(false);
      return;
    }
  
    try {
      setLoading(true);
      const response = await API.post(
        `/api/v1/apply/jobapplication/${jobSlug}`,
        formData,
        config
      );
      
      // Single success notification
      notifySucc(response.data.message);
      
      // Update parent component if callback exists
      if (onApplicationSuccess && jobData?._id) {
        onApplicationSuccess(jobData._id);
      }
      
      // Reset form state
      resetForm();
      
      // Close modal
      onClose();
    } catch (error) {
      console.log(error.response?.data);
      notifyErr(error.response?.data?.message || "An error occurred while submitting application");
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  // Handle click outside to close modal
  const handleOutsideClick = (e) => {
    if (e.target.className === "modal-overlay") {
      onClose();
    }
  };

  // Clean up when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOutsideClick}>
      <div className="modal-container">
        <div className="modal-header">
          <h2>Apply to {jobDetails?.title || "Job"}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          <div className="job-info">
            <h3>{jobDetails?.title}</h3>
            <div className="job-location">
              <i className="fas fa-map-marker-alt"></i> 
              {jobDetails?.country?.countryName}, {jobDetails?.province?.provinceName || ""}
              {jobDetails?.workMode?.workModeName && (
                <span className="job-tag">{jobDetails.workMode.workModeName}</span>
              )}
            </div>
          </div>

          {/* Application Process */}
          <div className="application-steps">
            {/* Progress indicator */}
            {applicationMethod && (
              <div className="steps-indicator">
                <div className={`step ${currentStep >= 1 ? "active" : ""}`}>1</div>
                <div className="step-line"></div>
                <div className={`step ${currentStep >= 2 ? "active" : ""}`}>2</div>
              </div>
            )}
            
            {!applicationMethod && (
              <>
                <p className="step-description">
                  To continue, please start your application process by selecting one of the following options:
                </p>
                <div className="application-method-buttons">
                  <button 
                    className={`method-button ${applicationMethod === "resume" ? "active" : ""}`} 
                    onClick={() => setApplicationMethod("resume")}
                  >
                    apply with resume
                  </button>
                  <button 
                    className={`method-button ${applicationMethod === "email" ? "active" : ""}`} 
                    onClick={() => setApplicationMethod("email")}
                  >
                    apply with email
                  </button>
                </div>
                <p className="upload-instruction">Upload your resume to get started!</p>
              </>
            )}

            {applicationMethod && currentStep === 1 && (
              <div className="application-form step-1">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="firstname"
                    name="firstname"
                    value={auth?.user?.firstname}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="name">Last Name</label>
                  <input
                    type="text"
                    id="lastname"
                    name="lastname"
                    value={auth?.user?.lastname}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={auth?.user?.email}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={auth?.user?.phone || ""}
                    disabled
                  />
                </div>

                <div className="form-wrapper">
                  <div className="row">
                    <div className="col-6 col-sm-6">
                      <label htmlFor="salary">Salary Expectation:</label>
                      <select
                        className="form-control"
                        value={salary}
                        onChange={(e) => setSalary(e.target.value)}
                      >
                        <option value="">Salary Expectation</option>
                        {salaries.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.salaryName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6 col-sm-6">
                      <label htmlFor="rate">Rate:</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="$"
                        name="rate"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {applicationMethod && currentStep === 2 && (
              <div className="application-form step-2">
                <div className="confirmation-message">
                  <h4>Application Review</h4>
                  <p>Please review your application details before submitting:</p>
                  <div className="review-details">
                    <div className="review-item">
                      <span className="review-label">Name:</span>
                      <span className="review-value">{auth?.user?.firstname} {auth?.user?.lastname}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Email:</span>
                      <span className="review-value">{auth?.user?.email}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Phone:</span>
                      <span className="review-value">{auth?.user?.phone || "Not provided"}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Resume:</span>
                      <span className="review-value">{resumeFile?.name}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Salary Expectation:</span>
                      <span className="review-value">
                        {salaries.find(s => s._id === salary)?.salaryName || "Not specified"}
                      </span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Rate:</span>
                      <span className="review-value m">$ {" "} {rate || "Not specified"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="upload-progress-container">
                <div className="upload-progress-label">Uploading: {uploadProgress}%</div>
                <div className="upload-progress-bar">
                  <div 
                    className="upload-progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {uploadProgress === 100 && uploadSuccess && (
              <div className="upload-success">
                <i className="fas fa-check-circle"></i>
                <span>Resume uploaded successfully!</span>
              </div>
            )}

            {applicationMethod && (
              <div className="modal-actions">
                {currentStep === 2 && (
                  <button className="back-button" onClick={handleBack} disabled={isLoading}>
                    Back
                  </button>
                )}
                <button 
                  className="action-button" 
                  onClick={handleNext}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : currentStep === 1 ? "Next" : "Submit Application"}
                </button>
              </div>
            )}
            
            {!applicationMethod && (
              <div className="resume-upload-section">
                <div 
                  className={`file-drop-area ${resumeFile ? 'has-file' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <i className="fas fa-cloud-upload-alt"></i>
                  <p>{resumeFile ? resumeFile.name : "Select a file or drag and drop here"}</p>
                  <p className="file-support-text">Supports DOC, DOCX or PDF, file size no more than 5MB</p>
                  <input
                    type="file"
                    accept=".doc,.docx,.pdf"
                    onChange={handleFileChange}
                    className="file-input"
                    ref={fileInputRef}
                  />
                </div>
                <button className="upload-button" onClick={handleUploadClick}>
                  upload
                </button>
                
                {resumeFile && (
                  <div className="selected-file">
                    <span>Selected: {resumeFile.name}</span>
                    <button 
                      className="remove-file-btn"
                      onClick={() => {
                        setResumeFile(null);
                        setResume(null);
                        setUploadSuccess(false);
                        setUploadProgress(0);
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {!applicationMethod && (
              <button 
                className={`start-application-button ${resumeFile && uploadSuccess ? 'active' : ''}`}
                disabled={!resumeFile || !uploadSuccess}
                onClick={startApplication}
              >
                start application
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyJobApplicationModal;
