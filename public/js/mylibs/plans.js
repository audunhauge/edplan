// funksjoner for å vise fagplaner
// alle typer planer untatt timeplaner

function synopsis(coursename,plandata,tests) {
  // returns a synopsis of each week
  // this is a tiny timeplan for each week (drawn as tiny divs)
  // with all tests and events plotted in
  var prover = alleprover;
  var felms = coursename.split('_');
  var fag = felms[0];
  var gru = felms[1];
  var elever = memberlist[gru];
  var andre = getOtherCG(elever);
  //var events = database.aarsplan;
  var myttimer = (timetables && timetables.course) ? timetables.course[coursename] : [];
  var jd = database.firstweek;
  if (myplans && myplans[minfagplan]) {
      var pp = myplans[minfagplan];
      if (julian.jdtogregorian(jd).year < pp.start) {
        jd = database.nextyear.firstweek;
      }
  }
  var mytt = {};
  if (myttimer) {
    for (var i=0; i< myttimer.length;i++) {
       var pt = myttimer[i];
       if (!mytt[pt[1]]) {    // ingen rad definert ennå
           mytt[pt[1]] = {};  // ny rad
       }
       mytt[pt[1]][pt[0]] = 1;
    }
  }
  var synop = {};
  synop.andre = andre;
  synop.elever = elever;
  synop.gru = gru;
  synop.fag = fag;
  synop.mytt = mytt;
  var s = '';
  for (var i=0; i<10; i++) {
     for (var j=0; j<5; j++) {
        if (mytt[i] && mytt[i][j]) {
          s += '<div class="tinytt" style="top:'+(i*3)+'px; left:'+(j*6)+'px;"></div>';
        }
     }
  }
  var standard = s;
  var ulist = memberlist[gru];
  for (section in  plandata) {
    var s = '';
    var links = [];    // builds popup-buttons for test showing affected studs
    var heldag = [];    // full-day-tests for some or all studs in this group
    for (var j=0; j<5; j++) {
        pro = prover[jd+j];
        var title = [];
        var testitle = [];
        if (database.freedays[jd+j]) {
          title.push(database.freedays[jd+j]);
          s += '<div title="'+title.join('')+'" class="totip tinyfree" style="left:'+(j*6)+'px;"></div>';
        }
        var hd = database.heldag[jd+j];
        for (fag in hd) {
          if (coursename.indexOf(fag) >= 0) {  // whole day test/exam in this course
            title.push(fag+' '+hd[fag].value);
            s += '<div title="'+title.join('<br>')+'" class="totip tinyhd" style="left:'+(j*6)+'px;"></div>';
            if (!heldag[j]) heldag[j] = [];
            heldag[j].push(fag+' '+hd[fag].value);
          } else if ($j.inArray(fag.toUpperCase(),andre.fag) != -1) {  // other course - some of my students
            if (+hd[fag].klass == 1) {
              //TODO find the lessons affected, pick out with regexp (3,4,5) and test
              //against mytt
              //if (mytt[slot][day]
            }
            title.push(fag+' '+hd[fag].value);
            if (!heldag[j]) heldag[j] = [];
            heldag[j].push(fag+' '+hd[fag].value);
            s += '<div title="'+title.join('<br>')+'" class="totip tinyohd" style="left:'+(j*6)+'px;"></div>';
          }
        } 
        if (pro) {
          // var hdager = pro.hd[j].split('zz');
          // sjekk mot vanlige prøver i andre grupper
          for (k=0; k < pro.length; k++) {
              var progro = pro[k].shortname.split('_')[1];
              if (progro && $j.inArray(progro,andre.gru) != -1) {
                  var grlink = pro[k].shortname.split('_')[0];
                  var grheading = '<span class="uheader">' + pro[k].shortname + '</span>';
                  var popup = makepop(grlink,ulist,progro,gru,'group',grheading);
                  testitle.push(pro[k].shortname+' '+pro[k].username);
                  var tlist = pro[k].value.split(',');
                  var min = +tlist.shift();
                  var max = +tlist.pop() || min;
                  if (!links[j]) links[j] = [];
                  links[j].push('<ul class="nav">' + popup + '</ul>');
                  s += '<div title="'+testitle.join('<br>')+'" class="totip tinytest" style="left:'
                      +(j*6)+ 'px; top:'+ ((min-1)*3) +'px; height:'+(max+1-min)*3+'px; "></div>';
              }
          }
        }
    }
    synop[section] = {};
    synop[section].tiny = '<div class="tinytim">'+standard+s+'</div>';
    synop[section].links = links;
    synop[section].heldag = heldag;
    jd += 7;
  }
  return synop;
}

function vis_fagplaner(uid,thisjd) {
    // viser fagplaner for valgt bruker
    var minefag = getfagliste(uid);
    var s = '<table class="fagplaner">';
    s += '<caption>'+ss.plans.plans+'</caption>';
    s += ss.plans.headers;
    var haswb = '';
    for (var id in minefag) {
      var coursename = minefag[id];
      haswb = (inlogged && database.workbook[coursename]) ? 'workbook' : '' ;
      var plandata = courseplans[coursename];
      var jd = database.firstweek;
      for (section in  plandata) {
          if (jd == thisjd) {
            var summary = plandata[section]+'|||||'; 
            summary = summary.replace(/&amp;nbsp;/g,' ');
            summary = summary.replace(/\<br\>/g,' ');
            summary = summary.replace(/\<p\>/g,' ');
            summary = summary.replace(/\<p\>/g,' ');
            var elm = summary.split('|');
            var tema       = elm[0];
            var vurdering  = elm[1];
            var maal       = elm[2];
            var oppgaver   = elm[3];
            var logg       = elm[4];
            s += '<tr><td><span class="wb '+haswb+'" id="'+coursename+'">' + coursename + '</span></td><td>'+ tema + '</td><td>' + vurdering + '</td>'
               + '<td>' + maal + '</td><td>' + oppgaver + '</td><td>' + logg + '</td></tr>';
            break;
          }
          jd += 7;
      }
    }
    return s;
}

