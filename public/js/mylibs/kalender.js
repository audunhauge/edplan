// generate a view for starb-reg

var $j   = jQuery.noConflict();
var user = Url.decode(gup("navn"));
var uuid        = $j("#uui").html();
var loggedin    = $j("#logged").html();
var jd          = $j("#julday").html();
var uname       = $j("#uname").html();
var firstname   = $j("#firstname").html().caps();
var lastname    = $j("#lastname").html().caps();


uuid = +uuid;
var uid = user;

$j("#msg").html("Kommer snart");

function getPassword() {
     if (loggedin == '1') {
     } else {
     }
}

if (uuid == 0) {
  userNotFound();
} else if (+uuid > 10000) {
  getPassword();
} 

function userNotFound() {
  return;
}
