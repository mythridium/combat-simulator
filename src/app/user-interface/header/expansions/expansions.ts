import './expansions.scss';
import { LoadTemplate } from 'src/app/user-interface/template';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-header-expansions': Expansions;
    }
}

@LoadTemplate('app/user-interface/header/expansions/expansions.html')
export class Expansions extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _toth: HTMLDivElement;
    private readonly _aod: HTMLDivElement;
    private readonly _ita: HTMLDivElement;

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-header-expansions-template'));

        this._toth = getElementFromFragment(this._content, 'mcs-header-expansion-toth', 'div');
        this._aod = getElementFromFragment(this._content, 'mcs-header-expansion-aod', 'div');
        this._ita = getElementFromFragment(this._content, 'mcs-header-expansion-ita', 'div');
    }

    public connectedCallback() {
        this._toth.style.display = cloudManager.hasTotHEntitlementAndIsEnabled ? '' : 'none';
        this._aod.style.display = cloudManager.hasAoDEntitlementAndIsEnabled ? '' : 'none';
        this._ita.style.display = cloudManager.hasItAEntitlementAndIsEnabled ? '' : 'none';

        this.appendChild(this._content);
    }
}

customElements.define('mcs-header-expansions', Expansions);
