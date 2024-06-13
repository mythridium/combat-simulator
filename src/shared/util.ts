export class Util {
    /**
     }
     * Formats a number with the specified number of sigfigs, Addings suffixes as required
     * @param {number} number Number
     * @param {number} digits Number of significant digits
     * @return {string}
     */
    static mcsFormatNum(number: any, digits: any): string {
        const isNegative = number < 0;
        if (isNegative) {
            number = Math.abs(number);
        }
        let output = number.toPrecision(digits);
        let end = '';
        if (output.includes('e+')) {
            const power = parseInt(output.match(/\d*?$/));
            const powerCount = Math.floor(power / 3);
            output = `${output.match(/^[\d,\.]*/)}e+${power % 3}`;
            const formatEnd = ['', 'k', 'M', 'B', 'T'];
            if (powerCount < formatEnd.length) {
                end = formatEnd[powerCount];
            } else {
                end = `e${powerCount * 3}`;
            }
        }

        // @ts-expect-error TS(2554): Expected 0 arguments, but got 2.
        output = parseFloat(output).toFixed(6).toLocaleString(undefined, { minimumSignificantDigits: digits });
        output = isNegative ? -output : +output;

        return `${output}${end}`;
    }

    /**
     * Apply modifier without rounding
     */
    static averageDoubleMultiplier(modifier: any) {
        return 1 + modifier / 100;
    }

    static get isWebWorker() {
        return typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
    }

    static getOrigin() {
        const expected = ['/assets/css/oneui.css', '/assets/css/game.css', '/assets/css/fireworks.css'];
        const mainCss = Array.from(document.head.querySelectorAll<HTMLLinkElement>('#css-main'))
            .map(css => {
                let origin = css.href;

                for (const url of expected) {
                    origin = origin.replace(url, '').replace(gameFileVersion, '');
                }

                return origin;
            })
            .filter(url => !!url);

        const origin = mainCss[0];

        if (!origin) {
            throw new Error(
                `Failed to locate game origin: ${Array.from(
                    document.head.querySelectorAll<HTMLLinkElement>('#css-main')
                )
                    .map(link => link.href)
                    .join(', ')}`
            );
        }

        return origin;
    }
}
