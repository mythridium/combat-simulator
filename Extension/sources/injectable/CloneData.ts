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

interface ICloneDictionary {
    [name: string]: string;
}

/**
 * CloneData class, to clone some specific objects for transfer to the web workers
 */
class CloneData {
    constructor() {
    };

    equipmentSlotData = () => {
        const clone: ICloneDictionary = {};
        const base = equipmentSlotData;
        for (const key in base) {
            // @ts-expect-error HACK
            const data = { ...base[key] };
            data.imageElements = [];
            data.qtyElements = [];
            data.tooltips = [];
            data.quickEquipTooltip = [];
            clone[key] = data;
        }
        return clone;
    }

    modifierData = () => {
        const clone: ICloneDictionary = {};
        const base = modifierData;
        const knownKeys = [
            'description',
            'isNegative',
            'isSkill',
            'langDescription',
            'tags',
        ];
        for (const key in base) {
            // @ts-expect-error HACK
            const data = { ...base[key] };
            data.langDescription = '';
            for (const propKey in data) {
                const prop = data[propKey];
                if (knownKeys.includes(propKey) || prop.minimum !== undefined) {
                    continue;
                }
                if (prop.name === 'modifyValue') {
                    data.modifyValueClone = prop.toString();
                }
                data[propKey] = prop.name;
            }
            clone[key] = data;
        }
        return clone;
    }

    restoreModifierData = () => {
        const clone: ICloneDictionary = {};
        const base = modifierData;
        const knownKeys = [
            'description',
            'isNegative',
            'isSkill',
            'langDescription',
            'tags',
            'modifyValueClone',
        ];
        for (const key in base) {
            // @ts-expect-error HACK
            const data = base[key];
            for (const propKey in data) {
                const prop = data[propKey];
                if (knownKeys.includes(propKey) || prop.minimum !== undefined) {
                    continue;
                }
                let func = self[prop];
                if (prop === 'modifyValue') {
                    eval(`func = ${data.modifyValueClone}`);
                }
                if (func === undefined) {
                    console.log(`Unknown function ${prop} in web worker`);
                }
                // @ts-expect-error TS(2304): Cannot find name 'modifierData'.
                modifierData[key][propKey] = func;
            }
        }
        return clone;
    }
}