import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import BioAvatar from "@/components/BioAvatar";

// BION Service row type — used when rendering real services fetched from the
// backend for registered providers. Directory-only (scraped) providers keep
// using the hardcoded servicesOffered array.
type BionService = {
  id: string;
  title: string;
  description: string | null;
  price_rand: number;
  duration_minutes: number;
  category: string;
  active: boolean;
  delivery_mode?: "in_person" | "telehealth" | "both";
};
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Share2, Star, MapPin, Clock, Lock, CreditCard, Shield, Mail, Phone, Globe, Building, Check, X, CalendarDays, Heart, UserCheck, Loader2, MessageCircle, Package, Users } from "lucide-react";
import { getProviderImage, getProviderCover } from "@/lib/providerImages";
import { useBookings } from "@/contexts/BookingsContext";
import { useVerifiedProviders } from "@/hooks/useVerifiedProviders";
import { useProviderVerifiedTrainer } from "@/hooks/useBicademy";
import { useFavorites } from "@/hooks/useFavorites";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { getProviderShareUrl, getBookingShareUrl, openWhatsApp } from "@/lib/whatsapp";
import { trackEvent } from "@/lib/habits";
import { usePageView } from "@/hooks/usePageView";
import ProviderShopSection from "@/components/ProviderShopSection";
import realData from "@/data/bion_pretoria_data.json";
import jhbData from "@/data/bion_johannesburg_data.json";
import { useProviderSlots, parseDuration } from "@/hooks/useProviderSlots";
import { useAcquisitionVouchers } from "@/hooks/useAcquisitionVouchers";
import { useProviderReviews } from "@/hooks/useReviews";
import { Gift } from "lucide-react";

// ── Build lookup from ALL scraped providers (Pretoria + Johannesburg) ─────────
const PROVIDERS: Record<string, any> = {};
const verticals = ["teal", "indigo", "coral", "amber"] as const;

[...realData.providers, ...(jhbData as any).providers].forEach((p: any, i: number) => {
  PROVIDERS[p.id] = {
    id: p.id,
    name: p.name,
    specialty: p.service,
    specialization: p.specialization,
    vertical: verticals[i % verticals.length],
    rating: typeof p.rating === "string" ? parseFloat(p.rating) || 0 : p.rating,
    reviews: p.reviewCount,
    location: p.location,
    address: p.address,
    experience: p.experienceYears ? `${p.experienceYears} years` : "Experienced",
    image: getProviderImage(p.id, p.name),
    coverImage: getProviderCover(p.id),
    bio: p.description || `Professional ${p.service} provider based in ${p.location}.`,
    price: p.price,
    duration: p.duration || "60 min",
    availability: p.availability,
    qualifications: p.qualifications || [],
    languages: p.languages || [],
    servicesOffered: p.servicesOffered || [p.service],
    contact: {
      email: p.contact?.email,
      phone: p.contact?.phone,
      website: p.contact?.website,
    },
    callout: !!p.callout,
  };
});

