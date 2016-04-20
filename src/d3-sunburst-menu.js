/** sunburst_menu.js - a quite undocumented module at the moment.
 *
 * Visualise a tree structure as a traversable, circular partition menu
 * Traverse and select nodes by nudging the edge
 * sunburst_menu returns an object with a redraw function, so that the partition can be altered (in my case waiting for several REST services to return menu data) and then updated through a call to redraw()
 * IMPORTANT: the menu tree's children have to be called _children. Partly to enable redrawing the tree with additional nodes, and partly because I suck.
 *
 * @author Christian Lagerkvist [@lgrkvst, git@o-o.se]
 * todo:
 *      Documentation
 *      Fix leaf text styles
 *      Move svg attributes to css
 *      Add tests
 *      Refactoring?
 *
 * Time to spare? Try generating a sunburst menu in grayscale - really neat
 */

/**
    sunburst_menu(tree, n, container)

    tree is fed into the d3.partition object - every leaf in the tree must have a callback function, invoked upon selection
    n is the object invoking the menu – just make sure it has x any y attributes
    container is a d3 svg node that should host the menu
 */

module.exports = (function d3_sunburst_menu(tree, n, container) {
    var _radius = 140;
    var radius = 140;
    var _rotate = Math.PI / 2;
    var rotate = _rotate;
    var hue = d3.scale.category20(); // if node parents don't specify a fill attribute (i.e. a color)
    var backSize = 0.1; // back button size as percent of full circle
    var currentNode = tree; // start traversal at root level
    var menuWaiter;
    var idleTime = 300; // time (ms) between edge nudge and traversal
    var padAngle = 0.01;
    var dropshadow = false;
    var cornerRadius = 0; // 4 is neat but causes transition flickering if root has exactly two children

    // currying arcradius for maintaining nice ratio between inner and outer menu edge
    var arcradius = function(inner_outer) {
        return function(n) {
            return Math.atan(n.depth + inner_outer + 1.2 * radius / _radius - 1) * radius - inner_outer * 3;
        }
    }

    // default generator
    var arc = d3.svg.arc()
        .startAngle(function(d) {
            return rotate + d.x;
        })
        .endAngle(function(d) {
            return rotate + d.x + d.dx
        })
        .innerRadius(arcradius(0))
        .outerRadius(arcradius(1))
        .padAngle(padAngle)
        .cornerRadius(cornerRadius);

    // back peddle generator
    var backArc = d3.svg.arc()
        .startAngle(arc.startAngle())
        .endAngle(arc.endAngle())
        .innerRadius(arcradius(-0.2))
        .outerRadius(arcradius(1))
        .padAngle(4 * padAngle)
        .cornerRadius(cornerRadius);

    // if a node doesn't specify fill, it along with its siblings will form gradients of closest ancestor fill color
    function fill(d) {
        if (d.fill) return d3.hsl(d.fill);
        var p = d;
        var i = 0;

        while (p.depth > 1) {
            if (i == 0) {
                i = p.parent.children.indexOf(p) / (p.parent.children.length);
            }
            p = p.parent;
        }
        var c = p.fill ? fill(p) : d3.hsl(hue(label(p)));
        c.l = luminance(i);
        c.s = saturation(d.depth);
        //       c.s = 0.0; // b/w children
        d.fill = c;
        return c;
    }

    var saturation = d3.scale.linear()
        .domain([0, 4])
        .clamp(false)
        .range([0.5, 1]);

    var luminance = d3.scale.linear()
        .domain([0, 1])
        .clamp(false)
        .range([0.5, 0.15]);

    var partition = d3.layout.partition()
        .size([2 * Math.PI, radius])
        .value(function(d) {
            return d.depth;
        });

    partition.children(function(d) {
        return (d.depth) < 2 ? d._children : null;
    })
    partition
        .value(function(d) {
            // downplay size difference so that first level menu angles are somewhat equal
            return 1 / (d.parent.children.length * d.depth);
        })
        .nodes(tree);


    // we're only using n(ode) to set initial menu position
    var radialmenu = container.append("g").attr("id", "radialmenu").attr("transform", "translate(" + n.x + "," + n.y + ")");

    // define a dropshadow
    var filter = container.append("defs").append("filter")
        .attr("id", "dropshadow")
        .attr("x", "0")
        .attr("y", "0")
        .attr("width", "200%")
        .attr("height", "200%");

    filter.append("feOffset")
        .attr("result", "offOut")
        .attr("in", "SourceAlpha")
        .attr("dx", "0")
        .attr("dy", "0");

    filter.append("feGaussianBlur")
        .attr("result", "blurOut")
        .attr("in", "offOut")
        .attr("stdDeviation", "8");

    filter.append("feBlend")
        .attr("in", "SourceGraphic")
        .attr("in2", "blurOut")
        .attr("mode", "normal");

    // add optional dropshadow
    if (dropshadow) {
        radialmenu.attr("filter", "url(#dropshadow)");
    }

    // attach mousemove listener to container
    container.on("mousemove", function() {
        var currentArc, offset = -10; // activate move slighly before reaching menu edge
        var r = arc.outerRadius()(tree) - offset;
        var m = d3.mouse(this);
        // get menu position – todo: compile the regexp for performance...
        var s = radialmenu.attr("transform").match(/translate\(([\d\.]+),([\d\.]+)/).filter(function(a, b) {
            return b ? a : false;
        });
        if (((m[0] - s[0]) * (m[0] - s[0]) + (m[1] - s[1]) * (m[1] - s[1])) > r * r) {
            var A = Math.atan2((m[1] - s[1]), (m[0] - s[0]));
            radialmenu.attr("transform", "translate(" + Math.round(1 * m[0] - Math.cos(A) * r) + "," + Math.round(1 * m[1] - Math.sin(A) * r) + ")")
            clearTimeout(menuWaiter);
            //clickLocation = localToPolar(d3.mouse(this));
            if (currentArc = d3.select(".mouseover")[0][0]) {
                var m_local = d3.mouse(radialmenu[0][0]);
                menuWaiter = setTimeout(zoom, idleTime, currentArc.__data__, localToPolar(m_local));
            }
        }
    });


    traverse(tree);

    function localToPolar(m) {
        var rad = Math.sqrt(m[0] * m[0] + m[1] * m[1]);
        var deg = Math.atan2(m[1], m[0]);
        deg += 1 / 2 * Math.PI; // d3 uses radial origin = (0,1). Math uses (1,0)
        if (deg < 0) deg += 2 * Math.PI; // atan2 fix
        return [rad, deg];
    }

    // edge detected!
    function zoom(p, clickLocation) {
        var currentArc = d3.select(".mouseover")[0][0];
        if (currentArc == null) return;
        if (currentArc && (currentArc.__data__ != p)) return; // mouse moved out
        if (label(p) == "BACK") {
            traverse(currentNode.parent, clickLocation);
            return;
        }

        if (p.callback) {
            p.callback(n);
            return;
        }

        if (p.depth) { // zooming in
            traverse(p, clickLocation);
        } else { // zooming out
            traverse(p.parent, clickLocation);
        }
    }

    function traverse(tree, clickLocation) {
        radius = Math.pow(tree._children.length, 1 / 3) * _radius / 1.6;
        if (radius < _radius) {
            radius = _radius;
        }
        currentNode = tree;
        var cursorData = [];
        if (tree.parent) {
            partition.size([2 * Math.PI * (1 - backSize), radius]);
            rotate = clickLocation[1] + (Math.PI * backSize);
            cursorData = [{
                x: clickLocation[1] - (Math.PI * backSize) - rotate,
                dx: 2 * (Math.PI * backSize),
                id: "cursor",
                name: "BACK",
                fill: "#333"
            }];
        } else {
            partition.size([2 * Math.PI, radius]);
            rotate = _rotate;
        }
        group = d3.select("#radialmenu").selectAll("g.menuitem").data(partition(tree), function(n) {
            return n.id;
        });
        cursor = d3.select("#radialmenu").selectAll("g.cursor").data(cursorData, function(n) {
            return n.id;
        });

        cursor.exit().remove();

        cursor.enter()
            .append("g")
            .attr("class", "cursor")
            .append("path")
            .attr("id", function(d) {
                return "path_" + safelabel(d);
            })
            .each(addText)
            .each(addGradient)
            .each(addClipPath);

        group.exit().remove();
        group.enter().append("g")
            .attr("class", "menuitem")
            .append("path")
            .attr("class", "menuitem")
            .attr("id", function(d) {
                //                d._children = d.children;
                return "path_" + safelabel(d);
            })
            .each(addGradient)
            .each(addText)
            .each(addClipPath);


        group.style("fill-opacity", function(b) {
            return b.depth ? 1 : 0;
        })

        group.transition()
            .duration(600)
            //              .delay(function (n,i) {return i*3})
            .ease("elastic")
            .each(function() {
                d3.selectAll("g.radial")
                    .transition()
                    .ease("cubic-out")
                    .duration(500)
                    .attr("transform", function(n) {
                        return "translate(" + (0.8 * arc.innerRadius()(n) * Math.sin(n.x + n.dx / 2 + rotate)) + "," + 0.8 * (-arc.innerRadius()(n) * Math.cos(n.x + n.dx / 2 + rotate)) + ")";
                    })
                d3.selectAll("text.radial")
                    .transition()
                    .ease("cubic-out")
                    .duration(500)
                    .attr("transform", function(n) {
                        return "rotate(" + ((n.x + n.dx / 2 + rotate) - Math.PI / 2) * 180 / Math.PI + ")";
                    })
                d3.selectAll("text.curved")
                    .filter(function(d) {
                        return d.depth;
                    })
                    .attr("font-size", function(d) {
                        return arc.outerRadius()(d) - arc.innerRadius()(d);
                    })
                    .attr("dy", function(d) {
                        return (arc.outerRadius()(d) - arc.innerRadius()(d)) * .85;
                    })
                    .transition()
                    .duration(150)
                    .ease("ease-in")
                    .styleTween("fill-opacity", function(n) {
                        var f = d3.interpolate(0, 1);
                        return function(i) {
                            return f(i);
                        }
                    });
                d3.selectAll("path.labelpath")
                    .filter(function(d) {
                        return d.depth;
                    })
                    .attr("d", function(n) {
                        return "M " + (arc.outerRadius()(n) * Math.sin(n.x + n.dx / 2 + rotate - Math.PI / 2)) + " " + (-arc.outerRadius()(n) * Math.cos(n.x + n.dx / 2 + rotate - Math.PI / 2)) + " \
                            A " + arc.outerRadius()(n) + " " + arc.outerRadius()(n) + ", \
                            0, 0, 1, \
                            " + (arc.outerRadius()(n) * Math.sin(n.x + n.dx / 2 + rotate + Math.PI / 2)) + " " + (-arc.outerRadius()(n) * Math.cos(n.x + n.dx / 2 + rotate + Math.PI / 2));
                    })
            })
            .selectAll("path.menuitem")
            .attrTween("d", tweenDonut);

        cursor.select("path").transition()
            .duration(500)
            .ease("cubic-out")
            .attrTween("d", function(n) {
                var s = d3.interpolate({ depth: 0.9 }, n);
                return function(i) {
                    return backArc(s(i));
                };
            });

        d3.select("#radialmenu").selectAll("g")
            .on("mouseover", function(n) {
                this.setAttribute("class", "menuitem mouseover");
            })
            .on("mouseout", function(n) {
                this.setAttribute("class", "menuitem");
            });




        function tweenDonut(b) {
            // impact will make a node 'chisel' into the menu
            // currently unused, but setting impact proportional to the ping of REST providers is a given...
            // (reckon impact=3 is a max)
            var impact = 0;
            if (b.impact) {
                impact = b.impact;
                delete(b.impact);
            }
            var inout = (b.depth == 1) ? 1 : -0.4;
            var i = d3.interpolate({ depth: b.depth + inout + impact, x: b.x - 0.3 * inout }, b);
            return function(t) {
                return arc(i(t));
            };
        }
    }


    /** Determine label text */

    function label(n) {
        var label = n.name || n.id || "";
        label = label.toUpperCase();
        return label;
    }

    function safelabel(n) {
        var label = n.id || n.name || "";
        label = label.toUpperCase();
        label = label.replace(/[ )(]/g, '');
        return label;
    }

    /******************* ICONS *******************/
    /*
    g.filter(function (n,i){if (n.hasOwnProperty("icon")) {return true;}})
        .append("use").attr("xlink:href", function (n) {
            return n.icon;
        })
        .attr("transform", function(d) {
            var rotate = "rotate(" + (((d.x + d.dx / 2 - Math.PI / 2) / Math.PI * 180)+90) + ")"
            var x = -this.getBBox().width/2;
            var y = -radius/3*(d.depth+epicentre+1);
            var translate = "translate(" + x + "," + y + ")"

        return rotate + " " + translate;
            });

    var text = radial(g);
    */
    /******************* LABEL LAYOUTS *******************/
    /** Radial label layout */


    function addText(g) {
        if (!g.depth) return;
        if (g.icon) {
            // add icon
            return;
        }

        function should_radiate(g) {
            while (g.parent) {
                if (g["text-align"] == "radiate") {
                    return true;
                }
                g = g.parent;
            }

            return false;
        }

        try {
            if (g._children || !should_radiate(g)) {
                addCurvedText.call(this);
            } else {
                //  addCurvedText.call(this);
                addRadialText.call(this);
            }
        } catch (err) {
            // console.log("error for node: ");
            // console.log(g);
        }
    }

    function addClipPath(g) {
        d3.select(this.parentNode)
            .append("clipPath")
            .attr("id", function(d) {
                return "clipPath_" + safelabel(d);
            })
            .append("use")
            .attr("xlink:href", function(d) {
                return "#path_" + safelabel(d);
            });
    }

    function addCurvedText() {
        d3.select(this.parentNode)
            .append("path")
            .attr("class", "labelpath")
            .style("fill", "none")
            .attr("id", function(n) {
                return "textpath_" + safelabel(n);
            });


        d3.select(this.parentNode)
            .append("text")
            .attr("clip-path", function(n, i) {
                return "url(#clipPath_" + safelabel(n) + ")";
            })
            .attr("class", "nodelabeltext")
            .attr("class", "curved")
            .attr("pointer-events", "none")
            .append("textPath")
            .attr("xlink:href", function(n) {
                return "#textpath_" + safelabel(n);
            })
            .text(label)
            .attr("startOffset", function(n) {
                return "50%";
            })
            .attr("text-anchor", "middle")
            .attr("letter-spacing", function(n) {
                return 3 - n.depth;
            });

    }

    function addRadialText(g) {
        d3.select(this.parentNode)
            .append("g")
            .attr("class", "radial")
            .append("text")
            .text(label)
            .attr("class", "radial")
            .attr("dx", 50)
    }

    function addGradient() {
        var gradients = d3.select(this.parentNode).append("radialGradient")
            .attr("id", function(n) {
                return "gradient_" + safelabel(n);
            })
            .attr("cx", "0%").attr("cy", "0%").attr("fx", "0%").attr("fy", "0%").attr("r", "100%");
        gradients.append("stop").attr("stop-color", function(n) {
                return fill(n).brighter();
            })
            .attr("offset", "0%").attr("stop-opacity", "100%");

        gradients.append("stop").attr("stop-color", function(n) {
                return fill(n);
            })
            .attr("offset", "100%")
            .attr("stop-opacity", "100%");

        d3.select(this).style("fill", function(n) {
            return "url('#gradient_" + safelabel(n) + "')";
        });

    }


    return {
        redraw: function() {
            traverse(currentNode);
        },
        remove: function() { radialmenu.remove(); },
        tree: function() {
            return tree;
        }
    };
});
