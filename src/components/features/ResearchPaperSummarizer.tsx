import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { BookOpen, Upload, FileText, Loader2, Copy, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export const ResearchPaperSummarizer = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState("");
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
    } else {
      toast({
        title: "Invalid file",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSummarize = async () => {
    if (!file) return;

    setIsProcessing(true);
    
    // Simulated processing - will be replaced with actual API
    setTimeout(() => {
      setSummary(`# Research Paper Summary

## Title and Authors
**Paper Title:** Advances in Machine Learning for Natural Language Processing
**Authors:** Smith, J., Johnson, M., & Williams, R. (2024)
**Institution:** Stanford University

---

## Objective/Problem
The research addresses the challenge of improving context understanding in large language models, specifically focusing on reducing hallucination and improving factual accuracy in AI-generated responses.

---

## Background
Natural Language Processing has evolved significantly with the advent of transformer architectures. However, current models still struggle with maintaining factual consistency across long-form text generation.

---

## Methods
- Implemented a novel attention mechanism called "Factual Attention Layer"
- Dataset of 1.2 million verified facts from academic sources
- Comparative analysis with GPT-4, Claude, and Gemini models
- Human evaluation with 500 participants

---

## Key Findings
1. **40% reduction** in hallucination rate compared to baseline models
2. **Improved context retention** over 10,000+ token sequences
3. Minimal impact on generation speed (<5% overhead)
4. Strong performance on specialized academic domains

---

## Conclusion
The proposed Factual Attention Layer demonstrates significant improvements in reducing AI hallucination while maintaining generation quality. This approach offers a practical solution for deploying LLMs in fact-critical applications.

---

## Future Directions
- Extending the approach to multi-modal models
- Real-time fact verification during generation
- Application to scientific literature synthesis

---

## Limitations
- Tested primarily on English language content
- Requires additional computational resources
- Performance varies across different domains

---

## Potential Applications
- Academic research assistance
- Legal document analysis
- Medical literature review
- Fact-checking journalism`);
      
      setIsProcessing(false);
      toast({
        title: "Summary ready!",
        description: "Your research paper has been analyzed and summarized",
      });
    }, 2500);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard!" });
  };

  const handleDownload = () => {
    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file?.name.replace(".pdf", "")}-summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Upload Section */}
      <div className="feature-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-xl">Research Paper Summarizer</h2>
            <p className="text-sm text-muted-foreground">Upload a PDF to get a comprehensive academic summary</p>
          </div>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`upload-zone ${isDragging ? "dragging" : ""}`}
        >
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="pdf-upload"
          />
          
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <div className="text-left">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                Remove
              </Button>
            </div>
          ) : (
            <label htmlFor="pdf-upload" className="cursor-pointer">
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium mb-1">Drop your research paper here</p>
              <p className="text-sm text-muted-foreground">PDF files only (max 50 pages analyzed)</p>
            </label>
          )}
        </div>

        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleSummarize}
            disabled={!file || isProcessing}
            size="lg"
            variant="gradient"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Paper...
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4 mr-2" />
                Generate Summary
              </>
            )}
          </Button>
        </div>

        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20"
          >
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <div>
                <p className="font-medium text-sm">Extracting and analyzing content...</p>
                <p className="text-xs text-muted-foreground">Identifying key sections, methods, and findings</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Results Section */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="feature-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg">Paper Summary</h3>
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
            value={summary}
            readOnly
            className="min-h-[500px] resize-none font-mono text-sm"
          />
        </motion.div>
      )}
    </motion.div>
  );
};
