from pylab import *
from numpy import outer
import json
from collections import OrderedDict

x = linspace(0, 1.0, 256, True) # make all 256 steps
maps=[m for m in cm.datad if not m.endswith("_r")]
maps.sort()
colors_dict = OrderedDict()
for m in maps:
    clist = [cm.colors.rgb2hex(c) for c in get_cmap(m)(x).tolist()]
    colors_dict[m] = clist

header = """\
////////////////////////////////////////
// Colormaps borrowed from matplotlib //
////////////////////////////////////////

var cm = (function() {
  var colormap_data = 
"""

footer = """
  var colormap_names = Object.keys(colormap_data)
  var x = [];
  for (var i=0; i<256; i++) {
    x[i] = i;
  }
  var get_colormap = function(cmap_name) {
    var cmap = d3.scale.linear()
      .domain(x)
      .range(colormap_data[cmap_name])
    return cmap
  }
  return {
    colormap_data: colormap_data,
    colormap_names: colormap_names,
    get_colormap: get_colormap
  }
})();
"""
with open("get_colormap.js", "w") as outfile:
    outfile.write(header)
    outfile.write(json.dumps(colors_dict))
    outfile.write(footer)
    
with open("colormaps.json", "w") as outfile:
    outfile.write(json.dumps(colors_dict))
