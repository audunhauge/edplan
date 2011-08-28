<?PHP  

    require_once('../../../../config.php');
    require_once($CFG->dirroot.'/course/format/skeisvang/timeplan.php');
    require_once($CFG->dirroot.'/course/format/skeisvang/vis_timeplan.php');


    $navn = optional_param('navn','');

    if ($navn != '') {
        $nameparts = explode('_',$navn);
        $ln = array_pop($nameparts);
        $fn = implode(' ',$nameparts);
        $sql = "select * from mdl_user where firstname='$fn' and lastname='$ln'";
        if ($users = get_records_sql($sql)) {
          $USER = array_pop($users);
        }
    }
    $isteach = isteacherinanycourse($USER->id);
    $uid = $USER->id;


print '<html>';
print '<head>
  <meta http-equiv="Content-Type" content="application/xhtml+xml; charset=utf-8" /> 
  <script src="js/jquery-1.4.2.min.js"></script>
  <script src="js/jquery-ui-1.8.5.custom.min.js"></script>
  <script src="js/jquery.quickflip.min.js"></script>
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
      color:#fff;
    }

    .prv, .nxt {
      right:40px;
      background-color:#5c5;
      border:1px solid #0f0;
      width:13px;
      height:13px;
      font-size:0.8em;
    }
    .prv {
      right:60px;
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

    .flip:hover {
      background-color:#333;
     }
    
    .iflip {
      font-style:italic;
      font-family:"Apple Chancery";
      position:relative;
      left:3px;
      top:-6px;
    }
    
    div.delete > div.iflip {
      left:1px;
      top:-4px;
    }

    #qflip {
      position:relative;
      width:200px;
      margin-right:auto;
      margin-left:auto;
    }

    #msg {
      position:absolute;
      top:98px;
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



    #target {
      /*background: -moz-linear-gradient(top,  #00adee,  #0078a5);*/
      background:-moz-linear-gradient(rgba(28, 91, 155, 0.8) 0%, rgba(108, 191, 255, .9) 60%);
    }

    .regbox {
      position:relative;
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
      /*background-image:-moz-linear-gradient(rgba(28, 91, 155, 0.8) 0%, rgba(108, 191, 255, .9) 90%);*/
      /*background: -moz-linear-gradient(top,  #00adee,  #0078a5);*/
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
       margin-top:30px;
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


    
  </style>
</head>';

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
                  AND userid = '.$USER->id;
        $romliste = array();
        if ($starbrom = get_records_sql($sql)) {
             foreach ($starbrom as $r) {
               $romliste[$r->day] = $r->name;
             }
        }
        $sql = 'SELECT r.id, r.name
                FROM '.$CFG->prefix.'bookings_item r
                WHERE r.type = "room"
                ORDER BY r.name';
   
        $romnavn = array();
        $rnavn2id = array();
        if ($roomlist = get_records_sql($sql)) {
            foreach ($roomlist as $room) {
               $romnavn[] = '"'.$room->name.'"';
               $rnavn2id[] = '"'.$room->name.'":'.$room->id;
            }
        }
        $romnavn = implode(',',$romnavn);
        $rnavn2id = implode(',',$rnavn2id);

        $navn = ($navn) ? $navn : "Du";


    print ' <body>
    <div id="qflip">
          <div id="regbox" class="regbox">
            <div id="msg"></div>
            <form name="mya" id="target" action="starb.php">
             <table>
               <tr>
                 <td><span id="regkey"></span><span id="info">'.$navn.' har starb på '.$romliste[$daynum].'</span></td>
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
            <div id="flipper1" class="flip"><div class="iflip">&gt;</div></div>
          </div>
          <div id="backside" class="regbox">
            <div id="liste">
               <div id="elever"></div>
               <div id="delete" class="delete"><div class="iflip">x</div></div>
            </div>
            <div id="nxt" class="flip nxt"><div class="iflip">&gt;</div></div>
            <div id="prv" class="flip prv"><div class="iflip">&lt;</div></div>
            <div id="flipper2" class="flip"><div class="iflip">&lt;</div></div>
          </div>
      </div>
      <script>
        var romnavn = [ '.$romnavn.' ]; 
        var rnavn2id = { '.$rnavn2id.' }; 
        var $j = jQuery.noConflict();
        $j("#qflip").quickFlip();
        var state = 1;  // waiting for antall elever
        var antall = 0; 
        var rom = "'.$romliste[$daynum].'";
        var start="12:10";
        var duration = 20;
        var romid=0;
        var starth = 12;
        var startm = 10;
        // som vars for displaying elever
        var firstid = 0; // offset into list
        var tot = 0; // antall elever registrert
        var elevliste = []; // array over registrerte elever
        $j("#msg").hide();
        $j("#flipper1").hide();
        $j("#inp").focus();
        $j("#next").click(function() {
              antall = +( $j("#inp").val() );
              if (antall < 1 || antall > 30) {
                $j("#regbox").animate({"left": "+=30px"}, 90);
                $j("#regbox").animate({"left": "-=50px"}, 90);
                $j("#regbox").animate({"left": "+=20px"}, 50);
                $j("#inp").val("");
                $j("#msg").fadeIn(500);
                $j("#msg").html("Antall mellom 1 og 30").fadeOut(1900);
                $j("#inp").focus();
              } else {
                getRom();
              }
          });

          /*
                        select: function( event, ui ) {
                            $j( "#inp" ).val( ui.item.label );
                            romid = ui.item.value;
                            romfasit = ui.item.label;
                            return false;
                            */
         
         function getRom() {
                $j("#info").html("Nøkkelen gjelder for "+antall+" elever");
                $j("#leader").html("Velg rom (autocomplete)");
                $j("#buttonlbl").html("Neste");
                $j("#inp").val(rom);
                $j("#inp").focus();
                $j("#inp").autocomplete({ source:romnavn } );
                $j("#next").unbind();
                $j("#next").click(function() {
                          rom = $j("#inp").val();
                          romid = rnavn2id[rom] || 0;
                          if (romid < 1 || romid > 300) {
                            $j("#regbox").animate({"left": "+=30px"}, 90);
                            $j("#regbox").animate({"left": "-=50px"}, 90);
                            $j("#regbox").animate({"left": "+=20px"}, 50);
                            $j("#inp").val("");
                            $j("#msg").fadeIn(500);
                            $j("#msg").html("Du må velge fra lista").fadeOut(1900);
                            $j("#info").html("Eks: Skriv 210, bruk piltast ned og trykk enter");
                            $j("#inp").focus();
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
                $j("#inp").val("12:10");
                $j("#next").unbind();
                $j("#next").click(function() {
                          start = $j("#inp").val();
                          var t = start.split(":");
                          starth = t[0];
                          startm = t[1];
                          if (starth < 12 || starth > 14 || startm < 0 || startm > 59) {
                            $j("#regbox").animate({"left": "+=30px"}, 90);
                            $j("#regbox").animate({"left": "-=50px"}, 90);
                            $j("#regbox").animate({"left": "+=20px"}, 50);
                            $j("#inp").val("");
                            $j("#msg").fadeIn(500);
                            $j("#msg").html("Tid mellom 12:00 og 14:00").fadeOut(1900);
                            $j("#inp").focus();
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
                $j("#inp").val("10");
                $j("#next").unbind();
                $j("#next").click(function() {
                          duration = +($j("#inp").val());
                          if (duration < 3 || duration > 80) {
                            $j("#regbox").animate({"left": "+=30px"}, 90);
                            $j("#regbox").animate({"left": "-=50px"}, 90);
                            $j("#regbox").animate({"left": "+=20px"}, 50);
                            $j("#inp").val("");
                            $j("#msg").fadeIn(500);
                            $j("#msg").html("mellom 3 og 80").fadeOut(1900);
                            $j("#inp").focus();
                          } else {
                            generateKey();
                          }
                  });
         }

         function generateKey() {
                $j("#info").html("Genererer nøkkel .. ");
                $j("#leader").remove();
                $j("#next").remove();
                $j("#msg").remove();
                $j("#input").remove();
                $j("#inp").remove();
                $j.get("genkey.php", 
                  { duration:duration, starth:starth, startm:startm, antall:antall, romid:romid },
                  function(data){
                    $j("#flipper1").show().click(function() {
                         $j("#qflip").quickFlipper();
                         $j.getJSON( "elevstarb.php",{ romid:romid }, 
                                function(data) {
                                   elevliste = data.elever;
                                   makeOL(0);
                                });

                    });
                    $j("#flipper2").click(function() {
                         $j("#qflip").quickFlipper();
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
               var x = $j(this).position();
               var y = $j(this).attr("title");
               var th = $j(this);
               $j("#delete").unbind().show().css("top",x.top).click(function() {
                         th.html("<td colspan=4>...SLETTER...</td>");
                         $j.get("fjernelev.php",{ romid:romid, eid:y },
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
           firstid = offset;
           var i;
           var s = [];
           tot = elevliste.length;
           if (tot < 13) {
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
                 +"<caption>"+tot+" elever</caption>"
                 +(s.join(""))+"</table>";
           $j("#elever").html(r); 
         }


      </script>
    </body>
    ';
} else if ($USER->firstname != "") {
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
                 <td><input id="reggy" type="text" name="sreg" value="" ></td>
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
    print ' <body>
    <div id="qflip">
      <div id="regbox" class="regbox">
      '.$starbdiv.'
      </div>
    </div>
    <script>
        var $j = jQuery.noConflict();
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
                $j("#regbox").animate({"left": "+=30px"}, 90);
                $j("#regbox").animate({"left": "-=50px"}, 90);
                $j("#regbox").animate({"left": "+=20px"}, 50);
                document.mya.sreg.value = "";
                ref.innerHTML = "Ugyldig key";
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
                var response = unescape(req.responseText);
                var ref = document.getElementById("wait");
                var good = false;
                if (response == "time") {
                   ref.innerHTML = "Tiden er ute";
                } else if (response == "early") {
                   ref.innerHTML = "For tidlig";
                } else if (response == "full") {
                   ref.innerHTML = "Ingen ledige plasser";
                } else if (response == "already") {
                   ref.innerHTML = "Allerede registrert";
                } else if (response == "ip") {
                   ref.innerHTML = "Bare fra skolen";
                } else if (response == "error") {
                   ref.innerHTML = "Ugyldig key";
                } else {
                   good = true;
                   regcount++;
                   ref = document.getElementById("starbreg");
                   ref.innerHTML = "Du er registrert";
                }
                if (!good) {
                   $j("#regbox").animate({"left": "+=30px"}, 90);
                   $j("#regbox").animate({"left": "-=50px"}, 90);
                   $j("#regbox").animate({"left": "+=20px"}, 50);
                   document.mya.sreg.value = "";
                }
                waiting = false;
            }
        }

        function meChanged(script) {
            if (!waiting) {
                waiting = true;
                var ref = document.getElementById("wait");
                ref.innerHTML = "waiting ... ";
                req.open("get", script);
                req.onreadystatechange = handleResponse;
                req.send(null);
            }
        }

        function meChanged(script) {
            if (!waiting) {
                waiting = true;
                var ref = document.getElementById("wait");
                ref.innerHTML = "waiting ... ";
                req.open("get", script);
                req.onreadystatechange = handleResponse;
                req.send(null);
            }
        }

        var req = sajax_init_object();
        var waiting = false;
        var regcount = '.$count.';
      </script>
    </body>
    ';
} else {
    print ' Du må <a href="/moodle/login/index.php">logge inn</a> for å kunne registrere deg.  ';
}    


