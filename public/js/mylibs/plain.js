// simply get yearplan data and show for this week
// used as a popup on itslearning
// must be small and agile

var $j = jQuery.noConflict();
var yearplan;           
var heldag;           
var dager = "Man Tir Ons Tor Fre Merknad".split(" ");
var offset = Url.decode(gup("offset"));
var user = Url.decode(gup("navn"));
var uuid        = $j("#uui").html();
var loggedin    = $j("#logged").html();
var jd          = $j("#julday").html();
var uname       = $j("#uname").html();
var firstname   = $j("#firstname").html().caps();
var lastname    = $j("#lastname").html().caps();

var category = { "1BEV2":11, "1BID5":4, "1DAT5":11, "1ENG5":2, "1FR24":2, "1GEO2":1, "1KRO2":4, "1LYT2":10, "1MDD5":11, 
    "1MP5":1, "1MT5":1, "1MUS5":10, "1NAT5":1, "1NOR4":2, "1SFF3":3, "1SP24":2, "1TEN5":12, "1TY14":2, "1TY24":2, 
    "2BID5":4, "2BIO5":1, "2DAP5":11, "2EB12":11, "2FR24":2, "2FYS5":1, "2GEO2":1, "2GEO5":1, "2GTD2":11, "2HFI5":3, "2HIS2":3, 
    "2IEN5":2, "2INF5":1, "2KJE5":1, "2KRO2":4, "2MAP3":1, "2MAR5":1, "2MAS5":1, "2MFD5":10, "2MIK5":3, "2MP15":10, "2NOR4":3, 
    "2OKS5":3, "2RTL5":3, "2SCD5":11, "2SDF5":11, "2SFF3":3, "2SGE5":3, "2SP24":2, "2SSA5":3, "2TEB2":11, "2TEF5":12, "2TEP5":12, 
    "2TFO5":1, "2TIP5":12, "2TY14":2, "2TY24":2, "3BIO5":1, "3DAP5":11, "3EB12":11, "3ELK5":2, "3FYS5":1, "3GEOF5":1, 
    "3GTD2":11, "3HFI5":3, "3HIS4":3, "3IKS5":10, "3INF5":1, "3IOL5":12, "3KJEM5":1, "3KRO2":4, "3MAR5":1, "3MAS5":1, "3MFD5":10, 
    "3MIK5":3, "3MP15":10, "3NOR6":2, "3OKL5":3, "3PMR5":3, "3REL3":3, "3RTL5":3, "3SAE5":3, "3SCD5":11, "3SDA5":11, "3SDF5":11, 
    "3TEB2":11, "3TEF5":12, "3TEP5":12, "3TFO5":1, "3TIP5":12, "ENSE2":10, "KOMO":20 };



$j(document).ready(function() {
    $j.get(mybase+ "/yyear", { "quick":"true" },
         function(data) {
           yearplan = data;
           var thisweek = data.start + 7*offset;
           $j.get(mybase+ "/getexams", { "quick":"true" },
               function(data) {
                 heldag = data;
                 $j.get(mybase+ "/timetables", { "quick":"true" },
                   function(data) {
                     var timetables = data;
                     var s = getYearPlanThisWeek(thisweek);
                     $j("#yearplan").html(s);
               });
           });
           $j.get(mybase+ "/getabsent", { "upper":thisweek+7 }, function(data) {
                var teachabsent = drawAbsentees(data,thisweek);
                $j("#absent").html(teachabsent);
           });
           $j.get(mybase+ "/getallstarblessdates", { "upper":thisweek+7 }, function(data) {
                var starbkurs = drawStarbCourse(data,thisweek);
                $j("#starbless").html(starbkurs);
                if (+uuid > 10000) {
                  $j(".postit").fadeOut(5000);
                }
                $j("#starbrow").click(function() {
                      $j(".postit").toggle();
                });
           });
           if (+uuid > 10000) {
               $j.get(mybase+ "/getmeet", function(data) {
                    var meetings = showMyMeets(data,thisweek,uuid);
                    $j("#meetings").html(meetings);
               });
           }
         });
});


function showMyMeets(data,thisweek,uid) {
  var meetings = data.meetings;
  var roomnames = data.roomnames;
  var rows = '<tr><th colspan="6">Møter</th></tr>';
  var anything = false;
  for (var w=0;w<2;w++) {
      var s = '';
      for (var j=0;j<5;j++) {
        var meetdivs = '';
        if (meetings[thisweek+w*7+j]) {
          if (meetings[thisweek+w*7+j][uid]) {
            anything = true;
            for (var mii in meetings[thisweek+w*7+j][uid]) {
              var meetinfo = meetings[thisweek+w*7+j][uid][mii];
              if (meetinfo.slot && +meetinfo.slot >= 0 && +meetinfo.slot < 15) {
                meetinfo.value = meetinfo.slot; // a short meeting
                // use the slot - value is 5 min intervals in this slot
                // we dont' bother picking them out
              }
              var klass = "unconf obli conf reject".split(' ')[meetinfo.klass];
              var mstatus = "Ubekrefta Obligatorisk Bekrefta Avvist".split(' ')[meetinfo.klass];
              var romnavn = roomnames[meetinfo.roomid] || '';
              var title =  meetinfo.name + ' ' + meetinfo.value + ' time, Status:'+mstatus;
              var txt = 'Møte '+romnavn;
              meetdivs += '<div class="'+klass+'" title="'+title+'">' + txt + '</div>';
             }
          }
        }
        s += '<td>' + meetdivs + '</td>';
      }
      rows += '<tr>' + s + '<td>Uke '+julian.week(thisweek+w*7)+'</td></tr>';
  }
  return (anything) ? rows : '';
}

