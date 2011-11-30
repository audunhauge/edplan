// a shortcut to yearplan with no menues


var $j = jQuery.noConflict();
var database;           // jSON data
var brukerliste = {};   // brukerliste[elev,teach,klasse]
var valg;               // siste valg (teach,elev,klasse,sammensatt)
var fagenemine = [];    // for teach this is a list of courses owned
var inlogged = false;   // easy test for logged in (not related to security - just to menues shown)
var plannames;          // list of logged in users plans (assumed to be teach - only used if so)
                        // { 'name':pid, ... }

var attend;             // attendance for logged in user - simple select * from starbreg where userid=?
var allattend;          // attendance for all students
var meetings;           // meetings for teachers

var usersonline = '';   // logged in users with session active
var user='';


var showyear = 0;       // used to choose school year to show
    // can show this or next school year
    // changing showyear influences yearplan mostly
    // timetables and courseplans are not affected as they are not known yet
    // the system only has yearplans/timetables for current year
    // older courseplans are stashed in separate table (oldplans)
    // at startup will always be 0 == thisyear
    // can be changed to 1 == next year

   // egen var for denne slik at linken blir så kort som mulig
   // brukes til å legge inn link fra itslearning

var dager = "Man Tir Ons Tor Fre Merknad".split(" ");
var eier;               // eier av siste timeplan (navn osv)

var show = {};   // list over all shows indexed by userid

var myplans = null;   // my very own plans (I'm a teacher)
var timetables = null;
var timeregister = {};
// timeregister lagrer timeplaner slik at de kan vises
// samlet. Alle timeplanvisere kan push/pop på denne

var absent = {};
// all teachers who are absent (from current day)
// and all students
// {  julday:{ userid:{id,klass,name,value }, ..}, ... }
// if klass != 0 then this is id of teach who takes studs on trip

var valgtPlan;          // husker på den sist viste planen
var memberlist;         // liste over medlemmer i hver gruppe
var memgr;              // liste over grupper en elev er medlem av

var heldag;
var teachers;
var students;
var reservations;       // all reservations (future) for rooms
var id2elev;            // konverterer fra id til elevinfo
var isteach = false;    // a flag to decide if we should
  // bother displaying extra menues for a _presumed_ teacher -
  // the real test is done in php on submit
  // this is just a convenience

var isadmin = false;    //  display admin menues?
var popmemoizer = {};
var userinfo = {};
var memothisweek = '';  // remember timetable for this week (this user)

var fagplaner;          // mine fagplaner
var allefagplaner;      // alle fagplaner courseplans[avdeling][teach][fag] (pr lærer)
var courseplans = null; // courseplans[course]

var planinfo;           // planid -> info (vurdering)
var cpinfo;             // courseid -> planid

var siste10 = {}        // husk 10 siste timeplaner

var alleprover;         // lagrer data om alle prøver for alle elever
var blocks;             // slots for entering tests for courses that belong to a block

var fullname;           // lagrer fagnavn delen av gruppenavnet - fullname["3403"] = "3inf5"
var category;           // 3inf5:4, 2SCD5:10  - kategori for faget 2=vg1,3=vg2,4=vg3,10=mdd
var fagautocomp;        // liste over alle gyldige fagnavn - brukes til autocomplete
var linktilrom = [];    // liste over alle rom

var promises = {};      // hash of promises that functions may fulfill when they have recieved data

var romliste = { "A":("A001,A002,A003,A005,A102,A107".split(',')),
                     "M0":("M001,M002,M003,M004,M005,M006".split(',')),
                     "M1":("M106,M107,M108,M109,M110,M111,M112,M113,M114,M115,M116,M117,M118,M119,B001,B002".split(',')),
                     "R0":("R001,R002,R003,R004,R005,R008".split(',')),
                     "R1":("R105,R106,R107,R110,R111,R112,R113".split(',')),
                     "R2":("R201,R202,R203,R204,R205,R206,R207,R208,R210,R211,R212,R213,R214,R215,R216".split(',')) };

var allrooms = [];


function toggle_year() {
  showyear = (showyear == 0) ? 1 : 0;
  var jyy = (showyear == 0) ? database.firstweek : database.nextyear.firstweek ;
  var greg = julian.jdtogregorian(jyy);
  $j("#yyear").html(""+greg.year+'-'+(+greg.year+1));
  if (promises.toggle_year) {
    // redisplay with new year
    promises.toggle_year();
  }
}

function gotoPage() {
  // all menue-choices have their own address (so that history and bookmarks can work)
  // we also push all pages into history so that history rewind works
  // A page has address like this:  page=mainmenu/submenu/subsub
  // page=aarsplan/denneuka
  // page=plans/3inf5
  // page=tests/3inf5
  // page=timeplan/elev/eid
  // page=timeplan/teach/eid
  // page=timeplan/gruppe/gr
  // page=timeplan/klasse/klassenavn
  // page=timeplan/room/roomname
  // page=edit/aarsplan
  // page=edit/fridager
}
  

function take_action() {
    // decide what to show at startup based on action parameter
}

// fetch userlist and do some more setup


function setup_teach() {
    //$j("#htitle").html("Velkommen "+user);
}


function get_login() {
}

function belongsToCategory(uid,cat) {
  // return true if user has a course in this list of categories - cat = { cat1:1, cat2:1  ... }
  return false;
}

function afterloggin(uinfo) {
}



var prevtitle;

function getusers() {
    // noen kjappe globale
    memberlist = database.memlist;
    memgr = database.memgr;
    heldag = database.heldag;
    category = database.category;
    fagautocomp = database.course;
    id2elev = database.students;
    teachers = database.teachers;
    students = database.students;
    studentIds = database.studentIds;
    getcourseplans();
    // hent ut blokkskjema
    $j.getJSON( 'blocks',function (newblocks) {
        blocks = newblocks;
    });
    // hent ut planlagt fravær for teach
    $j.getJSON( "/getabsent", 
         function(data) {
           absent = data;
         });
    $j.getJSON( "/reserv", 
         function(data) {
            reservations = data;
         });
}

function getcourseplans() {
  // fetch timetables and courseplans
}            



$j(document).ready(function() {
    $j.getJSON( "/basic",{ navn:user }, 
         function(data) {
           database = data;
           userinfo = data.userinfo;
           database.userinfo = { uid:0 };
           // sjekk først om bruker allerede er logga inn
          $j.getJSON( "/alltests", 
               function(data) {
                  alleprover = data;
                 show_all(database.startjd);
               });
         });
});

