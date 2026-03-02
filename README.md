# 🚀 AI Content Orchestrator
Full-Stack Multi-Modal AI Summarization Platform

### 📌 Overview

AI Content Orchestrator is a full-stack, serverless platform that converts unstructured data—such as audio recordings, web content, and PDFs—into structured, context-aware summaries.

The system intelligently adapts to different use cases (meeting minutes, research papers, job applications) using a custom prompt-routing mechanism, enabling more accurate and meaningful outputs.

### 🎯 Key Features

🎙️ Audio Summarization – Converts speech to structured insights

🌐 Web Content Summarization – Scrapes and cleans web pages

📄 Document Processing – Extracts and summarizes PDFs

🧠 Context-Aware AI – Different prompts for different use cases

⚡ Fast Processing – Powered by Gemini 1.5 Flash

☁️ Serverless Architecture – Scalable and efficient

🔐 Secure File Handling – Authenticated storage with signed URLs

### 🏗️ System Architecture
#### 🔹 End-to-End Flow

1. User uploads input (audio / URL / PDF) via frontend

2. Frontend sends request to backend API

3. Backend (Edge Function):

- Authenticates user

- Validates input

- Uploads file to storage (if needed)

4. Storage Layer:

- Stores large files temporarily

- Generates signed URLs

5. AI Layer (Gemini):

- Fetches content

- Applies prompt routing

- Generates summary

6. Backend returns response

7. Frontend displays structured output

### 🧩 Tech Stack
#### Frontend

- React

- TypeScript

- Tailwind CSS

- Shadcn UI

- Framer Motion

#### Backend

- Supabase Edge Functions (Deno)

- Supabase Auth

#### Storage

- Supabase Storage (Buckets + Signed URLs)

#### AI Layer

- Gemini 1.5 Flash API

#### DevOps

- Supabase CLI

- Environment Variables (Secrets Management)

### ⚙️ Core Components
1️⃣ Prompt Routing System

- Dynamically selects prompts based on:

  - Input type (audio, web, PDF)

  - Use case (meeting, research, etc.)

- Improves accuracy and relevance of summaries

2️⃣ Cloud Storage Pipeline

- Files uploaded to Supabase Storage

- Short-lived signed URLs generated

- AI fetches files securely

- Prevents memory overload in serverless functions

3️⃣ Web Scraping & Sanitization

Removes:

- HTML tags

- Scripts & styles

- Ads & navigation

- Keeps only meaningful content

✅ Reduces token usage

✅ Improves summary quality


4️⃣ Chunked Audio Processing

- Splits large audio into smaller chunks

- Prevents memory overflow

- Enables processing of long recordings
  

📉 Optimization Techniques

🔻 Reduced token cost via text sanitization

⚡ Faster inference using Gemini Flash

🧠 Efficient memory usage via chunking

🔐 Secure access using signed URLs
