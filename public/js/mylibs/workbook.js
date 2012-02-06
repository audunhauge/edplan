// a workbook for a course
//   teach can add elements to book
//   quiz - link to a test
//   questions - question displayd direct on page
//   container - a link to a sub-workbook
//       a container is like a chapter
//       can contain (quiz,question,container)

var wb = { render: {} };
var wbinfo = { trail:[] };

var tablets = {};   // workaround for lack of drag and drop on tablets

function showdate(jsdate) {
  var d = new Date(jsdate);
  var mdate = d.getDate();
  var mmonth = d.getMonth() + 1; //months are zero based
  var myear = d.getFullYear();
  var hh = d.getHours();
  var mm = d.getMinutes();
  return mdate+'.'+mmonth+'-'+myear + ' '+hh+':'+mm;
}

var dragstate = {};   // state of draggable elements
// some qtypes have dragndrop enabled
// they need to store state


function makeTrail() {
    var trail = '';
    var prev = wbinfo.coursename;
    for (var i=0,l=wbinfo.trail.length; i<l; i++) {
      var e = wbinfo.trail[i];
      trail += '<span id="tt'+e.id+'_a" class="cont container">'+prev+'</span>';
      prev = e.name;
    }
    if (l > 0) trail += '<span class="chapter">' + prev + '</span>';
    return trail;
}



function showResults() {
    var group;
    try {
      group = wbinfo.coursename.split('_');
      group = group[1];
    } catch(err) {
      group = '';
    }
    var reslist = {};
    var display = '<ul>';
    var trail = makeTrail();
    var s = '<div id="wbmain"><h1 class="cont" id="tt'+wbinfo.containerid+'">Resultat</h1>'+trail+'<div id="results"></div></div>';
    $j("#main").html(s);
    $j.getJSON('/getuseranswers',{ container:wbinfo.containerid, group:group }, function(results) {
           // results = { res:{ uid ... }, ulist:{ 12:1, 13:1, 14:2, 15:2 }
           if (results) {
             for (var uid in results.ret) {
                var tot=0, score = 0;
                var ulist = results.ret[uid];
                for (var inst in ulist) {
                  var res = ulist[inst];
                  tot += res.points;
                  score += res.score;
                }
                reslist[res.userid] = score + " av "+ tot;
             }
             for (var uui in results.ulist) {
               var started = results.ulist[uui];
               var fn = '--', ln = '--', resultat = 'ikke startet';
               if (students[uui]) {
                 fn = students[uui].firstname.caps();
                 ln = students[uui].lastname.caps();
               }
               if (reslist[uui]) {
                 resultat = reslist[uui];
               }
               display += '<li>' + fn + ' ' + ln + ' ' + resultat + '</li>';
             }
             display += '</ul>';
             $j("#results").html(display );
           }
        });

}