function show_alleprover(filter,faggrupper) {
    // filter lar deg velge fra [heldag,prøve]
    // faggrupper  { "3inf5":1,"3304":1,"3nor6":1 }
    //   bare vis prøver/heldag for fag/grupper
    promises.toggle_year = function() { 
          show_alleprover(filter,faggrupper);
        };
    if (showyear == 1) {
      $j("#main").html('<div id="timeplan">Though no one can go back and make a brand new start, anyone can start from now and make a brand new ending.</div>');
      return;
    }
    filter = typeof(filter) != 'undefined' ? filter : '';
    var thisweek = database.startjd;
    var s = "<table class=\"heldag\">";
    s += '<tr>'+ ss.weekheader+'</tr>';
    var i,j;
    var e;
    for (jd = thisweek; jd < database.lastweek; jd += 7 ) {
      //if (jd < thisweek) continue;
      s += "<tr>";
      s += '<th><div class="weeknum">'+julian.week(jd)+'</div><br class="clear" /><div class="date">' + formatweekdate(jd) + "</div></th>";
      for (j=0;j<5;j++) {
        var proveliste = '';
        var tdclass = '';
        if (database.freedays[jd+j]) {
          proveliste = database.freedays[jd+j];
          tdclass = ' class="fridag"';
        } else {
          var pr =  (!filter || filter.indexOf("prove") >= 0 ) ? alleprover[jd+j] || [] : [];
          var hd =  (!filter || filter.indexOf("heldag") >= 0 ) ? database.heldag[jd+j] || {} : {};
          for (fag in hd) {
              if (!faggrupper || faggrupper[fag]) {
                var cat = (category) ? category[fag] || 0 : 0;
                proveliste += '<span class="heldag klasse' + fag.substr(0,1) + ' cat' + cat  + '">' + fag + ' ' + hd[fag].value + '</span>';
              }
          } 
          for (var k=0; k< pr.length; k++) {
              var pro = pr[k];
              var faggruppe = pro.shortname.split('_');
              var fag = faggruppe[0];
              var gruppe = faggruppe[1];
              if (!faggrupper || faggrupper[gruppe] || faggrupper[pro.shortname] ) {
                var members = fag + " " + gruppe;
                if (memberlist && memberlist[gruppe]) {
                    // show members as a list (on hover)
                    var userlist = memberlist[gruppe];
                    var antall = userlist.length;
                    members = makepop(members,userlist,gruppe,'','','<span class="proveinfo">'+ pro.username 
                               + " " +pro.value+" ("+antall+' elever)</span>');
                    members = '<ul class="nav alleprover">' + members + '</ul>';
                }
                proveliste += '<span class="pro klasse'+fag[0]+' cat'+category[fag]+'">' + members + '</span>';
              }
          }
        }
        s += '<td'+tdclass+'>' + proveliste + "</td>";
      }
      s += "</tr>";
    }
    s += "</table>";
    $j("#main").html(s);
}    

function show_heldag() {
  $j.bbq.pushState("#hdtest");
  show_alleprover("heldag");
}

function show_prover() {
  var uid = database.userinfo.id || 0;
  var minefaggrupper = getUserSubj(uid);
  show_alleprover("",minefaggrupper);
}

function show_allstarbless() {
    $j.get(mybase+ "/getallstarblessdates", { },
    function(data) {
      starbdata = {};
      for (var i=0,j=data.length; i<j; i++) {
        less = data[i];
        if (!starbdata[less.julday]) {
          starbdata[less.julday] = [];
        }
        var teachname = teachers[less.teachid] || {username:''};
        var txt = teachname.username + ' ' + database.roomnames[less.roomid] + ' ' + less.name.substr(0,12);
        starbdata[less.julday].push(txt);
      }
      var events = database.yearplan;
      var thisweek = database.startjd;
      var s = "<table class=\"heldag\">";
      s += '<tr>'+ ss.weekheader+'</tr>';
      var i,j;
      var e;
      for (jd = thisweek; jd < database.lastweek; jd += 7 ) {
        //if (jd < thisweek) continue;
        e = events[Math.floor(jd/7)] || { pr:[],days:[]};
        s += "<tr>";
        s += '<th><div class="weeknum">'+julian.week(jd)+'</div><br class="clear" /><div class="date">' + formatweekdate(jd) + "</div></th>";
        for (j=0;j<5;j++) {
          var starbliste = '';
          var tdclass = '';
          if (database.freedays[jd+j]) {
            starbliste = database.freedays[jd+j];
            tdclass = ' class="fridag"';
          } else {
            if (starbdata[jd+j]) starbliste = '<div class="starblist rcorner">' + starbdata[jd+j].join('</div><div class="starblist rcorner">') + '</div>';
          }
          var txt = e.days[j] || '';
          txt = (txt) ? '<div class="myown">' + txt + '</div>' : '';
          s += '<td'+tdclass+'>' + starbliste + txt + "</td>";
        }
        s += "</tr>";
      }
      s += "</table>";
      $j("#main").html(s);
    });
}    


function getUserSubj(uid) {
  // finner alle prøver for en bruker
  var minefaggrupper = {};
  if (timetables && timetables.teach[uid]) {
    // we have a teach 
    // a teach dosn't have all the tests for a given group
    // a group may be connected to different subjects.
    var minefag = database.teachcourse[uid];
    for (var j in minefag) {
      var fagcourse = minefag[j];
      var faggruppe = fagcourse.split('_');
      var fag = faggruppe[0];
      minefaggrupper[fagcourse] = 1;
      minefaggrupper[fag] = 1;
    }
  } else {
    var usergr = memgr[uid] || null;
    if (usergr) {
      for (var i in usergr) {
        var group = usergr[i];
        var fagliste = database.grcourses[group];
        for (var k in fagliste) {
          var fag = fagliste[k];
          minefaggrupper[fag] = 1;
        }
        minefaggrupper[group] = 1;
      }
    } 
  }
  return minefaggrupper;
}

