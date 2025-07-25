import PropTypes from 'prop-types';
import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import React from "react";
import LoadingSpinner from "../ui/LoadingSpinner/LoadingSpinner";

const ProtectRoute = ({ allowedRoles }) => {

    const { IsLoggedIn, user } = useAuth();

    if (!IsLoggedIn) {
        return <Navigate to="/Login" replace />
    }
    if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/PSPL-Access-Denied" replace />
    }
    return (
        <React.Suspense fallback={<LoadingSpinner />}>
            <Outlet />
        </React.Suspense>
    );
};

ProtectRoute.propTypes = { allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired }

export default ProtectRoute;