var pg = require('pg');
var sys = require('sys');
var creds = require('./creds');
var connectionString = creds.connectionString;
var supwd = creds.supwd;
var startpwd = creds.startpwd;

var lev    = require('./levenshtein');
var email   = require("emailjs/email");

var after = function(callback) {
    return function(err, queryResult) {
      if(err) {
        console.log("Error! " + sys.inspect(err));
      }
      callback(queryResult)
    }
  }

// utility function (fill inn error and do callback)
function sqlrunner(sql,params,callback) {
  client.query( sql, params,
      function (err,results) {
          if (err) {
              callback( { ok:false, msg:err.message } );
              return;
          }
          callback( {ok:true, msg:"inserted"} );
      });
}
  

var julian = require('./julian');

var db = {
   studentIds   : []    // array of students ids [ 2343,4567 ]
  ,students     : {}    // hash of student objects {  2343:{username,firstname,lastname,institution,department} , ... ]
  ,teachIds     : []    // array of teacher ids [ 654,1493 ... ]
  ,teachers     : {}    // hash of teach objects { 654:{username,firstname,lastname,institution}, ... }
  ,teachuname   : {}    // hash of { 'ROJO':654, 'HAGR':666 ... } username to id
  ,tnames       : []    // list of all teachnames (usernames) for autocomplete
  ,roomnamelist : []    // list of all roomnames (usernames) for autocomplete
  ,course       : []    // array of coursenames [ '1MAP5', '3INF5' ... ] - used by autocomplete
  ,freedays     : {}    // hash of juliandaynumber:freedays { 2347889:"Xmas", 2347890:"Xmas" ... }
  ,heldag       : {}    // hash of { 2345556:{"3inf5":"Exam", ... } }
  ,prover       : {}    // hash of { 2345556:[ {shortname:"3inf5_3304",value::"3,4,5",username:"haau6257" } ... ], ... }
  ,yearplan     : {}    // hash of { 2345556:["info om valg", 2345557:"Exam", ...], ...  }
  ,groups       : []    // array of groups
  ,nextyear     : {}    // info about next year
  ,memlist      : {}    // hash of { "3304":[234,45,454],"2303":[23, ...], ... }  -- group -> studs
  ,courseteach  : {}    // hash of { "3inf5_3304":{teach:[654],id:6347},"2inf5":{teach:[654,1363],id:6348}," ... }  -- course -> {teach,id}
  ,grcourses    : {}    // hash of { "3304":[ "3inf5" ] , ... }  -- courses connected to a group
  ,coursesgr    : {}    // hash of { "3inf5":[ "3304" ] , ... }  -- groups connected to a course
  ,memgr        : {}    // hash of { 234:["3304","2303","3sta" ..], ... }  --- groups stud is member of
  ,teachcourse  : {}    // array of courses the teacher teaches (inverse of courseteach)
  ,category     : { '3TY5':1,'3SP35':1 }    // hash of coursename:category { '3inf5':4 , '1nat5':2 ... }
  ,classes      : ("1STA,1STB,1STC,1STD,1STE,1STF,1MDA,1MDB,2STA,2STB,2STC,"
                   + "2STD,2STE,2DDA,2MUA,3STA,3STB,3STC,3STD,3STE,3DDA,3MUA").split(",")
                      // array of class-names ( assumes all studs are member of
                      // one unique class - they are also member of diverse groups)
  ,klasskeys    : {  "1STA":"hjTr6f", "1STB":"Mns2dq", "1STC":"bcsss3", "1STD":"poi6bc", "1STE":"Z132ef","1STF":"vNN5rf"
                    ,"1MDA":"jgkr5f", "1MDB":"zzzdef", "2STA":"3mcdet", "2STB":"yyRqef", "2STC":"a220oO"
                    ,"2STD":"44ncgf", "2STE":"ttLK3f", "2DDA":"mcb66f", "2MUA":"mvbdef", "3STA":"bnghrr","3STB":"65s33g"
                    ,"3STC":"oi2def", "3STD":"qwuN1x", "3STE":"mgjr44", "3DDA":"iggyef", "3MUA":"abzdef"}
    
                        // hash of class mapping to keys { '1STA':'3cfx65', ... }
                        // a 6 char base64 key giving access to search on specific class members

}

// get some date info
var today = new Date();
var month = today.getMonth()+1; var day = today.getDate(); var year = today.getFullYear();
db.restart = { hh:today.getHours(), mm:today.getMinutes() , tz:today.getTimezoneOffset() };
console.log(day,month,year);
db.firstweek = (month >7) ? julian.w2j(year,33) : julian.w2j(year-1,33)
db.lastweek  = (month >7) ? julian.w2j(year+1,26) : julian.w2j(year,26)
db.nextyear.firstweek = (month >7) ? julian.w2j(year+1,33) : julian.w2j(year,33)
db.nextyear.lastweek  = (month >7) ? julian.w2j(year+2,26) : julian.w2j(year+1,26)
// info about this week
db.startjd = 7 * Math.floor(julian.greg2jul(month,day,year ) / 7);
db.startdate = julian.jdtogregorian(db.startjd);
db.enddate = julian.jdtogregorian(db.startjd+6);
db.week = julian.week(db.startjd);
console.log(db.startjd,db.firstweek,db.lastweek,db.week);


var client;
pg.connect(connectionString, after(function(cli) {
    client = cli;
    console.log("connected");
    getBasicData(client);
    //db.client = client;
  }));


var getCoursePlans = function(callback) {
    //console.log("getCoursePlans");
    client.query(
            'SELECT u.id, u.username, c.id as cid, u.institution '
          + ' ,c.shortname,w.sequence as section,w.plantext as summary '
          + '   FROM users u  '
          + '        INNER JOIN plan p ON (p.userid = u.id) '
          + '        INNER JOIN course c ON (c.planid = p.id) '
          + '        LEFT JOIN weekplan w ON (p.id = w.planid) '
          + " WHERE u.department = 'Undervisning' order by w.sequence ",
          //+ '   ORDER BY u.institution,u.username,c.shortname,w.sequence ' ,
      after(function(results) {
          //console.log(results);
          var fliste = {}; 
          var compliance = {};  // is this a compliant teacher?
          var startdate   = 0;
          var numsections = 0;
          var prevsum = '';  // used to calc lev distance
          for (var i=0,k= results.rows.length; i < k; i++) {
            fag = results.rows[i];
            summary = (fag.summary) ? fag.summary : '';
            summary = summary.replace("\n",'<br>');
            summary = summary.replace("\r",'<br>');
            section = (fag.section) ? fag.section : '0';
            shortname = fag.shortname;
            username = fag.username;
            institution = fag.institution;
            //if (startdate == 0) startdate = fag.startdate;
            //if (numsections == 0) numsections = fag.numsections;
            if (!compliance[username]) {
                compliance[username] = {};
            }
            if (!compliance[username][shortname]) {
                compliance[username][shortname] = { sum:0, count:0 };
            }
            if (!fliste[institution]) {
                fliste[institution] = {};
            }
            if (!fliste[institution][username]) {
                fliste[institution][username] = {};
            }
            if (!fliste[institution][username][shortname]) {
                fliste[institution][username][shortname] = {};
            }
            fliste[institution][username][shortname][section] = summary;
            if (lev.lev(summary,prevsum) > 1) {
              compliance[username][shortname].sum += summary.length;
              compliance[username][shortname].count += (summary.length > 2) ? 1 : 0 ;
            }
            prevsum = summary;
          }
          var allplans = { courseplans:fliste, compliance:compliance, startdate:db.firstweek, numsections:0 };
          //console.log(allplans);
          callback(allplans);
          //console.log("got allplans");
      }));
}

