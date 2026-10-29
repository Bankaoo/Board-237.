/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BusConfig, Pedestrian, TrafficVehicle } from '../types/game';
import { CORRECT_ROUTE_NUMBER, CORRECT_ROUTE_DESTINATION } from '../constants/gameRules';

export type ScenarioType =
  | 'standard'
  | 'fake_then_real'
  | 'overshoot_start'
  | 'delayed_no_bus'
  | 'tight_window';

export interface RunSimulation {
  scenario: ScenarioType;
  buses: BusConfig[];
  pedestrians: Pedestrian[];
  vehicles: TrafficVehicle[];
}

const FAKE_ROUTES = [
  { num: '273', dest: '273 AIRPORT' },
  { num: '23', dest: '23 CROSTOWN' },
  { num: '237X', dest: '237X NO STOP' },
  { num: '327', dest: '327 UPSTOWN' },
  { num: 'OFF', dest: 'NOT IN SERVICE' },
];

export function createRunSimulation(attemptNumber: number): RunSimulation {
  let scenario: ScenarioType;
  const rand = Math.random();

  // Rotate scenarios systematically across attempts to ensure players encounter every situation
  if (attemptNumber % 4 === 1) {
    scenario = 'standard';
  } else if (attemptNumber % 4 === 2) {
    scenario = 'fake_then_real';
  } else if (attemptNumber % 4 === 3) {
    scenario = 'overshoot_start';
  } else {
    scenario = rand < 0.5 ? 'tight_window' : 'delayed_no_bus';
  }

  const buses: BusConfig[] = [];

  // STANDARD BUS 237
  if (scenario === 'standard') {
    const arriveTime = 7.0 + Math.random() * 0.6; // 7.0s - 7.6s
    buses.push({
      id: 'bus_main',
      routeNumber: CORRECT_ROUTE_NUMBER,
      routeName: CORRECT_ROUTE_DESTINATION,
      isCorrect: true,
      approachTime: Math.max(1.0, arriveTime - 3.0),
      arriveTime,
      stopPosition: 13.0,
      doorOpenDuration: 2.4, // Generous door window until 9.4s - 9.9s
      departureTime: Math.min(9.9, arriveTime + 2.4),
      doorOpened: false,
      doorClosed: false,
      departed: false,
      busColor: '#10b981', // Standard transit green
    });
  }
  // FAKE DECOY BUS THEN REAL BUS 237 (Delayed real bus so player can easily board fake bus)
  else if (scenario === 'fake_then_real') {
    const fakeRoute = FAKE_ROUTES[Math.floor(Math.random() * FAKE_ROUTES.length)];
    const fakeArrive = 3.6; // Arrives early at 3.6s
    buses.push({
      id: 'bus_fake',
      routeNumber: fakeRoute.num,
      routeName: fakeRoute.dest,
      isCorrect: false,
      approachTime: 0.5,
      arriveTime: fakeArrive,
      stopPosition: 11.5, // Easily reached near shelter
      doorOpenDuration: 5.0, // Doors open from 3.6s until 8.6s!
      departureTime: 8.6,
      doorOpened: false,
      doorClosed: false,
      departed: false,
      busColor: '#10b981', // SAME COLOR AS STANDARD BUS
    });

    // Delayed standard bus arrives after fake bus departs
    const realArrive = 8.9;
    buses.push({
      id: 'bus_real',
      routeNumber: CORRECT_ROUTE_NUMBER,
      routeName: CORRECT_ROUTE_DESTINATION,
      isCorrect: true,
      approachTime: 6.8,
      arriveTime: realArrive,
      stopPosition: 13.0,
      doorOpenDuration: 1.05,
      departureTime: 9.95,
      doorOpened: false,
      doorClosed: false,
      departed: false,
      busColor: '#10b981',
    });
  }
  // OVERSHOOT START (Only stops at 0m if player stays in place; dynamically updated in game loop if player moves)
  else if (scenario === 'overshoot_start') {
    const arriveTime = 6.5;
    buses.push({
      id: 'bus_overshoot',
      routeNumber: CORRECT_ROUTE_NUMBER,
      routeName: CORRECT_ROUTE_DESTINATION,
      isCorrect: true,
      approachTime: 2.5,
      arriveTime,
      stopPosition: 0.0, // Initial target 0m (updated to 13m if player runs ahead)
      doorOpenDuration: 3.0,
      departureTime: 9.5,
      doorOpened: false,
      doorClosed: false,
      departed: false,
      busColor: '#10b981',
    });
  }
  // TIGHT WINDOW
  else if (scenario === 'tight_window') {
    const arriveTime = 8.2;
    buses.push({
      id: 'bus_tight',
      routeNumber: CORRECT_ROUTE_NUMBER,
      routeName: CORRECT_ROUTE_DESTINATION,
      isCorrect: true,
      approachTime: 5.0,
      arriveTime,
      stopPosition: 13.0,
      doorOpenDuration: 1.6,
      departureTime: 9.8,
      doorOpened: false,
      doorClosed: false,
      departed: false,
      busColor: '#10b981',
    });
  }
  // DELAYED OR NO BUS
  else {
    buses.push({
      id: 'bus_delayed',
      routeNumber: CORRECT_ROUTE_NUMBER,
      routeName: CORRECT_ROUTE_DESTINATION,
      isCorrect: true,
      approachTime: 7.0,
      arriveTime: 11.5, // Will not arrive before 10.0s deadline
      stopPosition: 13.0,
      doorOpenDuration: 1.5,
      departureTime: 13.0,
      doorOpened: false,
      doorClosed: false,
      departed: false,
      busColor: '#10b981',
    });
  }

  // Pedestrians: Mrs. Higgins starts near position 1.2m walking towards 0m
  const pedestrians: Pedestrian[] = [
    {
      id: 'mrs_higgins',
      type: 'elderly',
      position: 1.2 + Math.random() * 0.8,
      speed: 0.35,
      direction: -1,
      name: 'Mrs. Higgins',
    },
    {
      id: 'commuter_phone',
      type: 'commuter',
      position: 7.5,
      speed: 0.25,
      direction: 1,
      name: 'Busy Commuter',
    },
  ];

  // Vehicles
  const vehicles: TrafficVehicle[] = [
    { id: 1, type: 'cab', color: '#eab308', speed: 8.5, position: -20, lane: 0, isApproaching: true },
    { id: 2, type: 'sedan', color: '#3b82f6', speed: 9.2, position: -45, lane: 1, isApproaching: true },
    { id: 3, type: 'van', color: '#94a3b8', speed: 7.0, position: -70, lane: 0, isApproaching: true },
    { id: 4, type: 'truck', color: '#ef4444', speed: 6.5, position: -110, lane: 1, isApproaching: true },
  ];

  return {
    scenario,
    buses,
    pedestrians,
    vehicles,
  };
}
