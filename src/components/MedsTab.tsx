import React from 'react';
import { Plus, Edit3, Trash2, Pill, Droplet, Thermometer, Activity } from 'lucide-react';
import { Medication } from '../types';
import { colorMap } from '../utils';

interface MedsTabProps {
  meds: Medication[];
  onOpenAddModal: () => void;
  onEditMed: (med: Medication) => void;
  onDeleteMed: (id: string) => void;
}

export default function MedsTab({ meds, onOpenAddModal, onEditMed, onDeleteMed }: MedsTabProps) {
  const renderMedIcon = (icon: string, className = "w-5 h-5") => {
    switch (icon) {
      case 'droplet': return <Droplet className={className} />;
      case 'thermometer': return <Thermometer className={className} />;
      case 'activity': return <Activity className={className} />;
      default: return <Pill className={className} />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Title & Add button */}
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-slate-800 text-lg">登録中のお薬と残量</h2>
        <button
          onClick={onOpenAddModal}
          className="flex items-center space-x-1 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white text-xs font-bold py-2 px-3.5 rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>追加する</span>
        </button>
      </div>

      {/* Medication List */}
      {meds.length === 0 ? (
        <div className="py-12 text-center space-y-3 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <div className="inline-flex p-4 bg-slate-100 rounded-full text-slate-400">
            <Activity className="w-10 h-10" />
          </div>
          <p className="text-slate-500 font-medium text-sm">登録されているお薬はありません</p>
          <p className="text-xs text-slate-400">右上の「追加する」ボタンから登録してください。</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meds.map((med) => {
            const colors = colorMap[med.color] || colorMap.blue;
            const timingsLabel = med.timing.map(t => {
              if (t === 'morning') return '🌅朝';
              if (t === 'lunch') return '☀️昼';
              if (t === 'dinner') return '🌙夕';
              if (t === 'bedtime') return '💤寝る前';
              return '';
            }).join(', ');

            const lowStockThreshold = med.dosageQty * 5;
            const isLowStock = med.stock <= lowStockThreshold;

            return (
              <div
                key={med.id}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-blue-100 transition duration-200"
              >
                {/* Details */}
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.bg} ${colors.text}`}>
                    {renderMedIcon(med.icon)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm leading-snug">{med.name}</h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      1回あたり: {med.dosageQty}{med.dosageUnit}
                    </p>
                    {med.memo && (
                      <p className="text-[11px] text-slate-400 font-normal max-w-[180px] truncate mt-0.5">
                        {med.memo}
                      </p>
                    )}
                    <div className="flex items-center space-x-1.5 mt-2">
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                        {timingsLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stock & Actions */}
                <div className="flex items-center space-x-3">
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[10px] text-slate-400 font-bold mb-0.5">現在の在庫</span>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-xl font-semibold border ${
                        isLowStock
                          ? 'text-rose-600 bg-rose-50 border-rose-100 animate-pulse'
                          : 'text-slate-600 bg-slate-50 border-slate-100'
                      }`}
                    >
                      {med.stock} {med.dosageUnit}
                      {isLowStock && <span className="block text-[8px] text-rose-500 font-bold">残りわずか</span>}
                    </span>
                  </div>
                  
                  {/* Edit/Delete controls */}
                  <div className="flex flex-col border-l border-slate-100 pl-2 space-y-1">
                    <button
                      onClick={() => onEditMed(med)}
                      className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-blue-500 rounded-lg transition"
                      title="編集"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteMed(med.id)}
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                      title="削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
