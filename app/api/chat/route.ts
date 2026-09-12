import { GoogleGenAI } from "@google/genai";
import { NextRequest } from "next/server";
import topicData from "./topics.json";

export const runtime = "nodejs";

const systemPrompt = `You are digiGUIDE, a patient, encouraging, and rigorous computer science tutor. Teach so a student can understand and connect the idea, not just memorize a definition. For every concept question, use this structure when it fits: plain-English idea, relatable real-life analogy, simple text diagram when useful, small step-by-step example, code or pseudocode when useful, time and space complexity, one common mistake, and one short check-for-understanding question. Use clean plain text with short paragraphs. Avoid decorative symbols, emojis, excessive headings, bold markers, and unnecessary punctuation. Use a simple numbered list only when it improves clarity. Adapt to the learner's level and never pretend to know private data. Always maintain conversational continuity by referencing previous topics and questions discussed in the chat.`;

export type ChatMessage = { role: "user" | "model"; content: string };

type TopicKey =
  | "recursion"
  | "dynamic_programming"
  | "trees"
  | "linked_lists"
  | "arrays"
  | "binary_search"
  | "memoization"
  | "graphs"
  | "python";

type TopicProfile = {
  key: TopicKey;
  title: string;
  keywords: string[];
  mainExplanation: string;
  secondExample: string;
  pythonCode: string;
  complexityExplanation: string;
  quizQuestions: string;
  checkAnswers: { keywords: string[]; feedback: string }[];
};

const topicProfiles: Record<TopicKey, TopicProfile> = topicData as unknown as Record<TopicKey, TopicProfile>;

/**
 * Checks if a query is an anaphora or pronoun reference (e.g. "it", "this", "another example", "in python").
 */
function isAnaphoraOrFollowUp(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("it") ||
    lower.includes("this") ||
    lower.includes("that") ||
    lower.includes("another") ||
    lower.includes("example") ||
    lower.includes("more") ||
    lower.includes("code") ||
    lower.includes("in python") ||
    lower.includes("time complexity") ||
    lower.includes("space complexity") ||
    lower.includes("why") ||
    lower.includes("how") ||
    lower.includes("quiz") ||
    lower.includes("practice") ||
    lower.includes("test me")
  );
}

/**
 * Determines the active topic by scanning conversation history.
 * Prioritizes user messages to determine learner intent, checks longest keywords first,
 * and handles follow-ups and pronouns seamlessly.
 */
function detectTopicInString(text: string, isUserMessage = true): TopicKey | null {
  const lower = text.toLowerCase();

  // Keyword list sorted by descending length to prevent substring clashes
  const allKeywords: { kw: string; key: TopicKey }[] = [];
  for (const [k, p] of Object.entries(topicProfiles)) {
    for (const kw of p.keywords) {
      allKeywords.push({ kw, key: k as TopicKey });
    }
  }
  allKeywords.sort((a, b) => b.kw.length - a.kw.length);

  for (const item of allKeywords) {
    // If the keyword is "python", ignore if it was just asking for code syntax "in python"
    if (item.key === "python" && (lower.includes("in python") || lower.includes("python code")) && !lower.includes("python dsa")) {
      continue;
    }
    if (lower.includes(item.kw)) {
      return item.key;
    }
  }
  return null;
}

function detectActiveTopic(messages: ChatMessage[]): TopicKey {
  const lastMsg = messages[messages.length - 1];
  const lastText = lastMsg ? lastMsg.content.toLowerCase() : "";
  const isFollowUp = isAnaphoraOrFollowUp(lastText);

  // 1. If the last message is NOT purely a follow-up, check if the user introduced a new topic
  if (!isFollowUp) {
    const directTopic = detectTopicInString(lastText, true);
    if (directTopic) return directTopic;
  }

  // 2. Look backwards through USER messages to find the established discussion topic
  for (let i = messages.length - (isFollowUp ? 2 : 1); i >= 0; i--) {
    if (messages[i].role === "user") {
      const topic = detectTopicInString(messages[i].content, true);
      if (topic) return topic;
    }
  }

  // 3. Fallback: inspect model messages backwards
  for (let i = messages.length - 2; i >= 0; i--) {
    const topic = detectTopicInString(messages[i].content, false);
    if (topic) return topic;
  }

  return "recursion";
}

