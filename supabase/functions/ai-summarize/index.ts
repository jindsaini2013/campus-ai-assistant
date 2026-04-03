import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // This allows Vercel to talk to Supabase
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CHUNK_SIZE_MB = 15; // ~15MB chunks to stay under Gemini limits
const CHUNK_SIZE_BYTES = CHUNK_SIZE_MB * 1024 * 1024;

async function transcribeChunk(apiKey: string, base64Audio: string, mimeType: string, chunkIndex: number, totalChunks: number): Promise<string> {
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const prompt = totalChunks > 1
    ? `This is audio chunk ${chunkIndex + 1} of ${totalChunks}. Provide a word-for-word transcript of this audio segment. Do NOT summarize - transcribe every word spoken.`
    : `Provide a word-for-word transcript of this audio. Do NOT summarize - transcribe every word spoken.`;

  const payload = {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: mimeType, data: base64Audio } }
      ]
    }]
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (data.error) throw new Error(`Chunk ${chunkIndex + 1} failed: ${data.error.message}`);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function summarizeText(apiKey: string, transcript: string, language: string): Promise<string> {
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{
      parts: [{
        text: `You are an expert meeting summarizer. Summarize the following transcript in ${language}. Provide:
1. **Key Discussion Points** - Main topics discussed
2. **Decisions Made** - Any conclusions reached
3. **Action Items** - Tasks assigned with owners if mentioned
4. **Important Details** - Dates, numbers, names mentioned

Be concise but thorough. Format in clean markdown.

TRANSCRIPT:
${transcript}`
      }]
    }]
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (data.error) throw new Error(`Summary failed: ${data.error.message}`);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No summary generated.";
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const { type, content, audioUrl, url, jobDescription, language } = await req.json();

    if (type === "meeting") {
      console.info("Processing meeting request...");
  

      // Fetch the audio file
      const audioResp = await fetch(audioUrl);
      if (!audioResp.ok) throw new Error(`Failed to fetch audio: ${audioResp.status}`);
      const arrayBuffer = await audioResp.arrayBuffer();
      const totalBytes = arrayBuffer.byteLength;
      const totalChunks = Math.ceil(totalBytes / CHUNK_SIZE_BYTES);

      console.info(`Audio size: ${(totalBytes / 1024 / 1024).toFixed(2)}MB, splitting into ${totalChunks} chunk(s)`);

      // Determine mime type
      const contentType = audioResp.headers.get("content-type") || "audio/mpeg";
      const mimeType = contentType.includes("wav") ? "audio/wav" : "audio/mpeg";

      // Process chunks sequentially
      const transcriptParts: string[] = [];
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE_BYTES;
        const end = Math.min(start + CHUNK_SIZE_BYTES, totalBytes);
        const chunkBuffer = arrayBuffer.slice(start, end);

        // Convert chunk to base64
        const uint8 = new Uint8Array(chunkBuffer);
        let binary = "";
        for (let j = 0; j < uint8.length; j++) {
          binary += String.fromCharCode(uint8[j]);
        }
        const base64 = btoa(binary);

        console.info(`Transcribing chunk ${i + 1}/${totalChunks} (${(uint8.length / 1024 / 1024).toFixed(2)}MB)...`);
        const chunkTranscript = await transcribeChunk(GEMINI_API_KEY!, base64, mimeType, i, totalChunks);
        transcriptParts.push(chunkTranscript);
      }

      const fullTranscript = transcriptParts.join("\n\n");
      console.info(`Transcription complete (${fullTranscript.length} chars). Generating summary...`);

      // Now summarize the combined transcript
      const summary = await summarizeText(GEMINI_API_KEY!, fullTranscript, language || "english");

      console.info("meeting processing complete");
      return new Response(JSON.stringify({
      success: true,
      transcript: fullTranscript,
      summary: summary
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Non-meeting types
    let systemPrompt = "";
    let userPrompt = "";

    switch (type) {
      case "website":
        systemPrompt = `You are an expert content summarizer. Read the website content carefully and produce a high-quality summary that captures:
        1) Core concepts and ideas
        2) Important terms and their explanations  
        3) Key insights or takeaways
        4) Any recommendations or applications mentioned
        Do NOT just copy sentences. Be concise but informative, around 5-8 bullet points.
        Format the output in Markdown with clear headings and bullets.`;
        userPrompt = `Website URL: ${url}\n\nContent to summarize:\n${content}`;
        break;

      case "cover_letter":
        systemPrompt = `You are a master at crafting the perfect cover letter. You analyze resumes and job descriptions to create personalized, compelling cover letters that highlight relevant experience and skills.
        The cover letter should:
        - Be professional and engaging
        - Highlight relevant skills from the resume that match the job
        - Show enthusiasm for the role
        - Be concise (3-4 paragraphs)
        - End with a strong call to action`;
        userPrompt = `Based on this resume and job description, write a personalized cover letter.\n\nRESUME:\n${content}\n\nJOB DESCRIPTION:\n${jobDescription}`;
        break;

      case "research_paper":
        systemPrompt = `You are a research summarizer. Summarize the content of the research paper in no more than 1000 words. The research summary should include:
        1) Title and Authors
        2) Objective/Problem
        3) Background
        4) Methods
        5) Key Findings
        6) Conclusion
        7) Future Directions
        8) Limitations
        9) Potential Applications
        Keep all points concise, clear, and focused. Format in markdown.`;
        userPrompt = `Please summarize this research paper:\n\n${content}`;
        break;

      default:
        throw new Error("Invalid type specified");
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const geminiPayload = {
      contents: [{
        parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
      }]
    };

    const geminiRes = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload)
    });

    const data = await geminiRes.json();
    if (data.error) throw new Error(data.error.message);
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No output generated.";

    return new Response(JSON.stringify({ success: true, result: resultText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("Critical Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

// Version 1.0