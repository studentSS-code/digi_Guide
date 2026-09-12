import { NextRequest, NextResponse } from "next/server";
import questionsData from "@/app/quiz/questions.json";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const topicParam = searchParams.get("topic");
  const countParam = parseInt(searchParams.get("count") || "6", 10);

  let filtered = questionsData;
  if (topicParam && topicParam !== "All Topics") {
    filtered = questionsData.filter(
      (q) => q.topic.toLowerCase() === topicParam.toLowerCase()
    );
  }

  // Shuffle and limit
  const shuffled = [...filtered].sort(() => 0.5 - Math.random());
  return NextResponse.json(shuffled.slice(0, countParam));
}
