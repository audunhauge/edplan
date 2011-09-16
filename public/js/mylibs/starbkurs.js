// funksjoner for å registrere/vise starbkurs

var starbless = {};  // id => starb-lesson
var starbliste = []; // list of teachers with starb


function starbkurs() {
  $j.getJSON('/starblessons', function(data) {
    starbliste = [];
    var tid = 0;
    for (var ii in data) {
      var sl = data[ii];
      if (sl.teachid != tid) {
         tid = sl.teachid;
         var teach = (teachers && teachers[sl.teachid] ) ? teachers[sl.teachid].firstname.caps()  + ' ' + teachers[sl.teachid].lastname.caps() : '';
         starbliste.push('</ul></li><li>' + teach + '<ul>');
      }
      starbless[+sl.id] = sl;
      starbliste.push('<li id="sl'+sl.id+'">' + sl.name + '</li>');
    }
    var starbul = drawStarbList();
    var s = '<div class="sized1 centered gradback">'
            + '<h1 id="oskrift">Starb-kurs</h1>'
            + starbul
            + '  <br><div id="newless" class="button float gui" >Nytt kurs</div>'
            + '</div>';
     $j("#main").html(s);
     $j("ul.starbless li ul li").click(function () {
          editstarbless(+this.id.substr(2));
       });
     $j("#newless").click(function() {
         $j.getJSON('/createstarbless',{ info:'nytt' , name:'nytt kurs', roomid:1, teachid:1 , day:1 }, function(data) {
            starbkurs();
         });
       });
  });
}

function drawStarbList() {
    var starbul = '<ul class="starbless"><li><ul>' + starbliste.join('') + '</ul></li></ul>';
    return starbul;
}


function editstarbless(cid) {
  var starbc = starbless[cid] || { id:0, value:'', teachid:0, roomid:0, day:0 };
  var teach = (teachers && teachers[starbc.teachid] ) ? teachers[starbc.teachid].username : '';
  var room = (database.roomnames && database.roomnames[starbc.roomid] ) ?  database.roomnames[starbc.roomid]  : '';
  $j.getJSON('/getstarblessdates', { teachid:starbc.teachid }, function(data) {
    var starbdag = { 0:"MAN", 2:"ONS", 3:"TOR" };
    var dagliste = "MAN,TIR,ONS,TOR".split(',');
    var dagauto = "MAN,ONS,TOR".split(',');
    var dagnavn = starbdag[starbc.day] || '';
    var starbul = drawStarbList();
    var s = '<div class="sized1 centered gradback">'
            + '<h1 id="oskrift">Starb-kurs</h1>'
            + '<div id="starbliste">'+starbul+'</div>'
            + '<div id="starbcourse">'
            + '  <div> <label> Kursnavn  </label> <input id="navn" type="text" value="'+starbc.name+'"/></div>'
            + '  <div> <label> Teach     </label> <input id="teach" type="text" value="'+teach+'"/></div>'
            + '  <div> <label> Rom       </label> <input id="room" type="text" value="'+room+'"></div>'
            + '  <div> <label> Dag       </label> <input id="day" type="text"  value="'+dagnavn+'"/></div>'
            + '  <div> <label> Kursinfo  </label> <textarea id="kinfo">'+starbc.value+'</textarea></div>'
            + '  <div> <div id="savestarb" class="button float gui" >Lagre</div></div>'
            + '</div>' 
            + '<div id="weeks"></div><br>' 
            + '</div>';
    $j("#main").html(s);
    $j("ul.starbless li ul li").click(function () {
       editstarbless(+this.id.substr(2));
    });
    var ssta = {};
    for (var ii in data) {
      var st = data[ii];
      if (st.julday % 7 == starbc.day) {
        ssta[st.julday] = (st.courseid == cid) ? 1 : 2;
      }
    }

     // draw up the whole calendar
     var day = starbc.day;
     var wl = '';
     if (teach) {
       wl = drawTable(day,dagnavn,ssta);
     }
     $j("#weeks").html(wl);
     $j("#teach").autocomplete({ source:database.tnames } )
     $j("#room").autocomplete({ source:database.roomnamelist } )
     $j("#day").autocomplete({ source:dagauto } )
     $j("#weeks").delegate("td.free","click",function() {
         var jd = +this.id.substr(2);
         ssta[jd] = 1;
         var wl = drawTable(day,dagnavn,ssta);
         $j("#weeks").html(wl);
     });
     $j("#weeks").delegate("td.noc","click",function() {
         var jd = +this.id.substr(2);
         delete ssta[jd];
         var wl = drawTable(day,dagnavn,ssta);
         $j("#weeks").html(wl);
     });
     $j("#savestarb").click(function() {
          var ok = 0;
          var info =  $j("#kinfo").val();
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
            // good values - save them
            var roomid = database.roomids[rname];
            var teachid = database.teachuname[tname];
            var day = 1 + $j.inArray(dname,dagliste) ;
            // get list of juldays for this course
            var jds = [];
            for (var jd in ssta) {
              if (ssta[jd] == 1) jds.push(jd);
            }
            var jdlist = jds.join(',');
            $j("#savestarb").html("Lagrer ..");
            $j.getJSON('/savestarbless',{ jdays:jdlist, info:info , name:name, roomid:roomid, teachid:teachid , day:day, idd:cid }, 
            function(data) {
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


function drawTable(day,dagnavn,ssta) {
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
          thclass = 'noc';
          wl += '<th><div class="weeknum">'+julian.week(i)+'</div><br class="clear" /><div class="date">' + formatweekdate(i) + "</div></th>";
          for (j=0; j<6; j++) {
            if (j != day && j < 5) continue;
            if (database.freedays[i+j]) {
              txt = database.freedays[i+j];
              tdclass = 'fridag';
            } else {
              if (j == 5)  {
                txt = e.days[j] || '';
                tdclass = '';
              } else {
                txt = '';
                tdclass = (ssta[i+j]) ? ( (ssta[i+j] == 1) ? 'noc' : 'nic' ) : 'free' ;
              }
            }
            wl += '<td id="td'+(i+j)+'" class="'+tdclass+'">' + txt + "</td>";
          }
          wl += "</tr>";
        }
        wl += "</table>";
        return wl;
}        
