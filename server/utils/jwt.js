const jwt = require("jsonwebtoken");

// Generate Access Token
exports.GenerateAccessToken = (user) => {
    const tokenPayload = {
        userId: user._id.toString(),
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phone: user.phone,
        role: user.role,
        photo: user.photo,
        country: user.country,
        appliedJobs: user.appliedJobs,
        jobsPostedBy: user.jobsPostedBy,
        status: user.status,
        registeredDate: user.registeredDate,
        isVerified: user.isVerified,
        isBlocked: user.isBlocked,
        workAuthorization: user.workAuthorization
    };
    const token = jwt.sign(tokenPayload, process.env.ACCESS_TOKEN_SECRET_KEY, { expiresIn: "8h" });

    return token;
};

// Generate Refresh Token
exports.GenerateRefreshToken = (userId) => {
    const token = jwt.sign({ userId: userId }, process.env.REFRESH_TOKEN_SECRET_KEY, {
        expiresIn: "7d",
    });
    return token;
};
