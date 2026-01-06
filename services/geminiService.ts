
import { GoogleGenAI } from "@google/genai";
import { AttendanceRecord } from "../types";

export const getAttendanceInsights = async (records: AttendanceRecord[]) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const wardCounts = records.reduce((acc: Record<string, number>, curr) => {
      acc[curr.ward] = (acc[curr.ward] || 0) + 1;
      return acc;
    }, {});

    const monthlyCounts = records.reduce((acc: Record<string, number>, curr) => {
      const month = curr.date.substring(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    const prompt = `
      Analyze this YSA Gathering Place attendance data and provide 3-4 professional, actionable leadership insights. 
      Total records: ${records.length}
      Ward distribution: ${JSON.stringify(wardCounts)}
      Monthly trends: ${JSON.stringify(monthlyCounts)}

      Focus on growth trends, ward participation, and consistency. Keep it encouraging and spiritual where appropriate.
      Format the response as clear bullet points in Markdown.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Error generating insights. Please try again later.";
  }
};
