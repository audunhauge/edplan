<?PHP  

    require_once('../../../../config.php');

    $starth   = optional_param('starth',0);
    $startm   = optional_param('startm',0);
    $antall   = optional_param('antall',0);
    $romid    = optional_param('romid',0);
    $duration = optional_param('duration',0);
    $uid      = optional_param('uid',0);

    
    if ($uid == 0) {
        $isteach = isteacherinanycourse($USER->id);
        $uid = $USER->id;

    } else {
        $sql = 'SELECT * from mdl_user where id='.$uid;
        $U = get_record_sql($sql);
        $isteach =  ($U->department == 'Undervisning');
        
    }
    if (!$isteach or $duration < 3 or $duartion > 80 
         or $romid > 125 or $romid < 35
         or $starth < 12 or $starth > 14 or $startm < 0 or $startm > 59 ) {
         print "Ugyldig $isteach $starth $startm $antall $romid $duration";
         return;
    }

    // get current julday
    list($ty,$tm,$td,$hr,$min) = explode("/",strftime("%Y/%m/%d/%H/%M",time() ));
    $jday = gregoriantojd($tm,$td,$ty);

    // delete expired ip-addresses
    $sql = 'delete FROM '.$CFG->prefix.'starb_ip where julday < '.$jday;
    execute_sql($sql,false);

    // delete expired keys
    $sql = 'delete FROM '.$CFG->prefix.'starb where julday < '.$jday.' or ( julday <= '.$jday.' and start+minutes*60 < '. time() .')' ;
    execute_sql($sql,false);

    // delete existing keys for this teach,room,julday
    $sql = 'delete FROM '.$CFG->prefix.'starb where teachid='.$uid.' and roomid='.$romid.' and julday='.$jday;
    execute_sql($sql,false);

    $t0 = mktime($starth,$startm);

    // build a list of active keys 
    $sql = 'SELECT regkey, regkey as reg FROM '.$CFG->prefix.'starb order by regkey';
    $active = array();
    if ($res = get_records_sql($sql)) {
       foreach ($res as $r) {
          $active[] = $r->reg;
       }
    }

    $search = true;
    while ($search) {
        $regk = mt_rand(314,9999) ;
        $regkstr = "".$regk;
        $ts = 0;
        for ($j=0;$j < strlen($regkstr); $j++) {
           $ts =  ($ts + (int)substr($regkstr,$j,1)) % 10;
        }
        $regk = 10*$regk + (int)$ts;
        // the last digit in regkey == sum of the others mod 10
        $search = in_array($regk,$active);
    }
    $sql = "insert into {$CFG->prefix}starb (roomid,julday,teachid,regkey,ecount,start,minutes,slot)
            values ($romid,$jday,$uid,$regk,$antall,$t0,$duration,0)";
    execute_sql($sql,false);
    print $regk;


