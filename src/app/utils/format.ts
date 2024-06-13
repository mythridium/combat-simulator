import { Global } from 'src/app/global';
import { Lookup } from 'src/shared/utils/lookup';

export abstract class Format {
    public static getMonsterName(monsterId: string) {
        const monster = Lookup.monsters.getObjectByID(monsterId);
        const name = monster?.name;

        if (name === undefined) {
            Global.logger.error(`Unknown monster in getMonsterName`, monsterId);
            return 'Unknown Monster';
        }

        return this.replaceApostrophe(name);
    }

    public static replaceApostrophe(text: string) {
        return text.replace(/&apos;/g, "'");
    }
}
