import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, Loader2, Link, Copy, Check, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const WebSummarizer = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSummarize = async () => {
    if (!url) {
      toast({
        title: "URL required",
        description: "Please enter a valid website URL",
        variant: "destructive",
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid website URL",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setSummary("");
    setPageTitle("");
    
    try {
      // First, scrape the website
      const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke('scrape-website', {
        body: { url }
      });

      if (scrapeError) throw scrapeError;
      if (!scrapeData.success) throw new Error(scrapeData.error || "Failed to scrape website");

      setPageTitle(scrapeData.title);

      // Then summarize the content
      const { data: summaryData, error: summaryError } = await supabase.functions.invoke('ai-summarize', {
        body: { 
          type: 'website',
          content: scrapeData.text,
          url: url
        }
      });

      if (summaryError) throw summaryError;

      if (summaryData.success) {
        setSummary(summaryData.result);
        toast({
          title: "Summary ready!",
          description: "Website content has been analyzed and summarized",
        });
      } else {
        throw new Error(summaryData.error || "Failed to summarize");
      }
    } catch (error) {
      console.error('Error summarizing website:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to summarize website",
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
    const content = `Website: ${url}\nTitle: ${pageTitle}\n\n${summary}`;
    const blob = new Blob([content], { type: "text/plain" });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "website-summary.txt";
    a.click();
    URL.revokeObjectURL(downloadUrl);
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
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-gradient-end flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-xl">Website Summarizer</h2>
            <p className="text-sm text-muted-foreground">Enter any URL to extract and summarize its content</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="pl-10"
              onKeyDown={(e) => e.key === "Enter" && handleSummarize()}
            />
          </div>
          <Button
            onClick={handleSummarize}
            disabled={isProcessing}
            variant="gradient"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 mr-2" />
                Summarize
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
                <p className="font-medium text-sm">Scraping and analyzing website...</p>
                <p className="text-xs text-muted-foreground">This may take a few seconds</p>
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
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-lg">{pageTitle}</h3>
              <a
                href={url.startsWith("http") ? url : `https://${url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                {url}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="prose prose-sm max-w-none">
            <Textarea
              value={summary}
              readOnly
              className="min-h-[300px] resize-none font-mono text-sm"
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
