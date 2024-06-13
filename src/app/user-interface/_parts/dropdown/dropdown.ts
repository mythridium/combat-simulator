import './dropdown.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Drops } from 'src/app/drops';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-dropdown': Dropdown;
    }
}

export type DropdownOption = { text: string; value: string };

export interface DropdownOptions {
    search: boolean;
    label: string;
    default?: string;
    options: { text: string; value: string }[];
    onChange: (option: DropdownOption) => void;
}

@LoadTemplate('app/user-interface/_parts/dropdown/dropdown.html')
export class Dropdown extends HTMLElement {
    public _selected?: DropdownOption;

    private readonly _content = new DocumentFragment();

    private readonly _label: HTMLLabelElement;
    private readonly _button: HTMLButtonElement;
    private readonly _dropdownItems: HTMLDivElement;
    private readonly _search: HTMLDivElement;
    private readonly _searchInput: HTMLInputElement;
    private readonly _divider: HTMLDivElement;

    private _options: HTMLButtonElement[] = [];
    private _dropdownOptions: DropdownOptions;

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-dropdown-template'));

        this._label = getElementFromFragment(this._content, 'mcs-dropdown-label', 'label');
        this._button = getElementFromFragment(this._content, 'mcs-dropdown-button', 'button');
        this._dropdownItems = getElementFromFragment(this._content, 'mcs-dropdown-items', 'div');
        this._search = getElementFromFragment(this._content, 'mcs-dropdown-search', 'div');
        this._searchInput = getElementFromFragment(this._content, 'mcs-dropdown-search-input', 'input');
        this._divider = getElementFromFragment(this._content, 'mcs-dropdown-divider', 'div');
    }

    public connectedCallback() {
        this.appendChild(this._content);
    }

    public _init(options: DropdownOptions) {
        this._dropdownOptions = options;
        this._dropdownItems.querySelectorAll('button').forEach(button => button.remove());
        this._options = [];
        this._label.textContent = this._dropdownOptions.label;

        if (this._dropdownOptions.search) {
            this._search.style.display = '';
            this._divider.style.display = '';

            this._searchInput.oninput = event => this._onInput(event, this._dropdownOptions);
        } else {
            this._search.style.display = 'none';
            this._divider.style.display = 'none';
        }

        this._button.onclick = () => this._onOpen(this._dropdownOptions);

        for (const [index, option] of this._dropdownOptions.options.entries()) {
            const element = createElement('button', {
                className: 'dropdown-item pointer-enabled',
                attributes: [['value', option.value]],
                text: option.text
            });

            element.onclick = () => {
                this._button.innerHTML = option.text;
                this._selected = { ...option };
                this._dropdownOptions.onChange(option);
            };

            if (!this._dropdownOptions.default && index === 0) {
                this._button.innerHTML = option.text;
                this._selected = { ...option };
            } else if (this._dropdownOptions.default && option.value === this._dropdownOptions.default) {
                this._button.innerHTML = option.text;
                this._selected = { ...option };
            }

            this._options.push(element);
        }

        this._dropdownItems.append(...this._options);
    }

    public _select(value: string, silent = false) {
        const option = this._options.find(option => option.value === value);

        if (option) {
            option.click();

            if (!silent) {
                this._dropdownOptions.onChange({ value: option.value, text: option.innerText });
            }
        }
    }

    private _onInput(event: Event, options: DropdownOptions) {
        // @ts-ignore
        const search = event.target.value;

        for (const option of options.options) {
            const element = this._options.find(element => element.value === option.value);

            if (!element) {
                return;
            }

            if (!option.text.toLowerCase().includes(search.toLowerCase()) && option.value !== Drops.noneItem) {
                element.style.display = 'none';
            } else {
                element.style.display = '';
            }
        }
    }

    private _onOpen(options: DropdownOptions) {
        this._searchInput.value = '';
        this._searchInput.dispatchEvent(new Event('input'));

        const option = this._options[0];

        // move the menu to the top
        if (option) {
            setTimeout(() => {
                option.focus();
                option.blur();
            });
        }

        if (options.search && !nativeManager.isMobile) {
            setTimeout(() => this._searchInput.focus(), 10);
            return;
        }
    }
}

customElements.define('mcs-dropdown', Dropdown);