function show_all(thisweek,options) {
    // viser hele årsplanen (ikke prøver og heldag)
    promises.toggle_year = function() { 
          show_all(thisweek,options); 
        };
    options   = typeof(options) != 'undefined' ? options : 0;
    var hdchecked = (options & 1) ? 'checked="true"' : '';
    var tpchecked = (options & 2) ? 'checked="true"' : '';
    var xdchecked = (options & 4) ? 'checked="true"' : '';
    var events = database.aarsplan;
    var prover = alleprover;
    s = '<div class="centered sized1"><div id="editmsg">Kryss av for å vise hd og prøver.'
         + ((options > 0 ) ? 'Viser ' : '')
         + ((options & 1) ? ' heldagsprøver' : '')
         + ((options & 2) ? ' timeprøver' : '')
         + ((options & 4) ? ' utsatt eksamen' : '')
         + '</div>'
         + '<div id="options"><label for="usehd" class="hdliste">Heldag <input id="usehd"'+hdchecked+' type="checkbox"></label>'
         + '<label for="usexd" class="xdliste">Utsatt eksamen <input id="usexd"'+xdchecked+' type="checkbox"></label>'
         + '<label for="usetp" class="prliste">Timeprøver <input id="usetp" '+tpchecked+' type="checkbox"></label></div></div>';
    var theader ="<table class=\"year\" >"
     + "<tr><th>Uke</th><th>Man</th><th>Tir</th><th>Ons</th>"
     + "<th>Tor</th><th>Fre</th><th>Merknad</th></tr>";
    var tfooter ="</table>";
    s += theader;
    start = (showyear == 0) ? thisweek  : database.nextyear.firstweek; 
    stop =  (showyear == 0) ? database.lastweek  : database.nextyear.lastweek;
    var week = julian.week(start);
    if (week > 30 && week < 45) {
      s += "<caption>Første halvår</caption>";
    }
    if (week > 44 && week < 52) {
      s += "<caption>Første halvår II</caption>";
    }
    if (week < 13 ) {
      s += "<caption>Andre halvår</caption>";
    }
    var i,j;
    var e;
    var pro;   // dagens prover
    var txt;
    var cc;
    var tdclass;

    var events = database.yearplan;
    for (i= start; i < stop; i += 7) {
      e = events[Math.floor(i/7)] || { pr:[],days:[]};
      // add a page break if we pass new year
      if (julian.week(i) == "45") {
         s += tfooter + '<div class="page-break"></div><p>' + theader;
         s += "<caption>Første halvår II</caption>";
      }
      if (julian.week(i) == "1") {
         s += tfooter + '<div class="page-break"></div><p>' + theader;
         s += "<caption>Andre halvår</caption>";
      }
      if (julian.week(i) == "13") {
         s += tfooter + '<div class="page-break"></div><p>' + theader;
         s += "<caption>Andre halvår II</caption>";
      }
      pro = { pr:(prover[i] || []) , hd:(database.heldag[i] || [] ) };
      s += "<tr>";
      s += '<th><div class="weeknum">'+julian.week(i)+'</div><br class="clear" /><div class="date">' + formatweekdate(i) + "</div></th>";
      for (j=0;j<6;j++) {
        var xtra = '';
        var tlist = [];
        var totip = '';  // no tooltip so far
        var hd =  database.heldag[i+j];
        var xd =  database.xtrax[i+j];
        if (database.freedays[i+j]) {
          txt = database.freedays[i+j];
          tdclass = 'fridag';
        } else {
          tdclass = 'norm';
          if (j<5) {
            if (hd) tdclass += 'hd';
            if (hd && options & 1) {
              xtra += '<ul class="hdliste">';
                for (var f in hd) {
                  f = f.toUpperCase();
                  var cat = +database.category[f] || 0
                  xtra += '<li class="hdedit catt'+cat+'">'+f+'&nbsp;'+hd[f].value+'</li>';
                }
              xtra += '</ul>';
            }
            if (xd && options & 4) {
              xtra += '<ul class="xdliste">';
                for (var f in xd) {
                  xtra += '<li class="hdedit">'+f+'&nbsp;'+xd[f].value+'</li>';
                }
              xtra += '</ul>';
            }
          }
          if (prover[i+j]) tdclass += 'pr';
          if (options & 2 && prover[i+j] ) {
              xtra += '<ul class="prliste">';
                for (var f in prover[i+j]) {
                  var pro = prover[i+j][f];
                  var fag = pro.shortname;
                  var info = pro.value;
                  var cat = +database.category[fag.split('_')[0]] || 0
                  xtra += '<li class="hdedit catt'+cat+'">'+fag+'&nbsp;'+info+'</li>';
                }
              xtra += '</ul>';
              /*
              //tlist.push(countme(prover[i+j]) + ' prøver');
              tlist.push( 'Prøver<br>'+$j.map(prover[i+j],function(e,i) {
                      var val = e.value.replace(/1.+9/,"heldag");
                      return (""+ e.shortname + ' '+ e.username+' '+val);
                    }).join('<br>'));
              //xtra += '<span title="prøve" class="enprove">x</span>'; 
              xtra += ' prøve';
              */
          }
          //xtra = (xtra) ? '<div class="gui textcenter hinted">'+xtra+'</div>' : '';
          txt = (e.days[j] || '') + xtra;
        }
        var title = tlist.join('<br>'); 
        title = (title) ? 'title="'+title+'"' : '';
        s += '<td ' + title + ' class="'+tdclass+totip+'">' + txt + "</td>";
      }
      s += "</tr>";
    }
    s += "</table>";
    $j("#main").html(s);
    $j(".totip").tooltip({position:"bottom center" });
    $j("#usetp").click(function() {
          options ^= 2;
          show_all(thisweek,options);
        });
    $j("#usexd").click(function() {
          options ^= 4;
          show_all(thisweek,options);
        });
    $j("#usehd").click(function() {
          options ^= 1;
          show_all(thisweek,options);
        });
}

