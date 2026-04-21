/**
 * useNativeHealth — reads biometric data from Apple HealthKit (iOS) or
 * Health Connect (Android) when running inside the Capacitor native shell.
 *
 * On the web the hook returns `isNative: false` so the UI can prompt users
 * to install the mobile app for biometric sync.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NativeHealthData {
  /** true when running inside Capacitor (iOS / Android) */
  isNative: boolean;
  /** true after the user granted health-data permissions */
  authorized: boolean;
  /** Request HealthKit / Health Connect permissions */
  requestAuth: () => Promise<void>;
  /** Today's step count */
  steps: number | null;
  /** Most recent heart-rate reading (bpm) */
  heartRate: number | null;
  /** Last night's sleep duration in hours */
  sleep: number | null;
  /** Most recent weight in kg */
  weight: number | null;
  /** Pull the latest data again */
  refresh: () => Promise<void>;
  /** true while any query is in flight */
  loading: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Start of today (local) as ISO string */
function todayStart(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** Start of yesterday (for sleep window) */
function yesterdayStart(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(20, 0, 0, 0); // typical sleep-window start
  return d.toISOString();
}

function nowISO(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// iOS — @perfood/capacitor-healthkit
// ---------------------------------------------------------------------------

async function iosRequestAuth(): Promise<boolean> {
  const { CapacitorHealthkit } = await import("@perfood/capacitor-healthkit");
  try {
    await CapacitorHealthkit.requestAuthorization({
      all: [],
      read: [
        "stepCount",
        "distanceWalkingRunning",
        "activeEnergyBurned",
        "heartRate",
        "restingHeartRate",
        "sleepAnalysis",
        "bodyMass",
        "height",
        "bodyFatPercentage",
        "bodyMassIndex",
        "bloodPressureSystolic",
        "bloodPressureDiastolic",
        "oxygenSaturation",
        "dietaryWater",
      ],
      write: ["bodyMass", "height", "bodyFatPercentage", "dietaryWater"],
    });
    return true;
  } catch {
    return false;
  }
}

async function iosReadSteps(): Promise<number | null> {
  const { CapacitorHealthkit } = await import("@perfood/capacitor-healthkit");
  try {
    const res = await CapacitorHealthkit.queryHKitSampleType({
      sampleName: "stepCount",
      startDate: todayStart(),
      endDate: nowISO(),
      limit: 0, // no limit — aggregate all
    });
    // Sum all step samples for today
    const total = (res.resultData as Array<{ value: number }>).reduce(
      (sum, s) => sum + (s.value ?? 0),
      0,
    );
    return total || null;
  } catch {
    return null;
  }
}

async function iosReadHeartRate(): Promise<number | null> {
  const { CapacitorHealthkit } = await import("@perfood/capacitor-healthkit");
  try {
    const res = await CapacitorHealthkit.queryHKitSampleType({
      sampleName: "heartRate",
      startDate: todayStart(),
      endDate: nowISO(),
      limit: 1, // latest
    });
    const samples = res.resultData as Array<{ value: number }>;
    return samples.length > 0 ? samples[0].value : null;
  } catch {
    return null;
  }
}

async function iosReadSleep(): Promise<number | null> {
  const { CapacitorHealthkit } = await import("@perfood/capacitor-healthkit");
  try {
    const res = await CapacitorHealthkit.queryHKitSampleType({
      sampleName: "sleepAnalysis",
      startDate: yesterdayStart(),
      endDate: nowISO(),
      limit: 0,
    });
    // Sum durations (in seconds) of InBed / Asleep samples
    const totalSec = (res.resultData as Array<{ duration: number; sleepState: string }>)
      .filter((s) => s.sleepState !== "AWAKE")
      .reduce((sum, s) => sum + (s.duration ?? 0), 0);
    return totalSec > 0 ? Math.round((totalSec / 3600) * 10) / 10 : null;
  } catch {
    return null;
  }
}

async function iosReadWeight(): Promise<number | null> {
  const { CapacitorHealthkit } = await import("@perfood/capacitor-healthkit");
  try {
    // Last 90 days, most recent entry
    const start = new Date();
    start.setDate(start.getDate() - 90);
    const res = await CapacitorHealthkit.queryHKitSampleType({
      sampleName: "bodyMass",
      startDate: start.toISOString(),
      endDate: nowISO(),
      limit: 1,
    });
    const samples = res.resultData as Array<{ value: number; unitName: string }>;
    if (samples.length === 0) return null;
    // HealthKit may return lbs or kg depending on locale — plugin returns kg by default
    return Math.round(samples[0].value * 10) / 10;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Android — capacitor-health-connect
// ---------------------------------------------------------------------------

async function androidRequestAuth(): Promise<boolean> {
  const { HealthConnect } = await import("capacitor-health-connect");
  try {
    const { availability } = await HealthConnect.checkAvailability();
    if (availability !== "Available") return false;

    const result = await HealthConnect.requestHealthPermissions({
      read: [
        "Steps",
        "ActiveCaloriesBurned",
        "HeartRateSeries",
        "RestingHeartRate",
        "Weight",
        "Height",
        "BodyFat",
        "BloodPressure",
        "OxygenSaturation",
      ],
      write: ["Weight", "Height", "BodyFat"],
    });
    return result.hasAllPermissions;
  } catch {
    return false;
  }
}

async function androidReadSteps(): Promise<number | null> {
  const { HealthConnect } = await import("capacitor-health-connect");
  try {
    const startTime = new Date();
    startTime.setHours(0, 0, 0, 0);
    const res = await HealthConnect.readRecords({
      type: "Steps",
      timeRangeFilter: {
        type: "between",
        startTime,
        endTime: new Date(),
      },
    });
    const total = (res.records as Array<{ count: number }>).reduce(
      (sum, r) => sum + (r.count ?? 0),
      0,
    );
    return total || null;
  } catch {
    return null;
  }
}

async function androidReadHeartRate(): Promise<number | null> {
  const { HealthConnect } = await import("capacitor-health-connect");
  try {
    const startTime = new Date();
    startTime.setHours(0, 0, 0, 0);
    const res = await HealthConnect.readRecords({
      type: "HeartRateSeries",
      timeRangeFilter: {
        type: "between",
        startTime,
        endTime: new Date(),
      },
      pageSize: 1,
    });
    const records = res.records as Array<{ samples: Array<{ beatsPerMinute: number }> }>;
    if (records.length > 0 && records[0].samples.length > 0) {
      return records[0].samples[records[0].samples.length - 1].beatsPerMinute;
    }
    return null;
  } catch {
    return null;
  }
}

async function androidReadSleep(): Promise<number | null> {
  // Health Connect doesn't have a dedicated sleep RecordType in this plugin version.
  // Return null — the dashboard will fall back to manually-logged data.
  return null;
}

async function androidReadWeight(): Promise<number | null> {
  const { HealthConnect } = await import("capacitor-health-connect");
  try {
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - 90);
    const res = await HealthConnect.readRecords({
      type: "Weight",
      timeRangeFilter: {
        type: "between",
        startTime,
        endTime: new Date(),
      },
      pageSize: 1,
      ascendingOrder: false,
    });
    const records = res.records as Array<{ weight: { unit: string; value: number } }>;
    if (records.length === 0) return null;
    const w = records[0].weight;
    // Convert to kg if needed
    if (w.unit === "pound") return Math.round(w.value * 0.453592 * 10) / 10;
    return Math.round(w.value * 10) / 10;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useNativeHealth(): NativeHealthData {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform(); // "ios" | "android" | "web"

  const [authorized, setAuthorized] = useState(false);
  const [steps, setSteps] = useState<number | null>(null);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [sleep, setSleep] = useState<number | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Read all metrics ──
  const refresh = useCallback(async () => {
    if (!isNative || !authorized) return;
    setLoading(true);
    try {
      if (platform === "ios") {
        const [s, hr, sl, w] = await Promise.all([
          iosReadSteps(),
          iosReadHeartRate(),
          iosReadSleep(),
          iosReadWeight(),
        ]);
        if (!mountedRef.current) return;
        setSteps(s);
        setHeartRate(hr);
        setSleep(sl);
        setWeight(w);
      } else if (platform === "android") {
        const [s, hr, sl, w] = await Promise.all([
          androidReadSteps(),
          androidReadHeartRate(),
          androidReadSleep(),
          androidReadWeight(),
        ]);
        if (!mountedRef.current) return;
        setSteps(s);
        setHeartRate(hr);
        setSleep(sl);
        setWeight(w);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [isNative, authorized, platform]);

  // ── Request authorization ──
  const requestAuth = useCallback(async () => {
    if (!isNative) return;
    setLoading(true);
    try {
      let ok = false;
      if (platform === "ios") ok = await iosRequestAuth();
      else if (platform === "android") ok = await androidRequestAuth();
      if (!mountedRef.current) return;
      setAuthorized(ok);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [isNative, platform]);

  // Auto-read after authorization
  useEffect(() => {
    if (authorized) {
      refresh();
    }
  }, [authorized, refresh]);

  // ── Web no-op ──
  if (!isNative) {
    return {
      isNative: false,
      authorized: false,
      requestAuth: async () => {},
      steps: null,
      heartRate: null,
      sleep: null,
      weight: null,
      refresh: async () => {},
      loading: false,
    };
  }

  return {
    isNative,
    authorized,
    requestAuth,
    steps,
    heartRate,
    sleep,
    weight,
    refresh,
    loading,
  };
}
