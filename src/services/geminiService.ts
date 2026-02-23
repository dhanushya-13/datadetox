import { GoogleGenAI } from "@google/genai";
import { DashboardData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getAIAnalysis(data: DashboardData): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        System: DataDetox Neural Intelligence Engine v4.0
        Task: Generate a high-precision Digital Wellness & Cleanup Report.
        
        Context Data:
        - Total Storage: ${(data.totalStorage / (1024**3)).toFixed(2)} GB
        - Used Storage: ${(data.usedStorage / (1024**3)).toFixed(2)} GB
        - Wellness Score: ${data.wellnessScore}/100
        - Forecast Data: ${JSON.stringify(data.forecast.slice(0, 6))}
        - Flagged Items: ${JSON.stringify(data.items.map(i => ({ 
            name: i.name, 
            size: (i.size / (1024**2)).toFixed(2) + 'MB', 
            category: i.category, 
            isDuplicate: i.isDuplicate,
            confidence: i.confidenceScore,
            risk: i.riskLevel,
            lastAccessed: '30+ days ago'
          })))}
        
        Requirements:
        1. **Predictive Storage Forecast**: Analyze growth velocity and predict the exact "Disk Full" threshold date.
        2. **Cleanup Recommendation Model (Logistic Regression Logic)**: 
           - Evaluate probability of safety for cleanup based on Age, Access Frequency, and Size.
           - Provide confidence % for each recommendation.
        3. **Risk-Free Simulation**: Describe the "Clean State" after recommended actions (Wellness Score impact, Performance gain).
        4. **Green Computing Impact**: Estimate energy savings (kWh) from storage reduction.
        5. **Digital Wellness Habits**: 3 actionable habits to reduce future clutter.
        
        Format: Use elegant Markdown with a professional, editorial tone. Use Playfair Display style headings (italicized).`,
    });

    return response.text || "Unable to generate analysis at this time.";
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return "The AI is currently resting. Please try again later.";
  }
}
