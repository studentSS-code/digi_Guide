export type TopicMastery = {
  topic: string;
  mastery: number;
  confidence: number;
  attempts: number;
  accuracy: number;
};

export type Recommendation = {
  topic: string;
  reason: string;
  minutes: number;
  priority: "High" | "Medium" | "Low";
};

export type LearningTwin = {
  student_id: string;
  overall_score: number;
  weekly_study_hours: number;
  topics: TopicMastery[];
  recommendations: Recommendation[];
};

export type ActivityRecord = {
  id: number;
  topic: string;
  kind: string;
  summary: string;
  detail: string;
  created_at: string;
};

export type Preferences = {
  name: string;
  weekly_goal_hours: number;
  daily_reminders: boolean;
};

const DEFAULT_TOPICS: TopicMastery[] = [
  { topic: "Python", mastery: 91.0, confidence: 0.95, attempts: 64, accuracy: 0.91 },
  { topic: "Arrays", mastery: 83.0, confidence: 0.88, attempts: 52, accuracy: 0.84 },
  { topic: "Linked Lists", mastery: 72.0, confidence: 0.75, attempts: 38, accuracy: 0.74 },
  { topic: "Recursion", mastery: 68.0, confidence: 0.70, attempts: 34, accuracy: 0.69 },
  { topic: "Trees", mastery: 61.0, confidence: 0.61, attempts: 29, accuracy: 0.63 },
  { topic: "Memoization", mastery: 52.0, confidence: 0.55, attempts: 25, accuracy: 0.54 },
  { topic: "Dynamic Programming", mastery: 38.0, confidence: 0.47, attempts: 21, accuracy: 0.43 },
];

function calculateOverallScore(topics: TopicMastery[]): number {
  if (!topics.length) return 65;
  const weighted = topics.reduce((acc, t) => acc + t.mastery * (0.6 + 0.4 * t.confidence), 0);
  const totalWeight = topics.reduce((acc, t) => acc + (0.6 + 0.4 * t.confidence), 0);
  return Math.round((weighted / totalWeight) * 10) / 10;
}

function generateRecommendations(topics: TopicMastery[]): Recommendation[] {
  const sorted = [...topics].sort((a, b) => a.mastery - b.mastery);
  const recs: Recommendation[] = [];

  const lowest = sorted[0];
  if (lowest && lowest.mastery < 60) {
    recs.push({
      topic: lowest.topic,
      reason: `Your recent practice shows cognitive strain in ${lowest.topic}. Strengthening prerequisites will unlock downstream retention.`,
      minutes: 25,
      priority: "High",
    });
  }

  const mid = sorted.find((t) => t.mastery >= 60 && t.mastery < 80);
  if (mid) {
    recs.push({
      topic: mid.topic,
      reason: `Moderate familiarity detected in ${mid.topic}. Spaced retrieval now will accelerate automaticity.`,
      minutes: 15,
      priority: "Medium",
    });
  }

  if (recs.length === 0 && lowest) {
    recs.push({
      topic: lowest.topic,
      reason: `Periodic refresh recommended to maintain peak recall fidelity in ${lowest.topic}.`,
      minutes: 10,
      priority: "Low",
    });
  }

  return recs;
}

class StudentTwinStore {
  private static instance: StudentTwinStore;
  private twins: Map<string, LearningTwin> = new Map();
  private activities: Map<string, ActivityRecord[]> = new Map();
  private preferences: Map<string, Preferences> = new Map();

  private constructor() {}

  public static getInstance(): StudentTwinStore {
    if (!StudentTwinStore.instance) {
      StudentTwinStore.instance = new StudentTwinStore();
    }
    return StudentTwinStore.instance;
  }

