// funksjoner for å registrere/vise starbkurs

var starbless = {}; // id => starb-lesson


function starbkurs(room,delta,makeres) {
  $j.getJSON('/starblessons', function(data) {
    var starbliste = [];
    for (var ii in data) {
      var sl = data[ii];
      starbless[+sl.id] = sl;
      starbliste.push('<li id="sl'+sl.id+'">' + sl.value + '</li>');
    }
    var starbul = '<ul class="starbless">' + starbliste.join('') + '</ul>';
    var s = '<div class="sized1 centered gradback">'
            + '<h1 id="oskrift">Starb-kurs</h1>'
            + starbul
            + '</div>';
     $j("#main").html(s);
     $j("ul.starbless li").click(function () {
          editstarbless(+this.id.substr(2));
       });
  });
}


function editstarbless(cid) {
    var starbc = starbless[cid] || { id:0, value:'', teachid:0, roomid:0, day:0 };
    var teach = (teachers && teachers[starbc.teachid] ) ? teachers[starbc.teachid] : '';
    var room = (database.roomnames && database.roomnames[starbc.roomid] ) ?  database.roomnames[starbc.roomid]  : '';
    var starbdag = { 0:"MAN", 2:"ONS", 3:"TOR" };
    var dagliste = "MAN,ONS,TOR".split(',');
    var dagnavn = starbdag[starbc.day] || '';
    var s = '<div class="sized1 centered gradback">'
            + '<h1 id="oskrift">Starb-kurs</h1>'
            + '<div id="makeres" class="sized25 textcenter centered" >'
            + '  Kursinfo:<br> <textarea id="restext">'+starbc.value+'</textarea>'
            + '  <div id="savestarb" class="button float gui" >Lagre</div>'
            + '  <br>teach <input id="teach" type="text" value="'+teach+'"/>'
            + '  <br>rom <input id="room" type="text" value="'+room+'">'
            + '  <br>dag <input id="day" type="text"  value="'+dagnavn+'"/>'
            + '</div><br>' 
            + '</div>';
     $j("#main").html(s);
     $j("#teach").autocomplete({ source:database.tnames } )
     $j("#room").autocomplete({ source:database.roomnamelist } )
     $j("#day").autocomplete({ source:dagliste } )
     $j("#savestarb").click(function() {
          var ok = 0;
          var tname = $j("#teach").val().toUpperCase();
          if (tname && database.teachuname &&  database.teachuname[tname] )  ok |= 1
          var rname = $j("#room").val().toUpperCase();
          if (rname && database.roomids &&  database.roomids[rname] ) ok |= 2;
          var dname = $j("#day").val().toUpperCase();
          if (dname &&  $j.inArray(dname,dagliste) >= 0 )  ok |= 4;
          if (ok != 7) {
            alert(ok);
            editstarbless(cid);
          } else {
            //msg = { 1:"Feil teach",
            alert("saving");
          }
     });
}
