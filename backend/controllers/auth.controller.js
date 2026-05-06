import User from "../models/user.model.js";
export const signup = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const user = await User.create({ name, email, password });
        res.status(201).json({ message: "User created successfully", user });
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
