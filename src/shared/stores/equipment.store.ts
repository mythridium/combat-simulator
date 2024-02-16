export class EquipmentStore {
    public passive?: EquipSlot;
    public helmet?: EquipSlot;
    public consumable?: EquipSlot;
    public cape?: EquipSlot;
    public amulet?: EquipSlot;
    public quiver?: EquipSlot;
    public weapon?: EquipSlot;
    public platebody?: EquipSlot;
    public shield?: EquipSlot;
    public gem?: EquipSlot;
    public platelegs?: EquipSlot;
    public gloves?: EquipSlot;
    public boots?: EquipSlot;
    public ring?: EquipSlot;
    public summon1?: EquipSlot;
    public summon2?: EquipSlot;

    public combatStyle: AttackStyle;
}

export interface EquipmentStoreData {
    passive?: string | AnyItemData;
    helmet?: string | AnyItemData;
    consumable?: string | AnyItemData;
    cape?: string | AnyItemData;
    amulet?: string | AnyItemData;
    quiver?: string | AnyItemData;
    weapon?: string | AnyItemData;
    platebody?: string | AnyItemData;
    shield?: string | AnyItemData;
    gem?: string | AnyItemData;
    platelegs?: string | AnyItemData;
    gloves?: string | AnyItemData;
    boots?: string | AnyItemData;
    ring?: string | AnyItemData;
    summon1?: string | AnyItemData;
    summon2?: string | AnyItemData;

    combatStyle?: string | AttackStyleData;
}
