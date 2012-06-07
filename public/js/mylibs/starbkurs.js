// funksjoner for å registrere/vise starbkurs

var starbless = {};  // id => starb-lesson
var starbliste = []; // list of teachers with starb


function starbkurs() {
  $j.getJSON(mybase+'/starblessons', function(data) {
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
         $j.getJSON(mybase+'/createstarbless',{ info:'nytt' , name:'nytt kurs', roomid:1, teachid:1 , day:1 }, function(data) {
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
  $j.getJSON(mybase+'/getstarblessdates', { teachid:starbc.teachid }, function(data) {
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
            $j.getJSON(mybase+'/savestarbless',{ jdays:jdlist, info:info , name:name, roomid:roomid, teachid:teachid , day:day, idd:cid }, 
            function(data) {
                $j.getJSON(mybase+'/starblessons', function(data) {
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
                txt = e.days[j] || '';
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

var teachul;

function teachAbsent() {
  $j.getJSON(mybase+ "/getabsent", function(data) {
    absent = data;
    var absteach = {}; // hash of teachers who have at least one abcence
    for (var jj in absent) {
      var aab = absent[jj];
      for (var jaa in aab) {
        if (teachers[jaa] ) {
          if (!absteach[jaa]) absteach[jaa] = 0;
          absteach[jaa]++;
        }
      }
    }
    var booklet = {};
    var teachlist = [];
    for (var ii in teachers) {
      var te = teachers[ii];
      var char1 = te.lastname.substr(0,1).toUpperCase();
      if (!booklet[char1]) {
        booklet[char1] = [];
      }
      booklet[char1].push(te);
    }
    var count = 0;
    var topp = 30;
    var sortedtabs = [];
    for (var ii in booklet) {
      sortedtabs.push(ii);
    }
    sortedtabs.sort();
    var chaplist = [];
    for (var kk in sortedtabs) {
      var ii = sortedtabs[kk];
      var chapter = booklet[ii];
      if (count > 10 || count + chapter.length > 16 ) {
        teachlist = teachlist.concat(chaplist.sort());
        chaplist = [];
        teachlist.push('</div>');
        count = 0;
      }
      if (count == 0 ) {
        teachlist.push('<div id="tab'+ii+'" class="tab char'+ii+'"  style="top:'+topp+'px;" >'+ii+'</div>' );
        teachlist.push('<div id="chap'+ii+'" class="chapter char'+ii+'" >');
        topp += 35;
      }
      for (var jj in chapter) {
        var te = chapter[jj];
        var teachname =  te.lastname.caps()  + ' ' + te.firstname.caps() ;
        var someabs = (absteach[te.id]) ? 'someabs' :  '';
        var abscount = (absteach[te.id]) ? absteach[te.id] :  '';
        chaplist.push('<div sort="'+te.lastname.toUpperCase()+'" class="tnames '+someabs+'" id="te'+te.id+'">' + teachname + ' &nbsp; ' + abscount + '</div>');
        count++;
      }
    }
    teachlist = teachlist.concat(chaplist.sort());
    teachlist.push('</div>');
    teachlist.push('</div">');
    teachul = '<div class="namebook">' + teachlist.join('') + '</div>';
    var s = '<div id="fraa" class="sized1 centered gradback">'
            + '<h1 id="oskrift">Lærer-fravær</h1>'
            + teachul
            + '<div id="workspace"></div>';
            + '</div>'
     $j("#main").html(s);
     $j(".chapter").hide();
     $j("#chapA").toggle();
     $j("#tabA").addClass("shadow");
     $j(".tab").click(function() {
           $j(".tab").removeClass("shadow");
           $j("#" + this.id).addClass("shadow");
           $j(".chapter").hide();
           var idd = this.id.substr(3);
           $j("#chap"+idd).toggle();
         });
     $j(".tnames").click(function () {
          edit_bortfall(+this.id.substr(2), "#workspace");
       });
  });
}