function renderPage() {
  $j.getJSON('/getqcon',{ container:wbinfo.containerid }, function(container) {
    tablets = { usedlist:{} };    // forget any stored info for dragndrop for tablets on rerender
    var courseinfo;
    try {
      eval( 'courseinfo = '+container.qtext);
    }
    catch(err) {
      courseinfo = {};
    }
    wbinfo.courseinfo = courseinfo;
    wbinfo.qlistorder = courseinfo.qlistorder || [];
    // call the render functions indexed by layout
    // render the question list and update order if changed
    // typeset any math
    // prepare the workbook editor (setupWB)
    var header = wb.render[wbinfo.layout].header(wbinfo.title,wbinfo.ingress,wbinfo.weeksummary);
    var body = wb.render[wbinfo.layout].body(wbinfo.bodytext);

    var trail = makeTrail();

    // if this is a quiz ...
    if (container.qtype == 'quiz') {
      trail += '<h1 id="quiz">QUIZ</h1>';
    }

    var s = '<div id="wbmain">'+header + trail + body + '</div>';
    $j("#main").html(s);
    if (userinfo.department == 'Undervisning') {
      $j("span.wbteachedit").addClass("wbedit");
    }
    $j(".totip").tooltip({position:"bottom right" } );
    $j("#main").undelegate("#editwb","click");
    $j("#main").delegate("#editwb","click", function() {
        setupWB(header);
    });
    $j("#main").undelegate("#edqlist","click");
    $j("#main").delegate("#edqlist","click", function() {
        edqlist();
    });
    $j("#main").undelegate("span.drop","click");
    $j("#main").delegate("span.drop","click", function() {
        //$j("h1.wbhead").html( this.id );
        var thisq = this.id.substr(2).split('_')[0];
        var thisinst = this.id.substr(2).split('_')[1];
        if (thisq == tablets.qnr && thisinst == tablets.instance && tablets.dropvalue) {
          $j("#"+this.id).html( tablets.dropvalue );
          $j("#"+tablets.active).addClass('used');
          $j("#"+tablets.active).removeClass('act');
          tablets.usedlist[tablets.active] = this.id;
          delete tablets.dropvalue;
        } 
    });
    $j("#main").undelegate("ul.sequence","click");
    $j("#main").delegate("ul.sequence, ul.sourcelist","click", function() {
          var nuelm = $j("#"+tablets.active);
          $j("#"+this.id).append(nuelm);
        });
    $j("#main").undelegate("li.dragme","click");
    $j("#main").delegate("li.dragme","click", function() {
        $j("li.dragme").removeClass('act');
        tablets.active = this.id;
        $j("#"+tablets.active).addClass('act');
        tablets.qnr = this.id.substr(3).split('_')[0];
        tablets.instance = this.id.substr(3).split('_')[1];
        });
    $j("#main").undelegate("span.dragme","click");
    $j("#main").delegate("span.dragme","click", function() {
        //$j("h1.wbhead").html( this.id );
        $j("span.dragme").removeClass('act');
        if (tablets.usedlist[this.id]) {
          $j("#" + tablets.usedlist[tablets.active]).html('&nbsp;&nbsp;&nbsp;&nbsp;');
          delete tablets.usedlist[tablets.active];
        }
        tablets.active = this.id;
        $j("#"+tablets.active).removeClass('used');
        $j("#"+tablets.active).addClass('act');
        tablets.qnr = this.id.substr(3).split('_')[0];
        tablets.instance = this.id.substr(3).split('_')[1];
        tablets.dropvalue = this.innerHTML;
    });
    $j("#main").undelegate("#quiz","click");
    $j("#main").delegate("#quiz","click", function() {
        showResults();
    });
    function afterEffects() {
        MathJax.Hub.Queue(["Typeset",MathJax.Hub,"main"]);
        $j("span.dragme").draggable( {
              revert:true, 
              start:function(event,ui) {
                var droppid = ui.helper.attr("id");
                $j("#"+droppid).removeClass('used');
                var parid = $j("#"+droppid).parent().attr("id");
                $j("#"+parid+' span[droppid="'+droppid+'"]').removeAttr('droppid').removeClass("filled").html("&nbsp;&nbsp;&nbsp;&nbsp;");
              } //, 
              // containing in parent is troublesome if we are close to right/left edge and
              // the dragged element is wide - cant get element centered on target
              //containment:'parent'
            } );
        $j("span.drop").droppable({
            drop:function(event,ui) {
              // alert(this.id + " gets " + ui.draggable.attr("id"));
              var droppid = ui.draggable.attr("id");
              var nutxt = ui.draggable.html();
              ui.draggable.addClass('used');
              var parid = $j(this).parent().attr("id");
              $j("#"+parid+' span[droppid="'+droppid+'"]').removeAttr('droppid').removeClass("filled").html("&nbsp;&nbsp;&nbsp;&nbsp;");
              $j(this).attr("droppid",droppid).html(nutxt).addClass("filled");
            },
            hoverClass:"ui-state-hover"
          });
        $j( "ul.sequence, ul.sourcelist" ).sortable({
              // containment: 
              connectWith: ".connectedSortable"
         }).disableSelection();
        $j("#main").undelegate(".cont","click");
        $j("#main").delegate(".cont","click", function() {
            var containerid = this.id.substr(2).split('_')[0];
            var istrail = ( this.id.substr(0,2)  == 'tt');
            if (istrail) {
              // pop from trail until we hit this container-id
              var cinf;
              do {
                cinf = wbinfo.trail.pop();
              } while (wbinfo.trail.length > 0 && cinf.id != containerid );
            } else {
              wbinfo.trail.push({id:wbinfo.containerid,name:$j("#"+this.id).html() });
            }
            wbinfo.containerid = containerid;
            renderPage();
        });
       prettyPrint();

    }
    $j.getJSON('/getcontainer',{ container:wbinfo.containerid }, function(qlist) {
      // list of distinct questions - can not be used for displaying - as they may need
      // modification based on params stored in useranswers
      // the questions are 'stripped' of info giving correct answer
        var showlist = generateQlist(qlist);
        if (showlist.length) {
          wb.render[wbinfo.layout].qlist(wbinfo.containerid, showlist, function(renderq) {
                  $j("#qlist").html( renderq.showlist);
                  $j("#progress").html( '<div id="maxscore">'+renderq.maxscore+'</div><div id="uscore">'+renderq.uscore+'</div>');
                  afterEffects();
                  $j(".grademe").html('<div class="gradebutton">Vurder</div>');
                  $j("#qlistbox").undelegate(".grademe","click");
                  $j("#qlistbox").delegate(".grademe","click", function() {
                      var myid = $j(this).parent().attr("id");
                      $j("#"+myid+" div.gradebutton").html("Lagrer..");
                      $j("#"+myid+" div.gradebutton").addClass("working");
                      var elm = myid.substr(5).split('_');  // fetch questionid and instance id (is equal to index in display-list)
                      var qid = elm[0], iid = elm[1];
                      var ua = wb.getUserAnswer(qid,iid,myid,renderq.qrender);
                      $j.post('/gradeuseranswer', {  iid:iid, qid:qid, cid:wbinfo.containerid, ua:ua }, function(ggrade) {
                            ggrade.qua.display = ggrade.qua.param.display;
                            ggrade.qua.score = ggrade.score;
                            wb.render[wbinfo.layout].qrend(iid,qid,ggrade.qua,renderq.qrender,renderq.scorelist,function(adjust) {
                                    //$j("#qlist").html( renderq.showlist);
                                    $j("#"+adjust.sscore.qdivid).html(adjust.sscore.qdiv);
                                    $j("#"+adjust.sscore.scid).html( adjust.score);
                                    $j("#"+adjust.sscore.atid).html( ggrade.att);
                                    $j("#uscore").html(Math.floor(100*adjust.sumscore) / 100);
                                    $j(".grademe").html('<div class="gradebutton">Vurder</div>');
                                    afterEffects();

                            });
                      });
                  });
          });
        }
    });
  });
}

function generateQlist(qlist) {
      var showlist = [];
      if (qlist) {
        // qlist is list of questions in this container
        var ql = [];
        var trulist = []; // a revised version of qlistorder where ids are good
        var changed = false;
        for (var qi in qlist) {
          var qu = qlist[qi];
          ql[""+qu.id] = qu;
        }
        for (var qi in ql) {
          if (!($j.inArray(qi,wbinfo.qlistorder) >= 0)) {
            // this id is missing from sortorder, append it
            changed = true;
            wbinfo.qlistorder.push(qi);
          }
        }
        for (var qi in wbinfo.qlistorder) {
          var quid = wbinfo.qlistorder[qi];
          if (ql[quid]) {
            trulist.push(quid);
            var qu = ql[quid];
            showlist.push(qu);
          } else {
              changed = true;
          }
        }
        // update qlistorder in the container if different from orig
        if (changed) {
          wbinfo.courseinfo.qlistorder = trulist;
          $j.post('/editquest', { action:'update', qtext:wbinfo.courseinfo, qid:wbinfo.containerid }, function(resp) {
          });
        }

        // original
      }
      wbinfo.qlist = qlist;
      return showlist;
}

function getTimmy(coursename,timmy,tidy) {
    if (timetables && timetables.course) {
      for (var tt in timetables.course[coursename] ) {
        var tty = timetables.course[coursename][tt];
        if (!timmy[tty[0]]) {
          timmy[tty[0]] = {};
          tidy [tty[0]] = [];
        }
        if (timmy[ tty[0] ][ tty[1] ]) continue;
        timmy[ tty[0] ][ tty[1] ] = 1;
        tidy[ tty[0] ].push(""+(1+tty[1]));
      }
    }
}

