export class ModalQueue {
    constructor(private readonly context: Modding.ModContext) {}

    public add(exception: Error | string, withTitle = true) {
        let html = '';

        if (this.isException(exception)) {
            html += `
                <h5 class="font-w400 text-combat-smoke font-size-sm mb-1">Oops! An error occurred during startup.</h5>
                <h5 class="font-w600 text-combat-smoke font-size-sm mt-3 mb-1">Please copy the following information and create a new issue</h5>
                <h5 class="font-w600 text-combat-smoke font-size-sm mt-2"><a href="https://github.com/mythridium/combat-simulator/issues" target="_blank">GitHub <span class="font-size-xs">(opens in new tab)</span></a></h5>
                <div class="form-group">
                <textarea class="text-danger form-control" id="combat-simulator-init-exception" rows="12" onclick="this.select();">
Mod Version: ${this.context.version}

${exception.stack}</textarea>
                </div>
                `;
        } else {
            html += `<div class="font-w400 font-size-sm text-danger">${exception}</div>`;
        }

        addModalToQueue({
            title: withTitle ? `[Myth] Combat Simulator` : undefined,
            html,
            allowOutsideClick: false,
            showCancelButton: false
        });
    }

    private isException(exception: string | Error): exception is Error {
        return typeof exception !== 'string';
    }
}
