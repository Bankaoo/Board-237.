/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { GameStats } from '../types/game';
import { BarChart2, X, CheckCircle, AlertTriangle, UserX, Clock } from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: GameStats;
  achievementsUnlocked: number;
  totalAchievements: number;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  achievementsUnlocked,
  totalAchievements,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
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

  const successRate =
    stats.totalAttempts > 0
      ? Math.round((stats.successfulBoardings / stats.totalAttempts) * 100)
      : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-neutral-900 border-2 border-neutral-700 rounded-xl p-6 shadow-2xl flex flex-col gap-4 text-neutral-100 font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <BarChart2 className="w-5 h-5 text-sky-400 pointer-events-none" />
            <h2 className="text-lg font-bold text-white">Records & Stats</h2>
          </div>
          <button
            type="button"
            aria-label="Close stats modal"
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

        {/* Hero Success Rate Card */}
        <div className="bg-neutral-950/80 border border-neutral-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
              Catch Rate
            </span>
            <span className="text-3xl font-extrabold text-emerald-400">{successRate}%</span>
            <span className="text-xs text-neutral-400 block mt-0.5">
              {stats.successfulBoardings} of {stats.totalAttempts} total attempts
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
              Achievements
            </span>
            <span className="text-2xl font-bold text-amber-400">
              {achievementsUnlocked} / {totalAchievements}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-neutral-800/60 p-3 rounded-lg border border-neutral-700/60 flex items-center gap-3">
            <div className="p-2 rounded bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 uppercase block">Boarded Correctly</span>
              <span className="text-base font-bold text-neutral-100">{stats.successfulBoardings}</span>
            </div>
          </div>

          <div className="bg-neutral-800/60 p-3 rounded-lg border border-neutral-700/60 flex items-center gap-3">
            <div className="p-2 rounded bg-red-500/10 text-red-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 uppercase block">Missed Buses</span>
              <span className="text-base font-bold text-neutral-100">{stats.missedBuses}</span>
            </div>
          </div>

          <div className="bg-neutral-800/60 p-3 rounded-lg border border-neutral-700/60 flex items-center gap-3">
            <div className="p-2 rounded bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 uppercase block">Fake Buses Boarded</span>
              <span className="text-base font-bold text-neutral-100">{stats.fakeBusesBoarded}</span>
            </div>
          </div>

          <div className="bg-neutral-800/60 p-3 rounded-lg border border-neutral-700/60 flex items-center gap-3">
            <div className="p-2 rounded bg-purple-500/10 text-purple-400">
              <UserX className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 uppercase block">Pedestrian Collisions</span>
              <span className="text-base font-bold text-neutral-100">{stats.pedestrianCollisions}</span>
            </div>
          </div>

          <div className="bg-neutral-800/60 p-3 rounded-lg border border-neutral-700/60 flex items-center gap-3">
            <div className="p-2 rounded bg-sky-500/10 text-sky-400">
              <span className="text-base leading-none">🧘</span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 uppercase block">Patient Catches (0m)</span>
              <span className="text-base font-bold text-neutral-100">{stats.patientBoardings}</span>
            </div>
          </div>

          <div className="bg-neutral-800/60 p-3 rounded-lg border border-neutral-700/60 flex items-center gap-3">
            <div className="p-2 rounded bg-orange-500/10 text-orange-400">
              <span className="text-base leading-none">🤏</span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 uppercase block">Missed by 1 Step</span>
              <span className="text-base font-bold text-neutral-100">{stats.soCloseCount}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-neutral-800 flex justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-neutral-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
