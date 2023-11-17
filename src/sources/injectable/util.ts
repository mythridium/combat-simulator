/*  Melvor Idle Combat Simulator

    Copyright (C) <2020>  <Coolrox95>
    Modified Copyright (C) <2020> <Visua0>
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

class Util {
    /**
     }
     * Formats a number with the specified number of sigfigs, Addings suffixes as required
     * @param {number} number Number
     * @param {number} digits Number of significant digits
     * @return {string}
     */
    static mcsFormatNum(number: any, digits: any): string {
        const isNegative = number < 0;
        if (isNegative) {
            number = Math.abs(number);
        }
        let output = number.toPrecision(digits);
        let end = '';
        if (output.includes('e+')) {
            const power = parseInt(output.match(/\d*?$/));
            const powerCount = Math.floor(power / 3);
            output = `${output.match(/^[\d,\.]*/)}e+${power % 3}`;
            const formatEnd = ['', 'k', 'M', 'B', 'T'];
            if (powerCount < formatEnd.length) {
                end = formatEnd[powerCount];
            } else {
                end = `e${powerCount * 3}`;
            }
        }

        // @ts-expect-error TS(2554): Expected 0 arguments, but got 2.
        output = parseFloat(output).toFixed(6).toLocaleString(undefined, { minimumSignificantDigits: digits });
        output = isNegative ? -output : +output;

        return `${output}${end}`;
    }

    /**
     * Creates an id for an element from a name
     * @param {string} name The name describing the element
     * @returns An id starting with 'mcs-' and ending with the name in lowercase with spaces replaced by '-'
     */
    static toId(name: any) {
        return `mcs-${name.toLowerCase().replace(/ /g, '-')}`;
    }

    static checkImplemented(micsr: MICSR, stats: any, tag: any) {
        if (!micsr.isDev) {
            return;
        }
        Object.getOwnPropertyNames(stats).forEach(stat => {
            if (Array.isArray(stats[stat])) {
                for (const substat of stats[stat]) {
                    if (!substat.implemented) {
                        micsr.warn(tag + ' not yet implemented: ' + stat);
                    }
                }
            } else if (!stats[stat].implemented) {
                micsr.warn(tag + ' stat not yet implemented: ' + stat);
            }
        })
    }

    static checkUnknown(micsr: MICSR, set: any, tag: any, elementType: any, knownSets: any, broken: any) {
        if (!micsr.isDev) {
            return;
        }
        // construct a list of stats that are not in any of the previous categories
        const unknownStatNames = {};
        set.forEach((element: any) => {
            Object.getOwnPropertyNames(element).forEach(stat => {
                // check if any bugged stats are still present
                if (broken[stat] !== undefined) {
                    micsr.warn(tag + ' stat ' + stat + ' is bugged for ' + element.name + '!')
                    return;
                }
                // check if we already know this stat
                for (const known of knownSets) {
                    if (known[stat] !== undefined) {
                        return;
                    }
                }
                // unknown stat found !
                // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
                if (unknownStatNames[stat] === undefined) {
                    // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
                    unknownStatNames[stat] = [];
                }
                // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
                unknownStatNames[stat].push(element.name);
            })
        })

        Object.getOwnPropertyNames(unknownStatNames).forEach(stat => {
            // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
            micsr.warn('Unknown stat ' + stat + ' for ' + elementType + ': ', unknownStatNames[stat]);
        });
    }

    /**
     * Apply modifier without rounding
     */
    static averageDoubleMultiplier(modifier: any) {
        return 1 + modifier / 100;
    }
}
