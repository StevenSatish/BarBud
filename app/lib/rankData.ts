export const RANK_ORDER = ['iron', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'titanium', 'mythic'] as const;
export type Rank = (typeof RANK_ORDER)[number];

type RankCutoffs = Record<Rank, number>;
type ExerciseMap = Record<string, RankCutoffs>;
type BracketMap = Record<string, ExerciseMap>;
type GenderMap = Record<string, BracketMap>;

export const rankCutoffs: GenderMap = {
  male: {
    '114-': {
      'bench-press-barbell': { iron: 60, bronze: 75, silver: 90, gold: 110, platinum: 130, diamond: 155, titanium: 180, mythic: 245 },
      'squat-barbell': { iron: 80, bronze: 100, silver: 120, gold: 150, platinum: 175, diamond: 205, titanium: 240, mythic: 325 },
      'deadlift-barbell': { iron: 105, bronze: 125, silver: 150, gold: 180, platinum: 215, diamond: 250, titanium: 285, mythic: 380 },
      'shoulder-press-barbell': { iron: 35, bronze: 45, silver: 60, gold: 70, platinum: 85, diamond: 105, titanium: 125, mythic: 170 },
      'incline-bench-press-barbell': { iron: 55, bronze: 65, silver: 80, gold: 95, platinum: 115, diamond: 135, titanium: 155, mythic: 210 },
      'bicep-curl-barbell': { iron: 20, bronze: 30, silver: 40, gold: 55, platinum: 70, diamond: 85, titanium: 105, mythic: 150 },
      'bent-over-row-barbell': { iron: 50, bronze: 65, silver: 80, gold: 100, platinum: 120, diamond: 140, titanium: 165, mythic: 225 },
      'hip-thrust-barbell': { iron: 40, bronze: 65, silver: 90, gold: 130, platinum: 170, diamond: 225, titanium: 275, mythic: 420 },
      'lat-pulldown-machine': { iron: 60, bronze: 75, silver: 90, gold: 110, platinum: 130, diamond: 155, titanium: 185, mythic: 250 },
      'romanian-deadlift-barbell': { iron: 70, bronze: 90, silver: 110, gold: 140, platinum: 170, diamond: 200, titanium: 235, mythic: 330 },
      'bench-press-dumbbell': { iron: 20, bronze: 30, silver: 35, gold: 50, platinum: 60, diamond: 75, titanium: 90, mythic: 125 },
      'shoulder-press-dumbbell': { iron: 15, bronze: 20, silver: 25, gold: 35, platinum: 45, diamond: 50, titanium: 65, mythic: 90 },
    },
    '115-129': {
      'bench-press-barbell': { iron: 65, bronze: 80, silver: 100, gold: 120, platinum: 145, diamond: 170, titanium: 195, mythic: 265 },
      'squat-barbell': { iron: 90, bronze: 110, silver: 135, gold: 160, platinum: 190, diamond: 225, titanium: 260, mythic: 345 },
      'deadlift-barbell': { iron: 115, bronze: 140, silver: 165, gold: 200, platinum: 230, diamond: 265, titanium: 305, mythic: 405 },
      'shoulder-press-barbell': { iron: 40, bronze: 50, silver: 65, gold: 80, platinum: 95, diamond: 115, titanium: 130, mythic: 180 },
      'incline-bench-press-barbell': { iron: 60, bronze: 75, silver: 90, gold: 105, platinum: 125, diamond: 145, titanium: 170, mythic: 225 },
      'bicep-curl-barbell': { iron: 25, bronze: 35, silver: 45, gold: 60, platinum: 75, diamond: 95, titanium: 110, mythic: 160 },
      'bent-over-row-barbell': { iron: 55, bronze: 70, silver: 90, gold: 105, platinum: 130, diamond: 150, titanium: 175, mythic: 240 },
      'hip-thrust-barbell': { iron: 45, bronze: 75, silver: 105, gold: 145, platinum: 190, diamond: 245, titanium: 300, mythic: 450 },
      'lat-pulldown-machine': { iron: 65, bronze: 80, silver: 95, gold: 120, platinum: 140, diamond: 165, titanium: 190, mythic: 260 },
      'romanian-deadlift-barbell': { iron: 75, bronze: 100, silver: 125, gold: 150, platinum: 180, diamond: 215, titanium: 255, mythic: 350 },
      'bench-press-dumbbell': { iron: 25, bronze: 30, silver: 40, gold: 50, platinum: 65, diamond: 80, titanium: 95, mythic: 135 },
      'shoulder-press-dumbbell': { iron: 15, bronze: 25, silver: 30, gold: 40, platinum: 45, diamond: 55, titanium: 70, mythic: 95 },
    },
    '130-144': {
      'bench-press-barbell': { iron: 80, bronze: 100, silver: 120, gold: 140, platinum: 165, diamond: 190, titanium: 220, mythic: 295 },
      'squat-barbell': { iron: 110, bronze: 135, silver: 160, gold: 190, platinum: 220, diamond: 255, titanium: 290, mythic: 385 },
      'deadlift-barbell': { iron: 135, bronze: 165, silver: 195, gold: 225, platinum: 260, diamond: 300, titanium: 340, mythic: 445 },
      'shoulder-press-barbell': { iron: 50, bronze: 60, silver: 75, gold: 90, platinum: 110, diamond: 130, titanium: 150, mythic: 200 },
      'incline-bench-press-barbell': { iron: 75, bronze: 90, silver: 105, gold: 125, platinum: 145, diamond: 170, titanium: 190, mythic: 255 },
      'bicep-curl-barbell': { iron: 30, bronze: 40, silver: 55, gold: 70, platinum: 85, diamond: 105, titanium: 125, mythic: 175 },
      'bent-over-row-barbell': { iron: 70, bronze: 85, silver: 105, gold: 125, platinum: 145, diamond: 170, titanium: 195, mythic: 265 },
      'hip-thrust-barbell': { iron: 65, bronze: 95, silver: 130, gold: 175, platinum: 225, diamond: 280, titanium: 345, mythic: 505 },
      'lat-pulldown-machine': { iron: 70, bronze: 90, silver: 110, gold: 130, platinum: 155, diamond: 180, titanium: 210, mythic: 280 },
      'romanian-deadlift-barbell': { iron: 95, bronze: 120, silver: 145, gold: 175, platinum: 210, diamond: 245, titanium: 285, mythic: 385 },
      'bench-press-dumbbell': { iron: 30, bronze: 35, silver: 45, gold: 60, platinum: 75, diamond: 90, titanium: 105, mythic: 145 },
      'shoulder-press-dumbbell': { iron: 20, bronze: 30, silver: 35, gold: 45, platinum: 55, diamond: 65, titanium: 75, mythic: 105 },
    },
    '145-159': {
      'bench-press-barbell': { iron: 95, bronze: 115, silver: 135, gold: 160, platinum: 185, diamond: 215, titanium: 245, mythic: 320 },
      'squat-barbell': { iron: 130, bronze: 155, silver: 180, gold: 215, platinum: 245, diamond: 285, titanium: 320, mythic: 420 },
      'deadlift-barbell': { iron: 160, bronze: 185, silver: 220, gold: 255, platinum: 290, diamond: 330, titanium: 375, mythic: 485 },
      'shoulder-press-barbell': { iron: 60, bronze: 70, silver: 85, gold: 105, platinum: 120, diamond: 140, titanium: 165, mythic: 215 },
      'incline-bench-press-barbell': { iron: 90, bronze: 105, silver: 125, gold: 145, platinum: 165, diamond: 190, titanium: 215, mythic: 280 },
      'bicep-curl-barbell': { iron: 35, bronze: 45, silver: 60, gold: 75, platinum: 95, diamond: 115, titanium: 135, mythic: 185 },
      'bent-over-row-barbell': { iron: 80, bronze: 100, silver: 120, gold: 140, platinum: 165, diamond: 190, titanium: 215, mythic: 290 },
      'hip-thrust-barbell': { iron: 80, bronze: 115, silver: 155, gold: 205, platinum: 255, diamond: 320, titanium: 385, mythic: 555 },
      'lat-pulldown-machine': { iron: 80, bronze: 100, silver: 120, gold: 140, platinum: 165, diamond: 195, titanium: 220, mythic: 295 },
      'romanian-deadlift-barbell': { iron: 110, bronze: 135, silver: 165, gold: 195, platinum: 230, diamond: 270, titanium: 310, mythic: 420 },
      'bench-press-dumbbell': { iron: 35, bronze: 40, silver: 55, gold: 65, platinum: 80, diamond: 95, titanium: 115, mythic: 160 },
      'shoulder-press-dumbbell': { iron: 25, bronze: 35, silver: 40, gold: 50, platinum: 60, diamond: 75, titanium: 85, mythic: 120 },
    },
    '160-174': {
      'bench-press-barbell': { iron: 110, bronze: 130, silver: 155, gold: 180, platinum: 205, diamond: 235, titanium: 265, mythic: 350 },
      'squat-barbell': { iron: 150, bronze: 175, silver: 205, gold: 235, platinum: 270, diamond: 310, titanium: 350, mythic: 455 },
      'deadlift-barbell': { iron: 180, bronze: 210, silver: 240, gold: 280, platinum: 320, diamond: 360, titanium: 405, mythic: 520 },
      'shoulder-press-barbell': { iron: 70, bronze: 80, silver: 100, gold: 115, platinum: 135, diamond: 155, titanium: 180, mythic: 235 },
      'incline-bench-press-barbell': { iron: 105, bronze: 120, silver: 140, gold: 160, platinum: 185, diamond: 210, titanium: 235, mythic: 305 },
      'bicep-curl-barbell': { iron: 40, bronze: 55, silver: 65, gold: 85, platinum: 100, diamond: 120, titanium: 145, mythic: 200 },
      'bent-over-row-barbell': { iron: 95, bronze: 110, silver: 130, gold: 155, platinum: 180, diamond: 205, titanium: 235, mythic: 310 },
      'hip-thrust-barbell': { iron: 100, bronze: 140, silver: 180, gold: 230, platinum: 285, diamond: 355, titanium: 420, mythic: 600 },
      'lat-pulldown-machine': { iron: 90, bronze: 110, silver: 130, gold: 155, platinum: 180, diamond: 205, titanium: 235, mythic: 315 },
      'romanian-deadlift-barbell': { iron: 125, bronze: 155, silver: 185, gold: 220, platinum: 255, diamond: 295, titanium: 340, mythic: 450 },
      'bench-press-dumbbell': { iron: 35, bronze: 50, silver: 60, gold: 75, platinum: 90, diamond: 105, titanium: 125, mythic: 170 },
      'shoulder-press-dumbbell': { iron: 30, bronze: 40, silver: 45, gold: 55, platinum: 70, diamond: 80, titanium: 95, mythic: 125 },
    },
    '175-189': {
      'bench-press-barbell': { iron: 125, bronze: 145, silver: 170, gold: 195, platinum: 225, diamond: 255, titanium: 290, mythic: 375 },
      'squat-barbell': { iron: 165, bronze: 195, silver: 225, gold: 260, platinum: 295, diamond: 335, titanium: 380, mythic: 485 },
      'deadlift-barbell': { iron: 200, bronze: 230, silver: 265, gold: 305, platinum: 345, diamond: 390, titanium: 435, mythic: 555 },
      'shoulder-press-barbell': { iron: 75, bronze: 90, silver: 110, gold: 125, platinum: 145, diamond: 170, titanium: 190, mythic: 250 },
      'incline-bench-press-barbell': { iron: 115, bronze: 135, silver: 155, gold: 180, platinum: 200, diamond: 230, titanium: 255, mythic: 330 },
      'bicep-curl-barbell': { iron: 45, bronze: 60, silver: 75, gold: 90, platinum: 110, diamond: 130, titanium: 155, mythic: 210 },
      'bent-over-row-barbell': { iron: 105, bronze: 125, silver: 145, gold: 170, platinum: 195, diamond: 225, titanium: 255, mythic: 330 },
      'hip-thrust-barbell': { iron: 115, bronze: 160, silver: 200, gold: 260, platinum: 315, diamond: 385, titanium: 455, mythic: 645 },
      'lat-pulldown-machine': { iron: 95, bronze: 115, silver: 140, gold: 165, platinum: 190, diamond: 220, titanium: 250, mythic: 330 },
      'romanian-deadlift-barbell': { iron: 140, bronze: 170, silver: 200, gold: 240, platinum: 275, diamond: 320, titanium: 365, mythic: 480 },
      'bench-press-dumbbell': { iron: 40, bronze: 55, silver: 65, gold: 80, platinum: 95, diamond: 115, titanium: 130, mythic: 180 },
      'shoulder-press-dumbbell': { iron: 35, bronze: 45, silver: 50, gold: 65, platinum: 75, diamond: 90, titanium: 100, mythic: 135 },
    },
    '190-204': {
      'bench-press-barbell': { iron: 135, bronze: 160, silver: 185, gold: 215, platinum: 245, diamond: 275, titanium: 310, mythic: 395 },
      'squat-barbell': { iron: 185, bronze: 215, silver: 245, gold: 280, platinum: 320, diamond: 360, titanium: 405, mythic: 520 },
      'deadlift-barbell': { iron: 215, bronze: 250, silver: 285, gold: 325, platinum: 370, diamond: 415, titanium: 465, mythic: 590 },
      'shoulder-press-barbell': { iron: 85, bronze: 100, silver: 120, gold: 140, platinum: 160, diamond: 180, titanium: 205, mythic: 265 },
      'incline-bench-press-barbell': { iron: 130, bronze: 150, silver: 170, gold: 195, platinum: 220, diamond: 245, titanium: 275, mythic: 350 },
      'bicep-curl-barbell': { iron: 50, bronze: 65, silver: 80, gold: 100, platinum: 115, diamond: 140, titanium: 160, mythic: 220 },
      'bent-over-row-barbell': { iron: 115, bronze: 135, silver: 160, gold: 185, platinum: 210, diamond: 240, titanium: 270, mythic: 350 },
      'hip-thrust-barbell': { iron: 135, bronze: 180, silver: 225, gold: 285, platinum: 345, diamond: 420, titanium: 490, mythic: 685 },
      'lat-pulldown-machine': { iron: 105, bronze: 125, silver: 145, gold: 175, platinum: 200, diamond: 230, titanium: 260, mythic: 340 },
      'romanian-deadlift-barbell': { iron: 155, bronze: 190, silver: 220, gold: 260, platinum: 300, diamond: 345, titanium: 390, mythic: 510 },
      'bench-press-dumbbell': { iron: 45, bronze: 60, silver: 70, gold: 85, platinum: 105, diamond: 120, titanium: 140, mythic: 190 },
      'shoulder-press-dumbbell': { iron: 40, bronze: 50, silver: 60, gold: 70, platinum: 80, diamond: 95, titanium: 110, mythic: 145 },
    },
    '205-219': {
      'bench-press-barbell': { iron: 150, bronze: 175, silver: 200, gold: 230, platinum: 265, diamond: 295, titanium: 330, mythic: 420 },
      'squat-barbell': { iron: 200, bronze: 230, silver: 265, gold: 305, platinum: 340, diamond: 385, titanium: 430, mythic: 545 },
      'deadlift-barbell': { iron: 235, bronze: 270, silver: 310, gold: 350, platinum: 395, diamond: 440, titanium: 490, mythic: 620 },
      'shoulder-press-barbell': { iron: 95, bronze: 110, silver: 130, gold: 150, platinum: 170, diamond: 195, titanium: 220, mythic: 280 },
      'incline-bench-press-barbell': { iron: 140, bronze: 165, silver: 185, gold: 210, platinum: 235, diamond: 265, titanium: 295, mythic: 370 },
      'bicep-curl-barbell': { iron: 55, bronze: 70, silver: 85, gold: 105, platinum: 125, diamond: 145, titanium: 170, mythic: 230 },
      'bent-over-row-barbell': { iron: 125, bronze: 150, silver: 170, gold: 200, platinum: 225, diamond: 255, titanium: 290, mythic: 370 },
      'hip-thrust-barbell': { iron: 155, bronze: 200, silver: 250, gold: 310, platinum: 375, diamond: 450, titanium: 525, mythic: 725 },
      'lat-pulldown-machine': { iron: 110, bronze: 135, silver: 155, gold: 180, platinum: 210, diamond: 240, titanium: 275, mythic: 355 },
      'romanian-deadlift-barbell': { iron: 170, bronze: 205, silver: 240, gold: 280, platinum: 320, diamond: 365, titanium: 410, mythic: 535 },
      'bench-press-dumbbell': { iron: 50, bronze: 65, silver: 75, gold: 95, platinum: 110, diamond: 130, titanium: 150, mythic: 200 },
      'shoulder-press-dumbbell': { iron: 45, bronze: 50, silver: 65, gold: 75, platinum: 85, diamond: 100, titanium: 115, mythic: 155 },
    },
    '220-234': {
      'bench-press-barbell': { iron: 160, bronze: 190, silver: 215, gold: 245, platinum: 275, diamond: 310, titanium: 350, mythic: 440 },
      'squat-barbell': { iron: 215, bronze: 250, silver: 285, gold: 325, platinum: 365, diamond: 410, titanium: 455, mythic: 575 },
      'deadlift-barbell': { iron: 255, bronze: 290, silver: 330, gold: 370, platinum: 415, diamond: 465, titanium: 515, mythic: 650 },
      'shoulder-press-barbell': { iron: 100, bronze: 120, silver: 135, gold: 160, platinum: 180, diamond: 205, titanium: 230, mythic: 295 },
      'incline-bench-press-barbell': { iron: 155, bronze: 175, silver: 200, gold: 225, platinum: 250, diamond: 280, titanium: 310, mythic: 390 },
      'bicep-curl-barbell': { iron: 60, bronze: 75, silver: 90, gold: 110, platinum: 130, diamond: 155, titanium: 180, mythic: 240 },
      'bent-over-row-barbell': { iron: 135, bronze: 160, silver: 185, gold: 210, platinum: 240, diamond: 270, titanium: 305, mythic: 390 },
      'hip-thrust-barbell': { iron: 170, bronze: 220, silver: 270, gold: 335, platinum: 400, diamond: 480, titanium: 555, mythic: 765 },
      'lat-pulldown-machine': { iron: 120, bronze: 140, silver: 165, gold: 190, platinum: 220, diamond: 250, titanium: 285, mythic: 370 },
      'romanian-deadlift-barbell': { iron: 185, bronze: 220, silver: 255, gold: 295, platinum: 340, diamond: 385, titanium: 435, mythic: 565 },
      'bench-press-dumbbell': { iron: 55, bronze: 70, silver: 80, gold: 100, platinum: 115, diamond: 135, titanium: 155, mythic: 205 },
      'shoulder-press-dumbbell': { iron: 50, bronze: 55, silver: 70, gold: 80, platinum: 95, diamond: 105, titanium: 125, mythic: 160 },
    },
    '235-249': {
      'bench-press-barbell': { iron: 175, bronze: 200, silver: 230, gold: 260, platinum: 295, diamond: 330, titanium: 365, mythic: 465 },
      'squat-barbell': { iron: 235, bronze: 265, silver: 305, gold: 345, platinum: 385, diamond: 430, titanium: 475, mythic: 600 },
      'deadlift-barbell': { iron: 270, bronze: 310, silver: 350, gold: 395, platinum: 440, diamond: 490, titanium: 540, mythic: 680 },
      'shoulder-press-barbell': { iron: 110, bronze: 125, silver: 145, gold: 170, platinum: 190, diamond: 215, titanium: 240, mythic: 310 },
      'incline-bench-press-barbell': { iron: 165, bronze: 190, silver: 215, gold: 240, platinum: 270, diamond: 300, titanium: 330, mythic: 410 },
      'bicep-curl-barbell': { iron: 65, bronze: 80, silver: 95, gold: 115, platinum: 140, diamond: 160, titanium: 185, mythic: 250 },
      'bent-over-row-barbell': { iron: 145, bronze: 170, silver: 195, gold: 225, platinum: 255, diamond: 285, titanium: 320, mythic: 405 },
      'hip-thrust-barbell': { iron: 185, bronze: 240, silver: 290, gold: 360, platinum: 425, diamond: 505, titanium: 590, mythic: 800 },
      'lat-pulldown-machine': { iron: 125, bronze: 150, silver: 170, gold: 200, platinum: 230, diamond: 260, titanium: 295, mythic: 380 },
      'romanian-deadlift-barbell': { iron: 200, bronze: 235, silver: 270, gold: 315, platinum: 360, diamond: 405, titanium: 455, mythic: 585 },
      'bench-press-dumbbell': { iron: 60, bronze: 75, silver: 85, gold: 105, platinum: 120, diamond: 140, titanium: 160, mythic: 215 },
      'shoulder-press-dumbbell': { iron: 50, bronze: 60, silver: 75, gold: 85, platinum: 100, diamond: 115, titanium: 130, mythic: 170 },
    },
    '250+': {
      'bench-press-barbell': { iron: 180, bronze: 210, silver: 235, gold: 270, platinum: 300, diamond: 340, titanium: 375, mythic: 475 },
      'squat-barbell': { iron: 240, bronze: 275, silver: 310, gold: 355, platinum: 395, diamond: 440, titanium: 490, mythic: 615 },
      'deadlift-barbell': { iron: 280, bronze: 320, silver: 360, gold: 405, platinum: 450, diamond: 500, titanium: 555, mythic: 695 },
      'shoulder-press-barbell': { iron: 115, bronze: 130, silver: 150, gold: 175, platinum: 195, diamond: 220, titanium: 250, mythic: 315 },
      'incline-bench-press-barbell': { iron: 175, bronze: 195, silver: 220, gold: 245, platinum: 275, diamond: 305, titanium: 340, mythic: 420 },
      'bicep-curl-barbell': { iron: 65, bronze: 85, silver: 100, gold: 120, platinum: 140, diamond: 165, titanium: 190, mythic: 255 },
      'bent-over-row-barbell': { iron: 155, bronze: 175, silver: 200, gold: 230, platinum: 260, diamond: 295, titanium: 325, mythic: 415 },
      'hip-thrust-barbell': { iron: 195, bronze: 250, silver: 305, gold: 370, platinum: 440, diamond: 520, titanium: 605, mythic: 820 },
      'lat-pulldown-machine': { iron: 130, bronze: 150, silver: 175, gold: 205, platinum: 235, diamond: 265, titanium: 300, mythic: 385 },
      'romanian-deadlift-barbell': { iron: 210, bronze: 245, silver: 280, gold: 325, platinum: 365, diamond: 415, titanium: 465, mythic: 600 },
      'bench-press-dumbbell': { iron: 60, bronze: 75, silver: 90, gold: 105, platinum: 125, diamond: 145, titanium: 165, mythic: 220 },
      'shoulder-press-dumbbell': { iron: 55, bronze: 65, silver: 75, gold: 90, platinum: 100, diamond: 115, titanium: 135, mythic: 175 },
    },
  },
  female: {
    '114-': {
      'bench-press-barbell': { iron: 30, bronze: 40, silver: 55, gold: 75, platinum: 90, diamond: 110, titanium: 135, mythic: 195 },
      'squat-barbell': { iron: 55, bronze: 70, silver: 90, gold: 115, platinum: 140, diamond: 165, titanium: 195, mythic: 270 },
      'deadlift-barbell': { iron: 70, bronze: 90, silver: 110, gold: 140, platinum: 165, diamond: 195, titanium: 230, mythic: 315 },
      'shoulder-press-barbell': { iron: 25, bronze: 30, silver: 40, gold: 50, platinum: 65, diamond: 75, titanium: 90, mythic: 130 },
      'incline-bench-press-barbell': { iron: 20, bronze: 30, silver: 45, gold: 60, platinum: 75, diamond: 95, titanium: 115, mythic: 170 },
      'bicep-curl-barbell': { iron: 10, bronze: 20, silver: 25, gold: 35, platinum: 45, diamond: 60, titanium: 75, mythic: 110 },
      'bent-over-row-barbell': { iron: 30, bronze: 40, silver: 50, gold: 65, platinum: 80, diamond: 100, titanium: 120, mythic: 165 },
      'hip-thrust-barbell': { iron: 60, bronze: 85, silver: 115, gold: 150, platinum: 190, diamond: 235, titanium: 285, mythic: 415 },
      'lat-pulldown-machine': { iron: 40, bronze: 50, silver: 60, gold: 75, platinum: 90, diamond: 110, titanium: 130, mythic: 175 },
      'romanian-deadlift-barbell': { iron: 55, bronze: 75, silver: 90, gold: 110, platinum: 130, diamond: 155, titanium: 185, mythic: 250 },
      'bench-press-dumbbell': { iron: 10, bronze: 15, silver: 20, gold: 30, platinum: 40, diamond: 50, titanium: 60, mythic: 90 },
      'shoulder-press-dumbbell': { iron: 10, bronze: 15, silver: 20, gold: 25, platinum: 30, diamond: 35, titanium: 45, mythic: 60 },
    },
    '115-129': {
      'bench-press-barbell': { iron: 35, bronze: 45, silver: 60, gold: 80, platinum: 95, diamond: 120, titanium: 140, mythic: 200 },
      'squat-barbell': { iron: 60, bronze: 75, silver: 95, gold: 120, platinum: 145, diamond: 175, titanium: 205, mythic: 280 },
      'deadlift-barbell': { iron: 75, bronze: 95, silver: 120, gold: 145, platinum: 175, diamond: 205, titanium: 240, mythic: 325 },
      'shoulder-press-barbell': { iron: 25, bronze: 35, silver: 45, gold: 55, platinum: 65, diamond: 80, titanium: 95, mythic: 135 },
      'incline-bench-press-barbell': { iron: 25, bronze: 35, silver: 50, gold: 65, platinum: 80, diamond: 100, titanium: 125, mythic: 180 },
      'bicep-curl-barbell': { iron: 15, bronze: 20, silver: 30, gold: 40, platinum: 50, diamond: 60, titanium: 75, mythic: 115 },
      'bent-over-row-barbell': { iron: 30, bronze: 40, silver: 55, gold: 70, platinum: 85, diamond: 100, titanium: 120, mythic: 170 },
      'hip-thrust-barbell': { iron: 60, bronze: 90, silver: 120, gold: 155, platinum: 195, diamond: 245, titanium: 295, mythic: 425 },
      'lat-pulldown-machine': { iron: 40, bronze: 50, silver: 65, gold: 80, platinum: 95, diamond: 115, titanium: 130, mythic: 180 },
      'romanian-deadlift-barbell': { iron: 60, bronze: 75, silver: 95, gold: 115, platinum: 135, diamond: 160, titanium: 190, mythic: 255 },
      'bench-press-dumbbell': { iron: 10, bronze: 15, silver: 25, gold: 30, platinum: 40, diamond: 50, titanium: 65, mythic: 95 },
      'shoulder-press-dumbbell': { iron: 10, bronze: 15, silver: 20, gold: 25, platinum: 30, diamond: 40, titanium: 45, mythic: 65 },
    },
    '130-144': {
      'bench-press-barbell': { iron: 40, bronze: 55, silver: 70, gold: 85, platinum: 105, diamond: 130, titanium: 155, mythic: 215 },
      'squat-barbell': { iron: 70, bronze: 85, silver: 105, gold: 130, platinum: 160, diamond: 190, titanium: 220, mythic: 300 },
      'deadlift-barbell': { iron: 85, bronze: 105, silver: 130, gold: 160, platinum: 185, diamond: 220, titanium: 255, mythic: 345 },
      'shoulder-press-barbell': { iron: 30, bronze: 40, silver: 50, gold: 60, platinum: 75, diamond: 85, titanium: 105, mythic: 145 },
      'incline-bench-press-barbell': { iron: 30, bronze: 40, silver: 55, gold: 75, platinum: 90, diamond: 115, titanium: 135, mythic: 195 },
      'bicep-curl-barbell': { iron: 15, bronze: 20, silver: 30, gold: 40, platinum: 55, diamond: 70, titanium: 85, mythic: 120 },
      'bent-over-row-barbell': { iron: 35, bronze: 45, silver: 60, gold: 75, platinum: 90, diamond: 110, titanium: 130, mythic: 175 },
      'hip-thrust-barbell': { iron: 70, bronze: 95, silver: 125, gold: 165, platinum: 205, diamond: 255, titanium: 305, mythic: 440 },
      'lat-pulldown-machine': { iron: 45, bronze: 55, silver: 70, gold: 85, platinum: 100, diamond: 120, titanium: 135, mythic: 185 },
      'romanian-deadlift-barbell': { iron: 65, bronze: 80, silver: 100, gold: 120, platinum: 145, diamond: 170, titanium: 200, mythic: 270 },
      'bench-press-dumbbell': { iron: 15, bronze: 20, silver: 25, gold: 35, platinum: 45, diamond: 55, titanium: 70, mythic: 100 },
      'shoulder-press-dumbbell': { iron: 15, bronze: 20, silver: 25, gold: 30, platinum: 35, diamond: 40, titanium: 50, mythic: 70 },
    },
    '145-159': {
      'bench-press-barbell': { iron: 45, bronze: 60, silver: 75, gold: 95, platinum: 115, diamond: 140, titanium: 165, mythic: 230 },
      'squat-barbell': { iron: 75, bronze: 95, silver: 115, gold: 145, platinum: 170, diamond: 200, titanium: 235, mythic: 320 },
      'deadlift-barbell': { iron: 95, bronze: 115, silver: 140, gold: 170, platinum: 200, diamond: 235, titanium: 270, mythic: 360 },
      'shoulder-press-barbell': { iron: 35, bronze: 40, silver: 50, gold: 65, platinum: 80, diamond: 95, titanium: 110, mythic: 150 },
      'incline-bench-press-barbell': { iron: 35, bronze: 50, silver: 65, gold: 80, platinum: 100, diamond: 125, titanium: 145, mythic: 210 },
      'bicep-curl-barbell': { iron: 20, bronze: 25, silver: 35, gold: 45, platinum: 60, diamond: 70, titanium: 90, mythic: 130 },
      'bent-over-row-barbell': { iron: 40, bronze: 50, silver: 60, gold: 80, platinum: 95, diamond: 115, titanium: 135, mythic: 185 },
      'hip-thrust-barbell': { iron: 75, bronze: 105, silver: 135, gold: 175, platinum: 215, diamond: 265, titanium: 320, mythic: 455 },
      'lat-pulldown-machine': { iron: 45, bronze: 60, silver: 70, gold: 85, platinum: 105, diamond: 125, titanium: 145, mythic: 195 },
      'romanian-deadlift-barbell': { iron: 70, bronze: 85, silver: 105, gold: 130, platinum: 150, diamond: 180, titanium: 205, mythic: 280 },
      'bench-press-dumbbell': { iron: 15, bronze: 20, silver: 30, gold: 40, platinum: 50, diamond: 60, titanium: 75, mythic: 105 },
      'shoulder-press-dumbbell': { iron: 15, bronze: 20, silver: 25, gold: 30, platinum: 40, diamond: 45, titanium: 55, mythic: 75 },
    },
    '160-174': {
      'bench-press-barbell': { iron: 50, bronze: 65, silver: 85, gold: 105, platinum: 125, diamond: 150, titanium: 175, mythic: 245 },
      'squat-barbell': { iron: 85, bronze: 105, silver: 125, gold: 155, platinum: 180, diamond: 215, titanium: 245, mythic: 335 },
      'deadlift-barbell': { iron: 100, bronze: 125, silver: 150, gold: 180, platinum: 210, diamond: 245, titanium: 285, mythic: 380 },
      'shoulder-press-barbell': { iron: 35, bronze: 45, silver: 55, gold: 70, platinum: 85, diamond: 100, titanium: 115, mythic: 160 },
      'incline-bench-press-barbell': { iron: 40, bronze: 55, silver: 70, gold: 90, platinum: 110, diamond: 135, titanium: 160, mythic: 225 },
      'bicep-curl-barbell': { iron: 20, bronze: 30, silver: 35, gold: 50, platinum: 60, diamond: 75, titanium: 95, mythic: 135 },
      'bent-over-row-barbell': { iron: 40, bronze: 55, silver: 65, gold: 80, platinum: 100, diamond: 120, titanium: 140, mythic: 190 },
      'hip-thrust-barbell': { iron: 80, bronze: 110, silver: 140, gold: 185, platinum: 225, diamond: 275, titanium: 330, mythic: 470 },
      'lat-pulldown-machine': { iron: 50, bronze: 60, silver: 75, gold: 90, platinum: 110, diamond: 130, titanium: 150, mythic: 200 },
      'romanian-deadlift-barbell': { iron: 75, bronze: 95, silver: 110, gold: 135, platinum: 160, diamond: 185, titanium: 215, mythic: 290 },
      'bench-press-dumbbell': { iron: 20, bronze: 25, silver: 30, gold: 40, platinum: 55, diamond: 65, titanium: 80, mythic: 110 },
      'shoulder-press-dumbbell': { iron: 20, bronze: 20, silver: 30, gold: 35, platinum: 40, diamond: 50, titanium: 55, mythic: 80 },
    },
    '175-189': {
      'bench-press-barbell': { iron: 55, bronze: 70, silver: 90, gold: 110, platinum: 135, diamond: 160, titanium: 185, mythic: 255 },
      'squat-barbell': { iron: 90, bronze: 110, silver: 135, gold: 165, platinum: 190, diamond: 225, titanium: 260, mythic: 350 },
      'deadlift-barbell': { iron: 110, bronze: 135, silver: 160, gold: 190, platinum: 225, diamond: 260, titanium: 295, mythic: 395 },
      'shoulder-press-barbell': { iron: 40, bronze: 50, silver: 60, gold: 75, platinum: 90, diamond: 105, titanium: 120, mythic: 165 },
      'incline-bench-press-barbell': { iron: 45, bronze: 60, silver: 75, gold: 95, platinum: 120, diamond: 140, titanium: 170, mythic: 235 },
      'bicep-curl-barbell': { iron: 20, bronze: 30, silver: 40, gold: 50, platinum: 65, diamond: 80, titanium: 95, mythic: 140 },
      'bent-over-row-barbell': { iron: 45, bronze: 55, silver: 70, gold: 85, platinum: 105, diamond: 125, titanium: 145, mythic: 200 },
      'hip-thrust-barbell': { iron: 85, bronze: 115, silver: 150, gold: 190, platinum: 235, diamond: 285, titanium: 340, mythic: 480 },
      'lat-pulldown-machine': { iron: 50, bronze: 65, silver: 80, gold: 95, platinum: 115, diamond: 130, titanium: 155, mythic: 205 },
      'romanian-deadlift-barbell': { iron: 80, bronze: 95, silver: 115, gold: 140, platinum: 165, diamond: 195, titanium: 225, mythic: 300 },
      'bench-press-dumbbell': { iron: 20, bronze: 25, silver: 35, gold: 45, platinum: 55, diamond: 70, titanium: 85, mythic: 120 },
      'shoulder-press-dumbbell': { iron: 20, bronze: 25, silver: 30, gold: 35, platinum: 45, diamond: 50, titanium: 60, mythic: 80 },
    },
    '190-204': {
      'bench-press-barbell': { iron: 60, bronze: 80, silver: 95, gold: 120, platinum: 140, diamond: 170, titanium: 195, mythic: 270 },
      'squat-barbell': { iron: 95, bronze: 120, silver: 145, gold: 170, platinum: 200, diamond: 235, titanium: 270, mythic: 360 },
      'deadlift-barbell': { iron: 115, bronze: 140, silver: 170, gold: 200, platinum: 235, diamond: 270, titanium: 310, mythic: 410 },
      'shoulder-press-barbell': { iron: 40, bronze: 50, silver: 65, gold: 80, platinum: 95, diamond: 110, titanium: 125, mythic: 170 },
      'incline-bench-press-barbell': { iron: 50, bronze: 65, silver: 85, gold: 105, platinum: 125, diamond: 150, titanium: 180, mythic: 245 },
      'bicep-curl-barbell': { iron: 25, bronze: 35, silver: 45, gold: 55, platinum: 70, diamond: 85, titanium: 100, mythic: 145 },
      'bent-over-row-barbell': { iron: 45, bronze: 60, silver: 75, gold: 90, platinum: 110, diamond: 130, titanium: 150, mythic: 205 },
      'hip-thrust-barbell': { iron: 90, bronze: 120, silver: 155, gold: 200, platinum: 245, diamond: 295, titanium: 350, mythic: 495 },
      'lat-pulldown-machine': { iron: 55, bronze: 70, silver: 80, gold: 100, platinum: 115, diamond: 135, titanium: 155, mythic: 210 },
      'romanian-deadlift-barbell': { iron: 85, bronze: 100, silver: 120, gold: 145, platinum: 170, diamond: 200, titanium: 230, mythic: 305 },
      'bench-press-dumbbell': { iron: 20, bronze: 30, silver: 40, gold: 50, platinum: 60, diamond: 75, titanium: 85, mythic: 120 },
      'shoulder-press-dumbbell': { iron: 20, bronze: 25, silver: 30, gold: 40, platinum: 45, diamond: 55, titanium: 65, mythic: 85 },
    },
    '205-219': {
      'bench-press-barbell': { iron: 65, bronze: 85, silver: 105, gold: 125, platinum: 150, diamond: 175, titanium: 205, mythic: 280 },
      'squat-barbell': { iron: 105, bronze: 125, silver: 150, gold: 180, platinum: 210, diamond: 245, titanium: 280, mythic: 375 },
      'deadlift-barbell': { iron: 125, bronze: 150, silver: 180, gold: 210, platinum: 245, diamond: 280, titanium: 320, mythic: 420 },
      'shoulder-press-barbell': { iron: 45, bronze: 55, silver: 70, gold: 80, platinum: 95, diamond: 115, titanium: 130, mythic: 175 },
      'incline-bench-press-barbell': { iron: 55, bronze: 70, silver: 90, gold: 110, platinum: 135, diamond: 160, titanium: 185, mythic: 255 },
      'bicep-curl-barbell': { iron: 25, bronze: 35, silver: 45, gold: 60, platinum: 75, diamond: 90, titanium: 105, mythic: 150 },
      'bent-over-row-barbell': { iron: 50, bronze: 60, silver: 75, gold: 95, platinum: 110, diamond: 130, titanium: 155, mythic: 210 },
      'hip-thrust-barbell': { iron: 95, bronze: 125, silver: 160, gold: 205, platinum: 250, diamond: 305, titanium: 360, mythic: 505 },
      'lat-pulldown-machine': { iron: 55, bronze: 70, silver: 85, gold: 100, platinum: 120, diamond: 140, titanium: 160, mythic: 215 },
      'romanian-deadlift-barbell': { iron: 85, bronze: 105, silver: 125, gold: 150, platinum: 175, diamond: 205, titanium: 235, mythic: 315 },
      'bench-press-dumbbell': { iron: 25, bronze: 30, silver: 40, gold: 50, platinum: 65, diamond: 75, titanium: 90, mythic: 125 },
      'shoulder-press-dumbbell': { iron: 25, bronze: 30, silver: 35, gold: 40, platinum: 50, diamond: 55, titanium: 65, mythic: 90 },
    },
    '220-234': {
      'bench-press-barbell': { iron: 70, bronze: 90, silver: 110, gold: 130, platinum: 155, diamond: 185, titanium: 215, mythic: 290 },
      'squat-barbell': { iron: 110, bronze: 135, silver: 160, gold: 190, platinum: 220, diamond: 255, titanium: 290, mythic: 385 },
      'deadlift-barbell': { iron: 130, bronze: 160, silver: 185, gold: 220, platinum: 255, diamond: 290, titanium: 330, mythic: 435 },
      'shoulder-press-barbell': { iron: 50, bronze: 60, silver: 70, gold: 85, platinum: 100, diamond: 120, titanium: 135, mythic: 185 },
      'incline-bench-press-barbell': { iron: 60, bronze: 80, silver: 95, gold: 120, platinum: 140, diamond: 165, titanium: 195, mythic: 270 },
      'bicep-curl-barbell': { iron: 30, bronze: 35, silver: 50, gold: 60, platinum: 75, diamond: 90, titanium: 110, mythic: 155 },
      'bent-over-row-barbell': { iron: 50, bronze: 65, silver: 80, gold: 95, platinum: 115, diamond: 135, titanium: 160, mythic: 215 },
      'hip-thrust-barbell': { iron: 100, bronze: 130, silver: 165, gold: 210, platinum: 255, diamond: 310, titanium: 370, mythic: 515 },
      'lat-pulldown-machine': { iron: 60, bronze: 70, silver: 85, gold: 105, platinum: 125, diamond: 145, titanium: 165, mythic: 220 },
      'romanian-deadlift-barbell': { iron: 90, bronze: 110, silver: 130, gold: 155, platinum: 185, diamond: 210, titanium: 240, mythic: 320 },
      'bench-press-dumbbell': { iron: 25, bronze: 35, silver: 45, gold: 55, platinum: 65, diamond: 80, titanium: 95, mythic: 130 },
      'shoulder-press-dumbbell': { iron: 25, bronze: 30, silver: 35, gold: 45, platinum: 50, diamond: 60, titanium: 70, mythic: 90 },
    },
    '235-249': {
      'bench-press-barbell': { iron: 75, bronze: 95, silver: 115, gold: 140, platinum: 165, diamond: 190, titanium: 220, mythic: 300 },
      'squat-barbell': { iron: 115, bronze: 140, silver: 165, gold: 195, platinum: 230, diamond: 265, titanium: 300, mythic: 400 },
      'deadlift-barbell': { iron: 140, bronze: 165, silver: 195, gold: 225, platinum: 260, diamond: 300, titanium: 340, mythic: 445 },
      'shoulder-press-barbell': { iron: 50, bronze: 60, silver: 75, gold: 90, platinum: 105, diamond: 120, titanium: 140, mythic: 190 },
      'incline-bench-press-barbell': { iron: 65, bronze: 80, silver: 100, gold: 125, platinum: 150, diamond: 175, titanium: 205, mythic: 275 },
      'bicep-curl-barbell': { iron: 30, bronze: 40, silver: 50, gold: 65, platinum: 80, diamond: 95, titanium: 115, mythic: 160 },
      'bent-over-row-barbell': { iron: 55, bronze: 65, silver: 80, gold: 100, platinum: 120, diamond: 140, titanium: 160, mythic: 220 },
      'hip-thrust-barbell': { iron: 105, bronze: 135, silver: 170, gold: 215, platinum: 265, diamond: 320, titanium: 375, mythic: 525 },
      'lat-pulldown-machine': { iron: 60, bronze: 75, silver: 90, gold: 105, platinum: 125, diamond: 145, titanium: 170, mythic: 225 },
      'romanian-deadlift-barbell': { iron: 95, bronze: 115, silver: 135, gold: 160, platinum: 190, diamond: 215, titanium: 250, mythic: 330 },
      'bench-press-dumbbell': { iron: 25, bronze: 35, silver: 45, gold: 55, platinum: 70, diamond: 85, titanium: 100, mythic: 135 },
      'shoulder-press-dumbbell': { iron: 25, bronze: 30, silver: 40, gold: 45, platinum: 55, diamond: 60, titanium: 70, mythic: 95 },
    },
    '250+': {
      'bench-press-barbell': { iron: 80, bronze: 100, silver: 120, gold: 140, platinum: 170, diamond: 195, titanium: 225, mythic: 305 },
      'squat-barbell': { iron: 120, bronze: 145, silver: 170, gold: 200, platinum: 235, diamond: 270, titanium: 305, mythic: 405 },
      'deadlift-barbell': { iron: 140, bronze: 170, silver: 200, gold: 230, platinum: 265, diamond: 305, titanium: 345, mythic: 455 },
      'shoulder-press-barbell': { iron: 50, bronze: 65, silver: 75, gold: 90, platinum: 105, diamond: 125, titanium: 145, mythic: 190 },
      'incline-bench-press-barbell': { iron: 70, bronze: 85, silver: 105, gold: 125, platinum: 150, diamond: 180, titanium: 210, mythic: 280 },
      'bicep-curl-barbell': { iron: 30, bronze: 40, silver: 50, gold: 65, platinum: 80, diamond: 95, titanium: 115, mythic: 160 },
      'bent-over-row-barbell': { iron: 55, bronze: 70, silver: 85, gold: 100, platinum: 120, diamond: 140, titanium: 165, mythic: 220 },
      'hip-thrust-barbell': { iron: 105, bronze: 140, silver: 175, gold: 220, platinum: 270, diamond: 325, titanium: 380, mythic: 530 },
      'lat-pulldown-machine': { iron: 60, bronze: 75, silver: 90, gold: 110, platinum: 130, diamond: 150, titanium: 170, mythic: 225 },
      'romanian-deadlift-barbell': { iron: 95, bronze: 115, silver: 140, gold: 165, platinum: 190, diamond: 220, titanium: 250, mythic: 330 },
      'bench-press-dumbbell': { iron: 30, bronze: 35, silver: 45, gold: 55, platinum: 70, diamond: 85, titanium: 100, mythic: 140 },
      'shoulder-press-dumbbell': { iron: 25, bronze: 30, silver: 40, gold: 45, platinum: 55, diamond: 60, titanium: 70, mythic: 95 },
    },
  },
};