function edqlist() {
  var showlist = generateQlist(wbinfo.qlist);
  var showqlist = wb.render[wbinfo.layout].editql(showlist);
  var header = wb.render[wbinfo.layout].header(wbinfo.title,wbinfo.ingress,wbinfo.weeksummary);
  var head = '<h1 class="wbhead">' + header + '</h1>' ;
  var s = '<div id="wbmain">' + head + '<div id="qlistbox"><div id="sortable">'
         +showqlist 
         + '</div><div "Lag nytt sprsml" id="addmore" class="button">add</div>'
         + '<div id="qlist" class="qlist"></div>'
         + '<div title="Legg til eksisterende sprsml" id="attach" class="button">attach</div></div></div>';
  $j("#main").html(s);
  //MathJax.Hub.Queue(["Typeset",MathJax.Hub,"main"]);
  $j.post("/resetcontainer",{ container:wbinfo.containerid});
  $j("#sortable").sortable({placeholder:"ui-state-highlight",update: function(event, ui) {
            var ser = $j("#sortable").sortable("toArray");
            var trulist = [];
            for (var i=0,l=ser.length; i<l; i++) {
              trulist.push(ser[i].split('_')[1]);
            }
            wbinfo.courseinfo.qlistorder = trulist;
            $j.post('/editquest', { action:'update', qtext:wbinfo.courseinfo, qid:wbinfo.containerid }, function(resp) {
            });
          }  
       });
  $j("#qlist").dialog({ width:550, height:500, autoOpen:false, title:'Pick question',
     buttons: {
       "Cancel": function() {
             $j( this ).dialog( "close" );
        },
       "Oppdater": function() {
               $j( this ).dialog( "close" );
               var nulist = $j.map($j("#qqlist div.chooseme"),function(e,i) {
                    return e.id.substr(4);
                  });
               // filter the new list removing questions already in container
               // this is the set of questions to insert intoquestion_container
               if (wbinfo.courseinfo.qlistorder && wbinfo.courseinfo.qlistorder.length) {
                 var nufilter = $j.grep(nulist,function(e,i) {
                   return ($j.inArray(e,wbinfo.courseinfo.qlistorder) < 0 );
                 });
               } else {
                 nufilter = nulist;
                 wbinfo.courseinfo.qlistorder = [];
               }
               $j.post('/editqncontainer', { action:'insert', container:wbinfo.containerid, nuqs:nufilter.join(',') }, function(resp) {
                    wbinfo.courseinfo.qlistorder = wbinfo.courseinfo.qlistorder.concat(nulist);
                    $j.post('/editquest', { action:'update', qtext:wbinfo.courseinfo, qid:wbinfo.containerid }, function(resp) {
                      //workbook(wbinfo.coursename);
                      renderPage();
                    });
               });
              
            }
         }
  });
  $j("#attach").click(function() {
    var dia = ''
        + '<div id="selectag"><span class="tagtitle">Tags</span>'
        + '  <div id="chtag"></div>'
        + '  <div id="qqlist"></div>'
        + '</div>'
        + '<div id="multi"> Multiple: <input id="mult" name="mult" type="checkbox"></div>';
    $j("#qlist").html(dia);
    var taggis = {};
    $j.getJSON('/gettags', function(tags) {
         var mytags = tags[userinfo.id] || [];
         var tlist = [];
         for (var i=0,l=mytags.length; i<l; i++) {
           var tag = mytags[i];
           tlist.push('<div id="tt'+tag+'" class="tagdiv"><div class="tagg">'+tag+'</div></div>');
         }
         tlist.push('<div id="ttnon" class="tagdiv"><div class="tagg">uten tag</div></div>');
         $j("#chtag").html(tlist.join(''));
         $j("#qlist").dialog('open');
         $j("#qqlist").undelegate(".equest","click");
         $j("#qqlist").delegate(".equest","click", function() {
              var myid = this.id;
              $j("#"+myid).toggleClass("chooseme");
           });
         $j("#selectag").undelegate(".tagdiv","click");
         $j("#selectag").delegate(".tagdiv","click", function() {
           $j("#qlistbox div.equest").removeClass("chooseme");
           var mytag = this.id;
           var tagname = mytag.substr(2);
           if (taggis[tagname]) {
             delete taggis[tagname];
             $j("#"+mytag).removeClass("tagon");
           } else {
             taggis[tagname] = 1;
             $j("#"+mytag).addClass("tagon");
           }
           var taglist = Object.keys(taggis).join(',');
           $j.getJSON('/getquesttags',{ tags:taglist }, function(qtlist) {
                // qtlist = { tagname:{ teachid:[qid,..], ... }
                var mmu = $j("#mult").is(":checked");
                //var mmu =  (multi && multi.length) ? true : false;
                var qqlist = [];
                var xqqlist = [];
                var tagsforq = {}; // tags for question
                var qids = {};     // list of seen questions
                var totag = 0;     // count of tags
                taggis = {};       // remove mark from tags
                $j(".tagdiv").removeClass("tagon");
                if (qtlist ) {
                  // first gather all tags for questions
                  for(var tname in qtlist) {
                    for(var i in qtlist[tname][userinfo.id]) {
                      var qqa =qtlist[tname][userinfo.id][i];
                      if (!tagsforq[qqa.id]) {
                        tagsforq[qqa.id] = [];
                      }
                      tagsforq[qqa.id].push(tname);
                    }
                  }
                  for(var tname in qtlist) {
                    totag++;
                    for(var i in qtlist[tname][userinfo.id]) {
                      var qqa =qtlist[tname][userinfo.id][i];
                      var param = {};
                      try {
                        param = JSON.parse(qqa.qtext);
                      }
                      catch (err) {
                        param = {};
                      }
                      var already = $j.inArray(""+qqa.id,wbinfo.qlistorder) >= 0; 
                      if (already) {
                        $j("#qq_"+qqa.id).addClass("chooseme");
                      }
                      if (mmu || !already) {
                        if (!qids[qqa.id]) {
                          qids[qqa.id] = 0;
                          var shorttext = param.display || '&lt; no text &gt;';
                          var duup = already ? 'duup' : '';
                          shorttext = shorttext.replace(/</g,'&lt;');
                          shorttext = shorttext.replace(/>/g,'&gt;');
                          var tit = tagsforq[qqa.id].join(',');
                          var qdiv = '<div title="'+tit+'" class="equest listqq '+duup+'" id="zqq_'+qqa.id+'"><span class="qid">' 
                                     + qqa.id+ '</span><span class="img img'+qqa.qtype+'"></span>'
                                     + '<span >' + qqa.qtype + '</span><span > '
                                     + qqa.name + '</span><span >' + shorttext.substr(0,20)
                                     + '</span></div>';
                          qqlist.push([qqa.id,qdiv]);
                        }
                        qids[qqa.id] += 1;
                      } 
                      taggis[tname] = 1;
                      $j("#tt"+tname).addClass("tagon");
                    }
                  }
                }
                // shift questions to the right - depending on how few tags they have
                // questions with all tags applied will be flush to the left edge
                // first we sort em so that qs with most tags are at top
                function sso(a,b) {
                      return qids[b[0]] - qids[a[0]];
                }
                qqlist.sort(sso);
                for (var i=0; i< qqlist.length; i++) {
                  xqqlist.push(qqlist[i][1]);
                }
                $j("#qqlist").html(xqqlist.join(''));
                for (var qiq in qids) {
                  var qii = qids[qiq];  // count of tags for question
                  $j("#zqq_"+qiq).css("margin-left",(totag -qii)*3);
                  if (qii == totag) {
                    $j("#zqq_"+qiq).addClass('tagon');
                  }
                }

           });
         });
     });
     return false;
  });
  $j("#addmore").click(function() {
      $j.post('/editqncontainer', { action:'create', container:wbinfo.containerid }, function(resp) {
         $j.getJSON('/getcontainer',{ container:wbinfo.containerid }, function(qlist) {
           wbinfo.qlist = qlist;
           edqlist();
         });
      });
  });
  $j(".wbhead").click(function() {
      //workbook(wbinfo.coursename);
      renderPage();
  });
  // check if question editor is loaded
  // and load it if missing
  if (typeof(editquestion) == 'undefined' ) {
      $j.getScript('js/'+database.version+'/quiz/editquestion.js', function() {
              editbind();
      });
  } else {
     editbind();
  }
}

