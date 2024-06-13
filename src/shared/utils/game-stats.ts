import { Global } from 'src/shared/global';

export abstract class GameStats {
    public static compute() {
        // @ts-ignore // TODO: TYPES
        Global.get.game.modifiers.empty();

        for (const skill of Global.get.game.skills.allObjects) {
            // @ts-ignore // TODO: TYPES
            skill.computeProvidedStats(false);
        }

        Global.get.game.potions.computeProvidedStats(false);
        Global.get.game.petManager.computeProvidedStats(false);
        Global.get.game.shop.computeProvidedStats(false);

        // @ts-ignore // TODO: TYPES
        Global.get.game.combat.computeAllStats();

        Global.get.game.combat.player.setHitpoints(Global.get.game.combat.player.stats.maxHitpoints);

        // @ts-ignore // TODO: TYPES
        Global.get.game.combat.computeAllStats();
    }
}
