'use client';
import { vars } from 'nativewind';

export const config = {
  light: vars({
    '--color-primary-0': '179 179 179',
    '--color-primary-50': '153 153 153',
    '--color-primary-100': '128 128 128',
    '--color-primary-200': '115 115 115',
    '--color-primary-300': '102 102 102',
    '--color-primary-400': '82 82 82',
    '--color-primary-500': '51 51 51',
    '--color-primary-600': '41 41 41',
    '--color-primary-700': '31 31 31',
    '--color-primary-800': '13 13 13',
    '--color-primary-900': '10 10 10',
    '--color-primary-950': '8 8 8',

    /* Secondary  */
    '--color-secondary-0': '253 253 253',
    '--color-secondary-50': '251 251 251',
    '--color-secondary-100': '246 246 246',
    '--color-secondary-200': '242 242 242',
    '--color-secondary-300': '237 237 237',
    '--color-secondary-400': '230 230 231',
    '--color-secondary-500': '217 217 219',
    '--color-secondary-600': '198 199 199',
    '--color-secondary-700': '189 189 189',
    '--color-secondary-800': '177 177 177',
    '--color-secondary-900': '165 164 164',
    '--color-secondary-950': '157 157 157',

    /* Tertiary */
    '--color-tertiary-0': '255 250 245',
    '--color-tertiary-50': '255 242 229',
    '--color-tertiary-100': '255 233 213',
    '--color-tertiary-200': '254 209 170',
    '--color-tertiary-300': '253 180 116',
    '--color-tertiary-400': '251 157 75',
    '--color-tertiary-500': '231 129 40',
    '--color-tertiary-600': '215 117 31',
    '--color-tertiary-700': '180 98 26',
    '--color-tertiary-800': '130 73 23',
    '--color-tertiary-900': '108 61 19',
    '--color-tertiary-950': '84 49 18',

    /* Error */
    '--color-error-0': '254 233 233',
    '--color-error-50': '254 226 226',
    '--color-error-100': '254 202 202',
    '--color-error-200': '252 165 165',
    '--color-error-300': '248 113 113',
    '--color-error-400': '239 68 68',
    '--color-error-500': '230 53 53',
    '--color-error-600': '220 38 38',
    '--color-error-700': '185 28 28',
    '--color-error-800': '153 27 27',
    '--color-error-900': '127 29 29',
    '--color-error-950': '83 19 19',

    /* Success */
    '--color-success-0': '228 255 244',
    '--color-success-50': '202 255 232',
    '--color-success-100': '162 241 192',
    '--color-success-200': '132 211 162',
    '--color-success-300': '102 181 132',
    '--color-success-400': '72 151 102',
    '--color-success-500': '52 131 82',
    '--color-success-600': '42 121 72',
    '--color-success-700': '32 111 62',
    '--color-success-800': '22 101 52',
    '--color-success-900': '20 83 45',
    '--color-success-950': '27 50 36',

    /* Warning */
    '--color-warning-0': '255 249 245',
    '--color-warning-50': '255 244 236',
    '--color-warning-100': '255 231 213',
    '--color-warning-200': '254 205 170',
    '--color-warning-300': '253 173 116',
    '--color-warning-400': '251 149 75',
    '--color-warning-500': '231 120 40',
    '--color-warning-600': '215 108 31',
    '--color-warning-700': '180 90 26',
    '--color-warning-800': '130 68 23',
    '--color-warning-900': '108 56 19',
    '--color-warning-950': '84 45 18',

    /* Info */
    '--color-info-0': '236 248 254',
    '--color-info-50': '199 235 252',
    '--color-info-100': '162 221 250',
    '--color-info-200': '124 207 248',
    '--color-info-300': '87 194 246',
    '--color-info-400': '50 180 244',
    '--color-info-500': '13 166 242',
    '--color-info-600': '11 141 205',
    '--color-info-700': '9 115 168',
    '--color-info-800': '7 90 131',
    '--color-info-900': '5 64 93',
    '--color-info-950': '3 38 56',

    /* Typography */
    '--color-typography-0': '254 254 255',
    '--color-typography-50': '245 245 245',
    '--color-typography-100': '229 229 229',
    '--color-typography-200': '219 219 220',
    '--color-typography-300': '212 212 212',
    '--color-typography-400': '163 163 163',
    '--color-typography-500': '140 140 140',
    '--color-typography-600': '115 115 115',
    '--color-typography-700': '82 82 82',
    '--color-typography-800': '64 64 64',
    '--color-typography-800': '38 38 39',
    '--color-typography-950': '23 23 23',

    /* Outline */
    '--color-outline-0': '253 254 254',
    '--color-outline-50': '243 243 243',
    '--color-outline-100': '230 230 230',
    '--color-outline-200': '221 220 219',
    '--color-outline-300': '211 211 211',
    '--color-outline-400': '165 163 163',
    '--color-outline-500': '140 141 141',
    '--color-outline-600': '115 116 116',
    '--color-outline-700': '83 82 82',
    '--color-outline-800': '65 65 65',
    '--color-outline-900': '39 38 36',
    '--color-outline-950': '26 23 23',

    /* Background */
    '--color-background-0': '255 255 255',
    '--color-background-50': '246 246 246',
    '--color-background-100': '242 241 241',
    '--color-background-200': '220 219 219',
    '--color-background-300': '213 212 212',
    '--color-background-400': '162 163 163',
    '--color-background-500': '142 142 142',
    '--color-background-600': '116 116 116',
    '--color-background-700': '83 82 82',
    '--color-background-800': '65 64 64',
    '--color-background-900': '39 38 37',
    '--color-background-950': '18 18 18',

    /* Background Special */
    '--color-background-error': '254 241 241',
    '--color-background-warning': '255 243 234',
    '--color-background-success': '237 252 242',
    '--color-background-muted': '247 248 247',
    '--color-background-info': '235 248 254',

    /* Focus Ring Indicator  */
    '--color-indicator-primary': '55 55 55',
    '--color-indicator-info': '83 153 236',
    '--color-indicator-error': '185 28 28',
  }),
  dark: vars({
    /* Theme Colors */

/* =========================
   🔵 Blue Theme
   ========================= */
   '--color-blue-background': '10 15 28',     /* rgb(10, 15, 28)  — darker navy background */
   '--color-blue-button':     '22 32 56',     /* rgb(22, 32, 56)  — deep blue-gray button */
   '--color-blue-accent':     '58 112 172',   /* rgb(58, 112, 172) — muted blue accent */
   '--color-blue-light':      '140 175 220',  /* rgb(140, 175, 220) — soft light blue highlight */
   '--color-blue-steelGray':  '85 95 110',    /* rgb(85, 95, 110) — dark steel-blue neutral */
   '--color-blue-lightGray':  '120 135 155',  /* rgb(120, 135, 155) — muted gray-blue panels */
   '--color-blue-lightText':  '174 199 239',  /* #aec7ef — bright, cool blue-tinted text */

/* =========================
   🟦 Cyan Theme
   ========================= */
   '--color-cyan-background': '8 18 22',      /* rgb(8, 18, 22) — deep teal-black background */
   '--color-cyan-button':     '18 36 44',     /* rgb(18, 36, 44) — dark cyan-gray button */
   '--color-cyan-accent':     '45 150 160',   /* rgb(45, 150, 160) — muted teal accent */
   '--color-cyan-light':      '130 195 200',  /* rgb(130, 195, 200) — soft pale teal highlight */
   '--color-cyan-steelGray':  '85 105 110',   /* rgb(85, 105, 110) — dark cyan-gray neutral */
   '--color-cyan-lightGray':  '130 150 155',  /* rgb(130, 150, 155) — desaturated cyan-gray panel */
   '--color-cyan-lightText':  '185 222 229',  /* #b9dee5 — bright aqua, slightly desaturated */

/* =========================
   💗 Pink Theme
   ========================= */
   '--color-pink-background': '25 12 20',     /* rgb(25, 12, 20) — dark wine background */
   '--color-pink-button':     '45 20 35',     /* rgb(45, 20, 35) — deep burgundy-pink button */
   '--color-pink-accent':     '185 75 130',   /* rgb(185, 75, 130) — muted rose accent */
   '--color-pink-light':      '225 155 185',  /* rgb(225, 155, 185) — soft pink highlight */
   '--color-pink-steelGray':  '100 85 95',    /* rgb(100, 85, 95) — gray with pink undertone */
   '--color-pink-lightGray':  '145 130 140',  /* rgb(145, 130, 140) — desaturated rose-gray panel */
   '--color-pink-lightText':  '235 200 220',  /* #ebc8dc — bright rosy text, softened */

/* =========================
   🟢 Green Theme
   ========================= */
   '--color-green-background': '8 15 10',     /* rgb(8, 15, 10) — near-black green background */
   '--color-green-button':     '20 45 28',    /* rgb(20, 45, 28) — deep moss green button */
   '--color-green-accent':     '70 150 95',   /* rgb(70, 150, 95) — muted forest green accent */
   '--color-green-light':      '150 195 160', /* rgb(150, 195, 160) — pale forest highlight */
   '--color-green-steelGray':  '90 105 95',   /* rgb(90, 105, 95) — cool gray-green neutral */
   '--color-green-lightGray':  '140 155 145', /* rgb(140, 155, 145) — moss-gray panel */
   '--color-green-lightText':  '195 230 210',  /* #c3e6d2 — bright mint, a bit muted */
/* =========================
   🟠 Orange Theme
   ========================= */
   '--color-orange-background': '18 10 6',     /* rgb(18, 10, 6) — very dark brown-black background */
   '--color-orange-button':     '45 25 15',    /* rgb(45, 25, 15) — deep bronze-orange button */
   '--color-orange-accent':     '200 120 60',  /* rgb(200, 120, 60) — muted amber accent */
   '--color-orange-light':      '225 175 130', /* rgb(225, 175, 130) — soft orange highlight */
   '--color-orange-steelGray':  '100 90 80',   /* rgb(100, 90, 80) — dark neutral brown-gray */
   '--color-orange-lightGray':  '150 135 120',
   '--color-orange-lightText':  '230 210 190',  /* #e6d2be — warm amber-tinted light text */


    /* Primary */
    '--color-primary-0': '166 166 166', /* #a6a6a6 */
    '--color-primary-50': '175 175 175', /* #afafaf */
    '--color-primary-100': '186 186 186', /* #bababa */
    '--color-primary-200': '197 197 197', /* #c5c5c5 */
    '--color-primary-300': '212 212 212', /* #d4d4d4 */
    '--color-primary-400': '221 221 221', /* #dddddd */
    '--color-primary-500': '230 230 230', /* #e6e6e6 */
    '--color-primary-600': '240 240 240', /* #f0f0f0 */
    '--color-primary-700': '250 250 250', /* #fafafa */
    '--color-primary-800': '253 253 253', /* #fdfdfd */
    '--color-primary-900': '254 249 249', /* #fef9f9 */
    '--color-primary-950': '253 252 252', /* #fdfcfc */

    /* Secondary  */
    '--color-secondary-0': '20 20 20', /* #141414 */
    '--color-secondary-50': '23 23 23', /* #171717 */
    '--color-secondary-100': '31 31 31', /* #1f1f1f */
    '--color-secondary-200': '39 39 39', /* #272727 */
    '--color-secondary-300': '44 44 44', /* #2c2c2c */
    '--color-secondary-400': '56 57 57', /* #383939 */
    '--color-secondary-500': '63 64 64', /* #3f4040 */
    '--color-secondary-600': '86 86 86', /* #565656 */
    '--color-secondary-700': '110 110 110', /* #6e6e6e */
    '--color-secondary-800': '135 135 135', /* #878787 */
    '--color-secondary-900': '150 150 150', /* #969696 */
    '--color-secondary-950': '164 164 164', /* #a4a4a4 */

    /* Tertiary */
    '--color-tertiary-0': '84 49 18', /* #543112 */
    '--color-tertiary-50': '108 61 19', /* #6c3d13 */
    '--color-tertiary-100': '130 73 23', /* #824917 */
    '--color-tertiary-200': '180 98 26', /* #b4621a */
    '--color-tertiary-300': '215 117 31', /* #d7751f */
    '--color-tertiary-400': '231 129 40', /* #e78128 */
    '--color-tertiary-500': '251 157 75', /* #fb9d4b */
    '--color-tertiary-600': '253 180 116', /* #fdb474 */
    '--color-tertiary-700': '254 209 170', /* #fed1aa */
    '--color-tertiary-800': '255 233 213', /* #ffe9d5 */
    '--color-tertiary-900': '255 242 229', /* #fff2e5 */
    '--color-tertiary-950': '255 250 245', /* #fffaf5 */

    /* Error */
    '--color-error-0': '83 19 19', /* #531313 */
    '--color-error-50': '127 29 29', /* #7f1d1d */
    '--color-error-100': '153 27 27', /* #991b1b */
    '--color-error-200': '185 28 28', /* #b91c1c */
    '--color-error-300': '220 38 38', /* #dc2626 */
    '--color-error-400': '230 53 53', /* #e63535 */
    '--color-error-500': '239 68 68', /* #ef4444 */
    '--color-error-600': '249 97 96', /* #f96160 */
    '--color-error-700': '229 91 90', /* #e55b5a */
    '--color-error-800': '254 202 202', /* #fecaca */
    '--color-error-900': '254 226 226', /* #fee2e2 */
    '--color-error-950': '254 233 233', /* #fee9e9 */

    /* Success */
    '--color-success-0': '27 50 36', /* #1b3224 */
    '--color-success-50': '20 83 45', /* #14532d */
    '--color-success-100': '22 101 52', /* #166534 */
    '--color-success-200': '32 111 62', /* #206f3e */
    '--color-success-300': '42 121 72', /* #2a7948 */
    '--color-success-400': '52 131 82', /* #348352 */
    '--color-success-500': '72 151 102', /* #489766 */
    '--color-success-600': '102 181 132', /* #66b584 */
    '--color-success-700': '132 211 162', /* #84d3a2 */
    '--color-success-800': '162 241 192', /* #a2f1c0 */
    '--color-success-900': '202 255 232', /* #caffe8 */
    '--color-success-950': '228 255 244', /* #e4fff4 */

    /* Warning */
    '--color-warning-0': '84 45 18', /* #542d12 */
    '--color-warning-50': '108 56 19', /* #6c3813 */
    '--color-warning-100': '130 68 23', /* #824417 */
    '--color-warning-200': '180 90 26', /* #b45a1a */
    '--color-warning-300': '215 108 31', /* #d76c1f */
    '--color-warning-400': '231 120 40', /* #e77828 */
    '--color-warning-500': '251 149 75', /* #fb954b */
    '--color-warning-600': '253 173 116', /* #fdad74 */
    '--color-warning-700': '254 205 170', /* #fecdaa */
    '--color-warning-800': '255 231 213', /* #ffe7d5 */
    '--color-warning-900': '255 244 237', /* #fff4ed */
    '--color-warning-950': '255 249 245', /* #fff9f5 */

    /* Info */
    '--color-info-0': '3 38 56', /* #032638 */
    '--color-info-50': '5 64 93', /* #05405d */
    '--color-info-100': '7 90 131', /* #075a83 */
    '--color-info-200': '9 115 168', /* #0973a8 */
    '--color-info-300': '11 141 205', /* #0b8dcd */
    '--color-info-400': '13 166 242', /* #0da6f2 */
    '--color-info-500': '50 180 244', /* #32b4f4 */
    '--color-info-600': '87 194 246', /* #57c2f6 */
    '--color-info-700': '124 207 248', /* #7ccff8 */
    '--color-info-800': '162 221 250', /* #a2ddfa */
    '--color-info-900': '199 235 252', /* #c7ebfc */
    '--color-info-950': '236 248 254', /* #ecf8fe */

    /* Typography */
    '--color-typography-0': '23 23 23', /* #171717 */
    '--color-typography-50': '38 38 39', /* #262627 */
    '--color-typography-100': '64 64 64', /* #404040 */
    '--color-typography-200': '82 82 82', /* #525252 */
    '--color-typography-300': '115 115 115', /* #737373 */
    '--color-typography-400': '140 140 140', /* #8c8c8c */
    '--color-typography-500': '163 163 163', /* #a3a3a3 */
    '--color-typography-600': '212 212 212', /* #d4d4d4 */
    '--color-typography-700': '219 219 220', /* #dbdbdc */
    '--color-typography-800': '229 229 229', /* #e5e5e5 */
    '--color-typography-800': '245 245 245', /* #f5f5f5 */
    '--color-typography-950': '254 254 255', /* #fefeff */

    /* Outline */
    '--color-outline-0': '26 23 23', /* #1a1717 */
    '--color-outline-50': '39 38 36', /* #272624 */
    '--color-outline-100': '65 65 65', /* #414141 */
    '--color-outline-200': '83 82 82', /* #535252 */
    '--color-outline-300': '115 116 116', /* #737474 */
    '--color-outline-400': '140 141 141', /* #8c8d8d */
    '--color-outline-500': '165 163 163', /* #a5a3a3 */
    '--color-outline-600': '211 211 211', /* #d3d3d3 */
    '--color-outline-700': '221 220 219', /* #dddcdc */
    '--color-outline-800': '230 230 230', /* #e6e6e6 */
    '--color-outline-900': '243 243 243', /* #f3f3f3 */
    '--color-outline-950': '253 254 254', /* #fdfefe */

    /* Background */
    '--color-background-0': '18 18 18', /* #121212 */
    '--color-background-50': '39 38 37', /* #272625 */
    '--color-background-100': '65 64 64', /* #414040 */
    '--color-background-200': '83 82 82', /* #535252 */
    '--color-background-300': '116 116 116', /* #747474 */
    '--color-background-400': '142 142 142', /* #8e8e8e */
    '--color-background-500': '162 163 163', /* #a2a3a3 */
    '--color-background-600': '213 212 212', /* #d5d4d4 */
    '--color-background-700': '229 228 228', /* #e5e4e4 */
    '--color-background-800': '242 241 241', /* #f2f1f1 */
    '--color-background-900': '246 246 246', /* #f6f6f6 */
    '--color-background-950': '255 255 255', /* #ffffff */

    /* Background Special */
    '--color-background-error': '66 43 43', /* #422b2b */
    '--color-background-warning': '65 47 35', /* #412f23 */
    '--color-background-success': '28 43 33', /* #1c2b21 */
    '--color-background-muted': '51 51 51', /* #333333 */
    '--color-background-info': '26 40 46', /* #1a282e */

    /* Focus Ring Indicator  */
    '--color-indicator-primary': '247 247 247', /* #f7f7f7 */
    '--color-indicator-info': '161 199 245', /* #a1c7f5 */
    '--color-indicator-error': '232 70 69', /* #e84645 */
  }),
};
