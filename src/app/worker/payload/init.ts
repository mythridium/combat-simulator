import { Util } from 'src/shared/util';

export class InitPayload {
    private readonly include = ['melvor', 'cdnjs', 'polyfill'];
    private readonly exclude = [
        'oneui',
        'dagre',
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
        'tippy-bundle',
        'fuse',
        'blob:'
    ];

    constructor() {
        if ('whaleBrowserStorage' in self) {
            this.exclude.push(...['dexie', 'db.js', 'polyfill.io']);
        }
    }

    public get origin() {
        return Util.getOrigin();
    }

    public get scripts() {
        const scripts: string[] = [];

        const allScripts = Array.from(document.querySelectorAll('script'));

        for (const script of allScripts) {
            const src = script.src.toLowerCase();

            if (!src.includes('.js')) {
                continue;
            }

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
