// editor for quiz_questions
// finds all questions that are linked (share similar words)
// draws a pic of nodes connected with arches based on connections between the words


var filter = 'multiple';
var limit = "17";
var keyword = 'all';
var qtypes = 'all multiple fillin dragdrop textarea math diff info sequence numeric'.split(' ');
var mylink;
var orbits,
    wordobj,
    questions;

function showinfo(ty,lim,fil) {
  // user clicked on a question node
  // fetch all connected questions and set up question-list editor
  lim   = typeof(lim) != 'undefined' ? lim : limit;
  fil   = typeof(fil) != 'undefined' ? fil : filter;
  limit = lim;
  filter = fil;
  mylink = ty;
  var clusterlist = [ ty ];       // array of connected questions
  var cluster = orbits[ty];
  for (var star in cluster) {
    if (cluster[star] < +limit) continue;
    var q = questions[star]; 
    if (filter != 'all' && q && q.qtype != filter) continue;
    clusterlist.push(star);
  }
  questEditor(clusterlist) 
}

function questEditor(clusterlist) {
  $j.getJSON('/getcontainer',{ givenqlist:clusterlist.join(',') }, function(qlist) {
    var showqlist = wb.render.normal.editql(qlist,true);
    var select = gui( { elements:{ "action":{ klass:"", value:'',  type:"select", options:['velg handling','slett','cleartags','tag'] } } } );
    var editor = '<br>Med valgte ' + select.action + '<input id="doit" type="submit" name="doit" value="Utfør">';
    $j("#info").html(filter+showqlist.join('') + editor );
    $j("#info").undelegate(".edme","click");
    $j("#info").delegate(".edme","click", function() {
            var myid = $j(this).parent().attr("id").split('_')[1];
            editquestion(myid,"#info");
        });
    $j("#info").undelegate("#doit","click");
    $j("#info").delegate("#doit","click", function() {
           var action = $j("#info option:selected").text();
           if (action == 'slett') {
              var tags = [];
              var tagged = $j("#info input:checked");
              for (var i=0,l=tagged.length; i<l; i++) {
                var b = tagged[i];
                var tname = $j(b).parent().attr("id").substr(3).split('_')[0];
                tags.push(tname);
              }
              if (tags.length) {
                $j.post('/editquest', { action:'delete', qidlist:tags.join(',') }, function(resp) {
                  showinfo(mylink,limit,filter);
                });
              }
           }
        });
  });
}

