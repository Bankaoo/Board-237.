/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MovementState = 
  | 'idle'
  | 'walking'
  | 'sprinting'
  | 'fatigued'
  | 'super_fatigued'
  | 'turning'
  | 'boarding'
  | 'finished';

export type RunOutcome =
  | 'none'
  | 'success_normal'           // Made It! Boarded correct bus at 13m
  | 'success_patient'          // Patience Pays Off! Caught bus without moving (0m)
  | 'fake_bus'                 // Fake Ride! Boarded incorrect route
  | 'so_close'                 // So Close! Missed by <= 1.0 metre
  | 'missed_far'               // Bus left while player was far away
  | 'patient_fail'             // Patience Was a Mistake! Stayed in place, missed bus
  | 'exhausted_wait'           // Out of Breath! 3 sprints, super-fatigued, waited in vain
  | 'pedestrian_collision'     // Wrong Time to Look! Bumped into elderly pedestrian
  | 'time_expired';            // 10s deadline ran out

export interface BusConfig {
  id: string;
  routeNumber: string;         // e.g. "237", "273", "23", "237X"
  routeName: string;           // e.g. "DOWNTOWN", "AIRPORT EXP", "NOT IN SERVICE"
  isCorrect: boolean;
  approachTime: number;        // when bus appears on road (seconds from run start)
  arriveTime: number;          // when bus reaches stop (seconds)
  stopPosition: number;        // 13.0m (normal) or 0.0m (special patient stop)
  doorOpenDuration: number;    // how long doors remain open (e.g. 1.8s)
  departureTime: number;       // arriveTime + doorOpenDuration
  doorOpened: boolean;
  doorClosed: boolean;
  departed: boolean;
  busColor: string;            // hex or css
}

export interface TrafficVehicle {
  id: number;
  type: 'sedan' | 'cab' | 'van' | 'truck';
  color: string;
  speed: number;               // m/s
  position: number;            // m along road (-30 to +40)
  lane: number;                // 0 or 1
  isApproaching: boolean;      // coming from behind
}

export interface Pedestrian {
  id: string;
  type: 'elderly' | 'commuter' | 'student';
  position: number;            // metres (0 to 13)
  speed: number;               // m/s (moves slowly towards 0 or 13)
  direction: -1 | 1;
  name: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface GameStats {
  totalAttempts: number;
  successfulBoardings: number;
  missedBuses: number;
  fakeBusesBoarded: number;
  pedestrianCollisions: number;
  patientBoardings: number;
  soCloseCount: number;
}
