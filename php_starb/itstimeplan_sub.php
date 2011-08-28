<?PHP  


function vis_timeplan($uuid = 0,$frills=true) {
    global $CFG,$USER;

    $navn = optional_param('navn','');
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

    $username = $U->username;
    $UID = $U->id;
    $firstname = $U->firstname;
    $lastname = $U->lastname;
    $prover = mineprover($U->id);
    $fridager = Fridager();

    if ($jday == 0) {
        list($y,$m,$d) = explode("/",strftime("%Y/%m/%d",time() ));
        $jday = gregoriantojd($m,$d,$y);
    }
    $jday = 7 * (int)($jday/7);
    $tardate = jdtogregorian($jday+7);
    list($m,$d,$y) = explode('/',$tardate);
    $tardate = make_timestamp($y, $m, $d, 12, 0);



    //$isteach = isteacherinanycourse($USER->id);
    $html = '';
    $coursecount = array();
    $starb = array();
    if ($isteach) { 


        $sql = "SELECT id,day,slot,name from {$CFG->prefix}bookings_calendar 
                WHERE eventtype='reservation' AND julday >= $jday AND  julday < $jday+7
                AND userid = $UID";
        if ($res = get_records_sql($sql)) {
            foreach ($res as $r) {
                $bookings[$r->day][$r->slot] = $r->name;
            }
        }

        $sql = "SELECT concat(t.id,t.day,t.slot), t.id, t.name, upper(t.value) as value, car.name as rrname, 
                t.courseid, t.day, t.slot, t.start, r.name as rname, r.id as roomid
            FROM {$CFG->prefix}bookings_calendar t 
            LEFT OUTER JOIN {$CFG->prefix}bookings_item r ON r.id = t.itemid
            LEFT OUTER JOIN {$CFG->prefix}bookings_calendar car 
               ON (car.userid = t.userid 
                   AND car.eventtype='reservation'
                   AND car.julday >= $jday
                   AND car.julday < $jday +7
                   AND car.day  = t.day
                   AND car.slot = t.slot
                   )
            WHERE t.userid=$UID 
                AND t.eventtype = 'timetable'
            ORDER BY t.day,t.slot,t.start";
    } else {
        $sql = "select ca.*, u.firstname,u.lastname from mdl_bookings_calendar ca 
                inner join mdl_user u on (u.id = ca.userid)
                where value='{$UID}' and eventtype='attendance' 
                and ((julday>=$jday and julday <$jday+7) ) ";
        if ($res = get_records_sql($sql)) {
          foreach ($res as $star) {
             //$starb[$star->julday + $star->day] = substr($star->lastname,0,2) . substr($star->firstname,0,2) . " " . $star->name;
             $starb[$star->julday] = substr($star->lastname,0,4) . substr($star->firstname,0,4) . " " . $star->name;
          }
        }
        $sql = "SELECT CONCAT(t.id,t.day,t.slot), t.id, t.name, car.name as rrname, 
                       upper(t.value) as value, t.courseid, t.day, t.slot, t.start, r.name AS rname, r.id as roomid
                FROM {$CFG->prefix}role_assignments ra 
                     INNER JOIN {$CFG->prefix}context x ON x.id=ra.contextid 
                     INNER JOIN {$CFG->prefix}course c ON x.instanceid=c.id 
                     INNER JOIN {$CFG->prefix}bookings_calendar t ON t.courseid=c.id 
                     LEFT OUTER JOIN {$CFG->prefix}bookings_item r ON r.id = t.itemid
                     LEFT OUTER JOIN {$CFG->prefix}bookings_calendar car 
                        ON (car.userid = t.userid 
                            AND car.eventtype='reservation'
                            AND car.julday >= $jday 
                            AND car.julday < $jday +7
                            AND car.day  = t.day
                            AND car.slot = t.slot
                            )
                WHERE ra.userid=$UID
                    AND t.eventtype = 'timetable'
                ORDER BY t.day,t.slot,t.start desc";
    }

    $tp = array();
    $hd = array();
    if ($tplan = get_records_sql($sql)) {
        foreach ($tplan as $tpelm) {
            $class = "normal";
            $tpval = strtolower($tpelm->value);
            $cell = $tpelm->value . ' &nbsp;' . $tpelm->rname . ' ' . @$tpelm->username;
            $dag = $tpelm->day;
            $t = $tpelm->slot+1;
            if (isset($starb[$jday+$dag])) {
                $tp[$dag][6]->cell = $starb[$jday+$dag];
                $tp[$dag][6]->class = 'extra';
            }
            if (isset($prover[$jday+$dag])) {
                  $timer = explode(",",$prover[$jday+$dag]->value);
                  if (in_array($t,$timer)) {
                     $class = "prove";
                  } else if (strtolower($prover[$jday+$dag]->value) == 'heldag' ) {
                    $hd[$jday+$dag] = $prover[$jday+$dag]->name;
                  }
            }
            if ($tpelm->courseid > 0 ) { 
                $navlink = ((substr($tpval,0,2) == 'tp' OR substr($tpval,0,4) == 'star'
                            OR substr($tpval,0,4) == 'komo') AND $isteach) 
                    ? ('&rday='.$dag.'&jday='.$jday.'&komboroom='.$tpelm->roomid.'&tp='.$tpelm->value )
                    : '';
                $newvalue = $cell;
                if ($uuid != 0) {
                   $newvalue = $cell;
                }
                if (@$tp[$tpelm->day][$tpelm->slot]->cell == $newvalue) continue;
                if (@$tp[$tpelm->day][$tpelm->slot]->idd == $tpelm->courseid) continue;
                // skip duplicate values
                $tp[$tpelm->day][$tpelm->slot]->idd = $tpelm->courseid;
                $tp[$tpelm->day][$tpelm->slot]->rom = $tpelm->rname;
                $break = (isset($tp[$tpelm->day][$tpelm->slot]->cell)) ? '<br>' : '';
                $tp[$tpelm->day][$tpelm->slot]->cell .= $break . $newvalue;
                $tp[$tpelm->day][$tpelm->slot]->class = $class;
                $tp[$tpelm->day][$tpelm->slot]->time = 'yes';
            } else if (!isset($tp[$tpelm->day][$tpelm->slot]->time)) {
                // info not connected to a course, only show if space is empty    
                $link = (substr($tpval,0,2) == 'tp' OR substr($tpval,0,4) == 'star' AND $isteach) 
                    ? ('http://www.skeisvang-moodle.net/moodle/mod/bookings/view.php?id=80&rday='
                        .$dag.'&jday='.$jday.'&komboroom='.$tpelm->roomid.'&tp='.$tpelm->value )
                    : '';
                $tp[$tpelm->day][$tpelm->slot]->cell = $cell;
                $tp[$tpelm->day][$tpelm->slot]->class = 'extra';
            }
            if (isset($tpelm->rrname)) {
                $tp[$tpelm->day][$tpelm->slot]->cell .= '<span title="rombytte" class="roomchange">&nbsp;&gt;&nbsp;' 
                        . $tpelm->rrname. '</span>';
            }
        }
    }

    
    /// calculate current day, week and section number
    $uke = week($jday);
    //$section_now = (int)(($jday - 2455054)/7);
    $section_now = (int)(($jday - 2455418)/7);
    $date = jdtogregorian($jday);
    list($m,$d,$y) = explode('/',$date);
    $date = jdtogregorian($jday+4);
    list($m1,$d1,$y) = explode('/',$date);
    $sta = mktime  (6,0,0,$m ,$d , $y);
    $sto = $sta + 604800;  // + week of seconds

    /// fetch out stuff from global yearplan
    $events = array();
    $aarsplan = get_record("course", "shortname", 'aarsplan');
    $sql = 'SELECT id,value,julday
            FROM '.$CFG->prefix.'bookings_calendar 
            WHERE courseid = '.$aarsplan->id.'
            AND eventtype = \'aarsplan\'
            AND julday >= '.$jday.'
            AND julday < '.($jday+7).'
            ORDER BY julday';
    if ($eventlist = get_records_sql($sql)) {
       foreach ($eventlist as $event) {
          $events[$event->julday] = $event;
       }
    }
    //print '<pre>';
    //print_r($events);
    //print '</pre>';

    /// ukeplan som egen tabell
    $ukeplan = array();
    foreach ($events as $ev) {
        $tek = $ev->value;
        $ukeplan[($ev->julday % 7)] = $tek;
        /*
        if (strlen($tek) > 20) {
            $ukeplan[($ev->julday % 7)] = '<span title="'.$tek.'">' .substr($tek,0,20).'...</span>';
        } else {
            $ukeplan[($ev->julday % 7)] = $tek;
        }
        */
    }

    $komment = '';
    if (isset($events[$jday+5])) {
        $komment = $events[$jday+5]->value ; 
    }


  // $tp[$dag][$time] = "$rom $kortnavn $fagnavn";

  ///unset($prover);
  $kortnavn = substr($username,0,4);
  $loginlink = '';
  if ($firstname == '' or $lastname == '') {
      $loginlink = "<a href='/moodle/login/index.php'>Logg inn</a> og få mer info";
  }

  /// add in events from google ical
  if (isteacherinanycourse($USER->id) and strstr($USER->url,'ics') ) {
      require_once($CFG->dirroot.'/lib/ical/ical.php');
      //$ical = new SG_iCalReader("http://www.google.com/calendar/ical/audun.hauge%40gmail.com/public/basic.ics");
      try {
          $ical = new SG_iCalReader($USER->url);
          foreach( $ical->getEvents() As $event ) {
             // Do stuff with the event $event
             $start = $event->getStart();
             if ($start > $sto) continue;
             $stop = $event->getEnd();
             if ($stop < $sta) continue;
             $summ = $event->getSummary();
             $desc = $event->getDescription();
             $ar = strftime("%Y,%m,%d,%H,%M",$start);
             $br = strftime("%Y,%m,%d,%H,%M",$stop);
             list($yar,$mar,$dar,$ha,$ma) = explode(',',$ar);
             list($ybr,$mbr,$dbr,$hb,$mb) = explode(',',$br);
             $jar = gregoriantojd($mar,$dar,$yar); 
             $jbr = gregoriantojd($mbr,$dbr,$ybr); 
             $slot = slotFromHM($ha,$ma,$start_tider );
             $day = $jar-$jday;
             @$break = (isset($tp[$day][$slot]->cell)) ? '<br>' : '';
             @$tp[$day][$slot]->cell .= $break . '<span class="ical">'.$summ.'</span>';
          }
      } catch (Exception $e) {
            echo 'Caught exception: ',  $e->getMessage(), "\n";
      }
  }
    

  $date = sprintf("<font size=-3>%02d.%02d-%02d.%02d</font>",$d,$m,$d1,$m1);
  $html .= '<center>Uke '.$uke;
  $html .= "<STYLE TYPE=\"text/css\">
             table.small { 
                font-size:0.8em; 
                }
             table.bluish th {
                color:#a0a0ff;
               }
             table.bluish td {
                color:#50A050;
               }
             table.bluish td.merknad {
                color:#70C020;
                font-size:1.1em;
               }
             .avlyst { 
                font-size:0.9em; 
                color:gray; 
                font-style:italic;
                }
             .llink { cursor:pointer; }
             .timeplan { width:90%; }
             .fagplan { width:90%; }
              tr .pause { height:0.5em; font-size:0.3em; padding:0; margin:0; background-color:#a0ffa0; }
             .normal { font-size:0.7em; background-color:#ffffc0;}
             .extra { font-size:0.6em; background-color:#e0e0e0;}
             .prove { font-size:0.7em; background-color:red; }
             .heldag { font-size:1.2em; background-color:red; 
                    text-align:center; }
             .timerute { font-size:0.90em; white-space: nowrap;}
             .teeny { 
                    font-size:0.80em; 
                    white-space: nowrap;
                    text-align:right;
                    color:#000000;
             }
             .merknad { 
                      font-size:0.7em;
                      color:green;
                    }
             .avvik { background:#52c6db; 
                      white-space:nowrap; 
                      font-size:0.8em;
                    }
             .fag { font-size:0.7em; 
                    white-space: nowrap;
                    text-align:right;
             }
             .roomchange { font-size:0.85em; 
                    white-space: nowrap;
                    text-align:center;
                    color:blue;
                    border-left:solid 3px green;
                    padding-left:2px;
             }
             div.znoperc {
               border-bottom: solid #d08080 1px;
               background-color:#d0d0d0;
               border-top: solid #d08080 1px;
               height:5px;
               overflow:hidden;
               margin-top:4px;
               float:left;
             }
             div.zperc {
               border-bottom: solid green 1px;
               border-top: solid green 1px;
               background-color:green;
               height:5px;
               overflow:hidden;
               float:left;
               margin-top:4px;
             }
             .ical {
                text-align:left;
                color:mediumAquaMarine;
                font-size:0.9em;
             }
             .ovmm { font-size:0.8em; background-color:#ffffc0; }
             .planfri { background-color:#c8c8c8; }
             .fri { background-color:#c8ffc8; }
             .harplan { background-color:#d0d0ff; }
            </STYLE>";


  $html .= '<table border=2 class="timeplan small bluish"><caption>Årsplan</caption>
  <tr> <th>Mandag</th><th>Tirsdag</th><th>Onsdag</th><th>Torsdag</th><th>Fredag</th><th>Merknad</th></tr> <tr>';
  //foreach($ukeplan as $u) {
  for($i=0;$i<5;$i++) {
    $u = '&nbsp;';
    if (isset($ukeplan[$i])) {
      $u = $ukeplan[$i];
    }
    $html .= "<td>$u</td>";
  }
  $html .= "<td class='merknad'>$komment</td>";
  $html .= '</tr></table><p>';

  $show = false;
  $fagplan = '';
  if ($firstname != '') {
      $table = array();
      $idx = 2;
      $table[] = "<table border=2 class='timeplan'>\n";
      $table[] = "<tr><th class='timerute' width=2%></th>";
      $table[] = "<th>Mandag</th><th>Tirsdag</th><th>Onsdag</th><th>Torsdag</th><th>Fredag</th></tr>";
      for ($time=0;$time<10;$time++) {
        $t = $time + 1; 
        $ts = ($time < 10) ? ("$t <span class='teeny'>" . $start_tider[$time] . "</span>") : '';
        $table[] = "<tr>"; 
        $table[] = "<td class='timerute' >$t</td>"; 
        $idx ++;
        for ($dag=0;$dag<5;$dag++) {
          $class = @$tp[$dag][$time]->class;
          // $class = "normal"; 
          $rowspan = ""; 
          if (isset($fridager[$jday+$dag])) {
            if ($time == 0) {
                $table[] = "<td class=\"fri\" rowspan=10>" . $fridager[$jday+$dag] . "&nbsp;</td>\n";
            }
            continue;
          }
          if (isset($hd[$jday+$dag])) {
            if ($isteach) {
                //$class = 'heldag';
            } else {
                if ($time == 0 and !$isteach) {
                    $table[] = "<td class=\"heldag\" rowspan=10>" . $hd[$jday+$dag] . "&nbsp;</td>\n";
                }
                continue;
            }
          }
          // if ($tp[$dag][$time]->cell == '') $class = '';
          if (isset($bookings[$dag][$time]) AND @$tp[$dag][$time]->cell == '') {
              @$tp[$dag][$time]->cell .= '<span class="roomchange">' . $bookings[$dag][$time]. '</span>';
          } 
          if (@$tp[$dag][$time]->cell == '#') {
             continue;
          } 
          if ( $time < 9 and @$tp[$dag][$time]->cell == @$tp[$dag][$time+1]->cell 
                AND !isset($bookings[$dag][$time+1])
                and $class != 'prove') {
                 $tp[$dag][$time+1]->cell = '#';
                 $rowspan = "rowspan=2 ";
          }
          $table[] = "<td class=\"$class\" $rowspan>" . @$tp[$dag][$time]->cell . "</td>\n";
          $idx ++;
        }
        $table[] = "</tr>\n";
        /*if ($time == 1 or $time == 3 or $time == 4 or $time == 6) {
            $table[] = '<tr class="pause"><td class="timerute">&nbsp;</td></td><td colspan=5>&nbsp;</td></tr>';
        }
        */
        $idx ++;
      }
      $table[] = "</table></center>\n";
      $html .= implode("",$table);





    $sql = "SELECT c.id, c.id, c.shortname,s.section,count(s.summary) as plank
                FROM {$CFG->prefix}role_assignments ra 
                     INNER JOIN {$CFG->prefix}context x ON x.id=ra.contextid 
                     INNER JOIN {$CFG->prefix}course c ON x.instanceid=c.id 
                     LEFT JOIN {$CFG->prefix}course_sections s ON (s.course=c.id and s.summary != '')
                WHERE ra.userid=$UID
                     AND c.category in (2,3,4,6,10)
                GROUP BY c.id ";
                
    $planer = get_records_sql($sql);
    $sql = "SELECT c.id, c.id, c.shortname,s.section,s.summary
                FROM {$CFG->prefix}role_assignments ra 
                     INNER JOIN {$CFG->prefix}context x ON x.id=ra.contextid 
                     INNER JOIN {$CFG->prefix}course c ON x.instanceid=c.id 
                     LEFT OUTER JOIN {$CFG->prefix}course_sections s ON s.course=c.id
                WHERE ra.userid=$UID
                     AND c.category in (2,3,4,6,10)
                     AND (s.section = $section_now OR ISNULL(s.section))
                ORDER BY c.shortname";
    $fagliste = array();
    $fagplan = '';
    $fagplan .= "<br><center>Fagplaner";
    $fagplan .= "<table border=2 class='fagplan'>";
    $fagplan .= "<tr><th>Fag</th><th>Tema</th><th>M&#229;l</th>
              <th>Logg/Merk</th></tr>";
    if ($fagliste = get_records_sql($sql)) {
        $show = true;
        foreach($fagliste as $fag ) {
            @list($o,$v,$m,$mer,$log) = explode('|',$fag->summary);
            /// @ because we don't know if the summary contains |||
            $class = 'planfri';
            if (isset($planer[$fag->id])) {
                $class = 'harplan';
                $pp = $planer[$fag->id];
                if ((isset($o) and $o != '') or (isset($pp->plank) and $pp->plank > 10)) {
                    unset($planer[$fag->id]);
                } else if ( !isset($fag->summary) or $fag->summary == '' ) {
                    continue;
                }
            }            
            $newvalue = $fag->shortname;
            $fagplan .= "<tr><th width=5% class=\"fag $class\" align=left>{$newvalue}</th><td  class=\"ovmm\">$o</td>"
                  . "<td class=\"ovmm\" >$m&nbsp;</td>"
                  . "<td class=\"ovmm\" >$log&nbsp;</td></tr>";
        }
    }
    if ($planer) {
        $show = true;
        foreach($planer as $fag ) {
            $newvalue = '<a href="/moodle/course/view.php?week=jall&id=' .$fag->id.'" >'.$fag->shortname.'</a>';
            $fagplan .= "<tr><th width=5% class=\"fag \" align=left>{$newvalue}</th><td  class=\"avvik\">Ingen plan</td>"
                  . "<td class=\"ovmm\" >&nbsp;</td><td class=\"ovmm\" >&nbsp;</td>"
                  . "<td class=\"ovmm\" >&nbsp;</td><td class=\"ovmm\" >&nbsp;</td></tr>";
        }
    }
    $fagplan .= "</table></center>";
  }
  return (($show) ? ($html.$fagplan): ($loginlink.' '.$html));
}


function slotFromHM($h,$m,$slots) {
    $slot = 0;  
    $time = "$h.$m";
    foreach($slots as $s) {
        $s = str_replace(' ','',$s);
        @list($a,$b) = explode('-',$s);
        if ($time >= $a and $time < $b) {
            return $slot;
        }
        if ($time < $b) {
            return $slot;
        }
        $slot++;
    }
    return $slot;
}



?>
