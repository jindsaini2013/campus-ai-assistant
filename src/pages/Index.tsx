import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Hero } from "@/components/Hero";
import { FeatureTabs } from "@/components/FeatureTabs";
import { MeetingSummarizer } from "@/components/features/MeetingSummarizer";
import { WebSummarizer } from "@/components/features/WebSummarizer";
import { CoverLetterGenerator } from "@/components/features/CoverLetterGenerator";
import { ResearchPaperSummarizer } from "@/components/features/ResearchPaperSummarizer";
import { GraduationCap, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const features = [
  { id: 0, component: MeetingSummarizer },
  { id: 1, component: WebSummarizer },
  { id: 2, component: CoverLetterGenerator },
  { id: 3, component: ResearchPaperSummarizer },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { user, signOut } = useAuth();

  const ActiveComponent = features[activeTab].component;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg">StudyHub</span>
          </div>
          <div className="text-sm text-muted-foreground">
            AI-Powered Campus Tools
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-14" />

      {/* Hero Section */}
      <Hero onFeatureClick={setActiveTab} />

      {/* Feature Tabs */}
      <FeatureTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Feature Content */}
      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ActiveComponent />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Made for students, by AI ✨</p>
          <p className="mt-1">StudyHub — Your Campus AI Assistant</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
