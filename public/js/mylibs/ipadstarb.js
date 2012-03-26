// generate a view for starb-reg

var $j   = jQuery.noConflict();
var user = Url.decode(gup("navn"));
var uuid        = $j("#uui").html();
var loggedin    = $j("#logged").html();
var jd          = $j("#julday").html();
var day         = $j("#day").html();
var uname       = $j("#uname").html();
var firstname   = $j("#firstname").html().caps();
var lastname    = $j("#lastname").html().caps();

$j(".inf").hide();

var romnavn = [ "A001", "A002", "A003", "A104", "A106", "B001", "BLACKBOX", "G001", "G002", "G003", "G004", "M001", "M002",
                "M003", "M004", "M005", "M006", "M100", "M101", "M102", "M103", "M104", "M105", "M106", "M107", "M108", "M109","M110",
                "M111", "M112", "M113", "M114", "M115", "M116", "M117", "M118", "M119", "MKONSERTSALEN",
                "R001", "R002", "R003", "R004", "R005", "R006", "R008", "R102", "R105", "R106", "R107", "R110", "R112", "R113",
                "R117", "R201", "R202", "R203", "R204", "R205", "R206", "R207", "R208", "R209", "R210", "R211", "R212", "R213",
                "R214", "R215", "R216", "RAULA", "SAL 1", "SAL 2", "SAL 3" ];
var rnavn2id ={ "A001":"2", "A002":"3", "A003":"4", "A104":"5", "A106":"6", "B001":"7", "BLACKBOX":"8", "G001":"9", "G002":"10",
                "G003":"11", "G004":"12", "M001":"13", "M002":"14", "M003":"15", "M004":"16", "M005":"17", "M006":"18", "M100":"19",
                "M101":"20", "M102":"21", "M103":"22", "M104":"23", "M105":"24", "M106":"25", "M107":"26", "M108":"27", "M110":"28",
                "M111":"29", "M112":"30", "M113":"31", "M114":"32", "M115":"33", "M116":"34", "M117":"35", "M118":"36", "M119":"37",
                "R001":"39", "R002":"40", "R003":"41", "R004":"42", "R005":"43", "R006":"44", "R008":"45", "R102":"46", "R105":"47", "R106":"48",
                "R107":"49", "R110":"50", "R112":"51", "R113":"52", "R117":"53", "R201":"54", "R202":"55", "R203":"56", "R204":"57", "R205":"58",
                "R206":"59", "R207":"60", "R208":"61", "R209":"62", "R210":"63", "R211":"64", "R212":"65", "R213":"66", "R214":"67", "R215":"68",
                "R216":"69", "RAULA":"70", "SAL1":"71", "SAL2":"72", "SAL3":"73","M109":"81" };

var badkeys = {};
// list of bad keys - dont need to query server for these
// built up thru usage - spamming with key=123 will not
// talk to server more than once
//    asd



var antall = 10; 
var d = new Date();
var starth = d.getHours();
var startm = d.getMinutes();
startm = Math.round(Math.floor(startm/5)*5);
if (starth < 12) {
    starth = 12; startm = 10;
}
//TODO debug

uuid = +uuid;
var start = "" + starth + ":" + startm;
var duration = 10;
var romid=0;
var rom = '';
var uid = user;
var tot = 0; // antall elever registrert
var elevliste = []; // array over registrerte elever

$j("#inp").keypress(function(event) {
     if (event.keyCode == "13") {
          event.preventDefault();
          $j("#next").click();
     }
});
$j("#pwd").keypress(function(event) {
     if (event.keyCode == "13") {
          event.preventDefault();
          $j("#next").click();
     }
});

