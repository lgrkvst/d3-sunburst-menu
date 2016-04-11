<img src="https://raw.githubusercontent.com/lgrkvst/d3-sunburst-menu/master/img/example.jpg" width="400">

# D3 Sunburst Menu
A d3js multilevel circular (pie) menu, quite undocumented at the moment


## Description

* Visualise a tree structure as a traversable, circular partition menu
* Supports infinite tree levels
* Traverse and select nodes by nudging the edge
* Menu choices through callbacks
* Supports gradients and curved labels

sunburst_menu returns an object with a redraw function, so that the partition can be altered (in my case waiting for several REST services to return menu data) and then updated through a call to redraw()

##Installation
`$ npm install d3-sunburst-menu`

Using webpack, in your entry.js file:
`var d3_sunburst_menu = require('d3-sunburst-menu');`

Initialize by:
`var treecontroller = d3_sunburst_menu(tree, node, svg_container);`

where:

* _tree_ is a d3 partition tree,
* _node_ is any object with x and y properties (for instance a d3 force directed node instance)
* _svg_container_ is the d3 selection that will host the menu (as obtained by `d3.select`).

Draw by:
`treecontroller.draw()`

There's no remove method yet, so remove by:

`svg.selectAll("g#radialmenu").remove()`

##Settings
The first few lines of d3-sunburst-menu.js offers a number of settings:

    var _radius = 140; // size of menu
    var _rotate = Math.PI / 2; // default menu rotation (if you need to align menu items)
    var backSize = 0.1; // back button size as percent of full circle
    var idleTime = 300; // time (ms) between edge nudge and menu traversal
    var dropshadow = false; // add a nice dropshadow – impacts menu performance somewhat...



    @author Christian Lagerkvist [@lgrkvst, git@o-o.se]
    todo:
     Documentation
     Fix leaf text styles
     Move svg attributes to css
     Add tests
     Refactoring?