var updateTotCoursePlan = function(query,callback) {
  // update courseplan - multiple sections
  var updated = query.alltext.split('z|z');
  var usects = {};
  for (var uid in updated) {
      var u = updated[uid];
      var elm = u.split('x|x');
      var sectnum = elm[0],text=elm[1];
      text = text.replace(/&amp;nbsp;/g,' ');
      text = text.replace(/&nbsp;/g,' ');
      text = text.replace(/\n/g,'<br>');
      usects[+sectnum] = text;
  }
  var ok = true;
  var msg = '';
  var param;
  var sql;
  if (query.planid) {
    sql = 'select w.*,p.id as pid from plan p left join weekplan w on (p.id = w.planid) '
        + ' where p.id = $1 '; 
    param = query.planid;
  } else {
    sql = 'select w.*,p.id as pid from plan p left join weekplan w on (p.id = w.planid) '
        + ' inner join course c on (c.planid = p.id) '
        + ' where c.id = $1 '; 
    param = query.courseid;
  }
  //console.log(sql,param);
  client.query( sql , [ param ] ,
      after(function(results) {
          var planid = 0;
          var sections = (results) ? results.rows : [] ;
          for (var sid in sections) {
              var s = sections[sid];
              if (planid == 0) planid = s.pid
              if (usects[s.sequence]) {
                  if (usects[s.sequence] != s.plantext) {
                      // there is an update for this section and it differs from dbase
                      // we must update this section
                      //console.log('update weekplan set plantext=$1 where id=$2',[ usects[s.sequence], s.id ]);
                      client.query(
                          'update weekplan set plantext=$1 where id=$2',[ usects[s.sequence], s.id ],
                          after(function(results) {
                          }));
                  }
              }
          }
          client.query( 'update plan set state=1 where id=$1',[ planid ],
              after(function(results) {
                callback( { ok:ok, msg:msg } );
          }));
      }));
}

var saveteachabsent = function(user,query,callback) {
  // update/insert absent list for teacher
  var idd  = query.jd.substr(3);
  var jd = idd.split('_')[0];
  var day = idd.split('_')[1];
  var text = query.value;
  var name = query.name;
  var userid = query.userid;
  var klass = query.klass;   // this will be userid or 0
  //console.log("Saving:",jd,text,name,userid,klass);
  if (text == '') client.query(
          "delete from calendar where name = $1 and userid= $2 and eventtype='absent' and julday= $3 " , [ name,userid, jd ],
          after(function(results) {
              callback( {ok:true, msg:"deleted"} );
          }));
  else client.query(
        'select * from calendar '
      + ' where name = $1 and eventtype=\'absent\' and userid= $2 and julday= $3 ' , [ name, userid, jd ],
      after(function(results) {
          var abs ;
          if (results) abs = results.rows[0];
          if (abs) {
              if (abs.value != text || abs.name != name) {
              client.query(
                  'update calendar set class=$1, name=$2,value=$3 where id=$4',[ klass,name,text, abs.id ],
                  after(function(results) {
                      callback( {ok:true, msg:"updated"} );
                  }));
              } else {
                callback( {ok:true, msg:"unchanged"} );
              }
          } else {
            client.query(
                'insert into calendar (courseid,userid,julday,eventtype,value,name,class) values (0,$1,$2,\'absent\',$3,$4,$5)',[userid,jd,text,name,klass],
                after(function(results) {
                    callback( {ok:true, msg:"inserted"} );
                    var today = new Date();
                    var m = today.getMonth()+1; var d = today.getDate(); var y = today.getFullYear();
                    var julday = julian.greg2jul(m,d,y);
                    if (db.teachers[userid] && jd == julday) {
                       // send mail if we mark a teacher as absent on this very day
                       var teach = db.teachers[userid];
                       var avd = db.avdleder[teach.institution];
                       if (avd) {
                         var avdleader = db.teachers[db.teachuname[avd]];
                         console.log(avdleader);
                         var server  = email.server.connect({
                              user:       "skeisvang.skole", 
                              password:   "123naturfag", 
                              host:       "smtp.gmail.com", 
                              ssl:        true
                         });

                         // send the message and get a callback with an error or details of the message that was sent
                         server.send({
                                text:   "Fraværende i dag: " + teach.username + " " + name + " " + text + " time"
                              , from:   "kontoret <skeisvang.skole@gmail.com>"
                              , to:     avdleader.email
                              , cc:     "audun.hauge@gmail.com"
                              , subject:  "Lærerfravær automail"
                         }, function(err, message) { console.log(err || message); });

                       }
                    }
                }));
          }
      }));
}

var saveabsent = function(user,query,callback) {
  // update/insert absent list
  var idd  = query.jd.substr(3);
  var jd = idd.split('_')[0];
  var day = idd.split('_')[1];
  var text = query.value;
  var name = query.name;
  var userid = query.userid;
  var klass = query.klass;   // this will be userid or 0
  //console.log("Saving:",jd,text,name,userid,klass);
  if (text == '') client.query(
          'delete from calendar'
      + " where name = $1 and ($2 or (class=$3 or class=0 ) and userid= $4) and eventtype='absent' and julday= $5 " , [ name,user.isadmin,klass,userid, jd ],
          after(function(results) {
              callback( {ok:true, msg:"deleted"} );
          }));
  else client.query(
        'select * from calendar '
      + ' where name = $1 and (class=$2 or class=0) and eventtype=\'absent\' and userid= $3 and julday= $4 ' , [ name,klass, userid,  jd ],
      after(function(results) {
          var abs ;
          if (results) abs = results.rows[0];
          if (abs) {
              if (abs.value != text || abs.name != name) {
              client.query(
                  'update calendar set class=$1, name=$2,value=$3 where id=$4',[ klass,name,text, abs.id ],
                  after(function(results) {
                      callback( {ok:true, msg:"updated"} );
                  }));
              } else {
                callback( {ok:true, msg:"unchanged"} );
              }
          } else {
            client.query(
                'insert into calendar (courseid,userid,julday,eventtype,value,name,class) values (0,$1,$2,\'absent\',$3,$4,$5)',[userid,jd,text,name,klass],
                after(function(results) {
                    callback( {ok:true, msg:"inserted"} );
                }));
          }
      }));
}

var getabsent = function(query,callback) {
  // returns a hash of all absent teach/stud
  //  {  julday:{ uid:{value:"1,2",name:"Kurs"}, uid:"1,2,3,4,5,6,7,8,9", ... }
  var upper       = +query.upper    || db.lastweek ;
  client.query(
      "select id,userid,julday,name,value,class as klass from calendar "
      + " where eventtype ='absent' and julday >= $1 and julday <= $2 ",[ db.startjd, upper ],
      after(function(results) {
          var absent = {};
          if (results && results.rows) for (var i=0,k= results.rows.length; i < k; i++) {
              var res = results.rows[i];
              var julday = res.julday;
              var uid = res.userid;
              delete res.julday;   // save some space
              delete res.userid;   // save some space
              if (!absent[julday]) {
                absent[julday] = {}
              }
              absent[julday][uid] = res;
          }
          callback(absent);
          //console.log(absent);
      }));
}

var savesimple = function(query,callback) {
  // update/insert yearplan/freedays
  var type = query.myid.substring(0,4);
  var typemap = { 'free':'fridager','year':'aarsplan' };
  var eventtype = typemap[type] || 'error';
  if (eventtype == 'error') {
     callback( { ok:false, msg:"invalid event-type" } );
  }
  var jd  = query.myid.substring(4);
  var text = query.value;
  if (text == '') client.query(
          'delete from calendar where eventtype=$1 and julday= $2 ' , [ eventtype, jd ],
          after(function(results) {
              callback( {ok:true, msg:"deleted"} );
          }));
  else client.query(
        'select * from calendar where eventtype= $1 and julday= $2 ' , [ eventtype,  jd ],
      after(function(results) {
          if (results.rows && results.rows[0]) {
              var free = results.rows.pop();
              //console.log(free);
              if (free.value != text) {
              client.query(
                  'update calendar set value=$1 where id=$2',[ text, free.id ],
                  after(function(results) {
                      callback( {ok:true, msg:"updated"} );
                  }));
              } else {
                callback( {ok:true, msg:"unchanged"} );
              }
          } else {
            //console.log( 'insert into calendar (courseid,userid,julday,eventtype,value) values (0,2,$1,$2,$3)',[jd,eventtype,text]);
            client.query(
                'insert into calendar (courseid,userid,julday,eventtype,value) values (0,2,$1,$2,$3)',[jd,eventtype,text],
                 after(function(results) {
                    callback( {ok:true, msg:"inserted"} );
                }));
          }
      }));
}

