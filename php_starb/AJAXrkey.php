<?php 
    require_once('../config.php');

    /*
    if(!isteacherinanycourse($USER->id)) {
        print "us=".$USER->id;
		print "FAIL (not teach nor user)";
	    return;
	}
    */

	$userid  = optional_param('userid',0,PARAM_INT);  
	$regkey  = optional_param('regkey',0,PARAM_INT);    
	//$julday  = optional_param('julday',0,PARAM_INT);    
    $ip=$_SERVER['REMOTE_ADDR']; 

    if (substr($ip,0,6) != '152.93' ) {
       print 'ip';
       return;
    }


    $t = time();
    $now = strftime('%m,%d,%Y',$t );
    list($m,$d,$y) = explode(',',$now);
    //$stamp = make_timestamp($y, $m, $d, $starth, $startm);

    $time = array( 0 => '12:10', 1 => '12:50' );
    if ($res = get_records_sql(" select s.*,i.name,u.username from mdl_starb s 
           inner join mdl_bookings_item i on (s.roomid = i.id) 
           inner join mdl_user u on (u.id=s.teachid) 
           where s.ecount > 0 and s.regkey=".$regkey  )) {
        $r = array_shift($res);
        $julday = $r->julday;
        $jday = 7 * (int)($julday/7);
        $day = $julday - $jday;
        if ($t > $r->start and $t < $r->start+60*$r->minutes) {
          $sql = 'select * from mdl_starb_ip where julday='.$julday.' and ip="'.$ip.'" ';
          if ($res = get_records_sql($sql)) {
             if ($res->userid != $userid) {
               // only one user may register from this ip any given day
               // user may reregister (because teach asked for a recount)
               print "used";
               return;
             }
          }
          $sql = 'select * from mdl_bookings_calendar where value="'.$userid.'"
                  and eventtype="attendance" and day='.$day.' and slot='.$r->slot.' and julday='.$jday;
          if ($res = get_records_sql($sql)) {
             print "already";
          } else {
             $sql = "insert into mdl_bookings_calendar (userid,julday,itemid,day,slot,start,class,eventtype,name,value)
                     values ({$r->teachid},$jday,{$r->roomid},$day,{$r->slot},$t,$regkey,'attendance','{$r->name}','$userid')";
             execute_sql($sql,false);
             $sql = "update mdl_starb set ecount = ecount -1 where id=".$r->id;
             execute_sql($sql,false);
             $sql = 'delete from mdl_starb_ip where ip="'.$ip.'" and julday='.$julday;
             execute_sql($sql,false);
             $sql = 'insert into mdl_starb_ip (julday,ip,userid) values ( '.$julday.', "'.$ip.'", '.$userid.') ';
             execute_sql($sql,false);
             print substr($r->username,0,4)." {$r->name} time:".$time[$r->slot];
          }
        } else {
          if ($t < $r->start) {
             print "early";
          } else {
             print "time";
          }
        }
        return;
    }
    print "error";
    return;

	
?>
