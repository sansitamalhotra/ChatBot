import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useNavigate, useLocation, useParams, Navigate } from "react-router-dom";
import API from "../../helpers/API";
import { useAuth } from "../../Context/AuthContext";
import TestHomeHeader from '../TestHomeHeader';
import Footer from '../Footer';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './Login.css';

const Login = () => {
  const canonicalUrl = window.location.href;
  const [email, setEmail] = useState("");
  const emailRegex = /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/;
  const [password, setPassword] = useState("");
  const [auth, setAuth, isInitialized] = useAuth(); // Get isInitialized from useAuth
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(false);
  const [redirectPath, setRedirectPath] = useState(null); // Track redirect path
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOAuth, setIsOAuth] = useState(false);

  const notifyErr = (msg) =>
    toast.error(msg, {
      position: "top-center",
      autoClose: 5000,
      closeOnClick: true,
      pauseOnHover: true,
      theme: "light"
    });
  
  const notifySucc = (msg) =>
    toast.success(msg, {
      position: "top-center",
      autoClose: 3000,
      closeOnClick: true,
      pauseOnHover: true,
      theme: "light"
    });

  const fetchRegUserById = async () => {
    try {
      const { data } = await API.get(`/api/v1/users/fetchRegUserById/${params._id}`);
      setUser(data.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      notifyErr("Failed to fetch user information");
    }
  };

  // Function to get redirect path based on user role
  const getRedirectPath = (role) => {
    switch (role) {
      case 1:
        return "/Admin/Dashboard";
      case 2:
        return "/Employer/Dashboard";
      case 3:
        return "/Super-Admin/Dashboard";
      case 0:
        return `/Applicant/Profile/${auth?.user?.userId}`;
      default:
        return null;
    }
  };

  // Check if user is already authenticated - ONLY after auth is initialized
  useEffect(() => {
    if (isInitialized && auth?.user && auth?.token) {
      const redirectTo = getRedirectPath(auth.user.role);
      if (redirectTo) {
        console.log("User already authenticated, redirecting to:", redirectTo);
        setRedirectPath(redirectTo);
      }
    }
  }, [isInitialized, auth?.user, auth?.token]);

  // Fetch registered user details if ID is provided
  useEffect(() => {
    if (params?._id) fetchRegUserById();
  }, [params?._id]);

  // Handle OAuth redirects
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get("userAuthDetails");
    if (token) {
      setIsOAuth(true);
      const user = {}; // Fetch user details if necessary
      // handleSocialLogin(token, user); // Uncomment if you have this function
    }
  }, [location.search]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!email) {
      notifyErr("Email Field Cannot be Empty");
      setLoading(false);
      return;
    }
    if (!emailRegex.test(email)) {
      notifyErr("Invalid Email Address");
      setLoading(false);
      return;
    }
    if (!password) {
      notifyErr("Password Field Cannot be Empty");
      setLoading(false);
      return;
    }

    try {
      const res = await API.post(
        "/api/v1/auth/login",
        { email, password },
        {
          headers: {
            "Access-Control-Max-Age": 86400
          }
        }
      );

      if (res.data.success) {
        notifySucc(res.data?.message);
        
        // Update auth context with the new user data
        const newAuthData = {
          user: res.data.user,
          token: res.data.token
        };
        
        setAuth(newAuthData);
        
        // Determine redirect path based on the NEW user data from response
        const redirectTo = getRedirectPath(res.data.user.role);
        
        if (redirectTo) {
          console.log("Login successful, redirecting to:", redirectTo);
          // Use navigate with replace to prevent back button issues
          navigate(redirectTo, { replace: true });
        }
      } else {
        notifyErr(res.data.message);
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error.response && error.response.status === 400) {
        notifyErr("Invalid Login Credential!");
      } else {
        notifyErr("Something Went Wrong, Login Failed!!!. Try Again Later");
      }
    } finally {
      setLoading(false);
    }
  };

  // If redirectPath is set, redirect immediately
  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  // Show loading while auth context is initializing
  if (!isInitialized) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Only render login form if user is NOT authenticated
  return (
    <>
      <Helmet>
        <link rel="canonical" href={canonicalUrl} />
        <title>Login - ProsoftSynergies | Canada, US & India ProsoftSynergies</title>
        <meta
          name="description"
          content="Login to ProsoftSynergies, One of the Leading Global Job Platform Connecting Employers and Job Seekers Across Canada, the US, and India. Secure Access To Your Account and Explore Endless Career Opportunities."
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
      <div className="container-fluid px-4 py-5 mx-auto">
        <div className="card card0">
          <div className="d-flex flex-lg-row flex-column-reverse">
            <div className="card card1">
              <div className="row justify-content-center my-auto">
                <div className="col-md-8 col-10 my-5">
                  <div className="row justify-content-center px-5 mb-3">
                    {/* <img id="logo" src={Logo} alt="Thinkbeyond Logo" /> */}
                  </div>
                  <h3 className="mb-5 text-center heading mt-5">We Are ProSoft</h3>
                  <h6 className="msg-info">Please Login to Your ProSoft Account</h6>
                  
                  <form onSubmit={handleLoginSubmit}>
                    <div className="form-group">
                      <input
                        type="email"
                        id="email"
                        placeholder="Email"
                        className="loginFormInput form-control mb-3"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group">
                      <input
                        type="password"
                        placeholder="Password"
                        className="loginFormInput form-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                      />
                    </div>

                    <div className="row justify-content-center my-2 px-2 loginbtn">
                      <button 
                        type="submit" 
                        className="btn-block btn-color"
                        disabled={loading}
                      >
                        {loading ? "Logging in..." : "Login"}
                      </button>
                    </div>
                    
                    <div className="row justify-content-center my-2 forgotpassword">
                      <Link to="/Forgot-Password-Reset-Request">
                        <small className="text-muted">Forgot Password?</small>
                      </Link>
                    </div>
                    
                    <div className="bottom text-center mb-5">
                      <p className="sm-text mx-auto mb-3">
                        Don't have an account?
                        <button className="btn btn-white ms-3">
                          <Link to="/Register">Register</Link>
                        </button>
                      </p>
                    </div>
                  </form>
                </div>
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

export default Login;
