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
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });

        if (user && (await user.comparePassword(password))) {
            const { accessToken, refreshToken } = generateToken(user._id);
            await storeRefreshToken(user._id, refreshToken);
            setCookie(res, accessToken, refreshToken);

            res.status(201).json(
                {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
                { message: "Login successful" },
            );
        } else {
            console.log(`Invalid email or password for email: ${email}`);
            return res
                .status(401)
                .json({ message: "Invalid email or password" });
        }
    } catch (error) {
        console.log(`Error logging in: ${error.message}`);
        res.status(500).json({ message: "Error logging in", error });
    }
};

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(400).json({ message: "Refresh token not found" });
        } else {
            const decoded = jwt.verify(
                refreshToken,
                process.env.REFRESH_TOKEN_SECRET,
            );
            await redisClient.del(`refreshToken:${decoded.userId}`);
            if (!decoded) {
                return res
                    .status(400)
                    .json({ message: "Invalid refresh token" });
            }
        }
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        console.log(`Error logging out: ${error.message}`);
        res.status(500).json({ message: "Error logging out", error });
    }
};

// this will refresh the access token
export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res
                .status(401)
                .json({ message: "No refresh token provided" });
        }

        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        );
        const storedToken = await redisClient.get(
            `refreshToken:${decoded.userId}`,
        );

        if (storedToken !== refreshToken) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        const accessToken = jwt.sign(
            { userId: decoded.userId },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" },
        );

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000,
        });

        res.json({ message: "Token refreshed successfully" });
    } catch (error) {
        console.log("Error in refreshToken controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