function editbind() {
        $j("#sortable").undelegate(".equest","click");
        $j("#sortable").delegate(".edme","click", function() {
                var myid = $j(this).parent().attr("id").split('_')[1];
                editquestion(myid);
            });
        $j("#sortable").undelegate(".killer","click");
        $j("#sortable").delegate(".killer","click", function() {
                var myid = $j(this).parent().attr("id");
                dropquestion(myid);
            });
}

function workbook(coursename) {
    wbinfo = { trail:[] };
    wbinfo.coursename = coursename;
    wbinfo.courseid = database.cname2id[coursename];
    var plandata = courseplans[coursename];
    var tests = coursetests(coursename);
    var felms = coursename.split('_');
    var fag = felms[0];
    var gru = felms[1];
    wbinfo.timmy = {};
    wbinfo.tidy = {};
    getTimmy(coursename,wbinfo.timmy,wbinfo.tidy);
    var startjd = database.firstweek;
    var tjd = database.startjd;
    var section = Math.floor((tjd - startjd) / 7);
    // build timetable data for quick reference
    var uke = julian.week(tjd);
    var elever = memberlist[gru];
    var info = synopsis(coursename,plandata);
    wbinfo.weeksummary = showAweek(false,gru,elever,info,absent,wbinfo.timmy,tests,plandata,uke,tjd,section);
    $j.getJSON('/workbook',{ courseid:wbinfo.courseid, coursename:coursename }, function(resp) {
        if (resp) {
          var courseinfo;
          try {
            eval( 'courseinfo = '+resp.qtext);
          }
          catch(err) {
            courseinfo = {};
          }
          wbinfo.courseinfo = courseinfo;
          wbinfo.quizid = resp.quizid;
          wbinfo.containerid = resp.id;
          wbinfo.title = courseinfo.title || coursename;
          wbinfo.ingress = courseinfo.ingress || '';
          wbinfo.bodytext = courseinfo.text || '';
          wbinfo.layout = courseinfo.layout || 'normal';
          wbinfo.qlistorder = courseinfo.qlistorder || [];
          if (wb.render[wbinfo.layout] ) {
            renderPage();
          }  else {
            $j.getScript('js/'+database.version+'/workbook/'+wbinfo.layout+'.js', function() {
                   renderPage();
              });
          }
        }
    });
}

function makeSelect(name,selected,arr) {
  // prelim version - needs selected,value and ids
  var s = '<select name="'+name+'" id="'+name+'" ">';
  for (var ii in arr) {
    var oo = arr[ii];
    var sel = (selected == oo) ? ' selected="selected" ' : '';
    s += '<option '+sel+' value="'+oo+'">'+oo+'</option>';
  }
  s += '</select>';
  return s;
}

function setupWB(heading) {
  $j.getJSON('/workbook',{ courseid:wbinfo.courseid, coursename:wbinfo.coursename }, function(resp) {
    if (resp) {
      var courseinfo;
      try {
        eval( 'courseinfo = '+resp.qtext);
      }
      catch(err) {
        courseinfo = {};
      }
      var title = courseinfo.title || wbinfo.coursename;
      var ingress = courseinfo.ingress || '';
      var text = courseinfo.text || '';
      var chosenlayout = courseinfo.layout || '';

      var head = '<h1 class="wbhead">' + heading + '</h1>' ;
      var layout = makeSelect('layout',chosenlayout,"normal cool".split(' '));
      var setup = '<div id="editform">'
                 + '<table>'
                 + ' <tr>  <th>Tittel</th>  <td colspan="3" ><input name="tittel" type="text" value="'+title+'"></td></tr>'
                 + ' <tr>  <th>Ingress</th> <td colspan="3" ><textarea id="ingress">'+ingress+'</textarea></td></tr>'
                 + ' <tr>  <th>Tekst</th>   <td colspan="3" ><textarea id="text">'+text+'</textarea></td></tr>'
                 + ' <tr>  <th>Layout</th>  <td>'+layout+'</td>'
                 + '   <th>Layout</th>  <td>ertioyiu</td></tr>'
                 + ' <tr>  <th>Jalla</th>  <td>dsfkjhhsd kjsdfhkjh</td>'
                 + '   <th>khjk</th>  <td>dfghkj sdhfkjh</td></tr>'
                 + ' <tr>  <th></th>   <td><div id="save" class="button">Lagre</div></td></tr>'
                 + '</table>'
                 + '</form>'
                 + '</div>'
                 + '';
      var s = '<div id="wbmain">' + head + setup + '</div>';
      $j("#main").html(s);
      $j(".wbhead").click(function() {
            //workbook(wbinfo.coursename);
            renderPage();
          });
      $j("#save").click(function() {
            courseinfo.title = $j("input[name=tittel]").val();
            courseinfo.ingress = $j('#ingress').val()
            courseinfo.text = $j('#text').val()
            courseinfo.layout = $j("#layout option:selected").val();
            //$j.post('/editquest', { action:'update', qtext:{ title:title, ingress:ingress, text:text, layout:layout }, qid:resp.id }, function(resp) {
            $j.post('/editquest', { action:'update', qtext:courseinfo, qid:resp.id }, function(resp) {
                 //workbook(wbinfo.coursename);
                 renderPage();
                 //setupWB(courseid,coursename,heading);
              });
          });
    }
  });
}


