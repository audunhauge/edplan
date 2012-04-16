// editor for quiz_questions
// finds all questions that are linked (share similar words)
// draws a pic of nodes connected with arches based on connections between the words


function quizDemo() {
    var s = '<div class="sized1 centered gradback">'
            + '<h1 class="retainer" id="oskrift">Questionbank - editor</h1>'
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
          var questions = data.questions;
          var tags = data.tags;
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

          var used = {};
          for (var i=0; i < relations.length; i+=1) {
             var re = relations[i];
             words += re.join(',') + "<br>";
             if (re[0] > 8) {
               links.push({ source:""+re[1], target:""+re[2], fat:re[0], type:'strong' } )
               used[re[1]] = 1;
               used[re[2]] = 1;
             }
          }
          for (var i=0; i < relations.length; i+=1) {
             var re = relations[i];
             if (!used[re[1]] || !used[re[2]] ) {
               links.push({ source:""+re[1], target:""+re[2], fat:re[0], type:'weak' } )
               used[re[1]] = 1;
               used[re[2]] = 1;
             }
          }
          words += '<div id="info">hehehhihihohahhe</div>';

          $j("#rapp").html(words);
          $j("#info").draggable();
          var nodes = {};
          var now = new Date();

          // Compute the distinct nodes from the links.
          links.forEach(function(link) {
            var q = questions[link.source]; 
            console.log(now.getTime() - q.created);
            link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
            link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
            var tty = "weak";
            if (link.fat > 7 || (link.fat > 2 && link.fat > 0.4 * q.wcount)) tty= "medium";
            if (link.fat > 15 || (link.fat > 4 && link.fat > 0.75 * q.wcount)) tty= "strong";
            if (link.fat > 25 || (link.fat > 9 && link.fat > 0.95 * q.wcount)) tty= "identity";
            link.type = tty;
          });

          function showinfo(d,i) {
            ty = d.name; var q = questions[ty]; 
            var param = {};
            try {
              param = JSON.parse(q.qtext);
            }
            catch (err) {
              param = {};
            }
            console.log(param);
            var shorttext = param.display || '&lt; no text &gt;';
            shorttext = shorttext.replace(/</g,'&lt;');
            shorttext = shorttext.replace(/>/g,'&gt;');
            var s = '<table>';
            s += '<tr><th>Type</th><td>'+q.qtype+'</td></tr>';
            s += '<tr><th>Name</th><td>'+q.name+'</td></tr>';
            s += '<tr><th>Text</th><td>'+shorttext+'</td></tr>';
            s += '<tr><th>Tags</th><td>'+param.tag+'</td></tr>';
            s += '<tr><th>Code</th><td>'+param.code+'</td></tr>';
            s += '</table>';
            $j("#info").html(s);
          }

          var w = 1424,
              h = 1424;

          var tcolors = d3.scale.category20();

          var force = d3.layout.force()
              .nodes(d3.values(nodes))
              .links(links)
              .size([w, h])
              .linkDistance(30)
              .charge(-40)
              .on("tick", tick)
              .start();

          var svg = d3.select("body").append("svg:svg")
              .attr("width", w)
              .attr("height", h);

          // Per-type markers, as they don't inherit styles.
          svg.append("svg:defs").selectAll("marker")
              .data(["weak", "medium", "strong","identity"])
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
              .attr("r", function(d,i) { var ty = d.name; var q = questions[ty]; return 0.1+1.5*Math.log(q.wcount);})
              .style("fill", function(d,i) { var ty = d.name; var q = questions[ty]; return tcolors(q.qtype); } )
              .on("click",showinfo)
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

