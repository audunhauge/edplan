function lineplot(param) {


  // variables
  var data = param.ylist || [[1,2,3,4]],
      target = param.target || 'body',
      jitter = +param.jitter || 0;
      plotcolors = d3.scale.category10();
      w = +param.width || 200,
      h = +param.heigth || 200,
      datapoints = param.datapoints;
      interpolate = param.interpolate,
      yscale = param.yscale || 1,
      xrange = param.xrange || [-5,5];



  if (param.fu) {
    data = [];
    var funs = param.fu;
    var dt = Math.max(0.1,Math.abs(xrange[1]-xrange[0])/200);
    var count = Math.min(200,Math.abs(xrange[1]-xrange[0])/dt);
    for (var f= 0; f<funs.length; f++) {
      var fu = funs[f];
      var t = xrange[0];
      data[f] = [];
      for (var i=0; i<count; i++) {
        var py = fu(t);
        /*
        if (isNaN(py)) {
          py = 1;
        } 
        */
        data[f].push(py);
        t += dt;
      }
    }
  }

  console.log(data);

  if (jitter) {
    for (var i=0; i< data.length; i++) {
      var dat = data[i];
      for (var j= 0; j < dat.length; j++) { 
        dat[j] += jitter*(Math.random()-0.5);
      }
    }
  }
  var bdata = data[0];   // the first data set is used for scales/ranges/axes

  var yrange = param.yrange  || [d3.min(bdata), d3.max(bdata)],
      margin = (w > 100) ? 24 : 4,
      y = d3.scale.linear().domain(yrange).range([0 + margin, h - margin]),
      iix = d3.scale.linear()
          .domain([0, bdata.length-1])
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
          .y(function(d) { if(isNaN(d)) { return h-10;}; return -1 * y(d); });

  // plotting
  if (interpolate) line.interpolate(interpolate);
    // draw the line thru points 
  if (!datapoints) {
    for (i=0; i< data.length; i++) {
      var dat = data[i];
      g.append("svg:path").attr("d", line(dat)).attr("stroke",plotcolors(i) );
    }
  }

  if (param.labels && w > 100) {
    var labels = param.labels;
    for (i=0; i<labels.length; i++) {
      g.append("svg:line")
        .attr("x1", w-40 )
        .attr("y1", -h+i*(10)+40)
        .attr("stroke", plotcolors(i) )
        .attr("x2", w-10)
        .attr("y2", -h+i*(10)+40)
        .attr("stroke-width", 2)
      g.append("svg:text")
        .attr("class", "funlabel")
        .text(labels[i])
        .attr("x", w-60 )
        .attr("y", -h+i*(10)+40)
        .attr("text-anchor", "right")
        .attr("dy", 4)
        .attr("dx", 0)
    }

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
    .data(bdata)
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
