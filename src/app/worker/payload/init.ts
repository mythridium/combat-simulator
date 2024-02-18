export class InitPayload {
    private readonly include = ['melvor', 'cdnjs', 'polyfill'];
    private readonly exclude = [
        'oneui',
        'ion.rangeSlider',
        'animations',
        'jquery',
        'pixi',
        'basis',
        'viewport',
        'cloud.js',
        'cloudManager',
        'cartographyMenu',
        'sidebar',
        'minibar',
        'ifvisible',
        'Sortable',
        'sweetalert2',
        'tippy-bundle'
    ];

    public get origin() {
        const favicon = '/assets/media/favicons/favicon.png';

        return document.head.querySelector<HTMLLinkElement>('[rel="shortcut icon"]').href.replace(favicon, '');
    }

    public get scripts() {
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

    private matches(inclusions: string[], src: string) {
        return inclusions.some(lookup => src.includes(lookup.toLowerCase()));
    }
}
