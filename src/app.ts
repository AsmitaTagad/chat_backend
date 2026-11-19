import express from "express";
import cors from "cors";
import { prisma } from "./config/prisma.js";
import chatRoutes from "./routes/chat.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Chat Backend API is running!"
    });
});

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        status: "healthy"
    });
});

app.get("/users", async (req, res) => {
    try {
        const users = await prisma.users.findMany();

        res.status(200).json({
            success: true,
            count: users.length,
            data: users,
        });
    } catch (error) {
        console.error("Error fetching users:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch users",
        });
    }
});



app.use("/chat", chatRoutes);

export default app;