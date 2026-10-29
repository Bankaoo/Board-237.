/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { HelpCircle, X, Footprints, Zap, Eye, AlertOctagon } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
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
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-400 pointer-events-none" />
            <h2 className="text-lg font-bold text-white">How to Play: BOARD 237.</h2>
          </div>
          <button
            type="button"
            aria-label="Close help modal"
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

        {/* Content */}
        <div className="overflow-y-auto pr-1 flex flex-col gap-3 text-xs leading-relaxed max-h-[60vh] text-neutral-300">
          <div className="bg-neutral-950/70 p-3 rounded-lg border border-neutral-800">
            <h3 className="text-white font-bold mb-1 flex items-center gap-2">
              <Footprints className="w-4 h-4 text-amber-400" />
              The Objective
            </h3>
            <p>
              Wait along the sidewalk and make your way to the boarding shelter. Board the correct Bus 237 while its doors are open before it departs.
            </p>
          </div>

          <div className="bg-neutral-950/70 p-3 rounded-lg border border-neutral-800">
            <h3 className="text-white font-bold mb-1 flex items-center gap-2">
              <Zap className="w-4 h-4 text-sky-400" />
              Sprint & Stamina
            </h3>
            <ul className="list-disc list-inside space-y-1 text-neutral-300">
              <li>
                <strong className="text-white">Walk (W / ↑):</strong> Steady pace forward.
              </li>
              <li>
                <strong className="text-white">Sprint (Shift):</strong> Quick burst of speed.
              </li>
              <li>
                <strong className="text-white">Fatigue:</strong> Ending a sprint triggers brief fatigue
                where speed drops.
              </li>
              <li>
                <strong className="text-white">Super-Fatigue:</strong> Sprints done 3 times in a row cause
                exhaustion.
              </li>
            </ul>
          </div>

          <div className="bg-neutral-950/70 p-3 rounded-lg border border-neutral-800">
            <h3 className="text-white font-bold mb-1 flex items-center gap-2">
              <Eye className="w-4 h-4 text-red-400" />
              Check Behind (Space)
            </h3>
            <p>
              Buses approach from behind. Pressing <strong className="text-white">Space</strong> halts
              you for 1 second to inspect approaching vehicles and glowing destination signs. Watch out
              for Mrs. Higgins walking behind you!
            </p>
          </div>

          <div className="bg-neutral-950/70 p-3 rounded-lg border border-neutral-800">
            <h3 className="text-white font-bold mb-1 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-emerald-400" />
              Decoy Buses
            </h3>
            <p>
              Decoy buses have the same green transit paint as Bus 237. Check the digital sign (e.g. 273
              or 23) before boarding! Press <strong className="text-white">E / Enter</strong> or walk
              into the open doors to board.
            </p>
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
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-neutral-950 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