export function getCutoffs(exerciseId: string, gender: string, bracket: string): Record<Rank, number> | null {
  return rankCutoffs[gender]?.[bracket]?.[exerciseId] ?? null;
}

export default function getRankProgress(
  rank: Rank,
  allTimePR: number,
  cutoffs: Record<Rank, number>
): { currentCutoff: number; nextCutoff: number | null; nextRank: Rank | null; progress: number } {
  const idx = RANK_ORDER.indexOf(rank);
  const currentCutoff = cutoffs[rank];

  if (idx >= RANK_ORDER.length - 1) {
    return { currentCutoff, nextCutoff: null, nextRank: null, progress: 1 };
  }

  const nextRank = RANK_ORDER[idx + 1];
  const nextCutoff = cutoffs[nextRank];
  const range = nextCutoff - currentCutoff;
  const progress = range > 0 ? Math.min(Math.max((allTimePR - currentCutoff) / range, 0), 1) : 1;

  return { currentCutoff, nextCutoff, nextRank, progress };
}

export function computeRank(allTimePR: number, cutoffs: Record<Rank, number>): Rank | null {
  let result: Rank | null = null;
  for (const rank of RANK_ORDER) {
    if (allTimePR >= cutoffs[rank]) {
      result = rank;
    } else {
      break;
    }
  }
  return result;
}

