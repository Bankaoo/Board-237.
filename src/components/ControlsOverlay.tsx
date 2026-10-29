/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, Trophy, BarChart2, HelpCircle, Pause, RotateCcw } from 'lucide-react';

interface ControlsOverlayProps {
  isMuted: boolean;
  volume: number;
  onToggleMute: () => void;
  onVolumeChange: (vol: number) => void;
  onOpenAchievements: () => void;
  onOpenStats: () => void;
  onOpenHelp: () => void;
  onTogglePause: () => void;
  onRestartRun: () => void;
  unlockedAchievementsCount: number;
  totalAchievementsCount: number;
  isPlaying: boolean;
}

export const ControlsOverlay: React.FC<ControlsOverlayProps> = ({
  isMuted,
  volume,
  onToggleMute,
  onVolumeChange,
  onOpenAchievements,
  onOpenStats,
  onOpenHelp,
  onTogglePause,
  onRestartRun,
  unlockedAchievementsCount,
  totalAchievementsCount,
  isPlaying,
}) => {
  return (
    <div className="w-full flex flex-col gap-3">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between bg-neutral-900/90 backdrop-blur-sm border border-neutral-800 px-4 py-2.5 rounded-lg shadow-lg">
        {/* Branding & Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-sm md:text-base font-bold font-mono tracking-wider text-emerald-400">
              BOARD 237.
            </h1>
          </div>
          <span className="hidden sm:inline-block text-xs text-neutral-400 border-l border-neutral-700 pl-3">
            Catch Route 237
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Sound Controls */}
          <div className="flex items-center gap-1.5 bg-neutral-800/80 px-2 py-1 rounded border border-neutral-700">
            <button
              onClick={onToggleMute}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              className="text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-14 sm:w-20 h-1.5 accent-emerald-500 bg-neutral-700 rounded cursor-pointer"
              title="Sound Volume"
            />
          </div>

          {/* Achievements Button */}
          <button
            onClick={onOpenAchievements}
            className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-2.5 py-1 rounded text-xs font-mono text-neutral-200 transition-colors cursor-pointer"
            title="View Achievements"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {unlockedAchievementsCount}/{totalAchievementsCount}
            </span>
          </button>

          {/* Stats Button */}
          <button
            onClick={onOpenStats}
            className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-2.5 py-1 rounded text-xs font-mono text-neutral-200 transition-colors cursor-pointer"
            title="View Records & Statistics"
          >
            <BarChart2 className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Stats</span>
          </button>

          {/* Help Button */}
          <button
            onClick={onOpenHelp}
            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="How to Play"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* In-Game Pause & Quick Restart */}
          {isPlaying && (
            <>
              <button
                onClick={onRestartRun}
                className="p-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title="Restart Run"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={onTogglePause}
                className="p-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title="Pause Game (Esc)"
              >
                <Pause className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Keyboard Controls Bar (Diegetic & Responsive) */}
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono bg-neutral-900/60 border border-neutral-800/80 px-3 py-2 rounded-lg text-neutral-300">
        <div className="flex items-center gap-1.5">
          <kbd className="px-2 py-0.5 bg-neutral-800 border border-neutral-600 rounded text-amber-400 font-bold shadow-sm">
            W / ↑
          </kbd>
          <span>Walk</span>
        </div>
        <span className="text-neutral-600">•</span>
        <div className="flex items-center gap-1.5">
          <kbd className="px-2 py-0.5 bg-neutral-800 border border-neutral-600 rounded text-sky-400 font-bold shadow-sm">
            SHIFT
          </kbd>
          <span>Sprint</span>
        </div>
        <span className="text-neutral-600">•</span>
        <div className="flex items-center gap-1.5">
          <kbd className="px-2 py-0.5 bg-neutral-800 border border-neutral-600 rounded text-red-400 font-bold shadow-sm">
            SPACE
          </kbd>
          <span>Look Behind</span>
        </div>
        <span className="text-neutral-600">•</span>
        <div className="flex items-center gap-1.5">
          <kbd className="px-2 py-0.5 bg-neutral-800 border border-neutral-600 rounded text-emerald-400 font-bold shadow-sm">
            E / ENTER
          </kbd>
          <span>Board Bus</span>
        </div>
        <span className="text-neutral-600">•</span>
        <div className="flex items-center gap-1.5">
          <kbd className="px-2 py-0.5 bg-neutral-800 border border-neutral-600 rounded text-neutral-400 font-bold shadow-sm">
            ESC
          </kbd>
          <span>Pause</span>
        </div>
      </div>
    </div>
  );
};
