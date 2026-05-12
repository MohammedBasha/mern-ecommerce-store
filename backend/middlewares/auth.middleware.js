import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const protectRoute = async (req, res, next) => {
    try {
        // Check if the user is authenticated
        const accessToken = req.cookies.accessToken;
        if (!accessToken) {
            return res
                .status(401)
                .json({ message: "Unauthorized: No token provided" });
        }

        try {
            const decoded = jwt.verify(
                accessToken,
                process.env.ACCESS_TOKEN_SECRET,
            );

            const user = await User.findById(decoded.userId).select(
                "-password",
            );
            if (!user) {
                return res
                    .status(401)
                    .json({ message: "Unauthorized: User not found" });
            }

            req.user = user;
            next();
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                console.error(`Token expired: ${error.message}`);
                return res
                    .status(401)
                    .json({ message: "Unauthorized: Token expired" });
            }
            throw error;
        }
    } catch (error) {
        console.error(`Error in protectRoute: ${error.message}`);
        return res.status(401).json({
            message: "Unauthorized - Token verification failed",
            error: error.message,
        });
    }
};

export const adminRoute = (req, res, next) => {
    // Check if the user is an admin
    if (req.user.role === "admin") {
        next();
    } else {
        console.error(
            `Forbidden: User ${req.user._id} does not have admin access`,
        );
        return res
            .status(403)
            .json({ message: "Forbidden: Admin access required" });
    }
};