function getfagliste(uid) {
    var minefag = [];
    if (timetables && timetables.teach[uid]) {
      // we have a teach 
      isteach = true;
      minefag = database.teachcourse[uid];
      fagenemine = minefag;
    } else {
      var usergr = memgr[uid] || null;
      if (usergr) {
        for (var i in usergr) {
          var group = usergr[i];
          var fagliste = database.grcourses[group];
          for (var k in fagliste) {
            var fag = fagliste[k];
            if (fag == "KOMO") continue;
            minefag.push(fag+"_"+group);
          }
        }
      } 
    }
    return minefag;
}


function updateFagplanMenu() {
    // denne funksjonen kjøres ved onready etter at timeplanen for brukeren er lest
    // den oppdaterer menyen MinePlaner med en liste med fag
    // <a id="mineplaner"   href="#">Mine fagplaner</a>
    var uid = database.userinfo.id || 0;
    var minefag = getfagliste(uid);
    var s = '<a id="mineplaner"   href="#">Mine fag</a><ul>';
    if (isteach) {
      s += '<li><a href="#">FagPlaner</a><ul>';
    }
    for (var i in minefag) {
        var fag = minefag[i];
        s += '<li><a id="'+fag+'" href="#">' + fag + '</a></li>';
    }
    if (isteach) {
        s += '</ul></li>';
        s += '<li><a href="#">Prøveplaner</a><ul>';
        for (var i in minefag) {
            var fag = minefag[i];
            s += '<li><a id="prove_'+fag+'" href="#">' + fag + '</a></li>';
        }
        s += '</ul></li>';
        $j("#andref").after('<li><a id="oldfags" href="#">Gamle fagplaner</a></li>');
        $j("#oldfags").click(function(event) {
            event.preventDefault();
            oldplans();
        } );
    }
    s += '</ul>';
    database.userinfo.minefag = minefag;
    $j("#teachmenu").html(s);
    //$j("#mineplaner").after('<li><a href="">Prøveplaner</a></li>');
    for (var i in minefag) {
        var fag = minefag[i];
        $j("#prove_"+fag).click(function(event) {
            event.preventDefault();
            var fagnavn = $j(this).html();
            var plandata = courseplans[fagnavn];
            //$j.bbq.pushState("#mytests/"+fagnavn);
            edit_proveplan(fagnavn,plandata);
        } );
        $j("#"+fag).click(function(event) {
            event.preventDefault();
            var fagnavn = $j(this).html();
            var plandata = courseplans[fagnavn];
            //$j.bbq.pushState("#plans/"+fagnavn);
            visEnPlan(fagnavn,plandata,true);
        } );
    }
}

function oldplans() {
    // show list of old plans for copying
    $j.getJSON(mybase+ "/getallplans", { state:2 },
         function(data) {
             var s = '<div id="timeviser"><h1>Liste over gamle planer for kopiering</h1><ul class="nav"><li><a href="#">Skoleår</a><ul>';
             var grouping = {};
             for (var i in data) {
               var pinf = data[i];
               var rname = pinf.name;
               var fname = rname.split('_')[0];
               var gname = pinf.pname;
               var trinn = fname.substr(0,1);
               if (!(trinn == "1" || trinn == "2" || trinn == "3")) continue;
               if (!grouping[gname]) grouping[gname] = {};
               if (!grouping[gname][trinn]) grouping[gname][trinn] = {};
               if (!grouping[gname][trinn][fname]) grouping[gname][trinn][fname] = [];
               grouping[gname][trinn][fname].push([rname,pinf.id]);
             }
             for (var gg in grouping) {
               s += '<li><a href="#">' + gg + '</a><ul>';
               for (var tr in grouping[gg]) {
                 s += '<li><a href="#">' + tr + '</a><ul>';
                 for (var fgg in grouping[gg][tr]) {
                   if (grouping[gg][tr][fgg].length > 1) {
                     s += '<li><a href="#">' + fgg + '</a><ul><li><a class="elink" href="#"' 
                       + ($j.map(grouping[gg][tr][fgg],function(e,i) {
                                 return ' id="eg'+e[1]+'">'+e[0];
                             })).join('</a></li><li><a class="elink" href="#"')
                       //+ grouping[gg][tr][fgg].join('</a></li><li><a class="elink" href="#">') + '</a></li></ul></li>';
                       + '</a></li></ul></li>';
                   } else {
                     var egg = grouping[gg][tr][fgg][0][1];
                     s += '<li><a class="elink" href="#" id="eg'+egg+'" >' + fgg + '</a></li>';
                   }
                 }
                 s += '</ul></li>';
               }
               s += '</ul></li>';
             }
             s += '</ul></li></ul></div>';
             $j("#main").html(s);
             $j(".elink").click(function(event) {
                 event.stopPropagation()
                 var myid = this.id.substr(2);
                 $j.get(mybase+'/getaplan',{ planid:myid }, function(pplan) {
                      visEnPlan("showplan",pplan,true);
                   });
               });
         });
}

function vis_andreplaner() {
    var s="<div id=\"timeviser\"><h1>Andre fagplaner</h1><h4>Velg fra menyen Fagplaner-&gt;AndreFag ..</h4>";
    $j("#main").html(s);
}


// visEnPlan har flytta til rediger.js
// da den lar deg redigere dersom du er eier av planene