function drawStarbCourse(data,thisweek) {
  // draws table showing absent teachers
    var s = '';
    var header = [];
    var starb = [];
    for (var ss in data) {
      var kurs = data[ss];
      if (!starb[kurs.julday]) {
        starb[kurs.julday] = [];
      }
      starb[kurs.julday].push(kurs);

    }
    for (var j=0;j<6;j++) {
      header[j] = '';
      if (starb[thisweek +j]) {
        for (var tid in starb[thisweek + j]) {
            var kurs = starb[thisweek + j][tid];
            var teach = yearplan.teachers[kurs.teachid];
            var fullname = teach.firstname.caps() + " " + teach.lastname.caps();
            var room = yearplan.roomnames[kurs.roomid]
            header[j] += '<div class="postit" title="'+kurs.value+'">'
            + '<span title="'+fullname+'">'+teach.username+'</span><span>'+kurs.name+'</span><span>' +room+ '</span></div>';
        }
      }
    }
    s += '<tr id="starbrow"><th colspan="6" title="click to hide/show">'
            + 'Starbkurs <span class="info">(peker over for detaljer)</span></th></tr>';
    s += '<tr>';
    for (var i=0;i<6;i++) {
        if (header[i]) {
          s += "<td class=\"dayinfo\">" + header[i] + "</td>";
        } else {
          s += "<td class=\"dayinfo\"></td>";
        }
    }
    s += "</tr>";
    return s;
}

function drawAbsentees(data,thisweek) {
  // draws table showing absent teachers
    var s = '';
    var header = [];
    var tcounter = {};    // count of days for each absent teach
    var klasstab = [ {},{},{},{},{},{} ];    // classes with absent studs
    var slottab = [ {},{},{},{},{},{} ];    // slots for absent klasses
    for (var j=0;j<6;j++) {
      if (data[thisweek +j]) {
        for (var tid in data[thisweek + j]) {
            if (tcounter[tid]) {
              tcounter[tid] ++;
            } else {
              tcounter[tid] = 1;
            }
            if ( yearplan.students[tid]) {
               var stu = yearplan.students[tid];
               if (!klasstab[j][stu.department]) {
                 klasstab[j][stu.department] = 1;
                 slottab[j][stu.department] = data[thisweek+j][tid].name + ' ' + data[thisweek+j][tid].value;
               }
               klasstab[j][stu.department] ++;
            }
        }
      }
    }
    for (var j=0;j<6;j++) {
      header[j] = '';
      if (data[thisweek +j]) {
        header[j] += '<div class="absentee">';
        for (var tid in data[thisweek + j]) {
            if (tcounter[tid] > 4) continue;
            if (yearplan.teachers[tid]) {
              var abbs = data[thisweek + j][tid];
              var teach = yearplan.teachers[tid];
              var fullname = teach.firstname.caps() + " " + teach.lastname.caps();
              var title = fullname;
              var absclass = 'red';
              if (abbs.value != '1,2,3,4,5,6,7,8,9') {
                absclass = 'green';
                title += ' ' + abbs.name + ' ' + abbs.value + ' time';
              }
              header[j] += '<span class="'+absclass+'" title="'+title+'" >'+teach.username+'</span>';
            } 
        }
        // add absentees for klasses
        for (var kl in klasstab[j]) {
          header[j] += '<span class="klassabs" title="'+klasstab[j][kl]+' elever '+slottab[j][kl]+'" >'+kl+'</span>';
        }
        header[j] += '</div>';
      }
    }
    var wholeweek = '<ul class="hdliste">';
    for (var tid in tcounter) {
      if (tcounter[tid] > 4) {
        var teach = yearplan.teachers[tid];
        if (teach) {
          var fullname = teach.firstname.caps() + " " + teach.lastname.caps();
          wholeweek += '<li title="'+fullname+'" >'+teach.username+'</li>';
        }
      }
    }
    wholeweek += '</ul>';
    s += "<tr><th colspan=5>Fravær: <span class=\"info\">"
      + " (<span class=\"red\">rød</span>:hele dagen, <span class=\"green\">grønn</span>:timer, <span class=\"klassabs\">aqua:</span>Klasser</span>)</th>"
      + "<th>Hele uka</th></tr>";
    s += "<tr>";
    for (var i=0;i<5;i++) {
        s += "<td class=\"dayinfo\">" + header[i] + "</td>";
    }
    s += "<td class=\"dayinfo\">" + wholeweek + "</td>";
    s += "</tr>";
    return s;
}

function getYearPlanThisWeek(thisweek) {
  // fetch weekly summary from yearplan
    var s = '';
    var header = [];
    e = yearplan[Math.floor(thisweek/7)] || { days:[]} ;
    for (var j=0;j<6;j++) {
        header[j] = e.days[j] || '';
        var hd = heldag[thisweek+j];
        if (hd) {
          header[j] += '<ul class="hdliste">';
          for (var f in hd) {
            f = f.toUpperCase();
            var cat = +category[f] || 0;
            header[j] += '<li class="catt'+cat+'">'+f+'&nbsp;'+hd[f].value+'</li>';
          }
          header[j] += '</ul>';
        }
    }
    s += "<tr class=\"days\">";
    for (i=0;i<6;i++) {
        s += "<th>" + dager[i] + "</th>";
    }
    s += "</tr>";
    s += "<tr>";
    for (i=0;i<6;i++) {
        s += "<td class=\"dayinfo\">" + header[i] + "</td>";
    }
    s += "</tr>";
    return s;
}