/**
 * Evaluates whether the user's message is an answer to a check question or quiz from earlier.
 */
function checkStudentAnswer(userMsg: string, topic: TopicProfile): string | null {
  const clean = userMsg.toLowerCase().trim();
  for (const item of topic.checkAnswers) {
    for (const kw of item.keywords) {
      if (clean.includes(kw)) {
        return item.feedback;
      }
    }
  }
  return null;
}

/**
 * Intelligent context-aware tutor engine.
 * Understands full conversation history, references previous messages,
 * resolves pronouns ("it", "another example", "in python"), and evaluates student answers.
 */
function generateContextualTutorResponse(messages: ChatMessage[]): string {
  if (!messages.length) {
    return "Hi! I'm digiGUIDE, your computer science adaptive tutor. What concept or problem would you like to explore together?";
  }

  const lastMessage = messages[messages.length - 1];
  const userText = lastMessage.content.trim();
  const lower = userText.toLowerCase();

  // 1. Identify active topic from conversation history
  const activeKey = detectActiveTopic(messages);
  const profile = topicProfiles[activeKey];

  // 2. Explicit request for another example
  const isAskingAnotherExample =
    lower.includes("another example") ||
    lower.includes("another one") ||
    lower.includes("more examples") ||
    lower.includes("different example") ||
    lower.includes("give me an example of it") ||
    lower.includes("give another example") ||
    (lower.includes("example") && (lower.includes("it") || lower.includes("this") || lower.includes("that")));

  if (isAskingAnotherExample) {
    return `Referencing our discussion on **${profile.title}**:\n\n${profile.secondExample}`;
  }

  // 3. Explicit request for Code / Language implementation
  const isAskingForCode =
    lower.includes("in python") ||
    lower.includes("python code") ||
    lower.includes("show code") ||
    lower.includes("write code") ||
    lower.includes("how to code") ||
    lower.includes("code it") ||
    lower.includes("implementation") ||
    lower.includes("syntax");

  if (isAskingForCode) {
    return `Here is the clean, idiomatic Python implementation for **${profile.title}**:\n\n${profile.pythonCode}`;
  }

  // 4. Explicit request for Complexity analysis
  const isAskingComplexity =
    lower.includes("time complexity") ||
    lower.includes("space complexity") ||
    lower.includes("big o") ||
    lower.includes("how fast") ||
    lower.includes("efficiency") ||
    lower.includes("complexity") ||
    (lower.includes("cost") && lower.includes("memory"));

  if (isAskingComplexity) {
    return `Let's break down the computational complexity for **${profile.title}**:\n\n${profile.complexityExplanation}`;
  }

  // 5. Explicit request for Quiz / Practice challenges
  const isAskingQuiz =
    lower.includes("quiz") ||
    lower.includes("practice") ||
    lower.includes("test me") ||
    lower.includes("challenge") ||
    lower.includes("exercise") ||
    lower.includes("problem");

  if (isAskingQuiz) {
    return `Practice & Assessment for **${profile.title}**:\n\n${profile.quizQuestions}`;
  }

  // 6. Evaluate if the user is answering a previous check question
  const answerFeedback = checkStudentAnswer(lower, profile);
  if (answerFeedback) {
    return answerFeedback;
  }

  // 7. Check if user explicitly asked about a different topic in their latest message
  // (Only if it's not an anaphora referencing the existing topic)
  if (!isAnaphoraOrFollowUp(lower)) {
    for (const [key, p] of Object.entries(topicProfiles)) {
      for (const kw of p.keywords) {
        if (lower.includes(kw)) {
          return p.mainExplanation;
        }
      }
    }
  }

  // 8. Follow-up clarification referencing current topic
  if (
    lower.includes("explain more") ||
    lower.includes("tell me more") ||
    lower.includes("why") ||
    lower.includes("how") ||
    lower.includes("what does it mean") ||
    lower.includes("elaborate") ||
    lower.includes("detail")
  ) {
    return `Continuing from our discussion on **${profile.title}**:\n\n${profile.mainExplanation}`;
  }

  // 9. Short student confirmation / answer fallback
  if (
    lower === "yes" ||
    lower === "ok" ||
    lower === "okay" ||
    lower === "got it" ||
    lower === "i understand" ||
    lower === "makes sense"
  ) {
    return `Great job! You have a solid grasp of **${profile.title}**. 

Would you like to:
1. Test your understanding with a quick challenge question?
2. See another practical application or Python coding example?
3. Move on to a related topic like Dynamic Programming or Trees?`;
  }

  // 10. Fallback connecting to previous conversation topic
  return `Building upon what we just explored regarding **${profile.title}**:

You asked: "${userText}"

Here is how this connects to **${profile.title}**:
1. **Core Invariant:** In ${profile.title}, every operation relies on maintaining structural rules and breaking problems down.
2. **Context Connection:** What we previously discussed about ${profile.title} directly applies here.
3. **Next Step:** Would you like to see a targeted Python code trace, or test yourself with a quick quiz on ${profile.title}?`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { messages?: ChatMessage[] };
    const rawMessages = (body.messages || []).filter((message) => message.content?.trim());

    if (!rawMessages.length || rawMessages[rawMessages.length - 1].role !== "user") {
      return Response.json({ error: "Send at least one user message." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // Try Gemini API if key is present
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        // Gemini API rules:
        // 1. History cannot start with a model message. Strip leading model messages.
        // 2. Turns must alternate between 'user' and 'model'.
        let sanitizedHistory: ChatMessage[] = [];
        let previousRole: string | null = null;

        for (const msg of rawMessages.slice(0, -1)) {
          if (!sanitizedHistory.length && msg.role === "model") {
            // Skip leading greeting message from model
            continue;
          }
          if (msg.role === previousRole) {
            // Append content to avoid consecutive same-role turns
            sanitizedHistory[sanitizedHistory.length - 1].content += "\n\n" + msg.content;
          } else {
            sanitizedHistory.push({ role: msg.role, content: msg.content });
            previousRole = msg.role;
          }
        }

        const chat = ai.chats.create({
          model: "gemini-2.5-flash",
          config: { systemInstruction: systemPrompt, temperature: 0.4 },
          history: sanitizedHistory.map((m) => ({
            role: m.role,
            parts: [{ text: m.content }],
          })),
        });

        const latestUserMessage = rawMessages[rawMessages.length - 1].content;
        const stream = await chat.sendMessageStream({ message: latestUserMessage });
        const encoder = new TextEncoder();

        const readable = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of stream) {
                if (chunk.text) controller.enqueue(encoder.encode(chunk.text));
              }
              controller.close();
            } catch (streamErr) {
              controller.error(streamErr);
            }
          },
        });

        return new Response(readable, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
            "X-Tutor-Provider": "gemini",
          },
        });
      } catch (geminiError) {
        console.warn("Gemini API call failed, falling back to context engine:", geminiError);
        // Fall through to context-aware engine below
      }
    }

    // Context-Aware Tutor Engine (Handles full chat history, previous topics, and follow-ups)
    const contextualResponse = generateContextualTutorResponse(rawMessages);

    // Stream the response back in chunks for responsive live typing feel
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const chunkSize = 32;
        for (let i = 0; i < contextualResponse.length; i += chunkSize) {
          const chunk = contextualResponse.slice(i, i + chunkSize);
          controller.enqueue(encoder.encode(chunk));
          // Small micro-delay to simulate natural typing speed
          await new Promise((resolve) => setTimeout(resolve, 8));
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Tutor-Provider": "digiguide-context-engine",
      },
    });
  } catch (error) {
    console.error("Chat route failed", error);
    return Response.json({ error: "The tutor could not respond right now." }, { status: 500 });
  }
}
