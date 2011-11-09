// a workbook for a course
//   teach can add elements to book
//   quiz - link to a test
//   questions - question displayd direct on page
//   container - a link to a sub-workbook
//       a container is like a chapter
//       can contain (quiz,question,container)



function workbook(coursename) {
    var courseid = database.cname2id[coursename];
    $j.getJSON('/workbook',{ courseid:courseid, coursename:coursename }, function(resp) {
        var courseinfo = resp.qtext;
        var heading = courseinfo.header || 'Workbook';
        var ingress = courseinfo.ingress || 'A workbook';
        var bodytxt = courseinfo.body || 'some text';
        var layout =  courseinfo.layout || 'normal';
        var header = wb.render[layout].header(heading,ingress);
        var body = wb.render[layout].body(bodytxt);
        var s = header + body;
        $j("#main").html(s);
    });
}


var wb = {

   render: {
      normal:{ 
         header:function(heading,ingress) { 
            return '<h1>' + heading + '</h1>' + '<div class="wbingress">'+ingress+'</div>'; 
           }  
       , body:function(bodytxt) {
            return '<div class="wbbodytxt">'+bodytxt+'</div>';
           }   
      }
   }
  , themetag:'wb'
}

