export class ApiService {
  static async callOpenAI(apiKey, messages, model = "gpt-4") {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      return await response.json();
    } catch (error) {
      console.error("OpenAI API call failed:", error);
      throw error;
    }
  }

  static async callClaude(apiKey, messages, model = "claude-3-sonnet-20240229") {
    try {
      console.log("Claude API - Raw messages:", messages);

      // Format messages correctly for Claude API
      const formattedMessages = messages.map(msg => {
        // Ensure role is exactly "user" or "assistant"
        const role = msg.role === "user" ? "user" : "assistant";
        
        // Ensure content is a string (Claude expects string content for simple text messages)
        let content;
        if (typeof msg.content === "string") {
          content = msg.content;
        } else if (Array.isArray(msg.content)) {
          // If it's an array, extract text from text blocks
          const textBlocks = msg.content.filter(block => block.type === "text");
          content = textBlocks.map(block => block.text).join("\n");
        } else {
          content = String(msg.content);
        }
        
        return { role, content };
      });

      console.log("Claude API - Formatted messages:", formattedMessages);

      const requestBody = {
        model,
        max_tokens: 2000,
        messages: formattedMessages,
      };

      console.log("Claude API - Request body:", JSON.stringify(requestBody, null, 2));

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01", // Current stable version
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Claude API - Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Claude API - Error response:", errorData);
        
        // More specific error messages based on common issues
        let errorMessage = `Claude API error: ${response.status}`;
        
        if (errorData.error?.message) {
          errorMessage += ` - ${errorData.error.message}`;
        } else if (response.status === 401) {
          errorMessage += " - Invalid API key";
        } else if (response.status === 400) {
          errorMessage += " - Bad request format";
        } else if (response.status === 429) {
          errorMessage += " - Rate limit exceeded";
        } else {
          errorMessage += " - Unknown error";
        }
        
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log("Claude API - Response data:", responseData);

      return responseData;
    } catch (error) {
      console.error("Claude API call failed:", error);
      throw error;
    }
  }
}