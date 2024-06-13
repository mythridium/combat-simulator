import './tabs.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Global } from 'src/app/global';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-tabs': Tabs;
    }
}

interface TabElements {
    header: HTMLDivElement;
    content: HTMLDivElement;
}

@LoadTemplate('app/user-interface/_parts/tabs/tabs.html')
export class Tabs extends HTMLElement {
    private readonly _content = new DocumentFragment();
    private readonly _shadowRoot: ShadowRoot;

    private readonly _tabHeader: HTMLSlotElement;
    private readonly _tabContent: HTMLSlotElement;

    private _active?: TabElements;
    private readonly _tabs = new Map<number, TabElements>();

    constructor() {
        super();

        this._shadowRoot = this.attachShadow({ mode: 'open' });
        this._content.append(getTemplateNode('mcs-tabs-template'));

        this._tabHeader = getElementFromFragment(this._content, 'tab-header-slot', 'slot');
        this._tabContent = getElementFromFragment(this._content, 'tab-content-slot', 'slot');
    }

    public connectedCallback() {
        this._shadowRoot.appendChild(this._content);
    }

    public _init() {
        const header = this._tabHeader.assignedElements() as HTMLDivElement[];
        const content = this._tabContent.assignedElements() as HTMLDivElement[];

        if (header.length !== content.length) {
            Global.logger.error(`Header and Content must match in length for a tab.`);
            return;
        }

        for (let i = 0; i < header.length; i++) {
            header[i].onclick = () => this._select(i);
            this._tabs.set(i, { header: header[i], content: content[i] });
        }

        if (this._tabs.size) {
            this._select(0);
        }
    }

    public _select(index: number) {
        this._active?.header.classList.remove('is-selected');
        this._active?.content.classList.remove('is-selected');

        const { header, content } = this._tabs.get(index);

        header.classList.add('is-selected');
        content.classList.add('is-selected');

        this._active = { header, content };
    }
}

customElements.define('mcs-tabs', Tabs);
