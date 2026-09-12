"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  HelpCircle,
  RotateCcw,
  Sparkles,
  XCircle,
  Zap,
} from "lucide-react";
import StudyWatermark from "@/components/study-watermark";
import rawQuestions from "./questions.json";

export type QuizQuestion = {
  id: number;
  topic: string;
  prompt: string;
  answers: string[];
  correct: number;
  explanation: string;
  difficulty?: number;
  isOneWord?: boolean;
};

const API = process.env.NEXT_PUBLIC_API_URL || "";

const FALLBACK_QUESTIONS: QuizQuestion[] = rawQuestions as QuizQuestion[];

const AVAILABLE_TOPICS = [
  "All Topics",
  "⚡ One-Word Rapid Fire",
  "Dynamic Programming",
  "Recursion",
  "Trees",
  "Arrays",
  "Linked Lists",
  "Binary Search",
  "Memoization",
  "Python",
];

export default function QuizPage() {
  return (
    <Suspense fallback={<main className="quiz-shell"><div className="quiz-card">Loading adaptive session...</div></main>}>
      <QuizContent />
    </Suspense>
  );
}

function QuizContent() {
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get("topic") || "All Topics";

  const [selectedTopic, setSelectedTopic] = useState<string>(initialTopic);
  const [questions, setQuestions] = useState<QuizQuestion[]>(FALLBACK_QUESTIONS.slice(0, 6));
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timer, setTimer] = useState(0);
  const [studentName, setStudentName] = useState("Alex");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("digiguide-user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) setStudentName(parsed.name.split(" ")[0]);
      }
    } catch {
      // Keep default
    }
  }, []);

  // Filter or fetch questions when selected topic changes
  useEffect(() => {
    let mounted = true;
    const fetchQuestions = async () => {
      // If it's the Rapid-Fire chip, handle locally with all one-word questions
      if (selectedTopic === "⚡ One-Word Rapid Fire") {
        if (mounted) {
          const oneWordList = FALLBACK_QUESTIONS.filter((q) => q.isOneWord);
          // Pick 6 varied one-word questions
          const shuffled = [...oneWordList].sort(() => 0.5 - Math.random());
          setQuestions(shuffled.slice(0, 6));
          setStep(0);
          setSelected(null);
          setIsAnswerChecked(false);
          setAnswers([]);
          setDone(false);
          setTimer(0);
        }
        return;
      }

      try {
        const queryTopic = selectedTopic !== "All Topics" ? `?topic=${encodeURIComponent(selectedTopic)}&count=6` : `?count=6`;
        const res = await fetch(`${API}/api/quiz/questions${queryTopic}`);
        if (res.ok) {
          const data: QuizQuestion[] = await res.json();
          if (mounted && data.length > 0) {
            setQuestions(data);
            setStep(0);
            setSelected(null);
            setIsAnswerChecked(false);
            setAnswers([]);
            setDone(false);
            setTimer(0);
            return;
          }
        }
      } catch {
        // Use fallback
      }

      if (mounted) {
        if (selectedTopic === "All Topics") {
          // Pick a balanced, engaging set of 6 questions
          const shuffled = [...FALLBACK_QUESTIONS].sort(() => 0.5 - Math.random());
          setQuestions(shuffled.slice(0, 6));
        } else {
          const filtered = FALLBACK_QUESTIONS.filter(
            (q) => q.topic.toLowerCase() === selectedTopic.toLowerCase()
          );
          setQuestions(filtered.length > 0 ? filtered : FALLBACK_QUESTIONS.slice(0, 5));
        }
        setStep(0);
        setSelected(null);
        setIsAnswerChecked(false);
        setAnswers([]);
        setDone(false);
        setTimer(0);
      }
    };

    void fetchQuestions();
    return () => {
      mounted = false;
    };
  }, [selectedTopic]);

  // Live timer tick
  useEffect(() => {
    if (done || isAnswerChecked) return;
    const interval = window.setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [done, isAnswerChecked, step]);

  const question = questions[step] || questions[0];
  const score = answers.filter(Boolean).length;

  const checkAnswer = () => {
    if (selected === null || isAnswerChecked) return;
    setIsAnswerChecked(true);
  };

  const advanceNext = async () => {
    if (selected === null || submitting) return;
    setSubmitting(true);
    const correct = selected === question.correct;
    const nextAnswers = [...answers, correct];

    // Submit activity to backend
    const studentSlug = studentName.toLowerCase().replace(/[^a-z0-9]/g, "-") || "alex";
    try {
      await fetch(`${API}/api/twin/${studentSlug}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: question.topic,
          correct,
          difficulty: question.difficulty || 0.6,
          time_seconds: Math.max(1, timer),
        }),
      });
    } catch {
      // Offline fallback
    }

    setAnswers(nextAnswers);
    setSubmitting(false);

    if (step >= questions.length - 1) {
      setDone(true);
    } else {
      setStep((prev) => prev + 1);
      setSelected(null);
      setIsAnswerChecked(false);
      setTimer(0);
    }
  };

  const resetQuiz = () => {
    // Reshuffle for fresh practice
    if (selectedTopic === "⚡ One-Word Rapid Fire") {
      const oneWordList = FALLBACK_QUESTIONS.filter((q) => q.isOneWord);
      setQuestions([...oneWordList].sort(() => 0.5 - Math.random()).slice(0, 6));
    } else if (selectedTopic === "All Topics") {
      setQuestions([...FALLBACK_QUESTIONS].sort(() => 0.5 - Math.random()).slice(0, 6));
    }
    setStep(0);
    setSelected(null);
    setIsAnswerChecked(false);
    setAnswers([]);
    setDone(false);
    setTimer(0);
  };

  if (done) {
    const accuracyPercent = Math.round((score / Math.max(1, questions.length)) * 100);
    return (
      <main className="quiz-shell">
        <div className="watermark-layer" aria-hidden="true">
          <div className="watermark-orbit watermark-orbit-1" />
          <div className="watermark-orbit watermark-orbit-2" />
        </div>
        <StudyWatermark />
        <div className="quiz-card result">
          <div className="result-icon">
            <CheckCircle2 size={32} />
          </div>
          <div className="kicker">Adaptive Session Complete</div>
          <h1>Nice work, {studentName}.</h1>
          <p>
            You scored {score} out of {questions.length} ({accuracyPercent}%). Your digital twin probabilistic state has been updated.
          </p>
          <div className="result-grid">
            <div>
              <strong>{accuracyPercent}%</strong>
              <span>Accuracy</span>
            </div>
            <div>
              <strong>
                {score} / {questions.length}
              </strong>
              <span>Correct Answers</span>
            </div>
            <div>
              <strong>+{Math.max(1, score * 3)}%</strong>
              <span>Twin Signal</span>
            </div>
          </div>
          <div className="result-actions" style={{ flexWrap: "wrap", gap: "10px" }}>
            <Link href="/" className="quiz-button">
              Return to Overview <ArrowRight size={16} />
            </Link>
            <button className="secondary-button" onClick={resetQuiz}>
              <RotateCcw size={15} /> Practice Again
            </button>
            {selectedTopic !== "⚡ One-Word Rapid Fire" && (
              <button
                className="secondary-button"
                onClick={() => setSelectedTopic("⚡ One-Word Rapid Fire")}
                style={{ background: "#fffbeb", color: "#b45309", borderColor: "#fde68a" }}
              >
                <Zap size={14} /> Try One-Word Rapid Fire
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="quiz-shell">
      <div className="watermark-layer" aria-hidden="true">
        <div className="watermark-orbit watermark-orbit-1" />
        <div className="watermark-orbit watermark-orbit-2" />
      </div>
      <StudyWatermark />
      <div className="quiz-top">
        <Link href="/" className="back-link">
          <ArrowLeft size={16} /> Overview
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className="quiz-timer-badge">
            <Clock3 size={14} /> {timer}s
          </span>
          <span>Adaptive session</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "18px", justifyContent: "center" }}>
        {AVAILABLE_TOPICS.map((t) => (
          <button
            key={t}
            className={`topic-tag-btn ${selectedTopic === t ? "active" : ""} ${t.startsWith("⚡") ? "rapid-chip" : ""}`}
            onClick={() => setSelectedTopic(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="quiz-progress">
        <i style={{ width: `${((step + (isAnswerChecked ? 1 : 0.5)) / Math.max(1, questions.length)) * 100}%` }} />
      </div>

      <section className="quiz-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <div className="kicker">
            Question {step + 1} of {questions.length}
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {question.isOneWord && (
              <span className="one-word-badge">
                <Zap size={11} /> One-Word
              </span>
            )}
            <span className="topic-pill">{question.topic}</span>
          </div>
        </div>

        <h1>{question.prompt}</h1>

        <div className={`answers ${question.isOneWord ? "is-one-word" : ""}`}>
          {question.answers.map((answer, index) => {
            let extraClass = "";
            if (isAnswerChecked) {
              if (index === question.correct) extraClass = "is-correct";
              else if (selected === index) extraClass = "is-wrong";
            } else if (selected === index) {
              extraClass = "selected";
            }

            return (
              <button
                key={answer}
                className={extraClass}
                disabled={isAnswerChecked}
                onClick={() => setSelected(index)}
              >
                <span>{String.fromCharCode(65 + index)}</span>
                {answer}
              </button>
            );
          })}
        </div>

        {isAnswerChecked && (
          <div className={`quiz-explanation-card ${selected === question.correct ? "correct" : "incorrect"}`}>
            <div className={`quiz-explanation-title ${selected === question.correct ? "correct" : "incorrect"}`}>
              {selected === question.correct ? (
                <>
                  <CheckCircle2 size={16} /> Correct! Well reasoned.
                </>
              ) : (
                <>
                  <XCircle size={16} /> Not quite right.
                </>
              )}
            </div>
            <p className="quiz-explanation-text">{question.explanation}</p>
          </div>
        )}

        {!isAnswerChecked ? (
          <button
            className="quiz-button next"
            disabled={selected === null}
            onClick={checkAnswer}
          >
            Check Answer <HelpCircle size={16} />
          </button>
        ) : (
          <button
            className="quiz-button next"
            disabled={submitting}
            onClick={() => void advanceNext()}
          >
            {step >= questions.length - 1 ? (
              <>
                Complete Practice <Sparkles size={16} />
              </>
            ) : (
              <>
                Next Question <ArrowRight size={16} />
              </>
            )}
          </button>
        )}

        <div className="quiz-note">
          <Sparkles size={14} /> Answer accuracy directly calibrates your probabilistic digital twin.
        </div>
      </section>
    </main>
  );
}
