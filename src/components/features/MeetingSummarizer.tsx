import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, Mic, FileAudio, Loader2, Download, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const languages = [
  { value: "english", label: "English" },
  { value: "hindi", label: "Hindi" },
  { value: "spanish", label: "Spanish" },
  { value: "french", label: "French" },
  { value: "german", label: "German" },
];

export const MeetingSummarizer = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("english");
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type.includes("audio") || droppedFile.name.endsWith(".mp3") || droppedFile.name.endsWith(".wav"))) {
      setFile(droppedFile);
    } else {
      toast({
        title: "Invalid file",
        description: "Please upload an MP3 or WAV audio file",
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

  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      // 1. Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Authentication required", description: "Please log in to upload recordings.", variant: "destructive" });
        setIsProcessing(false);
        return;
      }

      // 2. Upload to a user-specific folder
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 3. Generate a Signed URL (private bucket)
      const { data: signedUrlData, error: signedError } = await supabase.storage
        .from('recordings')
        .createSignedUrl(fileName, 900);

      if (signedError) throw signedError;

      // 4. Call the Edge Function with the SIGNED URL
      const { data, error } = await supabase.functions.invoke('ai-summarize', {
        body: {
          type: 'meeting',
          audioUrl: signedUrlData.signedUrl,
          language: language,
        }
      });

      if (error) throw error;

      if (data.success) {
        const fullResult = data.result;
        if (fullResult.includes("## Summary:")) {
          const parts = fullResult.split("## Summary:");
          
          // Part 0 is everything before "## Summary:", which includes the Transcription header
          const cleanTranscript = parts[0].replace("## Transcription:", "").trim();
          const cleanSummary = parts[1].trim();

          setTranscript(cleanTranscript);
          setSummary(cleanSummary);
        } else {
          // Fallback if the string isn't formatted as expected
          setTranscript("Transcription complete.");
          setSummary(fullResult);
        }
  
        toast({ title: "Processing complete!" });
      }

    } catch (error: any) {
      // 3. Handle CRASHES (Network issues, timeouts, or the 'throws' above)
      console.error('Processing error:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard!" });
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
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
            <Mic className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-xl">Meeting Audio Summarizer</h2>
            <p className="text-sm text-muted-foreground">Upload your meeting recording for AI transcription & summary</p>
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
            accept=".mp3,.wav,audio/*"
            onChange={handleFileSelect}
            className="hidden"
            id="audio-upload"
          />
          
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileAudio className="w-8 h-8 text-primary" />
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
            <label htmlFor="audio-upload" className="cursor-pointer">
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium mb-1">Drop your audio file here</p>
              <p className="text-sm text-muted-foreground">or click to browse (MP3, WAV)</p>
            </label>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Output Language</label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button
              onClick={handleProcess}
              disabled={!file || isProcessing}
              variant="gradient"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Transcribe & Summarize"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {(transcript || summary) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-2 gap-6"
        >
          {/* Transcript */}
          <div className="feature-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold">Transcript</h3>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(transcript)}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(transcript, "transcript.txt")}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Textarea
              value={transcript}
              readOnly
              className="min-h-[200px] resize-none"
            />
          </div>

          {/* Summary */}
          <div className="feature-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold">Summary</h3>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(summary)}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(summary, "summary.txt")}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Textarea
              value={summary}
              readOnly
              className="min-h-[200px] resize-none"
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};


