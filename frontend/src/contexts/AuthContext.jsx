import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";

export const AuthContext = createContext({});

const client = axios.create({
    baseURL: `${server}/api/v1/users`
});

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();

    // Initialize user state from persistent storage
    const [userData, setUserData] = useState(() => {
        try {
            const token = localStorage.getItem("token");
            const username = localStorage.getItem("username");
            const name = localStorage.getItem("name");
            if (token) {
                return { token, username: username || "User", name: name || "" };
            }
        } catch {
            // LocalStorage might be restricted
        }
        return null;
    });

    const handleRegister = async (name, username, email, password) => {
        try {
            const request = await client.post("/register", {
                name,
                username,
                email,
                password
            });

            if (request.status === httpStatus.CREATED) {
                return request.data.message || "User Registered";
            }
            return request.data?.message || "Registration successful";
        } catch (err) {
            throw err;
        }
    };

    const handleLogin = async (identifier, password) => {
        try {
            const request = await client.post("/login", {
                username: identifier,
                password
            });

            if (request.status === httpStatus.OK) {
                const token = request.data.token;
                const userObj = request.data.user || {};
                const finalUsername = userObj.username || identifier;
                const finalName = userObj.name || "";
                const finalEmail = userObj.email || "";

                try {
                    localStorage.setItem("token", token);
                    localStorage.setItem("username", finalUsername);
                    if (finalName) localStorage.setItem("name", finalName);
                    if (finalEmail) localStorage.setItem("email", finalEmail);
                } catch {}

                const sessionData = {
                    token,
                    username: finalUsername,
                    name: finalName,
                    email: finalEmail
                };
                setUserData(sessionData);
                navigate("/home");
                return sessionData;
            }
        } catch (err) {
            throw err;
        }
    };

    const handleLogout = () => {
        try {
            localStorage.removeItem("token");
            localStorage.removeItem("username");
            localStorage.removeItem("name");
        } catch {}
        setUserData(null);
        navigate("/auth");
    };

    const getHistoryOfUser = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return [];

            const request = await client.get("/get_all_activity", {
                params: { token }
            });
            return Array.isArray(request.data) ? request.data : [];
        } catch (err) {
            throw err;
        }
    };

    const addToUserHistory = async (meetingCode) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return null;

            const request = await client.post("/add_to_activity", {
                token,
                meeting_code: meetingCode
            });
            return request.data;
        } catch (e) {
            throw e;
        }
    };

    const data = {
        userData,
        setUserData,
        handleLogin,
        handleRegister,
        handleLogout,
        getHistoryOfUser,
        addToUserHistory
    };

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    );
};