import express from "express";
import dotenv from "dotenv";

// Import routes
import authRoutes from "./routes/auth.route.js";
import { connectDB } from "./lib/db.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);

    connectDB();
});
