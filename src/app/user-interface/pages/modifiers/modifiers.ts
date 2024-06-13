import './modifiers.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { PageController, PageId } from 'src/app/user-interface/pages/page-controller';
import { ActiveModifier, ModifierHelper } from 'src/shared/utils/modifiers';
import { ModifiersModifier } from './modifier/modifier';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-modifiers': ModifiersPage;
    }
}

@LoadTemplate('app/user-interface/pages/modifiers/modifiers.html')
export class ModifiersPage extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _activeModifiers: HTMLDivElement;
    private readonly _search: HTMLInputElement;

    private _modifiers: ActiveModifier[];
    private _elements = new Map<ActiveModifier, ModifiersModifier>();

    private readonly onLoad = this._onLoad.bind(this);

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-modifiers-template'));

        this._activeModifiers = getElementFromFragment(this._content, 'mcs-active-modifiers', 'div');
        this._search = getElementFromFragment(this._content, 'mcs-modifiers-search', 'input');
    }

    public connectedCallback() {
        this.appendChild(this._content);
        PageController.on(this.onLoad);

        this._search.oninput = (event: InputEvent) => {
            // @ts-ignore
            const value = event?.target?.value.toLowerCase();

            for (const [modifier, element] of this._elements) {
                if (
                    modifier.description.text.toLowerCase().includes(value) ||
                    modifier.sources.some(
                        source =>
                            source.description.text.toLowerCase().includes(value) ||
                            source.name.toLowerCase().includes(value)
                    )
                ) {
                    element.style.display = '';
                } else {
                    element.style.display = 'none';
                }
            }
        };
    }

    public disconnectedCallback() {
        PageController.off(this.onLoad);
    }

    private _onLoad(pageId: PageId) {
        if (pageId !== PageId.Modifiers) {
            return;
        }

        this._search.value = '';
        this._search.dispatchEvent(new InputEvent('input'));

        this._modifiers = ModifierHelper.activeModifiers;

        this._activeModifiers.innerHTML = '';

        for (const modifier of this._modifiers) {
            const element = createElement('mcs-modifiers-modifier');

            element._set(modifier);
            this._elements.set(modifier, element);

            this._activeModifiers.append(element);
        }
    }
}

customElements.define('mcs-modifiers', ModifiersPage);
