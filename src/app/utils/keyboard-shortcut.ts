export const DEFAULT_TOGGLE_PANEL_KEYBIND = 'C';

export function isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    return (
        target.isContentEditable ||
        target.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""]') !== null
    );
}

export function normalizeShortcutInput(value: string): string | null {
    if (!value) {
        return null;
    }

    const parts = value
        .split('+')
        .map(part => part.trim())
        .filter(Boolean);

    if (!parts.length) {
        return null;
    }

    const modifierSet = new Set(['Ctrl', 'Alt', 'Shift', 'Meta']);
    const modifiers: string[] = [];
    let key = '';

    for (const part of parts) {
        const canonicalPart = canonicalizeKey(part);

        if (!canonicalPart) {
            return null;
        }

        if (modifierSet.has(canonicalPart)) {
            if (!modifiers.includes(canonicalPart)) {
                modifiers.push(canonicalPart);
            }

            continue;
        }

        if (key) {
            return null;
        }

        key = canonicalPart;

        if (isDisallowedBindableKey(key)) {
            return null;
        }
    }

    if (!key) {
        return null;
    }

    const orderedModifiers = ['Ctrl', 'Alt', 'Shift', 'Meta'].filter(modifier => modifiers.includes(modifier));

    return [...orderedModifiers, key].join('+');
}

export function eventToShortcut(event: KeyboardEvent): string | null {
    const key = canonicalizeKey(event.key);

    if (!key || isModifierKey(key)) {
        return null;
    }

    const parts: string[] = [];

    if (event.ctrlKey) {
        parts.push('Ctrl');
    }

    if (event.altKey) {
        parts.push('Alt');
    }

    if (event.shiftKey) {
        parts.push('Shift');
    }

    if (event.metaKey) {
        parts.push('Meta');
    }

    parts.push(key);

    return normalizeShortcutInput(parts.join('+'));
}

export function doesEventMatchShortcut(event: KeyboardEvent, shortcut: string | null | undefined): boolean {
    if (!shortcut) {
        return false;
    }

    const normalizedShortcut = normalizeShortcutInput(shortcut);
    const eventShortcut = eventToShortcut(event);

    if (!normalizedShortcut || !eventShortcut) {
        return false;
    }

    return normalizedShortcut === eventShortcut;
}

function canonicalizeKey(value: string): string | null {
    if (!value) {
        return null;
    }

    const key = value.trim();

    if (!key) {
        return null;
    }

    if (key.length === 1) {
        if (key === ' ') {
            return 'Space';
        }

        return key.toUpperCase();
    }

    const aliases: Record<string, string> = {
        Escape: 'Escape',
        Esc: 'Escape',
        Enter: 'Enter',
        Tab: 'Tab',
        Backspace: 'Backspace',
        Delete: 'Delete',
        Insert: 'Insert',
        Home: 'Home',
        End: 'End',
        PageUp: 'PageUp',
        PageDown: 'PageDown',
        ArrowUp: 'ArrowUp',
        ArrowDown: 'ArrowDown',
        ArrowLeft: 'ArrowLeft',
        ArrowRight: 'ArrowRight',
        Space: 'Space',
        Spacebar: 'Space',
        Control: 'Ctrl',
        Ctrl: 'Ctrl',
        Alt: 'Alt',
        Shift: 'Shift',
        Meta: 'Meta'
    };

    if (aliases[key]) {
        return aliases[key];
    }

    if (/^F([1-9]|1[0-2])$/i.test(key)) {
        return key.toUpperCase();
    }

    return null;
}

function isModifierKey(key: string): boolean {
    return key === 'Ctrl' || key === 'Alt' || key === 'Shift' || key === 'Meta';
}

function isDisallowedBindableKey(key: string): boolean {
    return key === 'Escape';
}