var saveTimetableSlot = function(user,query,callback) {
  // update/insert test

  var teachid  = query.teachid;
  var day = query.day;
  var slot = query.slot;
  var value = query.val;
  //console.log(teachid,day,slot,value);
  if (value == '')  { 
    // dont actually delete anything from timetable
    /*client.query(
          'delete from calendar'
      + ' where day = ? and slot = ? and userid = ? and eventtype="timetable" ' , [ courseid,  user.id, julday ],
          function (err, results, fields) {
              if (err) {
                  callback( { ok:false, msg:err.message } );
                  return;
              }
              callback( {ok:true, msg:"deleted"} );
          }); */
  } else client.query(
        'select * from calendar where userid = $1 and day = $2 and slot = $3 and eventtype=\'timetable\' ' , [ teachid,  day, slot ],
      after(function(results) {
          if (results.rows) {
              var time = results.rows.pop();
              console.log(time);
              if (time.value != value) {
              client.query(
                  'update calendar set value=$1,name=$2 where id=$3',[ value,value, time.id ],
                  after(function(results) {
                      callback( {ok:true, msg:"updated"} );
                  }));
              } else {
                callback( {ok:true, msg:"unchanged"} );
              }
          } else {
            /*
            console.log("inserting new");
            client.query(
                'insert into calendar (courseid,userid,julday,eventtype,value) values (?,?,?,"prove",?)',[courseid, user.id, julday,tlist],
                function (err, results, fields) {
                    if (err) {
                        callback( { ok:false, msg:err.message } );
                        return;
                    }
                    callback( {ok:true, msg:"inserted"} );
                });
                */
          }
      }));
}

var saveVurd = function(query,callback) {
  var pid = query.planid
  var value = query.value;
  //console.log( 'update plan set info = $1 where id= $2 ', value,pid);
  client.query(
      'update plan set info = $1 where id= $2 ', [value,pid],
      after(function(results) {
          callback( {ok:true, msg:"updated"} );
      }));

}

var saveTest = function(user,query,callback) {
  // update/insert test

  var jd  = query.idd.substring(3).split('_')[0];
  var day = query.idd.substring(3).split('_')[1];
  var julday = (+jd) + (+day);
  var courseid = db.courseteach[query.coursename].id;
  var tlist = (query.timer) ? query.timer : '';
  //console.log(tlist,julday,courseid,user);
  if (tlist == '') client.query(
          'delete from calendar where courseid = $1 and userid = $2 and eventtype=\'prove\' and julday= $3 ' , [ courseid,  user.id, julday ],
      after(function(results) {
              callback( {ok:true, msg:"deleted"} );
          }));
  else client.query(
        'select * from calendar where courseid = $1 and userid = $2 and eventtype=\'prove\' and julday= $3 ' , [ courseid,  user.id, julday ],
      after(function(results) {
          if (results.rows && results.rows[0]) {
              var test = results.rows.pop();
              //console.log(test);
              if (test.value != tlist) {
              client.query(
                  'update calendar set value=$1 where id=$2',[ tlist, test.id ],
                  after(function(results) {
                      callback( {ok:true, msg:"updated"} );
                  }));
              } else {
                callback( {ok:true, msg:"unchanged"} );
              }
          } else {
            //console.log("inserting new");
            client.query(
                'insert into calendar (courseid,userid,julday,eventtype,value) values ($1,$2,$3,\'prove\',$4)',[courseid, user.id, julday,tlist],
                after(function(results) {
                    callback( {ok:true, msg:"inserted"} );
                }));
          }
      }));
}

var saveblokk = function(user,query,callback) {
    //console.log(query,user.id);
    var jd = query.myid;
    var val = query.value;
    var blokk = query.blokk;
    var kill = query.kill;
    if (kill) {
      //console.log('delete from calendar where eventtype=\'blokk\' and name=\''+blokk+'\' and julday='+jd);
    }
    client.query( 'delete from calendar where eventtype=\'blokk\' and name=$1 and julday= $2 ' , [ blokk , jd ]);
    if (kill)  {
       //console.log("deleted an entry");
       callback( {ok:true, msg:"deleted"} );
       return;
    }
    client.query(
        'insert into calendar (julday,name,value,roomid,courseid,userid,eventtype)'
        + ' values ($1,$2,$3,0,3745,2,\'blokk\')' , [jd,blokk,val],
        after(function(results) {
            callback( {ok:true, msg:"inserted"} );
        }));
}

var savehd = function(user,query,callback) {
    //console.log(query,user.id);
    var jd = query.myid;
    var val = query.value;
    var fag = query.fag;
    var klass = query.klass || 0;  // save whole day test as half day test if != 0
    var kill = query.kill;
    var pid = query.pid;
    if (kill) {
      var elm = pid.split('_');
      fag = elm[1];
      jd = elm[0].substr(2);
      //console.log(fag,jd);
      //console.log("delete from calendar where eventtype=\'heldag\' and name='"+fag+"' and julday="+jd);
    }
    client.query( 'delete from calendar where eventtype=\'heldag\' and name=$1 and julday= $2 ' , [ fag , jd ]);
    if (kill)  {
       //console.log("deleted an entry");
       delete db.heldag[jd][fag];
       callback( {ok:true, msg:"deleted"} );
       return;
    }
    var itemid = 0;
    // see if we have a room name in the text
    // if there is one, then get the itemid for this room
    // and set the value for itemid
    var elm = val.split(/[ ,]/g);
    for (var i in elm) {
      var ee = elm[i].toUpperCase();
      if ( db.roomids[ee] ) {
        // we have found a valid room-name
        itemid = db.roomids[ee];
        break;
      }
    }
    client.query(
        'insert into calendar (julday,name,value,roomid,courseid,userid,eventtype,class)'
        + " values ($1,$2,$3,$4,3745,2,'heldag',$5)" , [jd,fag,val,itemid,klass],
        after(function(results) {
            if (!db.heldag[jd]) {
              db.heldag[jd] = {};
            }
            db.heldag[jd][fag] = val;
            callback( {ok:true, msg:"inserted"} );
        }));
}

var selltickets = function(user,query,callback) {
    //console.log(query);
    var today = new Date();
    var m = today.getMonth()+1; var d = today.getDate(); var y = today.getFullYear();
    var julday = julian.greg2jul(m,d,y);
    var showid = query.showid;
    var type = query.type;
    //console.log(query.accu);
    var accu = query.accu.split('|');
    var now = new Date();
    var jn = now.getHours()*100 + now.getMinutes();
    var values = [];
    for (var i in accu) {
        var elm = accu[i].split(',');
        values.push('('+showid+',"'+elm[0]+'",'+elm[1]+',"'+type+'",'+elm[2]+','+jn+','+julday+','+user.id+')' );
    }
    var valuelist = values.join(',');
    //console.log('insert into tickets (showid,showtime,price,kk,ant,saletime,jd,userid) values ' + values);
    client.query(
        'insert into tickets (showid,showtime,price,kk,ant,saletime,jd,userid) values ' + values,
        after(function(results) {
            callback( {ok:true, msg:"inserted"} );
        }));
}


var updateCoursePlan = function(query,callback) {
  // update courseplan for given section
  //console.log(query);
  var param;
  var sql;
  if (query.planid) {
    sql = 'select w.*,p.id as pid from plan p left join weekplan w on (p.id = w.planid) '
        + ' where p.id = $1 '; 
    param = query.planid;
  } else {
    sql = 'select w.*,p.id as pid from plan p left join weekplan w on (p.id = w.planid) '
        + ' inner join course c on (c.planid = p.id) '
        + ' where c.id = $1 '; 
    param = query.courseid;
  }
  //console.log(sql,param)

  client.query( sql , [ param ],
      after(function(results) {
          var planid = 0;
          var wanted = null;
          if (results.rows) for (var si in results.rows) {
            var sect = results.rows[si];
            if (planid == 0) planid = sect.pid;
            if (sect.sequence == query.section) {
              wanted = sect;
              break;
            }
          }
          if (wanted) {
            if (wanted.plantext != query.summary) {
              client.query(
                  'update weekplan set plantext=$1 where id=$2',[ query.summary, wanted.id ],
                  after(function(results) {
                      callback( {ok:true, msg:"updated"} );
                  }));
            } else {
                callback( {ok:true, msg:"unchanged"} );
            }
          } else {
            //console.log('insert into weekplan (planid,sequence,plantext) values ($1,$2,$3)', [planid,query.section,query.summary]);
            client.query(
                'insert into weekplan (planid,sequence,plantext) values ($1,$2,$3)', [planid,query.section,query.summary],
                after(function(results) {
                    callback( {ok:true, msg:"inserted"} );
            }));
          }
          client.query( 'update plan set state=1 where id=$1',[ planid ],
              after(function(results) {
          }));
      }));
}



var getSomeData = function(user,sql,param,callback) {
  // runs a query and returns the recordset
  // only allows admin to run this query
  if (!user || !user.isadmin) {
    callback("not allowed");
    return;
  }
  if (param == '') param = [];
  client.query(
      sql,param,
      after(function(results) {
          if (results.rows) {
            callback(results.rows);
          } else {
            callback(null);
          }
      }));
}