function getPassword() {
     if (loggedin == '1') {
        $j("#input").hide();
        $j.get( '/timetables', function(timetables) {
          var mytab = timetables.teach[uuid];
          for (var ii in mytab) {
            var entry = mytab[ii];
            if (entry[0] == day && entry[2].substr(0,5) == 'STARB') {
              rom = entry[3];
              break;
            }
          }
          baseState();
        });
     } else {
       $j("#info").html(firstname+" "+lastname);
       $j("#leader").html("Skriv inn passord");
       $j("#butxt").html("Neste");
       $j("#pwd").show();
       $j("#pwd").focus();
       $j("#next").unbind();
       $j("#next").click(function() {
          passwd = $j("#pwd").val();
          $j.get( '/login',{"username":uname, "password":passwd }, function(uinfo) {
            if (uinfo && uinfo.id > 0) {
              uuid = uinfo.id;
              uname = uinfo.username;
              loggedin = '1';
              $j.get( '/timetables', function(timetables) {
                var mytab = timetables.teach[uuid];
                for (var ii in mytab) {
                  var entry = mytab[ii];
                  if (entry[0] == day && entry[2].substr(0,5) == 'STARB') {
                    rom = entry[3];
                    break;
                  }
                }
                baseState();
              });
            } else {
              badInput("Feil");
              getPassword();
            }
          });
       });
     }
}

if (uuid == 0) {
  userNotFound();
} else if (+uuid > 10000) {
  getPassword();
} 


function userNotFound() {
       $j("#info").html("Finner ikke bruker");
       $j("#next").hide();
       $j("#leader").hide();
       $j("#inp").hide();
}

function baseState() {
       var vuname = (firstname) ? firstname + " " + lastname : user;
       var romvelg = '<select id="rr">';
        for (var i=0; i< romnavn.length; i++) {
          var rr = romnavn[i];
          var ss = (rr == rom) ? 'selected="selected"' : '';
          romvelg += '<option '+ss+'>'+rr+'</option>';
        }
       romvelg += '</option>';
       var antall = '<select id="ant">';
          for( var i=1; i<20; i++) {
               antall += '<option>'+i+'</option>';
          }
          antall += '<option selected="selected">20</option>'
          for( var i=21; i<66; i++) {
               antall += '<option>'+i+'</option>';
          }
          antall += '</select>';
       var start = '<select id="sta">';
       var mins = '00,05,10,15,20,25,30,35,40,45,50,55'.split(',');
       for (var i=2; i< mins.length; i++) {
         var mi = mins[i];
         var sel = (starth == 12 && mi == startm) ? ' selected="selected"' : '';
         start += '<option'+sel+'>12:'+mi+'</option>';
       }
       for (var i=0; i< 4; i++) {
         var mi = mins[i];
         var sel = (starth == 13 && mi == startm) ? ' selected="selected"' : '';
         start += '<option'+sel+'>13:'+mi+'</option>';
       }
       start += '</select>';
       var dur = '<select id="du">'
               + '<option>5</option>'
               + '<option>10</option>'
               + '<option>15</option>'
               + '<option selected="selected">20</option>'
               + '<option>25</option>'
               + '<option>30</option>'
               + '<option>35</option>'
               + '<option>40</option>'
               + '<option>45</option>'
               + '<option>50</option>'
               + '<option>55</option>'
               + '</select>';
       $j(".inf").show().css("opacity",1);
       $j("#input").hide();
       $j("#info").hide();
       $j("#butxt").html("Generer nøkkel");
       $j("#info").html(vuname+" "+rom);
       $j("#regkey").html('<i class="tiny">(ikke generert)</i>');
       $j("#rom").html(romvelg);
       $j("#antall").html(antall);
       $j("#start").html(start);
       $j("#varighet").html(dur);
       $j("#next").unbind();
       $j("#next").click(function() {
            generateKey();
       });
}
  



function badInput(message) {
    $j("#regbox").animate({"left": "+=30px"}, 90);
    $j("#regbox").animate({"left": "-=50px"}, 90);
    $j("#regbox").animate({"left": "+=20px"}, 50);
    $j("#inp").val("");
    $j("#msg").fadeIn(500);
    $j("#msg").html(message).fadeOut(1900);
    $j("#inp").focus();
}

