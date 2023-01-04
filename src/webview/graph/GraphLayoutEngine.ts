import { Graph } from "./Graph";
import { OrganizationEngine } from "./cyclicTreeGraph/OrganizationEngine";
import { ConcretizationEngine } from "./cyclicTreeGraph/ConcretizationEngine";

export class GraphLayoutEngine {
    public layoutCyclicTree(graph: Graph) {
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
        let organization = OrganizationEngine.organize(graph);
        let positions = ConcretizationEngine.concretize(graph, organization);
        return positions;
    }

    public layoutNestedGraph(graph: Graph) {
        /* Finding groups.
        Algo to determine group: 
        BFS on nodes:
        - If a node has a single parent, they are in the same group.
        - If a node has multiple parents that are in the same group, the node is in the group too.
        - If a node has multiple parents, and there are any within different groups, then the node is in a 3rd group.
        Create subgroups? - If two nodes depend on each other, they could be moved to the same group, but in different subgroups?
        - Queue nodes for next BFS candidate until all their parents have a group.
        - If there is no such node, select one that we already seen. They are automatically asigned to a new group        

        Layout:
        Inside groups layout nodes as in layoutCyclicTree.
        
        Edge concretization:
        Inside groups edges are straight, or splines to avoid nodes.
        Between groups, edges from same source group are fitted together and run in parallel to target group.
         */
    }
}
