import fs from "fs/promises";
import path from "path";

const USAGE_FILE = path.join(process.cwd(), "data", "ocr", "_usage.json");

export interface UsageRecord {
  timestamp: string;
  slug?: string;
  page?: number;
  success: boolean;
}

export interface UsageData {
  /** Per-call log (kept for the current month only) */
  calls: UsageRecord[];
  /** User-configured daily limit (0 = unlimited) */
  dailyLimit: number;
  /** User-configured monthly limit (0 = unlimited) */
  monthlyLimit: number;
}

async function readUsage(): Promise<UsageData> {
  try {
    const raw = await fs.readFile(USAGE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { calls: [], dailyLimit: 0, monthlyLimit: 0 };
  }
}

async function writeUsage(data: UsageData) {
  await fs.mkdir(path.dirname(USAGE_FILE), { recursive: true });
  await fs.writeFile(USAGE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

/** Record a single API call. */
export async function recordCall(opts: { slug?: string; page?: number; success: boolean }) {
  const data = await readUsage();
  data.calls.push({
    timestamp: new Date().toISOString(),
    slug: opts.slug,
    page: opts.page,
    success: opts.success,
  });
  // Prune calls older than 35 days to keep the file manageable
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 35);
  data.calls = data.calls.filter((c) => new Date(c.timestamp) >= cutoff);
  await writeUsage(data);
}

/** Get usage stats for display. */
export async function getUsageStats() {
  const data = await readUsage();
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const monthStr = now.toISOString().slice(0, 7);

  const todayCalls = data.calls.filter(
    (c) => c.timestamp.startsWith(todayStr) && c.success
  );
  const monthCalls = data.calls.filter(
    (c) => c.timestamp.startsWith(monthStr) && c.success
  );

  return {
    today: todayCalls.length,
    month: monthCalls.length,
    dailyLimit: data.dailyLimit,
    monthlyLimit: data.monthlyLimit,
    /** Whether the daily limit has been hit */
    dailyLimitReached: data.dailyLimit > 0 && todayCalls.length >= data.dailyLimit,
    /** Whether the monthly limit has been hit */
    monthlyLimitReached: data.monthlyLimit > 0 && monthCalls.length >= data.monthlyLimit,
  };
}

/** Check if we can make another API call without exceeding limits. */
export async function canMakeCall(): Promise<boolean> {
  const stats = await getUsageStats();
  return !stats.dailyLimitReached && !stats.monthlyLimitReached;
}

/** Average seconds per successful API call, based on recent calls. */
export async function getAvgSecondsPerPage(): Promise<number | null> {
  const data = await readUsage();
  const successful = data.calls.filter((c) => c.success);
  if (successful.length < 2) return null;

  // Use the last 50 calls to compute average interval
  const recent = successful.slice(-50);
  const timestamps = recent.map((c) => new Date(c.timestamp).getTime());

  let totalInterval = 0;
  let count = 0;
  for (let i = 1; i < timestamps.length; i++) {
    const diff = (timestamps[i] - timestamps[i - 1]) / 1000;
    // Only count intervals under 5 minutes (skip gaps between sessions)
    if (diff > 0 && diff < 300) {
      totalInterval += diff;
      count++;
    }
  }

  return count > 0 ? totalInterval / count : null;
}

/** Update the user-configured limits. */
export async function setLimits(daily: number, monthly: number) {
  const data = await readUsage();
  data.dailyLimit = daily;
  data.monthlyLimit = monthly;
  await writeUsage(data);
}