function teachattend() {
    // show my attendance (for teachers)
    var attention = {};
    if (allattend && allattend.teach[userinfo.id] ) {
      for (var i in  allattend.teach[userinfo.id]) {
        // i is julday
        var rid = allattend.teach[userinfo.id][i].room;
        var room = database.roomnames[rid] || 'uspes';
        attention[i] = room;
        if (allattend.teach[userinfo.id][i].studs.length) {
          var members = allattend.teach[userinfo.id][i].studs;
          var mempop = makepop(members.length,members,'','','');
          var mm = '<ul id="members" class="gui nav">' + mempop + '</ul>';
          attention[i] = room + ' ' + mm;
        }
      }
    } 
    var prover = alleprover;
    var theader ="<table class=\"year\" >"
     + "<tr><th>Uke</th><th>Man</th><th>Tir</th><th>Ons</th>"
     + "<th>Tor</th><th>Fre</th><th>Merknad</th></tr>";
    var tfooter ="</table>";
    var s = theader;
    start =  database.firstweek; 
    stop =   database.lastweek;
    var week = julian.week(start);
    var i,j;
    var e;
    var pro;   // dagens prover
    var txt;
    var thclass;
    var cc;

    var events = database.yearplan;
    for (i= start; i < stop; i += 7) {
      e = events[Math.floor(i/7)] || { pr:[],days:[]};
      s += "<tr>";
      thclass = '';
      s += '<th><div class="weeknum">'+julian.week(i)+'</div><br class="clear" /><div class="date">' + formatweekdate(i) + "</div></th>";
      for (j=0;j<6;j++) {
        if (database.freedays[i+j]) {
          txt = database.freedays[i+j];
          tdclass = 'fridag';
        } else {
          txt = (j == 5) ? (e.days[j] || '') : '';
          //txt = '';
          if (attention[i+j]) {
            tdclass='hd';
            var att = attention[i+j];
            txt = att;
          } else {
            tdclass = '';
          }
        }
        s += '<td class="'+tdclass+'">' + txt + "</td>";
      }
      s += "</tr>";
    }
    s += "</table>";
    $j("#main").html(s);
}

function myattend(stuid) {
    // show my attendance (for students)
    var attention = {};
    var elev = id2elev[stuid];
    if (database.daycount ) {
      for (var jd in database.daycount) {
        var ant = database.daycount[jd];
        var klassen = (database.klass && database.klass[elev.department][jd] && database.klass[elev.department][jd] > 4);
        if (ant > 40 && (!database.klass || klassen)) attention[jd] = 'UREG';
      }
    }
    if (allattend) {
      for (var jd in allattend.studs[stuid]) {
        var att = allattend.studs[stuid][jd];
        var teachname = teachers[att[0]] || {firstname:'', lastname:''};
        var txt = teachname.firstname.caps() + ' ' + teachname.lastname.caps() + ' ' + database.roomnames[att[1]];
        attention[jd] = txt;
      }
    } else if (attend) {
      for (var i=0; i< attend.length; i++) {
        var att = attend[i];
        att.teachname = teachers[att.teachid] || {firstname:'', lastname:''};
        var txt = att.teachname.firstname.caps() + ' ' + att.teachname.lastname.caps() + ' ' + att.name;
        attention[att.julday] = txt;
      }
    }
    var prover = alleprover;
    var theader ="<table class=\"year\" >"
     + "<tr><th>Uke</th><th>Man</th><th>Tir</th><th>Ons</th>"
     + "<th>Tor</th><th>Fre</th><th>Merknad</th></tr>";
    var tfooter ="</table>";
    var s = theader;
    start =  database.firstweek; 
    stop =   database.lastweek;
    var week = julian.week(start);
    var i,j;
    var e;
    var pro;   // dagens prover
    var txt;
    var thclass;
    var cc;

    var events = database.yearplan;
    for (i= start; i < stop; i += 7) {
      e = events[Math.floor(i/7)] || { pr:[],days:[]};
      // add a page break if we pass new year
      s += "<tr>";
      thclass = '';
      s += '<th><div class="weeknum">'+julian.week(i)+'</div><br class="clear" /><div class="date">' + formatweekdate(i) + "</div></th>";
      for (j=0;j<6;j++) {
        if (database.freedays[i+j]) {
          txt = database.freedays[i+j];
          tdclass = 'fridag';
        } else {
          txt = (j == 5) ? (e.days[j] || '') : '';
          if (attention[i+j]) {
            if (attention[i+j] == 'UREG') {
              txt = 'Ikke registrert';
              tdclass = 'redfont';
            } else {
              tdclass='hd';
              txt = attention[i+j];
            }
          } else {
            tdclass = '';
          }
        }
        s += '<td class="'+tdclass+'">' + txt + "</td>";
      }
      s += "</tr>";
    }
    s += "</table>";
    $j("#main").html(s);
}

function getreglist(roomid,julday) {
   // run for side-effect
   // as this is async
      $j.getJSON(mybase+"/elevstarb", { romid:roomid, julday:julday }, function(data) {
          if (data && data.elever) {
            var regliste = [];
            for (var id in data.elever) {
              var stu = data.elever[id];
              var enavn = stu.klasse+" " + niceName(stu);
              regliste.push( '<li class="regged" tag="'+enavn+'" id="rr'+stu.eid+'" >'+enavn+ '</li>');
            }
            $j("#registrert").html('<ul>' + regliste.sort().join('') + '</ul>'+regliste.length+" elever");
          }
      });
}

function niceName(stu) {
   return stu.lastname.substr(0,12).caps() + " " + stu.firstname.substr(0,12).caps();
}