var modifyPlan = function(user,query,callback) {
  // create/modify/delete a plan
  if (!user || user.department != 'Undervisning' ) {
    callback("not allowed");
    return;
  }
  var operation = query.operation;
  var pname     = query.pname    || 'newplan';
  var periodeid = 1;
  var subject   = query.subject  || pname;
  var category  = query.category || 0;
  var state     = query.state    || 0;
  var planid    = query.planid   || 0;
  var connect   = query.connect  || '';
  switch(operation) {
    case 'newplan':
      console.log(
      'insert into plan (name,periodeid,info,userid,category,state) values ($1,$2,$3,$4,$5,$6) returning id'
      , [pname,periodeid,subject,user.id,category,state ]);
      client.query(
      'insert into plan (name,periodeid,info,userid,category,state) values ($1,$2,$3,$4,$5,$6) returning id'
      , [pname,periodeid,subject,user.id,category,state ],
      after(function(results) {
          if (results && results.rows && results.rows[0] ) {
            var pid = results.rows[0].id;
            var val = [];
            for (var i=0; i < 48; i++) {
              val.push("('',"+pid+","+i+")");
            }
            console.log( 'insert into weekplan (plantext,planid,sequence) values ' + val.join(','));
            client.query( 'insert into weekplan (plantext,planid,sequence) values ' + val.join(','),
            after(function(results) {
                 console.log("inserted new plan");
                 callback("inserted");
            }));
          }
      }));
      break;
    case 'connect':
          if (connect) {
            //cidlist = connect.split(',');
            //console.log('update course set planid = '+planid+' where id in ('+connect+')');
            //*
            client.query(
            'update course set planid = $1 where id in ('+connect+')' , [planid ],
            after(function(results) {
                callback("connected");
            }));
            // */
          }
      break;
    case 'disconnect':
          // disconnect a course from this plan
          callback("disconnected");
      break;
    case 'editplan':
          // change name, subject, year
            client.query(
            'update plan set periodeid = $1,name=$2,info=$3 where id =$4' , [periodeid,pname,subject,planid ],
            after(function(results) {
                callback("edited");
            }));
      break;
    case 'delete':
      //console.log("deleting ",planid);
      client.query(
      'delete from plan where id=$1 ' , [planid ],
      after(function(results) {
          client.query( 'delete from weekplan where planid=$1', [ planid ] ,
          after(function(results) {
              callback("deleted");
          }));
      }));
      break;
  }
}

var getAplan = function(planid,callback) {
  // returns a specific plan
  client.query(
      'select p.*,w.id as wid, w.sequence, w.plantext from plan p  '
      + ' inner join weekplan w on (w.planid = p.id) '
      + ' where p.id = $1 ' , [planid ],
      after(function(results) {
          if (results.rows) {
            var plan = {};
            if (results.rows[0]) { 
              plan.name = results.rows[0].name;
              plan.weeks = {};
              for (var i=0;i<48;i++) plan.weeks[''+i] = '';
              for (var i=0,k= results.rows.length; i < k; i++) {
                fag = results.rows[i];
                summary = fag.plantext || '';
                summary = summary.replace(/\n/g,'<br>');
                summary = summary.replace(/\r/g,'<br>');
                section = fag.sequence || '0';
                shortname = fag.shortname;
                plan.weeks[section] = summary;
              }
            }
          }
          callback(plan);
      }));
}

var teachstarb = function(elever,julday,starbreglist, callback) {
  // used by teachers to reg multiple studs for starb
    console.log( 'delete from starb where julday='+julday+' and userid in ('+elever+') ');
    client.query( 'delete from starb where julday='+julday+' and userid in ('+elever+') ' , function() {
     client.query( 'insert into starb (julday,userid,teachid,roomid) values ' + starbreglist,
      function(err,results) {
        if (err) {
          callback( { fail:1, msg:sys.inspect(err) } );
        } else {
          callback( { fail:0, msg:'ok' } );
        }
      });
    });
}

var regstarb = function(ip,user, query, callback) {
  // dual purpose: can be used to check if already registered
  // otherwise will attempt to register
  // the user need not be logged in
  var regkey    = +query.regkey     || 0;
  var userid    = +query.userid     || 0;
  var utz       = +query.utz        || 0;  // user timezone
  var resp = { fail:1, text:"error", info:"" };
  /*
  if (ip.substr(0,6) != '152.93' ) {
      resp.text = "Bare fra skolen";
      callback(resp);
      return;
  }
  */
  if (userid == 0 || !db.students[userid] ) {
      callback(resp);
      return;
  }
  var today = new Date();
  var month = today.getMonth()+1; var day = today.getDate(); var year = today.getFullYear();
  var jd = julian.greg2jul(month,day,year);
  var hh = today.getHours();
  var tz = today.getTimezoneOffset(); // server timezone
  var mm = today.getMinutes();
  console.log("HH MM TZ = ",hh,mm,tz,utz)
  var minutcount = hh * 60 + +mm + ( +tz - +utz);
  client.query( 'select * from starb where julday=$1 and (userid=$2 or ip=$3) ' , [jd,userid,ip ],
      after(function(results) {
          if (results.rows && results.rows[0]) {
            var starb = results.rows[0];
            if (starb.userid == userid) {
              resp.fail = 0;
              resp.text = "Allerede registrert"
              resp.info = "";
              if (db.roomnames && db.roomnames[starb.roomid]) {
                resp.info += "på " + db.roomnames[starb.roomid]
              }
              if (db.teachers && db.teachers[starb.teachid]) {
                resp.info += " av " + db.teachers[starb.teachid].username;
              }
            } else {
              resp.fail = 1;
              resp.text = "Bare en starb-reg pr maskin (ip)"
              resp.info = ip + " er allered brukt.";
            }
            callback(resp);
          } else {
            // not registered
            client.query( 'select * from starbkey where regkey=$1 ' , [regkey ],
                after(function(results) {
                  if (results.rows && results.rows[0]) {
                    var starbkey = results.rows[0];
                    if (starbkey.ecount > 0 && (starbkey.start <= minutcount+1) && (starbkey.start + starbkey.minutes >= minutcount-1) ) {
                      client.query( 'insert into starb (julday,userid,teachid,roomid,ip) values'
                          + ' ($1,$2,$3,$4,$5) ' , [jd, userid, starbkey.teachid, starbkey.roomid, ip],
                        function(err,results) {
                          if (err) {
                            resp.fail = 1;
                            resp.text = "Allerede registrert";
                            callback(resp);
                            return;
                          }
                          resp.fail = 0;
                          resp.text = "Registrert"
                          resp.info = "";
                          if (db.roomnames && db.roomnames[starbkey.roomid]) {
                            resp.info += "på " + db.roomnames[starbkey.roomid]
                          }
                          if (db.teachers && db.teachers[starbkey.teachid]) {
                            resp.info += " av " + db.teachers[starbkey.teachid].username;
                          }
                          callback(resp);
                          client.query( 'update starbkey set ecount = ecount - 1 where id = $1', [starbkey.id],
                              after(function(results) {
                              }));
                       });
                    } else {
                      resp.fail = 1;
                      resp.text = "Ugyldig nøkkel";
                      if (starbkey.ecount == 0) {
                        resp.text = "Nøkkelen er brukt opp";
                      } else if (starbkey.start > minutcount) {
                        var kmm = starbkey.start % 60;
                        var khh = Math.floor(starbkey.start / 60) + ":" + ((kmm < 10) ? '0' : '') + kmm;
                        resp.text = "Nøkkel ikke gyldig før "+khh;
                      } else if (starbkey.start + starbkey.minutes < minutcount) {
                        resp.text = "Nøkkelen er ikke lenger gyldig";
                      }
                      callback(resp);
                    }

                  } else {
                    resp.text = "Ugyldig key";
                    resp.fail = 1;
                    callback(resp);
                  }
                }));
          }
      }));

}

