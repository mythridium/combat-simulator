/*  Melvor Idle Combat Simulator

    Modified Copyright (C) <2020, 2021> <G. Miclotte>
    Modified Copyright (C) <2022, 2023> <Broderick Hyman>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// export function SetupSpecialNames(){

//     this.micsr.commonSpecialNames = {
//         // general
//         chance: { implemented: true },
//         forceHit: { implemented: true },
//         // burn
//         burnDebuff: { implemented: true },
//         // slow
//         attackSpeedDebuff: { implemented: true },
//         attackSpeedDebuffTurns: { implemented: true },
//         // sleep
//         canSleep: { implemented: true },
//         sleepDamageMultiplier: { implemented: true },
//         sleepTurns: { implemented: true },
//         // stun
//         canStun: { implemented: true },
//         stunChance: { implemented: true },
//         stunDamageMultiplier: { implemented: true },
//         stunTurns: { implemented: true },
//         // fixed damage
//         setDamage: { implemented: true },
//         setHPDamage: { implemented: true },
//         // multi-attack
//         attackCount: { implemented: true },
//         attackInterval: { implemented: true },

//         // irrelevant
//         description: { implemented: true },
//         id: { implemented: true },
//         name: { implemented: true },

//     }

//     this.micsr.playerSpecialNames = {
//         // general
//         damageMultiplier: { implemented: true },
//         maxHit: { implemented: true },
//         extraDamage: { implemented: true },
//         extraBleedDmg: { implemented: true },

//         // bleed
//         bleedChance: { implemented: true },
//         bleedCount: { implemented: true },
//         bleedInterval: { implemented: true },
//         canBleed: { implemented: true },
//         totalBleedHP: { implemented: true },
//         totalBleedHPCustom: { implemented: true },
//         totalBleedHPPercent: { implemented: true },

//         // debuff
//         decreasedAccuracy: { implemented: true },
//         decreasedMagicEvasion: { implemented: true },
//         decreasedMeleeEvasion: { implemented: true },
//         decreasedRangedEvasion: { implemented: true },

//         // lifesteal
//         healsFor: { implemented: true },

//         // unique
//         stormsnap: { implemented: true },
//     };

//     this.micsr.enemySpecialNames = {
//         // general
//         modifiers: { implemented: true },

//         // buff
//         activeBuffs: { implemented: true },
//         activeBuffTurns: { implemented: true },
//         increasedAttackSpeed: { implemented: true },
//         increasedDamageReduction: { implemented: true },
//         increasedMeleeEvasion: { implemented: true },
//         increasedRangedEvasion: { implemented: true },
//         increasedMagicEvasion: { implemented: true },

//         // 50% of target max hit
//         customDamageModifier: { implemented: true },

//         // debuff
//         applyDebuffTurns: { implemented: true },
//         applyDebuffs: { implemented: true },
//         meleeEvasionDebuff: { implemented: true },
//         rangedEvasionDebuff: { implemented: true },
//         magicEvasionDebuff: { implemented: true },

//         // decrease player accuracy
//         decreasePlayerAccuracy: { implemented: true },
//         decreasePlayerAccuracyLimit: { implemented: true },
//         decreasePlayerAccuracyStack: { implemented: true },

//         // lifesteal
//         lifesteal: { implemented: true },
//         lifestealMultiplier: { implemented: true },

//         // reflect
//         reflectMelee: { implemented: true },
//         reflectRanged: { implemented: true },
//         reflectMagic: { implemented: true },

//         // unique
//         markOfDeath: { implemented: true },
//         intoTheMist: { implemented: true },

//         // DOT
//         DOTInterval: { implemented: true },
//         DOTMaxProcs: { implemented: true },
//         setDOTHeal: { implemented: true },
//     };

//     // report unknown stats
//     // @ts-expect-error TS(2304): Cannot find name 'attacks'.
//     Util.checkUnknown(this.micsr, attacks, 'Attacks', 'attacks', [this.micsr.commonSpecialNames, this.micsr.playerSpecialNames, this.micsr.enemySpecialNames], {});

//     // report stats that are known but not implemented
//     Util.checkImplemented(this.micsr, this.micsr.commonSpecialNames, 'Common special stat');
//     Util.checkImplemented(this.micsr, this.micsr.playerSpecialNames, 'Player special stat');
//     Util.checkImplemented(this.micsr, this.micsr.enemySpecialNames, 'Enemy special stat');
// }