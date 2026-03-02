import { serve } from "https://deno.land/std@0.168.0/http/server.ts";


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const { type, content, audioUrl, url, jobDescription } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";
    let inlineData = null;

    // All your specific logic and prompts
    switch (type) {
      case "meeting":
        systemPrompt = `You are an expert transcriber and summarizer. 
        First, provide a full word-for-word transcript of the audio.
        Then, insert the exact text: ###TRANSCRIPT_END###
        Finally, provide a structured summary with Key Points and Action Items.`;
        if (audioUrl) {
          // Fetch the real audio file
          const audioResp = await fetch(audioUrl);
          const arrayBuffer = await audioResp.arrayBuffer();
          // Convert to Base64
          const uint8Array = new Uint8Array(arrayBuffer);
          let binary = "";
          for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
          }
          inlineData = { mime_type: "audio/mpeg", data: btoa(binary) };
          userPrompt = "Please transcribe and summarize this meeting audio.";
        } else {
          userPrompt = `Please summarize this transcript:\n\n${content}`;
        }
        break;

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


    // Using Gemini 2.5 Flash - fast and free-tier friendly
    // Use v1 instead of v1beta and ensure the model string is exact
    // The correct stable endpoint for Gemini 2.5 Flash
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const geminiPayload = {
      contents: [{
        parts: [
          { text: `${systemPrompt}\n\n${userPrompt}` },
          ...(inlineData ? [{ inline_data: inlineData }] : [])
        ]
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
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 200, // Return 200 so the frontend catch block can read the actual message
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
