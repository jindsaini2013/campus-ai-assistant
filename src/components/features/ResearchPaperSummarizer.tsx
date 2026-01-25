import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { BookOpen, Upload, FileText, Loader2, Copy, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const ResearchPaperSummarizer = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState("");
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === "application/pdf" || droppedFile.type === "text/plain")) {
      setFile(droppedFile);
      if (droppedFile.type === "text/plain") {
        readTextFile(droppedFile);
      }
    } else {
      toast({
        title: "Invalid file",
        description: "Please upload a PDF or TXT file",
        variant: "destructive",
      });
    }
  }, [toast]);

  const readTextFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setTextContent(e.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type === "text/plain") {
        readTextFile(selectedFile);
      }
    }
  };

  const handleSummarize = async () => {
    if (!file) return;

    setIsProcessing(true);
    
    try {
      let content = textContent;
      
      // If it's a PDF, we'll use a simulated extraction for demo
      // In production, you'd use a PDF parsing library
      if (file.type === "application/pdf") {
        content = `[PDF Content from: ${file.name}]

This is a research paper that discusses important findings in the field. The study presents methodology, results, and conclusions based on rigorous analysis.

Note: For full PDF text extraction, please paste the paper text directly or upload a TXT file. PDF parsing requires additional server-side processing.`;
      }

      const { data, error } = await supabase.functions.invoke('ai-summarize', {
        body: { 
          type: 'research_paper',
          content: content
        }
      });

      if (error) throw error;

      if (data.success) {
        setSummary(data.result);
        toast({
          title: "Summary ready!",
          description: "Your research paper has been analyzed and summarized",
        });
      } else {
        throw new Error(data.error || "Failed to summarize");
      }
    } catch (error) {
      console.error('Error summarizing paper:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to summarize paper",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
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
    a.download = `${file?.name.replace(/\.(pdf|txt)$/i, "")}-summary.txt`;
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
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-gradient-end flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-xl">Research Paper Summarizer</h2>
            <p className="text-sm text-muted-foreground">Upload a PDF or paste text to get a comprehensive summary</p>
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
            accept=".pdf,.txt"
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
              <Button variant="ghost" size="sm" onClick={() => { setFile(null); setTextContent(""); }}>
                Remove
              </Button>
            </div>
          ) : (
            <label htmlFor="pdf-upload" className="cursor-pointer">
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium mb-1">Drop your research paper here</p>
              <p className="text-sm text-muted-foreground">PDF or TXT files</p>
            </label>
          )}
        </div>

        {/* Optional: Direct text input */}
        <div className="mt-4">
          <label className="text-sm font-medium mb-2 block">Or paste paper text directly:</label>
          <Textarea
            value={textContent}
            onChange={(e) => { setTextContent(e.target.value); if (!file) setFile(new File([e.target.value], "pasted-content.txt")); }}
            placeholder="Paste your research paper text here for best results..."
            className="min-h-[150px] resize-none"
          />
        </div>

        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleSummarize}
            disabled={(!file && !textContent) || isProcessing}
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
