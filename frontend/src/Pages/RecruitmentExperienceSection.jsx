import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './RecruitmentCounterSection.css';
import API from "../helpers/API";

/**
 * CounterUp component for animating numerical values
 * @param {Object} props - Component props
 * @param {number} props.end - The final value to count up to
 * @param {number} props.duration - Animation duration in milliseconds
 * @param {string} props.label - Main label text
 * @param {string} props.subLabel - Secondary label text
 * @param {number} props.index - Index for animation timing
 * @returns {JSX.Element} - Rendered component
 */
const CounterUp = ({ end, duration, label, subLabel, index }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Skip animation if end value is 0 or invalid
    if (!end || end <= 0) return;
    
    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);

      // Update count value based on animation progress
      setCount(Math.floor(percentage * end));

      // Continue animation if not complete
      if (percentage < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    // Start animation
    animationFrame = requestAnimationFrame(animate);

    // Cleanup function to cancel animation on unmount
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration]);

  return (
    <div className="counter-card" style={{ "--index": index }}>
      <h2 className="counter-number">{count.toLocaleString()}{" "}+</h2>
      <p className="counter-label">
        {label}<br />
        <span className="counter-sublabel">{subLabel}</span>
      </p>
    </div>
  );
};

/**
 * Recruitment Experience Section component showing statistics
 * @returns {JSX.Element} - Rendered component
 */
const RecruitmentExperienceSection = () => {
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalAppliedApplicant: 0,
    totalRegUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const duration = 2000; // Animation duration in milliseconds (reduced for better UX)

  // Toast notification configuration
  const toastConfig = useMemo(() => ({
    position: "top-center",
    autoClose: 5000,
    closeOnClick: true,
    pauseOnHover: true,
    theme: "light"
  }), []);
  
  // Notification utilities
  const notifyErr = useCallback((msg) => 
    toast.error(msg, toastConfig), 
    [toastConfig]
  );

  // Fetch data using the same approach as JobSearchInterface
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // FIXED: Change endpoint to match the working one in JobSearchInterface
      const jobsResponse = await API.get('/api/v1/job/fetchAllJobs');
      
      // For the other endpoints, we'll use a fallback approach with error handling
      let applicantsData = { totalAppliedApplicant: 0 };
      let usersData = { totalRegUsers: 0 };
      
      try {
        // Try to fetch applied applicants data
        const applicantsResponse = await API.get('/api/v1/job/applicantAppliedJobs');
        applicantsData = applicantsResponse.data;
      } catch (applicantsError) {
        console.warn('Could not fetch applicants data:', applicantsError);
      }
      
      try {
        // Try to fetch users data
        const usersResponse = await API.get('/api/v1/job/fetchRegUsers');
        usersData = usersResponse.data;
      } catch (usersError) {
        console.warn('Could not fetch users data:', usersError);
      }
      
      // Update state with fetched data, using fallbacks where needed
      setStats({
        totalJobs: jobsResponse.data.totalJobs || jobsResponse.data.numJobsInDB || 0,
        totalAppliedApplicant: applicantsData.totalAppliedApplicant || 0,
        totalRegUsers: usersData.totalRegUsers || 0
      });
    } catch (error) {
      console.error('Error fetching counter data:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch statistics';
      setError(errorMessage);
      notifyErr(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [notifyErr]);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Define counter data
  const counterData = useMemo(() => [
    { 
      end: stats.totalJobs, 
      label: "Active Job Openings", 
      subLabel: "Daily Updates", 
      index: 1 
    },
    { 
      end: stats.totalAppliedApplicant, 
      label: "Active Job Seekers", 
      subLabel: "Daily Updates", 
      index: 2 
    },
    { 
      end: stats.totalRegUsers, 
      label: "Candidates Submitted", 
      subLabel: "Daily Updates", 
      index: 3 
    }
  ], [stats]);

  return (
    <section className="recruitment-section">
      <h1 className="recruitment-title">Extensive Recruitment Experience Spanning Over 6 Years.</h1>

      <div className="counters-container">
        {loading ? (
          <div className="loading-indicator">Loading statistics...</div>
        ) : error ? (
          <div className="error-message">
            Could not load statistics. Please try again later.
          </div>
        ) : (
          counterData.map((item) => (
            <CounterUp
              key={item.index}
              end={item.end}
              duration={duration}
              label={item.label}
              subLabel={item.subLabel}
              index={item.index}
            />
          ))
        )}
      </div>
    </section>
  );
};

export default RecruitmentExperienceSection;
