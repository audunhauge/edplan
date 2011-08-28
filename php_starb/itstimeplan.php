<?PHP  

    require_once('../../../../config.php');
    require_once('../../../../lib/ical/ical.php');
    require_once('../locallib.php');
    require_once('../timeplan.php');
    require_once('itstimeplan_sub.php');



    $id = optional_param('id',0);
    $usr = optional_param('usr',0);
    $aarsplan = get_record("course", "shortname", 'aarsplan');
    $id = ($id) ? $id : $aarsplan->id;
    if ($id) {
        if (! ($course = get_record("course", "id", $id)) ) {
                    error("That's an invalid course id");
        }
    }



print '<html>';
print '<body>';
print '<head>
  <meta http-equiv="Content-Type" content="application/xhtml+xml; charset=utf-8" /> 
  <style>
    body {
    }
    table {
      border-collapse:collapse;
      border-spacing:0;
    }
    
  </style>
</head>
';
print vis_timeplan(0,false);
print '</body>';
print '</html>';
?>
