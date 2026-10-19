import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt, { hash } from "bcrypt"

import crypto from "crypto"
import { Meeting } from "../models/meeting.model.js";
const login = async (req, res) => {
    const rawIdentifier = req.body.username || req.body.email || req.body.identifier;
    const { password } = req.body;

    if (!rawIdentifier || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Please Provide" });
    }

    const identifier = typeof rawIdentifier === "string" ? rawIdentifier.trim() : "";

    try {
        const user = await User.findOne({
            $or: [
                { username: identifier },
                { email: identifier.toLowerCase() }
            ]
        });

        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User Not Found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (isPasswordCorrect) {
            const token = crypto.randomBytes(20).toString("hex");

            user.token = token;
            await user.save();
            return res.status(httpStatus.OK).json({
                token: token,
                user: {
                    name: user.name,
                    username: user.username,
                    email: user.email || ""
                }
            });
        } else {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Username or password" });
        }

    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong ${e}` });
    }
};

const register = async (req, res) => {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "All fields are required (name, username, email, password)" });
    }

    const trimmedName = typeof name === "string" ? name.trim() : "";
    const trimmedUsername = typeof username === "string" ? username.trim() : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!trimmedName || !trimmedUsername || !normalizedEmail || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "All fields must be non-empty" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Invalid email format" });
    }

    try {
        const existingUsername = await User.findOne({ username: trimmedUsername });
        if (existingUsername) {
            return res.status(httpStatus.CONFLICT).json({ message: "Username is already taken" });
        }

        const existingEmail = await User.findOne({ email: normalizedEmail });
        if (existingEmail) {
            return res.status(httpStatus.CONFLICT).json({ message: "An account with this email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name: trimmedName,
            username: trimmedUsername,
            email: normalizedEmail,
            password: hashedPassword
        });

        await newUser.save();

        return res.status(httpStatus.CREATED).json({ message: "User Registered" });

    } catch (e) {
        if (e.code === 11000) {
            const field = Object.keys(e.keyPattern || {})[0] || "field";
            return res.status(httpStatus.CONFLICT).json({ message: `An account with this ${field} already exists` });
        }
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong ${e}` });
    }
};


const getUserHistory = async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(httpStatus.UNAUTHORIZED).json({ message: "Token is required" });
    }

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
        }

        const meetings = await Meeting.find({ user_id: user.username });
        return res.status(httpStatus.OK).json(meetings);
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
    }
}

const addToHistory = async (req, res) => {
    const { token, meeting_code } = req.body;

    if (!token) {
        return res.status(httpStatus.UNAUTHORIZED).json({ message: "Token is required" });
    }

    if (!meeting_code) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Meeting code is required" });
    }

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
        }

        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code
        });

        await newMeeting.save();

        return res.status(httpStatus.CREATED).json({ message: "Added code to history" });
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
    }
}


export { login, register, getUserHistory, addToHistory }