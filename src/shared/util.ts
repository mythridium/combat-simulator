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

export class Util {
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

    /**
     * Apply modifier without rounding
     */
    static averageDoubleMultiplier(modifier: any) {
        return 1 + modifier / 100;
    }

    static get isWebWorker() {
        return typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
    }
}
