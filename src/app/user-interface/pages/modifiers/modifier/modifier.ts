import './modifier.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { ActiveModifier } from 'src/shared/utils/modifiers';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-modifiers-modifier': ModifiersModifier;
    }
}

@LoadTemplate('app/user-interface/pages/modifiers/modifier/modifier.html')
export class ModifiersModifier extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _header: HTMLDivElement;
    private readonly _body: HTMLDivElement;

    private _isOpen = false;
    private _modifier: ActiveModifier;

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-modifiers-modifier-template'));

        this._header = getElementFromFragment(this._content, 'mcs-modifiers-modifier-header', 'div');
        this._body = getElementFromFragment(this._content, 'mcs-modifiers-modifier-body', 'div');
    }

    public connectedCallback() {
        this.appendChild(this._content);

        this._header.onclick = () => {
            this._isOpen = !this._isOpen;
            this.classList.toggle('mcs-is-open', this._isOpen);
        };
    }

    public _set(modifier: ActiveModifier, isOpen = false) {
        this._modifier = modifier;

        this._header.innerHTML = '';
        this._body.innerHTML = '';

        this._header.append(createElement('i', { classList: ['fa', 'mcs-modifiers-modifier-header-icon'] }));

        // @ts-ignore // TODO: TYPES
        const header = getElementDescriptionFormatter('div', '')(this._modifier.description);
        this._header.append(header);
        this._header.append(createElement('div', { classList: ['mcs-flex-space'] }));
        this._header.append(
            createElement('div', {
                classList: ['mcs-source-amount'],
                text: `${this._modifier.sources.length} Source${this._modifier.sources.length === 1 ? '' : 's'}`
            })
        );

        for (const source of this._modifier.sources) {
            const container = createElement('div', { classList: ['mcs-modifier-source'] });

            if (source.media) {
                container.append(
                    createElement('img', {
                        classList: ['mcs-modifier-source-image'],
                        attributes: [['src', source.media]]
                    })
                );
            } else {
                container.append(createElement('div', { classList: ['mcs-modifier-source-space'] }));
            }

            container.append(createElement('div', { classList: ['mcs-modifier-source-name'], text: source.name }));

            // @ts-ignore // TODO: TYPES
            const element = getElementDescriptionFormatter('div', 'mcs-modifier-source-text')(source.description);
            container.append(element);

            this._body.append(container);
        }

        this._isOpen = isOpen;
        this.classList.toggle('mcs-is-open', this._isOpen);
    }
}

customElements.define('mcs-modifiers-modifier', ModifiersModifier);
