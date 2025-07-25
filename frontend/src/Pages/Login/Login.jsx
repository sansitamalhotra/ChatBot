import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useNavigate, useLocation, useParams, Navigate} from "react-router-dom";
import API from "../../helpers/API";
import { useAuth } from "../../Context/AuthContext";
import TestHomeHeader from '../TestHomeHeader';
import Footer from '../Footer';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './Login.css';

const Login = () => {
  const canonicalUrl = window.location.href; // Get the current URL
  const [email, setEmail] = useState("");
  const emailRegex = /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/;
  const [password, setPassword] = useState("");
  const [auth, setAuth, handleSocialLogin] = useAuth();
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(false);
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
      const { data } = await API.get(`/users/fetchRegUserById/${params._id}`);
      setUser(data.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      notifyErr("Failed to fetch user information");
    }
  };

  // Check if user is already authenticated on component mount
  useEffect(() => {
    if (auth.user && auth.token) {
      redirectAuthenticatedUser(auth.user.role);
    }
  }, []);

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
      handleSocialLogin(token, user);
      // navigate("/Applicant/Dashboard");
    }
  }, [location, navigate, handleSocialLogin]);

  // Function to redirect based on user role
  const redirectAuthenticatedUser = (role) => {
    switch (role) {
      case 1:
        navigate("/Test-Admin/Dashboard");
        return;
      case 2:
        navigate("/Employer/Dashboard");
        return;
      case 0:
        navigate(`/Applicant/Profile/${auth?.user?.userId}`);
        return;
      default:
        return;
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
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
        const userRole = auth.user?.role;
        notifySucc(res.data?.message);
        setAuth({ ...auth, user: res.data.user, token: res.data.token });
        localStorage.setItem("userAuthDetails", JSON.stringify(res.data));
        if (auth.user && userRole === 1) {
          navigate(location.state || "/Admin/Dashboard");
          window.location.reload();
        } else if (auth.user && userRole === 2) {
          navigate(location.state || "/Employer/Dashboard");
          window.location.reload();
        } else if (auth.user && userRole === 0) {
          navigate(location.state || `/Profile/${auth?.user?.userId}`);
          window.location.reload();
        }
      } else {
        notifyErr(res.data.message);
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        notifyErr("Invalid Login Credential!");
      } else {
        notifyErr("Something Went Wrong, Login Failed!!!. Try Again Later");
      }
    }
  };
  
  return (
    <>
    {(() => {
        const userRole = auth.user?.role;
        let linkPath = "/Test-Login";
        if (auth.user && userRole === 1) {
          navigate("/Admin/Dashboard");
          window.location.reload();
        } else if (auth.user && userRole === 2) {
          navigate("/Employer/Dashboard");
          window.location.reload();
        } else if (auth.user && userRole === 0) {
          navigate(`/Profile/${auth?.user?.userId}`);
          window.location.reload();
        } else if (!auth.user) {
      return (
        <>
          <Helmet>
            <link rel="canonical" href={canonicalUrl} />
            <title>Login - ProSoft | Canada, US & India ProsoftSynergies</title>
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
                              {/* <label className="form-control-label text-muted">Email</label> */}
                              <input
                                type="email"
                                id="email"
                                placeholder="Email"
                                className="loginFormInput form-control mb-3"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                              />
                            </div>

                            <div className="form-group">
                              {/* <label className="form-control-label text-muted">Password</label> */}
                              <input
                                type="password"
                                placeholder="Password"
                                className="loginFormInput form-control"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                              />
                            </div>

                            <div className="row justify-content-center my-2 px-2 loginbtn">
                              <button type="submit" className="btn-block btn-color">Login</button>
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
    }
    return <Navigate to={linkPath} />
  }) () }
    </>
  );
};

export default Login;
