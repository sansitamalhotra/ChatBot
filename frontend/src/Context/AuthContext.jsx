//frontend/src/Context/AuthContext.jsx
import React, { useState, useEffect, useContext, createContext } from "react";
import API from "../helpers/API";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({ user: null, token: "" });
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (auth?.token) {
            API.defaults.headers.common["Authorization"] = `Bearer ${auth.token}`;
        } else {
            delete API.defaults.headers.common["Authorization"];
        }
    }, [auth?.token]);

    useEffect(() => {
        const initializeAuth = () => {
           try {
                const data = localStorage.getItem("userAuthDetails");
                if (data) {
                const parseData = JSON.parse(data);
                if (parseData.user && parseData.token) {
                    // Ensure user has both _id and userId
                    const user = {
                    ...parseData.user,
                    _id: parseData.user._id || parseData.user.userId,
                    userId: parseData.user.userId || parseData.user._id
                    };
                    setAuth({ user, token: parseData.token });
                }
                }
            } finally {
                setIsInitialized(true);
            }
        };

        initializeAuth();
    }, []);

    const updateAuth = (authData) => {
        setAuth(authData);
        if (authData?.user && authData?.token) {
            localStorage.setItem("userAuthDetails", JSON.stringify(authData));
        } else {
            localStorage.removeItem("userAuthDetails");
        }
    };

    const logout = () => {
        setAuth({ user: null, token: "" });
        localStorage.removeItem("userAuthDetails");
        delete API.defaults.headers.common["Authorization"];
    };

    return (
        <AuthContext.Provider value={[auth, updateAuth, isInitialized, logout]}>
            {children}
        </AuthContext.Provider>
    );
};

const useAuth = () => useContext(AuthContext);

export { useAuth, AuthProvider };
