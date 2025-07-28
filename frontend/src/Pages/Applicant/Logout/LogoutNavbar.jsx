import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../Context/AuthContext";
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
 
  const handleLogout = () => {
    try {
      setAuth({ ...auth, user: null, token: "" });
      localStorage.removeItem("userAuthDetails");
      notifySuccess("You have Logged Out Successfully!");
      navigate(location.state || "/Test-Login");
      
      // Consider using navigate with a refresh parameter instead of manual reload
      // This avoids potential memory leaks or incomplete navigation
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
      notifyError("Something went wrong during logout!");
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
const LogoutNavbarButton = ({ className, children }) => {
  const { handleLogout } = useLogout();  
 
  return (
    <button
      onClick={handleLogout}
      className={className || "logout-button"}
      type="button" // Explicitly define button type for better accessibility
    >
      {children || (
        <>          
          Logout
          <i className="mdi mdi-logout me-2 text-primary" aria-hidden="true"></i>
        </>
      )}
    </button>
  );
};

/**
 * Logout Link Component - for use within navigation that requires <Link>
 * @param {Object} props - Component props
 * @param {string} props.className - Optional CSS class
 * @param {string} props.to - Optional target path (unused)
 * @param {React.ReactNode} props.children - Optional custom content
 */
const LogoutNavbarLink = ({ className, to = "/Test-Login", children }) => {
  const { handleLogout } = useLogout();
 
  return (
    <Link
      to="#"
      className={className || "dropdown-item"}
      onClick={(e) => {
        e.preventDefault();
        handleLogout();
      }}
    >
      {children || (
        <>
          Logout
          <i className="mdi mdi-logout me-2 text-primary" aria-hidden="true"></i>
        </>
      )}
    </Link>
  );
};

export { LogoutNavbarButton, LogoutNavbarLink };
export default LogoutNavbarLink;