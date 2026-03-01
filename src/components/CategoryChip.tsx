import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CategoryChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const CategoryChip = ({ label, active, onClick }: CategoryChipProps) => (
  <motion.button
    onClick={onClick}
    whileTap={{ scale: 0.95 }}
    animate={active ? { scale: [1, 1.05, 1] } : {}}
    transition={{ type: "spring", stiffness: 400, damping: 10 }}
    className={cn(
      "shrink-0 rounded-pill px-4 py-2 text-sm font-medium transition-all whitespace-nowrap",
      active
        ? "gradient-indigo text-primary-foreground shadow-cta"
        : "glass-1 text-muted-foreground hover:text-foreground"
    )}
  >
    {label}
  </motion.button>
);

export default CategoryChip;
