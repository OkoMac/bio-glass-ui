import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const navigate   = useNavigate();
  const location   = useLocation();

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center space-y-5 max-w-sm"
      >
        {/* Glow number */}
        <div className="relative">
          <p
            className="text-[120px] font-bold leading-none font-data"
            style={{
              background: "linear-gradient(135deg, #6366F1 0%, #2DD4BF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 32px rgba(99,102,241,0.35))",
            }}
          >
            404
          </p>
        </div>

        <div>
          <h1 className="text-xl font-bold text-foreground">Page not found</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-mono text-xs text-indigo">{location.pathname}</span>
            {" "}doesn't exist.
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-pill px-4 py-2.5 glass-1 text-sm text-muted-foreground font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Go back
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/")}
            className="flex items-center gap-2 rounded-pill px-4 py-2.5 gradient-indigo text-primary-foreground text-sm font-semibold"
          >
            <Home className="w-4 h-4" /> Home
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