export function getProgressForPR(
  allTimePR: number,
  rank: Rank | null,
  cutoffs: Record<Rank, number>
): { currentCutoff: number; nextCutoff: number | null; nextRank: Rank | null; progress: number } {
  if (!rank) {
    const first = cutoffs[RANK_ORDER[0]];
    return { currentCutoff: 0, nextCutoff: first, nextRank: RANK_ORDER[0], progress: first > 0 ? Math.min(allTimePR / first, 1) : 0 };
  }
  return getRankProgress(rank, allTimePR, cutoffs);
}

export const RANK_PERCENTILES: Record<Rank, number> = {
  iron: 5,
  bronze: 13,
  silver: 20,
  gold: 35,
  platinum: 50,
  diamond: 66,
  titanium: 80,
  mythic: 98,
};

export function computePercentile(allTimePR: number, cutoffs: Record<Rank, number>): number {
  if (allTimePR <= 0) return 0;

  const ironCutoff = cutoffs[RANK_ORDER[0]];
  if (allTimePR < ironCutoff) {
    return Math.round((allTimePR / ironCutoff) * RANK_PERCENTILES.iron);
  }

  for (let i = RANK_ORDER.length - 1; i >= 0; i--) {
    const rank = RANK_ORDER[i];
    if (allTimePR >= cutoffs[rank]) {
      const pctFloor = RANK_PERCENTILES[rank];
      if (i >= RANK_ORDER.length - 1) {
        return Math.min(Math.round(pctFloor + (allTimePR - cutoffs[rank]) * 0.01), 99);
      }
      const nextRank = RANK_ORDER[i + 1];
      const nextCutoff = cutoffs[nextRank];
      const pctCeil = RANK_PERCENTILES[nextRank];
      const range = nextCutoff - cutoffs[rank];
      const fraction = range > 0 ? (allTimePR - cutoffs[rank]) / range : 0;
      return Math.round(pctFloor + fraction * (pctCeil - pctFloor));
    }
  }

  return 0;
}

