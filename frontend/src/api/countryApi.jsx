import axiosInstance from './axios';

class CountryApi {

    constructor() {
        this.basePath = '/api/v1/country';
    }
    request(method, url, data) {
        return new Promise((resolve, reject) => {
            axiosInstance[method](`${this.basePath}${url}`, data)
              .then((response) => {
                resolve(response.data);
              })
              .catch((error) => {
                reject(error.response.data);
              });
        });      
    };

    fetchCountries() {
        return this.request('get', '/');
    };
    fetchCountryById(id) {
        return this.request('get', `/${id}`);
    };
    addCountry(data) {
        return this.request('post', '/add', data);
    };
    updateCountry(id, data) {
        return this.request('patch', `/${id}`, data);
    };
    deleteCountry(id) {
        return this.request('delete', `/${id}`);
    }
};

export const countryApi = new CountryApi;