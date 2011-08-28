<?PHP  
    // returnerer liste over elever som er registrert
    // på et gitt rom (bestemt av starb-key)

    require_once('../../../../config.php');

    $romid    = optional_param('romid',0);


    // get current julday
    list($ty,$tm,$td,$hr,$min) = explode("/",strftime("%Y/%m/%d/%H/%M",time() ));
    $jday = gregoriantojd($tm,$td,$ty);
    $monday = 7*(int)($jday/7);
    $offset = $jday - $monday;

    // delete expired keys
    $sql = 'delete FROM '.$CFG->prefix.'starb where julday < '.$jday.' or ( julday <= '.$jday
           .' and start+minutes*60 < '. time() .')' ;
    execute_sql($sql,false);

    $elever = array();
    $sql = 'select u.id,u.firstname,u.lastname,u.department from mdl_bookings_calendar c 
            inner join mdl_user u on (c.value = u.id)
            where eventtype = "attendance" and ((julday ='.($monday).' and day = '.$offset.') or julday = '.$jday.') and itemid='.$romid;
    if ($res = get_records_sql($sql)) {
       foreach($res as $r) {
          $firstname = shorten($r->firstname,15);
          $lastname = shorten($r->lastname,18);
          $elever[] = '{"eid":'.$r->id.', "firstname":"'.$firstname.'", "lastname":"'
                        .$lastname.'", "klasse":"'.$r->department.'" }';
       }
    }
    $estr = implode(',',$elever);
    print '{ "elever":['. $estr.' ], "antall":'.(count($elever)).' }';

    function shorten($s,$l) {
       if (strlen($s) < $l) return $s;
       $r = strrpos($s," ");
       if ( $r > $l*0.6 ) {
          return substr($s,0,$r);
       }
       return substr($s,0,$l);
    }
