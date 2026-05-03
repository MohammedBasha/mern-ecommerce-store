import express from "express";
import dotenv from "dotenv";

// Import routes
import authRoutes from "./routes/auth.route.js";

dotenv.config();

const app = express();

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});
