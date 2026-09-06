import { GoogleGenAI, Type } from '@google/genai';

export async function extractActionItems(journalText: string, apiKey: string): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Extract all explicit and implied action items or goals from this journal text: "${journalText}"`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
          description: 'A single actionable task or goal',
        },
      },
    },
  });

  return JSON.parse(response.text || '[]');
}