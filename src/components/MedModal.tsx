import React, { useState, useEffect } from 'react';
import { X, Plus, Edit3, Minus } from 'lucide-react';
import { Medication, TimingType, MedIconType, MedColorType } from '../types';

interface MedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (med: Omit<Medication, 'id'> & { id?: string }) => void;
  editingMed: Medication | null;
}

export default function MedModal({ isOpen, onClose, onSave, editingMed }: MedModalProps) {
  const [name, setName] = useState('');
  const [dosageQty, setDosageQty] = useState(1);
  const [dosageUnit, setDosageUnit] = useState('錠');
  const [stock, setStock] = useState(30);
  const [timing, setTiming] = useState<TimingType[]>([]);
  const [icon, setIcon] = useState<MedIconType>('pill');
  const [color, setColor] = useState<MedColorType>('blue');
  const [memo, setMemo] = useState('');

  // Edit target changes
  useEffect(() => {
    if (editingMed) {
      setName(editingMed.name);
      setDosageQty(editingMed.dosageQty);
      setDosageUnit(editingMed.dosageUnit);
      setStock(editingMed.stock);
      setTiming(editingMed.timing);
      setIcon(editingMed.icon);
      setColor(editingMed.color);
      setMemo(editingMed.memo);
    } else {
      // Reset form
      setName('');
      setDosageQty(1);
      setDosageUnit('錠');
      setStock(14);
      setTiming([]);
      setIcon('pill');
      setColor('blue');
      setMemo('');
    }
  }, [editingMed, isOpen]);

  if (!isOpen) return null;

  const handleTimingToggle = (t: TimingType) => {
    if (timing.includes(t)) {
      setTiming(timing.filter(item => item !== t));
    } else {
      setTiming([...timing, t]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('お薬の名前を入力してください');
      return;
    }
    if (timing.length === 0) {
      alert('飲む時間帯を少なくとも1つ選択してください');
      return;
    }
    onSave({
      id: editingMed?.id,
      name: name.trim(),
      dosageQty,
      dosageUnit: dosageUnit.trim() || '錠',
      stock: Math.max(0, stock),
      timing,
      icon,
      color,
      memo: memo.trim()
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col animate-[fadeIn_0.2s_ease-out]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl sticky top-0 z-10">
          <h3 className="font-bold text-slate-800 text-base flex items-center space-x-1.5">
            {editingMed ? (
              <>
                <Edit3 className="w-5 h-5 text-blue-500" />
                <span>お薬の情報を編集</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 text-blue-500" />
                <span>新しいお薬を追加</span>
              </>
            )}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="p-5 space-y-4 flex-1">
            
            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 block">お薬の名前 *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: ロキソニン"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            {/* Dosage & Unit & Stock Area */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* 1回の量 */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">1回の量 *</label>
                  <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 p-1">
                    <button
                      type="button"
                      onClick={() => setDosageQty(prev => Math.max(0.1, Math.round((prev - 0.5) * 10) / 10))}
                      className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 shadow-sm transition active:scale-95 shrink-0"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      value={dosageQty}
                      onChange={(e) => setDosageQty(Math.max(0.1, parseFloat(e.target.value) || 1))}
                      min="0.1"
                      step="0.1"
                      className="w-full text-center bg-transparent border-0 text-sm focus:outline-none font-bold text-slate-850"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setDosageQty(prev => Math.round((prev + 0.5) * 10) / 10)}
                      className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 shadow-sm transition active:scale-95 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 単位 */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">単位 *</label>
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      {['錠', '包', 'ml', '滴'].map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setDosageUnit(u)}
                          className={`flex-1 py-1 rounded-lg text-[11px] font-bold border transition ${
                            dosageUnit === u
                              ? 'bg-blue-50 border-blue-200 text-blue-600'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={dosageUnit}
                      onChange={(e) => setDosageUnit(e.target.value)}
                      placeholder="その他..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 総在庫数 */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">現在の総在庫数 *</label>
                <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 p-1">
                  <div className="flex space-x-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setStock(prev => Math.max(0, prev - 10))}
                      className="px-2 h-8 flex items-center justify-center bg-white hover:bg-slate-100 text-slate-500 rounded-lg border border-slate-200 shadow-sm transition active:scale-95 text-[10px] font-bold"
                    >
                      -10
                    </button>
                    <button
                      type="button"
                      onClick={() => setStock(prev => Math.max(0, prev - 1))}
                      className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-100 text-slate-500 rounded-lg border border-slate-200 shadow-sm transition active:scale-95"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                    min="0"
                    className="w-full text-center bg-transparent border-0 text-sm focus:outline-none font-bold text-slate-850"
                    required
                  />

                  <div className="flex space-x-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setStock(prev => prev + 1)}
                      className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-100 text-slate-500 rounded-lg border border-slate-200 shadow-sm transition active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setStock(prev => prev + 10)}
                      className="px-2 h-8 flex items-center justify-center bg-white hover:bg-slate-100 text-slate-500 rounded-lg border border-slate-200 shadow-sm transition active:scale-95 text-[10px] font-bold"
                    >
                      +10
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Timings */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 block">飲む時間帯 (複数選択可) *</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'morning', label: '🌅 朝食前後' },
                  { key: 'lunch', label: '☀️ 昼食前後' },
                  { key: 'dinner', label: '🌙 夕食前後' },
                  { key: 'bedtime', label: '💤 寝る前' }
                ].map((item) => {
                  const isSelected = timing.includes(item.key as TimingType);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleTimingToggle(item.key as TimingType)}
                      className={`flex items-center space-x-2.5 p-2.5 rounded-xl cursor-pointer border text-left transition text-xs font-semibold ${
                        isSelected
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-slate-50 border-transparent text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="w-4 h-4 text-blue-500 rounded border-slate-300 focus:ring-blue-500 pointer-events-none"
                      />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Icon & Color Selector */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">アイコン</label>
                <select
                  value={icon}
                  onChange={(e) => setIcon(e.target.value as MedIconType)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                >
                  <option value="pill">💊 錠剤・カプセル</option>
                  <option value="droplet">💧 液薬・目薬</option>
                  <option value="thermometer">🌡️ 体温/頓服</option>
                  <option value="activity">❤️ 毎日飲む必須薬</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">テーマカラー</label>
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value as MedColorType)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                >
                  <option value="blue">🔵 ブルー</option>
                  <option value="emerald">🟢 グリーン</option>
                  <option value="rose">🔴 レッド</option>
                  <option value="amber">🟡 イエロー</option>
                  <option value="purple">🟣 パープル</option>
                </select>
              </div>
            </div>

            {/* Note */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 block">服用時の注意やメモ</label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="多めの水で飲む、食後30分以内、など"
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              />
            </div>

          </div>

          {/* Action buttons */}
          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex space-x-3 rounded-b-3xl">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-2.5 rounded-xl text-sm transition"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-bold py-2.5 rounded-xl text-sm shadow-sm transition"
            >
              {editingMed ? '保存する' : 'お薬を登録する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
