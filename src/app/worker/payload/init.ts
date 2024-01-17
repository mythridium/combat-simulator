import { BasePayload } from './_base';
import { MessageAction, MessageRequest } from 'src/shared/transport/message';

export class InitPayload extends BasePayload<MessageAction.Init> {
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

    public readonly data: MessageRequest<MessageAction.Init> = {
        action: MessageAction.Init,
        data: {
            origin: this.origin,
            scripts: this.scripts,
            entitlements: {
                toth: cloudManager.hasTotHEntitlement,
                aod: cloudManager.hasAoDEntitlement
            }
        }
    };

    private get origin() {
        let origin = location.origin;

        if (cloudManager.isTest) {
            origin += '/lemvoridle';
        }

        return origin;
    }

    private get scripts() {
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
