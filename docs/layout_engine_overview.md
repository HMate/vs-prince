## Evaluation of different layout engines

### graphviz
 - It works, but very slow for large graphs. 
 - A lot of boilerplate to generate dot representation
 - I cannot add custom layout to it. 
    Would need to do it in C - https://graphviz.org/docs/layouts/writing-layout-plugins/

### Elk-js
 - Crashes on big graphs with recursion error
 - Has lot of minor bugs, configs not working etc, still under development
 - The graph it produced seemed okay
 - Has subpgraph support

### Custom
 - Lots and lots of work and research.
 - Currently it misses computing edge routing
 - Would need grouping too
 

## Search for render engins:

Right now svg.js works, but it clunky to update elements when things change, and we have to code everything myself.
For example moving edges, boxes. It supports zooming, panning with extension, which is nice.
See more: https://modeling-languages.com/javascript-drawing-libraries-diagrams/

Requirements:
 - Draw nodes, edges
   - Node shapes, colors, text
   - Edge types - rectangular, spline etc
 - Draw packages / hierarchies
 - Panning, zooming
 - Selecting nodes, edges - highlight them, add event handlers
 - Dragging nodes, edges, packages!
   - Dragging a packages moves the nodes, edges too
 - Fast for many nodes - 1000+
   - Fast to build the scene
 - Serialization
Nice to have:
 - Draw pictures, fancy animations for building, adding etc
 - Give back size, position informations - for building custom layouts, etc

Other candidates:
 - GoJS - License costs $4000. Has free version that watermarks diagrams. May be worth evaluating.
 - JointJS - Musthave features (zoom, pan, drag, canvas, svg...) are behind paid verion (costs $3000 once + $1500/month).
 - Diagram.js - Opensource, but seems pretty basic. Need more research
    - See for example https://github.com/timKraeuter/object-diagram-js
 - Three.js, two.js - canvas based, big community. Need more research
 - d3.js - Not fo diagrams, but may be possible. Need more research
 - vis.js - Look into this, seems promising! Not for layouting, but gives plenty of tools for network drawing 
    - No example for hierarchies
    - See https://visjs.github.io/vis-network/examples/
 - sigma.js - ?? Brings in graphology too. 
    - https://www.sigmajs.org/
 - cytoscape
    - https://js.cytoscape.org/

