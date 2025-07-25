import PropTypes from "prop-types";
import { createContext, useEffect, useReducer } from "react";
import { authApi } from "../api/authApi";
import { toast } from 'react-hot-toast';
import { decodeToken } from "../utils/jwt_decode";

const initialState = {
    IsLoggedIn: false,
    isInitialized: false,
    user: null,
};

const handlers = {
    INITIALIZE: (state, action) => {
      const { IsLoggedIn, user } = action.payload;
  
      return {
        ...state,
        IsLoggedIn,
        isInitialized: true,
        user,
      };
    },
    LOGIN: (state, action) => {
      const { user } = action.payload;
      return {
        ...state,
        IsLoggedIn: true,
        user,
      };
    },
    LOGOUT: (state) => {
      return {
        ...state,
        IsLoggedIn: false,
        user: null,
      };
    },
    REGISTER: (state, action) => {
      const { user } = action.payload;
  
      return {
        ...state,
        IsLoggedIn: false,
        user,
      };
    },
    VERIFY_EMAIL: (state, action) => {
        const { user } = action.payload;
        return {
          ...state,
          IsLoggedIn: true,
          user,
        };
      },
      RESET_PASSWORD: (state, action) => {
        const { user } = action.payload;
        return {
          ...state,
          IsLoggedIn: true,
          user,
        };
      },
};

const reducer = (state, action) => 

    handlers[action.type] ? handlers[action.type](state, action) : state;

    const AuthContext = createContext({
        ...initialState,
        platform: "JWT",
        login: () => Promise.resolve(),
        logout: () => Promise.resolve(),
        register: () => Promise.resolve(),
        verifyemail: () => Promise.resolve(),
        resetpassword: () => Promise.resolve(),
    });
    
    export const AuthProvider = (props) => {

        const { children } = props;
        const [state, dispatch] = useReducer(reducer, initialState);

        useEffect(() => {
            const initialize = async () => {
              try {
                const userAuthDetails = JSON.parse(
                  window.localStorage.getItem("userAuthDetails")
                );
                if (userAuthDetails) {
        
                  dispatch({
                    type: "INITIALIZE",
                    payload: {
                      IsLoggedIn: true,
                      user: userAuthDetails,
                    },
                  });
                } else {
                  dispatch({
                    type: "INITIALIZE",
                    payload: {
                      IsLoggedIn: false,
                      user: null,
                    },
                  });
                }
              } catch (err) {
                console.error(err);
                dispatch({
                  type: "INITIALIZE",
                  payload: {
                    IsLoggedIn: false,
                    user: null,
                  },
                });
              }
            };
        
            initialize();
          }, []);
        
        const login = async (email, password) => {
            const res = await authApi.login({ email, password });
            const user = decodeToken(res)
            localStorage.setItem("userAuthDetails", JSON.stringify(user));
            dispatch({
              type: "LOGIN",
              payload: {
                user,
              },
            });
        };
        const verifyemail = async (activationToken) => {
            const res = await authApi.emailverification(activationToken);
            const user = decodeToken(res)
            localStorage.setItem("userAuthDetails", JSON.stringify(user));
            dispatch({
              type: "VERIFY_EMAIL",
              payload: {
                user,
              },
            });
        };
        const resetpassword = async (resetPasswordToken, password, confirmPassword) => {
            const user = await authApi.resetpassword({ resetPasswordToken, password, confirmPassword });
            localStorage.setItem("userAuthDetails", JSON.stringify(user));
            dispatch({
              type: "RESET_PASSWORD",
              payload: {
                user,
              },
            });
        };
        const register = async (data) => {
            const user = await authApi.register(data);
            if (user.success === true) {
              toast.success(user.message);
            }
        };
        const logout = async () => {
            try {
              await authApi.Logout()
              localStorage.removeItem("userAuthDetails");
              localStorage.removeItem("step");
              dispatch({ type: "LOGOUT" });
            } catch (err) {
              console.error(err);
            }
        };

        return (
            <AuthContext.Provider
              value={{
                ...state,
                platform: "JWT",
                login,
                logout,
                register,
                verifyemail,
                resetpassword,
              }}
            >
              {children}
            </AuthContext.Provider>
        );
    };
AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export default AuthContext;
