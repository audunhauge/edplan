// show/edit meetings

// global hash to ease change of state and reload of closures
minfo = {
   title    : 'Møte'
 , message  : ''       
 , ignore   : ''
 , chosen   : {}
 , delta    : 0
 , roomid   : 0
 , sendmail   : true
 , response : 'accept'
 , day      : ''
};  


function reduceSlots(userlist,roomname,jd) {
  // returns biglump, whois, busy and rreserv
  // whois busy and rreserv contain info on who,what,why the slot is blocked
  // reduce available slots in biglump
  // remove meetings, absent, roomreservations, roomlessons and teachlessons
  // First remove meetings and absentees
  var biglump = {};
  var whois = {};
  var busy = {};
  var rreserv = {};
  for (var day = 0; day < 5; day++) {
    biglump[day] = {};
    busy[day] = {};
    whois[day] = {};
    for (var slot = 0; slot < 15; slot++) {
       biglump[day][slot] = $j.extend({}, userlist);
       biglump[day][slot][roomname] = 1;
    }
    if (meetings[jd+day]) {
      var mee = meetings[jd+day];
      for (var muid in mee) {
        if (userlist[muid] != undefined) {
           for (var mmid in mee[muid]) {
            var abba = mee[muid][mmid];
            var timer = abba.value.split(",");
            for (var ti in timer) {
              var slot = +timer[ti] - 1;
              if (slot >= 0 && slot < 15) {
                delete biglump[day][slot][muid];
                busy[day][slot] = abba.name || 'Møte';
                whois[day][slot] = teachers[muid].username;
              }
            }
           }
        }
      }
    }
    if (absent[jd+day]) {
      var ab = absent[jd+day];
      for (var abt in ab) {
          if (userlist[abt] != undefined) {
            // one of selected teachers is absent
            var abba = ab[abt];
            var timer = abba.value.split(",");
            for (var ti in timer) {
              var slot = +timer[ti] - 1;
              delete biglump[day][slot][abt];
              busy[day][slot] = abba.name;
              whois[day][slot] = teachers[abt].username;
            }
          }
      }
    }
  }
  // now decimate based on lessons for this room
  if (roomname) {
    var tt = timetables.room[roomname];
       for (var iid in tt) {
         var ts = tt[iid];
         var day = +ts[0] % 7;
         var slot = ts[1];
         if (ts[2] && ts[2].substr(0,4).toLowerCase() == 'møte') continue;
         if (day == undefined || slot == undefined) continue;
         delete biglump[day][slot][roomname];
       }
  }
  // now decimate based on reservations for this room
  if (reservations) {
    for (var jdd = jd; jdd < jd+7; jdd++) {
      if (reservations[jdd]) {
        var reslist = reservations[jdd];
        for (var r in reslist) {
          var res = reslist[r];
          if (res.name == roomname) {
            if (!rreserv[res.day]) rreserv[res.day] = {};
            rreserv[res.day][res.slot] = res;
          }
        }
      }
    }
  }
  // now decimate based on lessons for selected teachers
  if (timetables && timetables.teach) {
    // we have teach timetables
    for (var tuid in userlist) {
       var tt = timetables.teach[tuid];
       for (var iid in tt) {
         var ts = tt[iid];
         var day = +ts[0] % 7;
         var slot = ts[1];
         if (ts[2] && ts[2].substr(0,4).toLowerCase() == 'møte') continue;
         if (day == undefined || slot == undefined) continue;
         delete biglump[day][slot][+tuid];
       }
    }
  }
  return { biglump:biglump, whois:whois, busy:busy, rreserv:rreserv }
}

function doStatusCheck(idlist) {
  // returns enabled/disabled for save button
  if ($j.isEmptyObject(minfo.chosen)) return 'ingen deltagere';
  if (minfo.roomid == 0) return 'mangler rom';
  var roomname = database.roomnames[minfo.roomid] || '';
  if (roomname == '' || roomname == 'nn') return 'mangler rom';
  if (idlist == '') return 'ingen timer valgt';
  return '';
}

