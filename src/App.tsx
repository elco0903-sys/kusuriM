import React, { useState, useEffect } from 'react';
import { Calendar, Pill, TrendingUp, Sparkles, ChevronLeft, ChevronRight, CheckCircle, Trash2, Info, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Medication, IntakeLog, TimingType } from './types';
import { initialMeds, initialIntakeLog, getFormattedDate, formatDisplayDate } from './utils';

// Import subcomponents
import TodayTab from './components/TodayTab';
import MedsTab from './components/MedsTab';
import HistoryTab from './components/HistoryTab';
import AssistantTab from './components/AssistantTab';
import MedModal from './components/MedModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'meds' | 'history' | 'assistant'>('today');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [meds, setMeds] = useState<Medication[]>([]);
  const [intakeLog, setIntakeLog] = useState<IntakeLog>({});
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  
  // Custom dialog confirmation states
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load state from LocalStorage on mount
  useEffect(() => {
    const storedMeds = localStorage.getItem('om_meds');
    const storedLog = localStorage.getItem('om_intake_log');
    
    if (storedMeds) {
      setMeds(JSON.parse(storedMeds));
    } else {
      setMeds(initialMeds);
      localStorage.setItem('om_meds', JSON.stringify(initialMeds));
    }

    if (storedLog) {
      setIntakeLog(JSON.parse(storedLog));
    } else {
      setIntakeLog(initialIntakeLog);
      localStorage.setItem('om_intake_log', JSON.stringify(initialIntakeLog));
    }
  }, []);

  // Save to LocalStorage whenever meds or intakeLog changes
  const saveMeds = (newMeds: Medication[]) => {
    setMeds(newMeds);
    localStorage.setItem('om_meds', JSON.stringify(newMeds));
  };

  const saveIntakeLog = (newLog: IntakeLog) => {
    setIntakeLog(newLog);
    localStorage.setItem('om_intake_log', JSON.stringify(newLog));
  };

  // Toast Helper
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 3000);
  };

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const isSelectedDateToday = () => {
    const todayStr = getFormattedDate(new Date());
    const selectedStr = getFormattedDate(selectedDate);
    return todayStr === selectedStr;
  };

  const handleToggleIntake = (medId: string, timing: TimingType) => {
    const dateStr = getFormattedDate(selectedDate);
    const uniqueKey = `${medId}_${timing}`;
    const isCurrentlyTaken = intakeLog[dateStr]?.[uniqueKey] || false;

    // 1. Calculate and update stock for this medication
    const updatedMeds = meds.map((med) => {
      if (med.id === medId) {
        let newStock = med.stock;
        if (!isCurrentlyTaken) {
          // Intake checked: decrement stock (never less than zero)
          newStock = Math.max(0, med.stock - med.dosageQty);
        } else {
          // Intake unchecked: restore stock
          newStock = med.stock + med.dosageQty;
        }
        return { ...med, stock: newStock };
      }
      return med;
    });

    // 2. Update Intake log state
    const newLog = {
      ...intakeLog,
      [dateStr]: {
        ...(intakeLog[dateStr] || {}),
        [uniqueKey]: !isCurrentlyTaken,
      },
    };

    saveMeds(updatedMeds);
    saveIntakeLog(newLog);

    // 3. Evaluation for Daily Accomplishment celebration
    let totalScheduledToday = 0;
    let completedScheduledToday = 0;

    const timings: TimingType[] = ['morning', 'lunch', 'dinner', 'bedtime'];
    timings.forEach((t) => {
      const dailyMeds = updatedMeds.filter((m) => m.timing.includes(t));
      totalScheduledToday += dailyMeds.length;
      dailyMeds.forEach((m) => {
        const key = `${m.id}_${t}`;
        if (newLog[dateStr]?.[key]) {
          completedScheduledToday++;
        }
      });
    });

    if (!isCurrentlyTaken && totalScheduledToday > 0 && completedScheduledToday === totalScheduledToday) {
      confetti({
        particleCount: 100,
        spread: 75,
        origin: { y: 0.8 },
      });
      showToast("今日のすべてのお薬の服用を記録しました！お疲れ様です！🎉");
    } else {
      const targetMed = meds.find((m) => m.id === medId);
      if (targetMed) {
        const dosageMsg = !isCurrentlyTaken
          ? `服用を記録しました（残量を${targetMed.dosageQty}${targetMed.dosageUnit}減らしました）`
          : `服用の記録を取り消しました（残量を${targetMed.dosageQty}${targetMed.dosageUnit}増やしました）`;
        showToast(dosageMsg);
      }
    }
  };

  // Medication Create or Edit Save Action
  const handleSaveMed = (medForm: Omit<Medication, 'id'> & { id?: string }) => {
    if (medForm.id) {
      // Edit mode
      const updatedMeds = meds.map((m) => (m.id === medForm.id ? (medForm as Medication) : m));
      saveMeds(updatedMeds);
      showToast("お薬の情報を更新しました");
    } else {
      // Add mode
      const newMed: Medication = {
        ...medForm,
        id: 'med-' + Date.now(),
      } as Medication;
      saveMeds([...meds, newMed]);
      showToast("新しいお薬を登録しました！");
    }
    setIsModalOpen(false);
    setEditingMed(null);
  };

  const handleEditMed = (med: Medication) => {
    setEditingMed(med);
    setIsModalOpen(true);
  };

  const handleDeleteMedClick = (id: string) => {
    setDeleteTargetId(id);
  };

  const executeDeleteMed = () => {
    if (!deleteTargetId) return;
    const updatedMeds = meds.filter((m) => m.id !== deleteTargetId);
    saveMeds(updatedMeds);
    setDeleteTargetId(null);
    showToast("お薬を削除しました");
  };

  // Helper to calculate total count display for header progress badge
  const getHeaderProgressText = () => {
    const dateStr = getFormattedDate(selectedDate);
    let totalScheduled = 0;
    let completedScheduled = 0;

    const timings: TimingType[] = ['morning', 'lunch', 'dinner', 'bedtime'];
    timings.forEach((t) => {
      const dailyMeds = meds.filter((m) => m.timing.includes(t));
      totalScheduled += dailyMeds.length;
      dailyMeds.forEach((m) => {
        if (intakeLog[dateStr]?.[`${m.id}_${t}`]) {
          completedScheduled++;
        }
      });
    });

    return `${completedScheduled}/${totalScheduled}`;
  };

  const deleteTargetMedName = meds.find((m) => m.id === deleteTargetId)?.name || 'お薬';

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen md:min-h-0 flex flex-col md:py-6">
      {/* Device frame container for desktop view / clean full-viewport for mobile */}
      <div className="w-full max-w-md mx-auto bg-white h-[100dvh] md:h-[840px] md:rounded-3xl md:shadow-2xl md:border md:border-slate-100 flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-5 pt-6 pb-5 shadow-sm rounded-b-3xl shrink-0">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                <Pill className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">お薬メモリー</h1>
                <p className="text-[10px] text-blue-100 font-medium">服薬管理と自動残量アシスト</p>
              </div>
            </div>
            
            <div className="bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md text-[11px] font-bold flex items-center space-x-1">
              <span>{getHeaderProgressText()}</span>
              <CheckCircle className="w-3.5 h-3.5 text-teal-200" />
            </div>
          </div>

          {/* Date Picker row */}
          <div className="mt-4 flex items-center justify-between bg-white/10 rounded-2xl p-2.5 backdrop-blur-sm">
            <button
              onClick={() => handleDateChange(-1)}
              className="p-1.5 hover:bg-white/15 rounded-lg transition active:scale-95 text-white"
              aria-label="前日"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <span className="font-bold text-xs tracking-wide">
                {formatDisplayDate(selectedDate)}
              </span>
              {isSelectedDateToday() && (
                <span className="ml-1.5 text-[9px] bg-white text-blue-600 px-1.5 py-0.5 rounded-full font-bold">
                  今日
                </span>
              )}
            </div>
            <button
              onClick={() => handleDateChange(1)}
              className="p-1.5 hover:bg-white/15 rounded-lg transition active:scale-95 text-white"
              aria-label="翌日"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Tab content space */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'today' && (
            <TodayTab
              meds={meds}
              intakeLog={intakeLog}
              selectedDate={selectedDate}
              onToggleIntake={handleToggleIntake}
              onSwitchTab={setActiveTab}
            />
          )}

          {activeTab === 'meds' && (
            <MedsTab
              meds={meds}
              onOpenAddModal={() => {
                setEditingMed(null);
                setIsModalOpen(true);
              }}
              onEditMed={handleEditMed}
              onDeleteMed={handleDeleteMedClick}
            />
          )}

          {activeTab === 'history' && (
            <HistoryTab
              meds={meds}
              intakeLog={intakeLog}
              selectedDate={selectedDate}
              onSelectDate={(date) => {
                setSelectedDate(date);
              }}
              onSwitchTab={setActiveTab}
            />
          )}

          {activeTab === 'assistant' && (
            <AssistantTab meds={meds} intakeLog={intakeLog} />
          )}
        </main>

        {/* Custom Toast Notification */}
        {toastMessage && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-2.5 px-4 rounded-xl shadow-lg flex items-center space-x-2 z-40 animate-bounce">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Add/Edit Medication Modal */}
        <MedModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingMed(null);
          }}
          onSave={handleSaveMed}
          editingMed={editingMed}
        />

        {/* Delete Confirmation Modal (custom dialog overlay) */}
        {deleteTargetId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 flex flex-col animate-[fadeIn_0.2s_ease-out]">
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-800 text-base">お薬の削除</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    「<span className="font-bold text-slate-700">{deleteTargetMedName}</span>」を本当に削除してよろしいですか？
                  </p>
                  <p className="text-[10px] text-slate-400">
                    ※カレンダー上のこれまでの服薬履歴はそのまま保持されます。
                  </p>
                </div>
              </div>
              <div className="px-5 py-4 border-t border-slate-50 bg-slate-50 flex space-x-3">
                <button
                  onClick={() => setDeleteTargetId(null)}
                  className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-2.5 rounded-xl text-sm transition"
                >
                  キャンセル
                </button>
                <button
                  onClick={executeDeleteMed}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 rounded-xl text-sm shadow-sm transition"
                >
                  削除する
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation rail */}
        <nav className="bg-white border-t border-slate-100 flex justify-around py-3 px-2 text-slate-400 font-medium shrink-0 shadow-lg rounded-t-2xl z-20">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex flex-col items-center space-y-1 transition active:scale-95 ${
              activeTab === 'today' ? 'text-blue-500 font-bold' : 'hover:text-slate-700'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px]">今日</span>
          </button>
          <button
            onClick={() => setActiveTab('meds')}
            className={`flex flex-col items-center space-y-1 transition active:scale-95 ${
              activeTab === 'meds' ? 'text-blue-500 font-bold' : 'hover:text-slate-700'
            }`}
          >
            <Pill className="w-5 h-5" />
            <span className="text-[10px]">お薬箱</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center space-y-1 transition active:scale-95 ${
              activeTab === 'history' ? 'text-blue-500 font-bold' : 'hover:text-slate-700'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-[10px]">きろく</span>
          </button>
          <button
            onClick={() => setActiveTab('assistant')}
            className={`flex flex-col items-center space-y-1 transition active:scale-95 ${
              activeTab === 'assistant' ? 'text-blue-500 font-bold' : 'hover:text-slate-700'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px]">アシスタント</span>
          </button>
        </nav>

      </div>
    </div>
  );
}
