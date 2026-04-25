import { useEffect } from "react";
import { useBookings } from "@/contexts/BookingsContext";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Checks upcoming bookings and triggers browser/SW notifications
 * for appointments within the next 24 hours.
 * Runs once on mount + every 30 minutes.
 */
export function useBookingReminders() {
  const { user } = useAuth();
  const { getByStatus } = useBookings();

  useEffect(() => {
    if (!user) return;

    const checkReminders = () => {
      const upcoming = getByStatus(["pending", "confirmed"]);
      const now = Date.now();
      const in24h = now + 24 * 60 * 60 * 1000;

      upcoming.forEach(booking => {
        if (!booking.date || !booking.time) return;

        const bookingTime = new Date(`${booking.date}T${booking.time}`).getTime();
        if (isNaN(bookingTime)) return;

        // Only remind for bookings in the next 24 hours
        if (bookingTime <= now || bookingTime > in24h) return;

        const hoursUntil = Math.round((bookingTime - now) / (60 * 60 * 1000));

        // Two reminder windows: 24h and 1h. Each fires once.
        const window = hoursUntil <= 1 ? "1h" : "24h";
        const reminderKey = `bion_reminder_${booking.id}_${window}`;
        if (localStorage.getItem(reminderKey)) return;

        const timeLabel = hoursUntil <= 1 ? "in about an hour" : `in ${hoursUntil} hours`;

        // Try browser notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`Upcoming: ${booking.service}`, {
            body: `${booking.providerName ?? "Provider"} ${timeLabel} at ${booking.time}`,
            icon: "/icon-192.png",
            tag: `booking-${booking.id}`,
          });
        }

        // Also try SW notification (works when app is in background)
        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "SHOW_NOTIFICATION",
            title: `Upcoming: ${booking.service}`,
            body: `${booking.providerName ?? "Provider"} ${timeLabel} at ${booking.time}`,
            url: "/schedule",
            tag: `booking-${booking.id}`,
          });
        }

        // Mark as reminded
        localStorage.setItem(reminderKey, "1");
      });
    };

    // Request notification permission on first use
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    checkReminders();
    const interval = setInterval(checkReminders, 30 * 60 * 1000); // every 30 min

    return () => clearInterval(interval);
  }, [user, getByStatus]);
}
