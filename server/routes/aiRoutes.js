import express from "express";

import {
  summarizeMessages,translateMessage
} from "../services/aiService.js";


const router = express.Router();

router.post(
  "/summarize",
  async (req, res) => {

    try {

      const { messages } = req.body;

      const summary =
        await summarizeMessages(messages);

      res.json({
        success: true,
        summary
      });

    } catch (error) {

      res.json({
        success: false,
      message: error.message
      });

    }

});

router.post(
  "/translate",
  async (req, res) => {

    try {

      const {
        text,
        targetLanguage
      } = req.body;

      const translatedText =
        await translateMessage(
          text,
          targetLanguage
        );

      res.json({
        success: true,
        translatedText
      });

    } catch (error) {

      res.json({
        success: false,
        message: error.message
      });

    }

});

export default router;