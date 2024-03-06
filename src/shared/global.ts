export abstract class Global {
    public static async time(callback: () => Promise<void>) {
        const start = performance.now();

        await callback();

        return Math.round(performance.now() - start);
    }
}
