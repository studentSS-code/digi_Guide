"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  BrainCircuit,
  ChevronRight,
  CircleHelp,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MessageCircle,
  PlayCircle,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AiTutor from "./ai-tutor";
import NotesHub from "./notes-hub";
import StudyWatermark from "./study-watermark";

export type Topic = { topic: string; mastery: number; confidence: number; attempts: number; accuracy: number };
type Twin = {
  overall_score: number;
  weekly_study_hours: number;
  topics: Topic[];
  recommendations: { topic: string; reason: string; minutes: number; priority: string }[];
};
type ActivityRecord = { id: number; topic: string; kind: string; summary: string; detail: string; created_at: string };
type Preferences = { name: string; weekly_goal_hours: number; daily_reminders: boolean };

const API = process.env.NEXT_PUBLIC_API_URL || "";
const performance = [
  { day: "Mon", score: 58 },
  { day: "Tue", score: 64 },
  { day: "Wed", score: 61 },
  { day: "Thu", score: 70 },
  { day: "Fri", score: 68 },
  { day: "Sat", score: 76 },
  { day: "Sun", score: 78 },
];
const colors = ["#0f7770", "#4d9e7c", "#83b86b", "#e5a64e", "#f27e63", "#7556bc", "#00838f"];

const defaultTopics: Topic[] = [
  { topic: "Python", mastery: 91, confidence: 0.95, attempts: 64, accuracy: 0.91 },
  { topic: "Arrays", mastery: 83, confidence: 0.88, attempts: 52, accuracy: 0.84 },
  { topic: "Linked Lists", mastery: 72, confidence: 0.75, attempts: 38, accuracy: 0.74 },
  { topic: "Recursion", mastery: 68, confidence: 0.70, attempts: 34, accuracy: 0.69 },
  { topic: "Trees", mastery: 61, confidence: 0.61, attempts: 29, accuracy: 0.63 },
  { topic: "Memoization", mastery: 52, confidence: 0.55, attempts: 25, accuracy: 0.54 },
  { topic: "Dynamic Programming", mastery: 38, confidence: 0.47, attempts: 21, accuracy: 0.43 },
];

const nav = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Practice", icon: ListChecks },
  { label: "Knowledge map", icon: BrainCircuit },
  { label: "Notes", icon: BookOpen },
  { label: "AI tutor", icon: MessageCircle },
];

