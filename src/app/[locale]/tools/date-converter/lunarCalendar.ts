/**
 * Vietnamese lunisolar calendar conversion (UTC+7).
 * Adapted from the algorithm by Hồ Ngọc Đức.
 */

const PI = Math.PI;

function jdFromDate(day: number, month: number, year: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  let jd =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
  if (jd < 2299161) {
    jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  }
  return jd;
}

export function jdToDate(jd: number): { day: number; month: number; year: number } {
  let a: number, b: number, c: number;
  if (jd > 2299160) {
    a = jd + 32044;
    b = Math.floor((4 * a + 3) / 146097);
    c = a - Math.floor((b * 146097) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return {
    day: e - Math.floor((153 * m + 2) / 5) + 1,
    month: m + 3 - 12 * Math.floor(m / 10),
    year: b * 100 + d - 4800 + Math.floor(m / 10),
  };
}

/** Julian day of the k-th new moon after 1/1/1900 (local midnight, UTC+7). */
function newMoon(k: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = PI / 180;
  let Jde =
    2415020.75933 +
    29.53058868 * k +
    0.0001178 * T2 -
    0.000000155 * T3 +
    0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = (359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3) * dr;
  const Mpr = (306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3) * dr;
  const F = (21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3) * dr;
  const C1 =
    (0.1734 - 0.000393 * T) * Math.sin(M) +
    0.0021 * Math.sin(2 * M) -
    0.4068 * Math.sin(Mpr) +
    0.0161 * Math.sin(2 * Mpr) -
    0.0004 * Math.sin(3 * Mpr) +
    0.0104 * Math.sin(2 * F) -
    0.0051 * Math.sin(M + Mpr) -
    0.0074 * Math.sin(M - Mpr) +
    0.0004 * Math.sin(2 * F + M) -
    0.0004 * Math.sin(2 * F - M) -
    0.0006 * Math.sin(2 * F + Mpr) +
    0.001 * Math.sin(2 * F - Mpr) +
    0.0005 * Math.sin(M + 2 * Mpr);
  const delta =
    T < -11
      ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
      : -0.000278 + 0.000265 * T + 0.000262 * T2;
  Jde += C1 - delta;
  return Math.floor(Jde + 0.5 + 7.0 / 24);
}

function sunLongitude(jdn: number): number {
  const T = (jdn - 2451545.0) / 36525;
  const T2 = T * T;
  const dr = PI / 180;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T2;
  const M = (357.52911 + 35999.05029 * T - 0.0001537 * T2) * dr;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T2) * Math.sin(M) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * M) +
    0.000289 * Math.sin(3 * M);
  let L = (L0 + C) % 360;
  return L < 0 ? L + 360 : L;
}

function sunLongitudeSector(jdn: number): number {
  return Math.floor(sunLongitude(jdn) / 30);
}

/** JD of the start of tháng 11 (11th lunar month) in a given CE year. */
function getLunarMonth11(year: number): number {
  const off = jdFromDate(31, 12, year) - 2415021;
  const k = Math.floor(off / 29.530588853);
  let nm = newMoon(k);
  if (sunLongitudeSector(nm) >= 9) nm = newMoon(k - 1);
  return nm;
}

/** Index offset of the leap month within the cycle starting at a11. */
function getLeapMonthOffset(a11: number): number {
  const k = Math.round((a11 - 2415021.076998695) / 29.530588853);
  let i = 1;
  let arc = sunLongitudeSector(newMoon(k + i));
  let last: number;
  do {
    last = arc;
    i++;
    arc = sunLongitudeSector(newMoon(k + i));
  } while (arc !== last && i < 14);
  return i - 1;
}

export interface LunarDate {
  lunarDay: number;
  lunarMonth: number;
  lunarYear: number;
  isLeapMonth: boolean;
}

export interface GregorianDate {
  day: number;
  month: number;
  year: number;
}

export function gregorianToLunar(day: number, month: number, year: number): LunarDate {
  const dayNumber = jdFromDate(day, month, year);
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = newMoon(k + 1);
  if (monthStart > dayNumber) monthStart = newMoon(k);

  const a11 = getLunarMonth11(year);
  const b11 = getLunarMonth11(year + 1);
  const lunarDay = dayNumber - monthStart + 1;
  const diff = Math.round((monthStart - a11) / 29.0);
  let isLeapMonth = false;
  let lunarMonth = diff + 11;

  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) isLeapMonth = true;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  const lunarYear = lunarMonth >= 11 && diff < 4 ? year - 1 : year;
  return { lunarDay, lunarMonth, lunarYear, isLeapMonth };
}

/** Returns null for invalid combinations (e.g. leap month in non-leap year). */
export function lunarToGregorian(
  lunarDay: number,
  lunarMonth: number,
  lunarYear: number,
  isLeapMonth: boolean
): GregorianDate | null {
  if (lunarDay < 1 || lunarDay > 30 || lunarMonth < 1 || lunarMonth > 12) return null;
  let a11: number, b11: number;
  if (lunarMonth < 11) {
    a11 = getLunarMonth11(lunarYear - 1);
    b11 = getLunarMonth11(lunarYear);
  } else {
    a11 = getLunarMonth11(lunarYear);
    b11 = getLunarMonth11(lunarYear + 1);
  }
  const k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let off = lunarMonth - 11;
  if (off < 0) off += 12;

  if (b11 - a11 > 365) {
    const leapOff = getLeapMonthOffset(a11);
    let leapMonth = leapOff - 2;
    if (leapMonth < 0) leapMonth += 12;
    if (isLeapMonth && lunarMonth !== leapMonth) return null;
    if (isLeapMonth || off >= leapOff) off += 1;
  } else if (isLeapMonth) {
    return null; // no leap month this year
  }

  const monthStart = newMoon(k + off);
  return jdToDate(monthStart + lunarDay - 1);
}

export const LUNAR_MONTH_NAMES = [
  "Tháng 1 (Giêng)", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12 (Chạp)",
];

export const GREGORIAN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
