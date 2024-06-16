import { Global } from 'src/shared/global';

export abstract class GameStats {
    public static compute() {
        Global.get.game.modifiers.empty();

        for (const skill of Global.get.game.skills.allObjects) {
            skill.computeProvidedStats(false);
        }

        Global.get.game.potions.computeProvidedStats(false);
        Global.get.game.petManager.computeProvidedStats(false);
        Global.get.game.shop.computeProvidedStats(false);

        Global.get.game.combat.computeAllStats();

        Global.get.game.combat.player.setHitpoints(Global.get.game.combat.player.stats.maxHitpoints);

        Global.get.game.combat.computeAllStats();
    }
}
