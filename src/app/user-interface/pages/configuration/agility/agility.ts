import './agility.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Global } from 'src/app/global';
import { Tabs } from 'src/app/user-interface/_parts/tabs/tabs';
import { AgilityCourse } from './agility-course/agility-course';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-agility': AgilityPage;
    }
}

@LoadTemplate('app/user-interface/pages/configuration/agility/agility.html')
export class AgilityPage extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _tabs: Tabs;

    private readonly _courses = new Map<string, AgilityCourse>();

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-agility-template'));

        this._tabs = getElementFromFragment(this._content, 'mcs-agility-course', 'mcs-tabs');
    }

    public connectedCallback() {
        this.appendChild(this._content);

        this._init();
    }

    // @ts-ignore // TODO: TYPES
    public _import(realm: Realm, obstacles: [string, number, boolean][], pillars: [string, number][]) {
        const course = this._courses.get(realm.id);

        course._import(obstacles, pillars);
    }

    public _updateTooltips() {
        for (const course of Array.from(this._courses.values())) {
            course._update();
        }
    }

    private _init() {
        // @ts-ignore // TODO: TYPES
        const realms = Array.from(Global.game.agility.courses.keys());

        // @ts-ignore // TODO: TYPES
        for (const realm of realms) {
            const header = createElement('div', {
                attributes: [
                    ['slot', 'tab-header'],
                    ['data-mcsTooltip', '']
                ]
            });

            // @ts-ignore // TODO: TYPES
            header.appendChild(createElement('img', { attributes: [['src', realm.media]] }));
            header.appendChild(
                // @ts-ignore // TODO: TYPES
                createElement('div', { attributes: [['data-mcsTooltipContent', '']], text: `${realm.name} Course` })
            );

            // @ts-ignore // TODO: TYPES
            const course = createElement('mcs-agility-course', { attributes: [['data-mcsRealmId', realm.id]] });

            if (this.getAttribute('readonly') !== null) {
                course.setAttribute('readonly', '');
            }

            // @ts-ignore // TODO: TYPES
            this._courses.set(realm.id, course);

            const content = createElement('div', { attributes: [['slot', 'tab-content']] });

            content.appendChild(course);

            this._tabs.appendChild(header);
            this._tabs.appendChild(content);
        }

        this._tabs._init();
    }
}

customElements.define('mcs-agility', AgilityPage);
