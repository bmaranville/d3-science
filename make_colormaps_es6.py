from pylab import *
from numpy import outer
import json
from collections import OrderedDict

x = linspace(0, 1.0, 256, True) # make all 256 steps
maps=[m for m in cm.cmap_d if not m.endswith("_r")]
maps.sort()
colors_dict = OrderedDict()
for m in maps:
    clist = [cm.colors.rgb2hex(c) for c in get_cmap(m)(x).tolist()]
    colors_dict[m] = clist

header = """\
////////////////////////////////////////
// Colormaps borrowed from matplotlib //
////////////////////////////////////////
import * as d3 from 'd3'
export const colormap_data =
"""

footer = """
export const colormap_names = Object.keys(colormap_data);

var x = d3.range(256);

export function get_colormap(cmap_name) {
  var cmap = d3.scale.linear()
    .domain(x)
    .range(colormap_data[cmap_name])
  return cmap
}

"""
with open("src/colormap.js", "w") as outfile:
    outfile.write(header)
    outfile.write(json.dumps(colors_dict))
    outfile.write(footer)
    
with open("colormaps.json", "w") as outfile:
    outfile.write(json.dumps(colors_dict))
