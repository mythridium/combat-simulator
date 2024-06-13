import type { Global as GlobalClient } from 'src/app/global';
import type { Global as GlobalWorker } from 'src/worker/global';
import { Util } from './util';

export abstract class SharedGlobal {
    public static cancelStatus = false;

    public static readonly combatSkillLocalIds = [
        'Attack',
        'Strength',
        'Defence',
        'Hitpoints',
        'Ranged',
        'Magic',
        'Prayer',
        'Slayer'
    ];

    public static readonly combatAbyssalSkillLocalIds = [
        'Attack',
        'Strength',
        'Defence',
        'Hitpoints',
        'Ranged',
        'Magic',
        'Prayer',
        'Slayer',
        'Corruption'
    ];

    public static readonly ancientRelicMelvorSkillKeys = [
        'Attack',
        'Strength',
        'Defence',
        'Hitpoints',
        'Ranged',
        'Magic',
        'Prayer',
        'Slayer',
        'Firemaking',
        'Cooking',
        'Smithing',
        'Agility',
        'Summoning',
        'Astrology'
    ];

    public static readonly ancientRelicAbyssalSkillKeys = [
        'Attack',
        'Strength',
        'Defence',
        'Hitpoints',
        'Ranged',
        'Magic',
        'Prayer',
        'Slayer',
        'Firemaking',
        'Cooking',
        'Thieving',
        'Fletching',
        'Summoning',
        'Runecrafting',
        'Herblore',
        'Corruption'
    ];

    public static readonly skillIds: { [index: string]: string } = {};

    public static currentGamemodeId: string;

    public static async time(callback: () => Promise<void>) {
        const start = performance.now();

        await callback();

        return Math.round(performance.now() - start);
    }
}

export abstract class Global {
    private static _client: typeof GlobalClient;
    private static _worker: typeof GlobalWorker;

    public static get get(): typeof GlobalClient | typeof GlobalWorker {
        return Util.isWebWorker ? this.worker : this.client;
    }

    public static get client() {
        if (!this._client) {
            throw new Error(
                `Global Client is not defined, you are either calling this from the worker or never set it in the client. You doofus!`
            );
        }

        return this._client;
    }

    public static get worker() {
        if (!this._worker) {
            throw new Error(
                `Global Worker is not defined, you are either calling this from the client or never set it in the worker. You doofus!`
            );
        }

        return this._worker;
    }

    public static setClient(global: typeof GlobalClient) {
        if (this._client || this._worker) {
            throw new Error(`A worker has already been initialised, can only have one global object.`);
        }

        this._client = global;
        self.mcs.global = this._client;
    }

    public static setWorker(global: typeof GlobalWorker) {
        if (this._client || this._worker) {
            throw new Error(`A worker has already been initialised, can only have one global object.`);
        }

        this._worker = global;
        self.mcs.global = this._worker;
    }
}
