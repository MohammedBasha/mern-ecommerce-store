import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import redisClient from "../lib/redis.js";

const generateToken = (userId) => {
    // Implement token generation logic here (e.g., using JWT)
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
    });
    const refreshToken = jwt.sign(
        { userId },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: "7d",
        },
    );
    return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
    // Implement logic to store refresh token in Redis with an expiration time
    await redisClient.set(
        `refreshToken:${userId}`,
        refreshToken,
        "EX",
        7 * 24 * 60 * 60,
    ); // Expires in 7 days
};

const setCookie = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
};

redisClient.connect().then(() => {
    console.log("Connected to Redis");
});

export const signup = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const user = await User.create({ name, email, password });

        const { accessToken, refreshToken } = generateToken(user._id);

        await storeRefreshToken(user._id, refreshToken);

        setCookie(res, accessToken, refreshToken);

        res.status(201).json(
            {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
            { message: "User created successfully" },
        );
    } catch (error) {
        console.log(`Error creating user: ${error.message}`);
        res.status(500).json({ message: "Error creating user", error });
    }
};

export const login = async (req, res) => {
    res.send("Login successful");
};

export const logout = async (req, res) => {
    res.send("Logout successful");
};
