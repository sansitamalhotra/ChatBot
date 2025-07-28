import jwt from "jsonwebtoken";
import User from "../models//userModel";

const isAuthenticated = async (req, res, next) => {
    try {
        const isAuthorized = req.headers.authorization || req.headers.Authorization;
        if (!isAuthorized) {
            return res.status(401).json("Access Denied!!! Not Unauthorized, You do not have permission to access this page");
        }
        const token = isAuthorized.slice(7, isAuthorized.length); // Bearer XXXXXXXXX
        if (!token) {
            return res.status(401).json("Access Denied!!! Not Unauthorized, You do not have permission to access this page");
        }
        try {
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY);
            const user = await User.findById(decoded.userId);

            if (!user) {
                return res.status(401).json("Opps!!!, User does not exist, Kindly Regsister");
            }

            // Attch the user object to the request for authorization
            req.user = user;
            next();
        }
        catch (error) {
            return res.status(401).json("Access Denied!!! Not Unauthorized, You do not have permission to access this page");
        }
    }
    catch (error)
    {
        return res.status(403).json("Access Denied!!! Forbidden, You do not have permission to access this page");
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === "ADMIN") {
        next();
    } else {
        res.status(403).json("For Admins Only!!! Forbidden, You do not have permission to access this page");
    }
};

const isRecruiter = (req, res, next) => {
    if (req.user && req.user.role === "RECRUITER") {
        next();
    } else {
        res.status(403).json("For Recruiters Only!!! Forbidden, You do not have permission to access this page");
    }
};

export { isAuthenticated, isAdmin, isRecruiter };