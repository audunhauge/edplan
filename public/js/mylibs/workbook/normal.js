
wb.render.normal  = { 
         // renderer for header
         header:function(heading,ingress,summary) { 
            var head = '<h1 class="wbhead">' + heading + '<span id="editwb" class="wbteachedit">&nbsp;</span></h1>' ;
            var summary = '<div class="wbsummary"><table>'
                  + '<tr><th>Uke</th><th></th><th>Absent</th><th>Tema</th><th>Vurdering</th><th>Mål</th><th>Oppgaver</th><th>Logg</th></tr>'
                  + summary + '</table></div><hr>'; 
            var bod = '<div class="wbingress">'+ingress+'</div>'; 
            return(head+summary+bod);
           }  
         // renderer for body
       , body:function(bodytxt) {
            var bod = '<div class="wbbodytxt">'+bodytxt+'</div>';
            var contained = '<div id="qlistbox" class="wbbodytxt"><br><span id="edqlist" class="wbteachedit">&nbsp;</span><div id="qlist"></div></div>';
            var addmore = '<div id="addmore" class="button">add</div>';
            return bod+contained+addmore;
           }   
         // renderer for question list - should switch on qtype
       , qlist:function(questlist) {
            var qq = '';
            var qql = [];
            for (var qidx in questlist) {
              qu = questlist[qidx];
              var qdiv = '<div class="question" id="'+qu.id+'">' + qu.qtext + '</div>';
              qql.push(qdiv);
            }
            qq = qql.join('');
            return qq;
           }   
      }