export const RANKED_EXERCISE_IDS = new Set([
  'bench-press-barbell',
  'bench-press-dumbbell',
  'bent-over-row-barbell',
  'bicep-curl-barbell',
  'deadlift-barbell',
  'hip-thrust-barbell',
  'incline-bench-press-barbell',
  'lat-pulldown-machine',
  'romanian-deadlift-barbell',
  'shoulder-press-barbell',
  'shoulder-press-dumbbell',
  'squat-barbell',
]);

export const RANKED_EXERCISES: { id: string; label: string }[] = [
  { id: 'bench-press-barbell', label: 'Bench Press (Barbell)' },
  { id: 'bench-press-dumbbell', label: 'Bench Press (Dumbbell)' },
  { id: 'bent-over-row-barbell', label: 'Bent Over Row (Barbell)' },
  { id: 'bicep-curl-barbell', label: 'Bicep Curl (Barbell)' },
  { id: 'deadlift-barbell', label: 'Deadlift (Barbell)' },
  { id: 'hip-thrust-barbell', label: 'Hip Thrust (Barbell)' },
  { id: 'incline-bench-press-barbell', label: 'Incline Bench Press (Barbell)' },
  { id: 'lat-pulldown-machine', label: 'Lat Pulldown (Machine)' },
  { id: 'romanian-deadlift-barbell', label: 'Romanian Deadlift (Barbell)' },
  { id: 'shoulder-press-barbell', label: 'Shoulder Press (Barbell)' },
  { id: 'shoulder-press-dumbbell', label: 'Shoulder Press (Dumbbell)' },
  { id: 'squat-barbell', label: 'Squat (Barbell)' },
];
