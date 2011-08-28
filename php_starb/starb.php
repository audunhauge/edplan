<?PHP  

    require_once('../../../../config.php');
    require_once($CFG->dirroot.'/course/format/skeisvang/timeplan.php');
    require_once($CFG->dirroot.'/course/format/skeisvang/vis_timeplan.php');


    $navn = optional_param('navn','');
    print '<html><head><meta http-equiv="Content-Type" content="application/xhtml+xml; charset=utf-8" /> 
      <script src="js/jquery-1.4.2.min.js"></script>
      <script src="js/jquery-ui-1.8.5.custom.min.js"></script>
      <style>
        .ui-autocomplete { position: absolute; cursor: default; }
        /* workarounds */
        * html .ui-autocomplete { width:1px; } /* without this, the menu expands to 100% in IE6 */
        .ui-menu {
            list-style:none;
            padding: 2px;
            margin: 0;
            display:block;
            float: left;
            background:#e0e0e0;
        }
        .ui-menu .ui-menu {
            margin-top: -3px;
        }
        .ui-menu .ui-menu-item {
            margin:0;
            padding: 0;
            zoom: 1;
            float: left;
            clear: left;
            width: 100%;
        }
        .ui-menu .ui-menu-item a {
            text-decoration:none;
            display:block;
            padding:.2em .4em;
            line-height:1.5;
            zoom:1;
        }
        .ui-menu .ui-menu-item a.ui-state-hover,
        .ui-menu .ui-menu-item a.ui-state-active {
            font-weight: normal;
            margin: -1px;
            background:#f0f0b0;
        }

        body {
        }

        table.elevliste {
           font-size:0.6em;
           color:white;
           width:90%;
        }
        div.fn, div.ln {
           width:70px;
           height:1.1em;
           overflow:hidden;
           white-space:nowrap;
        }

        div.fn {
           width:56px;
        }
        div.klasse {
           width:16px;
        }

        .flip {
          position:absolute;
          width:15px;
          height:15px;
          bottom:10px;
          right:10px;
          -moz-border-radius:8px;
          -webkit-border-radius:8px;
          -opera-border-radius:8px;
          -khtml-border-radius:8px;
          border-radius:8px;
          border:1px solid #000;
          background-color:#55C;
          background:-moz-linear-gradient(left,blue,white);
          background-image:-webkit-gradient(linear, left center, right center, from(#00f), to(#fff))
        }
        
        .back {
          background:-moz-linear-gradient(right,blue,white);
          background-image:-webkit-gradient(linear, left center, right center, from(#fff), to(#00f))
        }

        .prv, .nxt {
          right:40px;
          border:1px solid #000;
          width:13px;
          height:13px;
          font-size:0.8em;
          background-image:-moz-radial-gradient(80% 50%,circle farthest-side,yellow,green 95%,rgba(255,255,255,0));
          background-image:-webkit-gradient(radial,80% 50%,3,80% 50%,13,from(yellow),color-stop(75%, green),to(rgba(255,255,255,0)));
        }
        .prv {
          right:60px;
          background-image:-moz-radial-gradient(20% 50%,circle farthest-side,yellow,green 95%,rgba(255,255,255,0));
          background-image:-webkit-gradient(radial,20% 50%,3,20% 50%,13,from(yellow),color-stop(75%, green),to(rgba(255,255,255,0)));
        }

        .delete {
          position:absolute;
          top:30px;
          width:8px;
          height:8px;
          right:3px;
          -moz-border-radius:5px;
          -webkit-border-radius:5px;
          -opera-border-radius:5px;
          -khtml-border-radius:5px;
          border-radius:5px;
          border:1px solid #E00;
          background-color:#F55;
          color:#fff;
          font-size:0.7em;
        }

        .withmargin {
          margin-left:30px;
        }

        #prv:hover, #nxt:hover, #flipper2:hover, #flipper1:hover {
          background:-moz-linear-gradient(top,white,blue);
          background-image:-webkit-gradient(linear, left top, left bottom, from(#fff), to(#00f))
         }
        
        .iflip {
          position:relative;
          left:3px;
          top:-6px;
        }
        
        div.delete > div.iflip {
          left:1px;
          top:-4px;
        }


        #qbox {
          position:relative;
          width:200px;
          margin-right:auto;
          margin-left:auto;
        }

        #msg {
          position:absolute;
          top:38px;
          left:35px;
          width:200px;
          height:50px;
          color:red;
        }
        #regkey {
          color:white;
          font-size:2.2em;
        }

        #liste {
          position:relative;
          padding:5px;
          padding-top:0px;
          margin-top:0px;
          color:white;
          height:180px;
        }

        #elever {
        }


        .regbox {
          position:absolute;
          top:0;
          left:0;
          width:200px;
          height:200px;
          padding:1em;
          -moz-border-radius:8px;
          -webkit-border-radius:8px;
          -opera-border-radius:8px;
          -khtml-border-radius:8px;
          border-radius:8px;
          border:1px solid #000;
          background-color:#000;
          background-image:-webkit-gradient(linear, 0% 1%, 0% 95%, from(rgba(28, 91, 155, 0.8)), to(rgba(108, 191, 255, .9)),
          color-stop(.8,rgba(64,64,64,0.25)),color-stop(.25,rgba(32,32,32,0.5)));
          background:-moz-linear-gradient(rgba(28, 91, 155, 0.8) 0%, rgba(108, 191, 255, .9) 90%);
        }



        #starbreg, #wait {
          color:white;
        }
        input {
          background:white;
        }
        table.left th {
          text-align:left;
        }

        table {
           color:eee;
           margin-top:10px;
        }
        td {
           text-align:left;
        }
        .aqua{
            background-color: rgba(60, 132, 148, 0.8);
            background-image: -webkit-gradient(linear, 0% 0%, 0% 90%, from(rgba(28, 91, 155, 0.8)), to(rgba(108, 191, 255, .9)));
            background-image: -moz-linear-gradient(rgba(28, 91, 155, 0.8) 0%, rgba(108, 191, 255, .9) 90%);
            border-top-color: #8ba2c1;
            border-right-color: #5890bf;
            border-bottom-color: #4f93ca;
            border-left-color: #768fa5; 
            -webkit-box-shadow: rgba(66, 140, 240, 0.5) 0px 10px 16px;
            -moz-box-shadow: rgba(66, 140, 240, 0.5) 0px 10px 16px; /* FF 3.5+ */
        }
       .button{
            width: 90px;
            height: 14px;
            padding: 5px 16px 3px;
            -webkit-border-radius: 16px;
            -moz-border-radius: 16px;
            border-radius: 16px;
            border: 2px solid #ccc;
            margin-left:auto;
            margin-right:auto;
            margin-top:20px;
            position: relative;
            
            /* Label */
            font-family: Lucida Sans, Helvetica, Verdana, sans-serif;
            font-weight: 600;
            color: #fff;
            text-shadow: rgba(10, 10, 10, 0.5) 1px 2px 2px;
            text-align: center;
            vertical-align: middle;
            white-space: nowrap;
            text-overflow: ellipsis; 
            overflow: hidden;
        }
        
        .button:hover {
            text-shadow: rgb(255, 255, 255) 0px 0px 5px;
        }

        .button .glare {
            position: absolute;
            top: 0;
            left: 5px;
            -webkit-border-radius: 8px;
            -moz-border-radius: 8px;
            border-radius: 8px;
            height: 1px;
            width: 112px;
            padding: 8px 0;
            background-color: rgba(255, 255, 255, 0.25);
            background-image: -webkit-gradient(linear, 0% 0%, 0% 95%, from(rgba(255, 255, 255, 0.7)), to(rgba(255, 255, 255, 0)));
            background-image: -moz-linear-gradient(rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 95%);
        }

          div.msoyle {
            width:4px;
            height:15px;
            position:absolute;
            border:solid gray 1px ;
            background-color:red;
          }
          div.soyle {
            width:4px;
            height:15px;
            color:blue;
            position:absolute;
            border:solid green 1px ;
            background-color:green;
          }
          div.graf {
            padding-top:2px;
            height:20px;
            position:relative;
            width:60%;
            margin-right:auto;
            margin-left:auto;
          }


        
      </style></head>';

    if ($navn != '') {
        $navn = str_replace(array('æ','ø','å','Æ','Ø','Å'),array('e','o','a','E','O','A'),$navn);
        $nameparts = explode(' ',$navn);
        $ln = array_pop($nameparts);
        $fn = implode(' ',$nameparts);
        $sql = "select * from mdl_user where firstname='$fn' and lastname='$ln'";
        $users = get_records_sql($sql);
        if ($users and count($users) == 1) {
          $U = array_shift($users);
          $navn = "$fn $ln";
        } else {
          $U = $USER;
        }
    }
    $isteach = ($U->department == 'Undervisning');
    $uid = $U->id;

    if ($isteach) {
      list($ty,$tm,$td,$hr,$min) = explode("/",strftime("%Y/%m/%d/%H/%M",time() ));
      $tjday = gregoriantojd($tm,$td,$ty);
      $jday = $tjday;
      $daynum = $tjday % 7;
      $hr .= '.'.$min;
      $jday = 7 * (int)($jday/7);

      $sql = 'select distinct c.day,c.itemid,i.name from mdl_bookings_calendar c
              INNER JOIN mdl_bookings_item i ON (i.id = c.itemid)
              WHERE eventtype = "timetable" 
                AND value = "starb"
                AND userid = '.$U->id;
      $romliste = array();
      if ($starbrom = get_records_sql($sql)) {
           foreach ($starbrom as $r) {
             $romliste[$r->day] = $r->name;
           }
      }

      $rom = $romliste[$daynum];
      $navn = ($navn) ? $navn : "Du";

      print '<body>
           <div id="qbox">
              <div id="regbox" class="regbox">
                <div id="msg"></div>
                <form name="mya" id="target" action="starb.php">
                 <table>
                   <tr>
                     <td><span id="regkey"></span><span id="info">'.$navn.' har starb på '.$rom.'</span></td>
                   </tr>
                   <tr>
                     <td><span id="leader">Skriv inn antall elever</span></td>
                   </tr>
                   <tr>
                     <td><span id="input"><input id="inp" type="text" name="inp" value="" ></span></td>
                   </tr>
                   <tr>
                     <td>
                        <div id="next" class="button aqua">   
                            <div class="glare"></div>
                            <span id="buttonlbl">Neste</span>
                        </div>
                   </tr>
                 </table>
                </form>
                <div id="flipper1" class="flip"><div class="iflip"></div></div>
              </div>


              <div id="backside" class="regbox">
                <div id="liste">
                   <div id="elever"></div>
                   <div id="delete" class="delete"><div class="iflip">x</div></div>
                </div>
                <div id="nxt" class="flip nxt"><div class="iflip"></div></div>
                <div id="prv" class="flip prv"><div class="iflip"></div></div>
                <div id="flipper2" class="flip back"><div class="iflip"></div></div>
              </div>
           </div>

          <script>
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
            var $j = jQuery.noConflict();


            var antall = 0; 
            var d = new Date();
            var starth = d.getHours();
            var startm = d.getMinutes();
            if (starth < 12) {
                starth = 12; startm = 10;
            }
            var start = "" + starth + ":" + startm;
            var duration = 10;
            var romid=0;
            var rom = "'.$rom.'";
            var uid = '.$uid.';
            var tot = 0; // antall elever registrert
            var elevliste = []; // array over registrerte elever
            $j("#msg").hide();
            $j("#backside").hide();
            $j("#flipper1").hide();
            $j("#flipper2").hide();
            $j("#nxt").hide();
            $j("#prv").hide();
            $j("#delete").hide();
            $j("#inp").focus();
            $j("#next").click(function() {
                  antall = +( $j("#inp").val() );
                  if (antall < 1 || antall > 30) {
                    badInput("Antall mellom 1 og 30");
                  } else {
                    getRom();
                  }
              });

             
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


          </script></body></html>';

    } else if ($U->firstname != "") {
        // dette er en elev
        $starbdiv = '<div id="starbreg">';
        list($y,$m,$d) = explode("/",strftime("%Y/%m/%d",time() ));
        $tday = gregoriantojd($m,$d,$y);
        $jday = 7 * (int)($tday/7);
        $rday = $tday - $jday;
        $show = true;
        $count = 0;
        if ($rday == 0 or $rday == 2 or $rday == 3 ) {
            $sql = "select * from mdl_bookings_calendar where value='{$uid}' and eventtype='attendance' 
                    and ((julday=$jday and day=$rday) or (julday = ".($jday+$rday).")) ";
            $count = 0;
            if ($res = get_records_sql($sql)) {
              $count = 1;
              if (count($res) > 0) {
                 $show = false;
              }
            }
        }
        list($y,$m,$d) = explode("/",strftime("%Y/%m/%d",time() ));
        $jday = gregoriantojd($m,$d,$y);
        $wjday = 7 + 7 * (int)(($jday-2454333)/7);
        $dager = array();
        $active = array();
        $hotspot = array(0,2,3);
        $sql = 'select distinct c.julday as iid, c.julday 
                  from            mdl_bookings_calendar c
                  where           eventtype="attendance" 
                  and julday > '.($jday-24).'
                  order by        julday';
        if ($res = get_records_sql($sql) ) {
              foreach($res as $starb) {
                  if (!isset($active[$starb->julday - 2454333]))
                  $active[$starb->julday - 2454333] = week($starb->julday);
              }
        }
        $sql = 'select        distinct concat(c.userid,c.julday,c.day,c.slot) as iid, 
                                c.userid,c.julday,c.slot,c.day,c.class,c.name,c.value,u.username as teach
                  from          mdl_bookings_calendar c
                  inner join    mdl_user u
                        on      (u.id = c.userid)    
                  where         eventtype="attendance" 
                                and julday > '.($jday-24).'
                                and value='.$uid.' 
                  order by      julday';
        if ($show) {
          $starbdiv .= '<span id="wait"></span>
                <form name="mya" >
                 <table>
                   <tr>
                     <td> Skriv inn Starbkode</td>
                   </tr>
                   <tr>
                     <td><input id="inp" type="text" name="sreg" value="" ></td>
                   </tr>
                   <tr>
                     <td>
                        <div id="next" class="button aqua">   
                            <div class="glare"></div>
                            Registrer 
                        </div>
                   </tr>
                 </table>
                </form>';
        } else {
            $starbdiv .= '<p><p><p><center>Du er registrert</center><p>';
        }
        $starbdiv .= '<div class="graf">';
        if ($res = get_records_sql($sql) ) {
            foreach($res as $starb) {
              $jd = 7*(int)($starb->julday / 7) + $starb->day;
              $uke = week($starb->julday);
              $dager[$jd - 2454333] =  'uke '.$uke.' ' .$starb->name . ':'.$starb->teach;
            }
        }
        //print "<pre>";print_r($dager); print "</pre>";
        $left = 0;
        for ( $i=max(0,$wjday-24); $i<$wjday; $i++) {
            if ( in_array(($i%7),$hotspot) ) {
                if (isset($dager[$i])) {
                  $starbdiv .= '<div class="soyle" 
                         title="'.$dager[$i].'"
                         style="left:'.$left.'px; "></div>';
                            
                } else {
                  if (isset($active[$i])) {
                     $starbdiv .= '<div class="msoyle" title="'.$active[$i].'" style="left:'.$left.'px; "></div>';
                  } else {
                     $starbdiv .= '<div class="soyle" style="border:solid gray 1px;background-color:white;left:'.$left.'px; "></div>';
                  }
                }                    
                $left += 7;
            } else {
                $left += 2;
            }
            
        }
        $starbdiv .= '</div></div>';
        print '<body>
        <div id="qflip">
          <div id="regbox" class="regbox withmargin ">
                <div id="msg"></div>
          '.$starbdiv.'
          </div>
        </div>
        <script>
            var $j = jQuery.noConflict();
            $j("#msg").hide();
            $j("#inp").keypress(function(event) {
              if (event.keyCode == "13") {
                    adjust('.$uid.','.$jday.');
                    event.preventDefault();
                }
              });
            $j("#next").click(function() {
              adjust('.$uid.','.$jday.');
              });
            function adjust(userid,julday) {
                var regkey = parseInt(document.mya.sreg.value);
                var ref = document.getElementById("wait");
                var ks = ""+regkey;
                var ts = 0;
                var fail = true;
                if (ks.length > 1) {
                    for (var i=0;i<ks.length-1;i++) {
                        ts = (ts + parseInt(ks.substr(i,1))) % 10;
                    }
                    //alert(ts+" "+parseInt(ks.substr(ks.length-1,1)));
                    if (ts == parseInt(ks.substr(ks.length-1,1)) ) {
                      var adjustparam = "regkey=" + regkey + "&userid=" + userid + "&julday=" + julday;
                      meChanged("/moodle/my/AJAXrkey.php?"+adjustparam);
                      fail = false;
                    }
                } 
                if (fail) {
                    badInput("Ugyldig key");
                    /*
                    $j("#regbox").animate({"left": "+=30px"}, 90);
                    $j("#regbox").animate({"left": "-=50px"}, 90);
                    $j("#regbox").animate({"left": "+=20px"}, 50);
                    document.mya.sreg.value = "";
                    ref.innerHTML = "Ugyldig key";
                    */
                }
            }

            function sajax_init_object() {
                var A;
                try {
                    A=new ActiveXObject("Msxml2.XMLHTTP");
                } catch (e) {
                    try {
                        A=new ActiveXObject("Microsoft.XMLHTTP");
                    } catch (err) {
                        A=null;
                    }
                }
                if(!A && typeof XMLHttpRequest != "undefined")
                    try {
                      A = new XMLHttpRequest();
                    } catch (err) {
                        A=null;
                    }    
                return A;
            }

            function handleResponse() {
                if(req.readyState == 4){
                    $j("#msg").hide();
                    var response = unescape(req.responseText);
                    var ref = document.getElementById("wait");
                    var good = false;
                    var message = "Feil";
                    if (response == "time") {
                       message = "Tiden er ute";
                    } else if (response == "early") {
                       message = "For tidlig";
                    } else if (response == "full") {
                       message = "Ingen ledige plasser";
                    } else if (response == "already") {
                       message = "Allerede registrert";
                    } else if (response == "ip") {
                       message = "Bare fra skolen";
                    } else if (response == "error") {
                       message = "Ugyldig key";
                    } else {
                       good = true;
                       regcount++;
                       ref = document.getElementById("starbreg");
                       ref.innerHTML = "Du er registrert";
                    }
                    if (!good) {
                       badInput(message);
                       /*
                       $j("#regbox").animate({"left": "+=30px"}, 90);
                       $j("#regbox").animate({"left": "-=50px"}, 90);
                       $j("#regbox").animate({"left": "+=20px"}, 50);
                       document.mya.sreg.value = "";
                       */
                    }
                    waiting = false;
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

            function meChanged(script) {
                if (!waiting) {
                    waiting = true;
                    $j("#msg").html("waiting..").fadeIn(500);
                    req.open("get", script);
                    req.onreadystatechange = handleResponse;
                    req.send(null);
                }
            }

            function meChanged(script) {
                if (!waiting) {
                    waiting = true;
                    waiting = true;
                    $j("#msg").html("waiting..").fadeIn(500);
                    req.open("get", script);
                    req.onreadystatechange = handleResponse;
                    req.send(null);
                }
            }

            var req = sajax_init_object();
            var waiting = false;
            var regcount = '.$count.';
          </script>
        </body></html>
        ';
    } else {
        print "<body>Du ($fn $ln) må  <a href=\"/moodle/login/index.php\">logge inn</a> for å kunne registrere deg.</body></html>  ";
    }    


