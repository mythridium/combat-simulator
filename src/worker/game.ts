export class SimGame extends Game {
    constructor() {
        super();

        // @ts-ignore
        this.telemetry.ENABLE_TELEMETRY = false;
    }
}
