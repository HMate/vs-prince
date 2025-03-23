import { Graph, ConcreteGraph } from "@ww/graph/Graph";
import { OrganizationEngine } from "./OrganizationEngine";
import { ConcretizationEngine } from "./ConcretizationEngine";

export class CyclicTreeLayout {
    public arrange(graph: Graph): ConcreteGraph {
        /* Layout does 2 steps: Organization and Concretization.
        Organization consists of placing nodes into logical positions.
        For cyclic tree this means organize into layers, without calculating node size, position or edge shape.
        Concretization will calculate the concrete postions with size and positions.

        Organization:
        First build dependency graph.
        Nodes in layer 0 have no parents, ie no dependers depend on them.
        Nodes in layer 1 depend only on nodes in layer 0. This goes on for every layer.

          Layer 0                Layer 1
         __________           ____________
        |          |         |            |
        | depender |  -----> | dependency | 
        |__________|         |____________|

        Cyclic dependencies (CD) have to be handled with care. When a CD occurs, the parents who are 
        part of the cycle are ignored when we assign layers. So nodes in earlier layers 
        may depend on a later layers only when they are in a cycle.

        Concretization:
        After organizational layers are decided, the order and position of nodes inside a layer have to be calculated.
        The order is based on minimizing the crossing of the edges between parent on the last layer and node in 
        current layer. The position is based on the position of the parent, and the count of siblings.

        Edges should be curved for backward edges. Their trajectory have to be computed. Nodes who are part of the 
        same cycle should be assinged to a group. The backward edges loop around the group.        
        */
        const organization = OrganizationEngine.organize(graph);
        const positions = ConcretizationEngine.concretize(graph, organization);
        return positions;
    }
}
