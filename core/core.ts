export async function setup({ patch, api, onModsLoaded }: Modding.ModContext) {
    const modDataPackages: [DataNamespace, GameDataPackage][] = [];

    patch(Game, 'registerDataPackage').after((_, dataPackage) => {
        const namespace = game.registeredNamespaces.getNamespace(dataPackage.namespace);

        if (!namespace.isModded) {
            return;
        }

        modDataPackages.push([namespace, dataPackage]);
    });

    onModsLoaded(() => api({ mods: modDataPackages }));
}
