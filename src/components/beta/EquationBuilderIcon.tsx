'use client';

import { CalculatorIcon } from '@heroicons/react/24/outline';

interface EquationBuilderIconProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function EquationBuilderIcon({ onClick, disabled }: EquationBuilderIconProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Open equation builder"
    >
      <CalculatorIcon className="w-4 h-4" />
    </button>
  );
}