function regstarb(julday,room) {
    // register starb for a teacher
    julday = typeof(julday) != 'undefined' ? +julday : database.thisjd;
    room = typeof(room) != 'undefined' ? room : 'R2';
    var greg = julian.jdtogregorian(julday);
    var regdato = greg.day + '.'+greg.month+'.'+greg.year;
    var roomid = database.roomids[room] || 0;
    var roomchooser = '<input id="chroom" type="text" value="'+room+'">';
    var s = '<h4>Starb-registrering '+roomchooser+' '+regdato+'</h3>';
    s += '<h4><span id="info">Skriv inn rom (autocomplete)</span> og klikk <div id="dostarbreg" class="button">velg rom</div></h4>';
    s += '<div id="regframe">';
    s += '<div id="registrert"></div>';
    s += '<div id="utvalgt"></div>';
    s += '<div id="elevliste"></div>';
    s += '<div id="klasseliste"></div>';
    s += '<div id="delete" class="delete" ></div>';
    s += '</div>';
    $j("#main").html(s);
    $j("#regframe").hide();
    $j("#delete").hide();
    $j("#chroom").autocomplete({ source:database.roomnames } );
    var valgte = [];
    var idvalgte = [];
    var klasser =  {};
    var kk = [];
    if (roomid != 0) {
      $j("#regframe").show();
      $j("#info").html("Velg elever");
      $j("#dostarbreg").html("Registrer");
      getreglist(roomid,julday);
    }
    $j("#registrert").delegate("li","click",function() {
        var pos = $j(this).position();
        var eid = this.id.substr(2);
        var th = $j(this);
        $j("#delete").unbind().show().css("top",pos.top+20).click(function() {
                  th.html("...SLETTER...");
                  $j.getJSON(mybase+"/fjernelev",{ romid:roomid, eid:eid, alle:0 }, function() {
                    getreglist(roomid,julday);
                    $j("#delete").hide();
                  });
        });
    } );
    $j("#registrert").delegate("li","click",function() {
        // use clicks on a registered student - delete
    });
    $j("#dostarbreg").click(function() {
       room = $j("#chroom").val().toUpperCase();
       newroomid = database.roomids[room] || 0;
       if (newroomid == 0 ) {
         alert("Velg rom først"); 
         return;
       }
       if (roomid == 0) {
         // user just chose a room
          roomid = newroomid;
          $j("#regframe").show();
          $j("#info").html("Velg elever");
          $j("#dostarbreg").html("Registrer");
          getreglist(roomid,julday);
          return;
       }
       if (valgte.length == 0 ) {
         alert("Velg elever først"); 
         return;
       }
       var starbelever = idvalgte.join(',');
       $j.getJSON(mybase+"/teachstarb", { starbelever:starbelever, julday:julday, roomid:roomid }, function(data) {
           regstarb(julday,room);
       });
    });
    for (var id in students) {
        var stu = students[id];
        if (stu.department && stud.department != '') {
            if (stu.department.substr(0,1).toLowerCase() == 's') continue;
            if (!klasser[stu.department]) {
                klasser[stu.department] = []
                kk.push('<li class="klassenvelger">'+stu.department+'</li>');
            }
            var enavn = niceName(stu);
            klasser[stu.department].push('<li class="elevenvelger" tag="'+enavn+'" id="ee'+stu.id+'">'+enavn+'</li>');
        }
    }
    var klasseliste = '<ul>' + kk.sort().join('') + '</ul>';
    $j("#klasseliste").html(klasseliste);
    $j(".klassenvelger").click(function() {
         var klassen = $j(this).html();
         var eliste = '<ul>' + klasser[klassen].sort().join('') + '</ul>';
         $j("#elevliste").html(eliste);
         for (var ii in idvalgte) {
           ieid = idvalgte[ii];
           $j("#ee"+ieid).hide();
         }
         $j(".elevenvelger").unbind();
         $j(".elevenvelger").click(function() {
                 var eid = +this.id.substr(2);
                 if ($j.inArray(eid,idvalgte) != -1) return;
                 idvalgte.push(eid);
                 $j(this).hide()
                 var elev = students[eid];
                 var enavn = elev.department + " " + niceName(elev);
                 valgte.push('<li class="valgte" tag="'+enavn+'" id="vv'+elev.id+'">'+enavn+'</li>');
                 $j("#utvalgt").html('<ul>'+valgte.sort().join('')+'</ul>' );
                     $j("#utvalgt").delegate("li","click",function() {
                        var eid = +this.id.substr(2);
                        $j("#ee"+eid).show();
                        var remains = [];
                        valgte = [];
                        for (var ii in idvalgte) {
                          ieid = idvalgte[ii];
                          if (ieid == eid) continue;
                          var elev = students[ieid];
                          var enavn = elev.department + " " + niceName(elev);
                          valgte.push('<li class="valgte" tag="'+enavn+'" id="vv'+elev.id+'">'+enavn+'</li>');
                          remains.push(ieid);
                          $j("#ee"+ieid).hide();
                        }
                        idvalgte = remains;
                        $j("#utvalgt").html('<ul>'+valgte.sort().join('')+'</ul>' );
                     });
                });
        });
}

function tabular_view(groupid) {
    // show attendance for a group in a grid
    var groupmem = memberlist[groupid] || [];
    var theader ='<table class="starbtab" >';
    var tfooter ="</table>";
    var s = '<div id="toggleview" class="button gui float">Siste uker</div>'+ theader;
    start =  database.firstweek; 
    stop =   database.lastweek;
    var week = julian.week(start);
    var i,j;
    var counting = {};
    var stuabs = {};
    var tot = 0;
    var antall = 0;
    s += "<tr><th>Dato</th>";
    for (var i in  groupmem) {
        var stuid = groupmem[i];
        var elev = id2elev[stuid];
        if (elev)  {
          counting[stuid] = 0;
          stuabs[stuid] = 0;
          antall++;
          s += '<td><div class="rel"><div id="stu'+stuid+'" class="angled stud">' + elev.firstname.caps()+ ' ' + elev.lastname.caps() + '</div></div></td>';
        }
    }
    s += "</tr>";
    var starbdays = [0,2,3];
    for (j= start; j < stop; j += 7) {
      s += "<tr>";
      s += '<th><div class="weeknum">'+julian.week(j)+'</div><br class="clear" /><div class="date">' + formatweekdate(j) + "</div></th>";
      for (var i in  groupmem) {
          var stuid = groupmem[i];
          if (!id2elev[stuid]) continue;
          var elev = id2elev[stuid];
          var txt = '';
          for (var k in starbdays) {
            var kk = starbdays[k];
            if (allattend.studs[stuid] && allattend.studs[stuid][j+kk]) {
              txt += '<div class="present"></div>';
              counting[stuid]++;
              tot++;
            } else if (!allattend.daycount[j+kk] || allattend.daycount[j+kk] < 60) {
              txt += '<div class="notabsent"></div>';
            } else if (allattend.klass[elev.department] && (!allattend.klass[elev.department][j+kk] || allattend.klass[elev.department][j+kk] < 3)) {
              txt += '<div class="freeabsent"></div>';
            } else if (allattend.klass[elev.department] && allattend.klass[elev.department][j+kk] < antall*0.2) {
              txt += '<div class="someabsent"></div>';
            } else {
              txt += '<div class="notpresent"></div>';
              stuabs[stuid]++;
            }
          }
          s += '<td title="'+(elev.firstname.caps())+'">' + txt + "</td>";
      }
      s += "</tr>";
    }
    var avg = tot/antall;
    s += "<tr><th>Antall</th>";
    for (var i in  groupmem) {
        var stuid = groupmem[i];
        elev = id2elev[stuid];
        if (elev)  {
          var tdclass = (counting[stuid] > avg) ? 'greenfont' : 'redfont';
          s += '<td class="'+tdclass+'">'+counting[stuid]+'-'+stuabs[stuid]+'</td>';
        }
    }
    s += "</tr>";
    s += '</table>';
    $j("#main").html(s);
    $j("#toggleview").click(function() {
            weekattend(groupid);
        });
    $j(".stud").click(function() {
            myattend(+this.id.substring(3));
        });
}

