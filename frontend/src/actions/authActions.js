export function checkAuthentication() {
    return dispatch => {
        const token = localStorage.getItem('userDetails');
        if (token) {
            dispatch(loginSuccess(token));
        } else {
            dispatch(logoutSuccess());
        }
    };
}

function loginSuccess(token) {
    return { type: 'LOGIN_SUCCESS', token };
}

function logoutSuccess() {
    return { type: 'LOGOUT_SUCCESS' };
}