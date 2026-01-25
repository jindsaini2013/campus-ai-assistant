import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Loader2, Copy, Check, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const CoverLetterGenerator = () => {
  const { toast } = useToast();
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!resume.trim()) {
      toast({
        title: "Resume required",
        description: "Please paste your resume or CV text",
        variant: "destructive",
      });
      return;
    }

    if (!jobDescription.trim()) {
      toast({
        title: "Job description required",
        description: "Please paste the job description",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-summarize', {
        body: { 
          type: 'cover_letter',
          content: resume,
          jobDescription: jobDescription
        }
      });

      if (error) throw error;

      if (data.success) {
        setCoverLetter(data.result);
        toast({
          title: "Cover letter generated!",
          description: "Your personalized cover letter is ready",
        });
      } else {
        throw new Error(data.error || "Failed to generate cover letter");
      }
    } catch (error) {
      console.error('Error generating cover letter:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate cover letter",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard!" });
  };

  const handleDownload = () => {
    const blob = new Blob([coverLetter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cover-letter.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Input Section */}
      <div className="feature-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-destructive flex items-center justify-center">
            <FileText className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-xl">Cover Letter Generator</h2>
            <p className="text-sm text-muted-foreground">Create tailored cover letters for any job application</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Resume Input */}
          <div className="space-y-2">
            <Label htmlFor="resume" className="font-medium">
              Your Resume / CV
            </Label>
            <Textarea
              id="resume"
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Paste your resume or CV text here...

Example:
John Doe
Software Developer

Experience:
- 3 years at Tech Company
- Built web applications using React
- Led team of 4 developers

Education:
- B.S. Computer Science
- GPA: 3.8"
              className="min-h-[250px] resize-none"
            />
          </div>

          {/* Job Description Input */}
          <div className="space-y-2">
            <Label htmlFor="job" className="font-medium">
              Job Description
            </Label>
            <Textarea
              id="job"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here...

Example:
We are looking for a talented Software Developer to join our growing team. 

Requirements:
- Experience with React and TypeScript
- Strong problem-solving skills
- Excellent communication abilities
- Bachelor's degree in CS or related field"
              className="min-h-[250px] resize-none"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleGenerate}
            disabled={isProcessing}
            size="lg"
            variant="gradient"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Cover Letter
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Results Section */}
      {coverLetter && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="feature-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg">Your Cover Letter</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            className="min-h-[400px] resize-none"
          />

          <p className="text-xs text-muted-foreground mt-3">
            💡 Tip: You can edit the generated cover letter above before downloading
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};
