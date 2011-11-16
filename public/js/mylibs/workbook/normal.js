/*
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
            //var addmore = '<div id="addmore" class="button">add</div>';
            return bod+contained;
           }   
       , editql:function(questlist) {
            var qq = '';
            var qql = [];
            for (var qidx in questlist) {
              qu = questlist[qidx];
              var shorttext = qu.display || '&lt; no text &gt;';
              shorttext = shorttext.replace(/</g,'&lt;');
              shorttext = shorttext.replace(/>/g,'&gt;');
              var qdiv = '<div class="equest" id="qq_'+qu.id+'">' + qu.id+ ' ' + qu.qtype + ' '
                         + qu.name + ' ' + shorttext.substr(0,20)+' '+ qu.points +'<div class="edme"></div><div class="killer"></div></div>';
              qql.push(qdiv);
            }
            qq = qql.join('');
            return qq;
           }   
         // renderer for question list - should switch on qtype
       , qlist:function(questlist) {
            var qq = '';
            var qql = [];
            for (var qidx in questlist) {
              qu = questlist[qidx];
              var qdiv = displayQuest(qu);
              qql.push(qdiv);
            }
            qq = qql.join('');
            return qq;
            function displayQuest(qu) {
                var qtxt = ''
                switch(qu.qtype) {
                    case 'multiple':
                        qtxt = '<div class="multipleq">'+qu.display+'</div>';
                        if (qu.options) {
                          qtxt += '<div class="multipleopt"><input class="check" type="checkbox">'
                               + qu.options.join('</div><div class="multipleopt"><input class="check" type="checkbox">')+'</div>';
                        }
                        break;
                }
                return '<div class="question" id="'+qu.id+'">' + qtxt + '</div>';
            }
           }   
      }
*/      
