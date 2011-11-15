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
  MathJax.Hub.Queue(["Typeset",MathJax.Hub,"main"]);
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
      var showlist = generateQlist(wbinfo,qlist);
      if (showlist.length) {
        var showqlist = wb.render[wbinfo.layout].qlist(showlist);
        $j("#qlist").html( showqlist);
      }
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
                editquestion(myid);
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
 * This code really belongs in quiz/questioneditor.js
 * but during debug we need it here
 *
*/ 

function editquestion(myid) {
  // given a quid - edit the question
 var descript = { multiple:'Multiple choice' };
 $j.getJSON('/getquestion',{ qid:myid }, function(q) {
  var qdescript = descript[q.qtype] || q.qtype;
  var head = '<h1 class="wbhead">Question editor</h1>' ;
       head += '<h3>Question '+ q.id + ' ' + qdescript + '</h3>' ;
  var optlist = '';
  for (var i=0,l=q.options.length; i<l; i++) {
    var fa = (q.fasit[i]) ? ' checked="checked" ' : '';
    optlist += '<tr><td><input class="option" type="text" value="'
           + q.options[i] +'"></td><td><div class="eopt"><input class="check" type="checkbox" '+fa+' ><div class="killer"></div></div></td></tr>';
  }
  var s = '<div id="wbmain">' + head + '<div id="qlistbox"><div id="editform">'
  + '<table class="qed">'
  + '<tr><th>Navn</th><td><input type="text">' + q.name + '</input></td></tr>'
  + '<tr><th>Spørsmål</th><td><textarea>' + q.display + '</textarea></td></tr>'
  + '</table>'
  + '<hr />'
  + '<h3>Alternativer</h3>'
  + '<table class="opts">'
  + optlist
  + '</table>'
  + '</div><div class="button" id="addopt">+</div><div class="button" id="saveq">Lagre</div>'
  + '<div id="killquest"><div id="xx">x</div></div></div></div>';
  $j("#main").html(s);
 });
}

function dropquestion(wbinfo,qid) {
  $j.post('/dropquestion', {  qid:qid, container:wbinfo.containerid }, function(resp) {
         $j.getJSON('/getcontainer',{ container:wbinfo.containerid }, function(qlist) {
           wbinfo.qlist = qlist;
           edqlist(wbinfo);
         });
      });
}
