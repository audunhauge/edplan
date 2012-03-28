function normalizeFunction(txt,nosubst) {
  // convert 2x^2+3(x-2)(x+1) to 2*pow(t,2)+3*(t-2)*(t+1)
  // x,y => t
  nosubst = (typeof nosubst != "undefined") ? 1 : 0;
  var fu = txt.replace(/ /g,'').replace(/exp/gm,'©');
      if (!nosubst) fu = fu.replace(/[xy]/gm,'t');
      fu = fu.replace(/([xyt])\^([0-9]+)/gm,function(m,n,o) { return 'pow('+n+','+o+')'; } ); 
      fu = fu.replace(/([0-9]+)([a-z(])/gm,function(m,f,e) { return f+'*'+e; });
      fu = fu.replace(/tt/gm,'t*t');
      fu = fu.replace(/tt/gm,'t*t');
      fu = fu.replace(/xx/gm,'x*x');
      fu = fu.replace(/xx/gm,'x*x');
      fu = fu.replace(/yy/gm,'y*y');
      fu = fu.replace(/yy/gm,'y*y');
      fu = fu.replace(/\)\(/gm,')*(').replace(/©/gm,'exp');
  return 'with(Math) { return ' + fu + '; }';
}

function fubug(fub) {
  // just a function to enable debugging
  console.log(fub);
}


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

  var funs,f,fu,ufu,i,j,t,py,dat,futs;

  if (param.userfu) {      // functions picked from text input on page
    funs = param.userfu;
    for (f= 0; f<funs.length; f++) {
      ufu = funs[f];
      if (ufu == undefined) continue;
      try {
        fu = new Function("t",normalizeFunction(ufu));
      } catch(err) {
        console.log("bad function",ufu);
        continue;
      }
      t = xrange[0];
      dat = [];
      py;
      for (i=0; i<count; i++) {
        try {
          py = fu(t);
        } catch(er) {
          py = py || 0;
        }
        dat.push(py);
        t += dt;
      }
      data.push(dat);
    }
  }

  if (param.fu) {
    funs = param.fu;
    for (f= 0; f<funs.length; f++) {
      fu = funs[f];
      if (fu == undefined) continue;
      t = xrange[0];
      dat = [];
      py;
      for (i=0; i<count; i++) {
        try {
          py = fu(t);
        } catch(er) {
          py = py || 0;
        }
        dat.push(py);
        t += dt;
      }
      data.push(dat);
    }
  }




  //console.log(data);

  if (jitter) {
    for (i=0; i< data.length; i++) {
      dat = data[i];
      for (j= 0; j < dat.length; j++) { 
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
      vis = d3.select(target+" div.graph").html('')
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
    //console.log("some points found",param.points);
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

function vfield(param) {
  // plot a direction field for f(x,y) = ..
  // for xrange, yrange
  // for each point plot a short direction vector


  // variables
  var data = [],
      fuxy =  new Function("x","y",normalizeFunction('0.5y-x',1)),
        // default function to plot if non given
      target = param.target || 'body',
      plotcolors = d3.scale.category10(),
      w = +param.width || 400,
      h = +param.height || 300,
      yticks = param.yticks || 5,
      xticks = param.xticks || 5,
      ylabels = param.ylabels || 5,
      xlabels = param.xlabels || 5,
      yscale = param.yscale || 1,
      xgrid = param.xgrid || false,
      ygrid = param.ygrid || false,
      xrange = param.xrange || [-5,5],
      yrange = param.yrange || [-5,5],
      dx = Math.abs(xrange[1]-xrange[0])/30,
      xcount = 30,
      dy = Math.abs(yrange[1]-yrange[0])/30,
      ycount = 30;

  if (param.fu) fuxy = param.fu;
    // function defined in quiz

  if (param.userfu) {      // functions picked from text input on page
    var ufu = param.userfu;
    try {
        fuxy = new Function("x","y",normalizeFunction(ufu,1));
      } catch(err) {
        console.log("bad function",ufu);
    }
  }




  //console.log(data);


  var margin = (w > 100) ? 24 : 4,
      rmarg = (w>100 && param.labels ) ? 80 : 4,
      y = d3.scale.linear().domain(yrange).range([0 + margin, h - margin]),
      x = d3.scale.linear() .domain(xrange).range([0 + margin, w - margin]),
      iix = function(i) { return xrange[0] + i*dx; },
      iiy = function(i) { return yrange[0] + i*dy; },
      x = d3.scale.linear()
          .domain(xrange)
          .range([0 + margin, w - margin]),
      vis = d3.select(target+" div.graph").html('')
          .append("svg:svg")
          .attr("width", w+rmarg)
          .attr("height", h),
      g = vis.append("svg:g")
          .attr("transform", "translate(0, "+h+")");

   // calculate vectors for the points
   var i,j,fxy,tx,ty;
   tx = xrange[0];
      for (i=0; i<xcount; i++) {
        ty = xrange[0];
        for (j=0; j<ycount; j++) {
          fxy = fuxy(tx,ty);
            g.append("svg:line")
            .attr("stroke", plotcolors(1))
            .attr("stroke-width",0.4)
            .attr("x1", x(tx) )
            .attr("y1", -y(ty))
            .attr("x2", x(tx)+3 )
            .attr("y2", -y(ty)-fxy)
            g.append("svg:circle")
            .attr("cx", x(tx) )
            .attr("cy", -y(ty))
            .attr("fill",plotcolors(2) )
            .attr("r", 0.5)
          ty += dy;
        }
        tx += dx;
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
  var xp =  -margin; 
  var yp =  margin; 
  g.append("svg:line")
      .attr("x1", x(iix(0)))
      .attr("y1", -margin)
      .attr("x2", x(xrange[0]+xcount*dx)  )
      .attr("y2", -margin)
      .attr("stroke", "black" )
      .attr("stroke-width", 0.3)
  g.append("svg:line")
      .attr("x1", x(iix(0)))
      .attr("y1", -1 * y(yrange[1]))
      .attr("x2", x(xrange[0]+xcount*dx)  )
      .attr("y2", -1 * y(yrange[1]))
      .attr("stroke", "black" )
      .attr("stroke-width", 0.3)

    // y-axis
  g.append("svg:line")
      .attr("x1", margin)
      .attr("y1", -1 * y(yrange[0]))
      .attr("x2", margin)
      .attr("y2", -1 * y(yrange[1]))
      .attr("stroke", "black" )
      .attr("stroke-width", 0.3)
  g.append("svg:line")
      .attr("x1", x(xrange[0]+xcount*dx)  )
      .attr("y1", -1 * y(yrange[0]))
      .attr("x2", x(xrange[0]+xcount*dx)  )
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
