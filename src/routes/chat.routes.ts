
import { Router } from "express";
import { createChat } from "../controllers/chat.controller.js";
import { sendMessage,getMessages, markMessageAsRead, updateLastSeen } from "../controllers/message.controller.js";

const router = Router();

router.post("/create", createChat);
router.post("/:chatId/message/send", sendMessage);
router.get("/:chatId/messages", getMessages);
router.post(
  "/:chatId/message/:messageId/read",
  markMessageAsRead
);
router.post("/:chatId/lastseen", updateLastSeen);

export default router;
