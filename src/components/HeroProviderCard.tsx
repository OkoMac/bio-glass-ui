import { motion } from "framer-motion";
import GlassCard from "./GlassCard";
import BioAvatar from "./BioAvatar";
import { Star, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeroProviderCardProps {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  distance: string;
  image: string;
  coverImage: string;
  vertical: "indigo" | "teal" | "coral" | "amber";
}

const HeroProviderCard = ({
  id, name, specialty, rating, distance, image, coverImage, vertical,
}: HeroProviderCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="relative w-full shrink-0 aspect-[3/4] max-h-[420px] rounded-2xl overflow-hidden cursor-pointer shadow-card"
      onClick={() => navigate(`/provider/${id}`)}
      whileTap={{ scale: 0.98 }}
    >
      <img
        src={coverImage}
        alt={name}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5 space-y-3">
        <div className="flex items-end gap-3">
          <BioAvatar src={image} alt={name} size="lg" verticalColor={vertical} verified />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-foreground truncate">{name}</h2>
            <p className="text-sm text-muted-foreground">{specialty}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber fill-amber" />
              <span className="font-data text-foreground">{rating}</span>
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              {distance}
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            className="rounded-pill px-4 py-2 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta"
          >
            Book
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default HeroProviderCard;
