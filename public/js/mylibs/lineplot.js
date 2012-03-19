function lineplot(param) {


  // variables
  var data = [],
      target = param.target || 'body',
      jitter = +param.jitter || 0,
      pointsize = +param.pointsize || 1,
      plotcolors = d3.scale.category10(),
      w = +param.width || 200,
      h = +param.height || 200,
      datapoints = param.datapoints,
      drawline = param.drawline,
      interpolate = param.interpolate,
      yticks = param.yticks || 5,
      xticks = param.xticks || 5,
      ylabels = param.ylabels || 5,
      xlabels = param.xlabels || 5,
      yscale = param.yscale || 1,
      xgrid = param.xgrid || false,
      ygrid = param.ygrid || false,
      xrange = param.xrange || [-5,5],
      dt = Math.max(0.01,Math.abs(xrange[1]-xrange[0])/200),
      count = Math.min(200,Math.abs(xrange[1]-xrange[0])/dt);


  if (param.fu) {
    var funs = param.fu;
    for (var f= 0; f<funs.length; f++) {
      var fu = funs[f];
      if (fu == undefined) continue;
      var t = xrange[0];
      var dat = [];
      for (var i=0; i<count; i++) {
        var py = fu(t);
        dat.push(py);
        t += dt;
      }
      data.push(dat);
    }
  }




  //console.log(data);

  if (jitter) {
    for (var i=0; i< data.length; i++) {
      var dat = data[i];
      for (var j= 0; j < dat.length; j++) { 
        dat[j] += jitter*(Math.random()-0.5);
      }
    }
  }
  var bdata = data[0];   // the first data set is used for scales/ranges/axes
  if (bdata == undefined) return;

  var yrange = param.yrange  || [d3.min(bdata), d3.max(bdata)],
      margin = (w > 100) ? 24 : 4,
      rmarg = (w>100 && param.labels ) ? 80 : 4,
      y = d3.scale.linear().domain(yrange).range([0 + margin, h - margin]),
      //iix = d3.scale.linear()
          //.domain([1, bdata.length-1])
          //.range(xrange),
      iix = function(i) { return xrange[0] + i*dt; },
      x = d3.scale.linear()
          .domain(xrange)
          .range([0 + margin, w - margin]),
      vis = d3.select(target)
          .append("svg:svg")
          .attr("width", w+rmarg)
          .attr("height", h),
      g = vis.append("svg:g")
          .attr("transform", "translate(0, "+h+")") ,
      line = d3.svg.line()
          .x(function(d,i) { return x(iix(i)); })
          .y(function(d) { if(isNaN(d)) { return h+10;}; 
                           if (+d < (yrange[0]-2) ) return h+10;
                           if (+d > (yrange[1]+2) ) return -h-10;
                           return -1 * y(d); });

  // plotting
  if (interpolate) line.interpolate(interpolate);
    // draw the line thru points 
  if (drawline || !datapoints) {
    for (i=0; i< data.length; i++) {
      var dat = data[i];
      g.append("svg:path").attr("d", line(dat)).attr("stroke",plotcolors(i) );
    }
  }

  // mark the datapoint
  if (datapoints) 
    for (var ii=0; ii< data.length; ii++) {
      var dat = data[ii];
      for (var jj=0; jj< dat.length; jj++) {
        g.append("svg:circle")
        .attr("cx", x(iix(jj)))
        .attr("cy", -1 * y(dat[jj]))
        .attr("stroke", plotcolors(ii))
        .attr("fill", "none")
        .attr("r", 1)
      }
    }

  if (param.points) {
    console.log("some points found",param.points);
    for (var pp=0; pp< param.points.length; pp++) {
      var poi = param.points[pp];
      var ppx = poi[0];
      var ppy = poi[1];
      if (ppx.length != ppy.length) continue;
      for (var tt=0; tt< ppx.length; tt++) {
        var px = ppx[tt];
        var py = ppy[tt];
        g.append("svg:circle")
        .attr("cx", x(px))
        .attr("cy", -1 * y(py))
        .attr("stroke", plotcolors(data.length + pp))
        .attr("fill", "none")
        .attr("r", pointsize)
      }
    }
  }
  if (param.text ) {
    var text = param.text;
    for (i=0; i<text.length; i++) {
      var tx = text[i];
      g.append("svg:text")
        .attr("class", "textlabel")
        .text(tx[2])
        .attr("x", x(tx[0]) )
        .attr("y", -1*y(tx[1]) )
        .attr("text-anchor", "right")
        .attr("dy", -5)
        .attr("dx", 3)
    }

  }

  if (param.labels && w > 100) {
    var labels = param.labels.split(',');
    g.append("svg:rect")
      .attr("x", w)
      .attr("y", -h+30)
      .attr("height", 15+labels.length*10)
      .attr("width", 200)
      .attr("fill", "white")
      .attr("opacity",0.7);
    for (i=0; i<labels.length; i++) {
      g.append("svg:line")
        .attr("x1", w+40 )
        .attr("y1", -h+i*(10)+40)
        .attr("stroke", plotcolors(i) )
        .attr("x2", w+70)
        .attr("y2", -h+i*(10)+40)
        .attr("stroke-width", 2)
      g.append("svg:text")
        .attr("class", "funlabel")
        .text(labels[i])
        .attr("x", w+38 )
        .attr("y", -h+i*(10)+40)
        .attr("text-anchor", "right")
        .attr("dy", 4)
       .attr("dx", function() { return 0 - this.getComputedTextLength(); })
    }

  }
  
    // x-axis
  var xp = -1*y(0);
  xp = (xp < 0) ? xp : -5;
  xp = (xp > -h) ? xp : -5; 
  var yp = x(0);
  yp = (yp > 0) ? yp : 5;
  yp = (yp < w) ? yp : 5; 
  g.append("svg:line")
      .attr("x1", x(iix(0)))
      .attr("y1", xp)
      .attr("x2", x(iix(w)))
      .attr("y2", xp)
      .attr("stroke", "black" )
      .attr("stroke-width", 0.3)

    // y-axis
  g.append("svg:line")
      .attr("x1", yp)
      .attr("y1", -1 * y(yrange[0]))
      .attr("x2", yp)
      .attr("y2", -1 * y(yrange[1]))
      .attr("stroke", "black" )
      .attr("stroke-width", 0.3)
  
  if (w>100 && h>100) {
    // only draw ticks and labels if
    // plot is reasonably big

    // labels for x-axis
    g.selectAll(".xLabel")
        .data(x.ticks(xlabels))
        .enter().append("svg:text")
        .attr("class", "xLabel")
        .text(String)
        .attr("x", function(d) { return x(d) })
        .attr("y", xp)
        .attr("text-anchor", "right")
        .attr("dy", -2)
        .attr("dx", 2)

    // labels for y-axis
    g.selectAll(".yLabel")
        .data(y.ticks(ylabels))
        .enter().append("svg:text")
        .attr("class", "yLabel")
        .text(String)
        .attr("x", yp)
        .attr("y", function(d) { return -1 * y(d) })
        .attr("text-anchor", "right")
        .attr("dy", -2)
        .attr("dx", 2)
    
    g.selectAll(".xTicks")
        .data(x.ticks(xticks))
        .enter().append("svg:line")
        .attr("class", "xTicks")
        .attr("x1", function(d) { return x(d); })
        .attr("y1", xp-2)
        .attr("x2", function(d) { return x(d); })
        .attr("y2", xp+2)

    g.selectAll(".yTicks")
        .data(y.ticks(yticks))
        .enter().append("svg:line")
        .attr("class", "yTicks")
        .attr("y1", function(d) { return -1 * y(d); })
        .attr("x1", yp-3)
        .attr("y2", function(d) { return -1 * y(d); })
        .attr("x2", yp+3)

    if (xgrid) g.selectAll(".xgrid")
        .data(x.ticks(xticks))
        .enter().append("svg:line")
        .attr("class", "xgrid")
        .attr("stroke", "black" )
        .attr("stroke-width", 0.1)
        .attr("x1", function(d) { return x(d); })
        .attr("y1", -margin)
        .attr("x2", function(d) { return x(d); })
        .attr("y2", -h+margin)
    if (ygrid) g.selectAll(".ygrid")
        .data(y.ticks(yticks))
        .enter().append("svg:line")
        .attr("class", "xgrid")
        .attr("stroke", "black" )
        .attr("stroke-width", 0.1)
        .attr("y1", function(d) { return -1 * y(d); })
        .attr("x1", margin)
        .attr("y2", function(d) { return -1 * y(d); })
        .attr("x2", w-margin)
  }
};
