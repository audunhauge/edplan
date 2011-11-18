// a workbook for a course
//   teach can add elements to book
//   quiz - link to a test
//   questions - question displayd direct on page
//   container - a link to a sub-workbook
//       a container is like a chapter
//       can contain (quiz,question,container)

var wb = { render: {} };

function renderPage(wbinfo) {
  // call the render functions indexed by layout
  // render the question list and update order if changed
  // typeset any math
  // prepare the workbook editor (setupWB)
  var header = wb.render[wbinfo.layout].header(wbinfo.title,wbinfo.ingress,wbinfo.weeksummary);
  var body = wb.render[wbinfo.layout].body(wbinfo.bodytext);
  var s = '<div id="wbmain">'+header + body + '</div>';
  $j("#main").html(s);
  if (userinfo.department == 'Undervisning') {
    $j("span.wbteachedit").addClass("wbedit");
  }
  $j(".totip").tooltip({position:"bottom right" } );
  $j("#main").undelegate("#editwb","click");
  $j("#main").delegate("#editwb","click", function() {
      setupWB(wbinfo,header);
  });
  $j("#main").undelegate("#edqlist","click");
  $j("#main").delegate("#edqlist","click", function() {
      edqlist(wbinfo);
  });
  $j.getJSON('/getcontainer',{ container:wbinfo.containerid }, function(qlist) {
    $j.getJSON('/getuseranswer',{ container:wbinfo.containerid, quizid:wbinfo.quizid }, function(ualist) {
      var showlist = generateQlist(wbinfo,qlist);
      if (showlist.length) {
        var showqlist = wb.render[wbinfo.layout].qlist(showlist,ualist);
        $j("#qlist").html( showqlist);
        MathJax.Hub.Queue(["Typeset",MathJax.Hub,"main"]);
        $j(".grademe").html('<div class="gradebutton">Vurder</div>');
        $j("#qlistbox").undelegate(".grademe","click");
        $j("#qlistbox").delegate(".grademe","click", function() {
            var myid = $j(this).parent().attr("id");
            $j("#"+myid+" div.gradebutton").html("Lagrer..");
            $j("#"+myid+" div.gradebutton").addClass("working");
            var elm = myid.substr(5).split('_');  // fetch questionid and instance id (is equal to index in display-list)
            var qid = elm[0], iid = elm[1];
            var ua = wb.getUserAnswer(qid,iid,myid,showlist);
            $j.post('/gradeuseranswer', {  iid:iid, qid:qid, cid:wbinfo.containerid, ua:ua }, function(resp) {
              $j.getJSON('/getuseranswer',{ container:wbinfo.containerid }, function(ualist) {
                var showqlist = wb.render[wbinfo.layout].qlist(showlist,ualist);
                $j("#qlist").html( showqlist);
                $j(".grademe").html('<div class="gradebutton">Vurder</div>');
                MathJax.Hub.Queue(["Typeset",MathJax.Hub,"main"]);
              });
            });
        });
      }
    });
  });
}

