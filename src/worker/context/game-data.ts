import { Global } from 'src/worker/global';
import { Simulator } from 'src/worker/simulator';
import { GameData as InitGameData } from 'src/shared/transport/type/init';

export abstract class GameData {
    public static async init(data: InitGameData) {
        SlayerTask.data = data.slayerTaskData;

        const importedNamespaces = Object.keys(data.namespaces).map(key => data.namespaces[key]);
        const impotedGamemodes = Object.keys(data.gamemodes).map(key => data.gamemodes[key]);
        const importedAgilityActions = Object.keys(data.agilityActions).map(key => data.agilityActions[key]);
        const importedAgilityPillars = Object.keys(data.agilityPillars).map(key => data.agilityPillars[key]);
        const importedAgilityElitePillars = Object.keys(data.agilityElitePillars).map(
            key => data.agilityElitePillars[key]
        );

        // @ts-expect-error
        Summoning.markLevels = data.summoningMarkLevels;

        Global.micsr.setupGame(Global.game, Global.game);

        importedNamespaces.forEach((stringifiedNamespace: string) => {
            const namespace = JSON.parse(stringifiedNamespace);

            if (!Global.game.registeredNamespaces.hasNamespace(namespace.name)) {
                Global.game.registeredNamespaces.registerNamespace(
                    namespace.name,
                    namespace.displayName,
                    namespace.isModded
                );
            }
        });

        impotedGamemodes.forEach((stringifiedGamemode: string) => {
            const [namespaceData, gamemodeData] = JSON.parse(stringifiedGamemode);

            if (namespaceData.isModded) {
                Global.game.gamemodes.registerObject(new Gamemode(namespaceData, gamemodeData, Global.game));
            } else {
                const gamemode = Global.game.gamemodes.find(
                    gamemode => gamemode.id === `${namespaceData.name}:${gamemodeData.id}`
                );

                if (gamemode) {
                    gamemode.hitpointMultiplier = gamemodeData.hitpointMultiplier;
                    gamemode.hasRegen = gamemodeData.hasRegen;
                }
            }
        });

        importedAgilityActions.forEach((stringifiedAction: string) => {
            const [namespaceData, obstacleData] = JSON.parse(stringifiedAction);
            Global.game.agility.actions.registerObject(new AgilityObstacle(namespaceData, obstacleData, Global.game));
        });

        importedAgilityPillars.forEach((stringifiedAction: string) => {
            const [namespaceData, obstacleData] = JSON.parse(stringifiedAction);
            Global.game.agility.pillars.registerObject(new AgilityPillar(namespaceData, obstacleData, Global.game));
        });

        importedAgilityElitePillars.forEach((stringifiedAction: string) => {
            const [namespaceData, obstacleData] = JSON.parse(stringifiedAction);
            Global.game.agility.elitePillars.registerObject(
                new AgilityPillar(namespaceData, obstacleData, Global.game)
            );
        });

        Global.simulator = new Simulator(Global.micsr);
    }
}