/*
 * This code really belongs in quiz/editquestion.js
 * but during debug we need it here
 *
*/ 


var dialog = { daze:'' };  // pesky dialog

function editquestion(myid) {
  // given a quid - edit the question
 var descript = { multiple:'Multiple choice', dragdrop:'Drag and Drop', sequence:'Place in order' 
               , info:'Information'
               , textarea:'Free text'
               , numeric:'Numeric answers'
               , fillin:'Textbox'
               , diff:'Difference'
               , container:'SubChapter'
               , quiz:'A quiz'
 };
 $j.getJSON('/getquestion',{ qid:myid }, function(q) {
   var qdescript = descript[q.qtype] || q.qtype;
   var selectype = makeSelect('qtype',q.qtype,"multiple,diff,dragdrop,sequence,fillin,numeric,info,textarea,container,quiz".split(','));
   var head = '<h1 id="heading" class="wbhead">Question editor</h1>' ;
        head += '<h3>Question '+ q.id + ' ' + qdescript + '</h3>' ;
   var s = '<div id="wbmain">' + head + '<div id="qlistbox"><div id="editform">'
        + '<table class="qed">'
        + '<tr><th>Navn</th><td><input class="txted" name="qname" type="text" value="' + q.name + '"></td></tr>'
        + '<tr><th>Spørsmål</th><td><textarea class="txted" id="qdisplay" >' + q.display + '</textarea></td></tr>'
        + '<tr><th>Detaljer</th><td><div id="details"></div></td></tr>'
        + '</table>'
        + '<div id="taggs"><span class="tagtitle">Tags</span>'
        + '  <div id="taglist"><div id="mytags"></div>'
        + '  <div id="tagtxt"><input name="tagtxt" value=""></div>'
        + '  <div id="nutag" class="tinybut"><div id="ppp">+</div></div></div>'
        + '</div>'
        + '<div id="edetails" ></div>';
   dialog.qtype = q.qtype;
   dialog.qpoints = q.points;
   dialog.qcode = q.code;
   dialog.pycode = q.pycode;
   dialog.daze = q.daze || '';
   s += editVariants(q);
   s += '<div id="killquest"><div id="xx">x</div></div>';
   s += '</div></div>';

   $j("#main").html(s);
   $j("#edetails").dialog({ width:550, autoOpen:false, title:'Details',
     buttons: {
       "Cancel": function() {
             $j( this ).dialog( "close" );
        },
       "Oppdater": function() {
               //alert($j("input[name=qpoints]").val());
             $j( this ).dialog( "close" );
             dialog.qtype = $j("select[name=qtype]").val();
             dialog.qpoints = $j("input[name=qpoints]").val();
             dialog.qcode = $j("#qcode").val();
             dialog.pycode = $j("#pycode").val();
             $j("#saveq").addClass('red');
            }
         }
   });
   $j('#taggs span.tagtitle').click(function() {
         $j("#taglist").toggle();
       });
   $j('#nutag').click(function() {
       var tagname = $j("input[name=tagtxt]").val();
       $j.post('/edittags', { action:'tag', qid:myid, tagname:tagname}, function(resp) {
         freshenTags();
       });
   });
   freshenTags();
   $j("#mytags").undelegate("input.tagr","change");
   $j("#mytags").delegate("input.tagr","change", function() {
        $j("#saveq").addClass('red');
        dialog.tagger = true;
      });
   $j('#details').click(function() {
                var dia = ''
                +   '<form><fieldset><table class="standard_info">'
                +   '<tr><th>Points</th><td><input name="qpoints" class="num4" type="text" value="'+q.points+'"></td></tr>'
                +   '<tr><th>Type</th><td>'+selectype+'</td></tr>'
                +   '<tr><th>Created</th><td>'+showdate(q.created)+'</td></tr>'
                +   '<tr><th>Modified</th><td>'+showdate(q.modified)+'</td></tr>'
                +   '<tr><th>Parent</th><td>'+q.parent+'</td></tr>'
                +   '<tr><th>Javascript</th><td><textarea class="txted" id="qcode">'+dialog.qcode+'</textarea></td></tr>'
                +   '<tr><th>SymbolicPython</th><td><textarea class="txted" id="pycode">'+dialog.pycode+'</textarea></td></tr>'
                +   '</table></form></fieldset>'
             $j("#edetails").html(dia);
             $j("#edetails").dialog('open');
              return false;
           });
   $j("#opts").undelegate(".killer","click");
   $j("#opts").delegate(".killer","click", function() {
        preserve();  // save opt values
        var myid = $j(this).parent().attr("id").substr(1);
        q.options.splice(myid,1);
        q.fasit.splice(myid,1);
        optlist = drawOpts(q.options,q.fasit);
        $j("#opts").html(optlist);
      });
   $j("#main").undelegate(".txted","change");
   $j("#main").delegate(".txted","change", function() {
        $j("#saveq").addClass('red');
      });
   $j("#heading").click(function() {
       edqlist();
      });
   $j("#addopt").click(function() {
        if (typeof(q.options) == 'undefined') {
          q.options = [];
          q.fasit = [];
        }
        preserve();
        q.options.push('');
        optlist = drawOpts(q.options,q.fasit);
        $j("#opts").html(optlist);
      });
   $j("#saveq").click(function() {
        var qoptlist = [];
        preserve();  // q.options and q.fasit are now up-to-date
        retag();
        var daze = $j("input[name=daze]").val();
        dialog.daze = daze;
        var qname = $j("input[name=qname]").val();
        var newqtx = { display:$j("#qdisplay").val(), options:q.options, fasit:q.fasit, code:dialog.qcode, pycode:dialog.pycode, daze:daze };
        $j.post('/editquest', { action:'update', qid:myid, qtext:newqtx, name:qname, 
                                qtype:dialog.qtype, points:dialog.qpoints }, function(resp) {
           editquestion(myid);
        });
      });
   $j("#killquest").click(function() {
      $j.post('/editquest', { action:'delete', qid:myid }, function(resp) {
         $j.getJSON('/getcontainer',{ container:wbinfo.containerid }, function(qlist) {
           wbinfo.qlist = qlist;
           edqlist();
         });
      });
        
    });

    function retag() { 
        if (!dialog.tagger) return;
        var tags = [];
        var tagged = $j("#mytags input:checked");
        for (var i=0,l=tagged.length; i<l; i++) {
          var b = tagged[i];
          var tname = $j(b).parent().attr("id").substr(2);
          tags.push(tname);
        }
        if (tags.length) {
          $j.post('/updateTags', { tags:tags.join(','), qid:myid }, function(resp) {
          });
        }
    }

    function freshenTags() { 
       $j.getJSON('/gettags', function(tags) {
         var mytags = tags[userinfo.id] || [];
         var tlist = [];
         $j.getJSON('/gettagsq', { qid:myid }, function(mtags) {
           for (var i=0,l=mytags.length; i<l; i++) {
             var tag = mytags[i];
             var chk = ($j.inArray(tag,mtags) >= 0) ? 'checked="checked"' : '';
             tlist.push('<div id="tt'+tag+'" class="tagdiv"><input  class="tagr" type="checkbox" '+chk+'><div class="tagg">'+tag+'</div></div>');
           }
           $j("#mytags").html(tlist.join(''));
         });
       });
    }

    function editVariants(q) {  // qu is a question
      var s = '<hr />'
      switch(q.qtype) {
        case 'multiple':
           var optlist = drawOpts(q.options,q.fasit);
           s += '<h3>Alternativer</h3>'
           + '<table id="opts" class="opts">'
           + optlist
           + '</table>'
           + '</div><div class="button" id="addopt">+</div>'
           break;
        case 'sequence':
        case 'dragdrop':
           s += 'Daze and Confuse (csv fog list: daze,confuse) : '
             + '<input id="daze" name="daze" type="text" value ="'+dialog.daze+'" />'
             + '</div>';
           break;
        case 'numeric':
        case 'info':
        case 'diff':
        case 'textarea':
        case 'fillin':
        default:
           s += '</div>';
           break;
      }
      s += '<div class="button" id="saveq">Lagre</div>';
      return s;
   }
   function drawOpts(options,fasit) {
     // given a list of options - creates rows for each
     var optlist = '';
     if (options) {
       for (var i=0,l=options.length; i<l; i++) {
         var fa = (fasit[i] == 1) ? ' checked="checked" ' : '';
         optlist += '<tr><td><input name="o'+i+'" class="txted option" type="text" value="'
                + options[i] +'"></td><td><div id="c'+i+'" class="eopt"><input class="check txted " type="checkbox" '+fa+' ><div class="killer"></div></div></td></tr>';
       }
     }
     return optlist;
   }
   function preserve() {
        // preserve any changed option text
      if (q.options) {
        for (var i=0,l=q.options.length; i<l; i++) {
          var oval = $j("input[name=o"+i+"]").val();
          q.options[i] = oval;
          q.fasit[+i] = 0;
        }
        // preserve any changed checkboxes
        var fas = $j("div.eopt input:checked");
        for (var i=0,l=fas.length; i<l; i++) {
          var b = fas[i];
          var ii = $j(b).parent().attr("id").substr(1);
          q.fasit[+ii] = 1;
        }
        $j("#saveq").addClass('red');
      }
   }
 });
}