function weekattend(groupid) {
    // show attendance for a group in a grid
    var groupmem = memberlist[groupid] || [];
    var theader ='<table >';
    var tfooter ="</table>";
    var s = '<div id="toggleview" class="button gui float">Hele året</div>'+ theader;
    start =  database.firstweek; 
    stop =   database.lastweek;
    var week = julian.week(start);
    var i,j;
    var counting = {};
    var stuabs = {};
    var tot = 0;
    var antall = 0;
    for (var i in  groupmem) {
        var stuid = groupmem[i];
        var elev = id2elev[stuid];
        if (elev)  {
          counting[stuid] = 0;
          stuabs[stuid] = 0;
          antall++;
        }
    }
    var starbdays = [0,2,3];
    for (j= database.startjd; j > database.startjd-37; j -= 7) {
      s += "<tr>";
      s += '<th><div class="weeknum">'+julian.week(j)+'</div><br class="clear" /><div class="date">' + formatweekdate(j) + "</div></th>";
      var mistu = {};
      for (var i in  groupmem) {
          var stuid = groupmem[i];
          if (!id2elev[stuid]) continue;
          var elev = id2elev[stuid];
          for (var k in starbdays) {
            var kk = starbdays[k];
            if (allattend.studs[stuid] && allattend.studs[stuid][j+kk]) {
              counting[stuid]++;
              tot++;
            } else if (!allattend.daycount[j+kk] || allattend.daycount[j+kk] < 60) {
            } else if (allattend.klass[elev.department] && (!allattend.klass[elev.department][j+kk] || allattend.klass[elev.department][j+kk] < 3)) {
            } else if (allattend.klass[elev.department] && allattend.klass[elev.department][j+kk] < antall*0.2) {
            } else {
              if (!mistu[stuid]) {
                mistu[stuid] = '';
              }
              mistu[stuid] += ' '+dager[kk];
              stuabs[stuid]++;
            }
          }
      }
      var txt = '';
      for (var st in mistu) {
        var elev = id2elev[st];
        txt += '<tr><th>'+niceName(elev) + '</th><td>'+ mistu[st] + '</td></tr>';
      }
      s += '<td><table>'+txt+"</table></td></tr>";
    }
    s += '</table>';
    $j("#main").html(s);
    $j("#toggleview").click(function() {
            tabular_view(groupid);
        });
    $j(".stud").click(function() {
            myattend(+this.id.substring(3));
        });

}

function show_next4() {
    // vis neste fire uker
    promises.toggle_year = function() { 
          show_next4(); 
        };
    if (showyear == 1) {
      $j("#main").html('<div id="timeplan">Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.</div>');
      return;
    }
    var uid = database.userinfo.id || 0;
    var events = database.yearplan;
    var thisweek = database.startjd;
    var tests = add_tests(uid,thisweek).tests;
    var s = "<table class=\"uke next\">";
    s += '<tr>'+ss.weekheader+ '<th>'+ss.timetable.note+'</th></tr>';
    var i,j,k;
    var e,txt,pro;
    var jdclass;
    for (i=thisweek; i < thisweek+22; i+= 7) {
      e = events[Math.floor(i/7)] || {pr:[],days:[ [],[],[],[],[],[] ] };
      s += "<tr>";
      //s += "<th>"+julian.week(i)+'<br><span class="date">' + formatweekdate(i) + "</span></th>";
      s += '<th><div class="weeknum">'+julian.week(i)+'</div><br class="clear" /><div class="date">' + formatweekdate(i) + "</div></th>";
      for (j=0;j<6;j++) {
          tdclass = '';
          if (database.freedays[i+j]) {
            txt = database.freedays[i+j];
            tdclass = ' class="fridag"';
          } else {
            pro = tests[i+j];
            if (pro) {
              txt = "<span class=\"prove\">" + pro.shortname+ ' ' + pro.value + "</span>";
            } else {
              txt = "";
            }
            txt += e.days[j] || "";
            var hd = database.heldag[i+j];
            if (hd) {
                  txt += '<ul class="hdliste">';
                  for (var f in hd) {
                    var cat = +database.category[f] || 0
                    txt += '<li class="catt'+cat+'">'+f+'&nbsp;'+hd[f].value+'</li>';
                  }
                  txt += '</ul>';
            }
          }
          s += '<td'+tdclass+'>' + txt + "</td>";
      }
      s += "</tr>";
    }
    s += "</table>";
    $j("#main").html(s);
}


