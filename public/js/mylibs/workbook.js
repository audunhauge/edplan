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
        var s = ''
            + '<h1>Arbeidsbok for '+coursename+' '+courseid+'</h1>'
            + '' + resp.qtext;

        $j("#main").html(s);
    });
}
