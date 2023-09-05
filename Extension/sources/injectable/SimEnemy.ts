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

/**
 * SimEnemy class, allows creation of a functional Enemy object without affecting the game
 */
class SimEnemy extends Enemy {
    constructor(simManager: any, simGame: any) {
        super(simManager, simGame);
        this.detachGlobals();
    }

    _effectRenderer: any;

    get effectRenderer() {
        return this._effectRenderer;
    }

    _splashManager: any;

    get splashManager() {
        return this._splashManager;
    }

    // detach globals attached by parent constructor
    detachGlobals() {
        this._splashManager = {
            add: () => {},
        };
        this._effectRenderer = {
            queueRemoval: () => {},
            queueRemoveAll: () => {},
            removeEffects: () => {},
            addStun: () => {},
            addSleep: () => {},
            addCurse: () => {},
            addDOT: () => {},
            addReflexive: () => {},
            addStacking: () => {},
            addModifier: () => {},
        };
    }

    // Don't render
    render() {}
}
