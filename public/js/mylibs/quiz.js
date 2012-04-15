// start of quiz class
// first draft just presents two textareas for writing a
// canonical answer and comparing against a stud-text



function quizDemo() {
    var s = '<div class="sized1 centered gradback">'
            + '<h1 class="retainer" id="oskrift">Questionbank - editor</h1>'
            + ' <style type="text/css"> '
            + ' path.link {'
            + '   fill: none;'
            + '   stroke: #666;'
            + '   stroke-width: 1.5px;'
            + ' }'
            + ' marker#licensing {'
            + '   fill: green;'
            + ' }'
            + ' path.link.licensing {'
            + '   stroke: green;'
            + ' }'
            + ' path.link.resolved {'
            + '   stroke-dasharray: 0,2 1;'
            + ' }'
            + ' circle {'
            + '   fill: #ccc;'
            + '   stroke: #333;'
            + '   stroke-width: 1.5px;'
            + ' }'
            + ' text {'
            + '   font: 10px sans-serif;'
            + '   pointer-events: none;'
            + ' }'
            + ' text.shadow {'
            + '   stroke: #fff;'
            + '   stroke-width: 3px;'
            + '   stroke-opacity: .8;'
            + ' }'

            + '     </style>'
            + '<idv id="rapp">Indekserer og krysskobler alle ord i alle dine spørsmål ... vent litt ...</div>';
    $j("#main").html(s);
var links = [];
    $j.get( "/wordindex", 
         function(data) {
           if (data == undefined) { 
             $j("#rapp").html("Du har ingen spørsmål, er ikke logget inn eller er ikke lærer");
             return;
           }
           //console.log(data);
           var words = '';
           var wordobj = data.wordlist;
           var wordlist = [];
           for (var w in wordobj) {
             var wo = wordobj[w];
             wo.w = w;
             wordlist.push(wo);
           }
           var relations = data.relations;
           relations.sort(function(b,a) {return +a[0] - +b[0]; } );
           // relations is now [ samewordcount,question1,question2 ]
           wordlist.sort(function(a,b) { return +b.qcount - +a.qcount; });
           for (var w in wordlist) {
             var wo = wordlist[w];
             words += wo.w + ' ' + wo.qcount + ', ';
           }
           words += '<h4>Relations</h4>';

           for (var i=0; i < relations.length; i+=1) {
             var re = relations[i];
             words += re.join(',') + "<br>";
             if (re[0] > 9)
             links.push({ source:""+re[1], target:""+re[2], type:'resolved' } )
           }

           $j("#rapp").html(words);
var nodes = {};

// Compute the distinct nodes from the links.
links.forEach(function(link) {
  link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
  link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
  link.type = 'suit';
});

var w = 960,
    h = 900;

var force = d3.layout.force()
    .nodes(d3.values(nodes))
    .links(links)
    .size([w, h])
    .linkDistance(30)
    .charge(-50)
    .on("tick", tick)
    .start();

var svg = d3.select("body").append("svg:svg")
    .attr("width", w)
    .attr("height", h);

// Per-type markers, as they don't inherit styles.
svg.append("svg:defs").selectAll("marker")
    .data(["suit", "licensing", "resolved"])
  .enter().append("svg:marker")
    .attr("id", String)
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 15)
    .attr("refY", -1.5)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
  .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5");

var path = svg.append("svg:g").selectAll("path")
    .data(force.links())
  .enter().append("svg:path")
    .attr("class", function(d) { return "link " + d.type; })
    .attr("marker-end", function(d) { return "url(#" + d.type + ")"; });

var circle = svg.append("svg:g").selectAll("circle")
    .data(force.nodes())
  .enter().append("svg:circle")
    .attr("r", 6)
    .call(force.drag);

var text = svg.append("svg:g").selectAll("g")
    .data(force.nodes())
  .enter().append("svg:g");

// A copy of the text with a thick white stroke for legibility.
text.append("svg:text")
    .attr("x", 8)
    .attr("y", ".31em")
    .attr("class", "shadow")
    .text(function(d) { return d.name; });

text.append("svg:text")
    .attr("x", 8)
    .attr("y", ".31em")
    .text(function(d) { return d.name; });

// Use elliptical arc path segments to doubly-encode directionality.
function tick() {
  path.attr("d", function(d) {
    var dx = d.target.x - d.source.x,
        dy = d.target.y - d.source.y,
        dr = Math.sqrt(dx * dx + dy * dy);
    return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
  });

  circle.attr("transform", function(d) {
    return "translate(" + d.x + "," + d.y + ")";
  });

  text.attr("transform", function(d) {
    return "translate(" + d.x + "," + d.y + ")";
  });
}

         });

}

