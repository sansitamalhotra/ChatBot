import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    currentUser: null,
    loading: false,
    error: '',
};

export const userSlice= createSlice({
    name: 'user',
    initialState: {
        loginStart: (state) => {
            state.loading = true
            state.error = ''
        },
        loginSuccess: (state, action) => {
            state.loading = false
            state.currentUser = action.payload
        },
        loginFailure: (state, action) => {
            state.loading = false
            state.error = action.payload
        },
        registerStart: (state) => {
            state.loading = true
            state.error = ''
        },
        registerSuccess: (state) => {
            state.loading = false
        },
        registerFailure: (state, action) => {
            state.loading = false
            state.error = action.payload
        },
        updateUserStart: (state) => {
            state.loading = true
            state.error = ''
        },
        updateUserSuccess: (state, action) => {
            state.loading = false
            state.currentUser = action.payload
        },
        updateUserFailure: (state, action) => {
            state.loading = false
            state.error = action.payload
        },
        logout: (state) => {
            return initialState;
        },
    }
});

export const { loginStart, loginSuccess, loginFailure, registerStart, registerSuccess, registerFailure, updateUserStart, updateUserSuccess, updateUserFailure, logout } = userSlice.actions;

export default userSlice.reducer;