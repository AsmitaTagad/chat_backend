
import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";

export const createChat = async (req: Request, res: Response) => {
  try {
    const { userAId, userBId } = req.body;

    if (!userAId || !userBId) {
      return res.status(400).json({
        success: false,
        message: "Both userAId and userBId are required",
      });
    }

    if (userAId === userBId) {
      return res.status(400).json({
        success: false,
        message: "A user cannot create a chat with itself",
      });
    }

    const users = await prisma.users.findMany({
      where: {
        id: {
          in: [userAId, userBId],
        },
      },
    });

    if (users.length !== 2) {
      return res.status(404).json({
        success: false,
        message: "One or both users were not found",
      });
    }

    const chat = await prisma.$transaction(async (tx) => {
      const newChat = await tx.chats.create({
        data: {
          type: "ONE_TO_ONE",
        },
      });

      await tx.chat_members.createMany({
        data: [
          {
            chat_id: newChat.id,
            user_id: userAId,
          },
          {
            chat_id: newChat.id,
            user_id: userBId,
          },
        ],
      });

      return newChat;
    });

    return res.status(201).json({
      success: true,
      message: "Chat created successfully",
      data: {
        chatId: chat.id,
      },
    });
  } catch (error) {
    console.error("Create chat error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create chat",
    });
  }
};
