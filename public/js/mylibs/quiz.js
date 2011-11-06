// start of quiz class
// first draft just presents two textareas for writing a
// canonical answer and comparing against a stud-text



function quizDemo() {
    var s = ''
        + '<h3>Question 1</h1>'
        + '<div class="question_ingress">What is the where</div>'
        + '<form>'
        + ' <div class="facit">'
        + '   <textarea name="answer" id="answer" value="">'
        + '   var a = 0; for (var b = 0; b < 10; b += 1) { print(a); a += b; } '
        + '   </textarea>'
        + ' </div>'
        + ' <div class="responsum">'
        + '   <textarea name="response" id="response" value="">'
        + '   var tot=0;for(var i=0;i<10;i=i+1) { print(tot); tot=tot+i } '
        + '   </textarea>'
        + ' </div>'
        + ' <div id="quiz_grade" class="button" >Grade</div>'
        + '</form>'
        + '<div id="vurdering">'
        + '</div>'
        + ''
        + '';

    $j("#main").html(s);
    $j("#quiz_grade").click(function() {
        var codeA = $j('#response').val() || '';
        var codeB = $j('#answer').val() || '';
        $j.get('/parse',{ code:codeA }, function(resp) {
            var codeAp = resp;
            $j('#response').val(codeAp)
            $j.get('/parse',{ code:codeB }, function(resp) {
              var codeBp = resp;
              $j('#answer').val(codeBp)
              $j.get('/wdiff',{ codeA:codeAp, codeB:codeBp }, function(resp) {
                  var diff = resp.diff;
                  $j("#vurdering").html(diff);
              });
            });
        });

    });
}
