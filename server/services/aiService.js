import groq from "../config/groq.js";

export const summarizeMessages =
async (messages) => {

  const prompt = `
  Summarize these chat messages briefly:

  ${messages.join("\n")}
  `;

  const completion =
    await groq.chat.completions.create({

      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],

      model: "llama-3.1-8b-instant",

    });

  return completion.choices[0]
    .message.content;

};

export const translateMessage =
async (text, targetLanguage) => {

  const prompt = `
  Translate this message into
  ${targetLanguage}:

  "${text}"

  Only return translated text.
  `;

  const completion =
    await groq.chat.completions.create({

      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],

      model: "llama-3.1-8b-instant",

    });

  return completion.choices[0]
    .message.content;

};