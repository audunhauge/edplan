function lineplot(param) {


  // variables
  var data = param.ylist || [1,2,3,4],
      target = param.target || 'body',
      jitter = +param.jitter || 0;
      w = +param.width || 200,
      h = +param.heigth || 200,
      datapoints = param.datapoints;
      interpolate = param.interpolate,
      yscale = param.yscale || 1,
      xrange = param.xrange || [-5,5];

  if (param.fu) {
    data = [];
    var fu = param.fu;
    var dt = Math.max(0.1,Math.abs(xrange[1]-xrange[0])/200);
    var count = Math.min(200,Math.abs(xrange[1]-xrange[0])/dt);
    var t = xrange[0];
    for (var i=0; i<count; i++) {
      data.push(fu(t));
      t += dt;
    }
  }

  if (jitter) {
    for (var i=0; i< data.length; i++) {
      data[i] += jitter*(Math.random()-0.5);
    }
  }

  var yrange = param.yrange  || [d3.min(data), d3.max(data)],
      margin = (w > 100) ? 24 : 4,
      y = d3.scale.linear().domain(yrange).range([0 + margin, h - margin]),
      iix = d3.scale.linear()
          .domain([0, data.length-1])
          .range(xrange),
      x = d3.scale.linear()
          .domain(xrange)
          .range([0 + margin, w - margin]),
      vis = d3.select(target)
          .append("svg:svg")
          .attr("width", w)
          .attr("height", h),
      g = vis.append("svg:g")
          .attr("transform", "translate(0, "+h+")") ,
      line = d3.svg.line()
          .x(function(d,i) { return x(iix(i)); })
          .y(function(d) { return -1 * y(d); });

  // plotting
  if (interpolate) line.interpolate(interpolate);
    // draw the line thru points 
  if (!datapoints) {
    g.append("svg:path").attr("d", line(data));
  }

  /*
  g.append("svg:circle")
    .attr("cx", x(0))
    .attr("cy", -1*y(0))
    .attr("stroke", "blue")
    .attr("fill", "green")
    .attr("r", 2)
  */

  // mark the datapoint
  if (datapoints) 
   vis.selectAll("circle")
    .data(data)
    .enter().append("svg:circle")
    .attr("cx", function(d,i) { return x(iix(i)); })
    .attr("cy", function(d) { return h - y(d); })
    .attr("stroke", "red")
    .attr("fill", "none")
    .attr("r", 1)
  
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

    // y-axis
  g.append("svg:line")
      .attr("x1", yp)
      .attr("y1", -1 * y(yrange[0]))
      .attr("x2", yp)
      .attr("y2", -1 * y(yrange[1]))
  
  if (w>100 && h>100) {
    // only draw ticks and labels if
    // plot is reasonably big

    // labels for x-axis
    g.selectAll(".xLabel")
        .data(x.ticks(5))
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
        .data(y.ticks(4))
        .enter().append("svg:text")
        .attr("class", "yLabel")
        .text(String)
        .attr("x", yp)
        .attr("y", function(d) { return -1 * y(d) })
        .attr("text-anchor", "right")
        .attr("dy", -2)
        .attr("dx", 2)
    
    g.selectAll(".xTicks")
        .data(x.ticks(5))
        .enter().append("svg:line")
        .attr("class", "xTicks")
        .attr("x1", function(d) { return x(d); })
        .attr("y1", xp-1)
        .attr("x2", function(d) { return x(d); })
        .attr("y2", xp+1)

    g.selectAll(".yTicks")
        .data(y.ticks(4))
        .enter().append("svg:line")
        .attr("class", "yTicks")
        .attr("y1", function(d) { return -1 * y(d); })
        .attr("x1", yp-3)
        .attr("y2", function(d) { return -1 * y(d); })
        .attr("x2", yp+3)
  }
};
