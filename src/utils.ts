import { Medication, IntakeLog } from './types';

export const timingMap = {
  morning: { label: "🌅 朝食前後", icon: "sun" },
  lunch: { label: "☀️ 昼食前後", icon: "sun-dim" },
  dinner: { label: "🌙 夕食前後", icon: "moon" },
  bedtime: { label: "💤 寝る前", icon: "sparkles" }
} as const;

export const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    text: 'text-blue-600',
    accent: 'bg-blue-100 text-blue-800',
    bgLight: 'bg-blue-50 text-blue-600 border-blue-100',
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    badge: 'bg-blue-100 text-blue-700'
  },
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    text: 'text-emerald-600',
    accent: 'bg-emerald-100 text-emerald-800',
    bgLight: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    primary: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    badge: 'bg-emerald-100 text-emerald-700'
  },
  rose: {
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    text: 'text-rose-600',
    accent: 'bg-rose-100 text-rose-800',
    bgLight: 'bg-rose-50 text-rose-600 border-rose-100',
    primary: 'bg-rose-500 hover:bg-rose-600 text-white',
    badge: 'bg-rose-100 text-rose-700'
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    text: 'text-amber-600',
    accent: 'bg-amber-100 text-amber-800',
    bgLight: 'bg-amber-50 text-amber-600 border-amber-100',
    primary: 'bg-amber-500 hover:bg-amber-600 text-white',
    badge: 'bg-amber-100 text-amber-700'
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    text: 'text-purple-600',
    accent: 'bg-purple-100 text-purple-800',
    bgLight: 'bg-purple-50 text-purple-600 border-purple-100',
    primary: 'bg-purple-500 hover:bg-purple-600 text-white',
    badge: 'bg-purple-100 text-purple-700'
  }
} as const;

export function getFormattedDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDisplayDate(date: Date): string {
  const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const dateVal = date.getDate();
  const dayName = daysOfWeek[date.getDay()];
  return `${year}年 ${month}月 ${dateVal}日 (${dayName})`;
}

export const initialMeds: Medication[] = [
  {
    id: "sample-1",
    name: "ビタミンCサプリ",
    dosageQty: 1,
    dosageUnit: "錠",
    stock: 30,
    timing: ["morning", "dinner"],
    icon: "pill",
    color: "emerald",
    memo: "朝食後・夕食後にぬるま湯で飲んでください。"
  },
  {
    id: "sample-2",
    name: "睡眠導入サプリ",
    dosageQty: 2,
    dosageUnit: "カプセル",
    stock: 12,
    timing: ["bedtime"],
    icon: "pill",
    color: "purple",
    memo: "寝る30分前くらいが目安です。"
  }
];

export const initialIntakeLog: IntakeLog = {
  // Yesterday completion log for demo purposes
  [getFormattedDate(new Date(Date.now() - 86400000))]: {
    "sample-1_morning": true,
    "sample-1_dinner": true,
    "sample-2_bedtime": true
  }
};
