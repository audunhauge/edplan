<?PHP  

    require_once('../../../../config.php');
    require_once($CFG->dirroot.'/course/format/skeisvang/timeplan.php');
    require_once($CFG->dirroot.'/course/format/skeisvang/vis_timeplan.php');


    $navn = optional_param('navn','');
    print '<html><head><meta http-equiv="Content-Type" content="application/xhtml+xml; charset=utf-8" /> 
      <script src="js/jquery-1.4.2.min.js"></script>
      <script src="js/jquery-ui-1.8.5.custom.min.js"></script>
      <style>
        .ical {
           width:30px;
           float:left;
           font-size:0.9em;
         }
        .button {
            width:25px;
            display: inline-block;
            outline: none;
            cursor: pointer;
            text-align: center;
            text-decoration: none;
            font: 12px/100% Arial, Helvetica, sans-serif;
            padding: .3em 2.3em .35em .3em;
            text-shadow: 0 1px 1px rgba(0,0,0,.3);
            -webkit-border-radius: .5em;
            -moz-border-radius: .5em;
            border-radius: .5em;
            -webkit-box-shadow: 0 1px 2px rgba(0,0,0,.2);
            -moz-box-shadow: 0 1px 2px rgba(0,0,0,.2);
            box-shadow: 0 1px 2px rgba(0,0,0,.2);
                margin-right:5px;
        }
        .button:hover {
            text-decoration: none;
        }
        .button:active {
            position: relative;
            top: 1px;
        }
        .green {
            color: #e8f0de;
            border: solid 1px #538312;
            background: #64991e;
            background: -webkit-gradient(linear, left top, left bottom, from(#7db72f), to(#4e7d0e));
            background: -moz-linear-gradient(top,  #7db72f,  #4e7d0e);
        }
        .green:hover {
            background: #538018;
            background: -webkit-gradient(linear, left top, left bottom, from(#6b9d28), to(#436b0c));
            background: -moz-linear-gradient(top,  #6b9d28,  #436b0c);
        }
        .green:active {
            color: #a9c08c;
            background: -webkit-gradient(linear, left top, left bottom, from(#4e7d0e), to(#7db72f));
            background: -moz-linear-gradient(top,  #4e7d0e,  #7db72f);
        }
      </style>


      </head>';

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
    
    print '<body>';
    if ($U->firstname != '') {
        print "Hei $navn, last ned iCal og gCal<p>";
        print '<div class="ical" title="Last ned timeplan og aarsplan til ical">iCal</div>';
        print '<a class="button green" href="http://www.skeisvang-moodle.net/moodle/flex/flex_test.php/'.$U->id.'/gcal/timeplan/timeplan.ics">Timeplan</a> ';
        print '<a class="button green" href="webcal://www.skeisvang-moodle.net/moodle/flex/flex_test.php/'.$U->id.'/prover/timeplan.ics">Prøver</a> ';
        print '<a class="button green" href="webcal://www.skeisvang-moodle.net/moodle/flex/flex_test.php/'.$U->id.'/aarsplan/timeplan.ics">Årsplan</a> ';
        print '<a class="button green" href="webcal://www.skeisvang-moodle.net/moodle/flex/flex_test.php/'.$U->id.'/fridager/timeplan.ics">Fridager</a>';
        print '<p>';
        print '<div class="ical" title="Last ned timeplan og aarsplan til gcal">GCal</div>';
        print '<a class="button green" href="http://www.skeisvang-moodle.net/moodle/flex/flex_test.php/'.$U->id.'/gcal/timeplan/timeplan.ics">Timeplan</a> ';
        print '<a class="button green" href="http://www.skeisvang-moodle.net/moodle/flex/flex_test.php/'.$U->id.'/gcal/prover/timeplan.ics">Prøver</a> ';
        print '<a class="button green" href="http://www.skeisvang-moodle.net/moodle/flex/flex_test.php/'.$U->id.'/gcal/aarsplan/timeplan.ics">Årsplan</a> ';
        print '<a class="button green" href="http://www.skeisvang-moodle.net/moodle/flex/flex_test.php/'.$U->id.'/gcal/fridager/timeplan.ics">Fridager</a>';
    } else {
        print "Du ($fn $ln) må  <a href=\"/moodle/login/index.php\">logge inn</a> for å kunne velge kalender.</body></html>  ";
    }
    print '</body></html>';

