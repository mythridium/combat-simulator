export abstract class Notify {
    private static readonly combat = 'assets/media/skills/combat/combat.png';

    public static message(message: string, type: StandardTheme = 'success', image = this.combat) {
        imageNotify(image, message, type);
    }
}
