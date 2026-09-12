"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ListChecks } from "lucide-react";
import NotesHub from "@/components/notes-hub";
import StudyWatermark from "@/components/study-watermark";
import { Topic } from "@/components/dashboard";

const defaultTopics: Topic[] = [
  { topic: "Python", mastery: 91, confidence: 0.95, attempts: 64, accuracy: 0.91 },
  { topic: "Arrays", mastery: 83, confidence: 0.88, attempts: 52, accuracy: 0.84 },
  { topic: "Linked Lists", mastery: 72, confidence: 0.75, attempts: 38, accuracy: 0.74 },
  { topic: "Recursion", mastery: 68, confidence: 0.70, attempts: 34, accuracy: 0.69 },
  { topic: "Trees", mastery: 61, confidence: 0.61, attempts: 29, accuracy: 0.63 },
  { topic: "Memoization", mastery: 52, confidence: 0.55, attempts: 25, accuracy: 0.54 },
  { topic: "Dynamic Programming", mastery: 38, confidence: 0.47, attempts: 21, accuracy: 0.43 },
];

export default function NotesPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>(defaultTopics);

  useEffect(() => {
    try {
      const studentName = "Alex Smith";
      const studentSlug = studentName.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const API = process.env.NEXT_PUBLIC_API_URL || "";
      fetch(`${API}/api/twin/${studentSlug}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.topics?.length) setTopics(data.topics);
        })
        .catch(() => {
          // Keep defaults
        });
    } catch {
      // Keep defaults
    }
  }, []);

  return (
    <div className="shell" style={{ display: "block", minHeight: "100vh" }}>
      <div className="watermark-layer" aria-hidden="true">
        <div className="watermark-orbit watermark-orbit-1" />
        <div className="watermark-orbit watermark-orbit-2" />
      </div>
      <StudyWatermark />

      <main className="main" style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px 20px 60px" }}>
        {/* Navigation Bar */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/digigyan-logo.png"
              alt="digiGUIDE Logo"
              style={{ width: "40px", height: "40px", objectFit: "contain" }}
            />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
              <span style={{ fontFamily: "Space Grotesk", fontSize: "19px", fontWeight: 800, color: "var(--ink)" }}>
                digi<span style={{ color: "var(--teal)" }}>GUIDE</span>
              </span>
              <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", fontWeight: 700 }}>
                Notes &amp; Study Hub
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link
              href="/"
              className="icon-button"
              style={{ width: "auto", padding: "0 14px", display: "inline-flex", gap: "6px", textDecoration: "none", fontSize: "12px", fontWeight: 700, color: "var(--ink)" }}
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
            <Link
              href="/quiz"
              className="cta"
              style={{ padding: "8px 16px", textDecoration: "none", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <ListChecks size={14} /> Practice Quiz
            </Link>
          </div>
        </header>

        {/* Notes Hub Component */}
        <NotesHub
          topics={topics}
          onOpenQuiz={(topic) => router.push(`/quiz?topic=${encodeURIComponent(topic)}`)}
          onAskAi={(prompt) => {
            router.push(`/?tab=tutor`);
          }}
        />
      </main>
    </div>
  );
}
