<?PHP  
    // sletter starb registrert på en elev
    // på et gitt rom gitt av romid

    require_once('../../../../config.php');

    $romid    = optional_param('romid',0);
    $eid   = optional_param('eid',0);
    $alle   = optional_param('alle',0);

    $isteach = isteacherinanycourse($USER->id);
    $uid = $USER->id;

    if (!$isteach or $USER->department != 'Undervisning') {
         return;
    }

    // get current julday
    list($ty,$tm,$td,$hr,$min) = explode("/",strftime("%Y/%m/%d/%H/%M",time() ));
    $jday = gregoriantojd($tm,$td,$ty);
    $monday = 7*(int)($jday/7);
    $offset = $jday - $monday;


    if ($alle == 1) {
        $sql = 'delete from mdl_bookings_calendar where eventtype="attendance" 
            and ((julday ='.($monday).' and day = '.$offset.') or julday = '.$jday.') and itemid='.$romid;
    } else {
        $sql = 'delete from mdl_bookings_calendar where eventtype="attendance"
            and ((julday ='.($monday).' and day = '.$offset.') or julday = '.$jday.') and itemid='.$romid.' and value="'.$eid.'"';
    }
    execute_sql($sql,false);
