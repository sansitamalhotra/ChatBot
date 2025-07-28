import React, { useState, useEffect, useContext, createContext } from "react";
import API from "../helpers/API";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({ user: null, token: "" });

    // Set the default API Authorization header
    API.defaults.headers.common["Authorization"] = auth?.token;

    useEffect(() => {

        const data = localStorage.getItem("userAuthDetails");
        
        if (data) {
            const parseData = JSON.parse(data);
            setAuth({ ...auth, user: parseData.user, token: parseData.token });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <AuthContext.Provider value={[auth, setAuth]}>
            {children}
        </AuthContext.Provider>
    );
};

const useAuth = () => useContext(AuthContext);
export { useAuth, AuthProvider };