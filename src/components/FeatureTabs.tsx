import { motion, AnimatePresence } from "framer-motion";
import { Mic, Globe, FileText, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: 0, label: "Meeting Audio", icon: Mic },
  { id: 1, label: "Web Summarizer", icon: Globe },
  { id: 2, label: "Cover Letter", icon: FileText },
  { id: 3, label: "Research Paper", icon: BookOpen },
];

interface FeatureTabsProps {
  activeTab: number;
  onTabChange: (tab: number) => void;
}

export const FeatureTabs = ({ activeTab, onTabChange }: FeatureTabsProps) => {
  return (
    <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 rounded-lg -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
