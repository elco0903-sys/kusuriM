export type TimingType = 'morning' | 'lunch' | 'dinner' | 'bedtime';

export type MedIconType = 'pill' | 'droplet' | 'thermometer' | 'activity';

export type MedColorType = 'blue' | 'emerald' | 'rose' | 'amber' | 'purple';

export interface Medication {
  id: string;
  name: string;
  dosageQty: number;
  dosageUnit: string;
  stock: number;
  timing: TimingType[];
  icon: MedIconType;
  color: MedColorType;
  memo: string;
}

export interface IntakeLog {
  [date: string]: {
    [uniqueKey: string]: boolean; // uniqueKey: `${medId}_${timing}`
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'loading' | 'error';
  text: string;
}
