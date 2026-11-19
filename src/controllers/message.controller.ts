
import { Request, Response } from "express";
import { FieldValue } from "firebase-admin/firestore";
import { firestore } from "../config/firebase.js";
import { prisma } from "../config/prisma.js";

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const { senderId, text } = req.body;

  
    if (!senderId || !text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "senderId and a valid message text are required",
      });
    }

   
    const membership = await prisma.chat_members.findFirst({
      where: {
        chat_id: chatId,
        user_id: senderId,
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "Sender is not a member of this chat",
      });
    }

  
    const messageRef = await firestore
      .collection("chats")
      .doc(chatId)
      .collection("messages")
      .add({
        senderId,
        text: text.trim(),
        createdAt: FieldValue.serverTimestamp(),
      });

   
    const savedMessage = await messageRef.get();
    const messageData = savedMessage.data();

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: {
        messageId: messageRef.id,
        chatId,
        senderId,
        text: text.trim(),
        createdAt: messageData?.createdAt?.toDate().toISOString(),
      },
    });
  } catch (error) {
    console.error("Send message error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const rawLimit = req.query.limit ?? "50";
    const limit = Number(rawLimit);

    if (
      typeof rawLimit !== "string" ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Limit must be an integer between 1 and 100",
      });
    }

    const chat = await prisma.chats.findUnique({
      where: {
        id: chatId,
      },
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }


    const messagesSnapshot = await firestore
      .collection("chats")
      .doc(chatId)
      .collection("messages")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const messages = messagesSnapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        messageId: doc.id,
        senderId: data.senderId,
        text: data.text,
        createdAt: data.createdAt?.toDate().toISOString() ?? null,
      };
    });

    return res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    console.error("Get messages error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve messages",
    });
  }
};

export const markMessageAsRead = async (
  req: Request,
  res: Response
) => {
  try {
    const { chatId, messageId } = req.params;
    const { userId } = req.body;

  
    if (!userId || typeof userId !== "string") {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

   
    const membership = await prisma.chat_members.findFirst({
      where: {
        chat_id: chatId,
        user_id: userId,
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "User is not a member of this chat",
      });
    }

  
    const messageRef = firestore
      .collection("chats")
      .doc(chatId)
      .collection("messages")
      .doc(messageId);

    const messageSnapshot = await messageRef.get();

    if (!messageSnapshot.exists) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    await messageRef
      .collection("readReceipts")
      .doc(userId)
      .set({
        userId,
        readAt: FieldValue.serverTimestamp(),
      });

    return res.status(200).json({
      success: true,
      message: "Message marked as read",
      data: {
        chatId,
        messageId,
        userId,
      },
    });

  } catch (error) {
    console.error("Mark message as read error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark message as read",
    });
  }
};


export const updateLastSeen = async (
  req: Request,
  res: Response
) => {
  try {
    const { chatId } = req.params;
    const { userId, messageId } = req.body;

    // 1. Validate request
    if (!userId || !messageId) {
      return res.status(400).json({
        success: false,
        message: "userId and messageId are required",
      });
    }

    // 2. Verify user belongs to the chat
    const membership = await prisma.chat_members.findFirst({
      where: {
        chat_id: chatId,
        user_id: userId,
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "User is not a member of this chat",
      });
    }

    // 3. Verify message exists
    const messageRef = firestore
      .collection("chats")
      .doc(chatId)
      .collection("messages")
      .doc(messageId);

    const messageSnapshot = await messageRef.get();

    if (!messageSnapshot.exists) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // 4. Store last-seen information
    await firestore
      .collection("chats")
      .doc(chatId)
      .collection("lastSeen")
      .doc(userId)
      .set({
        userId,
        messageId,
        updatedAt: FieldValue.serverTimestamp(),
      });

    return res.status(200).json({
      success: true,
      message: "Last seen updated successfully",
      data: {
        chatId,
        userId,
        messageId,
      },
    });

  } catch (error) {
    console.error("Update last seen error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update last seen",
    });
  }
};