function dropquestion(myid) {
  var elm = myid.split('_');
  var qid = elm[1], instance = elm[2];
  var cnt = 0;
  for (var id in wbinfo.qlistorder) {
    // check for duplicates
    var qii = wbinfo.qlistorder[id];
    if (qii == qid) cnt++;
  }
  wbinfo.qlistorder.splice(instance,1);
  $j.post('/editquest', { action:'update', qtext:wbinfo.courseinfo, qid:wbinfo.containerid }, function(resp) {
    if (cnt == 1) {
      $j.post('/editqncontainer', {  action:'delete', qid:qid, container:wbinfo.containerid }, function(resp) {
           $j.getJSON('/getcontainer',{ container:wbinfo.containerid }, function(qlist) {
             wbinfo.qlist = qlist;
             edqlist();
           });
        });
    } else {
      $j.getJSON('/getcontainer',{ container:wbinfo.containerid }, function(qlist) {
         wbinfo.qlist = qlist;
         edqlist();
      });
    }
  });
}


/*    The code below belongs in workbook/normal.js
 *        it is placed here only while debugging
 *        so that errors can show line number
 *        and chrome can step the code
 *
 * 
 */

wb.getUserAnswer = function(qid,iid,myid,showlist) {
  // parses out user answer for a given question
  var qu = showlist[iid];
  var ua = {};
  var quii = myid.substr(5);  // drop 'quest' from 'quest' + qid_iid
  switch(qu.qtype) {
      case 'multiple':
        var ch = $j("#qq"+quii+" input:checked");
        for (var i=0, l=ch.length; i<l; i++) {
          var opti = $j(ch[i]).attr("id");
          var elm = opti.substr(2).split('_');
          var optid = elm[1];   // elm[0] is the same as qid
          var otxt = qu.param.options[optid];
          ua[optid] = otxt;
        }
        break;
      case 'diff':
      case 'textarea':
        var ch = $j("#qq"+quii+" textarea");
        for (var i=0, l=ch.length; i<l; i++) {
          var opti = $j(ch[i]).val();
          ua[i] = opti
        }
        break;
      case 'numeric':
      case 'fillin':
        var ch = $j("#qq"+quii+" input");
        for (var i=0, l=ch.length; i<l; i++) {
          var opti = $j(ch[i]).val();
          ua[i] = opti
        }
        break;
      case 'textmark':
        break;
      case 'info':
        break;
      case 'sequence':
        var ch = $j("#qq"+quii+" ul.sequence");
        for (var i=0, l=ch.length; i<l; i++) {
          var itemlist = $j("#"+ch[i].id+" li.dragme");
          ua[i] = {};
          for (var j=0, m=itemlist.length; j<m; j++) {
              var item = itemlist[j].innerHTML;
              ua[i][j] = item;
          }
        }
        break;
      case 'dragdrop':
        var ch = $j("#qq"+quii+" span.drop");
        for (var i=0, l=ch.length; i<l; i++) {
          var opti = $j(ch[i]).attr("id");
          var elm = opti.substr(2).split('_');
          var optid = elm[2];   // elm[0] is the same as qid
          var otxt = ch[i].innerHTML;
          ua[optid] = otxt;
        }
        break;
  }
  return ua;
}   

