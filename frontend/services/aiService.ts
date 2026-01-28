
// Generic AI Service compatible with OpenAI-style APIs (e.g., Alibaba Tongyi Qianwen, DeepSeek, OpenAI)

const API_ENDPOINT = process.env.NEXT_PUBLIC_AI_ENDPOINT || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'; // Default to Alibaba Qwen (Tongyi) endpoint example
const API_KEY = process.env.NEXT_PUBLIC_AI_API_KEY;
const MODEL_NAME = process.env.NEXT_PUBLIC_AI_MODEL || 'qwen-turbo'; // Default model

/**
 * Polishes the given content using an AI provider.
 * This function is designed to be provider-agnostic.
 */
export const polishContent = async (content: string): Promise<string> => {
    if (!content.trim()) return "";

    if (!API_KEY) {
        console.warn("AI API Key is missing. Please check your .env.local file.");
        // Return mock response if no key is present, to prevent crash in demo
        return content + "\n\n(AI Polish requires API Key setup)";
    }

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful writing assistant. Improve the grammar, tone, and formatting of the user's text. Keep the original meaning but make it more professional and readable. Return ONLY the improved text."
                    },
                    {
                        role: "user",
                        content: content
                    }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`AI Service HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || content;

    } catch (error) {
        console.error("AI Service Error:", error);
        throw error;
    }
};
