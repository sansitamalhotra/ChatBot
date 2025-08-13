const initialState = {
    isAuthenticated: false,
    token: null,
};

export default function authReducer(state = initialState, action) {
    switch (action.type) {
        case 'LOGIN_SUCCESS':
            return { ...state, isAuthenticated: true, token: action.token };
        case 'LOGOUT_SUCCESS':
            return { ...state, isAuthenticated: false, token: null };
        default:
            return state;
    }
}