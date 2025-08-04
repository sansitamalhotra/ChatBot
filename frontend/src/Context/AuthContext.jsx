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
                        setAuth({ 
                            user: parseData.user, 
                            token: parseData.token 
                        });
                    }
                }
            } catch (error) {
                localStorage.removeItem("userAuthDetails");
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
