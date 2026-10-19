import { Server } from "socket.io";

const connections = {};
const messages = {};
const timeOnline = {};
const socketRoom = {};
const userMeta = {};

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });

    const leaveCurrentRoom = (socket) => {
        const roomId = socketRoom[socket.id];
        if (!roomId || !connections[roomId]) {
            delete socketRoom[socket.id];
            delete timeOnline[socket.id];
            delete userMeta[socket.id];
            return;
        }

        connections[roomId] = connections[roomId].filter(id => id !== socket.id);

        for (let a = 0; a < connections[roomId].length; ++a) {
            io.to(connections[roomId][a]).emit("user-left", socket.id);
        }

        if (connections[roomId].length === 0) {
            delete connections[roomId];
            delete messages[roomId];
        }

        delete socketRoom[socket.id];
        delete timeOnline[socket.id];
        delete userMeta[socket.id];
    };

    io.on("connection", (socket) => {
        timeOnline[socket.id] = new Date();

        socket.on("join-call", (rawPath, displayName) => {
            const path = typeof rawPath === "string" ? rawPath.trim().toLowerCase() : "";
            if (!path) return;

            const safeName = typeof displayName === "string" && displayName.trim()
                ? displayName.trim().slice(0, 50)
                : "Guest";
            userMeta[socket.id] = { username: safeName, cameraOn: true };

            // Leave any previous room before joining a new one
            if (socketRoom[socket.id] && socketRoom[socket.id] !== path) {
                leaveCurrentRoom(socket);
            }

            if (connections[path] === undefined) {
                connections[path] = [];
            }

            if (!connections[path].includes(socket.id)) {
                connections[path].push(socket.id);
            }

            socketRoom[socket.id] = path;

            // Broadcast user-joined with updated connections and user metadata snapshot
            for (let a = 0; a < connections[path].length; a++) {
                io.to(connections[path][a]).emit("user-joined", socket.id, connections[path], userMeta);
            }

            if (messages[path] !== undefined) {
                for (let a = 0; a < messages[path].length; ++a) {
                    io.to(socket.id).emit(
                        "chat-message",
                        messages[path][a]["data"],
                        messages[path][a]["sender"],
                        messages[path][a]["socket-id-sender"],
                        messages[path][a]["timestamp"] || ""
                    );
                }
            }
        });

        socket.on("camera-state", (isCameraOn) => {
            const matchingRoom = socketRoom[socket.id];
            if (!matchingRoom || !connections[matchingRoom]) return;

            if (userMeta[socket.id]) {
                userMeta[socket.id].cameraOn = !!isCameraOn;
            }

            connections[matchingRoom].forEach((elem) => {
                if (elem !== socket.id) {
                    io.to(elem).emit("camera-state", socket.id, !!isCameraOn);
                }
            });
        });

        socket.on("user-info", (info) => {
            const matchingRoom = socketRoom[socket.id];
            if (!matchingRoom || !connections[matchingRoom]) return;

            const safeName = typeof info?.username === "string" && info.username.trim()
                ? info.username.trim().slice(0, 50)
                : (userMeta[socket.id]?.username || "Guest");
            const cameraOn = typeof info?.cameraOn === "boolean"
                ? info.cameraOn
                : (userMeta[socket.id]?.cameraOn ?? true);

            userMeta[socket.id] = { username: safeName, cameraOn };

            connections[matchingRoom].forEach((elem) => {
                if (elem !== socket.id) {
                    io.to(elem).emit("user-info", socket.id, safeName, cameraOn);
                }
            });
        });

        socket.on("signal", (toId, message) => {
            const senderRoom = socketRoom[socket.id];
            const targetRoom = socketRoom[toId];

            // Verify both sender and recipient exist and belong to the exact same room
            if (senderRoom && targetRoom && senderRoom === targetRoom) {
                io.to(toId).emit("signal", socket.id, message);
            }
        });

        socket.on("chat-message", (data, sender, timestamp) => {
            const matchingRoom = socketRoom[socket.id];
            if (!matchingRoom || !connections[matchingRoom]) return;

            if (typeof data !== "string" || !data.trim()) return;

            if (messages[matchingRoom] === undefined) {
                messages[matchingRoom] = [];
            }

            const safeSender = typeof sender === "string" && sender.trim()
                ? sender.trim().slice(0, 50)
                : (userMeta[socket.id]?.username || "Guest");
            const safeData = data.trim();
            const safeTime = typeof timestamp === "string" && timestamp.trim()
                ? timestamp.trim()
                : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            messages[matchingRoom].push({
                sender: safeSender,
                data: safeData,
                timestamp: safeTime,
                "socket-id-sender": socket.id
            });

            connections[matchingRoom].forEach((elem) => {
                io.to(elem).emit("chat-message", safeData, safeSender, socket.id, safeTime);
            });
        });

        socket.on("disconnect", () => {
            leaveCurrentRoom(socket);
        });
    });

    return io;
};
