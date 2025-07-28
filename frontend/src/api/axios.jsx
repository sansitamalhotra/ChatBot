import axios from 'axios';
import { authApi } from './authApi';
import { decodeToken } from '../utils/jwt_decode';

const axiosInstance = axios.create({ baseURL: import.meta.BACKEND_SERVER_API, timeout: 60000, withCredentials: true });

axiosInstance.interceptors.request.use((config) => {
    const userAuthDetails = localStorage.getItem('userAuthDetails');
    if (userAuthDetails) {
        const user = JSON.parse(userAuthDetails);
        const token = user.token;
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(console.log(error));
});

axiosInstance.interceptors.response.use((response) => {
    return response;
}, async (error) => {
    if (error.response) {
        const { status, config } = error.response;

        if (status === 401 && !config.prevRequest) {
            try 
            {
                config.prevRequest = true;
                const AccessToken = await  authApi.refresh();
                if (AccessToken) {
                    // Updating the Token stored In localStorage
                    const user = decodeToken(AccessToken);
                    localStorage.setItem("userAuthDetails", JSON.stringify(user));

                    // Updating the Authorization header
                    config.headers.Authorization = `Bearer ${AccessToken}`;

                    // Retry if something wrong happens for original request
                    return axiosInstance(config);
                }
            }
            catch (_error)
            {
                return Promise.reject(_error);
            }
        }
        if (status === 401) {
            window.location = '/401';
        } else if (status === 403) {
            window.location = '/403';
        } else if (status === 500) {
            window.location = '/500';
        }
    }
    return Promise.reject(error);
});

export default axiosInstance;