/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Achievement } from '../types/game';
import { Trophy, X, CheckCircle2, Lock, Play, RotateCcw, Check } from 'lucide-react';

interface AchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: Achievement[];
  onResetAchievements?: () => void;
}

export const AchievementModal: React.FC<AchievementModalProps> = ({
  isOpen,
  onClose,
  achievements,
  onResetAchievements,
}) => {
  const [confirmingReset, setConfirmingReset] = useState<boolean>(false);

  // Close on Escape key or reset confirmation state
  useEffect(() => {
    if (!isOpen) {
      setConfirmingReset(false);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const progressPct = Math.round((unlockedCount / achievements.length) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-neutral-900 border-2 border-neutral-700 rounded-xl p-6 shadow-2xl flex flex-col gap-4 text-neutral-100 font-mono max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-amber-400 pointer-events-none" />
            <h2 className="text-lg font-bold text-white">Achievements</h2>
            <span className="text-xs bg-neutral-800 px-2 py-0.5 rounded text-amber-300 font-semibold border border-neutral-700">
              {unlockedCount} / {achievements.length} ({progressPct}%)
            </span>
          </div>
          <button
            type="button"
            aria-label="Close achievements modal"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer border border-transparent hover:border-neutral-700"
          >
            <X className="w-5 h-5 pointer-events-none" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-500 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* List of achievements (Hidden details for locked achievements) */}
        <div className="overflow-y-auto pr-1 flex flex-col gap-2.5 max-h-[60vh]">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-3 rounded-lg border flex items-start gap-3 transition-colors ${
                ach.unlocked
                  ? 'bg-neutral-800/80 border-amber-500/40'
                  : 'bg-neutral-950/60 border-neutral-800 opacity-60'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 ${
                  ach.unlocked
                    ? 'bg-amber-400/10 border border-amber-400/30'
                    : 'bg-neutral-800 border border-neutral-700 text-neutral-500'
                }`}
              >
                {ach.unlocked ? ach.icon : <Lock className="w-4 h-4 text-neutral-500 pointer-events-none" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3
                    className={`text-sm font-bold truncate ${
                      ach.unlocked ? 'text-amber-200' : 'text-neutral-400'
                    }`}
                  >
                    {ach.unlocked ? ach.title : '??? (Hidden Achievement)'}
                  </h3>
                  {ach.unlocked && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800 shrink-0">
                      <CheckCircle2 className="w-3 h-3 pointer-events-none" />
                      {ach.unlockedAt || 'Unlocked'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mt-1 leading-snug">
                  {ach.unlocked ? ach.description : 'Hidden achievement. Play to discover the conditions.'}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-neutral-800 flex items-center justify-between gap-3">
          {onResetAchievements ? (
            confirmingReset ? (
              <div className="flex items-center gap-1.5 animate-fade-in">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onResetAchievements();
                    setConfirmingReset(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-md"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm Reset?</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setConfirmingReset(false);
                  }}
                  className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setConfirmingReset(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-red-950/60 text-neutral-400 hover:text-red-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-neutral-700 hover:border-red-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All</span>
              </button>
            )
          ) : <div />}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-lg shadow-emerald-950/50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Resume Game</span>
          </button>
        </div>
      </div>
    </div>
  );
};
