import { Global } from 'src/app/global';
import './swiper.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { throttle } from 'lodash-es';
import { PageController, PageId } from 'src/app/user-interface/pages/page-controller';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-swiper': Swiper;
    }
}

enum SwiperPosition {
    Main = 'main',
    Summary = 'summary'
}

interface SnapPoints {
    pages: HTMLElement;
    outOfCombatStatsMain: HTMLElement;
    outOfCombatStatsSummary: HTMLElement;
    informationMain: HTMLElement;
    informationSummary: HTMLElement;
    summaryEquipment: HTMLElement;
    summarySkills: HTMLElement;
    summaryMelvorAgility: HTMLElement;
    summaryAbyssalAgility?: HTMLElement;
}

@LoadTemplate('app/user-interface/_parts/swiper/swiper.html')
export class Swiper extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private _position: SwiperPosition;
    private _scrollIndicator: HTMLDivElement;

    private _snapPoints: HTMLElement[];
    private _elements: SnapPoints;
    private _intersections = new Map<HTMLElement, number>();

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-swiper-template'));

        this._scrollIndicator = getElementFromFragment(this._content, 'mcs-scroll-indicator', 'div');
    }

    public connectedCallback() {
        this.appendChild(this._content);

        this._position = this.dataset.mcsposition as SwiperPosition;

        this._elements = {
            pages: Global.userInterface.main.querySelector('mcs-pages'),
            outOfCombatStatsMain: Global.userInterface.main.querySelector('.mcs-main-out-of-combat-stats'),
            outOfCombatStatsSummary: Global.userInterface.main.querySelector('.mcs-summary-out-of-combat-stats'),
            informationMain: Global.userInterface.main.querySelector('.mcs-main-information'),
            informationSummary: Global.userInterface.main.querySelector('.mcs-summary-information'),
            summaryEquipment: Global.userInterface.main.querySelector('.mcs-summary-equipment-container'),
            summarySkills: Global.userInterface.main.querySelector('.mcs-summary-skill-container'),
            summaryMelvorAgility: Global.userInterface.main.querySelector('.mcs-summary-agility-melvor')
        };

        if (cloudManager.hasItAEntitlementAndIsEnabled) {
            this._elements.summaryAbyssalAgility =
                Global.userInterface.main.querySelector('.mcs-summary-agility-abyssal');
        }

        PageController.on(pageId => {
            this._snapPoints = this._getSnapPoints().reverse();
            this._updateIndicators(this._snapPoints.length);

            switch (this._position) {
                case SwiperPosition.Main:
                    this.style.display = pageId === PageId.Summary ? 'none' : '';
                    break;
                case SwiperPosition.Summary:
                    this.style.display = pageId === PageId.Summary ? '' : 'none';
                    break;
            }
        });

        const indicators = Array.from(this._scrollIndicator.children) as HTMLElement[];

        var observer = new IntersectionObserver(
            entries => {
                if (this._position === SwiperPosition.Main && PageController.pageId === PageId.Summary) {
                    return;
                }

                if (this._position === SwiperPosition.Summary && PageController.pageId !== PageId.Summary) {
                    return;
                }

                for (const entry of entries) {
                    this._intersections.set(entry.target as HTMLElement, entry.intersectionRatio);
                }

                const ofInterest = this._snapPoints.map(element => ({
                    element,
                    ratio: this._intersections.get(element)
                }));

                const max = Math.max(...ofInterest.map(a => a.ratio));

                let selected = false;
                ofInterest.forEach((interest, index) => {
                    if (interest.ratio === max && !selected) {
                        selected = true;
                        indicators[ofInterest.length - 1 - index].style.background =
                            interest.ratio > 0 ? 'var(--mcs-swiper-dot-focus)' : 'var(--mcs-swiper-dot-unfocus)';
                    } else {
                        indicators[ofInterest.length - 1 - index].style.background = 'var(--mcs-swiper-dot-unfocus)';
                    }
                });
            },
            {
                root: null,
                rootMargin: '20px',
                threshold: [0, 0.25, 0.5, 0.75, 1]
            }
        );

        Object.values(this._elements).forEach(element => {
            this._intersections.set(element, 0);
            observer.observe(element);
        });

        this._snapPoints = this._getSnapPoints().reverse();
        this._updateIndicators(this._snapPoints.length);

        window.addEventListener(
            'resize',
            throttle(() => {
                const snapPoints = this._getSnapPoints();

                if (snapPoints.length !== this._snapPoints.length) {
                    this._updateIndicators(snapPoints.length);
                }

                this._snapPoints = snapPoints.reverse();
            }, 200)
        );
    }

    private _getSnapPoints() {
        if (window.innerWidth > 1500) {
            return [];
        }

        if (window.innerWidth <= 700) {
            return this._position === SwiperPosition.Main
                ? PageController.pageId === PageId.Simulate || PageController.pageId === PageId.Modifiers
                    ? [this._elements.pages, this._elements.informationMain]
                    : [this._elements.pages, this._elements.outOfCombatStatsMain, this._elements.informationMain]
                : cloudManager.hasItAEntitlementAndIsEnabled
                ? [
                      this._elements.summaryEquipment,
                      this._elements.summarySkills,
                      this._elements.summaryMelvorAgility,
                      this._elements.summaryAbyssalAgility,
                      this._elements.outOfCombatStatsSummary,
                      this._elements.informationSummary
                  ]
                : [
                      this._elements.summaryEquipment,
                      this._elements.summarySkills,
                      this._elements.summaryMelvorAgility,
                      this._elements.outOfCombatStatsSummary,
                      this._elements.informationSummary
                  ];
        }

        if (window.innerWidth <= 850) {
            return this._position === SwiperPosition.Main
                ? [this._elements.pages, this._elements.informationMain]
                : cloudManager.hasItAEntitlementAndIsEnabled
                ? [
                      this._elements.summaryEquipment,
                      this._elements.summaryAbyssalAgility,
                      this._elements.outOfCombatStatsSummary,
                      this._elements.informationSummary
                  ]
                : [
                      this._elements.summaryEquipment,
                      this._elements.outOfCombatStatsSummary,
                      this._elements.informationSummary
                  ];
        }

        if (window.innerWidth <= 991) {
            return this._position === SwiperPosition.Main
                ? [this._elements.pages, this._elements.informationMain]
                : [
                      this._elements.summaryEquipment,
                      this._elements.outOfCombatStatsMain,
                      this._elements.informationMain
                  ];
        }

        if (window.innerWidth <= 1100) {
            return this._position === SwiperPosition.Main
                ? PageController.pageId === PageId.Simulate || PageController.pageId === PageId.Modifiers
                    ? [this._elements.pages, this._elements.informationMain]
                    : [this._elements.pages, this._elements.outOfCombatStatsMain, this._elements.informationMain]
                : [
                      this._elements.summaryEquipment,
                      this._elements.outOfCombatStatsMain,
                      this._elements.informationMain
                  ];
        }

        if (window.innerWidth <= 1200) {
            return this._position === SwiperPosition.Main
                ? PageController.pageId === PageId.Simulate || PageController.pageId === PageId.Modifiers
                    ? [this._elements.pages, this._elements.informationMain]
                    : [this._elements.pages, this._elements.outOfCombatStatsMain, this._elements.informationMain]
                : [this._elements.summaryEquipment, this._elements.informationMain];
        }

        if (window.innerWidth <= 1500) {
            return this._position === SwiperPosition.Main
                ? []
                : [this._elements.summaryEquipment, this._elements.informationMain];
        }
    }

    private _updateIndicators(snapPoints: number) {
        Array.from(this._scrollIndicator.children).forEach((element: HTMLElement, index) => {
            if (snapPoints === 0) {
                element.style.display = 'none';
            } else if (index < snapPoints) {
                element.style.display = 'block';
            } else {
                element.style.display = 'none';
            }
        });
    }
}

customElements.define('mcs-swiper', Swiper);
