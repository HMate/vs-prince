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
 