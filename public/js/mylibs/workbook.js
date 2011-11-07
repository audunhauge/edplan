// a workbook for a course
//   teach can add elements to book
//   quiz - link to a test
//   questions - question displayd direct on page
//   container - a link to a sub-workbook
//       a container is like a chapter
//       can contain (quiz,question,container)



function workbook(courseid) {
    var coursename = courses[courseid];
    var s = ''
        + '<h3>Arbeidsbok for '+coursename+'</h1>'
        + '';

    $j("#main").html(s);
}
