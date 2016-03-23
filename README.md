# d3-sunburst-menu
A d3js multilevel circular (pie) menu, quite undocumented at the moment


## Description

* Visualise a tree structure as a traversable, circular partition menu
* Traverse and select nodes by nudging the edge
* Menu choices through callbacks
* Supports gradients and curved labels

sunburst_menu returns an object with a redraw function, so that the partition can be altered (in my case waiting for several REST services to return menu data) and then updated through a call to redraw()

    @author Christian Lagerkvist [@lgrkvst, git@o-o.se]
    todo:
     Documentation
     Fix leaf text styles
     Move svg attributes to css
     Add tests
     Refactoring?