export default function ProviderProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addBooking } = useBookings();
  const verifiedProviders = useVerifiedProviders();
  // BION Verified Trainer — true once this provider has finished PROVIDER-101
  // in the Bicademy. Returns false for scraped-only providers (no matching
  // enrollment row) so the badge is additive + safe.
  const isVerifiedTrainer = useProviderVerifiedTrainer(id ?? null);
  const { isFavorite, toggle: toggleFavorite } = useFavorites();
  const { trackView } = useRecentlyViewed();
  usePageView();
  const [showAllServices, setShowAllServices] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingDate, setBookingDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [bookingTime, setBookingTime] = useState<string>("");
  const [selectedService, setSelectedService] = useState(0);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // Telehealth delivery mode toggle
  const [deliveryMode, setDeliveryMode] = useState<"in_person" | "telehealth">("in_person");

  // Recurring booking state
  const [recurringEnabled, setRecurringEnabled] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<"weekly" | "biweekly" | "monthly">("weekly");
  const [recurringSessions, setRecurringSessions] = useState<number>(4);

  const provider = PROVIDERS[id ?? ""];
  const isSignedIn = !!user;

  // Ask the booking hook for only the slots that (a) fall inside the
  // provider's published hours for the picked date, (b) respect any date
  // override, and (c) don't overlap an existing pending/confirmed booking.
  const sessionMinutes = parseDuration(provider?.duration);
  const { availableSlots, loading: slotsLoading, reason: slotsReason } =
    useProviderSlots(provider?.id ?? null, bookingDate, sessionMinutes);

  // When the date (or resolved slot list) changes, make sure the selected
  // time is still valid. If not, auto-pick the first available slot so the
  // booking summary never renders a stale/invalid time.
  useEffect(() => {
    if (availableSlots.length === 0) {
      if (bookingTime !== "") setBookingTime("");
      return;
    }
    if (!availableSlots.includes(bookingTime)) {
      setBookingTime(availableSlots[0]);
    }
  }, [availableSlots, bookingTime]);

  // A provider is "registered on BION" if they completed document verification
  // in Supabase. The verifiedProviders set (from useVerifiedProviders hook) is
  // loaded once on mount from provider_documents. Directory-only providers
  // (scraped listings with no Supabase profile) won't be in the set, so
  // isRegisteredOnBion stays false → booking flow sends a lead instead.
  const isRegisteredOnBion = verifiedProviders.has(id ?? "");

  // ── Real BION services (registered providers only) ──────────────────────
  // GET /api/providers/:id/services returns the provider's active services
  // from the `services` table. Directory-only listings skip this fetch and
  // keep using provider.servicesOffered (the scraped JSON array).
  const [bionServices, setBionServices] = useState<BionService[]>([]);
  const [bionServicesLoading, setBionServicesLoading] = useState(false);
  useEffect(() => {
    let cancelled = false;
    if (!isRegisteredOnBion || !id) { setBionServices([]); return; }
    setBionServicesLoading(true);
    const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";
    fetch(`${API}/api/providers/${id}/services`)
      .then(r => r.json())
      .then(json => {
        if (cancelled) return;
        if (json?.ok && Array.isArray(json.data)) {
          setBionServices((json.data as BionService[]).filter(s => s.active !== false));
        }
      })
      .catch(() => { /* non-fatal — fall back to hardcoded list */ })
      .finally(() => { if (!cancelled) setBionServicesLoading(false); });
    return () => { cancelled = true; };
  }, [id, isRegisteredOnBion]);

  const hasRealServices = bionServices.length > 0;

  // ── Published programs by this provider ─────────────────────────────────
  // GET /api/programs/by-provider/:id returns active + published programs.
  // Directory-only listings skip (they have no profiles row → no programs).
  type ProgramCard = {
    id: string; title: string; description: string | null; vertical: string;
    duration_days: number; price_rand: number; cover_image_url: string | null;
  };
  const [programs, setPrograms] = useState<ProgramCard[]>([]);
  const [programsLoading, setProgramsLoading] = useState(false);
  useEffect(() => {
    if (!isRegisteredOnBion || !id) { setPrograms([]); return; }
    let cancelled = false;
    setProgramsLoading(true);
    const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";
    fetch(`${API}/api/programs/by-provider/${id}`)
      .then(r => r.json())
      .then(json => {
        if (cancelled) return;
        if (json?.ok && Array.isArray(json.data)) setPrograms(json.data as ProgramCard[]);
      })
      .catch(() => { /* non-fatal */ })
      .finally(() => { if (!cancelled) setProgramsLoading(false); });
    return () => { cancelled = true; };
  }, [id, isRegisteredOnBion]);

  // Keep selectedService in range when the service list changes (e.g.
  // bionServices loads after the modal already opened).
  useEffect(() => {
    if (selectedService > 0 && selectedService >= (hasRealServices ? bionServices.length : (provider?.servicesOffered?.length ?? 1))) {
      setSelectedService(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRealServices, bionServices.length]);

  // When the provider has real BION services, the booking modal must pick
  // from those (with the real price, duration, and UUID). Directory-only
  // providers still use provider.servicesOffered (strings).
  const bookingServiceChoices = useMemo(() => {
    if (hasRealServices) {
      return bionServices.map(s => ({
        id: s.id,
        label: s.title,
        priceRand: s.price_rand,
        durationMinutes: s.duration_minutes,
        deliveryMode: s.delivery_mode ?? "in_person" as "in_person" | "telehealth" | "both",
      }));
    }
    return ((provider?.servicesOffered ?? []) as string[]).map((label: string) => ({
      id: null as string | null,
      label,
      priceRand: Number(String(provider?.price ?? "0").replace(/[^0-9.]/g, "")) || 0,
      durationMinutes: Math.max(15, parseInt(String(provider?.duration ?? "60"), 10) || 60),
      deliveryMode: "in_person" as "in_person" | "telehealth" | "both",
    }));
  }, [hasRealServices, bionServices, provider]);

  // Determine if the currently selected service supports telehealth
  const selectedServiceDelivery = bookingServiceChoices[selectedService]?.deliveryMode ?? "in_person";
  const canTelehealth = selectedServiceDelivery === "telehealth" || selectedServiceDelivery === "both";

  // For registered providers we replace the hardcoded directory rating with the
  // real Supabase aggregate. Directory-only listings keep their seed rating so
  // unregistered providers still display sensibly in search.
  const { reviews: liveReviews, summary: ratingSummary } = useProviderReviews(
    isRegisteredOnBion ? id : undefined,
  );
  const displayRating = isRegisteredOnBion
    ? ratingSummary?.count
      ? ratingSummary.avg
      : 0
    : provider?.rating ?? 0;
  const displayReviewCount = isRegisteredOnBion
    ? ratingSummary?.count ?? 0
    : provider?.reviews ?? 0;

  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingBusy, setBookingBusy] = useState(false);

  // ── "Claim this business" self-service flow ──────────────────────────
  // Two paths: (1) OTP-verified self-claim, (2) request a meeting with
  // a BION sales rep. Both submit to dedicated backend endpoints.
  const [showClaim, setShowClaim] = useState(false);
  const [showContactPrompt, setShowContactPrompt] = useState(false);
  const [claimBusy, setClaimBusy] = useState(false);
  const [claimSubmitted, setClaimSubmitted] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimName, setClaimName] = useState("");
  const [claimEmail, setClaimEmail] = useState("");
  const [claimPhone, setClaimPhone] = useState("");
  const [claimProof, setClaimProof] = useState("");
  // OTP verification step
  const [claimId, setClaimId] = useState<string | null>(null);
  const [claimOtp, setClaimOtp] = useState("");
  const [claimOtpSent, setClaimOtpSent] = useState(false);
  const [claimVerified, setClaimVerified] = useState(false);
  // Meeting request
  const [showMeeting, setShowMeeting] = useState(false);
  const [meetingBusy, setMeetingBusy] = useState(false);
  const [meetingSubmitted, setMeetingSubmitted] = useState(false);
  const [meetingError, setMeetingError] = useState<string | null>(null);
  const [meetingEmail, setMeetingEmail] = useState("");
  const [meetingPhone, setMeetingPhone] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");

  // ── Multi-location support ──────────────────────────────────────────
  type ProviderLocation = {
    id: string; name: string; address: string | null; suburb: string | null;
    city: string | null; lat: number | null; lng: number | null; is_primary: boolean;
    operating_hours: Record<string, any>;
  };
  const [providerLocations, setProviderLocations] = useState<ProviderLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";
    fetch(`${API}/api/providers/locations/by-provider/${id}`)
      .then(r => r.json())
      .then(json => {
        if (json.ok && Array.isArray(json.data) && json.data.length > 0) {
          setProviderLocations(json.data);
          const primary = json.data.find((l: any) => l.is_primary);
          setSelectedLocationId(primary?.id ?? json.data[0].id);
        }
      })
      .catch(() => {});
  }, [id]);

  // ── Queue / Walk-in ───────────────────────────────────────────────
  const [joiningQueue, setJoiningQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState<{ position: number; wait: number } | null>(null);

  const joinQueue = async () => {
    if (!user?.profileId || !id) return;
    setJoiningQueue(true);
    try {
      const { data: { session } } = await (await import("@/integrations/supabase/client")).supabase.auth.getSession();
      const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";
      const res = await fetch(`${API}/api/queue/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          providerId: id,
          locationId: selectedLocationId ?? undefined,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setQueuePosition({ position: json.data.position, wait: json.data.estimatedWaitMinutes });
      }
    } catch (err) {
      console.error("Failed to join queue:", err);
    } finally {
      setJoiningQueue(false);
    }
  };

  // ── Medical Aid info for booking display ──────────────────────────
  const [clientMedicalAid, setClientMedicalAid] = useState<{ scheme: string; plan_name: string } | null>(null);
  useEffect(() => {
    if (!user?.profileId) return;
    (async () => {
      try {
        const { data: { session } } = await (await import("@/integrations/supabase/client")).supabase.auth.getSession();
        if (!session) return;
        const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";
        const res = await fetch(`${API}/api/profiles/medical-aid`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const json = await res.json();
        if (json.ok && json.data) {
          setClientMedicalAid({ scheme: json.data.scheme, plan_name: json.data.plan_name ?? "" });
        }
      } catch {}
    })();
  }, [user?.profileId]);

  // Acquisition voucher this user has already claimed for this provider.
  // When present, the user can apply it at checkout to skip Paystack entirely
  // — the voucher covers the whole bill and we settle it via
  // POST /api/bookings/voucher-checkout.
  const { claimed: claimedVouchers } = useAcquisitionVouchers(8);
  const claimedVoucher = claimedVouchers.find(
    v => v.provider_id === id && v.status === "claimed" && new Date(v.expires_at) > new Date(),
  );
  const [useVoucher, setUseVoucher] = useState(true);
  const shouldUseVoucher = !!claimedVoucher && useVoucher;

  const handleBook = async () => {
    if (!provider) return;
    setBookingError(null);

    // Gate 1 — must be signed in
    if (!user?.profileId) {
      setBookingError("Please sign up or log in first.");
      setTimeout(() => navigate("/welcome"), 1500);
      return;
    }

    // Gate 2 — provider must be registered on BION to take a real booking
    if (!isRegisteredOnBion) {
      setBookingBusy(true);
      try {
        // Fire a sales-team lead so we can onboard this provider for the user
        const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";
        await fetch(`${API}/api/providers/lead`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            providerId: provider.id,
            providerName: provider.name,
            providerService: provider.specialty,
            providerSuburb: provider.location,
            providerPhone: provider.contact?.phone,
            requestedBy: { profileId: user.profileId, name: user.name, email: user.email },
          }),
        }).catch(() => {/* best-effort — still show the user the right message */});
      } finally {
        setBookingBusy(false);
      }
      setBookingError("This provider hasn't claimed their BION listing yet. Our team has been notified to onboard them — we'll message you when in-app booking is available. In the meantime, their contact info above lets you reach them directly.");
      return;
    }

    // Gate 2.5 — the user needs to have picked a real time slot. When the
    // provider has no hours / is fully booked, the slot grid will be empty
    // and bookingTime will be "", so block here rather than sending garbage
    // to the checkout endpoint.
    if (!bookingTime) {
      setBookingError("Please pick an available time slot.");
      return;
    }

    // Gate 3 — registered provider, create a real booking via the backend API.
    // The backend creates a pending booking row AND initiates a Paystack
    // checkout session. We redirect to Paystack; on success, the booking
    // auto-confirms. On cancel, the user returns without a charge.
    setBookingBusy(true);
    try {
      // Resolve the selected service. For registered providers this picks
      // from the real BION services (with a UUID id and true price_rand);
      // for directory-only listings it falls back to the hardcoded label +
      // scraped price. `servicePayload` is what gets sent to the booking
      // backend — a UUID when we have one, otherwise the legacy free-text
      // label so the old code path keeps working for unregistered providers.
      const chosen = bookingServiceChoices[selectedService] ?? bookingServiceChoices[0];
      const serviceLabel = chosen?.label ?? provider.specialty;
      const servicePayload = chosen?.id ?? serviceLabel;
      const amountRand = chosen?.priceRand
        ?? Number(String(provider.price).replace(/[^0-9.]/g, ""))
        ?? 0;

      trackEvent("booking_started", {
        category: (provider.category ?? provider.specialty ?? "").toString().toLowerCase(),
        metadata: { provider_id: provider.id, service: serviceLabel, date: bookingDate, time: bookingTime },
      });
      const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

      // Voucher path — skip Paystack entirely. The backend validates the
      // voucher is still claimed + unexpired + for this provider, marks it
      // redeemed, and credits the provider's wallet.
      if (shouldUseVoucher && claimedVoucher) {
        const res = await fetch(`${API}/api/bookings/voucher-checkout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientProfileId: user.profileId,
            providerId: provider.id,
            service: servicePayload,
            bookingDate,
            bookingTime,
            voucherId: claimedVoucher.id,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error ?? "Could not redeem voucher");
        }
        setBookingConfirmed(true);
        setTimeout(() => navigate("/schedule"), 1200);
        return;
      }

      // Recurring path — create a series of bookings via dedicated endpoint.
      if (recurringEnabled && recurringSessions >= 2) {
        const res = await fetch(`${API}/api/bookings/recurring`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientProfileId: user.profileId,
            providerId: provider.id,
            service: servicePayload,
            bookingDate,
            bookingTime,
            amount: amountRand,
            frequency: recurringFrequency,
            sessions: recurringSessions,
          }),
        });
        const data = await res.json();
        if (!res.ok || (!data.ok && !data.checkoutUrl)) {
          throw new Error(data.error ?? "Could not create recurring booking");
        }
        // If the backend returns a checkout URL, redirect to Paystack for the bundle
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }
        // Otherwise the series was created directly
        setBookingConfirmed(true);
        setTimeout(() => navigate("/schedule"), 1200);
        return;
      }

      // Paid path — Paystack hosted checkout. Success URL routes back to /schedule.
      const res = await fetch(`${API}/api/bookings/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientProfileId: user.profileId,
          providerId: provider.id,
          service: servicePayload,
          bookingDate,
          bookingTime,
          amount: amountRand,
          deliveryMode: canTelehealth ? deliveryMode : "in_person",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error ?? "Could not start checkout");
      }
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      setBookingError(err.message ?? "Something went wrong starting your booking.");
    } finally {
      setBookingBusy(false);
    }
  };

  // Submit a self-service claim — Step 1: send OTP to email
  const submitClaim = async () => {
    if (!provider) return;
    setClaimError(null);
    if (!claimEmail.trim() || !claimPhone.trim()) {
      setClaimError("Please enter your email and phone number.");
      return;
    }
    setClaimBusy(true);
    try {
      const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";
      const res = await fetch(`${API}/api/providers/${provider.id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: claimEmail.trim(),
          phone: claimPhone.trim(),
          businessName: provider.name,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Couldn't start claim — try again.");
      }
      setClaimId(data.claimId);
      setClaimOtpSent(true);
    } catch (err: any) {
      setClaimError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setClaimBusy(false);
    }
  };

  // Submit a self-service claim — Step 2: verify OTP
  const verifyClaim = async () => {
    if (!claimId) return;
    setClaimError(null);
    if (claimOtp.length !== 6) {
      setClaimError("Please enter the 6-digit code from your email.");
      return;
    }
    setClaimBusy(true);
    try {
      const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";
      const res = await fetch(`${API}/api/providers/claim/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId, otp: claimOtp }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Verification failed — try again.");
      }
      setClaimVerified(true);
      // Redirect to document upload after a short delay
      setTimeout(() => navigate("/pro/verification"), 2500);
    } catch (err: any) {
      setClaimError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setClaimBusy(false);
    }
  };

  // Request a meeting with a BION sales rep
  const submitMeetingRequest = async () => {
    if (!provider) return;
    setMeetingError(null);
    if (!meetingEmail.trim() || !meetingPhone.trim()) {
      setMeetingError("Please enter your email and phone number.");
      return;
    }
    setMeetingBusy(true);
    try {
      const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";
      const res = await fetch(`${API}/api/providers/claim/request-meeting`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: meetingEmail.trim(),
          phone: meetingPhone.trim(),
          businessName: provider.name,
          preferredTime: meetingTime || undefined,
          notes: meetingNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Couldn't submit — try again.");
      }
      setMeetingSubmitted(true);
    } catch (err: any) {
      setMeetingError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setMeetingBusy(false);
    }
  };

  // SEO: dynamic page title + meta tags for this provider
  useEffect(() => {
    if (!provider) return;
    document.title = `${provider.name} — ${provider.specialty} | BION`;
    const setMeta = (attr: string, name: string, content: string) => {
      let tag = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!tag) { tag = document.createElement("meta"); tag.setAttribute(attr, name); document.head.appendChild(tag); }
      tag.content = content;
    };
    const desc = `Book ${provider.specialty} with ${provider.name} in ${provider.location}. ${displayRating > 0 ? `Rated ${displayRating}/5. ` : ""}Commit to yourself.`;
    setMeta("name", "description", desc);
    setMeta("property", "og:title", `${provider.name} — ${provider.specialty} | BION`);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:url", `https://bionhealth.co.za/provider/${provider.id}`);
    setMeta("property", "og:image", provider.image.startsWith("http") ? provider.image : `https://bionhealth.co.za${provider.image}`);
    setMeta("property", "og:type", "profile");
    setMeta("name", "twitter:title", `${provider.name} — ${provider.specialty} | BION`);
    setMeta("name", "twitter:description", desc);
    setMeta("name", "twitter:image", provider.image.startsWith("http") ? provider.image : `https://bionhealth.co.za${provider.image}`);
    // Track recently viewed
    if (provider.id) trackView(provider.id);
    // Feed B_'s personalisation
    trackEvent("provider_view", {
      category: (provider.category ?? provider.vertical ?? provider.specialty ?? "").toString().toLowerCase(),
      metadata: { provider_id: provider.id, name: provider.name, specialty: provider.specialty, location: provider.location },
    });
    return () => { document.title = "BION — Commit to Yourself"; };
  }, [provider, trackView]);

  const shareProvider = () => {
    const url = `https://bionhealth.co.za/provider/${provider.id}`;
    if (navigator.share) {
      navigator.share({ title: provider.name, text: `${provider.specialty} in ${provider.location}`, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!provider) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center text-foreground gap-4">
        <p className="text-lg font-semibold">Provider not found</p>
        <button onClick={() => navigate("/")} className="text-sm text-indigo">Back to directory</button>
      </div>
    );
  }

  const displayServices = showAllServices
    ? provider.servicesOffered
    : provider.servicesOffered.slice(0, 3);

  return (
    <div className="min-h-screen bg-obsidian pb-40">
      {/* Hero Cover */}
      <div className="relative h-[240px] md:h-[320px] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: `url(${provider.coverImage}) center/cover` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/50 to-obsidian/20" />

        {/* Nav */}
        <div className="absolute top-8 md:top-12 left-4 right-4 flex justify-between">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="glass-2 rounded-full w-10 h-10 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => toggleFavorite(provider.id)}
              className={`glass-2 rounded-full w-10 h-10 flex items-center justify-center ${isFavorite(provider.id) ? "bg-coral/20" : ""}`}
              aria-label={isFavorite(provider.id) ? "Remove from favorites" : "Add to favorites"}>
              <Heart className={`w-5 h-5 ${isFavorite(provider.id) ? "fill-coral text-coral" : "text-foreground"}`} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (isRegisteredOnBion && provider.contact?.phone) {
                  // Registered provider — message them directly
                  const phone = provider.contact.phone.replace(/[\s\-+()]/g, "");
                  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`Hi ${provider.name}, I found you on BION Health and would like to enquire about your services.`)}`, "_blank");
                } else if (provider.contact?.phone) {
                  // Scraped provider — message B_ with provider info
                  const phone = provider.contact.phone.replace(/[\s\-+()]/g, "");
                  window.open(`https://wa.me/27647432005?text=${encodeURIComponent(`Hi B_, I want to contact ${provider.name} (${provider.specialty}) in ${provider.location}. They're not on BION yet — can you share their contact details? Their number is ${phone}`)}`, "_blank");
                } else {
                  // No phone — message B_ to help
                  window.open(`https://wa.me/27647432005?text=${encodeURIComponent(`Hi B_, I want to book with ${provider.name} (${provider.specialty}) in ${provider.location}. Can you help me contact them?`)}`, "_blank");
                }
              }}
              className="glass-2 rounded-full w-10 h-10 flex items-center justify-center bg-[#25D366]/20">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25D366]"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.34 0-4.508-.657-6.363-1.795l-.444-.267-3.072 1.03 1.03-3.072-.267-.444A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={shareProvider} className="glass-2 rounded-full w-10 h-10 flex items-center justify-center">
              {copied ? <Check className="w-5 h-5 text-teal" /> : <Share2 className="w-5 h-5 text-foreground" />}
            </motion.button>
          </div>
        </div>

        {/* Identity */}
        <div className="absolute bottom-6 left-4 right-4 flex items-end gap-4">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <BioAvatar src={provider.image} alt={provider.name} size="xl" verticalColor={provider.vertical} verified={verifiedProviders.has(provider.id)} />
          </motion.div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{provider.name}</h1>
              {isVerifiedTrainer && (
                <span
                  title="Completed BION Provider Onboarding 101"
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo px-2 py-0.5 rounded-full bg-indigo/10 border border-indigo/20"
                >
                  <UserCheck className="w-3 h-3" />
                  BION Verified Trainer
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{provider.specialty}</p>
            <div className="flex items-center gap-2 mt-1">
              <Star className="w-4 h-4 text-amber fill-amber" />
              <span className="font-data text-sm text-foreground">
                {displayRating > 0 ? displayRating.toFixed(1) : "—"}
              </span>
              <span className="text-xs text-muted-foreground">
                ({displayReviewCount} {displayReviewCount === 1 ? "review" : "reviews"})
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 space-y-4 mt-4 max-w-2xl mx-auto">
        {/* Quick Stats */}
        <GlassCard className="flex divide-x divide-foreground/10">
          {[
            { label: "Experience", value: provider.experience },
            { label: "Location", value: provider.location.split(",")[0] },
            { label: "Price", value: provider.price },
          ].map((stat) => (
            <div key={stat.label} className="flex-1 py-3 text-center">
              <p className="font-data text-sm text-foreground">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </GlassCard>

        {/* Callout badge */}
        {provider.callout && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-teal" />
            <span className="text-teal font-medium">Offers callouts / home visits</span>
          </div>
        )}

        {/* Availability */}
        {provider.availability && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-teal" />
            <span className="text-muted-foreground">{provider.availability}</span>
          </div>
        )}

        {/* ── Location Picker (multi-location providers) ── */}
        {providerLocations.length > 1 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Select location
            </p>
            <div className="flex flex-wrap gap-2">
              {providerLocations.map(loc => (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLocationId(loc.id)}
                  className={`text-xs px-3 py-1.5 rounded-pill transition-all ${
                    selectedLocationId === loc.id
                      ? "gradient-indigo text-primary-foreground"
                      : "glass-1 text-muted-foreground"
                  }`}
                >
                  {loc.name}
                  {loc.is_primary && " (Main)"}
                </button>
              ))}
            </div>
            {(() => {
              const sel = providerLocations.find(l => l.id === selectedLocationId);
              if (!sel) return null;
              return (
                <p className="text-[11px] text-muted-foreground">
                  {[sel.address, sel.suburb, sel.city].filter(Boolean).join(", ")}
                </p>
              );
            })()}
          </div>
        )}

        {/* Medical Aid badge */}
        {clientMedicalAid && (
          <div className="glass-1 rounded-xl px-3 py-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-muted-foreground">Medical aid on file</p>
              <p className="text-xs font-medium text-foreground truncate">
                {clientMedicalAid.scheme}{clientMedicalAid.plan_name ? ` — ${clientMedicalAid.plan_name}` : ""}
              </p>
            </div>
          </div>
        )}

        {/* CTA — sign up or book */}
        {isSignedIn ? (
          <div className="space-y-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowBooking(true)}
              className="w-full rounded-pill py-4 text-base font-semibold gradient-indigo text-primary-foreground shadow-cta"
            >
              Book a Session — {provider.price}
            </motion.button>

            {/* Queue / Walk-in button */}
            {queuePosition ? (
              <div className="glass-1 rounded-xl px-4 py-3 text-center">
                <p className="text-sm font-semibold text-teal">You're #{queuePosition.position} in line</p>
                <p className="text-[11px] text-muted-foreground">Estimated wait: ~{queuePosition.wait} min</p>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={joinQueue}
                disabled={joiningQueue}
                className="w-full rounded-pill py-3 text-sm font-semibold glass-1 text-foreground border border-white/10 flex items-center justify-center gap-2"
              >
                {joiningQueue ? (
                  <div className="w-4 h-4 border-2 border-indigo border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Users className="w-4 h-4" />
                )}
                Join Walk-in Queue
              </motion.button>
            )}
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/welcome")}
            className="w-full rounded-pill py-4 text-base font-semibold gradient-indigo text-primary-foreground shadow-cta"
          >
            Sign Up to Book
          </motion.button>
        )}

        {/* Services — directory (unregistered) providers only. */}
        {!isRegisteredOnBion && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Services & Pricing</h2>
            {displayServices.length > 0 ? (
              <div className="space-y-2">
                {displayServices.map((service: string, i: number) => (
                  <GlassCard key={i} className="p-3 flex items-center justify-between">
                    <p className="text-sm text-foreground">{service}</p>
                    <span className="text-xs text-muted-foreground">{provider.duration}</span>
                  </GlassCard>
                ))}
                {provider.servicesOffered.length > 3 && !showAllServices && (
                  <button onClick={() => setShowAllServices(true)} className="text-xs text-indigo font-medium mt-1">
                    Show all {provider.servicesOffered.length} services
                  </button>
                )}
              </div>
            ) : null}
            <GlassCard className="p-4 mt-3 space-y-2">
              <p className="text-sm font-semibold text-foreground">
                {provider.price ? `Price range: ${provider.price}` : "Contact for pricing"}
              </p>
              <p className="text-xs text-muted-foreground">
                This provider hasn't listed individual services on BION yet. Contact them directly for a full menu and pricing.
              </p>
              <button
                onClick={() => {
                  const phone = provider.contact?.phone?.replace(/[\s\-+()]/g, "") || "27647432005";
                  const isProviderPhone = provider.contact?.phone;
                  const msg = isProviderPhone
                    ? `Hi ${provider.name}, I found you on BION Health. Could you share your services and pricing?`
                    : `Hi B_, can you help me get pricing from ${provider.name} in ${provider.location}?`;
                  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
                }}
                className="w-full rounded-pill py-2.5 text-xs font-semibold bg-[#25D366]/20 text-[#25D366] flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#25D366]"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.34 0-4.508-.657-6.363-1.795l-.444-.267-3.072 1.03 1.03-3.072-.267-.444A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                Ask for pricing via WhatsApp
              </button>
            </GlassCard>
          </section>
        )}

        {/* Shop section (only if provider has enabled storefront) */}
        <ProviderShopSection providerId={provider.id} />

        {/* Reviews — only for BION-registered providers. Directory-only
            listings keep their seeded rating/count in the hero and skip this
            section since there's no Supabase-backed review thread for them. */}
        {isRegisteredOnBion && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground">Reviews</h2>
              {ratingSummary && ratingSummary.count > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Star className="w-4 h-4 text-amber fill-amber" />
                  <span className="font-data text-foreground">
                    {ratingSummary.avg.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({ratingSummary.count})
                  </span>
                </div>
              )}
            </div>

            {liveReviews.length === 0 ? (
              <GlassCard className="p-4">
                <p className="text-sm text-muted-foreground text-center">
                  No reviews yet — be the first to book and review.
                </p>
              </GlassCard>
            ) : (
              <div className="space-y-2">
                {liveReviews.slice(0, 5).map((r) => {
                  const firstName =
                    r.client?.first_name ??
                    (r.client?.full_name?.split(" ")[0] ?? "Client");
                  const when = new Date(r.created_at).toLocaleDateString(
                    "en-ZA",
                    { day: "numeric", month: "short", year: "numeric" },
                  );
                  return (
                    <GlassCard key={r.id} className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= r.rating
                                  ? "text-amber fill-amber"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {when}
                        </span>
                      </div>
                      <p className="text-xs text-foreground font-medium">
                        {firstName}
                      </p>
                      {r.comment && (
                        <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                          {r.comment}
                        </p>
                      )}
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Contact Details
             Unauth users see email, website, address, and a phone with the
             last 2 digits masked — enough to evaluate the provider, but the
             full number still requires sign-up.
         */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Contact Information</h2>
          <GlassCard className="p-4">
            <div className="space-y-3">
              {provider.contact.email ? (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <a href={`mailto:${provider.contact.email}`} className="text-sm text-foreground hover:text-indigo transition-colors">
                    {provider.contact.email}
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground">Email on request — message via BION</span>
                </div>
              )}
              {provider.contact.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground font-data">
                    {isSignedIn
                      ? provider.contact.phone
                      : `${provider.contact.phone.slice(0, Math.max(0, provider.contact.phone.length - 2))}••`}
                  </span>
                </div>
              )}
              {provider.contact.website && (
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                  <a
                    href={provider.contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo hover:underline truncate"
                  >
                    {provider.contact.website}
                  </a>
                </div>
              )}
              {(provider.address || provider.location) && (() => {
                const addr = provider.address || provider.location;
                const mapsQuery = encodeURIComponent(addr);
                // Use geo coordinates if available for more accurate pin
                const hasCoords = provider.lat && provider.lng;
                const mapsUrl = hasCoords
                  ? `https://www.google.com/maps/search/?api=1&query=${provider.lat},${provider.lng}&query_place_id=${mapsQuery}`
                  : `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
                // Universal link that lets user choose their maps app
                const directionsUrl = hasCoords
                  ? `https://www.google.com/maps/dir/?api=1&destination=${provider.lat},${provider.lng}`
                  : `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`;

                const mapImgUrl = hasCoords
                  ? `https://maps.googleapis.com/maps/api/staticmap?center=${provider.lat},${provider.lng}&zoom=15&size=600x200&scale=2&maptype=roadmap&style=feature:all|element:geometry|color:0x1a1a2e&style=feature:all|element:labels.text.fill|color:0xcccccc&style=feature:all|element:labels.text.stroke|color:0x0a0a0f&style=feature:water|color:0x0d1117&style=feature:road|element:geometry|color:0x2a2a4a&markers=color:0x6366F1|${provider.lat},${provider.lng}&key=AIzaSyDH4okH3pluutebv0_WcQ7on3jnn3-2OMY`
                  : null;

                return (
                  <>
                    {mapImgUrl && (
                      <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden mb-3">
                        <img
                          src={mapImgUrl}
                          alt={`Map showing ${provider.name}`}
                          className="w-full h-[140px] object-cover rounded-xl"
                          loading="lazy"
                        />
                      </a>
                    )}
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 group">
                      <Building className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-foreground group-hover:text-indigo transition-colors underline decoration-white/20 group-hover:decoration-indigo">
                        {addr}
                      </span>
                    </a>
                    <a href={directionsUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 mt-2 px-4 py-2.5 rounded-xl glass-1 text-teal text-xs font-semibold hover:bg-white/[0.04] transition-colors w-fit">
                      <MapPin className="w-3.5 h-3.5" />
                      Get Directions
                    </a>
                  </>
                );
              })()}
            </div>

            {!isSignedIn && provider.contact.phone && (
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-3">
                <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground flex-1">
                  Sign up below to reveal the full phone number and book directly.
                </p>
                <button
                  onClick={() => navigate("/welcome")}
                  className="shrink-0 px-3 py-1.5 gradient-indigo rounded-pill text-xs font-medium text-white shadow-cta"
                >
                  Sign Up
                </button>
              </div>
            )}
          </GlassCard>

          {/* "Is this your business?" — only shown for directory-only listings.
              A verified BION provider already owns their profile so this
              card would be redundant; we hide it once isRegisteredOnBion. */}
          {!isRegisteredOnBion && user?.role === "provider" && (
            <GlassCard className="p-4 mt-3 border border-indigo/20 bg-indigo/[0.03]">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo/10 flex items-center justify-center shrink-0">
                  <Building className="w-4 h-4 text-indigo" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Is this your business?</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Take ownership of this listing to manage your profile & services, accept bookings & payments, and access CRM & analytics.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      onClick={() => {
                        setShowClaim(true);
                        setClaimOtpSent(false);
                        setClaimVerified(false);
                        setClaimSubmitted(false);
                        setClaimError(null);
                        setClaimOtp("");
                        setClaimId(null);
                      }}
                      className="px-3 py-1.5 gradient-indigo rounded-pill text-xs font-medium text-white shadow-cta"
                    >
                      Claim This Business
                    </button>
                    <button
                      onClick={() => {
                        setShowMeeting(true);
                        setMeetingSubmitted(false);
                        setMeetingError(null);
                      }}
                      className="px-3 py-1.5 glass-1 rounded-pill text-xs font-medium text-foreground border border-white/[0.08] hover:bg-white/[0.06] transition-colors"
                    >
                      Request a Meeting
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}
        </section>

        {/* About */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">About</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{provider.bio}</p>
        </section>

        {/* Services & pricing — registered providers only. Pulls the live
             service catalogue from /api/providers/:id/services (populated by
             the provider's /pro/services page) so the public profile always
             matches what they can actually deliver + charge for. */}
        {isRegisteredOnBion && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Services & pricing</h2>
            {bionServicesLoading ? (
              <GlassCard className="p-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading services…
              </GlassCard>
            ) : bionServices.length === 0 ? (
              <GlassCard className="p-4">
                <p className="text-xs text-muted-foreground">
                  This provider hasn't published their service menu yet — they can still
                  take your booking based on your needs.
                </p>
              </GlassCard>
            ) : (
              <div className="space-y-2">
                {bionServices.map((svc) => (
                  <GlassCard key={svc.id} className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{svc.title}</p>
                        {svc.description && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                            {svc.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3" /> {svc.duration_minutes} min
                          </span>
                          {svc.category && (
                            <span className="capitalize">{String(svc.category)}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-data text-sm text-foreground">
                          {svc.price_rand === 0 ? "Free intro" : `R${svc.price_rand}`}
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Programs — registered providers only. Lists published day-by-day
             programs the provider sells. Tapping a card opens the public
             /program/:id page where the client can read about it and enroll. */}
        {isRegisteredOnBion && (programsLoading || programs.length > 0) && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Programs</h2>
            {programsLoading ? (
              <GlassCard className="p-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading programs…
              </GlassCard>
            ) : (
              <div className="space-y-2">
                {programs.map((pg) => (
                  <button
                    key={pg.id}
                    onClick={() => navigate(`/program/${pg.id}`)}
                    className="block w-full text-left"
                  >
                    <GlassCard hover className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] glass-accent-indigo rounded-pill px-2 py-0.5 text-indigo capitalize">
                              {pg.vertical}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {pg.duration_days}d
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-foreground truncate">{pg.title}</p>
                          {pg.description && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                              {pg.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-data text-sm text-foreground">
                            {pg.price_rand === 0 ? "Free" : `R${pg.price_rand}`}
                          </p>
                        </div>
                      </div>
                    </GlassCard>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Packages — session bundles from registered providers */}
        {isRegisteredOnBion && <ProviderPackagesSection providerId={provider.id} />}

        {/* Qualifications */}
        {provider.qualifications.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Qualifications</h2>
            <div className="flex flex-wrap gap-2">
              {provider.qualifications.map((q: string) => (
                <span key={q} className="glass-1 rounded-pill px-3 py-1.5 text-xs text-muted-foreground">{q}</span>
              ))}
            </div>
          </section>
        )}

        {/* Languages */}
        {provider.languages.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Languages</h2>
            <div className="flex flex-wrap gap-2">
              {provider.languages.map((lang: string) => (
                <span key={lang} className="glass-1 rounded-pill px-3 py-1.5 text-xs text-foreground">{lang}</span>
              ))}
            </div>
          </section>
        )}

        {/* Payment info */}
        <GlassCard variant="accent-indigo" className="p-4">
          <div className="flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-indigo shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Secure Advance Payment</h3>
              <p className="text-xs text-muted-foreground">
                Book with confidence. Your payment is held securely until your appointment is completed.
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs">
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-teal" />
                  <span className="text-muted-foreground">5% platform fee</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-coral" />
                  <span className="text-muted-foreground">Secure escrow</span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Sticky bottom bar */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-40 bg-obsidian/90 backdrop-blur-xl border-t border-white/[0.06] px-4 md:px-8 py-3 flex items-center justify-between"
      >
        <span className="text-sm text-muted-foreground">
          From <span className="font-data text-foreground">{provider.price}</span>
        </span>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => isSignedIn ? setShowBooking(true) : navigate("/welcome")}
          className="rounded-pill px-6 py-3 text-[13px] md:text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta"
        >
          {isSignedIn ? "Book Now" : "Sign Up to Book"}
        </motion.button>
      </motion.div>

      {/* ── Booking Sheet ── */}
      {showBooking && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => !bookingConfirmed && setShowBooking(false)}
            className="fixed inset-0 bg-obsidian/70 z-[80]"
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[90] max-w-lg mx-auto rounded-t-3xl p-6 space-y-5"
            style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {bookingError ? (
              // Failure / unregistered-provider message — NOT a confirmation
              <div className="py-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber/20 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-amber" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground mb-1">
                      {isRegisteredOnBion ? "Couldn't start your booking" : "Provider not yet on BION"}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{bookingError}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setBookingError(null); setShowBooking(false); }}
                  className="w-full py-2.5 glass-1 rounded-pill text-sm font-medium text-foreground"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="w-5 h-5 text-indigo" />
                    <h3 className="text-base font-bold text-foreground">Book with {provider.name}</h3>
                  </div>
                  <button onClick={() => setShowBooking(false)} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Service selection — uses real BION services when the
                     provider has published a catalogue, otherwise falls back
                     to the scraped directory labels. */}
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Service</p>
                  <div className="flex flex-wrap gap-2">
                    {bookingServiceChoices.map((choice, i) => (
                      <button key={choice.id ?? `${choice.label}-${i}`} onClick={() => setSelectedService(i)}
                        className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-colors ${
                          selectedService === i ? "gradient-indigo text-white" : "glass-1 text-foreground"
                        }`}>
                        {choice.label}
                        {hasRealServices && choice.priceRand > 0 && (
                          <span className="ml-1 opacity-70 font-data">· R{choice.priceRand}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Telehealth toggle — shown when the selected service supports video calls */}
                {canTelehealth && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Session Type</p>
                    <div className="flex gap-2">
                      {(selectedServiceDelivery === "both" ? ["in_person", "telehealth"] as const : ["telehealth"] as const).map(mode => (
                        <button key={mode} onClick={() => setDeliveryMode(mode)}
                          className={`flex-1 py-2.5 rounded-pill text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                            deliveryMode === mode ? "gradient-indigo text-white" : "glass-1 text-foreground"
                          }`}>
                          {mode === "in_person" ? (
                            <><MapPin className="w-3.5 h-3.5" /> In-Person</>
                          ) : (
                            <><span className="text-sm">📹</span> Video Call</>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Date */}
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Date</p>
                  <input
                    type="date"
                    value={bookingDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={e => setBookingDate(e.target.value)}
                    className="w-full px-4 py-3 glass-1 rounded-xl text-sm text-foreground outline-none border border-white/[0.08] focus:border-indigo/40"
                  />
                </div>

                {/* Time slots — only shows 30-minute windows that fit inside
                     the provider's published hours (minus any override) and
                     don't overlap an existing pending/confirmed booking. */}
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Time</p>
                  {slotsLoading ? (
                    <div className="glass-1 rounded-xl p-3 text-xs text-muted-foreground">
                      Loading available times…
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2 max-h-44 overflow-y-auto pr-1">
                      {availableSlots.map(t => (
                        <button key={t} onClick={() => setBookingTime(t)}
                          className={`py-2 rounded-pill text-xs font-medium transition-colors ${
                            bookingTime === t ? "gradient-indigo text-white" : "glass-1 text-foreground"
                          }`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  ) : slotsReason === "closed" ? (
                    <div className="glass-1 rounded-xl p-3 text-xs text-muted-foreground">
                      Closed that day — try another date.
                    </div>
                  ) : slotsReason === "no_hours_published" ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Select your preferred time — we'll confirm with the provider:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {["Morning (8-12)", "Afternoon (12-5)", "Evening (5-8)"].map(slot => (
                          <button key={slot} onClick={() => setBookingTime(slot.split(" ")[0])}
                            className={`py-2 rounded-pill text-xs font-medium transition-colors ${
                              bookingTime === slot.split(" ")[0] ? "gradient-indigo text-white" : "glass-1 text-foreground"
                            }`}>
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : slotsReason === "fully_booked" ? (
                    <div className="glass-1 rounded-xl p-3 text-xs text-muted-foreground">
                      Fully booked that day — try another date.
                    </div>
                  ) : (
                    <div className="glass-1 rounded-xl p-3 text-xs text-muted-foreground">
                      No times available — try another date.
                    </div>
                  )}
                </div>

                {/* Recurring booking option */}
                <div>
                  <div
                    onClick={() => setRecurringEnabled(v => !v)}
                    className={`rounded-2xl p-3 flex items-center gap-3 cursor-pointer transition-all border ${
                      recurringEnabled
                        ? "bg-indigo/15 border-indigo/40"
                        : "glass-1 border-white/10"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      recurringEnabled ? "bg-indigo/20" : "bg-white/[0.03]"
                    }`}>
                      <CalendarDays className={`w-5 h-5 ${recurringEnabled ? "text-indigo" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">Make this recurring</p>
                      <p className="text-[10px] text-muted-foreground">
                        {recurringEnabled ? `${recurringFrequency}, ${recurringSessions} sessions` : "Book the same slot on a schedule"}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      recurringEnabled ? "border-indigo bg-indigo" : "border-white/30"
                    }`}>
                      {recurringEnabled && <Check className="w-3 h-3 text-obsidian" />}
                    </div>
                  </div>

                  {recurringEnabled && (
                    <div className="mt-3 space-y-3 pl-1">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Frequency</p>
                        <div className="flex gap-2">
                          {(["weekly", "biweekly", "monthly"] as const).map(freq => (
                            <button key={freq} onClick={() => setRecurringFrequency(freq)}
                              className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-colors capitalize ${
                                recurringFrequency === freq ? "gradient-indigo text-white" : "glass-1 text-foreground"
                              }`}>
                              {freq === "biweekly" ? "Bi-weekly" : freq}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">How many sessions?</p>
                        <div className="flex gap-2">
                          {[4, 8, 12].map(n => (
                            <button key={n} onClick={() => setRecurringSessions(n)}
                              className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-colors ${
                                recurringSessions === n ? "gradient-indigo text-white" : "glass-1 text-foreground"
                              }`}>
                              {n} sessions
                            </button>
                          ))}
                          <input
                            type="number"
                            min={2}
                            max={52}
                            value={![4,8,12].includes(recurringSessions) ? recurringSessions : ""}
                            placeholder="Custom"
                            onChange={e => {
                              const v = parseInt(e.target.value, 10);
                              if (v >= 2 && v <= 52) setRecurringSessions(v);
                            }}
                            onFocus={() => { if ([4,8,12].includes(recurringSessions)) setRecurringSessions(2); }}
                            className="w-20 px-3 py-1.5 glass-1 rounded-pill text-xs text-foreground text-center outline-none border border-white/[0.08] focus:border-indigo/40"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Summary + fee breakdown — falls back to scraped price
                     when no real BION service is selected. */}
                {(() => {
                  const selectedChoice = bookingServiceChoices[selectedService];
                  // Parse price: "R172 - R1618" → use the first number (min price)
                  const rawPrice = provider.price ?? "0";
                  const priceMatch = rawPrice.match(/\d+/);
                  const priceNum = selectedChoice?.priceRand
                    ?? (priceMatch ? parseInt(priceMatch[0], 10) : 0);
                  const clientFee = Math.round(priceNum * 0.05);
                  const total = priceNum + clientFee;
                  const voucherFace = claimedVoucher ? Math.round(Number(claimedVoucher.face_value_rand)) : 0;
                  return (
                    <>
                      {claimedVoucher && (
                        <div
                          onClick={() => setUseVoucher(v => !v)}
                          className={`rounded-2xl p-3 flex items-center gap-3 cursor-pointer transition-all border ${
                            shouldUseVoucher
                              ? "bg-amber/15 border-amber/40"
                              : "glass-1 border-white/10"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            shouldUseVoucher ? "bg-amber/20" : "bg-white/[0.03]"
                          }`}>
                            <Gift className={`w-5 h-5 ${shouldUseVoucher ? "text-amber" : "text-muted-foreground"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">
                              Use your R{voucherFace} reward
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {shouldUseVoucher
                                ? "Covers the whole booking — no card needed"
                                : "Tap to apply your acquisition voucher"}
                            </p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            shouldUseVoucher ? "border-amber bg-amber" : "border-white/30"
                          }`}>
                            {shouldUseVoucher && <Check className="w-3 h-3 text-obsidian" />}
                          </div>
                        </div>
                      )}
                      <div className="glass-1 rounded-2xl p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Service</span>
                          <span className="text-foreground font-medium">{selectedChoice?.label ?? provider.specialty}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Date & Time</span>
                          <span className="text-foreground font-medium">
                            {bookingTime ? `${bookingDate} at ${bookingTime}` : bookingDate}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Duration</span>
                          <span className="text-foreground font-medium">
                            {selectedChoice?.durationMinutes
                              ? `${selectedChoice.durationMinutes} min`
                              : provider.duration}
                          </span>
                        </div>
                        {recurringEnabled && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Schedule</span>
                            <span className="text-indigo font-medium capitalize">
                              {recurringFrequency === "biweekly" ? "Bi-weekly" : recurringFrequency} x {recurringSessions}
                            </span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-white/[0.06] space-y-1">
                          {shouldUseVoucher ? (
                            <>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Session price</span>
                                <span className="text-muted-foreground font-data">R{priceNum}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-amber">Acquisition voucher</span>
                                <span className="text-amber font-data">-R{voucherFace}</span>
                              </div>
                              <div className="flex justify-between text-sm pt-1 border-t border-white/[0.04]">
                                <span className="text-foreground font-semibold">You pay</span>
                                <span className="text-teal font-bold font-data">R0</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Session price</span>
                                <span className="text-muted-foreground font-data">R{priceNum}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">BION service fee (5%)</span>
                                <span className="text-muted-foreground font-data">R{clientFee}</span>
                              </div>
                              <div className="flex justify-between text-sm pt-1 border-t border-white/[0.04]">
                                <span className="text-foreground font-semibold">You pay</span>
                                <span className="text-foreground font-bold font-data">R{total}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Medical aid on file — shown to provider at booking */}
                {clientMedicalAid && (
                  <div className="glass-1 rounded-xl px-3 py-2 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-teal shrink-0" />
                    <p className="text-[11px] text-muted-foreground">
                      Medical aid: <span className="text-foreground font-medium">{clientMedicalAid.scheme}{clientMedicalAid.plan_name ? ` — ${clientMedicalAid.plan_name}` : ""}</span>
                    </p>
                  </div>
                )}

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (!user?.profileId) {
                      // Not signed in — redirect to signup
                      navigate("/welcome");
                      return;
                    }
                    if (!isRegisteredOnBion) {
                      // Provider not on BION — show contact popup
                      setShowContactPrompt(true);
                      return;
                    }
                    handleBook();
                  }}
                  disabled={bookingBusy}
                  className="w-full rounded-pill py-4 text-base font-semibold text-primary-foreground shadow-cta gradient-indigo"
                >
                  {bookingBusy ? "Starting checkout…" : !user?.profileId ? "Sign Up to Book" : !isRegisteredOnBion ? "Request Booking" : "Confirm Booking"}
                </motion.button>
              </>
            )}
          </motion.div>
        </>
      )}

      {/* ── Claim This Business Modal (OTP flow) ──
           Step 1: Enter email + phone → sends 6-digit OTP.
           Step 2: Enter OTP → verified → redirect to /pro/verification. */}
      {/* ── Contact Prompt for unregistered providers ── */}
      {showContactPrompt && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowContactPrompt(false)}
            className="fixed inset-0 bg-obsidian/70 z-[80]"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[90] max-w-sm mx-auto rounded-3xl p-6"
            style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl gradient-teal mx-auto flex items-center justify-center">
                <Phone className="w-7 h-7 text-obsidian" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Contact {provider?.name?.split(" ")[0] ?? "this provider"} directly</h3>
              <p className="text-xs text-muted-foreground">
                This provider hasn't joined BION yet. You can reach them directly via WhatsApp — B_ will help connect you.
              </p>

              <button
                onClick={() => {
                  const phone = provider?.contact?.phone;
                  const msg = encodeURIComponent(`Hi, I found ${provider?.name} on BION and would like to book a session. Can you help me with availability and pricing?`);
                  if (phone) {
                    const cleaned = phone.replace(/\D/g, "");
                    const num = cleaned.startsWith("0") ? "27" + cleaned.slice(1) : cleaned;
                    window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
                  } else {
                    window.open(`https://wa.me/27647432005?text=${encodeURIComponent(`Hi B_, I want to book with ${provider?.name} (${provider?.specialty}) in ${provider?.location}. Can you help me contact them?`)}`, "_blank");
                  }
                  setShowContactPrompt(false);
                }}
                className="w-full rounded-pill py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-teal to-emerald flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp {provider?.contact?.phone ? provider.name?.split(" ")[0] : "B_ to connect"}
              </button>

              <button
                onClick={() => {
                  navigate("/directory");
                  setShowContactPrompt(false);
                }}
                className="w-full rounded-pill py-3 text-xs font-medium glass-1 text-muted-foreground"
              >
                Browse registered providers instead
              </button>

              <p className="text-[10px] text-muted-foreground">
                We've notified our team to onboard this provider. You'll be notified when in-app booking is available.
              </p>
            </div>
          </motion.div>
        </>
      )}

      {showClaim && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => !claimBusy && setShowClaim(false)}
            className="fixed inset-0 bg-obsidian/70 z-[80]"
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[90] max-w-lg mx-auto rounded-t-3xl p-6 space-y-4"
            style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {claimVerified ? (
              /* Success — verified */
              <div className="py-4 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-teal/20 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 text-teal" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground mb-1">Business verified!</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                    Welcome to BION. You'll be redirected to upload your business documents so we can fully activate your profile.
                  </p>
                </div>
                <button
                  onClick={() => navigate("/pro/verification")}
                  className="w-full py-2.5 gradient-indigo rounded-pill text-sm font-semibold text-white shadow-cta"
                >
                  Upload Documents
                </button>
              </div>
            ) : claimOtpSent ? (
              /* Step 2 — Enter OTP */
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo/10 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-indigo" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Check your email</h3>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{claimEmail}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => !claimBusy && setShowClaim(false)}
                    className="w-8 h-8 glass-1 rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  We sent a 6-digit verification code to <strong className="text-foreground">{claimEmail}</strong>. Enter it below to claim <strong className="text-foreground">{provider.name}</strong>.
                </p>

                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 block">
                    Verification code <span className="text-coral">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={claimOtp}
                    onChange={e => setClaimOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="w-full px-4 py-3 glass-1 rounded-xl text-lg text-foreground text-center tracking-[0.5em] font-data placeholder:text-muted-foreground outline-none border border-white/[0.08] focus:border-indigo/40 transition-colors"
                    autoFocus
                  />
                </div>

                {claimError && (
                  <div className="rounded-xl border border-coral/30 bg-coral/10 px-3 py-2 text-xs text-coral">
                    {claimError}
                  </div>
                )}

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={verifyClaim}
                  disabled={claimBusy || claimOtp.length !== 6}
                  className={`w-full rounded-pill py-3.5 text-sm font-semibold text-primary-foreground shadow-cta transition-opacity flex items-center justify-center gap-2 ${
                    claimBusy || claimOtp.length !== 6 ? "gradient-indigo opacity-50 cursor-not-allowed" : "gradient-indigo"
                  }`}
                >
                  {claimBusy ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    "Verify & Claim"
                  )}
                </motion.button>

                <button
                  onClick={() => { setClaimOtpSent(false); setClaimError(null); setClaimOtp(""); }}
                  className="w-full text-xs text-muted-foreground text-center hover:text-foreground transition-colors"
                >
                  Back to edit details
                </button>
              </>
            ) : (
              /* Step 1 — Enter email + phone */
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo/10 flex items-center justify-center">
                      <Building className="w-4 h-4 text-indigo" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Claim this business</h3>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{provider.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => !claimBusy && setShowClaim(false)}
                    className="w-8 h-8 glass-1 rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 block">
                      Business email <span className="text-coral">*</span>
                    </label>
                    <input
                      type="email"
                      value={claimEmail}
                      onChange={e => setClaimEmail(e.target.value)}
                      placeholder="you@business.co.za"
                      className="w-full px-4 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/[0.08] focus:border-indigo/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 block">
                      Phone number <span className="text-coral">*</span>
                    </label>
                    <input
                      type="tel"
                      value={claimPhone}
                      onChange={e => setClaimPhone(e.target.value)}
                      placeholder="+27 ..."
                      className="w-full px-4 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/[0.08] focus:border-indigo/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 block">
                      Business name
                    </label>
                    <input
                      type="text"
                      value={provider.name}
                      disabled
                      className="w-full px-4 py-2.5 glass-1 rounded-xl text-sm text-muted-foreground outline-none border border-white/[0.08] opacity-60"
                    />
                  </div>
                </div>

                {claimError && (
                  <div className="rounded-xl border border-coral/30 bg-coral/10 px-3 py-2 text-xs text-coral">
                    {claimError}
                  </div>
                )}

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={submitClaim}
                  disabled={claimBusy}
                  className={`w-full rounded-pill py-3.5 text-sm font-semibold text-primary-foreground shadow-cta transition-opacity flex items-center justify-center gap-2 ${
                    claimBusy ? "gradient-indigo opacity-60 cursor-not-allowed" : "gradient-indigo"
                  }`}
                >
                  {claimBusy ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending code…
                    </>
                  ) : (
                    "Send Verification Code"
                  )}
                </motion.button>

                <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                  We'll send a 6-digit code to your email to verify ownership.
                </p>
              </>
            )}
          </motion.div>
        </>
      )}

      {/* ── Request a Meeting Modal ── */}
      {showMeeting && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => !meetingBusy && setShowMeeting(false)}
            className="fixed inset-0 bg-obsidian/70 z-[80]"
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[90] max-w-lg mx-auto rounded-t-3xl p-6 space-y-4"
            style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {meetingSubmitted ? (
              <div className="py-4 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-teal/20 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 text-teal" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground mb-1">Meeting requested</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                    A BION rep will contact you within 24 hours to schedule a call and help you get started.
                  </p>
                </div>
                <button
                  onClick={() => setShowMeeting(false)}
                  className="w-full py-2.5 gradient-indigo rounded-pill text-sm font-semibold text-white shadow-cta"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo/10 flex items-center justify-center">
                      <CalendarDays className="w-4 h-4 text-indigo" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Request a meeting</h3>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{provider.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => !meetingBusy && setShowMeeting(false)}
                    className="w-8 h-8 glass-1 rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 block">
                      Email <span className="text-coral">*</span>
                    </label>
                    <input
                      type="email"
                      value={meetingEmail}
                      onChange={e => setMeetingEmail(e.target.value)}
                      placeholder="you@business.co.za"
                      className="w-full px-4 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/[0.08] focus:border-indigo/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 block">
                      Phone <span className="text-coral">*</span>
                    </label>
                    <input
                      type="tel"
                      value={meetingPhone}
                      onChange={e => setMeetingPhone(e.target.value)}
                      placeholder="+27 ..."
                      className="w-full px-4 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/[0.08] focus:border-indigo/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 block">
                      Preferred meeting time
                    </label>
                    <select
                      value={meetingTime}
                      onChange={e => setMeetingTime(e.target.value)}
                      className="w-full px-4 py-2.5 glass-1 rounded-xl text-sm text-foreground outline-none border border-white/[0.08] focus:border-indigo/40 transition-colors bg-transparent"
                    >
                      <option value="">Any time</option>
                      <option value="Morning">Morning</option>
                      <option value="Afternoon">Afternoon</option>
                      <option value="Evening">Evening</option>
                      <option value="Weekend">Weekend</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 block">
                      Notes <span className="text-muted-foreground/50">(optional)</span>
                    </label>
                    <textarea
                      value={meetingNotes}
                      onChange={e => setMeetingNotes(e.target.value)}
                      placeholder="Tell us about your business or any questions you have..."
                      rows={3}
                      className="w-full px-4 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/[0.08] focus:border-indigo/40 transition-colors resize-none"
                    />
                  </div>
                </div>

                {meetingError && (
                  <div className="rounded-xl border border-coral/30 bg-coral/10 px-3 py-2 text-xs text-coral">
                    {meetingError}
                  </div>
                )}

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={submitMeetingRequest}
                  disabled={meetingBusy}
                  className={`w-full rounded-pill py-3.5 text-sm font-semibold text-primary-foreground shadow-cta transition-opacity flex items-center justify-center gap-2 ${
                    meetingBusy ? "gradient-indigo opacity-60 cursor-not-allowed" : "gradient-indigo"
                  }`}
                >
                  {meetingBusy ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    "Request Meeting"
                  )}
                </motion.button>

                <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                  A BION representative will contact you within 24 hours.
                </p>
              </>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}

// ── Packages Section (session bundles) ──────────────────────────────────────
function ProviderPackagesSection({ providerId }: { providerId: string }) {
  const { user } = useAuth();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/api/packages?providerId=${providerId}`)
      .then(r => r.json())
      .then(json => {
        if (cancelled) return;
        if (json?.ok && Array.isArray(json.data)) setPackages(json.data);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [providerId]);

  if (loading || packages.length === 0) return null;

  async function handleBuy(pkgId: string) {
    if (!user) {
      window.location.href = "/welcome";
      return;
    }
    setPurchasing(pkgId);
    try {
      const token = (await (window as any).__supabase?.auth.getSession())?.data?.session?.access_token;
      const res = await fetch(`${API}/api/packages/${pkgId}/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (json.ok) {
        const { toast } = await import("sonner");
        toast.success("Package purchased! Sessions added to your account.");
      } else {
        const { toast } = await import("sonner");
        toast.error(json.error ?? "Purchase failed");
      }
    } catch {
      const { toast } = await import("sonner");
      toast.error("Network error — try again");
    } finally {
      setPurchasing(null);
    }
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <Package className="w-4 h-4 text-indigo" /> Packages
      </h2>
      <div className="space-y-2">
        {packages.map((pkg: any) => (
          <GlassCard key={pkg.id} className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{pkg.title}</p>
                {pkg.description && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{pkg.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                  <span>{pkg.total_sessions} sessions{pkg.bonus_sessions > 0 ? ` + ${pkg.bonus_sessions} free` : ""}</span>
                  <span>Valid {pkg.valid_days} days</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-data text-sm text-foreground">R{pkg.price_rand}</p>
                {pkg.bonus_sessions > 0 && (
                  <p className="text-[10px] text-green-400">+{pkg.bonus_sessions} bonus</p>
                )}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  disabled={purchasing === pkg.id}
                  onClick={() => handleBuy(pkg.id)}
                  className="mt-1.5 rounded-pill px-3 py-1.5 gradient-indigo text-primary-foreground text-[11px] font-semibold shadow-cta disabled:opacity-50"
                >
                  {purchasing === pkg.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Buy Package"}
                </motion.button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
