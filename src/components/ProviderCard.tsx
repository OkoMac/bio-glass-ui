import GlassCard from "./GlassCard";
import BioAvatar from "./BioAvatar";
import { Star, MapPin, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProviderCardProps {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  distance: string;
  nextSlot?: string;
  image: string;
  vertical: "indigo" | "teal" | "coral" | "amber";
  isFree?: boolean;
}

const ProviderCard = ({
  id, name, specialty, rating, reviews, distance, nextSlot, image, vertical, isFree,
}: ProviderCardProps) => {
  const navigate = useNavigate();

  return (
    <GlassCard
      hover
      className="w-[200px] shrink-0 p-3 cursor-pointer"
      onClick={() => navigate(`/provider/${id}`)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
    >
      <div className="relative">
        <BioAvatar src={image} alt={name} size="lg" verticalColor={vertical} />
        {isFree && (
          <span className="absolute -top-1 -right-1 rounded-pill px-2 py-0.5 text-[10px] font-bold gradient-amber text-obsidian animate-pulse-glow">
            FREE
          </span>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="text-sm font-semibold text-foreground truncate">{name}</h3>
        <p className="text-xs text-muted-foreground truncate">{specialty}</p>
        <div className="flex items-center gap-1.5 text-xs">
          <Star className="w-3 h-3 text-amber fill-amber" />
          <span className="font-data text-foreground">{rating}</span>
          <span className="text-muted-foreground">({reviews})</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span>{distance}</span>
        </div>
        {nextSlot && (
          <div className="flex items-center gap-1 text-xs text-teal">
            <Clock className="w-3 h-3" />
            <span>{nextSlot}</span>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default ProviderCard;
