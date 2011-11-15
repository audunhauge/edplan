// functions for editing quiz questions
//


function editquestion(myid) {
  alert(myid);
}

function dropquestion(wbinfo,qid) {
  $j.post('/dropquestion', {  qid:qid, container:wbinfo.containerid }, function(resp) {
         $j.getJSON('/getcontainer',{ container:wbinfo.containerid }, function(qlist) {
           wbinfo.qlist = qlist;
           edqlist(wbinfo);
         });
      });
}

