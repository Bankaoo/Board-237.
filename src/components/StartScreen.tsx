/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Play, Trophy, BarChart2, Eye, ShieldAlert, Zap, Clock } from 'lucide-react';

interface StartScreenProps {
  onStart: () => void;
  onOpenAchievements: () => void;
  onOpenStats: () => void;
  unlockedCount: number;
  totalCount: number;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStart,
  onOpenAchievements,
  onOpenStats,
  unlockedCount,
  totalCount,
}) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onStart]);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-mono">
      <div className="w-full max-w-xl bg-neutral-900 border-2 border-neutral-700 rounded-xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 text-neutral-100">
        {/* Title */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs px-3 py-1 rounded-full mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Route 237 Downtown</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wider text-white">
            BOARD 237.
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 mt-2 max-w-md mx-auto leading-relaxed">
            The shelter is down the sidewalk. Catch Bus 237 before it departs.
          </p>
        </div>

        {/* Rules Briefing */}
        <div className="bg-neutral-950/80 border border-neutral-800 rounded-lg p-4 flex flex-col gap-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-neutral-300">
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Time is Ticking</span>
                <span>Reach the boarding area before the bus departs.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Sprint & Fatigue</span>
                <span>Sprinting covers ground fast, but triggers fatigue.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Eye className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Look Behind (Space)</span>
                <span>Check for approaching buses and traffic behind you.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Decoy Buses</span>
                <span>Decoy routes have the same green paint. Check the sign!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={onStart}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-extrabold py-3 px-6 rounded-lg transition-colors cursor-pointer text-sm shadow-xl shadow-emerald-950/60"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>START RUN (Space / Enter)</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onOpenAchievements}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 py-3 px-4 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>
                {unlockedCount}/{totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenStats}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 py-3 px-4 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <BarChart2 className="w-4 h-4 text-sky-400" />
              <span>Stats</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
