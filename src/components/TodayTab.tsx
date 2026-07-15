import React from 'react';
import { Pill, Droplet, Thermometer, Activity, Check, Circle, FolderOpen } from 'lucide-react';
import { Medication, TimingType, IntakeLog } from '../types';
import { timingMap, colorMap, getFormattedDate } from '../utils';

interface TodayTabProps {
  meds: Medication[];
  intakeLog: IntakeLog;
  selectedDate: Date;
  onToggleIntake: (medId: string, timing: TimingType) => void;
  onSwitchTab: (tab: 'today' | 'meds' | 'history' | 'assistant') => void;
}

export default function TodayTab({
  meds,
  intakeLog,
  selectedDate,
  onToggleIntake,
  onSwitchTab
}: TodayTabProps) {
  const dateStr = getFormattedDate(selectedDate);
  const renderMedIcon = (icon: string, className = "w-5 h-5") => {
    switch (icon) {
      case 'droplet': return <Droplet className={className} />;
      case 'thermometer': return <Thermometer className={className} />;
      case 'activity': return <Activity className={className} />;
      default: return <Pill className={className} />;
    }
  };

  // Calculate schedule and taken count for the selected day
  let totalTasks = 0;
  let completedTasks = 0;

  const timings: TimingType[] = ['morning', 'lunch', 'dinner', 'bedtime'];
  timings.forEach(t => {
    const dailyMeds = meds.filter(m => m.timing.includes(t));
    totalTasks += dailyMeds.length;
    dailyMeds.forEach(m => {
      const uniqueKey = `${m.id}_${t}`;
      if (intakeLog[dateStr]?.[uniqueKey]) {
        completedTasks++;
      }
    });
  });

  const percentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // Circular progress ring parameters
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Motivation sub-text based on progress
  let subText = "健やかさのために、毎日継続しましょう。";
  if (totalTasks === 0) {
    subText = "今日飲むお薬はありません。お元気でお過ごしください！😊";
  } else if (percentage === 100) {
    subText = "素晴らしい！今日のお薬はすべて飲み終えました！🏆🎉";
  } else if (percentage >= 50) {
    subText = "良いペースです！残りのお薬も忘れずに。✨";
  } else if (completedTasks > 0) {
    subText = "その調子です！一歩ずつ進みましょう。👍";
  }

  return (
    <div className="space-y-4">
      {/* Progress ring card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-4 flex items-center justify-between shadow-sm">
        <div className="space-y-1 max-w-[70%]">
          <h3 className="font-bold text-slate-800 text-sm">今日の服薬進捗</h3>
          <p className="text-xs text-slate-500 leading-relaxed">{subText}</p>
        </div>
        <div className="relative flex items-center justify-center w-16 h-16 shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r={radius}
              stroke="currentColor"
              className="text-slate-200"
              strokeWidth="4.5"
              fill="transparent"
            />
            <circle
              cx="32"
              cy="32"
              r={radius}
              stroke="currentColor"
              className="text-blue-500 transition-all duration-500"
              strokeWidth="4.5"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <span className="absolute text-xs font-extrabold text-slate-700">{percentage}%</span>
        </div>
      </div>

      {/* Timing Schedule Lists */}
      {totalTasks === 0 ? (
        <div className="py-12 text-center space-y-3 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <div className="inline-flex p-4 bg-slate-100 rounded-full text-slate-400">
            <FolderOpen className="w-10 h-10" />
          </div>
          <p className="text-slate-500 font-medium text-sm">今日飲むお薬は登録されていません</p>
          <button
            onClick={() => onSwitchTab('meds')}
            className="text-xs bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 px-5 rounded-xl shadow-sm transition active:scale-95"
          >
            お薬を追加する
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {timings.map(tKey => {
            const timingMeds = meds.filter(m => m.timing.includes(tKey));
            if (timingMeds.length === 0) return null;

            const info = timingMap[tKey];

            return (
              <div key={tKey} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-400 tracking-wider">
                    {info.label}
                  </span>
                  <div className="h-[1px] bg-slate-150 flex-1"></div>
                </div>

                <div className="space-y-2.5">
                  {timingMeds.map(med => {
                    const uniqueKey = `${med.id}_${tKey}`;
                    const isTaken = intakeLog[dateStr]?.[uniqueKey] || false;
                    const colors = colorMap[med.color] || colorMap.blue;

                    const lowStockThreshold = med.dosageQty * 5;
                    const isLowStock = med.stock <= lowStockThreshold;

                    return (
                      <div
                        key={uniqueKey}
                        className={`p-3.5 rounded-2xl border transition duration-300 flex items-center justify-between ${
                          isTaken
                            ? 'bg-slate-50/70 border-slate-200 opacity-70'
                            : 'bg-white border-slate-100 shadow-sm hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-start space-x-3.5 max-w-[75%]">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              isTaken ? 'bg-slate-200 text-slate-400' : `${colors.bg} ${colors.text}`
                            }`}
                          >
                            {renderMedIcon(med.icon)}
                          </div>
                          <div className="space-y-0.5 overflow-hidden">
                            <div className="flex items-center space-x-2">
                              <h4
                                className={`font-bold text-sm truncate ${
                                  isTaken ? 'line-through text-slate-400' : 'text-slate-800'
                                }`}
                              >
                                {med.name}
                              </h4>
                              {!isTaken && (
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${
                                    isLowStock
                                      ? 'bg-rose-100 text-rose-600 animate-pulse'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  残り: {med.stock} {med.dosageUnit}
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-[11px] font-medium leading-relaxed truncate ${
                                isTaken ? 'text-slate-400' : 'text-slate-500'
                              }`}
                            >
                              1回量: {med.dosageQty} {med.dosageUnit} {med.memo && ` / ${med.memo}`}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => onToggleIntake(med.id, tKey)}
                          className="focus:outline-none transition active:scale-90"
                          aria-label={isTaken ? '服用を取り消す' : '服用を記録する'}
                        >
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                              isTaken
                                ? 'bg-teal-500 text-white shadow-sm shadow-teal-100'
                                : 'border-2 border-slate-200 hover:border-slate-300 bg-white text-slate-200'
                            }`}
                          >
                            {isTaken ? <Check className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
