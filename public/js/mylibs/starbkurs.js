// funksjoner for å registrere/vise starbkurs

var starbless = {}; // id => starb-lesson


function starbkurs() {
  $j.getJSON('/starblessons', function(data) {
    var starbliste = [];
    for (var ii in data) {
      var sl = data[ii];
      starbless[+sl.id] = sl;
      starbliste.push('<li id="sl'+sl.id+'">' + sl.name + '</li>');
    }
    var starbul = '<ul class="starbless">' + starbliste.join('') + '</ul>';
    var s = '<div class="sized1 centered gradback">'
            + '<h1 id="oskrift">Starb-kurs</h1>'
            + starbul
            + '  <br><div id="newless" class="button float gui" >Nytt kurs</div>'
            + '</div>';
     $j("#main").html(s);
     $j("ul.starbless li").click(function () {
          editstarbless(+this.id.substr(2));
       });
     $j("#newless").click(function() {
         $j.getJSON('/createstarbless',{ info:'nytt' , name:'nytt kurs', roomid:1, teachid:1 , day:1 }, function(data) {
            starbkurs();
         });
       });
  });
}


function editstarbless(cid) {
  $j.getJSON('/getstarblessdates', { starbless:cid }, function(data) {
    var starbc = starbless[cid] || { id:0, value:'', teachid:0, roomid:0, day:0 };
    var teach = (teachers && teachers[starbc.teachid] ) ? teachers[starbc.teachid].username : '';
    var room = (database.roomnames && database.roomnames[starbc.roomid] ) ?  database.roomnames[starbc.roomid]  : '';
    var starbdag = { 0:"MAN", 2:"ONS", 3:"TOR" };
    var dagliste = "MAN,TIR,ONS,TOR".split(',');
    var dagnavn = starbdag[starbc.day] || '';
    var s = '<div class="sized1 centered gradback">'
            + '<h1 id="oskrift">Starb-kurs</h1>'
            + '<div id="makeres" class="sized25 " >'
            + '  <br>Kursnavn <input id="navn" type="text" value="'+starbc.name+'"/>'
            + '  <br>Kursinfo:<br> <textarea id="restext">'+starbc.value+'</textarea>'
            + '  <br>teach <input id="teach" type="text" value="'+teach+'"/>'
            + '  <br>rom <input id="room" type="text" value="'+room+'">'
            + '  <br>dag <input id="day" type="text"  value="'+dagnavn+'"/>'
            + '  <br><div id="savestarb" class="button float gui" >Lagre</div>'
            + '</div><br>' 
            + '<div id="weeks"></div><br>' 
            + '</div>';
     $j("#main").html(s);

     // draw up the whole calendar
        var day = starbc.day;
        var theader ="<table >"
         + "<tr><th>Uke</th><th>"+dagnavn+"</th><th>Merknad</th></tr>";
        var tfooter ="</table>";
        var wl = theader;
        start =  database.firstweek; 
        stop =   database.lastweek;
        var week = julian.week(start);
        var i,j;
        var e;
        var pro;   // dagens prover
        var txt;
        var thclass;
        var cc;

        var events = database.yearplan;
        for (i= start; i < stop; i += 7) {
          e = events[Math.floor(i/7)] || { pr:[],days:[]};
          // add a page break if we pass new year
          wl += "<tr>";
          thclass = '';
          wl += '<th><div class="weeknum">'+julian.week(i)+'</div><br class="clear" /><div class="date">' + formatweekdate(i) + "</div></th>";
            if (database.freedays[i+day]) {
              txt = database.freedays[i+day];
              tdclass = 'fridag';
            } else {
              txt = (j == 5) ? (e.days[day] || '') : '';
              tdclass = '';
            }
            wl += '<td class="'+tdclass+'">' + txt + "</td>";
          wl += "</tr>";
        }
        wl += "</table>";
     
     $j("#weeks").html(wl);
     $j("#teach").autocomplete({ source:database.tnames } )
     $j("#room").autocomplete({ source:database.roomnamelist } )
     $j("#day").autocomplete({ source:dagliste } )
     $j("#savestarb").click(function() {
          var ok = 0;
          var info =  $j("#restext").val();
          var name =  $j("#navn").val().substr(0,25);
          var tname = $j("#teach").val().toUpperCase();
          if (tname && database.teachuname &&  database.teachuname[tname] )  ok |= 1
          var rname = $j("#room").val().toUpperCase();
          if (rname && database.roomids &&  database.roomids[rname] ) ok |= 2;
          var dname = $j("#day").val().toUpperCase();
          if (dname &&  $j.inArray(dname,dagliste) >= 0 && starbdag[$j.inArray(dname,dagliste)] )  ok |= 4;
          if (ok != 7) {
            ok = ~ok;
            var err = [ "","Teach ","Rom ","","Dag " ];
            var msg = "Ugyldig " + err[ok & 1] + err[ok & 2] + err[ok & 4];
            alert(msg);
            editstarbless(cid);
          } else {
            // nå har vi brukbare verdier - lagre disse
            var roomid = database.roomids[rname];
            var teachid = database.teachuname[tname];
            var day = 1 + $j.inArray(dname,dagliste) ;
            $j("#savestarb").html("Lagrer ..");
            $j.getJSON('/savestarbless',{ info:info , name:name, roomid:roomid, teachid:teachid , day:day, idd:cid }, function(data) {
              $j.getJSON('/starblessons', function(data) {
                for (var ii in data) {
                  var sl = data[ii];
                  starbless[+sl.id] = sl;
                }
                editstarbless(cid);
              });
            });
          }
     });
   });
}
