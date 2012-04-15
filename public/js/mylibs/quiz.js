// start of quiz class
// first draft just presents two textareas for writing a
// canonical answer and comparing against a stud-text



function quizDemo() {
    var s = '<div class="sized1 centered gradback">'
            + '<h1 class="retainer" id="oskrift">Questionbank - editor</h1>'
            + '<idv id="rapp">Indekserer og krysskobler alle ord i alle dine spørsmål ... vent litt ...</div>';
    $j("#main").html(s);
    $j.get( "/wordindex", 
         function(data) {
           if (data == undefined) { 
             $j("#rapp").html("Du har ingen spørsmål, er ikke logget inn eller er ikke lærer");
             return;
           }
           //console.log(data);
           var words = '';
           var wordobj = data.wordlist;
           var wordlist = [];
           for (var w in wordobj) {
             var wo = wordobj[w];
             wo.w = w;
             wordlist.push(wo);
           }
           var relations = data.relations;
           relations.sort(function(b,a) {return +a[0] - +b[0]; } );
           // relations is now [ samewordcount,question1,question2 ]
           wordlist.sort(function(a,b) { return +b.qcount - +a.qcount; });
           for (var w in wordlist) {
             var wo = wordlist[w];
             words += wo.w + ' ' + wo.qcount + ', ';
           }
           words += '<h4>Relations</h4>';

           for (var i=0; i < relations.length; i+=1) {
             // skip every other as the words match two by two
             var re = relations[i];
             words += re.join(',') + "<br>";

           }

           $j("#rapp").html(words);

         });

}