function quizDemo() {
    var s = '<div class="sized1 centered gradback">'
            + '<h1 class="retainer" id="oskrift">Questionbank - editor</h1>'
            + '<span id="filterbox"></span>'
            + '<span id="limitbox"></span>'
            + '<div id="choosen"><div id="wordlist"></div></div>'
            + '<div id="info"><h4>Question editor</h4> Leser og indekserer alle dine spørsmål ...</div>'
            + '<div id="rapp"></div>'
            ;
    $j("#main").html(s);
    $j("#info").draggable();
    var relations,
        words,
        wordlist,
        tags,
        relations ;
    $j.get( "/wordindex", 
        function(data) {
          if (data == undefined) { 
             $j("#rapp").html("Du har ingen spørsmål, er ikke logget inn eller er ikke lærer");
             return;
          }
          $j("#rapp").html("Listene mottatt fra server ....");

           //console.log(data);
          words = '';
          wordobj = data.wordlist;
          orbits = data.orbits;
          wordlist = [];
          questions = data.questions;
          tags = data.tags;
          //console.log(tags);
          for (var w in wordobj) {
             var wo = wordobj[w];
             wo.w = w;
             wordlist.push(wo);
          }
          relations = data.relations;
          relations.sort(function(b,a) {return +a[0] - +b[0]; } );
           // relations is now [ samewordcount,question1,question2 ]
          wordlist.sort(function(a,b) { return +b.qcount - +a.qcount; });
          for (var w in wordlist) {
             var wo = wordlist[w];
             words += '<span class="keyword">'+wo.w + '</span> ' + wo.qcount + ', ';
          }
          $j("#wordlist").html(words);
          makeForcePlot(filter,limit,keyword);
   });


   function makeForcePlot(filter,limit,keyword) {
          //words += '<h4>Relations</h4>';
          var sel = gui( { elements:{ "filter":{ klass:"", value:filter,  type:"select", options:qtypes }
                    , "limit":{ klass:"", value:limit,  type:"select", 
                    options:[2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,25,30] }  } } );
          $j("#filterbox").html(sel.filter);
          $j("#limitbox").html(sel.limit);
          $j("#filter").change(function() {
                filter = $j("#filter option:selected").text();
                makeForcePlot(filter,limit,keyword);
              });
          $j("#limit").change(function() {
                limit = $j("#limit option:selected").text();
                showinfo(mylink,limit,filter);
              });
          $j(".keyword").click(function() {
                var word = $j(this).text();
                keyword = word;
                //makeForcePlot(filter,limit,keyword);
                // xxxxxxxxx
                var matchkey = wordobj[keyword];
                var qmatched = {};
                if (matchkey) {
                  qmatched = matchkey.qids;
                  svg.selectAll("circle")
                     .style("fill", function(d,i) { var ty = d.name; var q = questions[ty]; return (qmatched[ty]) ? "#cc0000" : tcolors(q.qtype); } )
                     .style("stroke", function(d,i) { return (qmatched[d.name]) ? "#ff3322" : "#222"; } );

                  var clusterlist = [];       // array of connected questions
                  for (var star in qmatched) {
                    var q = questions[star]; 
                    if (filter != 'all' && q && q.qtype != filter) continue;
                    clusterlist.push(star);
                  }
                  if (clusterlist.length > 0) {
                    questEditor(clusterlist) 
                  } else {
                    $j("#info").html("No match for this question type");
                  }
                } else {
                  $j("#info").html("No match");
                }
              });

          var links = [];

          $j("#info").html("relations");
          var used = {};
          for (var i=0; i < relations.length; i+=1) {
             var re = relations[i];
             //words += re.join(',') + "<br>";
             if (re[0] > +limit) {
               var q = questions[re[1]]; 
               if (filter != 'all' && q.qtype != filter) continue;
               var q = questions[re[2]]; 
               if (filter != 'all' && q.qtype != filter) continue;
               links.push({ source:""+re[1], target:""+re[2], fat:re[0], type:'strong' } )
               used[re[1]] = 1;
               used[re[2]] = 1;
             }
          }
          $j("#info").html("relations");
          for (var i=0; i < relations.length; i+=1) {
             var re = relations[i];
             var q = questions[re[1]]; 
             if (filter != 'all' && q.qtype != filter) continue;
             var q = questions[re[2]]; 
             if (filter != 'all' && q.qtype != filter) continue;
             if (!used[re[1]] || !used[re[2]] ) {
               links.push({ source:""+re[1], target:""+re[2], fat:re[0], type:'weak' } )
               used[re[1]] = 1;
               used[re[2]] = 1;
             }
          }

          $j("#rapp").html('');
          var nodes = {};
          var nodecount = 0;
          var now = new Date();

          $j("#info").html("singletons");
          for (var qid in questions) {
            if (used[qid]) continue;
            var q = questions[qid];
            if (q.qtype == filter || filter == "all") {
              nodes[q.id] = { name:q.id };
              nodecount++;
            } 
          } 
          var helpinfo = '<ul><li>Klikk på spørsmål for å redigere.<li>Velg type fra kombo<li>Du kan flytte denne boksen'
                     + '<li>Velg antall felles ord for å lage link (mindre verdi gir flere linker)'
                     + '<li>JAdda'
                     + '</ul>';
          $j("#info").html(helpinfo);
          $j("#rapp").html("");

          // Compute the distinct nodes from the links.
          links.forEach(function(link) {
            var q = questions[link.source]; 
            //console.log(now.getTime() - q.created);
            if (!nodes[link.source]) nodecount++;
            if (!nodes[link.target]) nodecount++;
            link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
            link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
            var tty = "weak";
            if (link.fat > 7 || (link.fat > 2 && link.fat > 0.4 * q.wcount)) tty= "medium";
            if (link.fat > 15 || (link.fat > 4 && link.fat > 0.75 * q.wcount)) tty= "strong";
            if (link.fat > 25 || (link.fat > 9 && link.fat > 0.95 * q.wcount)) tty= "identity";
            link.type = tty;
          });

          if (nodecount < 1) {
            $j("#rapp").html("Ingen spørsmål funnet med valgt filter");
            return;
          }
          //$j("#info").html(40*Math.sqrt(1+nodecount));

          var w = 50*Math.sqrt(1+nodecount), 
              h = w; 
          w += 130;  // extra space for labels
          

          var tcolors = d3.scale.category20();
          tcolors.domain(["multiple","dragdrop","fillin","numeric","info","textarea","math","diff","sequence"]);

          var force = d3.layout.force()
              .nodes(d3.values(nodes))
              .links(links)
              .size([w, h])
              .theta(0.9)
              .linkDistance(50)
              .charge(-60)
              .on("tick", tick)
              .start();

          var svg = d3.select("#rapp").append("svg:svg")
              .attr("width", w)
              .attr("height", h);


          var path = svg.append("svg:g").selectAll("path")
              .data(force.links())
            .enter().append("svg:path")
              .attr("class", function(d) { return "link " + d.type; })
              .attr("marker-end", function(d) { return "url(#" + d.type + ")"; });

          var circle = svg.append("svg:g").selectAll("circle")
              .data(force.nodes())
            .enter().append("svg:circle")
              .attr("r", function(d,i) { var ty = d.name; var q = questions[ty]; return 3+Math.max(0,1.1*Math.log(0.01+ q.wcount));})
              .style("fill", function(d,i) { var ty = d.name; var q = questions[ty]; return tcolors(q.qtype); } )
              .on("click",function(d,i) { showinfo(d.name,limit,filter); } )
              .call(force.drag);

          var text = svg.append("svg:g").selectAll("g")
              .data(force.nodes())
            .enter().append("svg:g");

          // A copy of the text with a thick white stroke for legibility.
          text.append("svg:text")
              .attr("x", 8)
              .attr("y", ".31em")
              .attr("class", "shadow")
              //.text(function(d) { return d.name; });
              .text(function(d) { var info = tags[d.name] ? tags[d.name].join(',').substr(0,16) : d.name ; return info;  });

          text.append("svg:text")
              .attr("x", 8)
              .attr("y", ".31em")
              .text(function(d) { var info = tags[d.name] ? tags[d.name].join(',').substr(0,16): d.name ; return info;  });
              //.text(function(d) { return tags[d.name] ? tags[d.name].join(',') : d.name ; });

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


    }
}