function generateQlist(wbinfo,qlist) {
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
          $j.post('/editquest', { action:'update', qtype:'container', qtext:wbinfo.courseinfo, qid:wbinfo.containerid }, function(resp) {
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

function edqlist(wbinfo) {
  var showlist = generateQlist(wbinfo,wbinfo.qlist);
  var showqlist = wb.render[wbinfo.layout].editql(showlist);
  var header = wb.render[wbinfo.layout].header(wbinfo.title,wbinfo.ingress,wbinfo.weeksummary);
  var head = '<h1 class="wbhead">' + header + '</h1>' ;
  var s = '<div id="wbmain">' + head + '<div id="qlistbox"><div id="sortable">'+showqlist + '</div><div id="addmore" class="button">add</div></div></div>';
  $j("#main").html(s);
  MathJax.Hub.Queue(["Typeset",MathJax.Hub,"main"]);
  $j("#sortable").sortable({placeholder:"ui-state-highlight",update: function(event, ui) {
            var ser = $j("#sortable").sortable("toArray");
            var trulist = [];
            for (var i=0,l=ser.length; i<l; i++) {
              trulist.push(ser[i].substr(3));
            }
            wbinfo.courseinfo.qlistorder = trulist;
            $j.post('/editquest', { action:'update', qtype:'container', qtext:wbinfo.courseinfo, qid:wbinfo.containerid }, function(resp) {
            });
          }  
       });
  $j("#addmore").click(function() {
      $j.post('/editqncontainer', { action:'create', container:wbinfo.containerid }, function(resp) {
         $j.getJSON('/getcontainer',{ container:wbinfo.containerid }, function(qlist) {
           wbinfo.qlist = qlist;
           edqlist(wbinfo);
         });
      });
  });
  $j(".wbhead").click(function() {
      workbook(wbinfo.coursename);
  });
  // check if question editor is loaded
  // and load it if missing
  if (typeof(editquestion) == 'undefined' ) {
      $j.getScript('js/'+database.version+'/quiz/editquestion.js', function() {
              editbind(wbinfo);
      });
  } else {
     editbind(wbinfo);
  }
}

function editbind(wbinfo) {
        $j("#sortable").undelegate(".equest","click");
        $j("#sortable").delegate(".edme","click", function() {
                var myid = $j(this).parent().attr("id").substr(3);
                editquestion(wbinfo,myid);
            });
        $j("#sortable").undelegate(".killer","click");
        $j("#sortable").delegate(".killer","click", function() {
                var myid = $j(this).parent().attr("id").substr(3);
                dropquestion(wbinfo,myid);
            });
}

function workbook(coursename) {
    var wbinfo = {};
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
            renderPage(wbinfo);
          }  else {
            $j.getScript('js/'+database.version+'/workbook/'+wbinfo.layout+'.js', function() {
                   renderPage(wbinfo);
              });
          }
        }
    });
}

function makeSelect(name,selected,arr) {
  // prelim version - needs selected,value and ids
  var s = '<select id="'+name+'" ">';
  for (var ii in arr) {
    var oo = arr[ii];
    var sel = (selected == oo) ? ' selected="selected" ' : '';
    s += '<option '+sel+' value="'+oo+'">'+oo+'</option>';
  }
  s += '</select>';
  return s;
}

