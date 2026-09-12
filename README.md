<img width="1533" height="727" alt="Screenshot 2026-09-12 054336" src="https://github.com/user-attachments/assets/aae815ae-bd87-4248-b723-a2d34184e734" />

<img width="1304" height="628" alt="Screenshot 2026-09-12 053433" src="https://github.com/user-attachments/assets/cc03f635-8504-4cac-9bc1-ac074a29eed5" />
Personal Learning Digital Twin
1. Project Overview
Personal Learning Digital Twin is an AI-powered platform that creates a digital representation of a student's learning state. It continuously analyzes quiz performance, study patterns, mistakes, accuracy, time taken, and topic mastery to understand how the student is learning.
The system then uses Machine Learning + AI to identify weaknesses, predict future performance, and generate a personalized learning roadmap.
The goal is to move from one-size-fits-all education to adaptive, data-driven learning.

2. Problem
Traditional learning platforms generally provide the same content and difficulty to every student. They often fail to answer:

Which topics is the student actually weak in?
What should the student study next?
Is the student's performance improving or declining?
Which concepts are prerequisites for their weak areas?
How much practice is likely to be required?
3. Proposed Solution
The system builds a continuously changing Learning Digital Twin for every student.
Example:

Student Learning Profile

Python                 91%
Arrays                 83%
Linked Lists           72%
Trees                  61%
Graphs                 51%
Dynamic Programming    38%
Every quiz or learning activity updates these values.
The system can then determine:
Current state → Weakness → Prediction → Recommendation → Improvement

4. Core Features
Student Dashboard
Displays:

Overall learning score
Topic-wise mastery
Performance history
Study time
Mistake frequency
Strong and weak areas
Adaptive Quiz System
Questions can be selected according to the student's current ability and weak topics.

Digital Twin Engine
Maintains a continuously updated profile containing:

Topic mastery
Confidence
Accuracy
Attempts
Time taken
Recent performance
Forgetting/recency indicators
AI Recommendation Engine
Automatically recommends:

What to study next
What to revise
Which questions to practice
How much time to spend
Personalized learning plans
Performance Prediction
ML models analyze historical learning data and estimate future mastery/performance.
Example:

Current DP mastery: 38%

After 1 session → 47%
After 3 sessions → 63%
Knowledge Graph
Represents relationships between concepts:

Arrays
   ↓
Recursion
   ↓
Trees
   ↓
Graphs
   ↓
Dynamic Programming
This allows the system to identify prerequisite concepts before recommending advanced topics.

AI Tutor
An LLM can:

Explain mistakes
Explain difficult concepts
Generate questions
Create study plans
Provide personalized feedback

AI Tutor setup
The dashboard AI Tutor uses Google Gemini 2.5 Flash through the server-only @google/genai SDK. Copy .env.example to .env.local and set GEMINI_API_KEY before sending chat messages. The Next.js route is POST /api/chat and accepts a messages array; responses stream as plain text.
Optional Document Intelligence
Students can upload PDFs or notes. The system uses embeddings and semantic search to find relevant learning material for their weak topics.

5. System Workflow
Student
   ↓
Quiz / Study Activity
   ↓
Collect Performance Data
   ↓
Learning Digital Twin
   ↓
ML Analysis
   ↓
Detect Weaknesses
   ↓
Predict Performance
   ↓
Recommendation Engine
   ↓
AI-Generated Learning Plan
   ↓
Student Practices Again
   ↓
Digital Twin Updates
This creates a continuous learning feedback loop.

6. Technology Stack
Frontend
Next.js / React
Tailwind CSS
shadcn/ui
Recharts — performance visualization
React Flow — knowledge graph visualization
Backend
Python
FastAPI
REST APIs
Database
PostgreSQL
pgvector for optional semantic/vector search
Machine Learning
Python
Pandas
NumPy
Scikit-learn
Possible models:

Logistic Regression
Random Forest
Gradient Boosting
AI
LLM API for explanations, question generation, feedback, and personalized plans
Embedding model/API for document semantic search
Authentication
JWT / Auth.js
Storage
S3-compatible storage or Cloudinary for uploaded documents
Deployment
Vercel — frontend
Render/Railway — backend and database
Version Control
Git + GitHub
7. Core ML Inputs
The prediction model can use:

Accuracy
Question difficulty
Time taken
Number of attempts
Mistake frequency
Recent performance
Days since last practice
Previous mastery
Output:

Topic Mastery / Probability of Mastery
8. Example
A student repeatedly performs poorly in Dynamic Programming.
The system detects:

DP Mastery: 42% → 35%

Status: 🔴 Weak

Prediction:
High probability of difficulty with advanced DP.
The AI then generates:

7-Day DP Recovery Plan

Day 1 → Recursion
Day 2 → Memoization
Day 3 → 1D DP
Day 4 → 2D DP
Day 5 → Practice
Day 6 → Revision
Day 7 → Assessment
After every session, the digital twin is updated.

9. Innovation
The key innovation is that this is not simply an AI tutor or quiz application.
It combines:
Digital Twin + Machine Learning + Knowledge Graph + LLM + Adaptive Learning
The system continuously models how a particular student learns and changes recommendations based on that student's evolving state.

10. Hackathon MVP
For a 24–48 hour hackathon, focus on:

Student login
Quiz system
Performance tracking
Topic mastery calculation
Digital Twin dashboard
Weak-topic detection
ML-based performance prediction
AI-generated personalized study plan
Knowledge graph visualization

## 11. Quick Start Guide

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- (Optional) Docker for PostgreSQL

### 1. Run the Python Backend
```bash
# Create and activate virtual environment (if not already done)
python -m venv .venv
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Start the FastAPI server (runs on port 8000)
uvicorn backend.app.main:app --reload --port 8000
```

### 2. Run the Next.js Frontend
```bash
# Install frontend dependencies
npm install

# Setup environment variables
copy .env.example .env.local

# Run the Next.js dev server (runs on port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
