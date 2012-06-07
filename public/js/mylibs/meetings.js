// show/edit meetings

// global hash to ease change of state and reload of closures
minfo = {
   title      : ''
 , message    : ''       
 , ignore     : ''
 , kort       : ''      // true if shortmeeting (shortslots)
 , shortslots : {}      // for meetings lasting less than full slot
 , chosen     : {}
 , delta      : 0
 , roomid     : 0
 , sendmail   : true
 , response   : 'accept'
 , day        : ''
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
  var shortmeet = {};
  for (var day = 0; day < 5; day++) {
    biglump[day] = {};
    busy[day] = {};
    whois[day] = {};
    shortmeet[day] = {};
    for (var slot = 0; slot < 15; slot++) {
       biglump[day][slot] = $j.extend({}, userlist);
       biglump[day][slot][roomname] = 1;
    }
    // decimate based on existing meetings for teachers
    if (meetings[jd+day]) {
      var mee = meetings[jd+day];
      for (var muid in mee) {
        if (userlist[muid] != undefined) {
           for (var mmid in mee[muid]) {
            var abba = mee[muid][mmid];
            if (abba.slot) {
              var slot = +abba.slot - 1;
              if (slot >= 0 && slot < 15) {
                shortmeet[day][slot] =  'KortMøte';
                whois[day][slot] = teachers[muid].username;
              }
            } else {
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
    }
    // desimate based on absent teachers
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
       if (tt) for (var iid=0,k=tt.length; iid<k;iid++) {
         var ts = tt[iid];
         var day = +ts[0] % 7;
         var slot = ts[1];
         if (ts[2] && ts[2].substr(0,4).toLowerCase() == 'møte') continue;
         if (day == undefined || slot == undefined) continue;
         delete biglump[day][slot][+tuid];
       }
    }
  }
  return { biglump:biglump, whois:whois, busy:busy, rreserv:rreserv, shortmeet:shortmeet }
}

function doStatusCheck() {
  // returns enabled/disabled for save button
  var mylist = $j(".slotter:checked");
  var idlist = $j.map(mylist,function(e,i) { return (+e.id.substr(2).split('_')[1] + 1); }).join(',');
  if ($j("#msgtitle").val() == '' ) return 'Mangler emne for møtet';
  if ($j("#msgtext").val() == '' ) return 'Mangler beskrivelse for møtet';
  if ($j.isEmptyObject(minfo.chosen)) return 'ingen deltagere';
  if (minfo.roomid == 0) return 'mangler rom';
  var roomname = database.roomnames[minfo.roomid] || '';
  if (roomname == '' || roomname == 'nn') return 'mangler rom';
  if (idlist == '') return 'ingen timer valgt';
  return '';
}


function showWizInfo() {
  // update help tip in #wiz to reflect current state
  // We give hint depending on what is missing to make a meet
  // We have a function that does the same in doStatusCheck
  var wz = [];
  var mylist = $j(".slotter:checked");
  var idlist = $j.map(mylist,function(e,i) { return (+e.id.substr(2).split('_')[1] + 1); }).join(',');
  var roomname = database.roomnames[minfo.roomid] || '';
  if ($j.isEmptyObject(minfo.chosen)) {
    wz.push('Velg deltagere');
  }
  if (minfo.roomid == 0 || roomname == '' || roomname == 'nn') {
    wz.push('Velg rom for møtet');
  }
  if (idlist == '') {
    wz.push('Velg timer fra planen');
    if (wz.length < 2) {
      // particpants and room selected
      // ensure we can select a slot
      if($j(".slotter:checked").length == 0) {
         $j(".slotter").removeAttr('disabled');
      }
    }
  }
  if (wz.length > 2) {
    wz.push('<span title="Velg en elev i vis-timeplan, klikk på Husk,kom tilbake hit.">TIPS:møte om elev</span>');
  }
  if (wz.length == 0) {
    wz.push('Klikk på Møte info');
    $j("#showdetails").animate({ opacity:0.2  },200,function() { $j(this).animate({ opacity:1 },300);  }   );
  }
  if (wz.length < 2) {
    $j("#wiz").html(wz.join(''));
  } else {
    $j("#wiz").html('<ol><li>'+wz.join('</li><li>')+'</li></ol>');
  }
}

function meetTimeStart(timeslots,idlist,shortslots) {
      shortslots = typeof(shortslots) != 'undefined' ?  shortslots : {} ;
      var shotime = '';
      if (timeslots.length > 1) {
        var first = database.starttime[timeslots.shift()-1].split('-')[0];
        var last =  database.starttime[timeslots.pop()-1].split('-')[1];
        shotime = first + '-' + last +' ('+ idlist +' time)' ;
      } else if (idlist != '') {
        // this is a short meeting
        // shortslots is set of 5 min intervalls
        var min = -1, dur = 0;
        for (var ii=0; ii < 8; ii++) {
            if (shortslots[ii]) {
              if (min < 0) {
                min = 5*ii;
              }
              dur += 5;
            }
        }
        min = Math.max(min,0);
        dur = (dur == 0) ? 40 : dur;
        if (database.starttime[idlist]) {
           var first = database.starttime[idlist-1].split('-')[0];
           first = addTime(first,'0.'+min);
           last = addTime(first,'0.'+dur);
           shotime = first + '-' + last +'&nbsp; '+dur+'min. ('+ idlist +' time)' ;
           //shotime = first + ' ' + dur +'min ' +' ('+ idlist +' time)' ;
        }
      }
      return shotime;
}

function findFreeTime() {
  // show list of teachers - allow user to select and find free time
  $j.getJSON(mybase+ "/getmeet", function(data) {

    meetings = data.meetings;
    var stulist = [];  // names of studs if we have some in memory
    if (! jQuery.isEmptyObject(timeregister)) {
      // the teach has memorized someone 
      // find all teachers who teach this stud
      // and set chosen to this list
      for (var treg in timeregister) {
        if (students[+treg]) {
            var usergr = memgr[+treg] || null;
            if (usergr) {
              var astu = students[+treg];
              stulist.push(astu.firstname.caps() + " " + astu.lastname.caps());
              for (var i in usergr) {
                var group = usergr[i];
                var courselist = database.grcourses[group];
                for (var j in courselist) {
                  var cname = courselist[j] + '_' + group;
                  if (database.courseteach[cname]) {
                      var teachlist = database.courseteach[cname].teach;
                      for (var k in teachlist) {
                        var teachid = teachlist[k];
                        minfo.chosen[teachid] = 0;
                      }
                  }
                }
              }
            } 
        }
      }
    }
    var message = '';
    var s='<div id="timeviser"><h1 id="oskrift">Finn ledig møtetid for lærere</h1>';
    s += '<div class="gui" id=\"velg\">Velg rom for møte<select id="chroom">';
    //s+= '<option value="0"> --velg-- </option>';
    for (var i in database.roomnames) {
         var e = database.roomnames[i]; 
         s+= '<option value="'+i+'">' + e  +  "</option>";
    }
    s+= '</select><div id="wiz"></div></div>';
    s+= '<div id="freeplan"></div>';
    s+= '<div id="stage"></div>';
    s+= "</div>";
    $j("#main").html(s);
    var activeday = { "0":{}, "1":{}, "2":{}, "3":{}, "4":{} };
    var aday = '';
    choosefrom = $j.extend({}, teachers);
    // studChooser(targetdiv,memberlist,info,tabfield,fieldlist)
    var fieldlist = {AvdLeder:1,lastname:1, institution:1 };
    var remap ={ AvdLeder:{field:'institution', 
                 map:{ 'Realfag':'Berit', 'Samfunnsfag':'Eva', "Filologi":"Eva", 'Bibliotekar':"Eva",'Kontoret':'Atle',
                       'Musikk':'Erling', 'DansDrama':'Ruth', "Språk":'Ruth','IT':'Lest','Admin':'Kirsti'} }};
    studChooser("#stage",choosefrom,minfo.chosen,'institution', fieldlist,remap );
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
      if (stulist.length > 0) {
        minfo.title = minfo.title || 'Møte om elev' + ( (stulist.length > 1) ? 'er' : '' );
        message = message || stulist.join(',');
      }
      minfo.ignore = $j('input[name=ignore]:checked').val() || '';
      minfo.kort = $j('input[name=kort]:checked').val() || '';
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
      var shortmeet = re.shortmeet;
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
                      if (shortmeet[day][slot] != undefined) {
                       s += '<td title="'+tt+'" class="orangefont">'
                         + '<input rel="'+day+'" class="slotter shortslott" id="tt'+day+"_"+slot+'" type="checkbox"> LittLedig</td>';
                      } else {
                       s += '<td title="'+tt+'" class="greenfont">'
                         + '<input rel="'+day+'" class="slotter" id="tt'+day+"_"+slot+'" type="checkbox"> AlleLedig</td>';
                      }
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
      var kortcheck = (minfo.kort != '') ? 'checked="checked"' : '';
      var mlist = [];
      for (var uu in userlist) {
        mlist.push(teachers[uu].username);
      }
      var meetlist = mlist.join(', ');
      var mylist = $j(".slotter:checked");
      var idlist = $j.map(mylist,function(e,i) { return (+e.id.substr(2).split('_')[1] + 1); }).join(',');
      var save_status = doStatusCheck();
      var disabled = (save_status != '') ? 'disabled="disabled"' : '';
      var intervall = '';
      var slo = "00 05 10 15 20 25 30 35".split(' ');
      for (var ii = 0; ii < 8; ii++) {
        var taken = minfo.shortslots[ii] ? ' taken' : '';
        intervall += '<span class="inter'+taken+'" id="inter'+ii+'" >'+slo[ii]+'</span> ';
      }

      s += '<div id="reservopts">';
      s += '<table id="details" class="dialog gui">'
        +  '<caption id="capdetails">Møte info</caption>'
        +    '<tr id="detailsrow">'
        +      '<td><table class="dialog gui">'
        +        '<tr><th>Møte-tittel</th><td><input id="msgtitle" type="text" value="'+minfo.title+'"></td></tr>'
        +        '<tr><th>Beskrivelse</th><td><textarea id="msgtext">'+message+'</textarea></td></tr>'
        +        '<tr><th>Påmeldt</th><td><span id="attend">'+meetlist+'</span></td></tr>'
        +        '<tr><th>Møtetid (timer):</th><td><span id="timeliste">'+idlist+'</span></td></tr>'
        +        '<tr id="shortmeet"><th title="Angi intervall(5min) for møtet.">Kortmøte</th>'
        +        '<td><input id="kort" name="kort" '+kortcheck+' value="kort" type="checkbox"> '
        +        '<span id="shortslots">'+intervall+'</span></td></tr>'
        +        '<tr><th colspan="2"><hr /></th></tr>'
        +        '<tr><th title="Deltager kan ikke avvise møtet.">Obligatorisk</th>  <td><input name="konf" value="ob" type="radio"></td></tr>'
        +        '<tr><th title="Deltakere må avvise dersom de ikke kommer.">Kan avvise</th>    <td><input name="konf" value="deny" type="radio"></td></tr>'
        +        '<tr><th title="Deltakere må bekrefte at de kommer">Må bekrefte</th>'
        +             '<td><input checked="checked" name="konf" value="conf" type="radio"></td></tr>'
        +        '<tr><th colspan="2"><hr /></th></tr>'
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
      minfo.kort = $j('input[name=kort]:checked').val() || '';


      function takenSubSlots(dayslot) {
        // finds subslots that are already in use
        var day = +dayslot[0], slot = +dayslot[1];
        var mee = meetings[jd+day];
        for (var muid in mee) {
          if (userlist[muid] != undefined) {
             // this user is signed up for this meeting
             for (var mmid in mee[muid]) {
              var abba = mee[muid][mmid];
              if (abba.slot) {
                // now value will be the subslots already taken
                var taken = abba.value.split(',');
                for (var ii in taken) {
                  var tid = +taken[ii];
                  //freeslots[tid] = 0;
                  $j("#inter"+tid).addClass("already");
                }
              } 
             }
          }
        }
      }
      function checkToggleSave() {
            disabled = doStatusCheck();
            $j("#savestatus").html(disabled);
            if (disabled == '') {
              $j("#makemeet").removeAttr("disabled");
            } else {
              $j("#makemeet").attr("disabled","disabled");
            }
      }

      $j("#msgtext").change(checkToggleSave);
      $j("#msgtitle").change(checkToggleSave);
      $j("span.inter").click(function() {
         if ($j(this).hasClass('already')) return;
         if ($j('input[name=kort]:checked').val()) {
            $j(this).toggleClass('taken');
            var myid = this.id.substr(5);
            if (minfo.shortslots[myid]) {
              delete minfo.shortslots[myid];
            } else {
              minfo.shortslots[myid] = 1;
            }
          }
          var mylist = $j(".slotter:checked");
          var idlist = $j.map(mylist,function(e,i) { return (+e.id.substr(2).split('_')[1] + 1); }).join(',');
          var timeslots = idlist.split(',');
          $j("#timeliste").html( meetTimeStart(timeslots,idlist,minfo.shortslots) );
        });

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
              studChooser(targetdiv,memberlist,info,tabfield,fieldlist,remap);
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
            checkToggleSave();
            var mylist = $j(".slotter:checked");
            var idlist = $j.map(mylist,function(e,i) { return (+e.id.substr(2).split('_')[1] + 1); }).join(',');
            var timeslots = idlist.split(',');
            //$j('input[name=kort]').attr('checked',false);
            $j('input[name=kort]').attr('disabled',true);
            $j("#shortmeet").addClass('dimmed');
            if (timeslots.length < 2 && idlist != '') {
              $j("#shortmeet").removeClass('dimmed');
              $j('input[name=kort]').removeAttr('disabled');
            }
            $j("#timeliste").html( meetTimeStart(timeslots,idlist,minfo.shortslots));
          });
      $j(".slotter").attr('disabled',true).click(function(event) {
          // the code below is just to ensure that all chosen slots are selected from the same
          // day. You can not place a meeting over more than one day. You can not have a meeting
          // where the slots are not adjacent
          // Also if a slot is marked as a shortslott (some teach has a short meeting in
          // this slot) then you can not mark other slots in addition
          var sluts = $j('.slotter');
          var slotid = this.id.substr(2);
          var elm = slotid.split('_');
          if ($j(this).hasClass('shortslott')) {
            // some teach has a short meeting in this slot
            // we cannot choose another slot in addition - so disable checkboxes
            if ($j(this).attr('checked')) {
              sluts.attr('checked',false);
              sluts.attr('disabled',true);
              $j(this).removeAttr('disabled');
              $j(this).attr('checked',true);
              minfo.kort = true;
              $j('input[name=kort]').attr('checked',true);
              takenSubSlots(elm);
            } else {
              sluts.removeAttr('disabled');
              minfo.kort = '';
              $j('input[name=kort]').attr('checked',false);
            }
          } else {
            // just a normal slot - disable slots for other days
            // and slots that are not adjacent to a checked slot
            //  -- this so that meetings are contiguous
            if ($j(this).attr('checked')) {
              sluts.attr('disabled',true);
              //$j('.slotter[rel="'+elm[0]+'"]').removeAttr('disabled');
            } else if($j('.slotter:checked').length < 1) {
              // if we uncheck the last checked slot - enable all slots
              sluts.removeAttr('disabled');
            }
            // only the edges of the meeting can be extended/removed
            // so that holes cannot be made inside a meeting
            var adjacent = $j('.slotter[rel="'+elm[0]+'"]:checked');
            if (adjacent.length) {
              var dd = adjacent[0];
              // Illustration:
              //      u U C c c C U u
              //  (caps == enabled, u==unchecked, c == checked)
              // enable the edge and next unchecked slot
              $j("#"+dd.id).removeAttr('disabled');
              var elm = dd.id.substr(2).split('_');
              var day = +elm[0], slot = +elm[1];
              $j("#tt"+day+'_'+ (slot-1)).removeAttr('disabled');
              dd = adjacent[adjacent.length-1];
              // the other edge
              $j("#"+dd.id).removeAttr('disabled');
              elm = dd.id.substr(2).split('_');
              day = +elm[0], slot = +elm[1];
              $j("#tt"+day+'_'+ (slot+1)).removeAttr('disabled');
            }

          }


          var slotid = this.id.substr(2);
          var elm = slotid.split('_');
          if (activeday[elm[0]][elm[1]]) {
            delete activeday[elm[0]][elm[1]];
            if ($j.isEmptyObject(activeday[elm[0]]) ) {
              aday = '';
            }
          } else {
            //if (aday == '' || aday == elm[0]) {
              activeday[elm[0]][elm[1]] = 1;
              aday = elm[0];
            //} else {
              //event.preventDefault();
            //}
          }
          showWizInfo();
      });
      $j("#makemeet").click(function() {
         var mylist = $j(".slotter:checked");
         var idarr = $j.map(mylist,function(e,i) { return (+e.id.substr(2).split('_')[1] + 1); });
         var idlist = idarr.join(',');
         var first = database.starttime[idarr[0]-1].split('-')[0];
         minfo.title = $j("#msgtitle").val() || minfo.title;
         minfo.sendmail = $j('input[name=sendmail]:checked').val();
         var sendmail =  minfo.sendmail ? 'yes' : 'no';
         message = $j("#msgtext").val();
         var roomname = database.roomnames[minfo.roomid] || '';
         var konf = $j('input[name=konf]:checked').val();
         var resroom = $j("#resroom").val();
         var kort = $j('input[name=kort]:checked').val() || '';
         var shortslots = minfo.shortslots;
         $j.post(mybase+'/makemeet',{ chosen:getkeys(userlist), current:jd, meetstart:first,
                       kort:kort, shortslots:shortslots, roomname:roomname,
                       message:message, title:minfo.title, resroom:resroom, sendmail:sendmail,
                       konf:konf, roomid:minfo.roomid, day:aday, idlist:idlist, action:"insert" },function(resp) {
             $j.getJSON(mybase+ "/getmeet", 
                  function(data) {
                     meetings = data;
                     freeTimeTable(userlist,minfo.roomid,minfo.delta);
                     $j("#oskrift").html("Avtalen er lagra");
             });
         });
       });
       showWizInfo();
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
    showWizInfo();
  });
}

function myMeetings(meetid,delta) {
  // show list of meetings (your meetings)
  meetid = typeof(meetid) != 'undefined' ?  +meetid : 0;
  delta = typeof(delta) != 'undefined' ?  +delta : 0;    // week offset from current date
  $j.getJSON(mybase+ "/getmeet", function(data) {
    meetings = data.meetings;
    var s='<div id="timeviser"><h1 id="oskrift">Mine møter</h1>';
    s+= '<div id="freeplan"></div>';
    s+= '<div id="stage"></div>';
    s+= "</div>";
    $j("#main").html(s);
    var meetlist = [];
    var jd = database.startjd + 7*delta;
    for (var day = 0; day < 5; day++) {
      // decimate based on existing meetings for teachers
      if (database.thisjd > jd+day) {
        continue;
      }
      if (meetings[jd+day]) {
        var mee = meetings[jd+day];
        var minf = {};  
        // details of all meetings
        for (var uui in mee) {
          for (var mmi in mee[uui]) {
            var abb = mee[uui][mmi];
            if (!minf[abb.courseid]) {
               minf[abb.courseid] = {ant:0, ulist:[] };
            }
            minf[abb.courseid].ant ++;
            minf[abb.courseid].ulist.push(teachers[uui].username);
          }
        }
        // my meetings
        if (mee[userinfo.id]) {
          for (var mmid in mee[userinfo.id]) {
            var abba = mee[userinfo.id][mmid];
            var active = '';
            var shortslots;
            var avalue = abba.value;
            var idlist = abba.value.split(',');
            if (abba.slot >= 0) {
              // a short meeting
              shortslots = abba.value.split(',');
              idlist = abba.slot;
              avalue = abba.slot;
            }
            if (abba.id == meetid) active = ' active';
            var meetdate = julian.jdtogregorian(jd+day);
            var meetime =  meetTimeStart(idlist,avalue,shortslots);
            var meetdiv = '<div id="'+abba.courseid+'" class="meetlist'+active+'"><span class="meetinfo">' + abba.name
                          +'</span><span class="meetdato">' + meetime + ' ' + romdager[day]+' '
                          +meetdate.day+'.'+meetdate.month+'</span><span class="ulist">'
                          +minf[abba.courseid].ulist.join(',')+'</span><span class="meetroom">'+database.roomnames[abba.roomid]
                          +'</span></div>';
            meetlist.push(meetdiv);
          }
        }
      }
    }
    $j("#stage").html(meetlist.join(''));
    $j(".meetlist").click(function() {
       editMeeting(this.id,jd);
    });
  })
}


function editMeeting(meetingid) {
  // edit a specific meeting - you are owner
  $j.getJSON(mybase+ "/getmeeting", function(data) {
    var s='<div id="timeviser"><h1 id="oskrift">Rediger møte</h1>';
    s+= '<div id="stage"></div>';
    s+= '<div id="controls">'
        + '<div class="meetbutton">Slett</div>'
        + '<div class="meetbutton">Resend</div>'
        + '</div>';
    s+= "</div>";
    $j("#main").html(s);
    s = '';
    if ( data[userinfo.id] && data[userinfo.id][meetingid]) {
      var meet = data[userinfo.id][meetingid];
      var metinfo = JSON.parse(meet.value);
      var tslots = {};
      if (metinfo.kort) {
        // a short meeting - set timeslots (5min each)
        tslots = metinfo.shortslots;
      }
      var meetime =  meetTimeStart(metinfo.idlist.split(','),metinfo.idlist,tslots);
      s += '<h1>' + metinfo.title + '</h1>';
      s +=  metinfo.message + '<hr>';
      if (metinfo.sendmail == 'yes') {
        s+= '<br>Mail er sendt til deltakerne';
      }
      s += '<br>Time:' + meetime;
      s += '<br>Rom : ' + database.roomnames[meet.roomid];
      var teachlist = [];
      while( metinfo.chosen.length) {
        var teach = teachers[metinfo.chosen.pop()];
        teachlist.push( teach.firstname.caps() + ' '+ teach.lastname.caps() );
      }
      s += '<h3>Deltakere</h3><ul><li>'+teachlist.join('</li><li>') + '</ul>';
      s += (metinfo.kort) ? '<br>Short meeting' : '';
      
    } else {
      metinfo = 'No such meeting';
    }
    $j("#stage").html(s);
  })
}
