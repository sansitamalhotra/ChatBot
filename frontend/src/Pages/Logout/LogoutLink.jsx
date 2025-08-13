import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import API from "../../helpers/API";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Toast configuration constants
const TOAST_CONFIG = {
  position: "top-center",
  autoClose: 5000,
  closeOnClick: true,
  pauseOnHover: true,
  theme: "light"
};

/**
 * Custom hook to handle logout logic
 * @returns {Object} Object containing handleLogout function
 */
export const useLogout = () => {
  const [auth, setAuth] = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
 
  const notifyError = (msg) => toast.error(msg, TOAST_CONFIG);
  const notifySuccess = (msg) => toast.success(msg, TOAST_CONFIG);
 
const handleLogout = async () => {
    try {
      // Call backend logout endpoint if user is authenticated
      if (auth?.token) {
        try {
          const response = await API.post(`api/v1/auth/logout`, {},
            {
              headers: {
                Authorization: `Bearer ${auth.token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (response.data.success) {
            console.log('Server logout successful:', response.data.message);
          }
        } catch (apiError) {
          console.error('Server Logout error:', apiError);
          // Continue with frontend logout even if backend fails
          notifyError('Warning: Server logout may have failed, but you are logged out locally.');
        }
      }

      // Clear frontend auth state
      setAuth({ ...auth, user: null, token: "" });
      localStorage.removeItem("userAuthDetails");
      
      // Clear any other auth-related items in localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      notifySuccess("You have Logged Out Successfully!");
      navigate(location.state || "/Login");
     
      // Use setTimeout to avoid potential issues with immediate reload
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
    } catch (error) {
      console.error("Frontend Logout error:", error);
      
      // Even if there's an error, clear local storage to prevent auth issues
      setAuth({ ...auth, user: null, token: "" });
      localStorage.removeItem("userAuthDetails");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      notifyError("Logout completed with warnings - please refresh if needed");
      navigate("/Login");
    }
  };
 
  return { handleLogout };
};

/**
 * Logout Button Component - can be used as a standalone component
 * @param {Object} props - Component props
 * @param {string} props.className - Optional CSS class
 * @param {React.ReactNode} props.children - Optional custom content
 */
const LogoutUrl = ({ className, children }) => {
  const { handleLogout } = useLogout();  
 
  return (
    <Link
      to="#"
      onClick={(e) => {
        e.preventDefault();
        handleLogout();
      }}
      className={className || ""}
    >
      {children || "Logout"}
    </Link>
  );
};

/**
 * Logout Link Component - for use within navigation that requires <Link>
 * @param {Object} props - Component props
 * @param {string} props.className - Optional CSS class
 * @param {string} props.to - Optional target path (unused)
 * @param {React.ReactNode} props.children - Optional custom content
 */
const LogoutLink = ({ className, to = "/Test-Login", children }) => {
  const { handleLogout } = useLogout();
 
  return (
    <Link
      to="#"
      className={className || ""}
      onClick={(e) => {
        e.preventDefault();
        handleLogout();
      }}
    >
      {children || "Logout"}
    </Link>
  );
};

export { LogoutUrl, LogoutLink };
export default LogoutLink;
