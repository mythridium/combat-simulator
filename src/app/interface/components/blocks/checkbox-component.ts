import './checkbox-component.scss';
import { BaseComponent } from './base-component';

export interface CheckboxOptions {
    id: string;
    innerHTML: string;
    checked: boolean;
    classes?: string[];
    onChange?: (event: Event, element: HTMLInputElement) => void;
}

export class CheckboxComponent extends BaseComponent {
    constructor(private readonly options: CheckboxOptions) {
        super({
            tag: 'div',
            id: options.id,
            classes: ['mcs-checkbox', ...(options.classes ?? [])]
        });
    }

    protected preRender(container: HTMLElement): void {
        const formCheck = document.element({
            tag: 'div',
            classes: ['custom-control', 'custom-switch', 'custom-control-md'],
            onClick: event => {
                const element = checkbox.element as HTMLInputElement;

                element.checked = !element.checked;

                if (this.options.onChange) {
                    this.options.onChange(event, element);
                }
            }
        });

        const checkbox = document.element({
            id: `${this.options.id}-checkbox`,
            name: `${this.options.id}-checkbox`,
            tag: 'input',
            type: 'checkbox',
            classes: ['custom-control-input'],
            checked: this.options.checked
        });

        const label = document.element({
            for: `${this.options.id}-checkbox`,
            tag: 'label',
            classes: ['font-weight-normal', 'custom-control-label', 'pointer-enabled', 'mcs-md-text'],
            innerHTML: this.options.innerHTML
        });

        formCheck.append(checkbox, label);
        this.append(formCheck);

        super.preRender(container);
    }
}
