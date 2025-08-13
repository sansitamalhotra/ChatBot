import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import API from "../helpers/API";
import { useAuth } from "../Context/AuthContext";
import ApplyJobApplicationModal from "./ApplyJobApplications/ApplyJobApplicationModal";
import moment from "moment";
import DOMPurify from "dompurify";

import FavIconLogo from "./FaviIcon-Logo.png";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import TestHomeHeader from './TestHomeHeader';
import Footer from './Footer';

import './JobSearchInterface.css';
import { border, fontSize } from "@mui/system";
const { sanitize } = DOMPurify;

const Loader = ({ style }) => (
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


const JobSearchInterface = () => {

  const canonicalUrl = window.location.href; // Get the current URL
  const jobDetailsRef = useRef(null);
  const jobListRef = useRef(null);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setMobileView(window.innerWidth < 768);
      
      // Reset mobile details view when switching from mobile to desktop
      if (window.innerWidth >= 768) {
        setShowMobileDetails(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ===============================================
  const JOBS_PER_PAGE = 6;

  // Authentication
  const [auth, setAuth] = useAuth();

  // State Variables
  const [state, setState] = useState({
    numJobsInDB: 0,
    totalJobs: 0,
    currentPage: 1,
    jobs: [],
    applied: [],
    loading: false,
    searchTerm: "",
    sectors: [],
    selectedSectors: [],
    workModes: [],
    selectedWorkModes: [],
    workExperiences: [],
    selectedWorkExperiences: [], 
    countries: [],
    selectedCountries: [],
    jobsNumberPerPage: JOBS_PER_PAGE
  });

  // Mobile responsiveness state
  const [mobileView, setMobileView] = useState(window.innerWidth < 768);
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const notifyErr = (msg) =>
    toast.error(msg, {
      position: "top-center",
      autoClose: 20000,
      closeOnClick: true,
      pauseOnHover: true,
      theme: "light"
    });

  const notifySucc = (msg) =>
    toast.success(msg, {
      position: "top-center",
      autoClose: 20000,
      closeOnClick: true,
      pauseOnHover: true,
      theme: "light"
    });

  // Fetch jobs with pagination and search
  const fetchJobData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const response = await API.get(`/api/v1/job/fetchAllJobs`, {
        params: { 
          page: state.currentPage, 
          search: state.searchTerm,
          limit: JOBS_PER_PAGE
        }
      });
      const { result, totalJobs, numJobsInDB, totalAppliedApplicant } = response.data;
      
      setState((prev) => ({
        ...prev,
        jobs: result,
        totalJobs,
        applied: totalAppliedApplicant,
        numJobsInDB,
        loading: false
      }));
      
      // Set the first job as selected by default when jobs are loaded
      if (result.length > 0 && !selectedJob) {
        setSelectedJob(result[0]);
      }
      
    } catch (error) {
      console.log(error);
      notifyErr(error.response?.data?.message || "Error fetching jobs");
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [state.currentPage, state.searchTerm, selectedJob]);

  // Fetch filter options
  const fetchFilters = useCallback(async () => {
    try {
      const [sectorResponse, workModeResponse, workExperienceResponse, countryResponse] =
        await Promise.all([
          API.get("/api/v1/job/sectors"),
          API.get("/api/v1/job/workModes"),
          API.get("/api/v1/job/workExperiences"),
          API.get("/api/v1/job/countries"),
        ]);
      setState((prev) => ({
        ...prev,
        sectors: sectorResponse.data.result,
        workModes: workModeResponse.data.result,
        workExperiences: workExperienceResponse.data.result,
        countries: countryResponse.data.result
      }));
    } catch (error) {
      console.log(error);
      notifyErr("Error fetching filter options");
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    fetchFilters();
    fetchJobData();
    
    // Handle window resize for mobile responsiveness
    const handleResize = () => {
      setMobileView(window.innerWidth < 768);
      // Reset mobile details view when switching from mobile to desktop
      if (window.innerWidth >= 768) {
        setShowMobileDetails(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    // window.scrollTo({ top: 0 });
    
    return () => window.removeEventListener('resize', handleResize);
  }, [fetchJobData, fetchFilters]);

  // Apply filters to jobs
  const filteredJobs = useMemo(() => {
    return state.jobs.filter((job) => {
      const matchesSector =
        state.selectedSectors.length === 0 ||
        state.selectedSectors.includes(job.sector.slug);
      const matchesWorkMode =
        state.selectedWorkModes.length === 0 ||
        state.selectedWorkModes.includes(job.workMode.slug);
      const matchesExperience =
        state.selectedWorkExperiences.length === 0 ||
        state.selectedWorkExperiences.includes(job.workExperience.slug);
      const matchCountries =
        state.selectedCountries.length === 0 ||
        state.selectedCountries.includes(job.country.slug);
      return matchesSector && matchesWorkMode && matchesExperience && matchCountries;
    });
  }, [
    state.jobs,
    state.selectedSectors,
    state.selectedWorkModes,
    state.selectedWorkExperiences,
    state.selectedCountries
  ]);

  // Event handlers - MODIFIED to scroll job-details to top instead of the whole page
  const handleJobClick = (job) => {
    setSelectedJob(job);
    
    if (mobileView) {
      setShowMobileDetails(true);
    } else {
      // For desktop view, scroll the job-details div into view smoothly
      // Using setTimeout to ensure the details are rendered before scrolling
      setTimeout(() => {
        if (jobDetailsRef.current) {
          // Scroll the job-details section to the top of its container
          jobDetailsRef.current.scrollTop = 0;
        }
      }, 100);
    }
  };

  const handleBackToList = () => {
    setShowMobileDetails(false);
  };

  const handleSearch = (event) => {
    setState((prev) => ({ ...prev, searchTerm: event.target.value }));
  };

  const handlePageChange = (newPage) => {
    setState((prev) => ({ ...prev, currentPage: newPage }));    
    // If we change pages and are in mobile view with details showing,
    // go back to the list view
    if (mobileView && showMobileDetails) {
        setShowMobileDetails(false);
    }  
};

useEffect(() => {
  if (jobListRef.current) {
      jobListRef.current.scrollTop = 0;
  }
}, [state.currentPage]); // Trigger scroll when currentPage changes

  const handleSelectChange = (type, value) => {
    if (value === "all") {
      setState((prev) => ({ ...prev, [`selected${type}`]: [] }));
    } else {
      setState((prev) => ({
        ...prev,
        [`selected${type}`]: [...prev[`selected${type}`].filter(item => item !== value), value]
      }));
    }
  };
  // Calculate pagination details
  const totalPages = Math.ceil(state.numJobsInDB / JOBS_PER_PAGE);
  const indexOfFirstJob = (state.currentPage - 1) * JOBS_PER_PAGE + 1;
  const indexOfLastJob = Math.min(state.currentPage * JOBS_PER_PAGE, state.totalJobs);

  // ***********************************************
  // Add this new state for modal
  const [showApplyModal, setShowApplyModal] = useState(false);

 

  // Function To Update The Selected Job After Application Success
  const handleJobApplicationSuccess = useCallback((jobId) => {
    // Here I will update state.job to mark this job as applied if Job Application is successful.
    setState(prev => ({
      ...prev,
      jobs: prev.jobs.map(job => {
        if (job._id === jobId) {
          // I will now Add the Application to the Job's Application Array []
          const updatedJobStatus = {
            ...job,
            jobApplications: [
              ...(job.jobApplications || []),
              {
                user: auth.user.userId,
                job: jobId,
                applicationDate: new Date()  // Add current date as application date
              }
            ]
          };
          // Now if this is the currently Selected Job, this will Update it
          if (selectedJob && selectedJob._id === jobId) {
            setSelectedJob(updatedJobStatus);
          }
          return updatedJobStatus;
        }
        return job;
      })
    }));
  }, [auth.user, selectedJob]);

  // Function to handle apply button click
  const handleApplyClick = (job) => {
    setSelectedJob(job);
    setShowApplyModal(true);
  };
  
  return (
    <>
    <Helmet>
        <link rel="canonical" href={canonicalUrl} />
        <title>Search Jobs | ProsoftSynergies</title>
    </Helmet>
    <TestHomeHeader />
    <div className="container-fluid job-search-container">
      <h1 className="job-search-title">Job Search</h1>
      
      <div className="job-search-tabs">
        <button className="tab-active">All ({state.totalJobs})</button>
        {/* <button className="tab">Recommended Jobs</button> */}
        <div className="tab-spacer"></div>
        <button className="copilot-button">
          <svg viewBox="0 0 24 24" className="lightning-icon">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {/* <span className="copilot-text">copilot</span> */}
        </button>
      </div>
      
      <div className="search-section">
        <div className="search-by">Search by</div>
        <div className="search-inputs">
          <div className="search-field">
            <input 
              type="text" 
              placeholder="Search by Job Title or Keyword" 
              className="search-input"
              value={state.searchTerm}
              onChange={handleSearch}
            />
            <span className="search-icon">⌕</span>
          </div>
          <div className="search-field">
            {/* <input 
              type="text" 
              placeholder="Country" 
              className="search-input"
              
            /> */}
              <select 
                className="filter-select"
                onChange={(e) => handleSelectChange('Countries', e.target.value)}
              >
                <option value="all">Countries</option>
                {state.countries.map(country => (
                  <option key={country._id} value={country.slug}>
                    {country.countryName}
                  </option>
                ))}
              </select>
            <span className="location-icon"><i className="fas fa-map-marker-alt"  style={{ color: "#001524" }}
                        ></i></span>
          </div>
          <button className="search-button"  onClick={() => fetchJobData()}>
            <span className="search-button-icon"><i className="fas fa-search"></i></span>
            <span className="search-button-text">Search</span>
          </button>
        </div>
        
        <div className="filter-section">
          <div className="filter">
            <div className="filter-label">Job Sectors</div>
            <select 
              className="filter-select"
              onChange={(e) => handleSelectChange('Sectors', e.target.value)}
            >
              <option value="all">All</option>
              {state.sectors.map(sector => (
                <option key={sector._id} value={sector.slug}>
                  {sector.sectorName}
                </option>
              ))}
            </select>
          </div>
          <div className="filter">
            <div className="filter-label">Job Type Modes</div>
            <select 
              className="filter-select"
              onChange={(e) => handleSelectChange('WorkModes', e.target.value)}
            >
              <option value="all">All</option>
              {state.workModes.map(mode => (
                <option key={mode._id} value={mode.slug}>
                  {mode.workModeName}
                </option>
              ))}
            </select>
          </div>
          <div className="filter">
            <div className="filter-label">Job Experiences</div>
            <select 
              className="filter-select"
              onChange={(e) => handleSelectChange('WorkExperiences', e.target.value)}
            >
              <option value="all">All</option>
              {state.workExperiences.map(exp => (
                <option key={exp._id} value={exp.slug}>
                  {exp.workExperienceName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className={`job-results-container ${mobileView && showMobileDetails ? 'mobile-details-active' : ''}`}>
        <div className={`job-list ${mobileView && showMobileDetails ? 'hidden' : ''}`} ref={jobListRef}>
          {filteredJobs.length === 0 ? (
            <div fallback={<Loader style={{ width: "100px", height: "100px" }} />}>No jobs found. Try adjusting your search criteria.</div>
          ) : (
            filteredJobs.map(job => (
              <div 
                key={job._id} 
                className={`job-card ${selectedJob && selectedJob._id === job._id ? 'selected' : ''}`}
                onClick={() => handleJobClick(job)}
              >
                <div className="job-tag">
                  <i className="fas fa-business-time" style={{ color: "#001524" }}></i>{" "} {job.workMode.workModeName}
                </div>
                <div className="job-title">{job.title}</div>
                <div className="job-company"><i className="fas fa-map-marker-alt"  style={{ color: "#001524" }}
                        ></i>{" "} {job?.country?.countryName}, {job?.province?.provinceName}</div>                
                <div className="job-preview" dangerouslySetInnerHTML={{ __html: job.description.substring(0, 500) }} />

                <div className="job-footer">
                  <div className="job-date">
                    <span className="calendar-icon">Posted:</span>
                    {/* {new Date(job.createdAt).toLocaleDateString()} */}
                    <small>                                         
                      {moment
                        .utc(new Date(job.jobPostDate))
                        .local()
                        .startOf("seconds")
                        .fromNow(true)}{" "}
                      ago
                    </small>{" "}
                  </div>
                  <div className="job-id">Apply Before: {moment(job.expiryDate).format("ll")}</div>
                </div>
                {/* <button className="bookmark-button">🔖</button> */}
                <small><i className="fas fa-briefcase" style={{ color: "#001524" }}></i>{" "} {job?.sector?.sectorName || null}</small>
              </div>
            ))
          )}
          
          {/* Pagination Controls */}
          {filteredJobs.length > 0 && (
            <div className="pagination-container">
              <div className="pagination-results">
                Found {indexOfFirstJob}-{indexOfLastJob} of {state.totalJobs} jobs
              </div>
              <div className="pagination-controls">
                <button 
                  className={`pagination-arrow ${state.currentPage === 1 ? 'disabled' : ''}`}
                  onClick={() => handlePageChange(state.currentPage - 1)}
                  disabled={state.currentPage === 1}
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && state.currentPage > 3) {
                    pageNum = state.currentPage + i - 2;
                    if (pageNum > totalPages) return null;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`pagination-number ${state.currentPage === pageNum ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button 
                  className={`pagination-arrow ${state.currentPage === totalPages ? 'disabled' : ''}`}
                  onClick={() => handlePageChange(state.currentPage + 1)}
                  disabled={state.currentPage === totalPages}
                >
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          )}
        </div>        
        {selectedJob && (!mobileView || showMobileDetails) && (
          <div className="job-details" ref={jobDetailsRef}>
            {mobileView && (
              <button className="back-button" onClick={handleBackToList}>
                ← Back to job list
              </button>
            )}
            <div className="job-details-header">
              <h2 className="job-details-title">{selectedJob.title}</h2>
              {/* <div className="job-details-company">{selectedJob.company}</div> */}
              <div className="job-details-location">
                <span className="location-pin"><i className="fas fa-map-marker-alt" style={{ color: "#001524" }}></i>{" "}</span>
                {selectedJob.country.countryName}, {selectedJob?.province?.provinceName}
                <span className={`job-type-tag ${selectedJob.workMode.slug}`}>
                  {selectedJob.workMode.workModeName}
                </span>
                <span className="info-icon"><i className="fas fa-business-time" style={{ color: "#001524" }}></i>{" "} </span>
              </div>
              
              <div className="job-actions">
                {/* <button className="apply-button">Apply Now</button> */}
                {!auth.user ? (
                  <>
                    <Link to={`/Test-Login`} className="apply-button">
                      Login To Apply
                    </Link>
                  </>
                ) : auth.user?.role === 1 ||
                  auth.user?.role === 2 ? (
                  <>
                    <Link to="#" className="apply-button rounded-0 border-0">Not Allowed</Link>
                  </>
                ) : (
                  <>
                    {selectedJob.jobApplications?.find(
                      (application) =>
                        application.user ===
                          auth.user.userId &&
                        application.job === selectedJob._id
                    ) ? (
                      <>
                       {selectedJob.jobApplications
                        .filter((application) => application.user === auth.user.userId)
                        .map((application) => (
                          <Link key={application._id} to="#" className="appliedText apply-button rounded-0 border-0">
                            <span>                              
                              {/* Display the application date */}
                              {application.applicationDate && (
                                <span> Applied {" "}
                                  {moment
                                  .utc(new Date(application.applicationDate))
                                  .local()
                                  .startOf("seconds")
                                  .fromNow(true)}{" "}
                                  ago
                                </span>
                              )}
                            </span>
                          </Link>
                        ))}
                      </>
                    ) : (
                      <>
                      {selectedJob.jobApplications.filter((application) => 
                         application.user === auth.user.userId).length === 0 && (
                         <Link
                           onClick={() => handleApplyClick(selectedJob)}
                           className="apply-button"
                         >
                           Apply Now
                         </Link>
                       )}
                     </>
                    )}
                  </>
                )}
              </div>
              
              <div className="job-meta">
                <div className="job-meta-item">
                  <span className="job-date-icon">
                    <i className="fas fa-calendar-days" style={{ color: '#900'}}></i>
                  </span>
                  <span className="job-date">
                    Posted:  {moment
                        .utc(new Date(selectedJob.jobPostDate))
                        .local()
                        .startOf("seconds")
                        .fromNow(true)}{" "}
                      ago
                  </span>
                </div>
                <div className="job-meta-item">
                  <span className="job-contract-icon"><i className="fas fa-briefcase" style={{ color: "#001524" }}></i>{" "}</span>
                  <span className="job-contract">Sector:  {selectedJob?.sector?.sectorName || null}</span>
                </div>
                {selectedJob.startDate && (
                  <div className="job-meta-item">
                    <span className="job-start">Apply Before: {moment(selectedJob.expiryDate).format("ll")}</span>
                  </div>
                )}
                {/* <div className="job-meta-item">
                  <span className="job-ats-id">ATS ID #{selectedJob._id.substring(0, 6)}</span>
                </div> */}
              </div>
            </div>
            
            <div className="job-description-section active">
              <h3 className="section-title">Job Description</h3>
              <div className="job-full-title">{selectedJob.title}</div>
              {/* <div className="job-full-description">{selectedJob.description}</div> */}
              <div
                      key={selectedJob.description}
                      className="job-full-description"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(selectedJob.description) || ""
                      }}
                    />
            </div>
          </div>
        )}
      </div>
    </div>
    {/* Add the modal component */}
    {/* Add the modal component with new onApplicationSuccess prop */}
    {selectedJob && (
      <ApplyJobApplicationModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        jobData={selectedJob}  // Pass the selected job data to the modal
        onApplicationSuccess={() => handleJobApplicationSuccess(selectedJob._id)}
      />
    )}
    <Footer />
    </>
  );
};

export default JobSearchInterface;
