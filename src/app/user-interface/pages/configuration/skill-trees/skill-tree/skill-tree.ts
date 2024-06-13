import './skill-tree.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { StatsController } from 'src/app/user-interface/pages/_parts/out-of-combat-stats/stats-controller';
import { Global } from 'src/app/global';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-skill-tree': SkillTreeInterface;
    }
}

interface Edge {
    // @ts-ignore // TODO: TYPES
    from: SkillTreeNode;
    // @ts-ignore // TODO: TYPES
    to: SkillTreeNode;
    path: SVGPathElement;
}

@LoadTemplate('app/user-interface/pages/configuration/skill-trees/skill-tree/skill-tree.html')
export class SkillTreeInterface extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _container: HTMLDivElement;
    private readonly _edgeContainer: SVGSVGElement;

    // @ts-ignore // TODO: TYPES
    private _tree: SkillTree;
    private readonly _nodes = new Map<string, HTMLDivElement>();
    private readonly _edges: Edge[] = [];

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-skill-tree-template'));

        this._edgeContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this._edgeContainer.setAttribute('height', '100%');
        this._edgeContainer.setAttribute('width', '100%');
        this._edgeContainer.setAttribute('preserveAspectRatio', 'none');
        this._edgeContainer.classList.add('position-absolute', 'h-100', 'w-100');

        this._container = getElementFromFragment(this._content, 'mcs-skill-tree-container', 'div');
        this._container.append(this._edgeContainer);
    }

    public connectedCallback() {
        this.appendChild(this._content);
    }

    // @ts-ignore // TODO: TYPES
    public _set(tree: SkillTree) {
        this._tree = tree;
        this._setSkillTree(tree);
    }

    public _import(nodes: string[]) {
        for (const element of Array.from(this._nodes.values())) {
            element.classList.toggle('mcs-is-unlocked', false);
        }

        for (const node of nodes) {
            // @ts-ignore // TODO: TYPES
            const skillNode = this._tree.nodes.find(skillNode => skillNode.id === node);
            const element = this._nodes.get(node);

            if (skillNode && element) {
                skillNode.isUnlocked = true;
                element.classList.toggle('mcs-is-unlocked', skillNode.isUnlocked);
            }
        }

        // @ts-ignore // TODO: TYPES
        this._tree.unlockedNodes = this._tree.nodes.filter(node => node.isUnlocked);

        for (const edge of this._edges) {
            // @ts-ignore // TODO: TYPES
            skillTreeMenu.updateEdge(edge);
        }
    }

    public _updateTooltips() {
        for (const [id, element] of this._nodes) {
            const node = this._tree.nodes.getObjectByID(id);
            const tooltip = element.querySelector<HTMLDivElement>('.mcs-node-tooltip');

            if (!node || !tooltip) {
                continue;
            }

            this._setTooltip(tooltip, node);
        }
    }

    // @ts-ignore // TODO: TYPES
    private _onClick(node: SkillTreeNode) {
        node.isUnlocked = !node.isUnlocked;
        this._toggleChain(node, node.isUnlocked);
        // @ts-ignore // TODO: TYPES
        this._tree.unlockedNodes = this._tree.nodes.allObjects.filter(node => node.isUnlocked);

        for (const edge of this._edges) {
            // @ts-ignore // TODO: TYPES
            skillTreeMenu.updateEdge(edge);
        }

        StatsController.update();
        Global.userInterface.main.querySelectorAll('mcs-food-slot').forEach(element => element._update());
    }

    // @ts-ignore // TODO: TYPES
    private _toggleChain(node: SkillTreeNode, toggle: boolean) {
        if (toggle) {
            if (node.parents) {
                for (const parent of node.parents) {
                    this._toggleChain(parent, toggle);
                }
            }
        } else if (node.children) {
            for (const child of node.children) {
                this._toggleChain(child, toggle);
            }
        }

        node.isUnlocked = toggle;

        const element = this._nodes.get(node.id);

        if (!element) {
            return;
        }

        element.classList.toggle('mcs-is-unlocked', node.isUnlocked);
    }

    // @ts-ignore // TODO: TYPES
    private _setTooltip(tooltip: HTMLDivElement, node: SkillTreeNode) {
        tooltip.innerHTML = `<div class="text-warning">${
            node._name
            // @ts-ignore // TODO: TYPES
        }</div><small>${node.stats.describeLineBreak()}</small>`;
    }

    // @ts-ignore // TODO: TYPES
    private _setSkillTree(tree: SkillTree) {
        const layout = this._getLayout(tree);
        const graph = layout.graph();
        const GRAPH_HEIGHT = graph?.height ?? 1;
        const GRAPH_WIDTH = graph?.width ?? 1;

        for (const node of tree.nodes.allObjects) {
            const element = createElement('div', {
                attributes: [['data-mcsTooltip', '']],
                classList: ['mcs-skill-tree-node'],
                text: node._name
            });

            const tooltip = createElement('div', {
                classList: ['mcs-node-tooltip'],
                attributes: [['data-mcsTooltipContent', '']]
            });

            this._setTooltip(tooltip, node);

            element.append(tooltip);

            element.onclick = () => this._onClick(node);
            this._nodes.set(node.id, element);
            // @ts-ignore // TODO: TYPES
            skillTreeMenu.setIconPosition(element, layout.node(node.id));
            this._container.append(element);
        }

        // @ts-ignore // TODO: TYPES
        layout.edges().forEach(graphEdge => {
            const from = tree.nodes.getObjectByID(graphEdge.v);
            const to = tree.nodes.getObjectByID(graphEdge.w);
            const { points } = layout.edge(graphEdge);

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            // @ts-ignore // TODO: TYPES
            path.setAttribute('d', skillTreeMenu.computeEdgePath(points));
            path.classList.add('stroke-width-3x');
            path.setAttribute('fill', 'none');

            const edge = { from, to, path };
            // @ts-ignore // TODO: TYPES
            skillTreeMenu.updateEdge(edge);
            this._edgeContainer.append(path);
            this._edges.push(edge);
        });

        this._edgeContainer.setAttribute('viewBox', `0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`);
        this._container.style.width = `${GRAPH_WIDTH}px`;
        this._container.style.height = `${GRAPH_HEIGHT}px`;
    }

    // @ts-ignore // TODO: TYPES
    private _getLayout(tree: SkillTree) {
        // @ts-ignore // TODO: TYPES
        const g = new dagre.graphlib.Graph();

        g.setGraph({
            nodesep: 25,
            edgesep: 10,
            ranksep: 25,
            marginx: 20
        });

        g.setDefaultEdgeLabel(() => ({}));

        for (const node of tree.nodes.allObjects) {
            g.setNode(node.id, { width: 75, height: 45 });

            for (const child of node.children) {
                g.setEdge(node.id, child.id);
            }
        }

        // @ts-ignore // TODO: TYPES
        dagre.layout(g);
        return g;
    }
}

customElements.define('mcs-skill-tree', SkillTreeInterface);