function findFreeTime() {
  // show list of teachers - allow user to select and find free time
  $j.getJSON( "/getmeet", function(data) {
    meetings = data.meetings;
    var message = '';
    var s='<div id="timeviser"><h1 id="oskrift">Finn ledig møtetid for lærere</h1>';
    s += '<div class="gui" id=\"velg\">Velg rom for møte<select id="chroom">';
    //s+= '<option value="0"> --velg-- </option>';
    for (var i in database.roomnames) {
         var e = database.roomnames[i]; 
         s+= '<option value="'+i+'">' + e  +  "</option>";
    }
    s+= "</select></div>";
    s+= '<div id="freeplan"></div>';
    s+= '<div id="stage"></div>';
    s+= "</div>";
    $j("#main").html(s);
    var activeday = { "0":{}, "1":{}, "2":{}, "3":{}, "4":{} };
    var aday = '';
    choosefrom = $j.extend({}, teachers);
    studChooser("#stage",choosefrom,minfo.chosen,'institution');
    var freeTimeTable = function (userlist,roomid,delta) {
      // assume timetables is valid
      // create timetable containing names of teach who are available
      // for a given slot
      // userlist = {1222:1,333:1,45556:1} teacher ids to check
      // chroom is index into allrooms
      minfo.roomid = roomid;
      minfo.delta = delta;
      minfo.title = $j("#msgtitle").val() || minfo.title;
      message = $j("#msgtext").val() || '';
      minfo.ignore = $j('input[name=ignore]:checked').val() || '';
      minfo.sendmail = $j('input[name=sendmail]:checked').val() || minfo.sendmail;
      var count = 0;   // number of teachers
      var roomname = database.roomnames[minfo.roomid] || '';
      var jd = database.startjd + 7*minfo.delta;
      for(var prop in userlist) {
         if(userlist.hasOwnProperty(prop)) ++count;
      }
      var re = reduceSlots(userlist,roomname,jd);
      var biglump = re.biglump;   // all free slots
      var whois = re.whois;       // name of teach for meeting/reservation
      var busy = re.busy;         // what they are doing instead
      var rreserv = re.rreserv;   // reserved rooms

      var s = '<div id="showplan" class="tabbers">Timeplan</div>'
            + '<div id="showdetails" class="tabbers" style="left:90px;" >Møte info</div>';
       s += '<table id="meetplan">'
        +    '<caption>'
        +       '<div class="button blue" id="prv">&lt;</div><span id="capmeetplan">Uke '
        +        +julian.week(jd)+' '+show_date(jd) 
        +       '</span><div class="button blue "id="nxt">&gt;</div>';
        +    '</caption>'
      s += '<tbody id="meetplanbody"><tr><th></th>';
      for (var day = 0; day < 5; day++) {
        s+= '<th>'+dager[day]+'dag</th>';
      }
      s += '<tr>';
      for (var slot = 0; slot < 9; slot++) {
        s += '<tr><th>'+(slot+1)+'</th>';
        for (var day = 0; day < 5; day++) {
          if (rreserv[day] && rreserv[day][slot]) {
            var r = rreserv[day][slot];
            s += '<td title="'+r.value+'">'+teachers[r.userid].username+'</td>';
            continue;
          }
          if (database.freedays[jd+day]) {
            s += '<td><div class="timeplanfree">'+database.freedays[jd+day]+'</div></td>';
            continue;
          }
          if (minfo.ignore != '') {
            s += '<td class="greenfont"><input class="slotter" id="tt'+day+"_"+slot+'" type="checkbox"> '+minfo.ignore+'</td>';
            continue;
          }
          if (!biglump[day] || !biglump[day][slot]) {
            s += '<td>&nbsp;</td>';
            continue;
          }
          var freetime = biglump[day][slot];
          if (freetime) {
            var tt = ''; 
            var zz = ''; 
            var tdcount = 0;
            if (freetime[roomname]) {
                    for (var tti in userlist) {
                      if (freetime[tti] != undefined) {
                        tt += teachers[tti].username + ' ';
                        tdcount++;
                      } else {
                        zz += teachers[tti].username + ' ';
                      }
                    }
                    if (tdcount == count) {
                       s += '<td title="'+tt+'" class="greenfont"><input class="slotter" id="tt'+day+"_"+slot+'" type="checkbox"> AlleLedig</td>';
                    } else {
                       if (tdcount) {
                          s += '<td><span title="Kan ikke:'+zz+'" class="redfont">'+(count-tdcount)+'</span>'
                          s += ' &nbsp; <span class="greenfont" title="Kan møte:'+tt+'">'+(tdcount)+'</span>';
                       } else {
                          if (busy[day][slot] != undefined) {
                            s += '<td class="meeting"><span title="'+whois[day][slot]+'">'+busy[day][slot]+'</span>'
                          } else {
                            s += '<td><span class="redfont">IngenLedig</span>'
                          }
                       }
                       s+= '</td>';
                    }
            } else {
               s += '<td><span class="redfont">Time</span>'
            }
          } else {
            s += '<td>&nbsp;</td>';
          }
        }
        s += '</tr>';
      }
      s += '</body></table>';
      var igncheck = (minfo.ignore != '') ? 'checked="checked"' : '';
      var mailcheck = (minfo.sendmail != '') ? 'checked="checked"' : '';
      var mlist = [];
      for (var uu in userlist) {
        mlist.push(teachers[uu].username);
      }
      var meetlist = mlist.join(', ');
      var mylist = $j(".slotter:checked");
      var idlist = $j.map(mylist,function(e,i) { return (+e.id.substr(2).split('_')[1] + 1); }).join(',');
      var save_status = doStatusCheck(idlist);
      var disabled = (save_status != '') ? 'disabled="disabled"' : '';

      s += '<div id="reservopts">';
      s += '<table id="details" class="dialog gui">'
        +  '<caption id="capdetails">Møte info</caption>'
        +    '<tr id="detailsrow">'
        +      '<td><table class="dialog gui">'
        +        '<tr><th>Møte-tittel</th><td><input id="msgtitle" type="text" value="'+minfo.title+'"></td></tr>'
        +        '<tr><th>Beskrivelse</th><td><textarea id="msgtext">'+message+'</textarea></td></tr>'
        +        '<tr><th>Påmeldt</th><td><span id="attend">'+meetlist+'</span></td></tr>'
        +        '<tr><th>Timer</th><td><span id="timeliste">'+idlist+'</span></td></tr>'
        +        '<tr><th title="Deltager kan ikke avvise møtet.">Obligatorisk</th>  <td><input name="konf" value="ob" type="radio"></td></tr>'
        +        '<tr><th title="Deltakere må avvise dersom de ikke kommer.">Kan avvise</th>    <td><input name="konf" value="deny" type="radio"></td></tr>'
        +        '<tr><th title="Deltakere må bekrefte at de kommer">Må bekrefte</th>'
        +             '<td><input checked="checked" name="konf" value="conf" type="radio"></td></tr>'
        +        '<tr><th>ReserverRom</th><td><input id="resroom" checked="checked" type="checkbox"></td></tr>'
        +        '<tr><th>SendMail</th><td><input name="sendmail" type="checkbox" '+mailcheck+'></td></tr>'
        +        '<tr><th>IgnorerTimeplaner</th><td><input name="ignore" type="checkbox" '+igncheck+'></td></tr>'
        +        '<tr><th>&nbsp;</th><td><hr></td></tr>'
        +        '<tr><th>Lag møte</th><td> <input id="makemeet" '+disabled+' type="button" value="Lagre"></button>'
        +        ' <span id="savestatus" class="redfont tiny"> '+ save_status+'</span></td></tr>'
        +      '</table></td>'
        +    '</tr>'
        +  '</table>';

      s += '</div>';
      $j("#freeplan").html(s);
      minfo.ignore = $j('input[name=ignore]:checked').val() || '';
      minfo.sendmail = $j('input[name=sendmail]:checked').val() || '';


      $j("#nxt").click(function() {
         if (database.startjd+7*minfo.delta < database.lastweek+7)
           minfo.delta++;
           $j("#freeplan").html(freeTimeTable(userlist,minfo.roomid,minfo.delta));
         });
      $j("#prv").click(function() {
         if (database.startjd+7*minfo.delta > database.firstweek-7)
           minfo.delta--;
           $j("#freeplan").html(freeTimeTable(userlist,minfo.roomid,minfo.delta));
         });
      $j(".tabbers").removeClass("active");
      if (mlist.length > 10) $j("#attend").addClass('tiny');
      $j(".tabchooser").click(function() {
              tabfield = this.id;
              studChooser(targetdiv,memberlist,info,tabfield,fieldlist);
          });
      $j("#details").hide();
      $j("#showplan").addClass('active');
      $j("#showplan").click(function() {
            $j(".tabbers").removeClass("active");
            $j("#meetplan").show();
            $j("#details").hide();
            $j("#showplan").addClass('active');
          });
      $j("#showdetails").click(function() {
            $j(".tabbers").removeClass("active");
            $j("#details").show();
            $j("#meetplan").hide();
            $j("#showdetails").addClass('active');
            if (mlist.length > 10) {
              $j("#attend").addClass('tiny');
            } else {
              $j("#attend").removeClass('tiny');
            }
            var mylist = $j(".slotter:checked");
            var idlist = $j.map(mylist,function(e,i) { return (+e.id.substr(2).split('_')[1] + 1); }).join(',');
            disabled = doStatusCheck(idlist);
            $j("#savestatus").html(disabled);
            $j("#timeliste").html(idlist);
            if (disabled == '') {
              $j("#makemeet").removeAttr("disabled");
            } else {
              $j("#makemeet").attr("disabled","disabled");
            }
          });
      $j(".slotter").click(function(event) {
          // the code below is just to ensure that all chosen slots are selected from the same
          // day. You can not place a meeting over more than one day. You can have a meeting
          // where the slots are not adjacent
          var slotid = this.id.substr(2);
          var elm = slotid.split('_');
          if (activeday[elm[0]][elm[1]]) {
            delete activeday[elm[0]][elm[1]];
            if ($j.isEmptyObject(activeday[elm[0]]) ) {
              aday = '';
            }
          } else {
            if (aday == '' || aday == elm[0]) {
              activeday[elm[0]][elm[1]] = 1;
              aday = elm[0];
            } else {
              event.preventDefault();
            }
          }
        });
      $j("#makemeet").click(function() {
         var mylist = $j(".slotter:checked");
         var idlist = $j.map(mylist,function(e,i) { return (+e.id.substr(2).split('_')[1] + 1); }).join(',');
         minfo.title = $j("#msgtitle").val() || minfo.title;
         message = $j("#msgtext").val();
         var konf = $j('input[name=konf]:checked').val();
         var resroom = $j("#resroom").val();
         //$j("#info").html("Lagrer " + mylist.length);
         $j.post('/makemeet',{ chosen:Object.keys(userlist), current:jd, 
                       message:message, title:minfo.title, resroom:resroom,
                       konf:konf, roomid:minfo.roomid, day:aday, idlist:idlist, action:"insert" },function(resp) {
             $j.getJSON( "/getmeet", 
                  function(data) {
                     meetings = data;
                     freeTimeTable(userlist,minfo.roomid,minfo.delta);
             });
         });
       });
    }
    var refindFree = function (event) {
       minfo.roomid = +$j("#chroom").val() || minfo.roomid;
       if (event.type == 'click') {
         var teachid = +this.id.substr(2);
         $j(this).toggleClass("someabs");
         if (minfo.chosen[teachid] != undefined) {
           delete minfo.chosen[teachid];
         } else {
           minfo.chosen[teachid] = 0;
         }
       }
       freeTimeTable(minfo.chosen,minfo.roomid,minfo.delta);
    }
    $j("#stage").delegate(".tnames","click",refindFree);
    $j("#chroom").change(refindFree);
  });
}

