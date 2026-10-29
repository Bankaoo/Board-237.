/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Authoritative Game Parameters (Fine-tuned so all 8 achievements are achievable)
export const ROAD_LENGTH = 13.0; // metres: character starts at 0, boarding point is 13
export const TOTAL_TIME_PER_RUN = 10.0; // seconds: maximum time per run

export const WALK_SPEED = 1.0; // metres per second
export const SPRINT_SPEED = 2.5; // metres per second
export const SPRINT_MAX_DURATION = 1.8; // seconds per sprint burst

// Fatigue duration tuned to 1.8s so 3 sprints can be executed within the 10s run to trigger super-fatigue
export const FATIGUE_SPEED = 0.5; // metres per second
export const FATIGUE_DURATION = 1.8; // seconds of fatigue after sprint 1 & 2

export const SUPER_FATIGUE_SPEED = 0.2; // metres per second
export const SUPER_FATIGUE_DURATION = 5.0; // seconds of super-fatigue after 3rd sprint

export const TURN_DURATION = 1.0; // exactly 1 second
export const TURN_SPEED = 0.0; // metres per second during turn

export const BOARDING_DOOR_RANGE = 2.4; // within 2.4 metres of bus doors to board
export const SO_CLOSE_DISTANCE = 1.3; // within 1.3 metres threshold for "So Close"
export const PEDESTRIAN_COLLISION_DISTANCE = 0.8; // metres distance threshold for collision

export const CORRECT_ROUTE_NUMBER = '237';
export const CORRECT_ROUTE_DESTINATION = '237 DOWNTOWN';
