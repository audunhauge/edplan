// generate a view for starb-reg

var $j = jQuery.noConflict();
var user = Url.decode(gup("navn"));

var romnavn = [ "0","001","A001","A002","A003","A004","A005","A006","A101","A102","A103","A104","A105","A106","B001","B002","BLACKBOX",
                 "DJERVHALLEN","G001","G002","G003","G004","M001","M002","M003","M004","M005","M006","M100","M101","M102","M103","M104",
                 "M105","M106","M107","M108","M109","M110","M111","M112","M113","M114","M115","M116","M117","M118","M119",
                 "MKONSERTSALEN","R001","R002","R003","R004","R005","R006","R008","R101","R102","R105","R106","R107","R108","R109",
                 "R110","R111","R112","R113","R115","R116","R117","R118","R119","R120","R121","R122","R123","R201","R202","R203","R204",
                 "R205","R206","R207","R208","R209","R210","R211","R212","R213","R214","R215","R216" ]; 
var rnavn2id ={ "0":140,"001":141,"A001":35,"A002":36,"A003":37,"A004":38,"A005":39,"A006":40,"A101":41,"A102":42,"A103":43,"A104":44,"A105":45,"A106":46,
                 "B001":47,"B002":48,"BLACKBOX":132,"DJERVHALLEN":49,"G001":50,"G002":51,"G003":52,"G004":53,"M001":54,"M002":55,"M003":56,"M004":57,"M005":58,
                 "M006":59,"M100":60,"M101":61,"M102":62,"M103":63,"M104":64,"M105":65,"M106":66,"M107":67,"M108":68,"M109":69,"M110":70,"M111":71,"M112":72,"M113":73,
                 "M114":74,"M115":75,"M116":76,"M117":77,"M118":78,"M119":79,"MKONSERTSALEN":127,"R001":81,"R002":82,"R003":83,"R004":84,"R005":85,"R006":86,"R008":87,
                 "R101":88,"R102":89,"R105":90,"R106":91,"R107":92,"R108":93,"R109":94,"R110":95,"R111":96,"R112":97,"R113":98,"R115":99,"R116":100,"R117":101,"R118":102,
                 "R119":103,"R120":104,"R121":105,"R122":106,"R123":107,"R201":108,"R202":109,"R203":110,"R204":111,"R205":112,"R206":113,"R207":114,"R208":115,"R209":116,
                 "R210":117,"R211":118,"R212":119,"R213":120,"R214":121,"R215":122,"R216":123 }; 
 //var $j = jQuery.noConflict();


var antall = 10; 
var d = new Date();
var starth = d.getHours();
var startm = d.getMinutes();
if (starth < 12) {
    starth = 12; startm = 10;
}
var start = "" + starth + ":" + startm;
var duration = 10;
var romid=0;
var rom = 'r210';
var uid = user;
var tot = 0; // antall elever registrert
var elevliste = []; // array over registrerte elever
$j("#msg").hide();
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

function getPassword() {
       $j("#info").html("Bruker : " +user);
       $j("#leader").html("Skriv inn passord");
       $j("#buttonlbl").html("Neste");
       $j("#inp").val('');
       $j("#inp").focus();
       $j("#next").unbind();
       $j("#next").click(function() {
          passwd = $j("#inp").val();
          if (passwd != '123') {
            badInput("Feil");
          } else {
            getAntall();
          }
       });
}

getPassword();

function getAntall() {
       $j("#info").html(user+" har starb på "+rom);
       $j("#leader").html("Skriv inn antall elever");
       $j("#buttonlbl").html("Neste");
       $j("#inp").val(antall);
       $j("#inp").focus();
       $j("#inp").autocomplete({ source:romnavn } );
       $j("#next").unbind();
       $j("#next").click(function() {
          antall = +( $j("#inp").val() );
          if (antall < 1 || antall > 30) {
            badInput("Antall mellom 1 og 30");
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
       $j("#info").html(""+antall+" elever på "+rom+" "+romid);
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
       $j.get("genkey.php", 
         { uid:uid, duration:duration, starth:starth, startm:startm, antall:antall, romid:romid },
         function(data){
           $j("#flipper1").show().click(function() {
                $j("#regbox").animate( { "width": "hide", "left":"+=100" },200,function() {
                  $j("#backside").css("left",100);
                  $j("#backside").delay(100).animate( { "width": "show", "left":"-=100" },200);
                  $j("#regbox").css("left",0);
                  $j("#flipper2").show();
                
                }  );
                $j.getJSON( "elevstarb.php",{ romid:romid }, 
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
           $j("#regkey").html(data);
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
                $j.get("fjernelev.php",{ romid:romid, eid:eid },
                function() {
                  $j.getJSON( "elevstarb.php",{ romid:romid }, 
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
                    $j.get("fjernelev.php",{ romid:romid, eid:0, alle:1 },
                    function() {
                      $j.getJSON( "elevstarb.php",{ romid:romid }, 
                           function(data) {
                              elevliste = data.elever;
                              makeOL(offset);
                           });
                    }
                    );
          });
      });    
}
