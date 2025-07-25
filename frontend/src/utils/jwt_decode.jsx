const { default: jwt_decode } = require("jwt-decode");

export const decodeToken = (token) => {

  try {

    const decodedToken = jwt_decode(token);
    const { firstname, lastname, email, phone, photo, role, country, userId } = decodedToken;

    return { token, firstname, lastname, email, phone, photo, role,  country, userId,};

  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};