function setupWB(wbinfo,heading) {
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
            workbook(wbinfo.coursename);
          });
      $j("#save").click(function() {
            courseinfo.title = $j("input[name=tittel]").val();
            courseinfo.ingress = $j('#ingress').val()
            courseinfo.text = $j('#text').val()
            courseinfo.layout = $j("#layout option:selected").val();
            //$j.post('/editquest', { action:'update', qtext:{ title:title, ingress:ingress, text:text, layout:layout }, qid:resp.id }, function(resp) {
            $j.post('/editquest', { action:'update', qtext:courseinfo, qid:resp.id }, function(resp) {
                 workbook(wbinfo.coursename);
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

function editquestion(wbinfo,myid) {
  // given a quid - edit the question
 var descript = { multiple:'Multiple choice' };
 $j.getJSON('/getquestion',{ qid:myid }, function(q) {
   var qdescript = descript[q.qtype] || q.qtype;
   var head = '<h1 id="heading" class="wbhead">Question editor</h1>' ;
        head += '<h3>Question '+ q.id + ' ' + qdescript + '</h3>' ;
   var optlist = drawOpts(q.options,q.fasit);
   var s = '<div id="wbmain">' + head + '<div id="qlistbox"><div id="editform">'
   + '<table class="qed">'
   + '<tr><th>Navn</th><td><input class="txted" name="qname" type="text" value="' + q.name + '"></td></tr>'
   + '<tr><th>Spørsmål</th><td><textarea class="txted" id="qdisplay" >' + q.display + '</textarea></td></tr>'
   + '</table>'
   + '<hr />'
   + '<h3>Alternativer</h3>'
   + '<table id="opts" class="opts">'
   + optlist
   + '</table>'
   + '</div><div class="button" id="addopt">+</div><div class="button" id="saveq">Lagre</div>'
   + '<div id="killquest"><div id="xx">x</div></div></div></div>';
   $j("#main").html(s);
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
       edqlist(wbinfo);
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
        var qname = $j("input[name=qname]").val();
        var newqtx = { display:$j("#qdisplay").val(), options:q.options, fasit:q.fasit };
        $j.post('/editquest', { action:'update', qid:myid, qtext:newqtx, name:qname }, function(resp) {
           editquestion(wbinfo,myid);
        });
      });
   $j("#killquest").click(function() {
      $j.post('/editquest', { action:'delete', qid:myid }, function(resp) {
         $j.getJSON('/getcontainer',{ container:wbinfo.containerid }, function(qlist) {
           wbinfo.qlist = qlist;
           edqlist(wbinfo);
         });
      });
        
    });
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
        var fas = $j("input:checked");
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

function dropquestion(wbinfo,qid) {
  $j.post('/editqncontainer', {  action:'delete', qid:qid, container:wbinfo.containerid }, function(resp) {
         $j.getJSON('/getcontainer',{ container:wbinfo.containerid }, function(qlist) {
           wbinfo.qlist = qlist;
           edqlist(wbinfo);
         });
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
          var otxt = qu.options[optid];
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
            var contained = '<div id="qlistbox" class="wbbodytxt"><br><span id="edqlist" class="wbteachedit">&nbsp;</span><div id="qlist"></div></div>';
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
              var qdiv = '<div class="equest" id="qq_'+qu.id+'"><span class="qid">' 
                         + qu.id+ '</span><span class="qtype">' + qu.qtype + '</span><span class="qname"> '
                         + qu.name + '</span><span class="qshort">' + shorttext.substr(0,20)
                         + '</span><span class="qpoints">'+ qu.points +'</span><div class="edme"></div><div class="killer"></div></div>';
              qql.push(qdiv);
            }
            qq = qql.join('');
            return qq;
           }   
         // renderer for question list - should switch on qtype
         // ualist is list of user answers
       , qlist:function(questlist,ualist) {
            var qq = '';
            var qql = [];
            for (var qi=0, l= questlist.length; qi<l; qi++) {
              var qu = questlist[qi];
              var ua = ualist[qu.id];
              var myua = {};
              switch(qu.qtype) {
                // display the users choice/response as part of the question
                  case 'multiple':
                    if (ua) {
                      // we have a useranswer for this question
                      if (ua[qi]) {
                        // we have a useranswer for this question at this position
                        myua = ua[qi];
                      } else {
                        for (var inst in ua) {
                          myua = ua[inst];
                          // we just take the first we find
                          delete ua[inst];
                          // dont use it on next instance
                          break;
                        }
                      }
                    }
                    break;
              }
              var qdiv = displayQuest(qu,qi,myua);
              qql.push(qdiv);
            }
            qq = qql.join('');
            return qq;
            

            function displayQuest(qu,qi,ua) {
                if (qu.display == '') return '';
                var qtxt = ''
                var attempt = ua.attemptnum || '';
                var score = ua.score || '';
                var chosen = [];
                try {
                  eval("chosen = "+ ua.response);
                }
                catch(err) {
                  chosen = [];
                }
                if(!chosen) {
                    chosen = [];
                }
                score = Math.round(score*100)/100;
                switch(qu.qtype) {
                    case 'multiple':
                        qtxt = '<div id="quest'+qu.id+'_'+qi+'" class="qtext multipleq">'+qu.display
                        if (qu.options && qu.options.length) {
                            if (attempt != '') {
                              qtxt += '<span class="attempt">'+(1+attempt)+'</span>';
                            }
                            if (ua.score == 0 || score != '') {
                              qtxt += '<span class="score">'+score+'</span>'
                            }
                            qtxt += '<div class="grademe"></div></div>';
                            for (var i=0, l= qu.options.length; i<l; i++) {
                                var opt = qu.options[i];
                                var chh = (chosen[i]) ? ' checked="checked" ' : '';
                                qtxt += '<div class="multipleopt"><input id="op'+qu.id+'_'+i
                                      +'" class="check" '+chh+' type="checkbox">' + opt + '</div>';
                            }
                        } else {
                            qtxt += '</div>';
                        }
                        break;
                }
                return '<div class="question" id="qq'+qu.id+'_'+qi+'">' + qtxt + '</div>';
            }
           }   
      }
