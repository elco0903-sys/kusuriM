import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp } from 'lucide-react';
import { Medication, IntakeLog } from '../types';
import { getFormattedDate } from '../utils';

interface HistoryTabProps {
  meds: Medication[];
  intakeLog: IntakeLog;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onSwitchTab: (tab: 'today' | 'meds' | 'history' | 'assistant') => void;
}

export default function HistoryTab({
  meds,
  intakeLog,
  selectedDate,
  onSelectDate,
  onSwitchTab
}: HistoryTabProps) {
  // Calendar specific state (initialized to currently selected month)
  const [calendarYear, setCalendarYear] = useState(selectedDate.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(selectedDate.getMonth());

  const navigateMonth = (direction: number) => {
    let newMonth = calendarMonth + direction;
    let newYear = calendarYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    setCalendarMonth(newMonth);
    setCalendarYear(newYear);
  };

  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

  // Prepare calendar days
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();
  const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysArray.push(null);
  }
  for (let day = 1; day <= totalDays; day++) {
    daysArray.push(day);
  }

  // Calculate statistics
  // 1. Current Streak: Start from today and go backwards.
  // A day counts towards the streak if all scheduled meds on that day were taken.
  // If no meds are scheduled on a day, it doesn't break the streak (skip it).
  let streak = 0;
  const checkDate = new Date();
  let maxBacktrackDays = 60; // limit backtrack to prevent infinite loop

  while (maxBacktrackDays > 0) {
    const checkDateStr = getFormattedDate(checkDate);
    let dayTotal = 0;
    let dayTaken = 0;

    meds.forEach(med => {
      med.timing.forEach(t => {
        dayTotal++;
        if (intakeLog[checkDateStr]?.[`${med.id}_${t}`]) {
          dayTaken++;
        }
      });
    });

    if (dayTotal === 0) {
      // No medication scheduled, doesn't break streak, keep looking backward
      checkDate.setDate(checkDate.getDate() - 1);
      maxBacktrackDays--;
      continue;
    }

    if (dayTaken === dayTotal) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // Partially completed or untouched scheduled day breaks the streak
      break;
    }
    maxBacktrackDays--;
  }

  // 2. Average Monthly Rate (of the currently displayed calendar month)
  let monthlyTotal = 0;
  let monthlyCompleted = 0;

  for (let day = 1; day <= totalDays; day++) {
    const checkDateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    meds.forEach(med => {
      med.timing.forEach(t => {
        monthlyTotal++;
        if (intakeLog[checkDateStr]?.[`${med.id}_${t}`]) {
          monthlyCompleted++;
        }
      });
    });
  }

  const averageMonthlyRate = monthlyTotal === 0 ? 0 : Math.round((monthlyCompleted / monthlyTotal) * 100);

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-slate-800 text-lg">服薬カレンダー</h2>

      {/* Calendar container */}
      <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm space-y-4">
        {/* Navigation */}
        <div className="flex justify-between items-center px-1">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-slate-700 text-sm">
            {calendarYear}年 {monthNames[calendarMonth]}
          </span>
          <button
            onClick={() => navigateMonth(1)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day Header */}
        <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-400 border-b border-slate-50 pb-2">
          <span className="text-rose-400">日</span>
          <span>月</span>
          <span>火</span>
          <span>水</span>
          <span>木</span>
          <span>金</span>
          <span class="text-blue-400">土</span>
        </div>

        {/* Day Grid */}
        <div className="grid grid-cols-7 gap-y-2 text-center text-sm">
          {daysArray.map((day, idx) => {
            if (day === null) {
              return <span key={`empty-${idx}`} className="text-slate-200" />;
            }

            const cellDateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            let cellStatus: 'complete' | 'partial' | 'none' = 'none';
            let dayTotal = 0;
            let dayTaken = 0;

            meds.forEach(med => {
              med.timing.forEach(t => {
                dayTotal++;
                if (intakeLog[cellDateStr]?.[`${med.id}_${t}`]) {
                  dayTaken++;
                }
              });
            });

            if (dayTotal > 0) {
              if (dayTaken === dayTotal) {
                cellStatus = 'complete';
              } else if (dayTaken > 0) {
                cellStatus = 'partial';
              }
            }

            const today = new Date();
            const isToday = today.getDate() === day && today.getMonth() === calendarMonth && today.getFullYear() === calendarYear;

            let bgStyle = "hover:bg-slate-50 text-slate-700";
            if (cellStatus === 'complete') {
              bgStyle = "bg-teal-500 text-white font-bold rounded-full shadow-sm shadow-teal-100";
            } else if (cellStatus === 'partial') {
              bgStyle = "bg-amber-100 text-amber-800 font-bold rounded-full";
            }

            return (
              <button
                key={`day-${day}`}
                onClick={() => {
                  const targetDate = new Date(calendarYear, calendarMonth, day);
                  onSelectDate(targetDate);
                  onSwitchTab('today');
                }}
                className={`w-8 h-8 mx-auto flex items-center justify-center text-xs transition active:scale-90 ${bgStyle} ${
                  isToday ? 'ring-2 ring-blue-500 ring-offset-2 font-bold' : ''
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-4 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100">
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-teal-500 block"></span>
          <span>すべて服用</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-100 border border-amber-200 block"></span>
          <span>一部のみ服用</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-white border border-slate-200 block"></span>
          <span>未服用/予定なし</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-4 text-center">
          <span className="text-xs text-slate-500 font-medium flex items-center justify-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5 text-teal-500" />
            <span>現在の連続服薬</span>
          </span>
          <div className="text-2xl font-black text-teal-600 mt-1">
            {streak}<span className="text-xs font-semibold ml-0.5">日</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-0.5 leading-relaxed">
            毎日欠かさず飲めています！
          </p>
        </div>
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 text-center">
          <span className="text-xs text-slate-500 font-medium flex items-center justify-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>今月の平均達成率</span>
          </span>
          <div className="text-2xl font-black text-indigo-600 mt-1">
            {averageMonthlyRate}<span className="text-xs font-semibold ml-0.5">%</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-0.5 leading-relaxed">
            目標は80%以上です
          </p>
        </div>
      </div>
    </div>
  );
}