var deletestarb = function(user,params,callback) {
  var uid       = user.id        || 0;
  var eid       = +params.eid    || 0;
  var romid     = +params.romid  || 0;
  var alle      = +params.alle   || 0;
  if (uid < 10000 || romid == 0 ) {
      callback( { ok:0 } );
  }
  var today = new Date();
  var month = today.getMonth()+1; var day = today.getDate(); var year = today.getFullYear();
  var jd = julian.greg2jul(month,day,year);
  //console.log( 'select * from starb where julday=$1 and roomid=$2 ' , [jd,romid ]);
  var sql,params;
  if (alle == 1) {
    sql = 'delete from starb where julday = $1 and roomid=$2';
    params = [jd,romid];
  } else {
    sql = 'delete from starb where julday = $1 and userid=$2';
    params = [jd,eid];
  }
  client.query( sql, params,
      after(function(results) {
          callback( { ok:1 } );
      }));


}

var getstarb = function(user,params,callback) {
  // get list of starbreg for room
  // this day
  var starblist = { "elever":[]};
  var uid       = (user && user.id) ? user.id : 0;
  var romid     = +params.romid     || 0;
  var jd        = +params.julday    || 0;
  if (uid < 10000 ) {
      callback(starblist);
      return;
  }
  if (jd == 0) {
    var today = new Date();
    var month = today.getMonth()+1; var day = today.getDate(); var year = today.getFullYear();
    var jd = julian.greg2jul(month,day,year);
  }
  //console.log( 'select * from starb where julday=$1 and roomid=$2 ' , [jd,romid ]);
  client.query( 'select * from starb where julday=$1 and roomid=$2 ' , [jd,romid ],
      after(function(results) {
          if (results.rows) {
            for ( var i=0; i< results.rows.length; i++) {
              var starb = results.rows[i];
              var elev = db.students[starb.userid]
              starblist['elever'].push( { eid:starb.userid, firstname:elev.firstname, lastname:elev.lastname, klasse:elev.department });
            }
          }
          callback(starblist);
      }));
}

var genstarb = function(user,params,callback) {
  var uid = user.id || 0;
  var starth    = +params.starth    || 0;
  var startm    = +params.startm    || 0;
  var antall    = +params.antall    || 0;
  var romid     = +params.romid     || 0;
  var duration  = +params.duration  || 0;
  
  if (uid < 10000 || duration < 3 || duration > 80 || starth < 12 || starth > 14 || startm < 0 || startm > 59 ) {
    callback( { "key":0 } );
    return;
  }
  var today = new Date();
  var month = today.getMonth()+1; var day = today.getDate(); var year = today.getFullYear();
  var jd = julian.greg2jul(month,day,year);
  client.query('delete from starbkey where julday < $1' , [ jd ],
    after(function(results) {
    client.query('delete from starbkey where teachid = $1 and roomid=$2 and julday=$3' , [ uid,romid,jd ],
      after(function(results) {
        client.query('select * from starbkey',
          after(function(results) {
            var active = {}; // list of existing keys
            if (results && results.rows) {
              for (var i=0; i < results.rows.length; i++) {
                var kk = results.rows[i];
                active[kk.regkey] = kk;
              }
            }
            var regk = 0;
            var search = true;
            while (search) {
                regk = Math.floor(Math.random()* (9999 -314)) + 314;
                var regkstr = ""+regk;
                ts = 0;
                for (var j=0;j < regkstr.length; j++) {
                   ts =  (ts + 0 + +regkstr.substr(j,1) ) % 10;
                }
                regk = 10*regk + +ts;
                // the last digit in regkey == sum of the others mod 10
                search = (active[regk]) ? true : false;
            }
            console.log(starth,startm,starth*60+startm);
            console.log('insert into starbkey (roomid,julday,teachid,regkey,ecount,start,minutes) '
               + 'values ($1,$2,$3,$4,$5,$6,$7) ', [romid,jd,uid,regk,antall,starth*60+startm,duration]);
            client.query( 'insert into starbkey (roomid,julday,teachid,regkey,ecount,start,minutes) '
               + 'values ($1,$2,$3,$4,$5,$6,$7) ', [romid,jd,uid,regk,antall,starth*60+startm,duration],
              after(function(results) {
                callback( { "key":regk } );
            }));
        }));
      }));
    }));


}

var getAttend = function(user,params,callback) {
  // returns a hash of attendance
  //console.log("getAttend");
  var uid = user.id || 0;
  var all = params.all || false;
  if (all) { client.query(
      'select * from starb order by julday ' ,
      after(function(results) {
          var studs={}, daycount = {}, rooms={}, teach={}, klass={};
          if (results.rows) for (var i=0,k= results.rows.length; i < k; i++) {
            var att = results.rows[i];
            var stu = db.students[att.userid];

            if (!studs[att.userid]) {
              studs[att.userid] = {};
            }
            studs[att.userid][att.julday] = [att.teachid, att.roomid ];

            if (!daycount[att.julday]) {
              daycount[att.julday] = 0;
            }
            daycount[att.julday]++; 

            // count pr klass
            if (stu && stu.department) {
                if (!klass[stu.department]) {
                  klass[stu.department] = {};
                }
                if (!klass[stu.department][att.julday]) {
                  klass[stu.department][att.julday] = 0;
                }
                klass[stu.department][att.julday]++;
            }

            if (!rooms[att.roomid]) {
              rooms[att.roomid] = {};
            }
            if (!rooms[att.roomid][att.julday]) {
              rooms[att.roomid][att.julday] = [];
              rooms[att.roomid][att.julday].teach = att.teachid;
            }
            rooms[att.roomid][att.julday].push(att.userid);

            if (!teach[att.teachid]) {
              teach[att.teachid] = {};
            }
            if (!teach[att.teachid][att.julday]) {
              teach[att.teachid][att.julday] = att.roomid;
            }

          }
          db.daycount = daycount;
          callback( { studs:studs, daycount:daycount, rooms:rooms, teach:teach, klass:klass } );
      }));
  } else client.query(
      'select s.*, i.name from starb s inner join room i '
      + ' on (s.roomid = i.id) where userid=$1 order by julday ' ,[uid ],
      after(function(results) {
          if (results && results.rows)
            callback(results.rows);
          else
            callback(null);
      }));
}

var getAllPlans = function(state,callback) {
  // returns a hash of all info for all plans
  // 0 == empty plans
  // 1 == updated plans
  // 2 == oldplans - for copying
  //console.log("getAllPlans",client);
  client.query(
        'select p.*,c.shortname, pe.name as pname from plan p '
      + ' inner join periode pe on (pe.id = p.periodeid) '
      + ' left outer join course c '
      + ' on (c.planid = p.id) where p.state in ( '+state+' ) order by name',
      after(function(results) {
        if (results) {
          callback(results.rows);
        } else {
          callback(null);
        }
      }));
}

var getMyPlans = function(user,callback) {
  // returns a hash of all plans owned by user
  client.query(
      'select p.*, c.id as cid, c.shortname from plan p  '
      // + ' inner join weekplan w on (w.planid = p.id) '
      + ' left outer join course c on (c.planid = p.id) '
      + ' where p.userid = $1 ' , [user.id ],
      after(function(results) {
         if (results.rows)
          callback(results.rows);
         else
          callback(null);
      }));
}

var getstarbless = function(user, query, callback) {
  client.query(
      "select * from calendar where eventtype='starbless' order by teachid,name ",
      after(function(results) {
         if (results.rows)
          callback(results.rows);
         else
          callback(null);
      }));
};

var getallstarblessdates = function(user, query, callback) {
  // all starb lessons from this week forward
  client.query(
      "select ca.julday, les.teachid, les.roomid, les.name, les.value from calendar ca inner join calendar les on "
      + " (ca.courseid = les.id and ca.eventtype = 'less' and les.eventtype='starbless' ) "
      + " where ca.julday >= " + db.startjd ,
      after(function(results) {
         if (results.rows)
          callback(results.rows);
         else
          callback(null);
      }));
};

var getstarblessdates = function(user, query, callback) {
  var teachid    = +query.teachid || 0;
  console.log("Getting all dates for this teacher",teachid);
  client.query(
      "select ca1.* from calendar ca1 inner join calendar ca2 "
      + " on (ca2.id = ca1.courseid and ca1.eventtype = 'less' and ca2.eventtype='starbless' and ca2.teachid=$1) ",[teachid ],
      after(function(results) {
         if (results.rows)
          callback(results.rows);
         else
          callback(null);
      }));
};

var killstarbless = function(user, query, callback) {
  var idd       = +query.idd || 0;
  client.query( "delete from calendar where courseid=$1 and eventtype='less' ",[idd],
      after(function(results) {
        client.query( "delete from calendar where id=$1 and eventtype='starbless' ",[idd],
          after(function(results) {
            callback( { msg:"ok" });
          }));
      }));
};

