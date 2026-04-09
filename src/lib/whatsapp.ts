/**
 * WhatsApp integration utilities for BION
 * Uses WhatsApp click-to-chat URLs (wa.me) for booking confirmations,
 * reminders, and provider-client communication.
 */

export interface BookingDetails {
  providerName: string;
  providerPhone?: string;
  serviceName: string;
  date: string;
  time: string;
  price?: string;
  clientName?: string;
  bookingRef?: string;
}

/**
 * Generate a WhatsApp message URL for booking confirmation
 */
export function getBookingConfirmationUrl(booking: BookingDetails): string {
  const msg = [
    `Hi ${booking.providerName},`,
    ``,
    `I've booked a session through BION:`,
    ``,
    `Service: ${booking.serviceName}`,
    `Date: ${booking.date}`,
    `Time: ${booking.time}`,
    booking.price ? `Price: ${booking.price}` : "",
    booking.bookingRef ? `Ref: ${booking.bookingRef}` : "",
    ``,
    `Please confirm. Thank you!`,
    `— ${booking.clientName ?? "BION Client"}`,
  ].filter(Boolean).join("\n");

  const phone = booking.providerPhone?.replace(/[^0-9]/g, "") ?? "";
  const encoded = encodeURIComponent(msg);

  return phone
    ? `https://wa.me/${phone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}

/**
 * Generate a WhatsApp reminder URL for upcoming booking
 */
export function getBookingReminderUrl(booking: BookingDetails): string {
  const msg = [
    `Reminder: You have a booking tomorrow`,
    ``,
    `Provider: ${booking.providerName}`,
    `Service: ${booking.serviceName}`,
    `Date: ${booking.date}`,
    `Time: ${booking.time}`,
    ``,
    `Don't forget! 💪`,
  ].join("\n");

  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

/**
 * Generate a WhatsApp share URL for referring BION
 */
export function getReferralShareUrl(referralCode: string, userName?: string): string {
  const msg = [
    `Hey! I've been using BION for my health & wellness — it's amazing.`,
    ``,
    `Use my referral code ${referralCode} to get bonus BIONPoints when you sign up.`,
    ``,
    `Download: https://bion-app.vercel.app`,
    ``,
    `Commit to your health, your wellness and your beauty. Commit to yourself. ✨`,
  ].join("\n");

  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

/**
 * Generate a WhatsApp URL for provider to contact client
 */
export function getProviderToClientUrl(clientName: string, clientPhone: string, message: string): string {
  const phone = clientPhone.replace(/[^0-9]/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Open WhatsApp with the given URL
 */
export function openWhatsApp(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}
