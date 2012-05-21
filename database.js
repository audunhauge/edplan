var pg = require('pg');
var sys = require('util');
var async = require('async');
var creds = require('./creds');
var quiz = require('./quiz').qz;
var connectionString = creds.connectionString;
var supwd = creds.supwd;
var startpwd = creds.startpwd;

var lev    = require('./levenshtein');
var email   = require("emailjs/email");

String.prototype.caps = function() {
    // cap first char of all words in string
    return this.replace( /(^|\s)([a-zæøå])/g , function(m,p1,p2){ return p1+p2.toUpperCase(); } );
}

if (!String.prototype.quote) {
    String.prototype.quote = function () {
        var c, i, l = this.length, o = '"';
        for (i = 0; i < l; i += 1) {
            c = this.charAt(i);
            if (c >= ' ') {
                if (c === '\\' || c === '"') {
                    o += '\\';
                }
                o += c;
            } else {
                switch (c) {
                case '\b':
                    o += '\\b';
                    break;
                case '\f':
                    o += '\\f';
                    break;
                case '\n':
                    o += '\\n';
                    break;
                case '\r':
                    o += '\\r';
                    break;
                case '\t':
                    o += '\\t';
                    break;
                default:
                    c = c.charCodeAt();
                    o += '\\u00' + Math.floor(c / 16).toString(16) +
                        (c % 16).toString(16);
                }
            }
        }
        return o + '"';
    };
}


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