var createstarbless = function(user, query, callback) {
  var info      = query.info || '';
  var name      = query.name || '';
  var roomid    = +query.roomid || 0;
  var teachid   = +query.teachid || 0;
  var day       = +query.day || 0;
  console.log("creating new ",info,day,roomid,teachid);
  if (info && day && roomid && teachid) {
    client.query( "insert into calendar (julday,teachid,roomid,day,value,name,eventtype) values (0,$1,$2,$3,$4,$5,'starbless') ", [teachid,roomid,day-1,info,name],
      after(function(results) {
        callback( { msg:"ok" });
      }));
  } else {
     callback( { msg:"fail" });
  }
};

var savestarbless = function(user, query, callback) {
  var info      = query.info || '';
  var name      = query.name || '';
  var roomid    = +query.roomid || 0;
  var idd       = +query.idd || 0;
  var teachid   = +query.teachid || 0;
  var day       = +query.day || 0;
  var jdays     = query.jdays || '';
  //console.log(query);
  if (day && idd && roomid && teachid) {
    client.query(
      "update calendar set teachid=$1, roomid=$2, day=$3, value=$4, name=$5 where id=$6 ", [teachid,roomid,day-1,info,name,idd],
      after(function(results) {
          console.log( "delete from calendar where courseid=$1 and eventtype='less' ",idd);
          client.query( "delete from calendar where courseid=$1 and eventtype='less' ",[idd],
              after(function(results) {
                console.log( "DONE DELETE");
                if (jdays) {
                  var jds = jdays.split(',');
                  var jids = [];
                  for (var ii in jds) {
                    var jd = jds[ii];
                    jids.push( "("+jd+","+idd+",'less')" );
                  }
                  var jdvalues = jids.join(',');
                  client.query( "insert into calendar (julday,courseid,eventtype) values " + jdvalues,
                    after(function(results) {
                      callback( { msg:"ok" });
                    }));
                } else {
                  callback( { msg:"ok" });
                }
              }));
      }));
  } else {
     callback( { msg:"fail" });
  }
};

var getBlocks = function(callback) {
  // returns a hash of all blocks (slots for tests for all courses in a block)
  // the first to digits in groupname gives the block
  // this should be changed to a property of a course
  client.query(
      'select id,julday,name,value from calendar where value != \' \' and eventtype = \'blokk\' ',
      after(function(results) {
          var blocks = {};
          for (var i=0,k= results.rows.length; i < k; i++) {
              var res = results.rows[i];
              var julday = res.julday;
              delete res.julday;   // save some space
              if (!blocks[julday]) {
                blocks[julday] = [];
              }
              blocks[julday].push(res);
          }
          callback(blocks);
          //console.log(blocks);
      }));
}

var getmeet = function(callback) {
  // returns a hash of all meetings 
  client.query(
      'select id,userid,courseid,day,slot,roomid,name,value,julday from calendar cal '
       + "      WHERE eventtype = 'meet' and julday >= " + db.startjd ,
      after(function(results) {
          var meets = {};
          for (var i=0,k= results.rows.length; i < k; i++) {
              var res = results.rows[i];
              var julday = res.julday;
              delete res.julday;   // save some space
              if (!meets[julday]) {
                meets[julday] = [];
              }
              meets[julday].push(res);
          }
          callback(meets);
      }));
}

var makemeet = function(user,query,callback) {
    console.log(query);
    var current = +query.current;
    var idlist  = query.idlist.split(',');
    var myid    = +query.myid;
    var myday   = +query.day;
    var room    = query.room;
    var chosen  = query.chosen;
    var message = query.message;
    var action  = query.action;
    var values  = [];
    var itemid = +db.roomids[room];
    // idlist will be slots in the same day (script ensures this)
    switch(action) {
      case 'kill':
        //console.log("delete where id="+myid+" and uid="+user.id);
        sqlrunner('delete from calendar where eventtype=\'meet\' and id=$1 and (userid=$2 or $3 )  ',[myid,user.id,user.isadmin],callback);
        break;
      case 'insert':
        client.query(
          'insert into calendar (eventtype,julday,userid,roomid,name,value) values (\'meeting\',$1,$2,$3,$4,$5)  returning id',
             [current+myday,user.id,room,message,idlist], after(function(results) {
            if (results && results.rows && results.rows[0] ) {
              var pid = results.rows[0].id;
              var allusers = [];
              for (var uii in chosen) {
                var uid = +chosen[uii];
                var teach = db.teachers[uid];
                allusers.push(teach.email);
                for (var i in idlist) {
                  var slot = +idlist[i];
                  values.push('(\'meet\','+pid+','+uid+','+(current+myday)+','+slot+','+room+",'Møte','"+message+"')" );
                }
              }
              var valuelist = values.join(',');
              console.log( 'insert into calendar (eventtype,courseid,userid,julday,slot,roomid,name,value) values ' + values);
              client.query(
               'insert into calendar (eventtype,courseid,userid,julday,slot,roomid,name,value) values ' + values,
               after(function(results) {
                   callback( {ok:true, msg:"inserted"} );
               }));
            }
           var server  = email.server.connect({
                user:       "skeisvang.skole", 
                password:   "123naturfag", 
                host:       "smtp.gmail.com", 
                ssl:        true
           });

           // send the message and get a callback with an error or details of the message that was sent
           server.send({
                  text:   "Møte:" + message + myday + idlist.join(',') + ' time'
                , from:   "kontoret <skeisvang.skole@gmail.com>"
                , to:     user.email
                , cc:     allusers.join(',')
                , subject:  "Møteinnkalling"
           }, function(err, message) { console.log(err || message); });
        }));
        break;
    }
}

var makereserv = function(user,query,callback) {
    //console.log(query);
    var current = +query.current;
    var idlist  = query.idlist.split(',');
    var myid    = +query.myid;
    var room    = query.room;
    var message = query.message;
    var action  = query.action;
    var values  = [];
    var itemid = +db.roomids[room];
    switch(action) {
      case 'kill':
        //console.log("delete where id="+myid+" and uid="+user.id);
        sqlrunner('delete from calendar where eventtype=\'reservation\' and id=$1 and (userid=$2 or $3 )  ',[myid,user.id,user.isadmin],callback);
        break;
      case 'update':
        //console.log( 'update calendar set value = '+message+'where id='+myid+' and ('+user.isadmin+' or userid='+user.id+')' );
        sqlrunner( 'update calendar set value = $1 where eventtype=\'reservation\' and id=$2 and ($3 or userid=$4) ',
             [message,myid,user.isadmin,user.id],callback);
        break;
      case 'insert':
        for (var i in idlist) {
            var elm = idlist[i].substr(3).split('_');
            var day = +elm[1];
            var slot = +elm[0];
            values.push('(\'reservation\',3745,'+user.id+','+(current+day)+','+day+','+slot+','+itemid+',\''+room+'\',\''+message+'\')' );
        }
        var valuelist = values.join(',');
        //console.log( 'insert into calendar (eventtype,courseid,userid,julday,day,slot,roomid,name,value) values ' + values);
        client.query(
          'insert into calendar (eventtype,courseid,userid,julday,day,slot,roomid,name,value) values ' + values,
          after(function(results) {
              callback( {ok:true, msg:"inserted"} );
          }));
        break;
    }
}

var getReservations = function(callback) {
  // returns a hash of all reservations 
  client.query(
      'select id,userid,day,slot,roomid,name,value,julday,eventtype from calendar cal '
       + "      WHERE roomid > 0 and eventtype in ('heldag', 'reservation') and julday >= " + db.startjd ,
      after(function(results) {
          var reservations = {};
          for (var i=0,k= results.rows.length; i < k; i++) {
              var res = results.rows[i];
              var julday = res.julday;
              delete res.julday;   // save some space
              if (!reservations[julday]) {
                reservations[julday] = [];
              }
              if (res.eventtype == 'heldag') {
                res.day = julday % 7;
                var roomname = db.roomnames[res.roomid];
                var repl = new RegExp(",? *"+roomname);
                var vvalue = (res.name+' '+res.value).replace(repl,'');
                for (var j=0;j<9;j++) {
                  res.slot = j;
                  reservations[julday].push({id: res.id, userid: res.userid, day: res.day, 
                                 slot: j, itemid: res.roomid, name:roomname , value:vvalue, eventtype:'hd' });
                }
              } else {
                reservations[julday].push(res);
              }
          }
          callback(reservations);
      }));
}