function generateKey() {
       var  rom = $j("#rr").val().toUpperCase();
       var romid = rnavn2id[rom] || 0;
       var antall = $j("#ant").val();
       var start = $j("#sta").val();
       var elm = start.split(':');
       var starth = elm[0];
       var startm = elm[1];
       $j("#info").html("Genererer nøkkel .. ");
       $j("#leader").remove();
       $j("#next").remove();
       $j("#msg").remove();
       $j("#input").remove();
       $j("#inp").remove();
       $j("#qbox").after('<div id="elever"></div>');
       $j.getJSON( '/starbkey',{ "uid":uid, "duration":duration, "starth":starth, "startm":startm, "antall":antall, "romid":romid }, function(data) {
             $j.getJSON( '/elevstarb',{ "romid":romid }, 
                       function(data) {
                          elevliste = data.elever;
                          makeOL(0);
                       });

           $j(".inf").hide();
           $j("#regkey").html(data.key).show().addClass("finally");
           $j("#info").html("<table class=\"left\"><tr><th>Rom</th><td>"+rom
                      +"</tr><tr><th>Antall</th><td>"+antall
                      +"</td></tr><tr><th>Start</th><td>"+start
                      +"</td></tr><tr><th>Varighet</th><td>"+duration
                      +"</td></tr></table>").addClass("finally").show();
     });
}



function makeOL(offset) {
  offset = 10 * Math.floor(offset/10);
  $j("#nxt").unbind().hide();
  $j("#prv").unbind().hide();
  $j("#delete").unbind().hide();
  $j("#elever").undelegate().delegate("tr.einf","click",function() {
      var pos = $j(this).position();
      var eid = $j(this).attr("title");
      var th = $j(this);
      $j("#delete").unbind().show().css("top",pos.top).click(function() {
                th.html("<td colspan=4>...SLETTER...</td>");
                $j.getJSON("/fjernelev",{ romid:romid, eid:eid, alle:0 },
                function() {
                  $j.getJSON( '/elevstarb',{ "romid":romid }, 
                       function(data) {
                          elevliste = data.elever;
                          makeOL(offset);
                       });
                }
                );
      });
  } );
  var i;
  var s = [];
  tot = elevliste.length;
  if (tot < 11) {
     ant = tot;
     offset = 0;
  } else {
      ant = Math.min(tot,10+offset);
      if (ant < tot) {
         $j("#nxt").show().click(function() {
                  makeOL(ant); 
               });
      }
      if (offset > 0) {
        $j("#prv").show().click(function() {
                  makeOL(offset-10); 
               });
      }
  }
  for (i=offset;i<ant; i++) {
     e = elevliste[i];
     s.push("<tr title=\""+e.eid+"\"  class=\"einf\"><td>"+(i+1)+"</td><td><div class=\"ln\">"
     + e.lastname+"</div></td>"
     + "<td><div class=\"fn\">"+ e.firstname+"</div></td>"
     + "<td><div class=\"klasse\">"+ e.klasse+"</div></td>"
     +"</tr>");
  }
  var r = "<table class=\"elevliste\">"
        +"<caption id=\"alle\" >"+tot+" elever</caption>"
        +"<tr><th></th><th>Etternavn</th><th>Fornavn</th><th>Klasse</th></tr>"
            +(s.join(""))+"</table>";
      $j("#elever").html(r); 
      $j("#alle").click(function() {
          var pos = $j(this).position();
          var th = $j(this);
          $j("#delete").unbind().show().css("top",pos.top).click(function() {
                    th.html("<td colspan=4>...SLETTER...</td>");
                    $j.getJSON("/fjernelev",{ romid:romid, eid:0, alle:1 },
                    function() {
                      $j.getJSON( '/elevstarb',{ "romid":romid }, 
                           function(data) {
                              elevliste = data.elever;
                              makeOL(offset);
                           });
                    }
                    );
          });
      });    
}






function badInput(message) {
         $j("#next").hide();
         $j("#regbox").clearQueue().animate({"left": "+=30px"}, 90);
         $j("#regbox").animate({"left": "-=50px"}, 90);
         $j("#regbox").animate({"left": "+=20px"}, 50);
         $j("#inp").val("");
         $j("#msg").fadeIn(200);
         $j("#msg").html(message).fadeOut(1300,function() { $j("#next").show(); } );
         $j("#inp").focus();
    }

