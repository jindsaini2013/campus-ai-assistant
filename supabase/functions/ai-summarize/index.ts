import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, content, jobDescription, url } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (type) {
      case "meeting":
        systemPrompt = `You are an expert meeting summarizer. You take meeting transcripts and create clear, actionable summaries. 
        Your summaries should include:
        - Key discussion points
        - Decisions made
        - Action items with owners if mentioned
        - Important dates or deadlines mentioned
        Format the output in clear markdown with bullet points.`;
        userPrompt = `Please summarize this meeting transcript:\n\n${content}`;
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
        userPrompt = `Based on this resume and job description, write a personalized cover letter.
        
RESUME:
${content}

JOB DESCRIPTION:
${jobDescription}`;
        break;

      case "research_paper":
        systemPrompt = `You are a research summarizer. Summarize the content of the research paper in no more than 1000 words. The research summary should include:
        1) Title and Authors - Identify the study and contributors
        2) Objective/Problem - State the research goal or question
        3) Background - Briefly explain the context and significance
        4) Methods - Summarize the approach or methodology
        5) Key Findings - Highlight the main results or insights
        6) Conclusion - Provide the implications or contributions
        7) Future Directions - Suggest areas for further research
        8) Limitations - Highlight constraints or challenges
        9) Potential Applications - Discuss real-world applications
        Keep all points concise, clear, and focused. Format in markdown.`;
        userPrompt = `Please summarize this research paper:\n\n${content}`;
        break;

      default:
        throw new Error("Invalid type specified");
    }

    console.log(`Processing ${type} request...`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "";

    console.log(`${type} processing complete`);

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI summarize error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "An error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