function makeplans() {
  var info = ''
    + 'Du kan lage nye planer som du siden kan koble til fag du underviser i. '
    + 'Planene legges basert på ukenummer (slik at de lett kan brukes om igjen). '
    + 'Typisk vil en bare måtte justere rundt høst,jul,vinter og påskeferie, noe'
    + ' som kan gjøres enkelt med dra og slipp kopiering.<br>'
    + 'En plan kan kobles til flere fag (f.eks du har to naturfag-grupper). '
    + 'Du kan finne og kopiere andre læreres planer (se knappen finn-plan). '
    + '';
  var s = '<div id="timeplan"><h1>Lag nye planer</h1>'+info+'</div>';
  s += '<div id="planlist"></div>';

  // popup editor for plans
  // you can connect a course to a plan
  // you can connect several courses to one plan
  s += '<div class="simple_overlay" id="testdialog">'
        +  '<h1>Rediger navn på plan</h1>'
        +  '<div id="edform"></div>'
        +  '<div class="centered sized3" >'
        +   '<form><table>'
        +   '<tr><td>Navn</td><td><input id="efag" type="text" /></td></tr>'
        +   '<tr><td>Fag</td><td><input id="esubject" type="text" /></td></tr>'
        +   '<tr><td>Start </td><td><input id="start" value="2011" type="text" /></td></tr>'
        +   '<tr><td>Er koblet til</td><td><div id="clist"></div></td></tr>'
        +   '<tr><td>Lag kobling til </td><td><div id="cc"></div></td></tr>'
        +   '</table></form>'
        +   '<div id="prolagre" class="close button gui float">Lagre</div> '
        +   '<div id="proavbryt" class="close button red gui float">Avbryt</div>'
        +  '</div>';
        + '</div>';
  $j("#main").html(s);
  $j.getJSON(mybase+ "/myplans",     // returns all your plans and all your courses
  function(data) {
       var ss = 'Dine planer:';
       var planlist = {};
       plannames = {};
       var courseids = [];   // all your courses 
       for (var i in data.plan) {
         var p = data.plan[i];
         if (!planlist[p.id]) {
           plannames[p.name] = p.id;
           planlist[p.id] = p;
           planlist[p.id].courses = [];
           planlist[p.id].ccex = {};  // quick check to fing courses not connected
           planlist[p.id].text = p.name + ' ' + p.subject 
         }
       }
       for (var j in data.course) {
         var co = data.course[j];
         if (planlist[co.planid]) {
           planlist[co.planid].courses.push([co.shortname,co.id]);
           planlist[co.planid].ccex[co.cid] = true;
         }
         courseids.push([co.shortname,co.id]);
       }
       for (var pid in planlist) {
         var plan = planlist[pid];
         var info = 'Rediger';
         if (plan.courses.length == 0) { 
           info += '<div class="killer">x</div> ';
         } else {
           var mycc = ($j.map(plan.courses,function(e,i) {
                return '<span class="choose" id="cc'+e[1]+'">'+e[0]+'</span>';
             })).join(', ');
           info += ' brukt av ' + mycc;
         }
         ss += '<div class="editlink"><div class="elink" id="ed'+plan.id+'" >'+plan.name
           + '</div><span rel="#testdialog" id="ppid'+pid+'" class="resme">'+info+'</span></div>';
       }
       ss += '<p><form>Navn : <input id="pname" type="text"> Fag :<input id="subject" type="text"></form><div id="addplan" class="button">Ny plan</div>';
       $j("#planlist").html( ss); 
       $j("div.elink").click(function() {
           event.stopPropagation()
           var myid = this.id.substr(2);
           $j.get(mybase+'/getaplan',{ planid:myid }, function(pplan) {
                visEnPlan("showplan",pplan,true);
             });
         });
       var inf;  // info about the plan we are editing
       var buttons = $j(".close").click(function (event) { 
         if (buttons.index(this) == 1) return;
         var choo = [];
         $j(".redfont").each(function(i,e) {
                choo.push(this.id.substr(2));
              });
         // we now have any new courses to connect to this plan
         $j.post(mybase+ "/modifyplan", { "operation":'connect',"planid":inf.id, "connect":choo.join(',') },
            function(msg) {
              makeplans();
            });
         var start   = $j("#start").val();
         var pname   = $j("#efag").val();
         var subject = $j("#esubject").val() || pname.split(/[ _]/)[0];
         if (inf.start != start) {
             $j.post(mybase+ "/modifyplan", { "operation":'editplan',"planid":inf.id, "start":start, "pname":pname, "subject":subject },
                function(msg) {
                  makeplans();
                });
         }
       });

       // chooser is used to choose a course to connect to this plan
       // we assume that the update in node takes care of
       // removing other connections
       // update plan set courseid = 0 where courseid = ?
       // update plan set courseid = ? where id = ?
       var chooser = ($j.map(courseids,function(e,i) {
                return '<span class="choose" id="cc'+e[1]+'">'+e[0]+'</span>';
             })).join(' ');

       // legg til overlay-editoren
       var triggers = $j("span.resme").click(function() {
            var id = $j(this).attr('id').substr(4);
            inf = planlist[+id];
            var chooser = ($j.map(inf.courses,function(e,i) {
                return '<span>'+e[0]+'</span>';
             })).join(' ');
            var candi = ($j.grep(courseids,function(e,i) {
                return !inf.ccex[e[1]] ;
             }));
            var candid = ($j.map(candi,function(e,i) {
                return '<span class="choose" id="cc'+e[1]+'">'+e[0]+'</span>';
             })).join(' ');
            $j("#efag").val(inf.name);
            $j("#start").val(inf.start);
            $j("#esubject").val(inf.subject);
            $j("#clist").html(chooser);
            $j("#cc").html(candid);
            $j(".choose").click(function() {
                 $j(this).toggleClass("redfont");
              });

         }).overlay({ 
                mask: {
                        color: '#ebecff',
                        loadSpeed: 200,
                        opacity: 0.8
                },
                closeOnClick: false });
       $j(".killer").click(function() {
           event.stopPropagation()
           var myid = $j(this).parent().attr('id');
           $j.post(mybase+ "/modifyplan", { "operation":'delete',"planid":myid.substr(4) },
            function(msg) {
              makeplans();
            });
           });
       $j("#addplan").click(function() {
          var pname   = $j("#pname").val();
          var subject = $j("#subject").val() || pname.split(/[ _]/)[0];
          $j.post(mybase+ "/modifyplan", { "operation":'newplan',"pname":pname, "subject":subject },
            function(msg) {
              makeplans();
            });
       });
    });
}


