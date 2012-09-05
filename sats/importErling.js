/*
 * Scan thru an export file from NOVA Schem and load in data
 * THIS is an updating run - so only make changes - don't insert existing elements
 * First pick up timeslots (start-time for lessons)
 *   create a function for finding timeslot for bad start-times
 *   some slot-assignments don't follow the slots - force them into nearest
 * Next pick up all rooms, create a hash roomname -> id  for later use
 * Make a list of all subjects (but dont insert them yet - wait till we have
 * courses also.
 * Pick up all teachers and insert them first as users, (id > 10000,
 * department= Undervisning
 * Pick up all studs, use same id as in novaschem (assumed  < 10000)
 *   but only insert a student when we have a group assignment (later for groups)
 * Pick up groups, insert them, get memberlist and then insert all studs who
 * are members - then insert into members
 * Finally read slot-assignments (teach,day,slot,room,group,subject)
 * and create subjects courses (teachers timetable) in that order
 *
*/

function notMember(base,some) {
  // given a group with base members
  // return items in some that are NOT members
  var nomem = [];
  for (var i in some) {
    var so = some[i];
    if (base.indexOf(so) >= 0) {
       nomem.push(so);
    }
  }
  return nomem;
}

var autgroups = '2MUA,1MDA,1MDB,3MUA,1DAN,1DRA,2DDA,3DDA,3DAN'.split(',');
// erling is auth for these - no others
// so all studs in these groups are ruled by erling
// ignore erling for all others

var time2slot;

var db = {};
var pg = require('pg');
var sys = require('sys');
var connectionString = "postgres://admin:123simple@localhost/planner";
fs = require('fs');
var client;
var after = function(callback) {
    return function(err, queryResult) {
      if(err) {
        console.log("Error! " + sys.inspect(err));
      }
      callback(queryResult)
    }
  }
pg.connect(connectionString, after(function(cli) {
    client = cli;
    console.log("connected");
    slurp(client);
  }));


function slurp(client) {
  client.query( 'select * from users ', after(function(results) {
      db.users = {};
      db.groups = {};
      db.plan = {};
      db.usernames = {};  // hashed on lastname+firstname -- used to check for double regs
      // not all doubles are invalid - some are two users with same name
      // these need to be inspected by teach/admin
      for (var ii in results.rows) {
        var u = results.rows[ii];
        db.users[u.username] = u;
        db.usernames[u.lastname+u.firstname] = u;
      }
      client.query( 'select max(id) from users', after(function(results) {
          db.usersmaxid = results.rows[0].max;
          client.query( 'select * from groups', after(function(results) {
              for (var ii in results.rows) {
                var g = results.rows[ii];
                db.groups[g.groupname] = g;
              }
              client.query( 'select max(id) from groups', after(function(results) {
                  db.groupmaxid = results.rows[0].max;
                  client.query( "select distinct members.userid from members inner join groups on (groups.id = members.groupid) "
                      + " where groupname in ('2MUA','1MDA','1MDB','3MUA','1DAN','1DRA','2DDA','3DAN','3DDA')", after(function(results) {
                      // list over studs that erling rules
                      db.mddstuds = {};
                      for (var ii in results.rows) {
                        var mdd = results.rows[ii];
                        db.mddstuds[mdd.userid] = 1;
                      }
                      //console.log(db.mddstuds);
                      client.query( "select * from members ", after(function(results) {
                          // list over all members in groups
                          db.groupmem = {};
                          for (var ii in results.rows) {
                            var gm = results.rows[ii];
                            if (!db.groupmem[gm.groupid]) db.groupmem[gm.groupid] = [];
                            db.groupmem[gm.groupid].push(gm.userid);
                          }
                          client.query( "select * from enrol ", after(function(results) {
                              // 
                              db.enrol = {};
                              db.genrol = {};
                              for (var ii in results.rows) {
                                var en = results.rows[ii];
                                db.enrol[en.courseid] = en.groupid;
                                db.genrol[en.groupid] = en.courseid;
                              }
                              client.query( "select * from course ", after(function(results) {
                                  // list over all members in groups
                                  db.course = {};
                                  for (var ii in results.rows) {
                                    var cc = results.rows[ii];
                                    db.course[cc.shortname] = cc;
                                  }
                                  client.query( "select * from subject ", after(function(results) {
                                      // list over all subjects
                                      db.subject = {};
                                      db.subjectmax = 0;
                                      for (var ii in results.rows) {
                                        var ss = results.rows[ii];
                                        db.subject[ss.subjectname] = ss;
                                        if (ss.id > db.subjectmax) db.subjectmax = ss.id;
                                      }
                                      client.query( 'select max(id) from course', after(function(results) {
                                          db.coursemaxid = results.rows[0].max;
                                          client.query( 'select * from calendar', after(function(results) {
                                              db.calendar = {};
                                              for (var ii in results.rows) {
                                                var cc = results.rows[ii];
                                                if (!db.calendar[cc.teachid]) db.calendar[cc.teachid] = {};
                                                if (!db.calendar[cc.teachid][cc.day]) db.calendar[cc.teachid][cc.day] = {};
                                                db.calendar[cc.teachid][cc.day][cc.slot] = 1;
                                              }
                                              //console.log(db.calendar);
                                              client.query( 'select * from teacher', after(function(results) {
                                                  db.teacher = {};
                                                  db.courseteach = {};
                                                  for (var ii in results.rows) {
                                                    var tt = results.rows[ii];
                                                    if (!db.teacher[tt.userid]) db.teacher[tt.userid] = [];
                                                    db.teacher[tt.userid].push(tt.courseid);
                                                    db.courseteach[tt.courseid] = tt.userid;
                                                  }
                                                  client.query( 'select * from room', after(function(results) {
                                                      db.room = {};
                                                      for (var ii in results.rows) {
                                                        var tt = results.rows[ii];
                                                        db.room[tt.name] = tt.id;
                                                      }
                                                      client.query( 'select max(id) from plan', after(function(results) {
                                                          db.planmaxid = results.rows[0].max;
                                                          client.query( 'select * from plan where periodeid = 8 ', after(function(results) {
                                                            for (var ii in results.rows) {
                                                              var tt = results.rows[ii];
                                                              db.plan[tt.name] = tt.id;
                                                            }
                                                            process(client);
                                                          }));
                                                      }));
                                                  }));
                                              }));
                                          }));
                                      }));
                                  }));
                              }));
                          }));
                      }));
                  }));
              }));
          }));
      }));
  }));
}

