import { motion } from "framer-motion";
import { Mic, Globe, FileText, BookOpen, Sparkles } from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Meeting Summarizer",
    description: "Upload audio and get instant transcription & summaries",
    color: "from-teal-500 to-cyan-500",
  },
  {
    icon: Globe,
    title: "Web Summarizer",
    description: "Extract and summarize any website content",
    color: "from-indigo-500 to-purple-500",
  },
  {
    icon: FileText,
    title: "Cover Letter",
    description: "Generate tailored cover letters for any job",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: BookOpen,
    title: "Research Papers",
    description: "Summarize academic papers in seconds",
    color: "from-emerald-500 to-teal-500",
  },
];

interface HeroProps {
  onFeatureClick: (index: number) => void;
}

export const Hero = ({ onFeatureClick }: HeroProps) => {
  return (
    <div className="hero-gradient min-h-[60vh] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <div className="container mx-auto px-4 pt-16 pb-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Study Tools</span>
          </div>
          
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-4 text-balance">
            Your Campus{" "}
            <span className="gradient-text">AI Study Hub</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
            Summarize meetings, websites, research papers, and craft perfect cover letters — all powered by AI.
          </p>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto"
        >
          {features.map((feature, index) => (
            <motion.button
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onFeatureClick(index)}
              className="feature-card text-left group cursor-pointer"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-1">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
