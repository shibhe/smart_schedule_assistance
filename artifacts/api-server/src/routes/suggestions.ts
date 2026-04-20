import { Router, type IRouter } from "express";
import { db, eventsTable } from "@workspace/db";
import { gte, desc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

router.get("/suggestions", async (_req, res): Promise<void> => {
  const now = new Date();
  const recentEvents = await db
    .select()
    .from(eventsTable)
    .where(gte(eventsTable.createdAt, new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)))
    .orderBy(desc(eventsTable.startTime))
    .limit(20);

  const today = now.toISOString().split("T")[0];
  const todayFormatted = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const eventsContext =
    recentEvents.length > 0
      ? recentEvents
          .map(
            (e) =>
              `- "${e.title}" (${e.category}, ${e.priority} priority) at ${new Date(e.startTime).toLocaleString()}`,
          )
          .join("\n")
      : "No recent events.";

  const prompt = `You are a smart scheduling AI. Today is ${todayFormatted} (${today}).

Based on these recent events:
${eventsContext}

Generate exactly 3 intelligent scheduling suggestions to help improve productivity and work-life balance. 
Return ONLY valid JSON array, no markdown, no explanation:
[
  {
    "id": 1,
    "title": "suggestion title",
    "description": "brief description",
    "suggestedTime": "HH:MM",
    "suggestedDate": "YYYY-MM-DD",
    "category": "work|personal|health|social|general",
    "priority": "low|medium|high",
    "reason": "why this is suggested",
    "confidence": 0.0-1.0
  }
]

Make suggestions relevant, actionable, and specific. Consider patterns in the schedule.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const content = completion.choices[0]?.message?.content ?? "[]";

    let suggestions: unknown[] = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      }
    } catch {
      suggestions = getFallbackSuggestions(today);
    }

    res.json(suggestions);
  } catch (err) {
    res.json(getFallbackSuggestions(today));
  }
});

function getFallbackSuggestions(today: string) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  return [
    {
      id: 1,
      title: "Morning Review Session",
      description: "Start your day by reviewing your schedule and priorities",
      suggestedTime: "09:00",
      suggestedDate: tomorrow.toISOString().split("T")[0],
      category: "work",
      priority: "high",
      reason: "A consistent morning review boosts daily productivity",
      confidence: 0.85,
    },
    {
      id: 2,
      title: "Midday Break & Walk",
      description: "Take a 20-minute break to recharge your focus",
      suggestedTime: "12:30",
      suggestedDate: tomorrowStr,
      category: "health",
      priority: "medium",
      reason: "Regular breaks improve cognitive performance and reduce stress",
      confidence: 0.78,
    },
    {
      id: 3,
      title: "Weekly Planning Session",
      description: "Plan your upcoming week to reduce scheduling stress",
      suggestedTime: "17:00",
      suggestedDate: today,
      category: "personal",
      priority: "medium",
      reason: "Proactive weekly planning leads to better time management",
      confidence: 0.72,
    },
  ];
}

export default router;
