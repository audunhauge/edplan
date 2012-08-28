// generate a view for starb-reg

var $j   = jQuery.noConflict();
var user = Url.decode(gup("navn"));
var uuid        = $j("#uui").html();
var loggedin    = $j("#logged").html();
var jd          = $j("#julday").html();
var uname       = $j("#uname").html();
var firstname   = $j("#firstname").html().caps();
var lastname    = $j("#lastname").html().caps();

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
if (starth < 12) {
    starth = 12; startm = 10;
}

uuid = +uuid;
var start = "" + starth + ":" + startm;
var duration = 10;
var romid=0;
var rom = '';
var uid = user;
var tot = 0; // antall elever registrert
var elevliste = []; // array over registrerte elever
$j("#msg").hide();
$j("#inp").hide();
$j("#backside").hide();
$j("#flipper1").hide();
$j("#flipper2").hide();
$j("#nxt").hide();
$j("#prv").hide();
$j("#delete").hide();

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
        $j("#inp").show();
        $j("#pwd").hide();
        $j.get(mybase+ '/timetables', function(timetables) {
          var mytab = timetables.teach[uuid];
          var day = jd % 7;
          for (var ii in mytab) {
            var entry = mytab[ii];
            if (entry[0] == day && entry[2].substr(0,5) == 'STARB') {
              rom = entry[3];
              break;
            }
          }
          getAntall();
        });
     } else {
       $j("#info").html(firstname+" "+lastname);
       $j("#leader").html("Skriv inn passord");
       $j("#buttonlbl").html("Neste");
       //$j("#inp").val('');
       $j("#inp").hide();
       $j("#pwd").show();
       $j("#pwd").focus();
       $j("#next").unbind();
       $j("#next").click(function() {
          passwd = $j("#pwd").val();
          $j("#pwd").hide();
          $j("#inp").show();
          $j.get(mybase+ '/login',{"username":uname, "password":passwd }, function(uinfo) {
            if (uinfo && uinfo.id > 0) {
              uuid = uinfo.id;
              uname = uinfo.username;
              loggedin = '1';
              $j.get(mybase+ '/timetables', function(timetables) {
                var mytab = timetables.teach[uuid];
                var day = jd % 7;
                for (var ii in mytab) {
                  var entry = mytab[ii];
                  if (entry[0] == day && entry[2].substr(0,5) == 'STARB') {
                    rom = entry[3];
                    break;
                  }
                }
                getAntall();
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
} else {
  elevreg();
}


function userNotFound() {
       $j("#info").html("Finner ikke bruker");
       $j("#next").hide();
       $j("#leader").hide();
       $j("#inp").hide();
}

function getAntall() {
       var vuname = (firstname) ? firstname + " " + lastname : user;
       $j("#info").html(vuname+" har starb på "+rom);
       $j("#leader").html("Skriv inn antall elever");
       $j("#buttonlbl").html("Neste");
       //$j("#inp").attr("Type","text");
       $j("#inp").val(antall);
       $j("#inp").focus();
       $j("#next").unbind();
       $j("#next").click(function() {
          antall = +( $j("#inp").val() );
          if (antall < 1 || antall > 60) {
            badInput("Antall mellom 1 og 60");
          } else {
            getRom();
          }
       });
}
  
function getRom() {
       $j("#info").html("Nøkkelen gjelder for "+antall+" elever");
       $j("#leader").html("Velg rom (autocomplete)");
       $j("#buttonlbl").html("Neste");
       $j("#inp").val(rom);
       $j("#inp").focus();
       $j("#inp").autocomplete({ source:romnavn } );
       $j("#next").unbind();
       $j("#next").click(function() {
                 rom = $j("#inp").val().toUpperCase();
                 romid = rnavn2id[rom] || 0;
                 if (romid < 1 || romid > 300) {
                     badInput("Du må velge fra lista");
                     $j("#info").html("Eks: Skriv 210, bruk piltast ned og trykk enter");
                 } else {
                     getTid();
                 }
         });
}

function getTid() {
       $j("#inp").unbind();
       $j("#inp").focus();
       $j("#inp").keypress(function(event) {
           if (event.keyCode == "13") {
                event.preventDefault();
                $j("#next").click();
           }
       });
       $j("#info").html(""+antall+" elever på "+rom);
       $j("#leader").html("Start tid");
       $j("#buttonlbl").html("Neste");
       $j("#inp").val(start);
       $j("#next").unbind();
       $j("#next").click(function() {
                 start = $j("#inp").val();
                 var t = start.split(":");
                 starth = t[0];
                 startm = t[1];
                 if (starth < 12 || starth > 14 || startm < 0 || startm > 59) {
                     badInput("Tid mellom 12:00 og 14:00");
                 } else {
                     getDuration();
                 }
         });
}

function getDuration() {
       $j("#inp").focus();
       $j("#info").html(""+antall+" elever "+rom+" "+start);
       $j("#leader").html("Varighet (minutter)");
       $j("#buttonlbl").html("Neste");
       $j("#inp").val(duration);
       $j("#next").unbind();
       $j("#next").click(function() {
                 duration = +($j("#inp").val());
                 if (duration < 3 || duration > 80) {
                     badInput("mellom 3 og 80");
                 } else {
                     generateKey();
                 }
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
       $j("#info").html("Genererer nøkkel .. ");
       $j("#leader").remove();
       $j("#next").remove();
       $j("#msg").remove();
       $j("#input").remove();
       $j("#inp").remove();
       $j.getJSON(mybase+ '/starbkey',{ "uid":uid, "duration":duration, "starth":starth, "startm":startm, "antall":antall, "romid":romid }, function(data) {
           $j("#flipper1").show().click(function() {
                $j("#regbox").animate( { "width": "hide", "left":"+=100" },200,function() {
                  $j("#backside").css("left",100);
                  $j("#backside").delay(100).animate( { "width": "show", "left":"-=100" },200);
                  $j("#regbox").css("left",0);
                  $j("#flipper2").show();
                
                }  );
                $j.getJSON(mybase+ '/elevstarb',{ "romid":romid }, 
                       function(data) {
                          elevliste = data.elever;
                          makeOL(0);
                       });

           });
           $j("#flipper2").click(function() {
                $j("#backside").animate( { "width": "hide", "left":"+=100" },200,function() {
                  $j("#regbox").css("left",100);
                  $j("#regbox").delay(100).animate( { "width": "show", "left":"-=100" },200);
                  $j("#backside").css("left",0);
                }  );
           });
           $j("#info").html("<table class=\"left\"><tr><th>Rom</th><td>"+rom
                      +"</tr><tr><th>Antall</th><td>"+antall
                      +"</td></tr><tr><th>Start</th><td>"+start
                      +"</td></tr><tr><th>Varighet</th><td>"+duration
                      +"</td></tr></table>");
           $j("#leader").html("");
           $j("#regkey").html(data.key);
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
                $j.getJSON(mybase+"/fjernelev",{ romid:romid, eid:eid, alle:0 },
                function() {
                  $j.getJSON(mybase+ '/elevstarb',{ "romid":romid }, 
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
     + "<td><div class=\"fn\">"+ e.firstname+"</div>"
     + "<td><div class=\"klasse\">"+ e.klasse+"</div>"
     +"</td></tr>");
  }
  var r = "<table class=\"elevliste\">"
        +"<caption id=\"alle\" >"+tot+" elever</caption>"
            +(s.join(""))+"</table>";
      $j("#elever").html(r); 
      $j("#alle").click(function() {
          var pos = $j(this).position();
          var th = $j(this);
          $j("#delete").unbind().show().css("top",pos.top).click(function() {
                    th.html("<td colspan=4>...SLETTER...</td>");
                    $j.getJSON(mybase+"/fjernelev",{ romid:romid, eid:0, alle:1 },
                    function() {
                      $j.getJSON(mybase+ '/elevstarb',{ "romid":romid }, 
                           function(data) {
                              elevliste = data.elever;
                              makeOL(offset);
                           });
                    }
                    );
          });
      });    
}



function elevreg() {
   $j("#inp").show();
   $j("#pwd").hide();
   $j.getJSON(mybase+ '/regstud',{ "regkey":0, "userid":uuid }, 
   function(resp) {
     if (resp.fail) {
       $j("#info").html(firstname+" "+lastname);
       //$j("#info").html("Bruker : " +user);
       $j("#leader").html("Skriv inn STARB-KODE");
       $j("#buttonlbl").html("REGISTRER");
       $j("#inp").val('');
       $j("#inp").focus();
       $j("#next").unbind();
       $j("#inp").unbind();
       $j("#inp").keypress(function(event) {
         if (event.keyCode == "13") {
            event.preventDefault();
            adjust(uuid,jd);
         }
        });
       $j("#next").click(function() {
          adjust(uuid,jd);
        });
     } else {
       // user already registered
       $j("#info").html(resp.text);
       $j("#inp").hide();
       $j("#next").hide();
       $j("#leader").hide();
       $j("#msg").animate({"top": "+=90px"}, 90);
       $j("#msg").html(resp.info).fadeIn(200);
       $j("#msg").fadeOut(9300 );
       $j("#msg").animate({"top": "-=90px"}, 50);
     }
   });
}

function adjust(userid,julday) {
        $j("#next").hide();
        var regkey = +($j("#inp").val());
        var today = new Date();
        var tz = today.getTimezoneOffset();
        var ks = ""+regkey;
        var ts = 0;
        if (!badkeys[regkey] && ks.length > 1) {
            for (var i=0;i<ks.length-1;i++) {
                ts = (ts + parseInt(ks.substr(i,1))) % 10;
            }
            if (ts == parseInt(ks.substr(ks.length-1,1)) ) {
              $j("#info").html("Sjekker ... ");
              $j.getJSON(mybase+ '/regstud',{ "regkey":regkey, "userid":userid, "utz":tz }, 
                       function(resp) {
                         $j("#info").html(resp.text);
                         $j("#msg").animate({"top": "+=90px"}, 90);
                         $j("#msg").html(resp.info).fadeIn(200);
                         $j("#msg").fadeOut(9300 );
                         $j("#msg").animate({"top": "-=90px"}, 50);
                         $j("#next").show();
                         if (resp.fail) {
                           badkeys[regkey] = 1;
                           badInput(res.fail);
                         } else {
                           $j("#leader").remove();
                           $j("#next").remove();
                           $j("#input").remove();
                           $j("#inp").remove();
                         }
                       });

            } else {
              badInput("Ugyldig nøkkel");
              $j("#next").show();
              badkeys[regkey] = 1;
            }
        } else {
          badInput("Ugyldig nøkkel");
          $j("#next").show();
          badkeys[regkey] = 1;
        }
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

