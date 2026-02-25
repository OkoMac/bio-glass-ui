import { Search, Mic, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";

const SearchBar = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-1 rounded-pill flex items-center gap-3 px-4 py-3"
    >
      <Search className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className="flex-1 text-sm text-muted-foreground">Find a service or provider...</span>
      <div className="flex items-center gap-2">
        <Mic className="w-4 h-4 text-muted-foreground" />
        <div className="w-px h-4 bg-foreground/10" />
        <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
      </div>
    </motion.div>
  );
};

export default SearchBar;
