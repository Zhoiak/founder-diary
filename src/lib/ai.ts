import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

interface DailyLog {
  date: string;
  title: string;
  content_md: string;
  tags: string[];
  mood?: number;
  time_spent_minutes?: number;
}

export async function summarizeLogs(logs: DailyLog[]): Promise<string> {
  if (!openai) {
    // Fallback summary without AI
    return generateFallbackSummary(logs);
  }

  try {
    const logsText = logs
      .map((log) => `**${log.date}** - ${log.title}\n${log.content_md}\nTags: ${log.tags.join(", ")}\nMood: ${log.mood || "N/A"}/5\n`)
      .join("\n---\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that summarizes daily founder logs into weekly reviews. 
          Focus on:
          - Top 3 wins/accomplishments
          - 1-3 key blockers or challenges
          - Next week's priorities
          - Overall progress and momentum
          Keep it concise but insightful.`,
        },
        {
          role: "user",
          content: `Please summarize these daily logs into a weekly review:\n\n${logsText}`,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || generateFallbackSummary(logs);
  } catch (error) {
    console.error("OpenAI summarization failed:", error);
    return generateFallbackSummary(logs);
  }
}

function generateFallbackSummary(logs: DailyLog[]): string {
  if (logs.length === 0) return "No logs found for this period.";

  const totalTime = logs.reduce((sum, log) => sum + (log.time_spent_minutes || 0), 0);
  const avgMood = logs.filter(log => log.mood).reduce((sum, log) => sum + (log.mood || 0), 0) / logs.filter(log => log.mood).length;
  const allTags = logs.flatMap(log => log.tags);
  const topTags = [...new Set(allTags)].slice(0, 5);

  return `# Weekly Summary

## Overview
- **${logs.length} log entries** over the week
- **${Math.round(totalTime / 60)} hours** total time logged
- **Average mood**: ${avgMood ? avgMood.toFixed(1) : "N/A"}/5
- **Top activities**: ${topTags.join(", ")}

## Key Highlights
${logs.slice(0, 3).map(log => `- ${log.title}`).join("\n")}

## Focus Areas
Based on your tags: ${topTags.slice(0, 3).join(", ")}

*This summary was generated automatically. Consider adding OpenAI API key for more detailed insights.*`;
}

export async function generateInvestorUpdate(logs: DailyLog[], goals: any[], metrics: any): Promise<string> {
  if (!openai) {
    return generateFallbackInvestorUpdate(logs, goals, metrics);
  }

  try {
    const context = `
Recent Activity (${logs.length} entries):
${logs.slice(0, 10).map(log => `- ${log.date}: ${log.title}`).join("\n")}

Goals Progress:
${goals.map(goal => `- ${goal.objective}: ${goal.key_results?.length || 0} key results`).join("\n")}

Metrics: ${JSON.stringify(metrics, null, 2)}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are writing a monthly investor update for a startup founder. 
          Structure it with:
          - Executive Summary
          - Key Metrics
          - Major Milestones
          - Challenges & Risks
          - Next Month Goals
          - Ask (what help you need)
          
          Keep it professional, concise, and data-driven.`,
        },
        {
          role: "user",
          content: `Generate a monthly investor update based on this data:\n\n${context}`,
        },
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || generateFallbackInvestorUpdate(logs, goals, metrics);
  } catch (error) {
    console.error("OpenAI investor update generation failed:", error);
    return generateFallbackInvestorUpdate(logs, goals, metrics);
  }
}

function generateFallbackInvestorUpdate(logs: DailyLog[], goals: any[], metrics: any): string {
  const currentDate = new Date();
  const monthYear = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return `# Monthly Update - ${monthYear}

## Executive Summary
This month we made significant progress across product development, user acquisition, and team building.

## Key Metrics
- **Activity**: ${logs.length} logged work sessions
- **Goals**: ${goals.length} active objectives
- **Focus Areas**: ${[...new Set(logs.flatMap(log => log.tags))].slice(0, 5).join(", ")}

## Major Milestones
${logs.slice(0, 5).map(log => `- ${log.title}`).join("\n")}

## Goals Progress
${goals.map(goal => `- **${goal.objective}**: ${goal.key_results?.length || 0} key results tracked`).join("\n")}

## Next Month Focus
- Continue execution on current objectives
- Address any blockers identified in daily logs
- Maintain momentum on key initiatives

## Ask
- Feedback on current strategy
- Introductions to potential customers/partners
- Guidance on scaling challenges

---
*This update was generated automatically. Consider adding OpenAI API key for more detailed insights.*`;
}
