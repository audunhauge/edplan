// functions for editing quiz questions
//


/*
function editquestion(myid) {
  // given a quid - edit the question
 $j.getJSON('/getquestion',{ qid:myid }, function(q) {
  var head = '<h1 class="wbhead">Edit ' + q.id + '</h1>' ;
  var s = '<div id="wbmain">' + head + '<div id="qlistbox"><div id="sortable">'+q.qtext + '</div></div></div>';
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
*/