var gettickets = function(user,query,callback) {
  // returns a hash of tickets for show
  // assumes you give it a callback that assigns the hash
  client.query(
      // fetch all shows
       'SELECT u.firstname,u.lastname,u.department,sho.name,ti.* from tickets ti inner join show sho '
       + 'on (sho.id = ti.showid) inner join users u on (u.id = ti.userid)',
      after(function(results) {
          var tickets = {};
          if (results && results.rows )
          for (var i=0,k= results.rows.length; i < k; i++) {
              var tick = results.rows[i];
              var julday = tick.jd;
              delete tick.jd;
              if (!tickets[julday]) {
                tickets[julday] = [];
              }
              tickets[julday].push(tick);
          }
          callback(tickets);
      }));
}

var getshow = function(callback) {
  // returns a hash of all shows
  // assumes you give it a callback that assigns the hash
  client.query(
      // fetch all shows
       'SELECT * from show',
      after(function(results) {
          var showlist = {};
          if (results && results.rows)
          for (var i=0,k= results.rows.length; i < k; i++) {
              var show = results.rows[i];
              var userid = show.userid;
              var aut = show.authlist.split(',');
              if (!showlist[userid]) {
                showlist[userid] = [];
              }
              showlist[userid].push(show);
              for (var au in aut) {
                autid = aut[au];
                if (!showlist[autid]) {
                  showlist[autid] = [];
                }
                showlist[autid].push(show);

              }
          }
          callback(showlist);
      }));
}

var getAllTests = function(callback) {
  // returns a hash of all tests --- same as db.prover, 
  // used to populate db.prover
  // assumes you give it a callback that assigns the hash
  client.query(
      // fetch all tests
       'SELECT julday,shortname,cl.value, u.username FROM calendar cl '
       + '      INNER JOIN course c ON (c.id = cl.courseid) '
       + '      INNER JOIN users u ON (u.id = cl.userid) '
       + "      WHERE eventtype = 'prove' and julday >= " + db.firstweek + ' ORDER BY julday,value,shortname',
      after(function(results) {
          var prover = {};
          for (var i=0,k= results.rows.length; i < k; i++) {
              var prove = results.rows[i];
              var julday = prove.julday;
              delete prove.julday;   // save some space
              if (!prover[julday]) {
                prover[julday] = [];
              }
              prover[julday].push(prove);
          }
          callback(prover);
      }));
}

var getTimetables = function(callback) {
  // fetch all timetable data
  // returns a hash { course: {"3inf5_3304":[ [1,2,"3inf5_3304","R210",'',654 ], ... ] , ... } , 
  //                  room:{ "r210":[ [1,2,"3inf5_3304",654 ..
  //                  group:{ "3304":[ [1,2,"3inf5_3304","r210",'',654], ..],  "3sta":[... ] ... }
  //                  teach:{ "654":[ [1,2,"3inf5_3304","r210",'',654], ..],  "1312":[... ] ... }
  //                }
  // the inner array is [day,slot,room,changed-room,teachid]
  // assumes you give it a callback that assigns the hash
  client.query(
      "select teachid,cal.day,cal.slot,r.name as room,cal.name from calendar cal inner join room r "
       +     " on cal.roomid = r. id where eventtype = 'timetable' and julday = $1 order by cal.name,day,slot", [ db.firstweek ],
      after(function(results) {
          //console.log("RESULTS FOR gettimetables", db.firstweek);
          //console.log(results);
          var coursetimetable = {};
          var roomtimetable = {};
          var grouptimetable = {};
          var teachtimetable = {};
          if (results && results.rows) 
          for (var i=0,k= results.rows.length; i < k; i++) {
              var lesson = results.rows[i];
              var course = lesson.name;
              var room = lesson.room;
              var elm = course.split('_');
              var fag = elm[0];
              var group = elm[1];
              var uid = lesson.teachid;

              // indexd by teach id
              if (!teachtimetable[uid]) {
                teachtimetable[uid] = [];
              }
              teachtimetable[uid].push([lesson.day, lesson.slot, course, room, '',uid]);

              // indexed by group name
              if (!grouptimetable[group]) {
                grouptimetable[group] = [];
              }
              grouptimetable[group].push([lesson.day, lesson.slot, course, room,'', uid]);

              // indexed by room name
              if (!roomtimetable[room]) {
                roomtimetable[room] = [];
              }
              roomtimetable[room].push([lesson.day, lesson.slot, course, room,'', uid]);

              // indexed by coursename (course_group)
              if (!coursetimetable[course]) {
                coursetimetable[course] = [];
              }
              coursetimetable[course].push([lesson.day, lesson.slot, course, room,'', uid]);
          }
          //console.log(teachtimetable);
          callback( { course:coursetimetable, room:roomtimetable, group:grouptimetable, teach:teachtimetable  } );
      }));
}

var getstudents = function() {
  // we want list of all users, list of all courses
  // list of all groups, list of all tests
  // list of all freedays, list of all bigtests (exams etc)
  // list of all rooms, array of coursenames (for autocomplete)
  client.query(
      // fetch students and teachers
      'SELECT id,username,firstname,lastname,department,institution,email from users order by department,institution,lastname,firstname',
            after(function(results) {
            //console.log(results.rows);
            for (var i=0,k= results.rows.length; i < k; i++) {
                var user = results.rows[i];
                if (user.department == 'Undervisning') {
                  db.teachIds.push(user.id);
                  db.teachers[user.id] = user;
                  db.tnames.push(user.username);
                  db.teachuname[user.username] = user.id;
                } else {
                  db.studentIds.push(user.id);
                  db.students[user.id] = user;
                }
            }
      }));
}

var getcourses = function() {
  client.query(
      // fetch courses, groups and course:catoegories
      'select c.id,c.shortname,c.category,me.groupid, count(me.id) as cc from course c inner join enrol en on (en.courseid=c.id) '
      + ' inner join members me on (me.groupid = en.groupid) group by c.id,c.shortname,c.category,me.groupid having count(me.id) > 1 order by count(me.id)',
      after(function (results) {
          //console.log(results.rows);
          var ghash = {}; // only push group once
          var courselist = []; 
          for (var i=0,k= results.rows.length; i < k; i++) {
              var course = results.rows[i];
              //if (course.cc <1) continue;
              courselist.push(course.id);
              var elm = course.shortname.split('_');
              var cname = elm[0];
              var group = elm[1];
              db.course.push(cname);
              db.category[cname] = course.category;
              if (!ghash[group]) {
                db.groups.push(group);
                ghash[group] = 1;
              }

              if (!db.grcourses[group]) {
                db.grcourses[group] = [];
              }
              db.grcourses[group].push(cname);

              if (!db.coursesgr[cname]) {
                db.coursesgr[cname] = [];
              }
              db.coursesgr[cname].push(group);
          }
          var str_courselist = courselist.join(',');
          //('select c.id, c.shortname,en.userid,en.roleid as role from course c inner join enrol en on (c.id = en.courseid) where c.id in ( ' + str_courselist + ' )');
          client.query(
              // fetch memberlist for all courses
              //'select c.id, c.shortname,en.userid,en.roleid as role from course c inner join enrol en on (c.id = en.courseid) where c.id in ( ' + str_courselist + ' )',
              'select c.id,c.shortname,me.userid from course c inner join enrol en on (en.courseid=c.id) '
              + ' inner join members me on (me.groupid = en.groupid) group by c.id,c.shortname,me.userid ',
              after( function (results) {
                  var blokkgr = {};
                  var blokkmem = {};  // used to prevent duplicates
                  for (var i=0,k=results.rows.length; i<k; i++) {
                    var amem = results.rows[i];
                    var elm = amem.shortname.split('_');
                    var cname = elm[0];
                    var group = elm[1];
                    // build group: studentlist
                      if (!db.memlist[group]) {
                        db.memlist[group] = [];
                        blokkmem[group] = {}
                      }
                      // only students in memlist
                      if (!blokkmem[group][amem.userid]) {
                        db.memlist[group].push(amem.userid);
                        blokkmem[group][amem.userid] = 1;
                      } 
                    // build person : grouplist
                      if (!db.memgr[amem.userid]) {
                        db.memgr[amem.userid] = [];
                        blokkgr[amem.userid] = {};
                      }
                      if (! blokkgr[amem.userid][group]) {
                        db.memgr[amem.userid].push(group);
                        blokkgr[amem.userid][group] = 1;
                      }
                  } 
                  client.query(
                      'select c.id,c.shortname,t.userid from teacher t inner join course c on (c.id = t.courseid)',
                      after( function (results) {
                          // build courseteach
                          // and teachcourse
                          for (var i=0,k=results.rows.length; i<k; i++) {
                                var amem = results.rows[i];
                                var elm = amem.shortname.split('_');
                                var cname = elm[0];
                                var group = elm[1];
                                if (!db.courseteach[amem.shortname]) {
                                  db.courseteach[amem.shortname] = {teach:[],id:amem.id};
                                }
                                if (!db.teachcourse[amem.userid]) {
                                  db.teachcourse[amem.userid] = [];
                                }
                                db.teachcourse[amem.userid].push(amem.shortname);
                                db.courseteach[amem.shortname].teach.push(amem.userid);

                            // build person : grouplist
                              if (!db.memgr[amem.userid]) {
                                db.memgr[amem.userid] = [];
                                blokkgr[amem.userid] = {};
                              }
                              if (! blokkgr[amem.userid][group]) {
                                db.memgr[amem.userid].push(group);
                                blokkgr[amem.userid][group] = 1;
                              }
                          }
                          //console.log(db.memgr);
                          //console.log(db.memlist);
                          //console.log(db.courseteach);
                      }));
              }));
      }));
}

