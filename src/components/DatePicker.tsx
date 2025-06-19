'use client';

import { CalendarIcon } from '@heroicons/react/24/outline';

interface DatePickerProps {
  date: string;
  onDateChange: (date: string) => void;
  label?: string;
  className?: string;
}

export function DatePicker({ date, onDateChange, label = "View data for", className = "" }: DatePickerProps) {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <CalendarIcon className="w-4 h-4 text-gray-500" />
      <label className="text-sm font-medium text-gray-700">
        {label}:
      </label>
      <input
        type="date"
        value={date}
        onChange={(e) => onDateChange(e.target.value)}
        min={thirtyDaysAgo}
        max={today}
        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      />
      {date !== today && (
        <button
          onClick={() => onDateChange(today)}
          className="text-xs text-primary-600 hover:text-primary-800 underline"
        >
          Today
        </button>
      )}
    </div>
  );
}