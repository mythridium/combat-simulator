export abstract class Scripts {
    private static include = ['melvor', 'cdnjs', 'polyfill'];
    private static exclude = [
        'oneui',
        'ion',
        'jquery',
        'pixi',
        'basis',
        'viewport',
        'cloud.js',
        'cloudManager',
        'cartographyMenu',
        'sidebar'
    ];

    public static getScriptsForWorker() {
        const scripts: string[] = [];

        const allScripts = Array.from(document.querySelectorAll('script'));

        for (const script of allScripts) {
            const src = script.src.toLowerCase();

            if (this.matches(this.include, src) && !this.matches(this.exclude, src)) {
                scripts.push(script.src);
            }
        }

        return scripts;
    }

    private static matches(inclusions: string[], src: string) {
        return inclusions.some(lookup => src.includes(lookup.toLowerCase()));
    }
}
