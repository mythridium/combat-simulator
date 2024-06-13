declare global {
    interface NativeManager {
        isMobile: boolean;
    }

    const nativeManager: NativeManager;

    interface Window {
        nativeManager: NativeManager;
    }
}

export {};