wb.render.normal  = { 
         // renderer for header
         header:function(heading,ingress,summary) { 
            var head = '<h1 class="wbhead">' + heading + '<span id="editwb" class="wbteachedit">&nbsp;</span></h1>' ;
            var summary = '<div class="wbsummary"><table>'
                  + '<tr><th>Uke</th><th></th><th>Absent</th><th>Tema</th><th>Vurdering</th><th>Mål</th><th>Oppgaver</th><th>Logg</th></tr>'
                  + summary + '</table></div><hr>'; 
            var bod = '<div class="wbingress">'+ingress+'</div>'; 
            return(head+summary+bod);
           }  
         // renderer for body
       , body:function(bodytxt) {
            var bod = '<div class="wbbodytxt">'+bodytxt+'</div>';
            var contained = '<div id="qlistbox" class="wbbodytxt"><br><div id="progress"></div><span id="edqlist" class="wbteachedit">&nbsp;</span><div id="qlist"></div></div>';
            //var addmore = '<div id="addmore" class="button">add</div>';
            return bod+contained;
           }   
         // renderer for edit question list 
       , editql:function(questlist) {
            var qq = '';
            var qql = [];
            for (var qidx in questlist) {
              qu = questlist[qidx];
              var shorttext = qu.display || '&lt; no text &gt;';
              shorttext = shorttext.replace(/</g,'&lt;');
              shorttext = shorttext.replace(/>/g,'&gt;');
              var qdiv = '<div class="equest" id="qq_'+qu.id+'_'+qidx+'"><span class="qid">' 
                         + qu.id+ '</span><span class="img img'+qu.qtype+'"></span>'
                         + '<span class="qtype">' + qu.qtype + '</span><div class="qname"> '
                         + qu.name + '</div><span class="qshort">' + shorttext.substr(0,30)
                         + '</span><span class="qpoints">'+ qu.points +'</span><div class="edme"></div><div class="killer"></div></div>';
              qql.push(qdiv);
            }
            qq = qql.join('');
            return qq;
           }   

       , qrend:function(iid,qid,qua,qrender,scorelist,callback) {
         // renderer for a single question
              //var qu = qrender[iid];
              if (qid != qua.qid) alert("error "+qid+":"+qua.qid);
              var sscore = { userscore:0, maxscore:0, qdiv:'', scorelist:scorelist };
              var qdiv = wb.render.normal.displayQuest(qua,iid,sscore,1);
              var sum = 0;
              for (var i in scorelist) {
                sum += scorelist[i];
              }
              callback( { sscore:sscore, sumscore:sum });
         }

       , qlist:function(container,questlist,callback) {
         // renderer for question list 
            var qq = '';
            var qql = [];
            var qqdiv = [];
            var sscore = { userscore:0, maxscore:0 ,scorelist:{} };
            $j.post('/renderq',{ container:container, questlist:questlist }, function(qrender) {
              for (var qi in qrender) {
                var qu = qrender[qi];
                var qdiv = wb.render.normal.displayQuest(qu,qi,sscore,0);
                qql.push(qdiv);
              }
              qq = qql.join('');
              sscore.userscore = Math.floor(sscore.userscore*100) / 100;
              callback( { showlist:qq, maxscore:sscore.maxscore, uscore:sscore.userscore, qrender:qrender, scorelist:sscore.scorelist });
            });
          }   
            

         , displayQuest:function(qu,qi,sscore,scored) {
              // qu is the question+useranswer, qi is instance number
              // scored is set true if we have graded this instance
              // (we display ungraded questions on first show of question)
                if (qu.display == '') return '';
                var attempt = qu.attemptnum || '';
                var score = qu.score || 0;
                var chosen = qu.response;
                var param = qu.param;
                param.display = param.display.replace(/»/g,'"');
                param.display = param.display.replace(/«/g,"'");
                score = Math.round(score*100)/100;
                var delta = score || 0;
                sscore.userscore += delta;
                sscore.maxscore += qu.points;
                sscore.scorelist[qi] = delta;
                var qtxt = ''
                  switch(qu.qtype) {
                      case 'quiz':
                          return '<div class="cont quiz" id="qq'+qu.qid+'_'+qi+'">' + qu.name + '</div>';
                          break;
                      case 'container':
                          return '<div class="cont container" id="qq'+qu.qid+'_'+qi+'">' + qu.name + '</div>';
                          break;
                      case 'diff':
                      case 'textarea':
                          var adjusted = param.display;
                          var iid = 0;
                          adjusted = adjusted.replace(/(&nbsp;&nbsp;&nbsp;&nbsp;)/g,function(m,ch) {
                                var vv = ''
                                if (chosen[iid]) {
                                  vv = chosen[iid];
                                } 
                                var ret = '<textarea>'+vv+'</textarea>';
                                iid++;
                                return ret;
                              });
                          qtxt = '<div id="quest'+qu.qid+'_'+qi+'" class="qtext textareaq">'+adjusted;
                          if (iid > 0) {  // there are input boxes to be filled
                              if (scored || attempt != '' && attempt > 0) {
                                qtxt += '<span id="at'+qi+'" class="attempt">'+(attempt)+'</span>';
                              }
                              if (scored || attempt > 0 || score != '') {
                                qtxt += '<span id="sc'+qi+'" class="score">'+score+'</span>'
                              }
                              qtxt += '<div class="grademe"></div></div>';
                              qtxt += '<div class="clearbox">&nbsp;</div>';

                          } else {
                              qtxt += '</div>';
                          }
                          break;
                      case 'numeric':
                      case 'fillin':
                          var adjusted = param.display;
                          var iid = 0;
                          adjusted = adjusted.replace(/(&nbsp;&nbsp;&nbsp;&nbsp;)/g,function(m,ch) {
                                var vv = ''
                                if (chosen[iid]) {
                                  vv = chosen[iid];
                                } 
                                var ret = '<input type="text" value="'+vv+'" />';
                                iid++;
                                return ret;
                              });
                          qtxt = '<div id="quest'+qu.qid+'_'+qi+'" class="qtext fillinq">'+adjusted;
                          if (iid > 0) {  // there are input boxes to be filled
                              if (scored || attempt != '' && attempt > 0) {
                                qtxt += '<span id="at'+qi+'" class="attempt">'+(attempt)+'</span>';
                              }
                              if (scored || attempt > 0 || score != '') {
                                qtxt += '<span id="sc'+qi+'" class="score">'+score+'</span>'
                              }
                              qtxt += '<div class="grademe"></div></div>';
                              qtxt += '<div class="clearbox">&nbsp;</div>';

                          } else {
                              qtxt += '</div>';
                          }
                          break;
                      case 'sequence':
                          var adjusted = param.display;
                          var iid = 0;
                          var used = {};
                          adjusted = adjusted.replace(/(ª)/g,function(m,ch) {
                                var ret = '';
                                if (chosen[iid]) {
                                  for (var j=0, m = chosen[iid].length; j<m; j++) {
                                      var opt = chosen[iid][j];
                                      used[opt] ? used[opt]++ : used[opt] = 1;
                                      ret += '<li id="ddm'+qu.qid+'_'+qi+'_'+j+'" class="dragme">' + opt + '</li>';
                                  }
                                } 
                                iid++;
                                return ret;
                              });
                          qtxt = '<div id="quest'+qu.qid+'_'+qi+'" class="qtext sequenceq">'+adjusted;
                          if (param.options && param.options.length) {
                              if (param.daze && param.daze.length) {
                                // distractors are defined - stir them in
                                param.options = param.options.concat(param.daze.split(','));
                                shuffle(param.options);
                              }
                              qtxt += '<hr>';
                              if (scored || attempt != '' && attempt > 0) {
                                qtxt += '<span id="at'+qi+'" class="attempt">'+(attempt)+'</span>';
                              }
                              if (scored || attempt > 0 || score != '') {
                                qtxt += '<span id="sc'+qi+'" class="score">'+score+'</span>'
                              }
                              qtxt += '<div class="grademe"></div></div>';
                              qtxt += '<ul id="sou'+qu.qid+'_'+qi+'" class="qtext sourcelist connectedSortable">';
                              for (var i=0, l= param.options.length; i<l; i++) {
                                  var opt = param.options[i].split(',')[0];
                                  if (used[opt]) {
                                    used[opt]--;
                                    continue;
                                  }
                                  qtxt += '<li id="ddm'+qu.qid+'_'+qi+'_'+i+'" class="dragme">' + opt + '</li>';
                              }
                              qtxt += '</ul>';
                              qtxt += '<div class="clearbox">&nbsp;</div>';

                          } else {
                              qtxt += '</div>';
                          }
                          break;
                      case 'textmark':
                      case 'info':
                      case 'dragdrop':
                          var adjusted = param.display;
                          var iid = 0;
                          adjusted = adjusted.replace(/(&nbsp;&nbsp;&nbsp;&nbsp;)/g,function(m,ch) {
                                var ret = '&nbsp;&nbsp;&nbsp;&nbsp;';
                                if (chosen[iid]) {
                                  ret = chosen[iid];
                                } 
                                iid++;
                                return ret;
                              });
                          qtxt = '<div id="quest'+qu.qid+'_'+qi+'" class="qtext dragdropq">'+adjusted;
                          if (param.options && param.options.length) {
                              if (param.daze && param.daze.length) {
                                // distractors are defined - stir them in
                                param.options = param.options.concat(param.daze.split(','));
                                shuffle(param.options);
                              }
                              qtxt += '<hr>';
                              if (scored || attempt != '' && attempt > 0) {
                                qtxt += '<span id="at'+qi+'" class="attempt">'+(attempt)+'</span>';
                              }
                              if (scored || attempt > 0 || score != '') {
                                qtxt += '<span id="sc'+qi+'" class="score">'+score+'</span>'
                              }
                              qtxt += '<div class="grademe"></div></div>';
                              for (var i=0, l= param.options.length; i<l; i++) {
                                  var opt = param.options[i].split(',')[0];
                                  qtxt += '<span id="ddm'+qu.qid+'_'+qi+'_'+i+'" class="dragme">' + opt + '</span>';
                              }
                              qtxt += '<div class="clearbox">&nbsp;</div>';

                          } else {
                              qtxt += '</div>';
                          }
                          break;
                      case 'multiple':
                          qtxt = '<div id="quest'+qu.qid+'_'+qi+'" class="qtext multipleq">'+param.display
                          if (param.options && param.options.length) {
                              if (scored || attempt != '' && attempt > 0) {
                                qtxt += '<span id="at'+qi+'" class="attempt">'+(attempt)+'</span>';
                              }
                              if (scored || attempt > 0 || score != '') {
                                qtxt += '<span id="sc'+qi+'" class="score">'+score+'</span>'
                              }
                              qtxt += '<div class="grademe"></div></div>';
                              for (var i=0, l= param.options.length; i<l; i++) {
                                  var opt = param.options[i];
                                  var chh = (chosen[i]) ? ' checked="checked" ' : '';
                                  qtxt += '<div class="multipleopt"><input id="op'+qu.qid+'_'+i
                                        +'" class="check" '+chh+' type="checkbox"><label for="op'+qu.qid+'_'+i+'">' + opt + '</label></div>';
                              }
                          } else {
                              qtxt += '</div>';
                          }
                          break;
                  }
                  if (sscore.qdiv != undefined) {
                    sscore.qdiv = qtxt;
                    sscore.qdivid = 'qq'+qu.qid+'_'+qi;
                    sscore.scid = 'sc'+qi;
                    sscore.atid = 'at'+qi;
                  }
                  return '<div class="question" id="qq'+qu.qid+'_'+qi+'">' + qtxt + '</div>';
            }
      }

wb.render.cool={ 
         header:function(heading,ingress,summary) { 
            var head = '<h1 class="wbhead">' + heading + '<span id="editwb" class="wbteachedit">&nbsp;</span></h1>' ;
            var summary = '<div class="wbsummary"><table>'
                  + '<tr><th>Uke</th><th></th><th>Absent</th><th>Tema</th><th>Vurdering</th><th>Mål</th><th>Oppgaver</th><th>Logg</th></tr>'
                  + summary + '</table></div>'; 
            var bod = '<div class="wbingress">'+ingress+'</div>'; 
            return(head+summary+bod);
           }  
       , body:function(bodytxt) {
            var bod = '<div class="wbbodytxt">'+bodytxt+'</div>';
            return bod;
           }   
         // renderer for question list - should switch on qtype
       , qlist:function(questlist) {
            var qq = '';
            var qql = [];
            for (var qidx in questlist) {
              qu = questlist[qidx];
              var qdiv = '<div id="'+qu.id+'">' + qu.qtext + '</div>';
              qql.push(qdiv);
            }
            qq = qql.join('');
            return qq;
           }   
      }