function process(client) {
fs.readFile('erling_utf8.txt', 'utf8',function (err, data) {
  if (err) throw err;
  data = data.replace(/\r\n/g,'\n');
  var lines = data.split('\n');
  var i = 0;
  var l = lines.length;
  while (i < l) {
    var line = lines[i];

    if ( line.substr(0,8) == 'STANDARD' || line.substr(0,3) == 'Nr1') {
      i++;
      var slots = {};
      var elm = line.split('\t');
      var starttimes = elm[2].split(', ');
      for (var si in starttimes) {
        var sta = starttimes[si];
        slots[sta] =  +si;
      }
      // slots is a converter from start-time to slot number for timetable
      time2slot = function(t) {
        if (slots[t] != undefined) return slots[t];
        var ret = 0;
        var telm = t.split(':');
        var th = +telm[0];
        var tm = +telm[1] || 0;
        for (var slo in slots) {
            ret = slots[slo];
            var selm = slo.split(':');
            var sh = +selm[0];
            var sm = +selm[1];
            if (sh > th) break;
            if (Math.abs((sh*60+sm) - (th*60+tm)) <= 20) break;
        }
        if (th > sh) {  // we have gone beyond the table
            if (((th*60+tm) - (sh*60+sm)) > 40) {
                ret = ret + Math.floor(((th*60+tm) - (sh*60+sm))/40);
            }
        }
        return ret;
      };
    }

    if ( line.substr(0,14) == 'Subject (6401)' ) {
      i++;
      var subjects = [];
      var subjid = db.subjectmax + 1;
      var subjtab = {};
      do {
        line = lines[i];
        i++;
        if (line == '') break;
        var elm = line.split('\t');
        if (db.subject[elm[0]]) continue;
        subjects.push("("+subjid+",'"+elm[0].substr(0,42)+"','"+elm[3]+"')");
        subjtab[elm[0]] = subjid;
        subjid++;
      } while (i < l )
      var subjectlist = subjects.join(',');
      console.log('insert into subject (id,subjectname,description) values '+ subjectlist);
      //client.query('insert into subject (id,subjectname,description) values '+ subjectlist);
      
    }



    if ( line.substr(0,14) == 'Teacher (6001)' ) {
      i++;
      var teachers = [];
      var teachid = db.usersmaxid + 1;
      var teachtab = {};  // translate init4 to id
      do {
        line = lines[i];
        i++;
        if (line == '') break;
        var elm = line.split('\t');
        var firstname = elm[6].toLowerCase();
        var lastname = elm[4].toLowerCase();
        if (db.users[elm[0]]) {
          teachtab[elm[0]] = db.users[elm[0]].id;
          continue;
        }
        teachers.push("( " + teachid + ", '"+elm[0]+"','"+elm[0]+"','"+firstname+"','"+lastname+"','"+elm[8]+"','Undervisning' )");
        teachtab[elm[0]] = teachid;
        teachid++;
      } while (i < l )
      var teachlist = teachers.join(',');
      //console.log('insert into users (id,username,password,firstname,lastname,email) values '+ teachlist);
      if (teachlist != '' ) { 
          client.query( 'insert into users (id,username,password,firstname,lastname,email,department) values '+ teachlist,
            after(function(results) {
                console.log('TEACHERS INSERTED');
          })) 
      } else {
          console.log("NO NEW TEACHERS");
      }
    }
    
    var students = [];
    if ( line.substr(0,14) == 'Student (7201)' ) {
      i++;
      var aspirants = {};
      do {
        line = lines[i];
        i++;
        if (line == '') break;
        var elm = line.split('\t');
        var firstname = elm[4].toLowerCase();
        var lastname = elm[3].toLowerCase();
        //if (db.users[elm[0]]) continue;  // this stud already registered
        if (!db.mddstuds[elm[0]]) continue;  // erling is not auth for this stud
        if (!db.users[elm[0]] && db.usernames[lastname+firstname]) {
            console.log("POSSIBLE DOUBLE -- ",elm[0],firstname,lastname,elm[5]); console.log(db.usernames[lastname+firstname]);
            continue;
        }
        aspirants[ elm[0] ] = "("+elm[0]+", '"+elm[0]+"','"+elm[0]+"','"+firstname+"','"+lastname+"','"+elm[5]+"','Student' )";
        // aspirants will only be added as studs if they are assigned to at least one group
      } while (i < l )
      //console.log(aspirants);
      
    }

    if ( line.substr(0,12) == 'Group (6201)' ) {
      i++;
      var groups = [];
      var groupmem = {};  // hash of groupname:[ members ... ]
      var grouptab = {};  // group name to grid
      var memberlist = [];
      var grid = db.groupmaxid+1;
      do {
        line = lines[i];
        i++;
        if (line == '') break;
        var elm = line.split('\t');
        if (!db.groups[elm[0]]) { 
            groups.push("("+grid+",'"+elm[0]+"' )");
            groupmem[grid] = elm[5];
            grouptab[elm[0]] = grid;
            grid++;
        } else {
            // group exists - fetch existing members
            var ggid = db.groups[elm[0]].id;
            var newmems = elm[5].split(',');
            var existingmems =  db.groupmem[ggid];
            if (existingmems) {
              var numembers = notMember(existingmems,newmems);
            } else {
              var numembers = newmems;
            }
            // only accept changes for members of mdd
            for (var nn in numembers) {
              var nnu = numembers[nn];
              if (db.mddstuds[nnu]) {
                memberlist.push( "("+nnu+","+ggid+")" );
              }
            }
        }
      } while (i < l )
      //console.log("NEW MEMBERLIST");
      //console.log(memberlist);
      //console.log(db.mddstuds);
      var grouplist = groups.join(',');
      if (grouplist != '') {
          //console.log( 'insert into groups (id,groupname) values '+ grouplist);
          client.query( 'insert into groups (id,groupname) values '+ grouplist,
                 after(function(results) {
                    console.log('GROUPS INSERTED');
          }));
      }
      for (var gr in groupmem) {
              if (groupmem[gr] == '') continue;
              var mem = groupmem[gr].split(',');
              for (var mi in mem) {
                  var memid = mem[mi];
                  if (aspirants[memid] && !db.users[memid] ) {
                      // we have a student who is a member of a group
                      // AND this is a new stud (not registered)
                      students.push(aspirants[memid]);
                      delete aspirants[memid];
                  }
                  memberlist.push( "("+memid+","+gr+")" );
              }
      }
      memberlistvalues = memberlist.join(',');
      var studlist = students.join(',');
      //console.log(memberlistvalues);
      //console.log(studlist);
      // insert of studs is done here so that we can add them as members of groups
      if (studlist != '') {
          client.query(
            'insert into users (id,username,password,firstname,lastname,email,department) values '+ studlist,
              after(function(results) {
                  //console.log('STUDENTS INSERTED',studlist);
                  client.query( 'insert into members (userid,groupid) values ' + memberlistvalues,
                    after(function(results) {
                        //console.log("ADDED MEMBERS",memberlistvalues);
                  }));
          }));
      } else if (memberlistvalues != '') {
              client.query( 'insert into members (userid,groupid) values ' + memberlistvalues,
                after(function(results) {
                    //console.log("ADDED MEMBERS",memberlistvalues);
              }));
      }
      
    }
    
    if ( line.substr(0,9) == 'PK (7100)' ) {
      i++;
      var timetable = {}
      var courses = {};   // create a course for each unique subject_group
      var enrol = [];     // enrol groups in courses
      var courselist = [];
      var teachlist = [];
      var planlist = [];     // create a plan for each course
      var weekplanlist = []; // create 47 weekplans for each plan
      var updatecourselist = []; // courses that need connecting to new plans
      var ttlist = [];
      var cid = db.coursemaxid + 1;
      var pid = db.planmaxid + 1;
      do {
        line = lines[i];
        i++;
        if (line == '') break;
        var elm = line.split('\t');
        var day=elm[2],start=elm[3],dur=elm[4],subj=elm[6],teach=elm[7],group=elm[8],room=elm[9];
        var slot = time2slot(start);
        //if (slot == '' || slot == undefined) continue;
        if (day == '') continue;
        if (teach == '') continue;
        var subj_group = subj.substr(0,9) + '_' + group.substr(0,10);
        //if (!db.course[subj_group] && !courses[subj_group]) {
        if (!courses[subj_group]) {
            // we have not hit this course before IN THIS TEXTFILE
            // it may exist in postgres
            if (db.course[subj_group]) {
              // this course exists in database - does it have a plan ?
              if (!db.plan[subj_group]) {
                  console.log("LOOOOOOOK ",subj_group);
                  // existing course with no plan
                  courses[subj_group] = [cid,teach,group,room];
                  // mark the course as up-to-date
                  console.log(subj_group);
                  var exc = db.course[subj_group]; // existing course
                  var teachid = db.courseteach[exc.id];
                  if (teachid) {
                        planlist.push( "("+pid+",'"+subj_group+"',"+teachid+")" );
                        updatecourselist.push( "("+exc.id+","+pid+")" );
                        pid++;
                  }
              }
            } else {
              courses[subj_group] = [cid,teach,group,room];
              if (db.subject[subj]) {
                var subjid = db.subject[subj].id ;
              } else {
                if (subjtab[subj]) {
                  var subjid = subjtab[subj];
                } else {
                  var subjid = 1;
                  console.log("No subject for ",subj);
                }
              }
              if (!grouptab[group] && !db.groups[group] ) {
                console.log("No group for ",teach,room,day,start,group,subj);
                var grid = 1;
              } else {
                var grid = grouptab[group] || db.groups[group].id; 
              }
              if (grid > 1) {
                enrol.push( "("+cid+","+grid+")" );
              }
              var telm = teach.split(',');
              var needplan = true;
              for (var tt in telm) {
                  var tti = telm[tt];
                  var tid = teachtab[tti];
                  if (tid) {
                    teachlist.push( "("+cid+","+tid+")" );
                    if ( db.plan[subj_group] )  {
                      console.log("Existing plan for ",subj_group);
                      continue;
                    }
                    if (needplan) {
                      planlist.push( "("+pid+",'"+subj_group+"',"+tid+")" );
                      needplan = false;
                    }
                  }
              }
              courselist.push( "("+cid+",'"+subj_group+"','"+subj_group+"',"+subjid+",1)" );
              for (var wi=0; wi < 48; wi++) {
                  weekplanlist.push('('+pid+','+wi+')');
              }
              cid++;
              pid++;
            }
        }
        var mycid = (db.course[subj_group]) ? db.course[subj_group].id :  courses[subj_group][0];
        var telm = teach.split(',');
        var relm = room.split(',');
        if (telm.length > 1) console.log("2 teachers ",teach,dur,day,slot,subj,group,room);
        if (relm.length > 1) console.log("2 room ",teach,dur,day,slot,subj,group,room);
        for (var tt in telm) {
            var midura = dur;
            var mislot = slot;
            var tti = telm[tt];
            var tid = teachtab[tti];
            //console.log("Looking at ",tti,tid);
            if (tid) {
                if (db.calendar[tid] && db.calendar[tid][day] &&  db.calendar[tid][day][slot]) {
                  //console.log( "Skipping "+tti+","+day+","+mislot+",'"+subj_group+"','"+room );
                  continue;
                }
                if (!timetable[tti]) timetable[tti] = {};
                if (!timetable[tti][day]) timetable[tti][day] = {};
                do {
                    if (timetable[tti][day][mislot]) {
                        console.log("double booking for ",tti,day,mislot,subj,group,room);
                    } else {
                      for (var rr in relm) {
                        rri = relm[rr];
                        timetable[tti][day][mislot] =  [subj,group,rri] ;
                        var rid = db.room[rri] || 1;
                        ttlist.push( "(2456153,"+tid+","+rid+","+mycid+",'timetable',"+day+","+mislot+",'"+subj_group+"','"+rri+"')" );
                      }
                    }
                    midura -= 40;
                    mislot++;
                } while (midura > 0);
            }
        }


        //console.log(i,"  day="+day,"start="+start,"slot="+slot,"dur="+dur,"subj="+subj,"teach="+teach,"group="+group,"room="+room);
      } while (i < l )
      //console.log("PLANLIST = ",planlist);
      var courselistvalues = courselist.join(',');
      var enrolvalues = enrol.join(',');
      var planlistvalues = planlist.join(',');
      var teachvalues = teachlist.join(',');
      var calendarvalues = ttlist.join(',');
      console.log(planlistvalues);
      //console.log(updatecourselist);
      //console.log(courselistvalues);
      //console.log( 'insert into teacher (courseid,userid) values '+ teachvalues);
      if (planlistvalues != '') {
                //console.log('insert into plan (id,name,userid) values '+ planlistvalues);
                client.query( 'insert into plan (id,name,userid) values '+ planlistvalues,
                    after(function(results) {
                       console.log('PLANS INSERTED');
                         if (courselistvalues) {
                         //console.log( 'insert into course (id,shortname,fullname,subjectid,planid) values '+ courselistvalues);
                         client.query( 'insert into course (id,shortname,fullname,subjectid,planid) values '+ courselistvalues,
                         after(function(results) {
                            console.log('COURSES INSERTED');
                            client.query( 'insert into enrol (courseid,groupid) values '+ enrolvalues,
                                     after(function(results) {
                                        console.log('COURSES ENROLLED');
                                 }));
                            //console.log( 'insert into teacher (courseid,userid) values '+ teachvalues);
                            client.query( 'insert into teacher (courseid,userid) values '+ teachvalues,
                                     after(function(results) {
                                        console.log('TEACHERS ASSIGNED');
                                 }));
                            if (calendarvalues != '') {
                              //console.log( 'insert into calendar (julday,teachid,roomid,courseid,eventtype,day,slot,name,value) values '+ calendarvalues);
                              client.query( 'insert into calendar (julday,teachid,roomid,courseid,eventtype,day,slot,name,value) values '+ calendarvalues,
                                     after(function(results) {
                                        console.log('TIMETABLES ELEVATED');
                                        client.query( "insert into teacher (courseid,userid) select distinct courseid,teachid from calendar where "
                                          + " eventtype = 'timetable' and courseid not in (select courseid from teacher) ");
                                 }));
                            }
                        }));
                      } else {
                            if (enrolvalues) client.query( 'insert into enrol (courseid,groupid) values '+ enrolvalues,
                                     after(function(results) {
                                        console.log('COURSES ENROLLED');
                                 }));
                            if (teachvalues) client.query( 'insert into teacher (courseid,userid) values '+ teachvalues,
                                     after(function(results) {
                                        console.log('TEACHERS ASSIGNED');
                                 }));
                            if (calendarvalues != '') {
                              //console.log( 'insert into calendar (julday,teachid,roomid,courseid,eventtype,day,slot,name,value) values '+ calendarvalues);
                              client.query( 'insert into calendar (julday,teachid,roomid,courseid,eventtype,day,slot,name,value) values '+ calendarvalues,
                                     after(function(results) {
                                        console.log('TIMETABLES ELEVATED');
                                        client.query( "insert into teacher (courseid,userid) select distinct courseid,teachid from calendar where "
                                          + " eventtype = 'timetable' and courseid not in (select courseid from teacher) ");
                                 }));
                            }
                            if (0 && updatecourselist ) {
                              var done = 0;
                              var l = updatecourselist.length;
                              for ( var uci = 0; uci < l; uci++) {
                                var params = updatecourselist[uci];
                                client.query( 'update course set planid=$1 where id=$2', params,
                                after(function(results) {
                                    done++;
                                    if (done == l-1 ) console.log("COURSES UPDATED",done);
                                  }));
                              }
                            }
                      }
                 }));
              } else {
                         if (courselistvalues) {
                         //console.log( 'insert into course (id,shortname,fullname,subjectid,planid) values '+ courselistvalues);
                         client.query( 'insert into course (id,shortname,fullname,subjectid,planid) values '+ courselistvalues,
                         after(function(results) {
                            console.log('COURSES INSERTED');
                            client.query( 'insert into enrol (courseid,groupid) values '+ enrolvalues,
                                     after(function(results) {
                                        console.log('COURSES ENROLLED');
                                 }));
                            //console.log( 'insert into teacher (courseid,userid) values '+ teachvalues);
                            client.query( 'insert into teacher (courseid,userid) values '+ teachvalues,
                                     after(function(results) {
                                        console.log('TEACHERS ASSIGNED');
                                 }));
                            if (calendarvalues != '') {
                              //console.log( 'insert into calendar (julday,teachid,roomid,courseid,eventtype,day,slot,name,value) values '+ calendarvalues);
                              client.query( 'insert into calendar (julday,teachid,roomid,courseid,eventtype,day,slot,name,value) values '+ calendarvalues,
                                     after(function(results) {
                                        console.log('TIMETABLES ELEVATED');
                                        client.query( "insert into teacher (courseid,userid) select distinct courseid,teachid from calendar where "
                                          + " eventtype = 'timetable' and courseid not in (select courseid from teacher) ");
                                 }));
                            }
                        }));
                        if (updatecourselist ) {
                              var done = 0;
                              var l = updatecourselist.length;
                              for ( var uci = 0; uci < l; uci++) {
                                var params = updatecourselist[uci];
                                client.query( 'update course set planid=$1 where id=$2', params,
                                after(function(results) {
                                    done++;
                                    if (done == l-1 ) console.log("COURSES UPDATED");
                                  }));
                              }
                        }
                      } else {
                            if (enrolvalues) client.query( 'insert into enrol (courseid,groupid) values '+ enrolvalues,
                                     after(function(results) {
                                        console.log('COURSES ENROLLED');
                                 }));
                            if (teachvalues) client.query( 'insert into teacher (courseid,userid) values '+ teachvalues,
                                     after(function(results) {
                                        console.log('TEACHERS ASSIGNED');
                                 }));
                            if (calendarvalues != '') {
                              //console.log( 'insert into calendar (julday,teachid,roomid,courseid,eventtype,day,slot,name,value) values '+ calendarvalues);
                              client.query( 'insert into calendar (julday,teachid,roomid,courseid,eventtype,day,slot,name,value) values '+ calendarvalues,
                                     after(function(results) {
                                        console.log('TIMETABLES ELEVATED');
                                        client.query( "insert into teacher (courseid,userid) select distinct courseid,teachid from calendar where "
                                          + " eventtype = 'timetable' and courseid not in (select courseid from teacher) ");
                                 }));
                            }
                            if (updatecourselist ) {
                              var done = 0;
                              var l = updatecourselist.length;
                              for ( var uci = 0; uci < l; uci++) {
                                var params = updatecourselist[uci];
                                client.query( 'update course set planid=$1 where id=$2', params,
                                after(function(results) {
                                    done++;
                                    if (done == l-1 ) console.log("COURSES UPDATED",done);
                                  }));
                              }
                            }
                      }

              }
      
    }

    i++;
  }
});
}