function stripRooms(text) {
  // removes any roomnames from text
  if (!db.roomids) return text; // room ids not there yet
  var list = text.split(/[, ]/);
  if (list.length < 2) return text;  // short list ok
  var clean = [];
  for (var i=0; i< list.length; i++) {
      var ee = list[i].toUpperCase();
      if ( !db.roomids[ee] ) {
        clean.push(list[i]);
      }
  }
  return clean.join(' ');
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
  ,course       : [ '2TY14','3SP35','3TY5' ]    // array of coursenames [ '1MAP5', '3INF5' ... ] - used by autocomplete
  ,cid2name     : {}    // hash { courseid:coursename, .. }
  ,cname2id     : {}    // hash { coursename:courseid, .. }
  ,freedays     : {}    // hash of juliandaynumber:freedays { 2347889:"Xmas", 2347890:"Xmas" ... }
  ,heldag       : {}    // hash of { 2345556:{"3inf5":"Exam", ... } }
  ,prover       : {}    // hash of { 2345556:[ {shortname:"3inf5_3304",value::"3,4,5",username:"haau6257" } ... ], ... }
  ,yearplan     : {}    // hash of { 2345556:["info om valg", 2345557:"Exam", ...], ...  }
  ,groups       : []    // array of groups
  ,groupnames   : {}    // hash of groupname to group-id
  ,nextyear     : {}    // info about next year
  ,memlist      : {}    // hash of { "3304":[234,45,454],"2303":[23, ...], ... }  -- group -> studs
  ,courseteach  : {}    // hash of { "3inf5_3304":{teach:[654],id:6347},"2inf5":{teach:[654,1363],id:6348}," ... }  -- course -> {teach,id}
  ,grcourses    : {}    // hash of { "3304":[ "3inf5" ] , ... }  -- courses connected to a group
  ,coursesgr    : {}    // hash of { "3inf5":[ "3304" ] , ... }  -- groups connected to a course
  ,memgr        : {}    // hash of { 234:["3304","2303","3sta" ..], ... }  --- groups stud is member of
  ,teachcourse  : {}    // array of courses the teacher teaches (inverse of courseteach)
  ,category     : { '3TY5':2,'3SP35':2,'2TY14':2 }    // hash of coursename:category { '3inf5':4 , '1nat5':2 ... }
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


var client = new pg.Client(connectionString);
client.connect();


  db.skipwords = {};
  db.shortlist = ' akkurat aldri alene all alle allerede alltid alt alts_a andre annen annet _ar _arene at av b_ade bak bare'
  + ' skriv finn klikk f_olgende svar bruk husk deretter begynne gj_or bedre begge begynte beste betyr blant ble blev bli blir blitt b_or bort borte bra bruke burde byen da dag dagen dager'
  + ' d_arlig de navnet navn deg del dem den denne der dere deres derfor dermed dersom dessuten det dette din disse d_oren du eg egen egentlig'
  + ' eget egne ei hvilke inneholder kalles skjer p_astandene brukes ulike merk hvilken oppgave foreg_ar plasser h_orer ovenfor ein eit eksempel eller ellers en enda ene eneste enkelte enn enn_a er et ett etter f_a fall fant far f_ar faren fast f_att'
  + ' fem fikk finne finner finnes fire fjor flere fleste f_olge folk f_olte for f_or foran fordi forhold f_orst f_orste forteller fortsatt fra'
  + ' fr_a fram frem fremdeles full funnet ga g_a gamle gammel gang gangen ganger ganske g_ar g_att gi gikk gir gitt gjelder kryss p_astander passer gjennom gjerne gj_or gjorde'
  + ' gj_ore gjort glad god gode godt grunn gud ha hadde ham han hans har hatt hele heller helst helt henne hennes her hjelp hjem hjemme'
  + ' ho holde holder holdt h_ore h_orte hos hun hus huset hva hvem hver hverandre hvert hvis hvor hvordan hvorfor igjen ikke ikkje imidlertid'
  + ' imot ingen ingenting inn inne ja jeg jo kampen kan kanskje kjenner kjent kjente klar forskjellige f_ore f_orer virker fyll best enkelt klart kom komme kommer kommet kort '
  + ' kunne kveld la l_a laget lagt lang lange langt legge legger lenge lenger lett ligger like likevel lille lite liten litt liv'
  + ' livet l_opet l_ordag lot m_a m_al man mange mann mannen m_ate m_aten m_atte med meg meget mellom men mener menn menneske mennesker mens mente mer'
  + ' mest mig min mindre mine minst mitt mor moren mot m_ote mulig mye n n_a n_ermere n_ar ned nei neste nesten nettopp noe noen nok norge norges'
  + ' norsk norske nu ny nye nytt ofte og ogs_a om omkring _onsker op opp oppe ord oss over overfor p_a par per plass plutselig '
  + ' redd reiste rekke rett riktig rundt sa s_a s_erlig sagt saken samme sammen samtidig satt satte se seg seier seks selv senere ser'
  + ' sett sette si side siden sier sig sikkert sin sine siste sitt sitter skal skulde skulle slags slik slike slikt slo slutt sm_a snakke snakket'
  + ' snart som spurte st_a stadig st_ar sted stedet sterkt stille sto stod stor store st_orre st_orste stort stund sv_ert svarte synes syntes ta'
  + ' tar tatt tenke tenker tenkt tenkte ti tid tiden tidende tidligere til tilbake tillegg ting to tok tre trenger tro trodde tror under unge ut'
  + ' ute uten utenfor v_ere v_ert vanskelig vant var v_ar v_are v_art ved vei veien vel ventet verden vet vi videre viktig vil vilde ville virkelig'
  + ' vise viser visst visste viste vite';
  db.shortlist.replace(/(\w+)\s/g,function(m,wo) {
         db.skipwords[wo] = 1;
         return '';
      });

var makeWordIndex = function(user,query,callback) {
  var teacher = +query.teacher;
  var wordlist = {};
  var relations = {};  // questions sharing words
  var teachlist;       // list of teachers with questions
  var close = [];      // questions sharing "many" words | many > 7
  var teachid = (teacher) ? teacher : user.id;
  var subjects = {};   // distinct subjects with qcount
  var questions = {};
  var containers = {};
  client.query("select * from question_container",
    after(function(cont) {
      client.query("select distinct teachid from quiz_question where qtype in ('dragdrop','multiple','fillin','numeric') ",
       after(function(res) {
        teachlist = res.rows;
        client.query("select q.id,t.tagname from quiz_question q inner join quiz_qtag qt on (qt.qid=q.id) "
               + " inner join quiz_tag t on (t.id = qt.tid) "
               + " where t.tagname not in ('multiple','dragdrop','fillin','sequence','numeric','textarea') "
               + " and q.teachid=$1 order by q.id",[ teachid],
          after(function(tags) {
            var mytags = {}; // question -> tags
            var qtags = {};   // tag -> questions
            for (var tt in tags.rows) {
               var tag = tags.rows[tt];
               if (!mytags[tag.id]) mytags[tag.id] = [];
               mytags[tag.id].push(tag.tagname);
               if (!qtags[tag.tagname]) qtags[tag.tagname] = {};
               qtags[tag.tagname][tag.id] = 1;
            }
            client.query('select * from quiz_question where teachid='+ teachid ,
               after(function(results) {
                  if (results && results.rows) {
                    for (var i=0, l= results.rows.length; i<l; i++) {
                      var qu = results.rows[i];
                      if ( qu.subject) {
                        if (!subjects[qu.subject]) subjects[qu.subject] = 0;
                        subjects[qu.subject] += 1;
                      }
                      var wcount = 0;  // count of words in this question
                      var qtag = (mytags[qu.id]) ? mytags[qu.id].join(' ') : '';
                      var str = qu.qtext + ' '+qtag;
                      str = str.replace(/\\n/g,' ');
                      str = str.replace(/\\r/g,' ');
                      str = str.replace(/&aring;/g,'_a');
                      str = str.replace(/&oslash;/g,'_o');
                      str = str.replace(/&aelig;/g,'_e');
                      str = str.replace(/Å/g,'_a');
                      str = str.replace(/Ø/g,'_o');
                      str = str.replace(/Æ/g,'_e');
                      str = str.replace(/å/g,'_a');
                      str = str.replace(/ø/g,'_o');
                      str = str.replace(/æ/g,'_e');
                      str.replace(/([A-Z_a-z]+)[-+.,;:() *\f\n\r\t\v\u00A0\u2028\u2029]/g,function(m,wo) {
                          if (wo.length < 3) return '';
                          wo = wo.toLowerCase();
                          if (db.skipwords[wo]) {
                            return '';
                          }
                          wcount++;
                          wo = wo.replace(/_a/g,'å').replace(/_o/g,'ø').replace(/_e/g,'æ');
                          if (wordlist[wo]) {
                            wordlist[wo].count ++;
                            if (!wordlist[wo].qids[qu.id]) {
                              wordlist[wo].qcount ++;
                              wordlist[wo].qids[qu.id] = 1;
                            }
                          } else {
                            wordlist[wo] = { count:1, qcount:1, qids:{} };
                            wordlist[wo].qids[qu.id] = 1;
                          }
                          return '';
                        });
                      qu.wcount = wcount;
                      questions[qu.id] = qu;

                    }
                  }
                  for (var wo in wordlist) {
                    var w = wordlist[wo];
                    if (w.count > 1 && w.qcount > 1 ) {
                      //console.log(wo,w);
                       for (q in w.qids) {
                         if (!relations[q]) {
                           relations[q] = {};
                         }
                         for (qq in w.qids) {
                           if (qq == q) continue;
                           if (!relations[q][qq]) {
                             relations[q][qq] = 0;
                           }
                           relations[q][qq]++;
                         }
                       }
                    }
                  }
                  var already = {};  // only keep one side of a dual relation
                  for (q in relations) {
                    var rr = relations[q];
                    for (r in rr) {
                      if (rr[r] > 2) {
                        var a = Math.max(q,r);
                        var b = Math.min(q,r);
                        if (already[a+'_'+b]) continue;
                        already[a+'_'+b] = 1;
                        close.push( [ rr[r],q,r ] );
                      } else {
                        delete relations[q][r]; // remove one word relationships
                      }

                    }
                  }
                  // now build list of containers for this teach
                  for (var cc in cont.rows) {
                     var con = cont.rows[cc];
                     if (!questions[con.cid]) continue;  // ignore containers for other teach
                     if (!questions[con.qid]) continue;  // ignore questions for other teach
                     if (!containers[con.cid]) containers[con.cid] = {};
                     containers[con.cid][con.qid] = 1;
                  }
                  callback({teachlist:teachlist, wordlist:wordlist, relations:close, questions:questions, 
                             qtags:qtags, tags:mytags, orbits:relations, subjects:subjects, containers:containers });

       }));
     }));
   }));
 }));
}



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
                         var server  = email.server.connect({
                              user:       "skeisvang.skole", 
                              password:   "123naturfag", 
                              host:       "smtp.gmail.com", 
                              ssl:        true
                         });

                         // send the message and get a callback with an error or details of the message that was sent
                         server.send({
                                text:   "Borte i dag: " + teach.username + " " + name + " " + text + " time"
                              , from:   "kontoret <skeisvang.skole@gmail.com>"
                              , to:     avdleader.email
                              , cc:     "audun.hauge@gmail.com"
                              , subject:  "Bortfall lerar"
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


var getcalendar = function(query,callback) {
  // returns a hash of all calendar events that cause  teach/stud to miss lessons
  //  {  julday:{ uid:{value:"1,2",name:"Kurs"}, uid:"1,2,3,4,5,6,7,8,9", ... }
  var upper       = +query.upper    || db.lastweek ;
  client.query(
      "select id,userid,julday,name,slot,value,class as klass from calendar where eventtype in ('absent','meet','reservation')"
      + " and julday >= $1 and julday <= $2 ",[ db.startjd, upper ],
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

var gimmeahint = function(user,query,callback) {
  // gets a hint from quiz.question
  // and increments hintcount in useranswer
  var qid  = +query.qid;
  var uaid = +query.uaid;
  var just = +query.just;
  client.query( "select * from quiz_useranswer where id = $1 and userid = $2",[ uaid,user.id],
     after(function(res) {
          if (res && res.rows) {
            var uan = res.rows[0];
            var obj = parseJSON(uan.param);
            var hints = obj.hints || '';
            var hin = hints.split(/\n|_&_/);
            if (just || hin.length < uan.hintcount) {
              // get any hints already bought
              callback(hin.slice(0,uan.hintcount));
            } else {
              client.query( "update quiz_useranswer set hintcount = hintcount + 1 where id=$1", [uaid]);
              callback(hin.slice(0,uan.hintcount+1));
            }

          } else {
            callback([]);
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

var insertimport = function(user,qlist,callback) {
  //var container = +query.container ;  // id of existing container (a question)
  var teachid   = +user.id;
  var now = new Date();
  var vv = [];
  for (var i=0; i< qlist.length; i++) {
    var qq = qlist[i];
    qq.qtext = qq.qtext.replace(/\\/g,'\\\\');
    vv.push("(" + user.id + ","+now.getTime() +","+now.getTime() + ",'" + qq.qtype + "','"+qq.qtext+"','"+qq.name+"',"+qq.points+")" );
  }
  console.log( "insert into quiz_question (teachid,created,modified,qtype,qtext,name,points) "
                + " values " + vv.join(',') );
  client.query( "insert into quiz_question (teachid,created,modified,qtype,qtext,name,points) "
                + " values " + vv.join(',') );
}

var editqncontainer = function(user,query,callback) {
  // insert/update/delete a question_container
  var action    = query.action ;
  var container = +query.container ;  // id of existing container (a question)
  var qid       = +query.qid ;        // used if binding existing question
  var name      = query.name  || '';        
  var subject   = query.subject  || '';        
  var qtype     = query.qtype || 'multiple';
  var qtext     = query.qtext || '{}';
  var teachid   = +user.id;
  var nuqs      = query.nuqs || '';
  var points    = +query.points || 1;
  var now = new Date();
  delete quiz.containers[container];
  delete quiz.contq[container];
  // empty the container cache
  switch(action) {
      case 'test':
        console.log(qid,name,qtype,qtext,teachid,points);
        break;
      case 'create':
        // we create a new empty question and bind it to the container
        client.query( "insert into quiz_question (teachid,created,modified,qtype,qtext,name,points,subject) "
                + " values ($1,$2,$2,$3,$4,$5,$6,$7) returning id ",
                [user.id, now.getTime(),qtype,qtext,name,points,subject ],
        after(function(results) {
            var newqid = results.rows[0].id;
            client.query( "insert into question_container (cid,qid) values ($1,$2) returning id ",
                    [container,newqid ],
                after(function(results) {
                  callback( {ok:true, msg:"updated" } );
                }));
            }));
        break;
      case 'insert':
        // we bind existing questions to the container
        if (nuqs) {
          var nuqids = '(' + nuqs.split(',').join(','+container+'),(') + ',' + container+')';
          //console.log( "insert into question_container (qid,cid) values " + nuqids);
          client.query( "insert into question_container (qid,cid) values " + nuqids,
              after(function(results) {
                callback( {ok:true, msg:"updated" } );
              }));
        } else {
          callback( {ok:true, msg:"emptylist" } );
        }
        break;
      case 'delete':
        // we can only delete it if no more instances exist
        // we assume this is tested for
        // drop a question from the container
        //console.log( "delete from question_container where cid=$1 and qid=$2 ", [container,qid]);
        client.query( "delete from question_container where cid=$1 and qid=$2 ", [container,qid], 
        after(function(results) {
           client.query("delete from quiz_useranswer where cid =$1 and qid=$2",[container,qid],
           after(function(results) {
               callback( {ok:true, msg:"dropped" } );
           }));
        }));
        break;
      default:
        callback(null);
        break;
  }
}

var editquest = function(user,query,callback) {
  // insert/update/delete a question
  var action  = query.action ;
  var qid     = +query.qid ;        // single question
  var qidlist = query.qidlist;      // question list - only delete
  var name    = query.name || '';
  var qtype   = query.qtype || '';
  var qtext   = JSON.stringify(query.qtext) || '';
  var teachid = +user.id;
  var points  = query.points || '';
  var now = new Date();
  quiz.containers = {};
  quiz.contq = {};
  //console.log(qid,name,qtype,qtext,teachid,points);
  switch(action) {
      case 'delete':
        if (!qidlist) qidlist = qid;
        //console.log( 'delete from quiz_question where id=$1 and teachid=$2', [qid,teachid]);
        //client.query( 'delete from quiz_question where id=$1 and teachid=$2', [qid,teachid],
        client.query( 'update quiz_question set teachid=1 where id in ('+qidlist+') and teachid=$1', [teachid],
            after(function(results) {
                callback( {ok:true, msg:"updated"} );
            }));
        break;
      case 'update':
    	  var sql =  'update quiz_question set modified=$3, qtext=$4 ';
    	  var params = [qid,teachid,now.getTime(),qtext];
    	  var idd = 5;
    	  if (query.qtype) {
    		  sql += ',qtype=$'+idd;
    		  params.push(qtype);
    		  idd++;
    	  }
    	  if (query.name) {
    		  sql += ',name=$'+idd;
    		  params.push(name);
    		  idd++;
    	  }
    	  if (query.points) {
    		  sql += ',points=$'+idd;
    		  params.push(points);
    	  }
    	  sql += ' where id=$1 and teachid=$2';
    	  //console.log(sql,params);
    	  client.query( sql, params,
    			  after(function(results) {
    				  callback( {ok:true, msg:"updated"} );
    				  delete quiz.question[qid];  // remove it from cache
    			  }));
    	  break;
      default:
        callback(null);
        break;
  }
}

var updatecontainerscore = function(user,query,callback) {
  var cid    = +query.cid ;   // the question (container) containing the questions
  var sum    = +query.sum ;   // total score for this container
  var uid    = +user.id;
  client.query( "update quiz_useranswer set score = $1 where userid=$2 and qid=$3", [sum,uid,cid]);
}

var addcomment = function(user,query,callback) {
  var uaid    = +query.uaid,   // id of useranswer to add comment to
      uid     = +query.uid,    // the user 
      qid     = +query.qid,    // question id
      iid     = +query.iid,    // instance id
      uid     = +query.uid,    // the user 
      comment = query.comment;  // the comment
  if (uid == user.id) {
    // stud-comment
    client.query( "update quiz_useranswer set usercomment = $1 where id=$2",[comment,uaid]);
  } else if (user.department == 'Undervisning') {
    // teach comment
    client.query( "update quiz_useranswer set teachcomment = $1 where id=$2",[comment,uaid]);
  }
  callback(123);
}

var editscore = function(user,query,callback) {
  var qid    = +query.qid,
      iid    = +query.iid,    // instance id (we may have more than one instance of a question in a container, generated questions)
      cid    = +query.cid,    // the question (container) containing the question
      uid    = +query.uid,    // the user 
      nuval  = +query.nuval,  // the new score
      qua    = query.qua,
      uaid   = +qua.id,
      oldval = +qua.score,    // prev score
      diff   =  nuval-oldval;
  console.log("REGRADE",qid,iid,cid,uid,qua,nuval,oldval,diff,qua.id);
  client.query( "update quiz_useranswer set score = "+nuval+" where id="+uaid);
  console.log( "update quiz_useranswer set score = $1 where id=$3", [nuval,uaid]);
  client.query( "update quiz_useranswer set score = score + "+diff+" where userid="+uid+" and qid="+cid);
  console.log( "update quiz_useranswer set score = score + $1 where userid=$2 and qid=$3", [diff,uid,cid]);
  callback(123);
}

var gradeuseranswer = function(user,query,callback) {
  // returns a grade for a useranswer
  var qid     = +query.qid ;
  var iid     = +query.iid ;   // instance id (we may have more than one instance of a question in a container, generated questions)
  var cid     = +query.cid ;   // the question (container) containing the question
  var uid     = user.id;
  var contopt = query.contopt;
  var ua      = JSON.stringify(query.ua) || '';
  var now = new Date().getTime()
  var mycontainer,myquest;
  async.parallel( [
      function(callback) {
        var mycontainer;
        if (!quiz.question[cid]) {
            client.query( "select * from quiz_question where id = $1",[ cid ],
            after(function(results) {
              if (results && results.rows && results.rows[0]) {
                mycontainer = results.rows[0];
                quiz.question[mycontainer.id] = mycontainer;
                callback(null, mycontainer);
              } else {
                callback('err',null);
              }
            }));
        } else {
            mycontainer = quiz.question[cid]; 
            callback(null, mycontainer);
        }
      },
      function(callback) {
        var myquest;
        if (!quiz.question[qid]) {
            client.query( "select * from quiz_question where id = $1",[ qid ],
            after(function(results) {
              if (results && results.rows && results.rows[0]) {
                myquest = results.rows[0];
                quiz.question[myquest.id] = myquest;
                callback(null, myquest);
              } else {
                callback('err',null);
              }
            }));
        } else {
            myquest = quiz.question[qid]; 
            callback(null, myquest);
        }
      }
      ],
      function(err,results) {
        myquiz  = results[0];
        myquest = results[1];
        if (myquiz && myquest) {
          // grade the response
          // check if we have an existing useranswer (uid,qid,qzid)
          //console.log( "select * from quiz_useranswer where qid = $1 and userid = $2 and qzid=$3",[ qid,uid,qzid ]);
          client.query( "select * from quiz_useranswer where qid = $1 and userid = $2 and cid=$3 and instance=$4",[ qid,uid,cid,iid ],
            after(function(results) {
                  if (results && results.rows && results.rows[0]) {
                    // we will always have a user response (may be empty)
                    // as one MUST be generated before displaying a question
                    // any dynamic params are stored in user-response
                    var qua = results.rows[0];
                    var param = parseJSON(qua.param);
                    //var nugrade = quiz.grade(myquiz,myquest,ua,param);
                    quiz.grade(contopt,myquiz,myquest,ua,param,qua.attemptnum,qua.hintcount,function(nugrade,feedback) {
                      //console.log("FEEDBACK IS NOW",feedback);
                      client.query( "update quiz_useranswer set score = $5,instance=$4,response=$1,"
                                    + "feedback='"+feedback+"', attemptnum = attemptnum + 1,time=$2 where id=$3",
                                    [ua,now,qua.id,iid,nugrade,],
                      after(function(results) {
                        // return parsed version of param
                        // as the question needs to be redisplayed
                        // to reflect userchoice
                        qua.param = parseJSON(qua.param);
                        qua.param.display = unescape(qua.param.display);
                        for (var oi in qua.param.options) {
                           qua.param.options[oi] = unescape(qua.param.options[oi]); 
                        }
                        qua.response = parseJSON(ua);
                        qua.param.optorder = '';
                        qua.qtype = myquest.qtype;
                        qua.points = myquest.points;
                        callback({score:nugrade, att:qua.attemptnum+1, qua:qua} );
                      }));
                    });
                  } else {
                      console.log("Error while grading- missing user answer for displayed question");
                      callback({score:0, att:0 } );
                  }
          }));
        } else {
          //console.log("baddas came here");
          callback( { msg:'Bad quiz/quest'} );
        }
      });
}

var updateTags = function(user,query,callback) {
  // remove all tags from a question
  // create tags from list
  // all tags presumed to exist
  var qid     = +query.qid ;
  var teachid = +user.id;
  var tagstring   = query.tags;  // assumed to be 'atag,anothertag,moretags'
  // no quotes - just plain words - comma separated
  var tags = " ( '" + tagstring.split(',').join("','") + "' )";
  client.query( 'delete from quiz_qtag qt where qt.qid=$1 ', [qid],
     after(function(results) {
        // removed existing tags for this question
        // now we just add in new tags
        if (tagstring) {
          client.query( "select t.* from quiz_tag t where t.tagname in "+tags+" and t.teachid=$1 ", [teachid],
          after(function(results) {
            // we now have ids for the tag-words
            var ttg = [];
            if (results && results.rows) {
              for (var i=0,l=results.rows.length; i<l; i++) {
                var ta = results.rows[i];
                ttg.push( '( '+ta.id+','+qid+')' );
              }
              var freshtags = ttg.join(',');
              client.query( "insert into quiz_qtag (tid,qid) values "+freshtags,
              after(function(results) {
                callback( {ok:true, msg:"retagged"} );
              }));
            } else {
              callback( {ok:false, msg:"nope"} );
            }
          }));
        } else {
          callback( {ok:true, msg:"notags"} );
        }
     }));
}

var changesubject = function(user,query,callback) {
  // change subject field for a set of questions (owned by user)
  var qidlist = query.qidlist;      // question list 
  var subject = query.subject;      // question list 
  var teachid = +user.id;
  if (qidlist) { client.query( "update quiz_question set subject='"+subject+"' where id in ("+qidlist+") and teachid="+teachid,
         after(function(results) {
               callback( {ok:true, msg:"removed"} );
           }));
  } else {
     callback(null);
  }
}

var edittags = function(user,query,callback) {
  // add/remove a qtag
  // will create a new tag if non exists (teachid,tagname)
  // will remove tag if no questions use it (after remove from qtag)
  var action  = query.action ;
  var qid     = +query.qid ;
  var qidlist = query.qidlist;      // question list - add/remove tags from these
  var tagname = query.tagname;
  var teachid = +user.id;
  if (tagname) tagname = tagname.substr(0,31);
  //console.log(qid,name,qtype,qtext,teachid,points);
  switch(action) {
      case 'tagfree':
          console.log( 'delete from quiz_qtag qt using quiz_tag t where t.id = qt.tid  and qt.qid in ('+qidlist+') and t.teachid=$1', [teachid]);
        if (qidlist) {
          client.query( 'delete from quiz_qtag qt using quiz_tag t where t.id = qt.tid  and qt.qid in ('+qidlist+') and t.teachid=$1', [teachid],
            after(function(results) {
              client.query( 'delete from quiz_tag qtt where qtt.teachid=$1 and qtt.id not in '
                + ' (select t.id from quiz_tag t inner join quiz_qtag qt on (t.id = qt.tid) ) ', [teachid],
                  after(function(results) {
                    callback( {ok:true, msg:"removed"} );
                  }));
            }));
          return;
        }
        break;
      case 'untag':
        console.log("delete from quiz_qtag qt using quiz_tag t where t.tagname=$2 and t.id = qt.tid and qt.qid in ("+qidlist+") and t.teachid=$1");
        if (qidlist) {
          client.query("delete from quiz_qtag qt using quiz_tag t where t.tagname=$2 and t.id = qt.tid and qt.qid in ("+qidlist+") and t.teachid=$1"
            , [teachid,tagname],
            after(function(results) {
              client.query( 'delete from quiz_tag qtt where qtt.teachid=$1 and qtt.id not in '
                + ' (select t.id from quiz_tag t inner join quiz_qtag qt on (t.id = qt.tid) ) ', [teachid],
                  after(function(results) {
                    callback( {ok:true, msg:"removed"} );
                  }));
            }));
        } else {
          client.query('delete from quiz_qtag qt using quiz_tag t where t.tagname=$3 and t.id = qt.tid and qt.qid=$1 and t.teachid=$2', [qid,teachid,tagname],
            after(function(results) {
              client.query( 'delete from quiz_tag qtt where qtt.teachid=$1 and qtt.id not in '
                + ' (select t.id from quiz_tag t inner join quiz_qtag qt on (t.id = qt.tid) ) ', [teachid],
                  after(function(results) {
                    callback( {ok:true, msg:"removed"} );
                  }));
            }));
        }
        return;
        break;
      case 'tag':
          client.query( "select t.* from quiz_tag t where t.tagname = $1 and t.teachid=$2 ", [tagname,teachid],
          after(function(results) {
            // existing tag
            if (results && results.rows && results.rows[0] ) {
              var tagg = results.rows[0];
              client.query( "insert into quiz_qtag (qid,tid) values ($1,$2) ",[qid,tagg.id],
              after(function(results) {
                  callback( {ok:true, msg:"tagged"} );
              }));
            } else {
              // create new tag
              client.query( "insert into quiz_tag (teachid,tagname) values ($1,$2) returning id ",[user.id, tagname ],
              after(function(results) {
                if (results && results.rows && results.rows[0] ) {
                  var tagg = results.rows[0];
                  client.query( "insert into quiz_qtag (qid,tid) values ($1,$2) ",[qid,tagg.id],
                  after(function(results) {
                    if (results && results.rows && results.rows[0] ) {
                      callback( {ok:true, msg:"tagged"} );
                    }
                  }));
                }
              }));
            }
          }));
          return;
        break;
      default:
        break;
  }
  callback(null);
}

var gettags = function(user,query,callback) {
  // returns all tags for a subject { teachid:[tag,..], ... }
  var uid    = user.id;
  var subject = query.subject;
  var tags = {};
  client.query( "select distinct t.* from quiz_tag t inner join quiz_qtag qt on (qt.tid=t.id) inner join quiz_question q on (q.id = qt.qid) "
      + " where t.teachid = $1 and q.subject=$2 order by t.tagname ", [uid,subject],
  after(function(results) {
      if (results && results.rows && results.rows[0]) {
        for (var i=0,l=results.rows.length; i<l; i++) {
          var ta = results.rows[i];
          if (!tags[ta.teachid]) tags[ta.teachid] = [];
          tags[ta.teachid].push(ta.tagname);
        }
      } 
      callback(tags);
  }));
}

var gettagsq = function(user,query,callback) {
  // returns all tags for a given question
  var uid    = user.id;
  var qid     = +query.qid ;
  var tags = [];
  client.query( "select t.* from quiz_tag t inner join quiz_qtag qt on (t.id = qt.tid) where qt.qid=$1", [qid],
  after(function(results) {
      if (results && results.rows && results.rows[0]) {
        for (var i=0,l=results.rows.length; i<l; i++) {
          var ta = results.rows[i];
          tags.push(ta.tagname);
        }
      } 
      callback(tags);
  }));
}

var getquesttags = function(user,query,callback) {
  // returns all questions with given tags
  // returns { tagname:{ teachid:[qid,..], ... }
  var subject = query.subject;
  if (user.department != 'Undervisning') {
      callback(null);
      return;
  }
  var uid    = user.id;
  var tagstring   = query.tags;  // assumed to be 'atag,anothertag,moretags'
  // SPECIAL CASE tagstring == 'non' - find all questions with no tag
  if (tagstring == 'non') {
    var qtlist = { 'non':[] };
    client.query( "select q.id,q.qtype,q.qtext,q.name,q.teachid from quiz_question q left outer join quiz_qtag qt on (q.id = qt.qid) "
        + " where qt.qid is null and q.teachid=$1 and q.subject=$2 order by modified desc", [uid,subject],
    after(function(results) {
        if (results && results.rows && results.rows[0]) {
          for (var i=0,l=results.rows.length; i<l; i++) {
            var qta = results.rows[i];
            if (!qtlist.non[qta.teachid]) qtlist.non[qta.teachid] = [];
            qtlist.non[qta.teachid].push(qta);
          }
        } 
        callback(qtlist);
    }));
  } else {
    // no quotes - just plain words - comma separated
    var tags = " ( '" + tagstring.split(',').join("','") + "' )";
    var qtlist = {};
    client.query( "select q.id,q.qtype,q.qtext,q.name,q.teachid,t.tagname from quiz_question q inner join quiz_qtag qt on (q.id = qt.qid) "
        + " inner join quiz_tag t on (qt.tid = t.id) where q.teachid=$1 and q.subject=$2 and t.tagname in  " + tags,[ uid,subject ],
    after(function(results) {
        console.log("GETQTAG ",results.rows);
        if (results && results.rows && results.rows[0]) {
          for (var i=0,l=results.rows.length; i<l; i++) {
            var qta = results.rows[i];
            if (!qtlist[qta.tagname]) qtlist[qta.tagname] = {};
            if (!qtlist[qta.tagname][qta.teachid]) qtlist[qta.tagname][qta.teachid] = [];
            qtlist[qta.tagname][qta.teachid].push(qta);
          }
        } 
        callback(qtlist);
    }));
  }
}

var getquestion = function(user,query,callback) {
  // returns a question
  // returns null if user is not owner
  var qid    = +query.qid ;
  var uid    = user.id;
  client.query( "select q.* from quiz_question q where q.id = $1 and q.teachid = $2",[ qid,uid ],
  after(function(results) {
          if (results && results.rows && results.rows[0]) {
            var qu = results.rows[0];
            quiz.question[qu.id] = qu;    // Cache 
            var qobj = quiz.getQobj(qu.qtext,qu.qtype,qu.id);
            qu.display = qobj.display;
            if (qu.qtype == 'dragdrop' || qu.qtype == 'sequence' 
              || qu.qtype == 'fillin' 
              || qu.qtype == 'diff' 
              || qu.qtype == 'numeric' 
              || qu.qtype == 'textarea') {
              // display is what we show the student
              // for some questions this is not the text we want to edit
              // restore original text
              qu.display = qobj.origtext;
            }
            qu.fasit = qobj.fasit;
            qu.cats = qobj.cats;
            qu.options = qobj.options;
            qu.code = qobj.code;
            qu.pycode = qobj.pycode;
            qu.hints = qobj.hints || '';
            qu.daze = qobj.daze || '';
            qu.contopt = qobj.contopt || {};
            callback(qu);
          } else {
            callback(null);
          }
  }));
}

function parseJSON(str) {
  // take just about any string - ignore errors
  if (str && str != '') {
    str = str.replace(/\n/g,'_&_');
    try {
      return JSON.parse(str);
    } catch(err) {
      console.log("RENDER JSON PARSE error ",err,str);
      return {};
    }
  } else {
    return {};
  }

}




function scoreQuestion(uid,qlist,ualist,myscore,callback) {
  // qlist is list of questions to score
  if (qlist.length > 0) {
    var ua = qlist.shift();
      if (ua.qtype == 'quiz') {
        client.query(  "select q.points,q.qtype,q.name,qua.* from quiz_useranswer qua inner join quiz_question q on (q.id = qua.qid) "
                 + " where qua.cid = $1 and qua.userid = $2 order by qua.instance",[ ua.qid,uid ],
        after(function(results) {
          if (results && results.rows && results.rows.length > 0) {
            console.log("subquiz",ua.qid);
            ualist.c[ua.qid] = { q:{}, c:{}, name:ua.name };
            scoreQuestion(uid,results.rows,ualist.c[ua.qid],myscore,function () {
                  scoreQuestion(uid,qlist,ualist,myscore,callback);
              });
          } else {
            console.log("missing subquiz",ua.qid);
            if (!ualist.q[ua.qid]) {
              ualist.q[ua.qid] = {};
            }
            ua.param = parseJSON(ua.param);
            ua.param.display = unescape(ua.param.display);
            ua.response = {}
            ualist.q[ua.qid][ua.instance] = ua;
            scoreQuestion(uid,qlist,ualist,myscore,callback);
          }
        }));
      } else {
        //console.log("normal quest",ua.qid,ua.instance,ua.attemptnum,ua.score);
        if (!ualist.q[ua.qid]) {
          ualist.q[ua.qid] = {};
        }
        myscore.score += ua.score;
        myscore.tot += ua.points;
        ua.param = parseJSON(ua.param);
        ua.param.display = unescape(ua.param.display);
        for (var oi in ua.param.options) {
           ua.param.options[oi] = unescape(ua.param.options[oi]); 
        }
        ua.response = parseJSON(ua.response);
        if (ua.qtype == 'multiple' || ua.qtype == 'dragdrop') {
          ua.param.fasit = quiz.reorder(ua.param.fasit,ua.param.optorder);
        }
        ualist.q[ua.qid][ua.instance] = ua;
        scoreQuestion(uid,qlist,ualist,myscore,callback);
      }
  } else {
     if (callback) callback();
  }
}


var displayuserresponse = function(user,uid,container,callback) {
  // user is user driving this web page
  // uid is id of stud to show results for
  // we assume all questions have a user-response
  // this should happen in renderq
  // we don't insert empty user-answers here
  //  we do however check for sub-containers
  //  and recurse thru them gathering up total score
  var cont = quiz.question[container] || {qtext:''} ;
  var cparam = parseJSON(cont.qtext);
  var contopt = cparam.contopt || {};
  var qlist = cparam.qlistorder;
  //console.log("CONTOPTS= ",contopt);
  //console.log("FASIT:",contopt.fasit,contopt.fasit && (+contopt.fasit & 1));
  client.query( "select id,qid,param,userid,score from quiz_useranswer where qid=$1  ",[ container ],
  after(function(coont) {
    if (coont && coont.rows) {
      var res = coont.rows[0];
      var coo = JSON.parse(res.param);
      // need to remember userid <--> anonym
      var qlist = coo.qlistorder;
      if (typeof(qlist) == "string") {
        qlist = qlist.split(',');
      }
      if (user.department == 'Undervisning' || ( (user.id == uid) && contopt.fasit && (+contopt.fasit & 1)) ) {
        client.query(  "select q.points,q.qtype,q.name,q.subject,qua.* from quiz_useranswer qua inner join quiz_question q on (q.id = qua.qid) "
                     + " where qua.qid in ("+(qlist.join(','))+" ) and qua.userid = $1 order by qua.time",[ uid ],
        after(function(results) {
              var myscore = { score:0, tot:0};
              var ualist = { q:{}, c:{}, sc:myscore };
              if (results && results.rows) {
                // clean the list - remove dups
                var qlist = [];
                var usedlist = {};
                for (var i=0; i< results.rows.length; i++) {
                  var qq = results.rows[i];
                  if (usedlist[qq.id] && usedlist[qq.id][qq.instance]) continue;
                  qlist.push(qq);
                  if (!usedlist[qq.id]) usedlist[qq.id] = {};
                  if (!usedlist[qq.id][qq.instance]) usedlist[qq.id][qq.instance] = 1;
                }
                scoreQuestion(uid,qlist,ualist,myscore,function () {
                     callback(ualist);
                     var prosent = (myscore.tot) ? myscore.score/myscore.tot : 0;
                     client.query( "update quiz_useranswer set score = $1 where userid=$2 and qid=$3", [prosent,uid,container]);
                  });
              } else {
                callback(ualist);
              }
        }));
      } else {
          callback(null);
      }
    } else {
      callback(null);
    }
  }));
}

var generateforall = function(user,query,callback) {
  // generate useranswer for all users
  var container    = +query.container;
  var questlist    = query.questlist ;  // used in renderq - just fetch it here to check
  var group        = query.group;
  if (user.department == 'Undervisning' ) {
    if (db.memlist[group]) {
      //console.log("SUUSUS",group,db.memlist[group]);
      for (var i=0, l = db.memlist[group].length; i<l; i++) {
        var enr = db.memlist[group][i];
        renderq({id:enr},query,function(resp) {
          //console.log(resp);
        });
      }
    }
  }
}

var renderq = function(user,query,callback) {
  // renders a list of questions
  // each question may be repeated and displayed 
  // differently depending on parameters
  // any questions/instances missing a useranswer
  // will have one inserted and parameters generated for it
  // all questions are assumed to be in quiz.question cache
  var container    = +query.container;
  var questlist    = query.questlist ;
  var uid          = +user.id;
  var justnow = new Date();
  var now = justnow.getTime()
  var contopt = {};
  var message = null;
  // console.log( "select * from quiz_useranswer where qid = $1 and userid = $2 ",[ container,uid ]);
  client.query( "select * from quiz_useranswer where qid = $1 and userid = $2 ",[ container,uid ],
  after(function(results) {
      // we now have the container as delivered to the user
      // must get useranswer for container.
      var containerq = results.rows[0];
      if (!containerq) {
        // no container generated yet, make a new one
        // TODO make a true container here
        if (quiz.question[container]) {
          containerq = quiz.question[container];
          var coo = JSON.parse(containerq.qtext);
          containerq.attemptnum = 0;
          //console.log("paaa 1");
        } else {
          containerq = quiz.question[container] || { attemptnum:0 };
          var coo = { contopt:{} };
          //console.log("paaa 2");
        }
      } else {
          var coo = JSON.parse(containerq.param);
          //console.log("paaa 3");
      }
      //if (quiz.question[container]) {
      //var containerq = quiz.question[container];
      contopt = coo.contopt || {};
      if (contopt.start || contopt.stop) {
        var start,stop,elm;
        if (contopt.start) {
          elm = contopt.start.split('/');
          start = new Date(elm[2],+elm[1]-1,elm[0]);
        }
        if (contopt.stop) {
          elm = contopt.stop.split('/');
          stop = new Date(elm[2],+elm[1]-1,elm[0]);
        }
        start = start || justnow - 20000;
        stop = stop || justnow + 2000;
        if (justnow < start || justnow > stop ) {
          console.log("OUT OF BOUNDS:",start,justnow,stop);
          if (user.department == 'Undervisning' ) {
            message = { points:0, qtype:'info', param: { display: '<h1>Test not open</h1>Start:'+contopt.start+'<br>Stop:'+contopt.stop } };
          } else {
            callback([ { points:0, qtype:'info', param: { display: '<h1>Test not open</h1>Start:'+contopt.start+'<br>Stop:'+contopt.stop } } ]);
            return;
          }
        }
      }
      if ( containerq.attemptnum != 0) {
        // we have questions in questlist
        // we have the order (and number) in qlist
        // BUT if we have questions not in  questlist
        // THEN we must just set attemptnum to 0
        // SO that new questions are generated
        // THIS happens if the question has just been edited
        // AND some of the questions deleted
        //console.log("USING GENERATED question list",coo.qlistorder);
        var qlist = coo.qlistorder.split(',');
        var ref = {};
        var allPresent = true;  // assume we have these questions
        for (var i=0; i< questlist.length; i++) {
          var q = questlist[i];
          ref[q.id] = q;
        }
        var newlist = [];
        for (var i=0; i< qlist.length; i++) {
          if (ref[qlist[i]]) {
            newlist.push(ref[qlist[i]]);
          } else {
            // this question is no longer part of the container
            // thus the quiz_useranswer is invalid
            console.log("Invalid qlist from useranswer - trigger regen");
            containerq.attemptnum = 0;
            allPresent = false;
          }
        }
        if (allPresent) questlist = newlist;
      }
      if ( containerq.attemptnum == 0) {
        // first time rendering this container
        // make random list if needed
        //console.log("Contopts = ", contopt);
        var always = []; // list of questions always used
        if (contopt.xcount && +contopt.xcount > 0) {
            // the first N questions are to be used no matter what
            // we slice them of
            var n = +contopt.xcount;
            always = questlist.slice(0,n);
            questlist = questlist.slice(n);
        }
        if (contopt.randlist && contopt.randlist == "1") {
          // pick N random questions, if N >= length of list then just shuffle the list
          if (contopt.shuffle && contopt.shuffle == "1") {
            questlist = quiz.shuffle(questlist);
          }
          if (contopt.rcount && +contopt.rcount > 0 && +contopt.rcount <= questlist.length) {
             questlist = questlist.slice(0,+contopt.rcount);
          }
        }
        questlist = always.concat(questlist);
        if (contopt.shuffle && contopt.shuffle == "1") {
          // must reshuffle so always list gets mixed in
          questlist = quiz.shuffle(questlist);
        }
        // update for next time
        coo.qlistorder = questlist.map(function(e) { return e.id }).join(',');
        var para = JSON.stringify(coo)
        //console.log("updating container ...",container);
        client.query("update quiz_useranswer set param = $1,attemptnum =1 where userid=$2 and qid = $3",[ para,uid,container]);
      }

    client.query( "select * from quiz_useranswer where cid = $1 and userid = $2 order by instance",[ container,uid ],
    after(function(results) {
            if (results && results.rows) {
              var ualist = {};
              var retlist = [];  // list to return
              for (var i=0,l=results.rows.length; i<l; i++) {
                var ua = results.rows[i];
                var q = quiz.question[ua.qid];
                if (q == undefined) {
                  continue;  // this response is to a question no longer part of container
                  // just ignore it
                }
                ua.points = q.points;
                ua.qtype = q.qtype;
                ua.name = q.name;
                ua.subject = q.subject;
                if (!ualist[ua.qid]) {
                  ualist[ua.qid] = {};
                }
                ua.param = parseJSON(ua.param);
                ua.param.display = unescape(ua.param.display);
                ua.param.fasit = '';
                ua.param.cats = '';
                ua.param.havehints = '';
                if (ua.param.hints) {
                  // there are hints to be had
                  // return those already payed for
                  var hin = ua.param.hints.split('_&_');
                  ua.param.hints = hin.slice(0,ua.hintcount);
                  ua.param.havehints = 'y';
                }
                if (q.qtype == 'fillin' || q.qtype == 'numeric' ) {
                  // must blank out options for these as they give
                  // correct answer
                  ua.param.options = [];
                }

                for (var oi in ua.param.options) {
                   ua.param.options[oi] = unescape(ua.param.options[oi]); 
                }
                ua.response = parseJSON(ua.response);
                ua.param.optorder = '';
                ualist[ua.qid][ua.instance] = ua;
              }
              // ensure that we have useranswers for all (question,instance) we display
              // we insert empty ua's as needed
              var missing = [];

              // we need to make recursive calls until all questions
              // are handled by python callback (if they have any python-code).
              // this might slow down the server quite a bit
              // if a whole class enters a workbook with many questions using python code
              //   TODO should flag those that use random and reuse param for those that do not.
              loopWait(0,function() {
                var misslist = missing.join(',');
                if (misslist) {
                  client.query( "insert into quiz_useranswer (qid,userid,cid,response,time,score,param,instance) values "+misslist,
                  function(err,results) {
                    if (err) {
                      console.log(err);
                      callback(null);
                    } else {
                      renderq(user,query,callback);
                    }
                  });
                } else {
                  // now we have ua for all (question,instance) in list
                  // generate display text and options for each (q,inst)
                  if (message) {
                    retlist.unshift(message);
                  }
                  callback(retlist);
                }
              });
            } else {
                callback(null);
                console.log('UNEXPECTED, SURPRISING .. renderq found no useranswers');
                // we should not come here as the select should return atleast []
            }
            /// handle need for callback before inserting
              function loopWait(i,cb) {
                  if (i < questlist.length) {
                    var qu = questlist[i];
                    if (qu == undefined) {
                      // forgot to delete useranswer?
                      console.log("HOW DID THIS HAPPEN?",questlist,i);
                    }
                    if (!ualist[qu.id] || !ualist[qu.id][i]) {
                      // create empty user-answer for this (question,instance)
                      // run any filters and macros found in qtext
                      quiz.generateParams(qu,user.id,i,container,function(params) {
                        missing.push( " ( "+qu.id+","+uid+","+container+",'',"+now+",0,'"+JSON.stringify(params)+"',"+i+" ) " );
                        loopWait(i+1,cb);
                      });
                    } else {
                      retlist[i] = ualist[qu.id][i];
                      loopWait(i+1,cb);
                    }
                  } else {
                    cb();
                  }
              }
    }));
  }));
}


var resetcontainer = function(user,query,callback) {
  // deletes useranswers for (container)
  // if uid is set then delete only for this user
  // if instance is set then delete only this instance
  var container    = +query.container ;
  //var quiz         = +query.quiz ;
  var uid          = +query.uid || 0;
  var instance     = +query.instance || 0;
  var params = [ container ];
  var sql = "delete from quiz_useranswer where cid =$1 or qid=$1";
  var ii = 2;
  if (uid) {
    sql += " and userid=$"+ii;
    params.push(uid);
    ii++;
  }
  if (instance) {
    sql += " and instance=$"+ii;
    params.push(instance);
    ii++;
  }
  delete quiz.containers[container];
  delete quiz.contq[container];
  // delete any symbols generated for this container
  //console.log(sql,params);
  client.query( sql,params,
  after(function(results) {
      callback(null);
  }));
}

var getqcon = function(user,query,callback) {
  // refetches container (the qtext for the container)
  // so that we have the correct sort-order for contained questions
  var container    = +query.container ;
  var now = new Date();
  client.query( "select q.* from quiz_question q where q.id =$1",[ container ],
  after(function(results) {
          if (results && results.rows) {
            callback(results.rows[0]);
          } else {
            callback(null);
          }
  }));
  // save first-seen time for this user
  // this will be time of first show for this container
  client.query( "update quiz_useranswer set firstseen = $1 where qid=$2 and userid=$3 and firstseen = 0",[now.getTime(), container, user.id ]);
}


var exportcontainer = function(user,query,callback) {
  // returns list of questions for a container suitable for export
  var container    = +query.container ;
  client.query( "select q.* from quiz_question q "
          + " inner join question_container qc on (q.id = qc.qid)  "
      + " where qc.cid =$1",[ container ],
  after(function(results) {
          if (results && results.rows) {
            callback(results.rows);
          } else {
            callback(null);
          }
  }));
}

var copyquest = function(user,query,callback) {
  // simply duplicate the questions with new teachid and subject == IMPORT
  var givenqlist   = query.givenqlist ;  // we already have the question-ids as a list
  var now = new Date();
  client.query( "insert into quiz_question (name,points,qtype,qtext,qfasit,teachid,created,modified,parent,subject) "
                + " select  name,points,qtype,qtext,qfasit,"+user.id+",created,"+(now.getTime())+",id,'IMPORT'  "
                + " from quiz_question q where q.id in ("+givenqlist+") ",
    after(function(results) {
       callback("ok");
  }));
}

var getcontainer = function(user,query,callback) {
  // returns list of questions for a container or set of question-ids
  var container    = +query.container ;   // used if we pick questions from a container
  var givenqlist   = query.givenqlist ;  // we already have the question-ids as a list
  if (container && quiz.contq[container]) {
     // we have the list of questions
     callback(quiz.contq[container]);
     //console.log("USING CONTAINER CACHE");
     return;
  }
  var sql,param;
  if (givenqlist) {
    // process the specified questions
    sql = "select q.* from quiz_question q where q.id in ("+givenqlist+") ";
    param = [];
  } else {
    // pick questions from container
    sql = "select q.* from quiz_question q inner join question_container qc on (q.id = qc.qid) where qc.cid =$1";
    param = [ container ];
  }
  client.query( sql, param,
    after(function(results) {
      //console.log("came here ",results.rows);
          if (results && results.rows) {
            var qlist = [];
            for (var i=0,l=results.rows.length; i<l; i++) {
              var qu = results.rows[i];
              quiz.question[qu.id] = qu;           // Cache 
              qlist.push(quiz.display(qu,false));
            }
            if (container) quiz.contq[container] = qlist;
            callback(qlist);
          } else {
            callback(null);
          }
  }));
}


var getuseranswers = function(user,query,callback) {
  // get useranswers for a container
  // all questions assumed to be in quiz.question cache
  var container    = +query.container;
  var group        = query.group;
  var ulist = {};     // list of students for this test
  var aid = 100000;
  var alias = {};  // map userid to alias
  var isteach = (user.department == 'Undervisning' );
  if (db.memlist[group]) {
    for (var i=0, l = db.memlist[group].length; i<l; i++) {
      var enr = db.memlist[group][i];
      if (!isteach && enr != user.id) {
        alias[enr] = aid++
        ulist[alias[enr]] = 1;
      } else {
        ulist[enr] =  1;
      }
    }
  }
  client.query( "select id,qid,param,userid,score,time,firstseen from quiz_useranswer where qid=$1  ",[ container ],
  after(function(results) {
      if (results && results.rows) {
        client.query( "select id,qid,instance,userid,score,time from quiz_useranswer where cid=$1  ",[ container ],
        after(function(uas) {
            var i,l;
            var ret = {};
            var usas = {};
            for (i=0, l = uas.rows.length; i<l; i++) {
              var u = uas.rows[i];
              if (!usas[u.userid]) usas[u.userid] = {};
              if (!usas[u.userid][u.qid]) usas[u.userid][u.qid] = [];
              usas[u.userid][u.qid][u.instance] = u;
            }
            for (i=0, l = results.rows.length; i<l; i++) {
              var res = results.rows[i];
              var coo = JSON.parse(res.param);
              // need to remember userid <--> anonym
              var qlist = coo.qlistorder;
              if (typeof(qlist) == "string") {
                qlist = qlist.split(',');
              }
              var sscore = getscore(res,qlist,usas);
              if (!isteach && res.userid != user.id) {
                res.userid = alias[res.userid];
              }
              ulist[res.userid] = 2;            // mark as started
              sscore.start = res.firstseen;
              ret[res.userid] = sscore;
            }
            callback({ret:ret, ulist:ulist});
        }));
      } else {
        callback( null);
      }
   }));

  function getscore(res,qlist,usas) {
    // qlist is the set of questions given to this user
    // usas contains useranswers index by userid,qid
    var tot = 0;
    var score = 0;
    var fresh = 0;
    if (qlist && qlist.length ) for (var i=0; i<qlist.length; i++) {
      var qid = qlist[i];
      if (usas[res.userid] && usas[res.userid][qid] && usas[res.userid][qid][i] != undefined) {
        var uu = usas[res.userid][qid][i];
        score += uu.score;
        tot += quiz.question[qid].points;   
        if (uu.time > fresh) fresh = uu.time;
      } else {
        try {
          console.log("NOTFOUND ",qid,usas[res.userid][qid],i);
        } catch(err) {
          console.log("REALLY not there ",qid,i);
        }
      }
    }
    if (res.userid==10024) {
      //console.log("uuUUUUUU",qlist,score,tot);
    }
    return { score:score, tot:tot, fresh:fresh} ;

  }

}


var getworkbook = function(user,query,callback) {
  // returns quiz for given course
  // if non exists - then one is created
  var courseid    = +query.courseid ;
  var coursename  = query.coursename ;
  var now = new Date();
  //console.log( "select ques.*, q.id as quizid from quiz q inner join quiz_question ques on (ques.id = q.cid) where q.courseid=$1 and q.name=$2 ",[ courseid, coursename ]);
  client.query( "select ques.*, q.id as quizid from quiz q inner join quiz_question ques on (ques.id = q.cid) where q.courseid=$1 and q.name=$2 ",[ courseid, coursename ],
  after(function(results) {
          if (results && results.rows && results.rows[0]) {
            callback(results.rows[0]);
          } else {
            if (user.department == 'Undervisning') {
              //console.log( "insert into quiz_question (qtype,teachid,created,modified) values ('container',$1,$2,$2) returning id ",[user.id, now.getTime() ]);
              client.query( "insert into quiz_question (qtype,teachid,created,modified) values ('container',$1,$2,$2) returning id ",[user.id, now.getTime() ],
              after(function(results) {
                  if (results && results.rows) {
                      var qid = results.rows[0].id;
                      client.query( "update quiz set cid=$1 where name=$2 and courseid=$3 returning id ",[ qid, coursename, courseid ],
                      after(function(results) {
                  //console.log( "insert into quiz (name,courseid,teachid,cid) values ($2,$1,$3,$4) returning id ",[ courseid, coursename, user.id, qid ]);
               if (results && results.rows && results.rows[0]) {
                getworkbook(user,query,callback);
               } else {
                  client.query( "insert into quiz (name,courseid,teachid,cid) values ($2,$1,$3,$4) returning id ",[ courseid, coursename, user.id, qid ],
                  after(function(results) {
                getworkbook(user,query,callback);
                              }));
               }
                      }));
                  }

              }));
            } else {
              callback('');
            }
          }
  }));
}


var ical = function(user,query,callback) {
  var action    =  query.action || 'yearplan';
  var itemid    = +query.itemid || 0;
  function guid() {
     return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
              return v.toString(16);
              });
  }
  var intro = 'BEGIN:VCALENDAR' + "\n"
             + 'METHOD:PUBLISH' + "\n"
             + 'PRODID:/Apple Inc.//iCal 3.0//EN' + "\n"
             + 'X-WR-CALNAME:MineProver0008' + "\n"
             + 'X-WR-RELCALID:' + guid() + "\n"
             + 'X-WR-TIMEZONE:Europe/Oslo' + "\n"
             + 'VERSION:2.0' + "\n"
  var closing = 'END:VCALENDAR';
  var events = [];
  switch (query.action) {
    case 'yearplan':
      for (var jd in db.yearplan) {
        if (jd*7 < db.startjd ) continue;
        var e = db.yearplan[jd];
        for (var i in e.days) {
          var ev = e.days[i];
          console.log(jd*7,i,ev);
        }
      }
      break;
    case 'rom':
      break;
  }
  var data = intro + events.join("\n") + closing;
  callback(data);
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
    var rids = [];  // turns out we may reserve several rooms for an exam
    var elm = val.split(/[ ,]/g);
    for (var i in elm) {
      var ee = elm[i].toUpperCase();
      if ( db.roomids[ee] ) {
        // we have found a valid room-name
        rids.push(db.roomids[ee]);
        itemid = db.roomids[ee];
      }
    }
    if (itemid == 0) {
      rids = [0];
    }
    for (var i=0; i<rids.length; i++) {
      itemid = rids[i];
      client.query(
        'insert into calendar (julday,name,value,roomid,courseid,userid,eventtype,class)'
        + " values ($1,$2,$3,$4,3745,2,'heldag',$5)" , [jd,fag,val,itemid,klass],
        after(function(results) {
            if (!db.heldag[jd]) {
              db.heldag[jd] = {};
            }
            db.heldag[jd][fag] = val;
        }));
    }
    callback( {ok:true, msg:"inserted"} );
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
        values.push('('+showid+",'"+elm[0]+"',"+elm[1]+",'"+type+"',"+elm[2]+','+jn+','+julday+','+user.id+')' );
    }
    var valuelist = values.join(',');
    //console.log('insert into tickets (showid,showtime,price,kk,ant,saletime,jd,userid) values ' + values);
    client.query(
        'insert into tickets (showid,showtime,price,kk,ant,saletime,jd,userid) values ' + values,
        after(function(results) {
            callback( {ok:true, msg:"inserted"} );
        }));
}

var editshow = function(user,query,callback) {
    var action     = query.action;
    var showid     = query.showid;
    var name       = query.name;
    var showtime   = query.showtime;
    var pricenames = query.pricenames;
    var authlist   = query.authlist;
    var userid     = user.id;
    switch(action) {
      case 'test':
          console.log(action,showid,name,showtime,pricenames,authlist,userid);
          callback( {ok:true, msg:"tested"} );
          break;
      case 'update':
        client.query( 'update show set name=$1, showtime=$2,pricenames=$3,authlist=$4 where id=$5', [name,showtime,pricenames,authlist, showid],
            after(function(results) {
                callback( {ok:true, msg:"updated"} );
            }));
        break;
      case 'kill':
        client.query(
            'delete from show where id=$1', [ showid],
            after(function(results) {
                client.query(
                  'delete from tickets where showid=$1', [ showid],
                  after(function(results) {
                     callback( {ok:true, msg:"deleted"} );
                  }));
            }));
        break;
      case 'insert':
        client.query(
            'insert into show (name,showtime,pricenames,authlist,userid) values ($1,$2,$3,$4,$5)', [ name,showtime,pricenames,authlist,userid],
            after(function(results) {
                callback( {ok:true, msg:"inserted"} );
            }));
        break;
    }
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
            client.query( 'insert into weekplan (plantext,planid,sequence) values ' + val.join(','),
            after(function(results) {
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
                resp.info += " Rom: " + db.roomnames[starb.roomid]
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
                      resp.text = "Ugyldig key";
                      if (starbkey.ecount == 0) {
                        resp.text = "RegKey er brukt opp";
                      } else if (starbkey.start > minutcount) {
                        var kmm = starbkey.start % 60;
                        var khh = Math.floor(starbkey.start / 60) + ":" + ((kmm < 10) ? '0' : '') + kmm;
                        resp.text = "RegKey ikke gyldig nu "+khh;
                      } else if (starbkey.start + starbkey.minutes < minutcount) {
                        resp.text = "RegKey er ikke lenger gyldig";
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
              teach[att.teachid][att.julday] = { room:att.roomid, studs:[] };
            }
            teach[att.teachid][att.julday].studs.push(att.userid);

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
  getActiveWorkbooks();
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
          client.query( "delete from calendar where courseid=$1 and eventtype='less' ",[idd],
              after(function(results) {
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

var getmeeting = function(callback) {
  // returns a hash of all meetings (this is data created by owner)
  // meeting is the entry with list of participants
  // and other info like message - title - start-time - duration
  // some of this is duplicated in each meet entry
  // this is because a meeting should not be changed (change room f.eks)
  // but rather deleted and recreated with new info
  // because email HAS BEEN SENT with the old info
  // changing the data in the database (even if we maintain consistency between
  // meeting and meet IS WORTHLESS as the EMAILS CANT BE CHANGED
  // SOLUTION: delete and recreate - causing new emails to be sent
  client.query(
      'select id,userid,courseid,day,slot,roomid,name,value,julday,class as klass from calendar  '
       + "      WHERE eventtype = 'meeting' and julday >= " + db.startjd ,
      after(function(results) {
          var meets = {};
          for (var i=0,k= results.rows.length; i < k; i++) {
              var res = results.rows[i];
              var uid = res.userid;
              if (!meets[uid]) {
                meets[uid] = {};
              }
              meets[uid][res.id] = res;
          }
          callback(meets);
      }));
}

var getmeet = function(callback) {
  // returns a hash of all meet
  // a meet is a calendar entry for one specific person assigned to a meeting
  // each meet is connected to a meeting thru courseid
  // horrid - certainly. so what ?
  client.query(
      'select id,userid,courseid,day,slot,roomid,name,value,julday,class as klass from calendar  '
       + "      WHERE eventtype = 'meet' and class in (0,1,2) and julday >= " + db.startjd ,
      after(function(results) {
          var meets = {};
          for (var i=0,k= results.rows.length; i < k; i++) {
              var res = results.rows[i];
              var julday = res.julday;
              var uid = res.userid;
              delete res.julday;   // save some space
              delete res.userid;   // save some space
              if (!meets[julday]) {
                meets[julday] = {};
              }
              if (!meets[julday][uid]) {
                meets[julday][uid] = [];
              }
              meets[julday][uid].push(res);
          }
          callback(meets);
      }));
}

var changeStateMeet  = function(query,state,callback) {
   // 0 == in limbo, 1 == obligatory, 2 == accepted, 3 == rejected
   var userid = +query.userid;
   var meetid = +query.meetid;
   if (!isNaN(userid) && !isNaN(meetid) ) {
     client.query('update calendar set class=$3 where eventtype=\'meet\' and userid=$1 and courseid=$2 returning id  ',
       [userid,meetid,state] , 
       after(function(results) {
           callback(results);
       }));
   }
};


var makemeet = function(user,query,callback) {
    var current        = +query.current;
    var idlist         = query.idlist;
    var shortslots     = query.shortslots; // for short meetings (5,10,15 .. min)
    var kort           = query.kort;       // true if a short meeting
    var myid           = +query.myid;      // used to delete a meeting
    var myday          = +query.day;       // the weekday - current is monday
    var roomid         = query.roomid;
    var meetstart      = query.meetstart;
    var roomname       = query.room;
    var chosen         = query.chosen;
    var message        = query.message;
    var title          = query.title;
    var action         = query.action;
    var konf           = query.konf;       // oblig, accept, reject
    var resroom        = query.resroom;    // make a room reservation for meeting
    var sendmail       = query.sendmail;   // send mail to participants
    var values         = [];               // entered as events into calendar for each partisipant
    // idlist will be slots in the same day (script ensures this)
    if (kort && !(typeOf(shortslots) === 'object')) {
         callback( {ok:false, msg:"no slots"} );
         return;
    }
    switch(action) {
      case 'kill':
        //console.log("delete where id="+myid+" and uid="+user.id);
        sqlrunner('delete from calendar where eventtype=\'meet\' and id=$1 and (userid=$2 or $3 )  ',[myid,user.id,user.isadmin],callback);
        callback( {ok:true, msg:"meeting removed"} );
        break;
      case 'insert':
        var teach        = db.teachers[user.id];
        var owner        = teach.firstname.caps() + " " + teach.lastname.caps();
        var roomname     = db.roomnames[roomid];
        var calledback = false;
        var participants = [];
        var klass = (konf == 'ob') ? 1 : 0 ;
        var meetinfo = JSON.stringify({message:message, idlist:idlist, owner:user.id, 
                                       sendmail:sendmail, title:title, message:message, 
                                       chosen:chosen, kort:kort, shortslots:shortslots });
        client.query(
          'insert into calendar (eventtype,julday,userid,roomid,name,value) values (\'meeting\',$1,$2,$3,$4,$5)  returning id',
             [current+myday,user.id,roomid,title.substr(0,30),meetinfo], after(function(results) {
            if (results && results.rows && results.rows[0] ) {
              var pid = results.rows[0].id;
              var allusers = [];
              var slot = 0;                   // slot only used if short meeting
              if (kort) {
                slot = idlist;
                idlist = Object.keys(shortslots);
              }
              for (var uii in chosen) {
                var uid = +chosen[uii];
                var teach = db.teachers[uid];
                participants.push(teach.firstname.caps() + " " + teach.lastname.caps());
                allusers.push(teach.email);
                values.push('(\'meet\','+pid+','+uid+','+(current+myday)+','+roomid+",'"+title+"','"+idlist+"',"+klass+","+slot+")" );
              }
              var valuelist = values.join(',');
              //console.log( 'insert into calendar (eventtype,courseid,userid,julday,roomid,name,value,class,slot) values ' + values);
              client.query( 'insert into calendar (eventtype,courseid,userid,julday,roomid,name,value,class,slot) values ' + values,
               after(function(results) {
                   if (!(resroom && !kort)) {
                     if (!calledback) {
                       callback( {ok:true, msg:"inserted"} );
                       calledback = true;
                     }
                   }
              }));
              if (resroom && !kort) {
                // make a reservation if option is checked - but not for short meetings
                var myslots = idlist.split(',');
                values = [];
                for (var i in myslots) {
                    var slot = myslots[i];
                    values.push('(\'reservation\',123,'+user.id+','+current+','+myday+','+slot+','+roomid+',\''+roomname+'\',\''+title+'\')' );
                }
                //console.log( 'insert into calendar (eventtype,courseid,userid,julday,day,slot,roomid,name,value) values '+ values.join(','));
                client.query( 'insert into calendar (eventtype,courseid,userid,julday,day,slot,roomid,name,value) values '+ values.join(','),
                  after(function(results) {
                     if (!calledback) {
                       callback( {ok:true, msg:"inserted"} );
                       calledback = true;
                     }
                   }));
              }
              console.log("SENDMAIL=",sendmail);
              if (sendmail == 'yes') {
                if (kort) {
                  idlist = slot;  // swap the time-slot back in 
                }
                var greg = julian.jdtogregorian(current + myday);
                var d1 = new Date(greg.year, greg.month-1, greg.day);
                var meetdate = greg.day + '.' + greg.month + '.' + greg.year;
                var server  = email.server.connect({
                      user:       "skeisvang.skole", 
                      password:   "123naturfag", 
                      host:       "smtp.gmail.com", 
                      ssl:        true
                });
                var basemsg = '\n\n' + message + "\n\n\n" + "  Dato: " + meetdate + '\n  Time: ' + idlist 
                         + '\n  Tid: ' + meetstart + '\n  Sted: rom '+roomname;
                basemsg  += "\n\n" + "  Deltagere:\n   * " + participants.join('\n   * ');
                basemsg  += "\n\n" + "  Ansvarlig: " + owner;
                basemsg  += "\n";
                for (var uii in chosen) {
                      var persmsg = basemsg;
                      var uid = +chosen[uii];
                      var teach = db.teachers[uid];
                      if (konf == 'deny') persmsg += "\n" + " Avvis med denne linken:\n    http://node.skeisvang-moodle.net/rejectmeet?userid="+uid+"&meetid="+pid;
                      if (konf == 'conf') persmsg += "\n" + " Bekreft med denne linken:\n    http://node.skeisvang-moodle.net/acceptmeet?userid="+uid+"&meetid="+pid;
                      server.send({
                                text:   persmsg
                              , from:   "AvtalePlanlegger <skeisvang.skole@gmail.com>"
                              , to:     teach.email
                              , subject:  title
                      }, function(err, message) { console.log(err || message); });
                }
              }
              return;
           }
           if (!calledback) {
             callback( {ok:true, msg:"inserted"} );
             calledback = true;
           }

        }));
        break;
    }
    callback( {ok:false, msg:"Failed to make meeting"} );
}

var makereserv = function(user,query,callback) {
    //console.log(query);
    var current  = +query.current;
    var idlist   = query.idlist.split(',');
    var myid     = +query.myid;
    var room     = query.room;
    var message  = query.message;
    var action   = query.action;
    var values   = [];
    var itemid   = +db.roomids[room];
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
      'select id,userid,day,slot,courseid,roomid,name,value,julday,eventtype from calendar cal '
       + "      WHERE roomid > 0 and eventtype in ('heldag', 'reservation') and julday >= $1 order by julday,day,slot" , [ db.startjd - 34 ] ,
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
                //var repl = new RegExp(",? *"+roomname,"i");
                //var vvalue = (res.name+' '+res.value).replace(repl,'');
                var vvalue = (res.name+' '+stripRooms(res.value));
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
       'SELECT * from show order by name',
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
       +     " on cal.roomid = r. id where eventtype in ( 'timetable', 'xtratime' ) and julday = $1 order by cal.name,day,slot", [ db.firstweek ],
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
                    if (!db.cname2id[amem.shortname]) {
                        db.cname2id[amem.shortname] = amem.id;
                        db.cid2name[amem.id] = amem.shortname;
                    }

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
                          // console.log(db.cname2id);
                          client.query( 'select * from groups',
                              after( function (results) {
                                 for (var i=0,k=results.rows.length; i<k; i++) {
                                   var gg = results.rows[i];
                                   db.groupnames[gg.groupname] = gg.id;
                                 }
                                 client.query( 'select * from members ',
                                  after( function (results) {
                                    for (var i=0,k=results.rows.length; i<k; i++) {
                                      var ggmem = results.rows[i];
                                      if (!db.memlist[ggmem.groupid]) {
                                        db.memlist[ggmem.groupid] = [];
                                        blokkmem[ggmem.groupid] = {}
                                      }
                                      if (!blokkmem[ggmem.groupid][ggmem.userid]) {
                                        db.memlist[ggmem.groupid].push(ggmem.userid);
                                        blokkmem[ggmem.groupid][ggmem.userid] = 1;
                                      } 
                                    }
                                  }));
                              }));
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
      // fetch big tests (exams and other big tests - they block a whole day )
      "select id,julday,name,value,class as klass from calendar where eventtype='heldag' ",
      after(function(results) {
          //console.log('ZZresult=',db.heldag);
          if (results) {
          for (var i=0,k= results.rows.length; i < k; i++) {
              var free = results.rows[i];
              if (!db.heldag[free.julday]) {
                db.heldag[free.julday] = {};
              }
              db.heldag[free.julday][free.name.toUpperCase()] = { value:stripRooms(free.value), klass:free.klass, fullvalue:free.value };
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

function getActiveWorkbooks() {
  client.query('select c.shortname,ques.id from quiz q inner join quiz_question ques on (ques.id = q.cid) '
               + 'inner join course c on (q.courseid = c.id)', after(function(results) {
     var wb = {};
     if (results && results.rows) {
       for (var i=0,k= results.rows.length; i < k; i++) {
         var wblink = results.rows[i];
         wb[wblink.shortname] = wblink.id;
       }
     }
     db.workbook = wb;
  }));
}


var getBasicData = function(client) {
  // we want list of all users, list of all courses
  // list of all groups, list of all tests
  // list of all freedays, list of all bigtests (exams etc)
  // list of all rooms, array of coursenames (for autocomplete)
  console.log("getting basic data");
  getroomids();
  getstudents();
  getcourses();
  getfreedays();
  getyearplan();
  getexams();
  getActiveWorkbooks();
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

getBasicData(client);


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
module.exports.changeStateMeet = changeStateMeet;  
module.exports.getmeet = getmeet;
module.exports.getmeeting = getmeeting;
module.exports.getworkbook = getworkbook;
module.exports.getcontainer = getcontainer ;
module.exports.getquestion = getquestion;
module.exports.getqcon = getqcon;
module.exports.gimmeahint = gimmeahint;
module.exports.generateforall = generateforall;
module.exports.exportcontainer = exportcontainer;
module.exports.renderq = renderq;
module.exports.updatecontainerscore  = updatecontainerscore;
module.exports.edittags = edittags;
module.exports.getquesttags = getquesttags;
module.exports.gettags = gettags ;
module.exports.getuseranswers = getuseranswers;
module.exports.displayuserresponse = displayuserresponse;
module.exports.updateTags = updateTags;
module.exports.gettagsq = gettagsq ;
module.exports.resetcontainer = resetcontainer;
module.exports.editquest = editquest;
module.exports.gradeuseranswer = gradeuseranswer;
module.exports.editqncontainer = editqncontainer;
module.exports.getTimetables = getTimetables;
module.exports.getCoursePlans = getCoursePlans;
module.exports.updateCoursePlan  = updateCoursePlan;
module.exports.updateTotCoursePlan = updateTotCoursePlan ;
module.exports.saveTest = saveTest;
module.exports.editscore = editscore;
module.exports.copyquest = copyquest;
module.exports.addcomment = addcomment;
module.exports.insertimport = insertimport;
module.exports.getBlocks = getBlocks;
module.exports.editshow = editshow;
module.exports.savesimple = savesimple;
module.exports.savehd = savehd;
module.exports.changesubject = changesubject;
module.exports.makeWordIndex = makeWordIndex;
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
module.exports.ical = ical;
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
