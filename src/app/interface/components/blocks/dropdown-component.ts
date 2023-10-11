import './dropdown-component.scss';
import { BaseComponent } from './base-component';

export interface DropdownOptions {
    id: string;
    classes?: string[];
    options: DropdownOption[];
    search?: boolean;
    onChange?: (event: MouseEvent, option: DropdownOption) => void;
}

export interface DropdownOption {
    text: string;
    value: string;
}

export class DropdownComponent extends BaseComponent {
    private dropdownOptions: HTMLButtonElement[] = [];

    constructor(private readonly options: DropdownOptions) {
        super({
            tag: 'div',
            id: options.id,
            classes: ['mcs-dropdown', ...(options.classes ?? [])]
        });
    }

    protected preRender(container: HTMLElement): void {
        this.dropdownOptions = [];

        const button = createElement('button', {
            id: `${this.options.id}-button`,
            classList: ['btn', `btn-primary`, 'dropdown-toggle', 'font-size-sm'],
            attributes: [
                ['type', 'button'],
                ['data-toggle', 'dropdown'],
                ['aria-haspopup', 'true'],
                ['aria-expanded', 'false']
            ]
        });

        button.onclick = () => {
            if (this.options.search) {
                setTimeout(() => searchInput?.focus());
                return;
            }

            const option = this.dropdownOptions[0];

            if (option) {
                setTimeout(() => {
                    option.focus();
                    button.focus();
                });
            }
        };

        let search: HTMLDivElement | undefined = undefined;
        let divider: HTMLDivElement | undefined = undefined;
        let searchInput: HTMLInputElement | undefined = undefined;

        if (this.options.search) {
            searchInput = createElement('input', {
                classList: ['form-control', 'msc-dropdown-content-search', 'font-size-sm'],
                attributes: [
                    ['type', 'text'],
                    ['name', 'mcs-dropdown-content-search'],
                    ['placeholder', 'Search']
                ]
            });

            searchInput.oninput = (event: any) => {
                const search = event.target.value;

                for (const [index, dropdownOption] of this.options.options.entries()) {
                    const option = this.dropdownOptions.find(option => parseInt(option.dataset.index, 10) === index);

                    if (!option) {
                        return;
                    }

                    if (
                        !dropdownOption.text.toLowerCase().includes(search.toLowerCase()) &&
                        dropdownOption.text !== 'None'
                    ) {
                        option.style.display = 'none';
                    } else {
                        option.style.display = 'block';
                    }
                }
            };

            divider = createElement('div', {
                classList: ['dropdown-divider'],
                attributes: [['role', 'separator']]
            });

            search = createElement('div', {
                classList: ['mx-2', 'form-group', 'mb-0'],
                attributes: [['onsubmit', 'return false']],
                children: [searchInput]
            });
        }

        for (const [index, option] of this.options.options.entries()) {
            const dropdownOption = createElement('button', {
                classList: ['dropdown-item', 'pointer-enabled'],
                children: [option.text]
            });

            dropdownOption.value = option.value;
            dropdownOption.dataset.index = index.toString();

            dropdownOption.onclick = event => {
                button.innerHTML = option.text;

                if (this.options.onChange) {
                    this.options.onChange(event, option);
                }
            };

            if (index === 0) {
                button.innerHTML = option.text;
            }

            this.dropdownOptions.push(dropdownOption);
        }

        const dropdownMenu = createElement('div', {
            classList: ['dropdown-menu', 'font-size-sm'],
            attributes: [
                ['aria-labelledby', this.options.id],
                ['style', 'max-height: 500px; overflow: auto;']
            ],
            children:
                this.options.search && search && divider
                    ? [search, divider, ...this.dropdownOptions]
                    : this.dropdownOptions
        });

        const dropdown = createElement('div', {
            classList: ['dropdown'],
            children: [button, dropdownMenu],
            id: `${this.options.id}-dropdown`
        });

        this.append(dropdown);

        super.preRender(container);
    }
}