  private initStudentIfMissing(slug: string): void {
    if (!this.twins.has(slug)) {
      const clonedTopics = DEFAULT_TOPICS.map((t) => ({ ...t }));
      this.twins.set(slug, {
        student_id: slug,
        overall_score: calculateOverallScore(clonedTopics),
        weekly_study_hours: 6.4,
        topics: clonedTopics,
        recommendations: generateRecommendations(clonedTopics),
      });
    }

    if (!this.activities.has(slug)) {
      this.activities.set(slug, [
        {
          id: 1,
          topic: "Dynamic Programming",
          kind: "Practice Quiz",
          summary: "Completed DP Memoization Check",
          detail: "4 of 6 correct · Accuracy 67%",
          created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        },
        {
          id: 2,
          topic: "Trees",
          kind: "Study Hub",
          summary: "Reviewed Binary Tree Traversals & Notes",
          detail: "18 minutes active review",
          created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        },
        {
          id: 3,
          topic: "Arrays",
          kind: "Practice Quiz",
          summary: "Completed Arrays: Two Pointer Technique",
          detail: "5 of 6 correct · Accuracy 83%",
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
      ]);
    }

    if (!this.preferences.has(slug)) {
      const name = slug
        .split("-")
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ") || "Alex Smith";
      this.preferences.set(slug, {
        name,
        weekly_goal_hours: 8,
        daily_reminders: true,
      });
    }
  }

  public getTwin(slug: string): LearningTwin {
    this.initStudentIfMissing(slug);
    return this.twins.get(slug)!;
  }

  public getActivities(slug: string): ActivityRecord[] {
    this.initStudentIfMissing(slug);
    return this.activities.get(slug)!;
  }

  public getPreferences(slug: string): Preferences {
    this.initStudentIfMissing(slug);
    return this.preferences.get(slug)!;
  }

  public updatePreferences(slug: string, updates: Partial<Preferences>): Preferences {
    this.initStudentIfMissing(slug);
    const current = this.preferences.get(slug)!;
    const updated = { ...current, ...updates };
    this.preferences.set(slug, updated);
    return updated;
  }

  public recordActivity(
    slug: string,
    payload: {
      topic: string;
      correct?: boolean;
      score?: number;
      total?: number;
      kind?: string;
      summary?: string;
      detail?: string;
    }
  ): LearningTwin {
    this.initStudentIfMissing(slug);
    const twin = this.twins.get(slug)!;
    const targetTopic = twin.topics.find(
      (t) => t.topic.toLowerCase() === payload.topic.toLowerCase()
    );

    if (targetTopic) {
      targetTopic.attempts += 1;
      const isCorrect = payload.correct ?? (payload.score !== undefined && payload.total !== undefined ? payload.score >= payload.total / 2 : true);
      
      const outcomeVal = isCorrect ? 1.0 : 0.0;
      targetTopic.accuracy = Math.round((targetTopic.accuracy * 0.85 + outcomeVal * 0.15) * 100) / 100;
      targetTopic.confidence = Math.min(0.98, Math.max(0.3, targetTopic.confidence + (isCorrect ? 0.04 : -0.05)));
      
      const delta = isCorrect ? 4.5 * targetTopic.confidence : -3.5 * (1 - targetTopic.confidence);
      targetTopic.mastery = Math.min(99, Math.max(15, Math.round(targetTopic.mastery + delta)));
    }

    twin.overall_score = calculateOverallScore(twin.topics);
    twin.weekly_study_hours = Math.min(40, Math.round((twin.weekly_study_hours + 0.25) * 10) / 10);
    twin.recommendations = generateRecommendations(twin.topics);

    const activities = this.activities.get(slug)!;
    const newId = (activities[0]?.id ?? 0) + 1;
    const summary = payload.summary || `Practiced ${payload.topic}`;
    const detail = payload.detail || (payload.score !== undefined && payload.total !== undefined
      ? `${payload.score} of ${payload.total} correct`
      : payload.correct ? "Solved question correctly" : "Question reviewed");

    activities.unshift({
      id: newId,
      topic: payload.topic,
      kind: payload.kind || "Practice Quiz",
      summary,
      detail,
      created_at: new Date().toISOString(),
    });

    if (activities.length > 30) {
      activities.length = 30;
    }

    return twin;
  }
}

export const twinStore = StudentTwinStore.getInstance();
