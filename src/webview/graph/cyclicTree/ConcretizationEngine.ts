import { addCoord, Coord } from "../../utils";
import { Graph, ConcreteGraph } from "../Graph";
import { OrganizationalLayers, OrganizationalLayer } from "./OrganizationEngine";

export class ConcretizationEngine {
    public static concretize(graph: Graph, organization: OrganizationalLayers): ConcreteGraph {
        let positions = new ConcreteGraph();
        let curPos: Coord = { x: 0, y: 0 };

        // TODO: Move to config object
        let nodeXMargin = 20.0;
        let nodeYMargin = 75.0;

        for (const layer of organization) {
            const layerMaxHeight = this.getLayerHeight(graph, layer);
            const layerBaselineY = curPos.y + layerMaxHeight / 2.0;
            curPos = { x: 0.0, y: layerBaselineY };

            for (const node of layer) {
                const orig = graph.node(node);
                if (!orig) {
                    console.warn(`Couldn't find node ${node} for concretization!`);
                    console.warn({ organization, graph });
                    continue;
                }
                positions.addNode({ name: orig.name, cx: curPos.x + orig.width / 2.0, cy: curPos.y });
                curPos = addCoord(curPos, { x: orig.width + nodeXMargin, y: 0.0 });
            }

            curPos = addCoord(curPos, { x: 0.0, y: layerMaxHeight / 2.0 + nodeYMargin });
        }

        for (const edge of graph.edges) {
            positions.addEdge(edge);
        }

        return positions;
    }

    private static getLayerHeight(graph: Graph, layer: OrganizationalLayer) {
        let layerMaxHeight = 0.0;
        for (const node of layer) {
            let orig = graph.node(node);
            layerMaxHeight = Math.max(layerMaxHeight, orig?.height ?? 0.0);
        }
        return layerMaxHeight;
    }
}
