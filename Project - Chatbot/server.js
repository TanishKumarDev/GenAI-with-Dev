import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    // Use Groq chat completions endpoint
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Use a valid model from /v1/models
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
        max_completion_tokens: 200, // Use max_completion_tokens instead of max_output_tokens
      }),
    });

    const data = await response.json();
    console.log("Full API Response:", JSON.stringify(data, null, 2));

    // Check for error in response
    if (data.error) {
      console.error("API Error:", data.error);
      return res.status(500).json({ reply: `API Error: ${data.error.message}` });
    }

    // Extract reply safely
    const reply = data.choices?.[0]?.message?.content || "No reply from Groq API.";
    console.log("🗣 User:", userMessage);
    console.log("🤖 Bot:", reply);

    res.json({ reply });
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ reply: "Server error. Check backend logs." });
  }
});

app.listen(5000, () => console.log("✅ Server running on http://localhost:5000"));