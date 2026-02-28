"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function generateEventData(prompt: string) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("Gemini API key is not configured.");
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const systemPrompt = `
You are an expert event organizer API. 
The user is going to provide a short description or idea for an event.
Your job is to generate a comprehensive, exciting, and highly detailed event configuration based on their prompt.
The current date is ${new Date().toISOString()}.

You MUST output strictly in the following JSON format:
{
  "title": "A catchy, impressive title for the event",
  "description": "A highly detailed, professional, and exciting description of the event. Write at least 2-3 paragraphs. You can use Markdown formatting like **bold** or lists if appropriate.",
  "location": "A realistic location (e.g., 'Moscone Center, San Francisco, CA' or 'Virtual')",
  "tickets": [
    {
      "name": "General Admission",
      "price": number (in USD, 0 if free),
      "capacity": number (number of seats)
    },
    {
      "name": "VIP",
      "price": number (in USD),
      "capacity": number (number of seats)
    }
  ],
  "category": "A suitable category (e.g., Technology, Music, Workshop, Networking, etc.)",
  "startDate": "ISO 8601 date string for when the event starts. Make it realistic, e.g., 30-60 days from now.",
  "endDate": "ISO 8601 date string for when the event ends. Typically the same day or a few days after startDate."
}
`;

        const result = await model.generateContent([
            { text: systemPrompt },
            { text: `User Prompt: ${prompt}` }
        ]);

        const responseText = result.response.text();
        const data = JSON.parse(responseText);

        return { success: true, data };
    } catch (error: any) {
        console.error("Failed to generate event data:", error);
        return { success: false, error: error.message || "Failed to generate event." };
    }
}
