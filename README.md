# [Myth] Combat Simulator

Do not expect this tool to be 100% accurate, backup your saves, especially your hardcore characters.

This is a re-branded and updated version of Combat Simulator Reloaded.

The latest fork in a line of great but no longer maintained forks by [broderickhyman](https://github.com/broderickhyman/Melvor-Idle-Combat-Simulator-Reloaded), and [coolrox95](https://github.com/coolrox95/Melvor-Idle-Combat-Simulator), and [visua0](https://github.com/visua0/Melvor-Idle-Combat-Simulator-Reloaded).

## Before you start
- Create a backup of your save file before using this extension, in particular after a recent game or extension update.

## Bug reports
Raise an [issue](https://github.com/mythridium/combat-simulator/issues) here on GitHub

### Instructions
1. Open the simulator through the game's sidebar.
2. Import your setup (gear, levels, spell selection, agility course, etc.), each button corresponds to an equipment set.
3. Make any desired changes to your setup.
4. In the chart select a monster or dungeon by clicking above its icon.
5. Use the "Simulate Selected" button to simulate the selected entity.
6. Alternatively, use the "Simulate All" button to simulate all entities that are not disabled.

### Modding
v3 has added basic support for modded data. Any data that has been added through json or the data builder will be pushed into combat sim. This needs to be opted in by mod developers so that mods don't unintentionally break the sim. To do this, call the following `mod.api.mythCombatSimulator?.registerNamespace('your mods namespace');`

This needs to be done before the `onInterfaceReady` context callback as that's when combat sim is loaded.

Custom skills are not supported and mocked inside the simulator to prevent errors, patched functions are not supported, this is purely custom data, such as items, prayers, equipment slots, etc will flow into combat sim.

You can use `mod.api.mythCombatSimulator?.registeredNamespaces()` to return the list of current mods that have registered with combat sim. Note, that this may be inaccurate depending on when you call it, if you call it before another mod has registered, it won't show in the list. Probably the safest time to call is during `onInterfaceAvailable`, this is the last callback before `onInterfaceReady` when combat sim executes the registrations.
