// a workbook for a course
//   teach can add elements to book
//   quiz - link to a test
//   questions - question displayd direct on page
//   container - a link to a sub-workbook
//       a container is like a chapter
//       can contain (quiz,question,container)

var wb = { render: {} };


function workbook(coursename) {
    var courseid = database.cname2id[coursename];
    var plandata = courseplans[coursename];
    var tests = coursetests(coursename);
    var felms = coursename.split('_');
    var fag = felms[0];
    var gru = felms[1];
    var timmy = {};
    var tidy = {};
    var startjd = database.firstweek;
    var tjd = database.startjd;
    var section = Math.floor((tjd - startjd) / 7);
    // build timetable data for quick reference
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
    var uke = julian.week(tjd);
    var elever = memberlist[gru];
    var info = synopsis(coursename,plandata);
    var weeksummary = showAweek(false,gru,elever,info,absent,timmy,tests,plandata,uke,tjd,section);
    $j.getJSON('/workbook',{ courseid:courseid, coursename:coursename }, function(resp) {
        if (resp) {
          var courseinfo;
          try {
            eval( 'courseinfo = '+resp.qtext);
          }
          catch(err) {
            courseinfo = {};
          }
          var title = courseinfo.title || coursename;
          var ingress = courseinfo.ingress || '';
          var bodytext = courseinfo.text || '';
          var layout = courseinfo.layout || 'normal';
          var qlistorder = courseinfo.qlist || [];
          $j.getScript('js/mylibs/workbook/'+layout+'.js', function() {
              var header = wb.render[layout].header(title,ingress,weeksummary);
              var body = wb.render[layout].body(bodytext);
              var s = '<div id="wbmain">'+header + body + '</div>';
              $j("#main").html(s);
              if (userinfo.department == 'Undervisning') {
                $j("span.wbteachedit").addClass("wbedit");
              }
              MathJax.Hub.Queue(["Typeset",MathJax.Hub,"main"]);
              $j(".totip").tooltip({position:"bottom right" } );
              $j("#main").undelegate("#editwb","click");
              $j("#main").delegate("#editwb","click", function() {
                  setupWB(courseid,coursename,title);
              });
              $j("#addmore").click(function() {
                  $j.post('/editqncontainer', { action:'create', container:resp.id }, function(resp) {
                     workbook(coursename);
                  });
              });
              $j.getJSON('/getcontainer',{ container:resp.id }, function(qlist) {
                  if (qlist) {
                    // qlist is list of questions in this container
                    var ql = [];
                    var showlist = [];
                    var trulist = []; // a revised version of qlistorder where ids are good
                    var changed = false;
                    for (var qi in qlist) {
                      var qu = qlist[qi];
                      ql[qu.id] = qu;
                    }
                    for (var qi in ql) {
                      if (!($j.inArray(+qi,qlistorder) >= 0)) {
                        // this id is missing from sortorder, append it
                        changed = true;
                        qlistorder.push(+qi);
                      }
                    }
                    for (var qi in qlistorder) {
                      var quid = qlistorder[qi];
                      if (ql[+quid]) {
                        trulist.push(+quid);
                        var qu = ql[+quid];
                        showlist.push(qu.qtext);
                      } else {
                          changed = true;
                      }
                    }
                    // update qlistorder in the container if different from orig
                    if (changed) {
                      courseinfo.qlistorder = trulist;
                      $j.post('/editquest', { action:'update', qtext:courseinfo, qid:resp.id }, function(resp) {
                      });
                    }
                    // original
                    if (showlist.length) {
                      $j("#qlist").html( '<ul><li>'+showlist.join('</li><li>')+'</li></ul>' );
                    }
                  }
              });
          })
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

function setupWB(courseid,coursename,heading) {
  $j.getJSON('/workbook',{ courseid:courseid, coursename:coursename }, function(resp) {
    if (resp) {
      var courseinfo;
      try {
        eval( 'courseinfo = '+resp.qtext);
      }
      catch(err) {
        courseinfo = {};
      }
      var title = courseinfo.title || coursename;
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
            workbook(coursename);
          });
      $j("#save").click(function() {
            courseinfo.title = $j("input[name=tittel]").val();
            courseinfo.ingress = $j('#ingress').val()
            courseinfo.text = $j('#text').val()
            courseinfo.layout = $j("#layout option:selected").val();
            //$j.post('/editquest', { action:'update', qtext:{ title:title, ingress:ingress, text:text, layout:layout }, qid:resp.id }, function(resp) {
            $j.post('/editquest', { action:'update', qtext:courseinfo, qid:resp.id }, function(resp) {
                 workbook(coursename);
                 //setupWB(courseid,coursename,heading);
              });
          });
    }
  });
}

/*
// functions for rendering - based on layout
var wb = {

   render: {
      normal:{ 
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
            var contained = '<div id="qlistbox" class="wbbodytxt"><br><span id="edqlist" class="wbteachedit">&nbsp;</span><div id="qlist"></div></div>';
            var addmore = '<div id="addmore" class="button">add</div>';
            return bod+contained+addmore;
           }   
      }
      , cool:{ 
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
      }
   }
  , themetag:'wb'
}

*/
