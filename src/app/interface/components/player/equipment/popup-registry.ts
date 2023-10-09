import { EquipmentPopup } from './equipment-popup';

export abstract class PopupRegistry {
    private static popups: EquipmentPopup[] = [];

    public static register(popup: EquipmentPopup) {
        this.popups.push(popup);
    }

    public static clear() {
        this.hide();
        this.popups = [];
    }

    public static get(id: string) {
        return this.popups.find(popup => popup.options.id === id);
    }

    public static show() {
        const notVisible = this.popups.filter(popup => !popup.isVisible);

        for (const popup of notVisible) {
            popup.show();
        }
    }

    public static hide(except?: EquipmentPopup) {
        const visible = this.popups.filter(popup => popup.isVisible && popup !== except);

        for (const popup of visible) {
            popup.hide();
        }
    }
}
