declare global {
    interface NativeManager {
        isMobile: boolean;
    }

    const nativeManager: NativeManager;
}

export {};