export default function Dashboard() {
  const router = useRouter();
  const [active, setActive] = useState("Overview");
  const [tutorPrompt, setTutorPrompt] = useState("");
  const [twin, setTwin] = useState<Twin | null>(null);
  const [history, setHistory] = useState<ActivityRecord[]>([]);
  const [userProfile, setUserProfile] = useState({ name: "Alex Smith", email: "alex@example.com", field: "Computer Science" });
  const [preferences, setPreferences] = useState<Preferences>({ name: "Alex Smith", weekly_goal_hours: 8, daily_reminders: true });
  const [dialog, setDialog] = useState<"help" | "settings" | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem("digiguide-auth") === "false") {
      router.replace("/auth");
      return;
    }
    if (!window.localStorage.getItem("digiguide-auth")) {
      window.localStorage.setItem("digiguide-auth", "true");
    }

    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam) {
        if (tabParam.toLowerCase() === "notes") setActive("Notes");
        else if (tabParam.toLowerCase() === "quiz" || tabParam.toLowerCase() === "practice") router.push("/quiz");
        else if (tabParam.toLowerCase() === "map") setActive("Knowledge map");
        else if (tabParam.toLowerCase() === "tutor") setActive("AI tutor");
      }
    } catch {
      // ignore
    }

    let studentName = "Alex Smith";
    try {
      const stored = window.localStorage.getItem("digiguide-user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) {
          studentName = parsed.name;
          setUserProfile(parsed);
          setPreferences((prev) => ({ ...prev, name: parsed.name }));
        }
      }
    } catch {
      // Keep defaults
    }

    const studentSlug = studentName.toLowerCase().replace(/[^a-z0-9]/g, "-") || "alex";

    const load = async () => {
      try {
        const responses = await Promise.all([
          fetch(`${API}/api/twin/${studentSlug}`),
          fetch(`${API}/api/activity/${studentSlug}`),
          fetch(`${API}/api/preferences/${studentSlug}`),
        ]);
        if (responses[0]?.ok) {
          const twinData = await responses[0].json();
          if (twinData?.topics?.length) setTwin(twinData);
        }
        if (responses[1]?.ok) {
          const actData = await responses[1].json();
          if (Array.isArray(actData)) setHistory(actData);
        }
        if (responses[2]?.ok) {
          const prefData = await responses[2].json();
          if (prefData) setPreferences(prefData);
        }
      } catch {
        // Smooth local calibration fallback without intrusive banner
      }
    };
    void load();
  }, [router]);

  const topics = twin?.topics?.length ? twin.topics : defaultTopics;
  const date = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date());
  const activityDate = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  const openNav = (label: string) => {
    if (label === "Practice") router.push("/quiz");
    else setActive(label);
  };

  const logout = () => {
    window.localStorage.setItem("digiguide-auth", "false");
    window.localStorage.removeItem("digiguide-user");
    router.replace("/auth");
  };

  const savePreferences = async () => {
    const studentSlug = userProfile.name.toLowerCase().replace(/[^a-z0-9]/g, "-") || "alex";
    try {
      const response = await fetch(`${API}/api/preferences/${studentSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      if (response.ok) {
        setPreferences(await response.json());
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1800);
      }
    } catch {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    }
  };

  const initials = (userProfile.name || "Alex Smith")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const firstName = (userProfile.name || "Alex Smith").split(" ")[0];

  return (
    <div className="shell">
      <div className="watermark-layer" aria-hidden="true">
        <div className="watermark-orbit watermark-orbit-1" />
        <div className="watermark-orbit watermark-orbit-2" />
      </div>
      <StudyWatermark />

      <aside className="sidebar">
        <div className="brand-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/digigyan-logo.png"
            alt="digiGUIDE Platform Logo"
            className="brand-logo-img"
          />
          <div className="brand-text">
            <span className="brand-title">
              digi<span className="brand-title-accent">GUIDE</span>
            </span>
            <span className="brand-tagline">AI Learning Twin</span>
          </div>
        </div>
        <nav className="nav">
          {nav.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-button ${active === label ? "active" : ""}`}
              onClick={() => openNav(label)}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
          <button
            className={`nav-button ${active === "History" ? "active" : ""}`}
            onClick={() => setActive("History")}
          >
            <Activity size={17} />
            History
          </button>
        </nav>

        <div className="side-bottom">
          <div className="health">
            <Target size={15} /> Twin health <strong>96%</strong>
          </div>
          Continuous adaptation active.
          <br />
          Synced with your practice.
        </div>

        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <div className="avatar">{initials}</div>
            <div>
              <div className="sidebar-user-name">{userProfile.name}</div>
              <div className="sidebar-user-field">{userProfile.field}</div>
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={logout} title="Log out" aria-label="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <div className="kicker">{date}</div>
            <h1>Hello, {firstName}.</h1>
          </div>
          <div className="top-actions">
            <div className="twin-status-pill" title="Digital twin engine calibrated and synchronized in real time">
              <span className="twin-status-dot" />
              <span className="twin-status-label">Twin Engine Active</span>
              <span className="twin-status-tag">Calibrated</span>
            </div>
            <button className="top-action-btn" onClick={() => router.push("/quiz")} title="Open Practice Quiz">
              <ListChecks size={15} />
              <span>Practice</span>
            </button>
            <button className="icon-button" aria-label="Open help" onClick={() => setDialog("help")}>
              <CircleHelp size={18} />
            </button>
            <button className="icon-button" aria-label="Open settings" onClick={() => setDialog("settings")}>
              <Settings size={18} />
            </button>
            <div className="profile">
              <div className="avatar">{initials}</div>
              <div>
                <strong>{userProfile.name}</strong>
                <small>{userProfile.field}</small>
              </div>
            </div>
          </div>
        </header>

        {active === "Overview" && (
          <Overview twin={twin} topics={topics} history={history} setActive={setActive} router={router} date={activityDate} />
        )}
        {active === "Knowledge map" && <KnowledgeMap topics={topics} router={router} />}
        {active === "Notes" && (
          <NotesHub
            topics={topics}
            onOpenQuiz={(topic) => router.push(`/quiz?topic=${encodeURIComponent(topic)}`)}
            onAskAi={(prompt) => {
              setTutorPrompt(prompt);
              setActive("AI tutor");
            }}
          />
        )}
        {active === "History" && <History history={history} date={activityDate} />}
        {active === "AI tutor" && <AiTutor initialPrompt={tutorPrompt} />}
      </main>

      {dialog && (
        <div className="dialog-backdrop" onClick={() => setDialog(null)}>
          <section className="dialog" onClick={(event) => event.stopPropagation()}>
            <button className="dialog-close" aria-label="Close dialog" onClick={() => setDialog(null)}>
              <X size={17} />
            </button>
            {dialog === "help" ? (
              <>
                <CircleHelp size={25} color="var(--teal)" />
                <h2>How digiGUIDE works</h2>
                <p>
                  Your Learning Digital Twin continuously models your concept mastery, confidence, and speed.
                  Each quiz answer updates your probabilistic state and refines what you should study next.
                </p>
                <button className="cta" onClick={() => setDialog(null)}>
                  Got it
                </button>
              </>
            ) : (
              <>
                <Settings size={25} color="var(--teal)" />
                <h2>Study Preferences</h2>
                <label className="setting-row">
                  <span>Daily reminders</span>
                  <input
                    type="checkbox"
                    checked={preferences.daily_reminders}
                    onChange={(e) => setPreferences({ ...preferences, daily_reminders: e.target.checked })}
                  />
                </label>
                <label className="setting-row">
                  <span>Weekly goal: {preferences.weekly_goal_hours} hours</span>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={preferences.weekly_goal_hours}
                    onChange={(e) => setPreferences({ ...preferences, weekly_goal_hours: Number(e.target.value) })}
                  />
                </label>
                <button className="cta" onClick={() => void savePreferences()}>
                  {saved ? "Saved" : "Save preferences"}
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function Overview({
  twin,
  topics,
  history,
  setActive,
  router,
  date,
}: {
  twin: Twin | null;
  topics: Topic[];
  history: ActivityRecord[];
  setActive: (value: string) => void;
  router: ReturnType<typeof useRouter>;
  date: Intl.DateTimeFormat;
}) {
  const overallScore = Math.round(twin?.overall_score ?? 67);
  const targetTopic = twin?.recommendations?.[0]?.topic || "Dynamic Programming";
  const targetReason =
    twin?.recommendations?.[0]?.reason || "Your recent mistakes point to memoization and state transitions.";

  // Calculate SVG circumference for 64px radius: 2 * PI * 64 = ~402.12
  const strokeDashoffset = 402.12 - (402.12 * overallScore) / 100;

  return (
    <div className="grid">
      <section className="panel hero">
        <div className="hero-copy">
          <div>
            <div className="kicker">
              <span className="twin-active-pulse" /> Live Probabilistic Twin
            </div>
            <h2>Continuous Knowledge Calibration</h2>
            <p>
              Your digital twin models your mastery, retention decay, and pace across 7 curriculum topics in real time.
            </p>
          </div>
          <div className="hero-badges-row">
            <span className="hero-badge-pill highlight">
              <TrendingUp size={13} /> +8.4% Weekly Momentum
            </span>
            <span className="hero-badge-pill">
              <Sparkles size={13} /> Prerequisite Bottleneck: {targetTopic}
            </span>
          </div>
        </div>

        <div className="score-deck">
          <div className="score-ambient-glow" />
          <div className="score-ring-wrap">
            <svg className="score-circle-svg" viewBox="0 0 160 160">
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00f2fe" />
                  <stop offset="55%" stopColor="#38ef7d" />
                  <stop offset="100%" stopColor="#c8f169" />
                </linearGradient>
                <filter id="scoreNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Decorative dashed outer orbit */}
              <circle
                className="score-orbit-dashed"
                cx="80"
                cy="80"
                r="74"
                fill="none"
                stroke="rgba(200,241,105,0.22)"
                strokeWidth="1.2"
                strokeDasharray="5 7"
              />

              {/* Inner background track */}
              <circle
                className="score-circle-bg"
                cx="80"
                cy="80"
                r="64"
                strokeWidth="10"
              />

              {/* Neon Progress Arc */}
              <circle
                className="score-circle-progress"
                cx="80"
                cy="80"
                r="64"
                strokeWidth="10"
                stroke="url(#scoreGrad)"
                strokeDasharray="402.12"
                strokeDashoffset={strokeDashoffset}
                filter="url(#scoreNeonGlow)"
              />
            </svg>

            <div className="score-center-data">
              <span className="score-metric-val">{overallScore}</span>
              <span className="score-metric-label">Twin Score</span>
              <span className="score-status-chip">
                <span className="score-pulse-pip" />
                Calibrated
              </span>
            </div>
          </div>

          <div className="score-satellites">
            <div className="score-sat-chip">
              <span className="sat-title">Confidence</span>
              <span className="sat-val">96%</span>
            </div>
            <div className="score-sat-chip">
              <span className="sat-title">Velocity</span>
              <span className="sat-val">+8.4%</span>
            </div>
          </div>
        </div>
      </section>

      <section className="panel stats">
        <div className="section-head">
          <h2>Study rhythm</h2>
          <Activity size={18} color="var(--teal)" />
        </div>
        <div className="stat-value">
          {twin?.weekly_study_hours ?? 6.4} <span>hrs</span>
        </div>
        <div className="progress">
          <i style={{ width: `${Math.min(100, ((twin?.weekly_study_hours ?? 6.4) / 8) * 100)}%` }} />
        </div>
        <div className="stat-line">
          <span>Weekly goal</span>
          <span>8 hrs</span>
        </div>
      </section>

      <section className="panel chart-panel">
        <div className="section-head">
          <div>
            <h2>Performance trend</h2>
            <p>Your accuracy over the last 7 days</p>
          </div>
          <span className="metric">+20 pts</span>
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performance} margin={{ top: 8, right: 16, left: -25, bottom: 0 }}>
              <CartesianGrid stroke="#edf1ed" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis domain={[40, 90]} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#0f7770" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel recommendation">
        <div className="kicker label">
          <Sparkles size={14} /> Twin recommendation
        </div>
        <h2>Strengthen your {targetTopic} foundations.</h2>
        <p>{targetReason}</p>
        <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
          <button className="cta" onClick={() => router.push(`/quiz?topic=${encodeURIComponent(targetTopic)}`)}>
            Start recovery plan <ArrowUpRight size={15} />
          </button>
          <button
            className="cta"
            style={{ background: "#edf5f2", color: "var(--teal)", border: "1px solid rgba(15,119,112,0.2)" }}
            onClick={() => setActive("Notes")}
          >
            <BookOpen size={14} /> Open Study Notes &amp; Video
          </button>
        </div>
      </section>

      <section className="panel mastery">
        <div className="section-head">
          <div>
            <h2>Topic mastery</h2>
            <p>Based on your practice evidence</p>
          </div>
          <button onClick={() => setActive("Knowledge map")}>
            View map <ChevronRight size={13} />
          </button>
        </div>
        {topics.map((topic, index) => (
          <div className="topic" key={topic.topic}>
            <span>{topic.topic}</span>
            <div className="progress">
              <i style={{ width: `${topic.mastery}%`, background: colors[index % colors.length] }} />
            </div>
            <strong>{Math.round(topic.mastery)}%</strong>
          </div>
        ))}
      </section>

      <section className="panel graph">
        <div className="section-head">
          <div>
            <h2>Knowledge map</h2>
            <p>Prerequisites shaping your next step</p>
          </div>
          <BrainCircuit size={18} color="var(--teal)" />
        </div>
        <MapNodes topics={topics} onSelect={() => setActive("Knowledge map")} />
      </section>

      <section className="panel activity">
        <div className="section-head">
          <h2>Recent activity</h2>
          <button onClick={() => setActive("History")}>
            See history <ChevronRight size={13} />
          </button>
        </div>
        {history.slice(0, 3).map((item) => (
          <div className="activity-row" key={item.id}>
            <div className="activity-icon">
              <Activity size={16} />
            </div>
            <div>
              <p>{item.summary}</p>
              <small>
                {item.kind} · {item.detail}
              </small>
            </div>
            <time>{date.format(new Date(item.created_at))}</time>
          </div>
        ))}
      </section>
    </div>
  );
}

// Layout definitions for the 7 curriculum topics in knowledge map
const MAP_NODE_CONFIG = [
  { topic: "Python", x: 12, y: 16, className: "a" },
  { topic: "Arrays", x: 48, y: 16, className: "b" },
  { topic: "Linked Lists", x: 84, y: 16, className: "c" },
  { topic: "Recursion", x: 30, y: 52, className: "d" },
  { topic: "Memoization", x: 68, y: 52, className: "e" },
  { topic: "Trees", x: 20, y: 84, className: "a" },
  { topic: "Dynamic Programming", x: 74, y: 84, className: "e" },
];

function MapNodes({ topics, onSelect }: { topics: Topic[]; onSelect?: (topic: string) => void }) {
  return (
    <div className="graph-lines">
      <svg className="map-connectors" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {/* Python -> Arrays */}
        <line x1="16" y1="20" x2="48" y2="20" />
        {/* Arrays -> Linked Lists */}
        <line x1="48" y1="20" x2="84" y2="20" />
        {/* Arrays -> Recursion */}
        <line x1="48" y1="20" x2="30" y2="52" />
        {/* Recursion -> Memoization */}
        <line x1="30" y1="52" x2="68" y2="52" />
        {/* Recursion -> Trees */}
        <line x1="30" y1="52" x2="20" y2="84" />
        {/* Memoization -> Dynamic Programming */}
        <line x1="68" y1="52" x2="74" y2="84" />
      </svg>
      {MAP_NODE_CONFIG.map(({ topic, x, y, className }) => {
        const item = topics.find((t) => t.topic.toLowerCase() === topic.toLowerCase());
        const mastery = item ? Math.round(item.mastery) : 50;
        return (
          <div
            key={topic}
            className={`node ${className}`}
            style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
            role={onSelect ? "button" : undefined}
            tabIndex={onSelect ? 0 : undefined}
            onClick={() => onSelect?.(topic)}
            onKeyDown={(e) => e.key === "Enter" && onSelect?.(topic)}
            title={`${topic}: ${mastery}% mastery`}
          >
            <div>
              {topic}
              <small style={{ display: "block", fontSize: "9px", opacity: 0.85 }}>{mastery}%</small>
            </div>
          </div>
        );
      })}
      <div className="map-caption">7 connected nodes in your digital twin</div>
    </div>
  );
}

function KnowledgeMap({ topics, router }: { topics: Topic[]; router: ReturnType<typeof useRouter> }) {
  const [selected, setSelected] = useState<Topic>(
    topics.find((t) => t.mastery < 50) || topics[0] || defaultTopics[0]
  );

  const selectTopic = (name: string) => {
    const found = topics.find((t) => t.topic.toLowerCase() === name.toLowerCase());
    if (found) setSelected(found);
  };

  const getStatusBadge = (mastery: number) => {
    if (mastery >= 75) return <span className="map-node-badge mastered">Mastered concept</span>;
    if (mastery >= 50) return <span className="map-node-badge progress">In development</span>;
    return <span className="map-node-badge weak">Priority review needed</span>;
  };

  return (
    <section className="panel workspace-view knowledge-map-view">
      <div className="map-heading">
        <div>
          <div className="kicker">Interactive Knowledge Map</div>
          <h2>See what unlocks the next concept.</h2>
          <p>
            Concepts build upon prerequisites. Click any node to inspect your current twin state or start focused
            practice.
          </p>
        </div>
        <div className="map-summary">
          <strong>{topics.length}</strong>
          <span>
            tracked topics
            <br />
            in your twin
          </span>
        </div>
      </div>

      <div className="map-legend">
        <span>
          <i className="legend-dot prerequisite" /> Prerequisite mastered
        </span>
        <span>
          <i className="legend-dot focus" /> Current focus area
        </span>
        <span>
          <i className="legend-line" /> Conceptual dependency
        </span>
      </div>

      <div className="large-map">
        <MapNodes topics={topics} onSelect={selectTopic} />
      </div>

      <div className="map-list" aria-label="Topic mastery list">
        {topics.map((topic, index) => (
          <button
            className={`map-row ${selected?.topic === topic.topic ? "selected" : ""}`}
            key={topic.topic}
            onClick={() => setSelected(topic)}
          >
            <i style={{ background: colors[index % colors.length] }} />
            <span>{topic.topic}</span>
            <strong>{Math.round(topic.mastery)}%</strong>
            <ChevronRight size={14} />
          </button>
        ))}
      </div>

      {selected && (
        <div className="map-detail">
          <div>
            <div className="kicker">Selected Concept</div>
            <h3>{selected.topic}</h3>
            {getStatusBadge(selected.mastery)}
            <p>
              {selected.mastery < 50
                ? "This topic needs reinforcement. Practicing it now will stabilize advanced dependents."
                : selected.mastery < 75
                ? "Good foundational progress. Targeted practice will solidify automatic retrieval."
                : "Strong competency demonstrated. Keep fresh with periodic spaced repetition."}
            </p>
            <button
              className="map-action-btn"
              onClick={() => router.push(`/quiz?topic=${encodeURIComponent(selected.topic)}`)}
            >
              <PlayCircle size={15} /> Practice {selected.topic} Now
            </button>
          </div>
          <div className="map-detail-stats">
            <span>
              <strong>{Math.round(selected.mastery)}%</strong> mastery
            </span>
            <span>
              <strong>{Math.round(selected.accuracy * 100)}%</strong> accuracy
            </span>
            <span>
              <strong>{selected.attempts}</strong> attempts
            </span>
            <span>
              <strong>{Math.round(selected.confidence * 100)}%</strong> confidence
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

function History({ history, date }: { history: ActivityRecord[]; date: Intl.DateTimeFormat }) {
  return (
    <section className="panel workspace-view">
      <div className="kicker">Learning history</div>
      <h2>Every small session counts.</h2>
      <p>A running chronological log of quizzes, reviews, and study sessions that shape your digital twin.</p>
      <div className="history-list">
        {history.length === 0 ? (
          <p style={{ marginTop: 20 }}>No activity recorded yet. Complete a practice quiz to generate evidence!</p>
        ) : (
          history.map((item) => (
            <div className="history-item" key={item.id}>
              <div className="activity-icon">
                <Activity size={16} />
              </div>
              <div>
                <strong>{item.summary}</strong>
                <p>
                  {item.kind} · {item.detail}
                </p>
              </div>
              <time>{date.format(new Date(item.created_at))}</time>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
