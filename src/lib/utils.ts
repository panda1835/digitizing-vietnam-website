import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Folds Latin text for accent-insensitive matching, so "Tu Duc" finds "Tự Đức"
 * and "quoc ngu" finds "quốc ngữ".
 *
 * Hán and Nôm characters pass through untouched — folding would destroy their
 * identity — so they are matched as plain substrings instead.
 */
export const normalizeSearchText = (value: string) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
