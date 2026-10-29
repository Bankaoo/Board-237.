/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  isMuted: boolean;
  volume: number;
  onToggleMute: () => void;
  onVolumeChange: (vol: number) => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onRestart,
  isMuted,
  volume,
  onToggleMute,
  onVolumeChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-neutral-900 border-2 border-neutral-700 rounded-xl p-6 shadow-2xl flex flex-col gap-5 text-neutral-100 font-mono">
        <div className="text-center">
          <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">
            Game Paused
          </span>
          <h2 className="text-2xl font-bold text-white mt-1">BOARD 237.</h2>
        </div>

        {/* Sound Controls */}
        <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleMute}
              className="p-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <span className="text-neutral-300">Volume</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-24 h-1.5 accent-emerald-500 bg-neutral-800 rounded cursor-pointer"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold py-2.5 px-4 rounded-lg transition-colors cursor-pointer text-sm"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume (Esc)</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-semibold py-2 px-4 rounded-lg transition-colors cursor-pointer text-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Run</span>
          </button>
        </div>
      </div>
    </div>
  );
};
