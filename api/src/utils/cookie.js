const jwt = require("jsonwebtoken");
const { client } = require("../config/redis");

const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/"
};

exports.generateTokens = async (res, adminID, tokenVersion) => {
    const accessToken = jwt.sign(
        { id: adminID, version: tokenVersion },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
        { id: adminID, version: tokenVersion },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "14d" }
    );

    await client.setEx(`refresh:${refreshToken}`, 14 * 24 * 60 * 60, adminID);

    await client.sAdd(`sessions:${adminID}`, refreshToken);
    await client.expire(`sessions:${adminID}`, 14 * 24 * 60 * 60);

    res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 14 * 24 * 60 * 60 * 1000 });
};

exports.clearTokens = (res) => {
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);
};