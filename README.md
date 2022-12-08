<img src="https://raw.githubusercontent.com/lgrkvst/d3-sunburst-menu/master/img/observatory.jpg" width="400">

## Release 1.3.0 (8 Dec 2022)

- Reverted to invoking menu by passing (a clicked) node. More handy in IRL situations where you might want to reference the invoker in the menu item's callback.

## Release 1.2.0 (7 Dec 2022)

- Fixed browser not replicating fill-opacity on inherited url(#...) references

## Release 1.1.0 (7 Dec 2022)

- Added css class for label selection
- Fixed a class name bug

## Release 1.0.11 (3 March 2020)

- Added settings for `maxRadius` and `nudgeTolerance`
- Replaced parameter n ({x,y}) with mousept ([x,y]) as returned by `d3.mouse()`.
- The callback called by invoked menu items now obtains the selected node as parameter

## Release 1.0.10

- IE11 compatibility: graceful menu coloring if no svg gradients support
- IE11 compatilibity: fixed regexp to recognise space as transform parameter delimiter (along with comma)
- You'll need a polyfill (such as [es6-promise](https://github.com/stefanpenner/es6-promise))

## Release 1.0.8

- Added support for then-able promises (see [demo](https://rawgit.com/lgrkvst/d3-sunburst-menu/master/demo/d3-sunburst-demo.html))
  if `_children` is a promise, d3-sunburst-menu will add a loading indicator until the promise is resolved.

# D3 Sunburst Menu

A d3js multilevel circular (pie) menu, quite undocumented at the moment. Here's a [demo](https://rawgit.com/lgrkvst/d3-sunburst-menu/master/demo/d3-sunburst-demo.html)

Pie menus are _a graphical user interface for mouse gestures_. This particular implementation is traversed through nudging the edge and holding still (upon which the menu will traverse after a threshold of 0.3s).

## Description

- Visualise any tree structure as a traversable, circular partition menu
- Traverse and select nodes by nudging the edge
- Each leaf node should have a `function callback() {}`, invoked upon selection.
- Automatic gradients and curved labels, although if a level contains more than 10 children, it's recommended to add `["text-align"] = "radiate"` to those children, causing the labels to emancipate from the center.

sunburst_menu returns an object with a redraw function, so that the partition can be altered (in my case waiting for several REST services to return menu data) and then updated through a call to redraw().

##Installation
`$ npm install d3-sunburst-menu`

##Inclusion
Using webpack, in your entry.js file:
`var d3_sunburst_menu = require('d3-sunburst-menu');`

Initialize by:
`var menucontroller = d3_sunburst_menu(tree, node, svg_container);`

Don't like front tooling like webpack?

```
<script> var module = {}; </script>
<script src="local/path/to/d3-sunburst-menu.js" type="text/javascript" charset="utf-8"></script>
<script>var menucontroller = module.exports(tree, node, svg_container);</script>
```

### Arguments:

- _tree_ is a d3 partition tree with a BIG NOTE: "children" arrays must be named "\_children" (with a preceding underscore). This in order to allow for a menu instance to be redrawn with new nodes. (Fixable, although not my top priority.)
- _mousept_ is an array of (svg) coordinates (as obtained by `d3.mouse()`) saying where to position the center of the menu.
- _svg_container_ – the d3 selection that will host the menu (as obtained by `d3.select`).

Redraw by:
`treecontroller.redraw();`

Remove by:
`treecontroller.remove();`

## Settings

The first few lines of d3-sunburst-menu.js offers a number of settings:

    var radius = _radius = 140;
    var hue = d3.scale.category10(); // if node parents don't specify a fill attribute (i.e. a color)
    var backSize = 0.1; // back button size as percent of full circle
    var currentArc, currentNode = tree; // start traversal at root level
    var idleTime = 300; // time (ms) between edge nudge and traversal
    var padAngle = 0.01;
    var dropshadow = false; // true = performance killer
    var cornerRadius = 4; // 4 is neat but causes transition flickering if root has exactly two children
    var loaderDuration = 4000; // duration of loading arcs in ms
    var menu_level_scope = 2; // number of menu levels to visualise together
    var maxRadius = 190; // max size of menu
    var nudgeTolerance = 4000; // how deep into the menu item the mouse needs to travel before traversal/selection takes place



    @author Christian Lagerkvist [@lgrkvst, git@o-o.se]
    todo:
     Add icon support
     Fix leaf text styles (curved text demands some restrictions... There is a radiating text style in the source code, although somewhat neglected lately)
     Move svg attributes to css
     Add tests
     Refactoring?