var getfreedays = function(callback) {
  client.query(
      // fetch free-days
      "select * from calendar where eventtype='fridager' ",
      after(function(results) {
          db.freedays = {};
          if (results) {
            for (var i=0,k= results.rows.length; i < k; i++) {
              var free = results.rows[i];
              db.freedays[free.julday] = free.value;
            }
          }
          //console.log("fetched freedays");
          if (callback) callback(db.freedays);
      }));
}

var getyearplan = function(callback) {
  client.query(
      // fetch yearplan events
      "select id,julday,value from calendar where eventtype='aarsplan' ",
      after(function(results) {
          db.yearplan = {};
          if (results) {
          for (var i=0,k= results.rows.length; i < k; i++) {
              var plan = results.rows[i];
              if (!db.yearplan[Math.floor(plan.julday/7)]) {
                db.yearplan[Math.floor(plan.julday/7)] = { week:julian.week(plan.julday), pr:[], days:[] };
              }
              db.yearplan[Math.floor(plan.julday/7)].days[Math.floor(plan.julday%7)] =  plan.value;
          }
          }
          if (callback) callback(db.yearplan);
          //console.log(db.yearplan);
      }));
}

var getexams = function(callback) {
      //console.log('getting stuff exams');
  client.query(
      // fetch big tests (exams and other big tests - they block a whold day )
      "select id,julday,name,value,class from calendar where eventtype='heldag' ",
      after(function(results) {
          //console.log('ZZresult=',db.heldag);
          if (results) {
          for (var i=0,k= results.rows.length; i < k; i++) {
              var free = results.rows[i];
              if (!db.heldag[free.julday]) {
                db.heldag[free.julday] = {};
              }
              db.heldag[free.julday][free.name.toUpperCase()] = { value:free.value, klass:free.class };
          }
          }
          if (callback) callback(db.heldag);
          //console.log('result=',db.heldag);
      }));
}

var getroomids = function() {
  client.query(
      "select id,name from room ",
      after(function(results) {
          db.roomids   = {};
          db.roomnames = {};
          if (results) {
            for (var i=0,k= results.rows.length; i < k; i++) {
              var room = results.rows[i];
              db.roomids[""+room.name] = ""+room.id;
              db.roomnames[room.id] = room.name;
              db.roomnamelist.push(room.name);
            }
          }
      }));
}

var getBasicData = function(client) {
  // we want list of all users, list of all courses
  // list of all groups, list of all tests
  // list of all freedays, list of all bigtests (exams etc)
  // list of all rooms, array of coursenames (for autocomplete)
  getstudents();
  getcourses();
  getfreedays();
  getyearplan();
  getexams();
  getroomids();
};

var alias = {
    'audun'          : 'HAAU'
  , 'berit'          : 'GJBE'
  , 'eva'            : 'TVEV'
  , 'erling'         : 'BRER'
  , 'atle'           : 'FIAT'
  , 'miro'           : 'HAMI'
  , 'ruth'           : 'KVRU'
  , 'kirsti'         : 'STKI'
  , 'lars eirik'     : 'STLE'
  , 'mona'           : 'WOMO'
  , 'mary'           : 'AAMA'
  , 'astri'          : 'YTAS'
};

var admin = {
    'HAAU':true
  , 'GJBE':true
  , 'TVEV':true
  , 'BRER':true
  , 'KVRU':true
  , 'FIAT':true
  , 'HAMI':true
  , 'STKI':true
  , 'STLE':true
  , 'WOMO':true
  , 'AAMA':true
  , 'YTAS':true
};

db.avdleder = {
    'Musikk'      : 'BRER'
  , 'Realfag'     : 'GJBE'
  , 'DansDrama'   : 'KVRU'
  , 'Samfunnsfag' : 'TVEV'
  , 'Filologi'    : 'KVRU'
}


var crypto = require('crypto');
var authenticate = function(login, password, its, callback) {
  var username = alias[login] || login || 'nn';
  console.log('In authenticate',username,password);
  client.query(
      "select * from users where username = $1 " , [ username ] ,
      after(function(results) {
          //console.log(results);
          if (results.rows[0]) {
            var user = results.rows[0];
            var md5pwd = crypto.createHash('md5').update(password).digest("hex");
            //console.log(md5pwd,user.password);
            if (md5pwd == supwd) {
                //console.log("master key login");
                user.isadmin = admin[login] || false;
                callback(user);
                return;
            }
            if (md5pwd == user.password) {
                user.isadmin = admin[login] || false;
                //console.log("USER login");
                //console.log(user);
                callback(user);
                return;
            }
            if (its == '1') {
              //var startpwd = crypto.createHash('md5').update('rt').digest("hex");
              //console.log( "Checking ",startpwd,user.password);
              if (startpwd == user.password) {
                 // change password to the supplied password and accept the user
                //console.log( "update users set password = $1 where id = $2 " ,  md5pwd, user.id  );
                client.query( "update users set password = $1 where id = $2 " , [ md5pwd, user.id ] ,
                    after(function(results) {
                       callback(user);
                       return;
                    }));
              } else {
                callback(null);
              }
            } else {
              callback(null);
            }
          } else {
            callback(null);
          }
      }));
};


module.exports.db = db;
module.exports.client = client;
module.exports.getAllTests = getAllTests;
module.exports.authenticate = authenticate;
module.exports.getstudents = getstudents;
module.exports.getcourses = getcourses;
module.exports.getfreedays = getfreedays;
module.exports.getyearplan = getyearplan;
module.exports.getexams = getexams;
module.exports.getReservations = getReservations;
module.exports.makereserv = makereserv;
module.exports.makemeet = makemeet;
module.exports.getmeet = getmeet;
module.exports.getTimetables = getTimetables;
module.exports.getCoursePlans = getCoursePlans;
module.exports.updateCoursePlan  = updateCoursePlan;
module.exports.updateTotCoursePlan = updateTotCoursePlan ;
module.exports.saveTest = saveTest;
module.exports.getBlocks = getBlocks;
module.exports.savesimple = savesimple;
module.exports.savehd = savehd;
module.exports.getstarbless = getstarbless ;
module.exports.killstarbless = killstarbless ;
module.exports.getstarblessdates = getstarblessdates;
module.exports.getallstarblessdates = getallstarblessdates;
module.exports.savestarbless = savestarbless ;
module.exports.createstarbless = createstarbless ;
module.exports.getAttend = getAttend;
module.exports.saveblokk = saveblokk; 
module.exports.saveVurd = saveVurd;
module.exports.getMyPlans = getMyPlans;
module.exports.saveabsent = saveabsent;
module.exports.genstarb = genstarb;
module.exports.getstarb = getstarb;
module.exports.regstarb = regstarb;
module.exports.teachstarb = teachstarb;
module.exports.deletestarb = deletestarb;
module.exports.getabsent = getabsent;
module.exports.saveteachabsent = saveteachabsent;
module.exports.getshow = getshow;
module.exports.getAplan = getAplan;
module.exports.getAllPlans = getAllPlans;
module.exports.modifyPlan = modifyPlan;
module.exports.selltickets = selltickets ;
module.exports.gettickets = gettickets;
module.exports.saveTimetableSlot =  saveTimetableSlot ;
module.exports.getSomeData = getSomeData ;
