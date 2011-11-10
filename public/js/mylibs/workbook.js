// a workbook for a course
//   teach can add elements to book
//   quiz - link to a test
//   questions - question displayd direct on page
//   container - a link to a sub-workbook
//       a container is like a chapter
//       can contain (quiz,question,container)



function workbook(coursename) {
    var courseid = database.cname2id[coursename];
    var plandata = courseplans[coursename];
    var tests = coursetests(coursename);
    var felms = coursename.split('_');
    var fag = felms[0];
    var gru = felms[1];
    var timmy = {};
    var tidy = {};
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
    var tjd = database.startjd;
    var uke = julian.week(tjd);
    var elever = memberlist[gru];
    var info = synopsis(coursename,plandata);
    var weeksummary = showAweek(false,gru,elever,info,absent,timmy,tests,plandata,uke,tjd,section);
    $j.getJSON('/workbook',{ courseid:courseid, coursename:coursename }, function(resp) {
        if (resp) {
          var courseinfo = resp.qtext;
          var heading = courseinfo.header || 'Workbook';
          var ingress = courseinfo.ingress || 'A workbook';
          var bodytxt = courseinfo.body || 'some text';
          var layout =  courseinfo.layout || 'normal';
          var header = wb.render[layout].header(heading,ingress);
          var body = wb.render[layout].body(bodytxt);
          var s = header + body;
          $j("#main").html(s);
          if (userinfo.department == 'Undervisning') {
            $j("span.wbteachedit").addClass("wbedit");
          }
        }
    });
}


var wb = {

   render: {
      normal:{ 
         header:function(heading,ingress) { 
            var head = '<h1 class="wbhead">' + heading + '<span class="wbteachedit">&nbsp;</span></h1>' 
            var bod = '<div class="wbingress">'+ingress+'</div>'; 
            return(head+bod);
           }  
       , body:function(bodytxt) {
            var bod = '<div class="wbbodytxt">'+bodytxt+'</div>';
            return bod;
           }   
      }
   }
  , themetag:'wb'
}

