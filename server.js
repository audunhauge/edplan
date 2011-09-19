var database = require('./database');
var julian = require('./julian');
var db = database.db;
db.roomdata = require('./static').roomdata;
db.starttime = db.roomdata.slotlabels.split(',');


var mydom = {};  // for each user - result of file import

var fs = require('fs');


var addons = {}
// extra data that we send AFTER the main page has been drawn
// this so that the page seems more responsive
addons.update = {};
// used to store time info for resources
// we refetch if the resource is stale

function doit(dom,line) {
  // state machine for parsing xml
  var islessons = new RegExp(/<lessons/);
  var islesson  = new RegExp(/<lesson>/);
  var isname    = new RegExp(/<name>/);
  var isstart   = new RegExp(/<start>/);
  var isdesc    = new RegExp(/<description>/);
  var islogg    = new RegExp(/"Logg">/);
  var isvurd    = new RegExp(/"Vurdering"/);
  if (islesson.test(line)) return 2;
  switch (dom.state) {
    case 0:
      if (islessons.test(line)) return 1;
      break;
    case 1:
      if (islesson.test(line)) return 2;
      break;
    case 2:
      if (isname.test(line)) {
        var m = line.match(/<name>(.+)<\/name>/);
        if (m) {
          dom.id++; 
          dom.dom[dom.id] = m[1];
        }
      }
      return 3;
      break;
    case 3:
      if (isdesc.test(line)) {
        var m = line.match(/<description>(.+)<\/description>/);
        if (m) dom.dom[dom.id] += '|'+m[1]; 
      }
      return 3;
      break;
  }
 return dom.state;
}

function parse_plan(planid,data) {
  var lines   = data.split(/\r?\n/);
  var isxml   = new RegExp(/<\?xml/);
  var isnumb  = new RegExp(/^\d+/);
  var isweek  = new RegExp(/^u\d+/i);
  var dom = { dom:{}, state:0, id:0 };
  for (var id=0; id < 48; id++) {
    dom.dom[id] = '';
  }
  if (isxml.test(lines[0]) ) {
    // parse as xml
    for (var i in lines) {
      var line = lines[i];
      dom.state = doit(dom,line);
    }
  } else {
     // parse as plain text, just stuff line into name
     for (var i in lines) {
      var line = lines[i];
      // check if we have a leading number in range [0,47]
      if (isnumb.test(line)) {
        // the line starts with a number
        var num = +line.match(/^(\d+)/)[1];
        //console.log("came here",num);
        if (num >= 0 && num < 48) {
          dom.id = num;
          var nl = line.match(/^(\d+)[ :]?(.+)/);
          line = nl[2] || '';
          //console.log("lines is now ",line);
        }
      }
      if (isweek.test(line)) {
        // the line starts with a number
        var num = +line.match(/^.(\d+)/)[1];
        //console.log("came here",num);
        if (num >= 0 && num < 53) {
          if (num < 33 ) {
            num += 20;
          } else {
            num -= 33;
          }
          dom.id = num;
          var nl = line.match(/^.(\d+)[ :]?(.+)/);
          line = nl[2] || '';
          //console.log("lines is now ",line);
        }
      }
      dom.dom[dom.id] = line ;
      dom.id++;
    }
  }
  return dom.dom;
}

function findUser(firstname,lastname) {
  // search for a user given firstname and lastname
  // try students first (studs may shadow teach)
  var list = [];
  var seen = {};
  if (lastname == '') {
    // just one search word
    // we try department,institution
      var any = new RegExp(firstname.trim(),"i");
      var plain = firstname.trim().toUpperCase();
      for (var i in db.students) {
        var s = db.students[i];
        if (seen[s.id]) continue;
        if (s.lastname.match(any) || s.firstname.match(any) || s.department.match(any)  || s.institution.match(any)) {
           if (s) {
             list.push(s);
             seen[s.id] = 1;
           }
        }
      }
      for (var j in db.teachers) {
        var t = db.teachers[j];
        if (seen[t.id]) continue;
        if (t.lastname.match(any) || t.firstname.match(any) || t.department.match(any)  || t.institution.match(any)) {
           if (t) {
             list.push(t);
             seen[t.id] = 1;
           }
        }
      }
      if (db.memlist[plain]) {
        // the searchterm matches a groupname
        //var gr = courseteach[firstname.trim()].split('_')[1];
        var studlist = db.memlist[plain];
        for (j in studlist) {
          var s = db.students[studlist[j]];
          if (seen[s.id]) continue;
          if (s) {
             list.push(s);
             seen[s.id] = 1;
          }
        }
      } else { 
          if (db.coursesgr[plain]) {
          // the searchterm matches a coursename
          var grlist = db.coursesgr[plain];
          // all groups for this course
          for (i in grlist) {
            var gr = grlist[i];
            if (db.courseteach[plain+'_'+gr]) {
              var tl = db.courseteach[plain+'_'+gr].teach;
              for (var k in tl) {
                t = db.teachers[tl[k]];
                if (t) {
                  t.gr = gr;
                  list.unshift(t);
                }
              }
            }
            var studlist = db.memlist[gr];
            for (j in studlist) {
              var s = db.students[studlist[j]];
              if (s) {
                s.gr = gr;
                list.push(s);
              }  
            }
          }
        }

      }
  } else {
      firstname = firstname.trim();
      lastname = lastname.trim();
      //console.log("fn="+firstname + " ln=" + lastname);
      //console.log("scanning studs");
      for (var i in db.students) {
        var s = db.students[i];
        if (s.firstname.toLowerCase() == firstname && s.lastname.toLowerCase() == lastname) {
           if (s) list.push(s);
           return list;
        }
      }
      // scan thru teachers
      //console.log("scanning teach");
      for (var j in db.teachers) {
        var t = db.teachers[j];
        if (t.firstname.toLowerCase() == firstname && t.lastname.toLowerCase() == lastname) {
           if (t) list.push(t);
           return list;
        }
      }
      var fn = new RegExp(firstname,"i");
      var ln = new RegExp(lastname,"i");
      //console.log("regexp scanning studs");
      for (var i in db.students) {
        var s = db.students[i];
        if ( s.firstname.match(fn) && s.lastname.match(ln)) {
           if (s) list.push(s);
        }
      }
      //console.log("regexp scanning teach");
      for (var j in db.teachers) {
        var t = db.teachers[j];
        if ( t.firstname.match(fn) && t.lastname.match(ln)) {
           if (t) list.push(t);
        }
      }
  }
  return list;
}

process.title = 'node-dummy';
process.addListener('uncaughtException', function (err, stack) {
	console.log('Caught exception: ' + err);
	console.log(err.stack.split('\n'));
});

/*
var connect = require('connect');
var MemStore = require('./memory');
*/
var assetManager = require('connect-assetmanager');
var assetHandler = require('connect-assetmanager-handlers');

var sys = require('sys'),
    connect = require('connect'),
    MemoryStore = connect.session.MemoryStore;

// One minute
var minute = 60000;

// Setup memory store
var memory = new connect.session.MemoryStore({
    reapInterval: minute
  , maxAge: minute * 2
});

var express = require('express');
var form = require('connect-form');
var dummyHelper = require('./lib/dummy-helper');
var SocketServer = require('./lib/socket-server');
var fs = require('fs');
var sass = require('sass');

// preManipulate handler for compiling .sass files to .css
var sass_compile = function (file, path, index, isLast, callback) {
	if (path.match(/\.sass$/)) {
		callback(sass.render(file));
	} else {
		callback(file);
	}
};
var assets = assetManager({
	'js': {
		'route': /\/static\/js\/[0-9]+\/.*\.js/
		, 'path': './public/js/mylibs/'
		, 'dataType': 'js'
		, 'files': [ 'setup.js', 'starbreg.js' , 'plain.js' , 'plans.js' , 'rom.js' , 'rediger.js' ]
		, 'preManipulate': {
			'^': [
				function (file, path, index, isLast, callback) {
					if (path.match(/jquery.client/)) {
						callback(file.replace(/'#socketIoPort#'/, port));
					} else {
						callback(file);
					}
				}
			]
		}
		, 'postManipulate': {
			'^': [
				assetHandler.uglifyJsOptimize
				, function (file, path, index, isLast, callback) {
					callback(file);
					dummyTimestamps.content = Date.now();
				}
			]
		}
	}, 'css': {
		'route': /\/static\/css\/[0-9]+\/.*\.css/
		, 'path': './public/css/'
		, 'dataType': 'css'
		, 'files': [
			'boilerplate.css'
			, 'styles.sass'
			, 'boilerplate_media.css'
			, 'frontend-development.css'
		]
		, 'preManipulate': {
			'msie [6-7]': [
				sass_compile
				, assetHandler.fixVendorPrefixes
				, assetHandler.fixGradients
				, assetHandler.stripDataUrlsPrefix
			]
			, '^': [
				sass_compile
				, assetHandler.fixVendorPrefixes
				, assetHandler.fixGradients
				, assetHandler.replaceImageRefToBase64(__dirname + '/public')
			]
		}
		, 'postManipulate': {
			'^': [
				assetHandler.yuiCssOptimize
				, function (file, path, index, isLast, callback) {
					callback(file);
					dummyTimestamps.css = Date.now();
				}
			]
		}
	}
});
var port = 3000;
var app = module.exports = express.createServer(   form({ keepExtensions: true })  );



app.configure(function() {
	//app.set('view engine', 'ejs');
	app.set('view engine', 'jade');
	app.set('views', __dirname + '/views');
});

//var RedisStore = require('connect-redis')(express);

var oneYear = 31557600000;
app.configure(function() {
	//app.use(connect.conditionalGet());
	//app.use(connect.bodyDecoder());
        app.use(express.bodyParser());
        app.use(express.cookieParser());
        //app.use(express.session({ secret: "keyboard cat", store: new RedisStore }));
	app.use(connect.logger({ format: ':req[x-real-ip]\t:status\t:method\t:url\t' }));
        //app.use(express.cookieDecoder());
        app.use(express.session({store: new MemoryStore( { reapInterval: 60000 * 10 }),secret:"jalla"}));
	app.use(assets);
        app.use(express.static(__dirname + '/public', { maxAge: oneYear }));
	//app.use(connect.staticProvider(__dirname + '/public'));
});



app.dynamicHelpers({
	'cacheTimeStamps': function(req, res) {
		return assets.cacheTimestamps;
	},
        'session': function(req, res) {
                return req.session;
        },
        'userinfo': function(req, res) {
                return req.userinfo;
        }
      
});

//setup the errors
app.error(function (err, req, res, next) {
	console.log(err.stack.split('\n'));
	res.render('500', {locals: {'err': err}});
});

//A route for creating a 500 error (useful to keep around for testing the page)
app.get('/500', function (req, res) {
    throw new Error('This is a 500 Error');
});

// Your routes


app.get('/logout', function(req, res) {
  if (req.session) {
    req.session.auth = null;
    res.clearCookie('auth');
    req.session.destroy(function() {});
  }
  //req.session.user = null;
  delete req.userinfo;
  //db_copy.userinfo = { uid:0 };
  res.redirect('/betelgeuse');
});

app.get('/login', function(req, res) {
  //console.log("GETTING login");
  //console.log(req.query);
  //console.log(req.query);
  if (!req.query.username && req.session.user) {
      res.send(req.session.user);
      return;
  }
  database.authenticate(req.query.username, req.query.password, req.query.its, function(user) {
    //console.log(user);
    if (user) {
      req.session.user = user;
      res.send(user);
      return;
    }
    res.send({id:0});
  });
});

app.post('/save_excursion', function(req, res) {
    // save excursion for given jday - slots
    // and given set of students
    /*
      var idd  = query.jd.substr(3);
      var jd = idd.split('_')[0];
      var day = idd.split('_')[1];
      var text = query.value;
      var name = query.name;
      var userid = query.userid;
      var klass = query.klass;
    */
    if (req.session.user && req.body.userid == req.session.user.id && req.session.user.department == 'Undervisning') {
      //console.log("Teacher saving an excursion");
      var userlist = req.body.userlist;
      //console.log(req.body);
      var rmsg = {ok:true, msg:""};
      var ulist = userlist.split(',');
      function stuffit(msg) {
          var us = ulist.pop();
          if (+us > 0) {
            req.body.userid = +us;
            database.saveabsent(req.session.user,req.body,stuffit);
          } else {
             delete addons.absent;
             res.send({ok:true, msg:"doneitall"});
          }
      };
      stuffit();
    } else {
      res.send({ok:false, msg:"bad user", restart:db.restart});
    }
});
app.post('/save_absent', function(req, res) {
    // save absent for given jday - slots
    if (req.session.user && req.body.userid == req.session.user.id ) {
      //console.log("User saved some data");
      database.saveabsent(req.session.user,req.body,function(msg) {
         res.send(msg);
         delete addons.absent;
      });
    } else {
      res.send({ok:false, msg:"bad user", restart:db.restart});
    }
});

app.post('/create_course', function(req, res) {
    // create a new course
    if (req.session.user && req.session.user.isadmin) {
      console.log("admin creating new course");
      console.log(req.body);
      res.send({ok:true, msg:"new course"});
      //database.saveabsent(req.session.user,req.body,function(msg) {
      //   res.send(msg);
      //   delete addons.absent;
      //});
    } else {
      res.send({ok:false, msg:"bad user", restart:db.restart});
    }
});
app.get('/starblessons', function(req,res) {
    // returns list of all starblessons
    // a starblesson is stored like this
    //  id      | julday  | userid | teachid | roomid | courseid | eventtype | day | slot | class | name  |  value
    //  xxxx    |         |        |   10111 |     56 |          | starbless |   2 |    0 | 0     |       | Kurs i flash
    //          |         |        |   10111 |     56 |   xxxx   | sless     |     |      |       |       | 
    if (req.session.user && req.session.user.isadmin) {
      database.getstarbless(req.session.user, req.query, function(data) {
        res.send(data);
      });
    } else {
      res.send(null);
    }
});


app.get('/getallstarblessdates', function(req,res) {
      database.getallstarblessdates(req.session.user, req.query, function(data) {
        res.send(data);
      });
});

app.get('/getstarblessdates', function(req,res) {
      database.getstarblessdates(req.session.user, req.query, function(data) {
        res.send(data);
      });
});

app.get('/createstarbless', function(req,res) {
    if (req.session.user && req.session.user.isadmin) {
      database.createstarbless(req.session.user, req.query, function(data) {
        res.send(data);
      });
    } else {
      res.send(null);
    }
});

app.get('/savestarbless', function(req,res) {
    if (req.session.user && req.session.user.isadmin) {
      database.savestarbless(req.session.user, req.query, function(data) {
        res.send(data);
      });
    } else {
      res.send(null);
    }
});
app.get('/killstarbless', function(req,res) {
    if (req.session.user && req.session.user.isadmin) {
      database.savestarbless(req.session.user, req.query, function(data) {
        res.send(data);
      });
    } else {
      res.send(null);
    }
});

app.get('/ses', function(req,res) {
        var rr = [];
        for (var ss in req.sessionStore.sessions) {
          var sess = req.sessionStore.sessions[ss];
          var data = JSON.parse(sess);
          var time = new Date(data.lastAccess);
          if (data.user) {
            console.log(data.user,time);
            rr.push([data.user,data.lastAccess]);
          }
        }
        res.send( rr  );
        });

app.get('/getsql', function(req, res) {
    //console.log("getting some general data");
    database.getSomeData(req.session.user, req.query.sql, req.query.param, function(data) {
      res.send(data);
    });
});

app.get('/getabsent', function(req, res) {
    // get absent list
        database.getabsent(req.query, function(absent) {
            addons.absent = absent;
            addons.update.absent = new Date();
            res.send(absent);
          });
});

app.post('/save_timetable', function(req, res) {
    // save a change of timetabledata
    // teachid,day,slot,value
    if (req.session.user && req.session.user.isadmin) {
      console.log("Admin changing a timetable");
      database.saveTimetableSlot(req.session.user,req.body,function(msg) {
         res.send(msg);
      });
    } else {
      res.send({ok:false, msg:"bad user", restart:db.restart});
    }
});

app.post('/save_simple', function(req, res) {
    // save a julday for yearplan or freedays
    if (req.session.user && req.session.user.department == 'Undervisning') {
      //console.log("User saved some data",req.body);
      database.savesimple(req.body,function(msg) {
         res.send(msg);
      });
    } else {
      res.send({ok:false, msg:"bad user", restart:db.restart});
    }
});

app.post('/saveblokk', function(req, res) {
    // save a block (all subjects belonging to a block have specific days set for tests)
    if (req.session.user && req.session.user.department == 'Undervisning') {
      //console.log("User saving block ",req.body);
      database.saveblokk(req.session.user,req.body,function(msg) {
         res.send(msg);
         delete addons.blocks;
      });
    } else {
      res.send({ok:false, msg:"bad user", restart:db.restart});
    }
});

app.post('/savehd', function(req, res) {
    // save a full day test
    if (req.session.user && req.session.user.department == 'Undervisning') {
      //console.log("User saving full day test",req.body);
      database.savehd(req.session.user,req.body,function(msg) {
         res.send(msg);
         delete addons.exams;
      });
    } else {
      res.send({ok:false, msg:"bad user", restart:db.restart});
    }
});

app.post('/save_totfagplan', function(req, res) {
    // several sections may be changed
    if (req.session.user && req.session.user.department == 'Undervisning') {
      //console.log("User saved som data");
      database.updateTotCoursePlan(req.body,function(msg) {
         res.send(msg);
         delete addons.plans;
      });
    } else {
      res.send({ok:false, msg:"bad user", restart:db.restart});
    }
});

app.post('/save_vurd', function(req, res) {
    // user has changed/created a test
    if (req.session.user && req.session.user.department == 'Undervisning') {
      database.saveVurd(req.body,function(msg) {
         //console.log(msg);
         res.send(msg);
      });
    } else {
      res.send({ok:false, msg:"bad user", restart:db.restart});
    }

});

app.post('/save_test', function(req, res) {
    // user has changed/created a test
    var justnow = new Date();
    if (req.session.user && req.session.user.department == 'Undervisning') {
      database.saveTest(req.session.user,req.body,function(msg) {
         //console.log("returned here in app.post");
         //console.log(msg);
         res.send(msg);
         delete addons.tests;
      });
    } else {
      res.send({ok:false, msg:"bad user", restart:db.restart});
    }

});

app.post('/buytickets', function(req, res) {
    // user is selling tickets
    if (req.session.user ) {
      //console.log("User selling some tickets");
      database.selltickets(req.session.user,req.body,function(msg) {
         res.send(msg);
      });
    } else {
      res.send({ok:false, msg:"bad user", restart:db.restart});
    }

});

app.post('/makereserv', function(req, res) {
    // reserv a room
    if (req.session.user && req.session.user.department == 'Undervisning') {
      //console.log("teacher reserving a room");
      database.makereserv(req.session.user,req.body,function(msg) {
         res.send(msg);
      });
    } else {
      res.send({ok:false, msg:"bad user", restart:db.restart});
    }

});

app.post('/modifyplan', function(req, res) {
    // create/update/delete a plan
    console.log(req.body);
    if (req.session.user && req.session.user.department == 'Undervisning' ) {
      database.modifyPlan(req.session.user,req.body,function(msg) {
         res.send(msg);
         if (req.body.operation == 'connect') delete addons.plans;
      });
    } else {
      res.send({ok:false, msg:"bad user", restart:db.restart});
    }

});

app.get('/getdom', function(req, res) {
    if (mydom[req.session.user]) {
      res.send(mydom[req.session.user]);
    } else {
      res.send(null);
    }
    //mydom[req.session.user] = null;
});

app.post('/import', function(req, res, next){
  req.form.complete(function(err, fields, files){
  var planid = fields.planid;
  var loc = fields.loc;
    if (err) {
      next(err);
    } else {
      fs.readFile(files.image.path,'utf-8', function (err, data) {
          if (err) throw err;
          mydom[req.session.user] = parse_plan(planid,data);
          //console.log("loc=",loc," planid=",planid," dom=",dom);
          res.redirect(loc+'&getdom=yes');
      });
    }
    //res.redirect('back');
  });

});

app.get('/getaplan', function(req, res) {
    database.getAplan(req.query.planid,function(plandata) {
            res.send(plandata);
          });
});

app.get('/getallplans', function(req,res) {
    database.getAllPlans(req.query.state,function(plandata) {
            res.send(plandata);
          });
});

app.post('/save_fagplan', function(req, res) {
    // user has new data to push into a plan
    //console.log(req);
    if (req.session.user && req.session.user.department == 'Undervisning' 
         && req.body.uid == req.session.user.id) {
      //console.log("User saved som data ",req.body);
      database.updateCoursePlan(req.body,function(msg) {
         res.send(msg);
         delete addons.plans;
      });
    } else {
      res.send({ok:false, msg:"bad user", restart:db.restart});
    }

});

app.get('/tickets', function(req, res) {
    // only used by mdd
    database.gettickets(req.session.user, req.query,function(tickets) {
            res.send(tickets);
          });
});

app.get('/myplans', function(req, res) {
    console.log("getting myplans");
    database.getMyPlans(req.session.user, function(myplans) {
        res.send(myplans);
    });
});

app.get('/show', function(req, res) {
    // only used by mdd
    database.getshow(function(show) {
            res.send(show);
          });
});

app.get('/getexams', function(req, res) {
    //console.log("getting exams");
    if (req.query.quick && addons && addons.exams) {
      res.send(addons.exams)
      //console.log("quick");
    }
    else  {
            //console.log("query");
    database.getexams(function(exams) {
            addons.exams = exams;
            addons.update.exams = new Date();
            res.send(exams);
          });
    }
});

app.get('/alltests', function(req, res) {
    // get new tests
    //console.log("alltests");
    var justnow = new Date();
    if (addons.tests && ((justnow.getTime() - addons.update.tests.getTime())/60000 < 600  )  ) {
      res.send(addons.tests);
      var diff = (justnow.getTime() - addons.update.tests.getTime())/60000;
      //console.log("resending tests - diff = " + diff);
    } else {
        database.getAllTests(function(prover) {
            addons.tests = prover;
            addons.update.tests = new Date();
            res.send(prover);
          });
    }
});

app.get('/allplans', function(req, res) {
    // requery only if 10h since last query
    // we will refetch allplans if any of them have changed
    // - this we will know because the editor will fetch /saveplan
    // - /saveplan will then refetch allplans (after res.send )
    // thus allplans will mostly always be in memory
    var justnow = new Date();
    //console.log("allplans");
    if (addons.plans && ((justnow.getTime() - addons.update.plans.getTime())/60000 < 600  )  ) {
      res.send(addons.plans);
      var diff = (justnow.getTime() - addons.update.plans.getTime())/60000;
      //console.log("resending allplans - diff = " + diff);
    } else {
      //console.log("fetching all plans");
      database.getCoursePlans(function(plans) {
        addons.plans = plans
        addons.update.plans = new Date();
        res.send(plans);
      });
    }
});

app.get('/reserv', function(req, res) {
    // get all reservations
    // they are expected to change often
    // only get reservations that are ! in the past
        database.getReservations(function(data) {
            res.send(data);
          });
});

app.get('/blocks', function(req, res) {
    // blocks dont change much - reuse value
    if (addons.blocks) {
      res.send(addons.blocks);
    } else database.getBlocks(function(blocks) {
            addons.blocks = blocks;
            res.send(addons.blocks);
          });
});

app.get('/attendance', function(req, res) {
    // get attendance
    database.getAttend(req.session.user,req.query,function(attend) {
            res.send(attend);
          });
});


app.get('/timetables', function(req, res) {
    // timetables dont change much - reuse value
    if (addons.timetable) {
      res.send(addons.timetable);
    } else database.getTimetables(function(timtab) {
            addons.timetable = timtab;
            res.send(addons.timetable);
          });
});



app.get('/yyear', function(req, res) {
    // called when yearplan has been changed
    if (req.query.quick && db && db.yearplan) {
      var data = db.yearplan;
      data.teachers = db.teachers;
      data.start = db.startjd;
      res.send(data)
      //console.log("quick");
    } else 
    database.getyearplan(function(data) {
      db.yearplan = data;
      data.teachers = db.teachers;
      data.start = db.startjd;
      res.send(data);
    });
});

app.get('/freedays', function(req, res) {
    // called when freedays have been changed
    database.getfreedays(function(data) {
      db.freedays = data;
      res.send(data);
    });
});

app.get('/betelgeuse', function(req, res) {
	var locals = { 'key': 'value' };
	locals = dummyHelper.add_overlay(app, req, locals);
	res.render('yearplan/index', locals);
});

app.get('/kalender', function(req, res) {
	var locals = { 'key': 'value' };
	locals = dummyHelper.add_overlay(app, req, locals);
        var today = new Date();
        var month = today.getMonth()+1; var day = today.getDate(); var year = today.getFullYear();
        var thisjd = julian.greg2jul(month,day,year );
        var ip = req.connection.remoteAddress;
	var locals = { 'key': 'value' };
	locals = dummyHelper.add_overlay(app, req, locals);
        if ( req.session.user) {
          // user is logged in
          var user = req.session.user;
	  res.render('yearplan/kalender', { layout:'zkal.jade', julday:thisjd, userid:user.id, loggedin:1, username:user.username, firstname:user.firstname, lastname:user.lastname } );
        } else {
          var uuid = 0;
          var username = req.query.navn;
          var firstname = '';
          var lastname = '';
          if (req.query.navn && db && db.students && db.teachers) {
            username = username.toLowerCase();
            var nameparts = username.split(" ");
            var ln = nameparts.pop();
            var fn = nameparts.join(' ');
            if (fn == '') { fn = ln; ln = '' };
            var ulist = findUser(fn,ln);
            var uu = ulist[0]
            if (uu) {
              uuid = uu.id;
              username = uu.username;
              lastname = uu.lastname;
              firstname = uu.firstname;
            }
          }
          res.render('yearplan/kalender', { layout:'zkal.jade', julday:thisjd, userid:uuid, loggedin:0, username:username, firstname:firstname, lastname:lastname } );
        }
});

app.get('/plain', function(req, res) {
	var locals = { 'key': 'value' };
	var locals = dummyHelper.add_overlay(app, req, locals);
	//res.render('yearplan/plain', locals);
	res.render('yearplan/plain', { layout:'zplain.jade' } );
});

app.get('/elevstarb', function(req, res) {
    //console.log("Getting elevstarb");
    database.getstarb(req.session.user, req.query, function(starblist) {
      res.send(starblist);
    });
});

app.get('/fjernelev', function(req, res) {
    //console.log("Sletter starb ",req.query);
    database.deletestarb(req.session.user, req.query, function(resp) {
      res.send(resp);
    });
});

app.get('/regstud', function(req, res) {
    //console.log("Registering with starbkey ",req.query);
    var ip = req.connection.remoteAddress;
    database.regstarb(ip,req.session.user, req.query, function(resp) {
      //console.log("Student reg with starbkey",req.query);
      res.send(resp);
    });
});

app.get('/teachstarb', function(req, res) {
    // insert list of starb-studs into starb
    console.log("teachstarb ",req.query);
    var starbelever = req.query.starbelever || '';
    var julday      = +req.query.julday || 0;
    var roomid      = +req.query.roomid || 0;
    if (req.session.user && req.session.user.department == 'Undervisning') {
      if (starbelever && julday && roomid) {
        var uid = req.session.user.id;
        var elever = starbelever.split(',');
        var starbreg = [];
        for (var i=0; i< elever.length; i++) {
           var eid = +elever[i];
           starbreg.push( " ("+julday+","+eid+","+uid+","+roomid+") ");
           // 'insert into starb (julday,userid,teachid,roomid) 
        }
        starbreglist = starbreg.join(',');
        database.teachstarb(starbreglist, function(resp) {
            res.send(resp);
            return;
        });
        return;
      }
      console.log("fail - no data");
      res.send( { fail:1, msg:'No data' } );
      return;
    }
    res.send( { fail:1, msg:'Not teach' } );
      console.log("fail - not teach");
    return;
});

app.get('/starbkey', function(req, res) {
    //console.log("Getting starbkey");
    database.genstarb(req.session.user, req.query, function(starbkey) {
      //console.log("Sending starbkey",starbkey);
      res.send(starbkey);
    });
});

app.get('/starb', function(req, res) {
       // starb-reg for students
       // key-gen for teachers
        var today = new Date();
        var month = today.getMonth()+1; var day = today.getDate(); var year = today.getFullYear();
        var thisjd = julian.greg2jul(month,day,year );
        var ip = req.connection.remoteAddress;
        //console.log("REQ",ip);
	var locals = { 'key': 'value' };
	locals = dummyHelper.add_overlay(app, req, locals);
        if ( req.session.user) {
          // user is logged in
          var user = req.session.user;
	  res.render('starb/index', { layout:'zstarb.jade', julday:thisjd, userid:user.id, loggedin:1, username:user.username, firstname:user.firstname, lastname:user.lastname } );
        } else {
          var uuid = 0;
          var username = req.query.navn;
          var firstname = '';
          var lastname = '';
          if (req.query.navn && db && db.students && db.teachers) {
            username = username.toLowerCase();
            var nameparts = username.split(" ");
            var ln = nameparts.pop();
            var fn = nameparts.join(' ');
            if (fn == '') { fn = ln; ln = '' };
            var ulist = findUser(fn,ln);
            var uu = ulist[0]
            if (uu) {
              uuid = uu.id;
              username = uu.username;
              lastname = uu.lastname;
              firstname = uu.firstname;
            }
          }
          res.render('starb/index', { layout:'zstarb.jade', julday:thisjd, userid:uuid, loggedin:0, username:username, firstname:firstname, lastname:lastname } );
        }
});

app.get('/itsplain', function(req, res) {
  if (req.query.planid ) {
    var filename = req.query.course || 'plan';
      database.getAplan(req.query.planid, function(data) {
          var xhtml = '<?xml version="1.0" encoding="utf-8"?>\n\
<plan xmlns="xsdLessonPlan">\n\
  <columns xmlns="">\n\
    <theme_columns>\n\
      <column colType="1" colName="Emne" showOnCoursePage="true" id="8938" />\n\
      <column colType="0" colName="L&amp;#230;rernotater" showOnCoursePage="false" id="8939" />\n\
    </theme_columns>\n\
    <lesson_columns>\n\
      <column colType="3" colName="Leksjon" showOnCoursePage="true" id="8931" />\n\
      <column colType="4" colName="Leksjonsbeskrivelse" showOnCoursePage="true" id="8932" />\n\
      <column colType="5" colName="Dato" showOnCoursePage="true" id="8933" />\n\
      <column colType="6" colName="Undervisningstimer" showOnCoursePage="true" id="8934" />\n\
      <column colType="7" colName="L&amp;#230;replanm&amp;#229;l" showOnCoursePage="true" id="8935" />\n\
      <column colType="8" colName="Ressurser" showOnCoursePage="true" id="8936" />\n\
      <column colType="9" colName="Aktiviteter" showOnCoursePage="true" id="8937" />\n\
      <column colType="0" colName="L&amp;#230;rernotater" showOnCoursePage="false" id="8940" />\n\
      <column colType="0" colName="Leksjonsresultater" showOnCoursePage="false" id="8941" />\n\
      <column colType="0" colName="N&amp;#248;kkelord" showOnCoursePage="false" id="8942" />\n\
      <column colType="0" colName="Vurdering" showOnCoursePage="true" id="8980" />\n\
      <column colType="0" colName="Logg" showOnCoursePage="true" id="8982" />\n\
    </lesson_columns>\n\
  </columns>\n\
  <themes xmlns="" />\n\
  <lessons xmlns="">\n\ ';
            var julday = db.firstweek+7;
            for (var week in data.weeks) {
                var summary = data.weeks[week];
                if (summary ) {
                    summary = summary.replace(/<.+>/g,' ');
                    summary = summary.replace(/&/g,' ');
                    var elm = summary.split('|');
                    var title_elm;
                    if (elm[2]) {
                      title_elm = elm[2].split('.',2);
                    } else {
                      title_elm = ['',''];
                    }
                    var name        = elm[0] || '';
                    var description = elm[3] || '';
                    var vurdering   = elm[1] || '';
                    var logg        = elm[4] || '';
                    var title       = title_elm[0] || '';
                    var tdesc       = title_elm[1] || '';
                    var shortname = name.replace(/ /g,'');
                    if (shortname != '' ) {
                      xhtml += "    <lesson>\n";
                      xhtml += "      <name>"+name+"</name>\n" ;
                      xhtml += "      <description>"+description+"</description>\n" ;

                      var mydate = julian.jdtogregorian(julday-6);
                      mydate.month = (mydate.month < 10) ? "0"+mydate.month : mydate.month;
                      mydate.day = (mydate.day < 10) ? "0"+mydate.day : mydate.day;
                      var strdate = ""+mydate.year+"-"+mydate.month+"-"+mydate.day+"T00:00:00";
                      xhtml += "      <start>"+strdate+"</start>\n" ;

                      mydate = julian.jdtogregorian(julday);
                      mydate.month = (mydate.month < 10) ? "0"+mydate.month : mydate.month;
                      mydate.day = (mydate.day < 10) ? "0"+mydate.day : mydate.day;
                      var strdate = ""+mydate.year+"-"+mydate.month+"-"+mydate.day+"T23:59:59";
                      xhtml += "      <stop>"+strdate+"</stop>\n" ;

                      //usum = oversikt[section]->count;
                      var usum = 5;
                      xhtml += "      <class_hours>"+usum+"</class_hours>\n" ;
                      xhtml += "      <customs>\n" ;
                      xhtml += '        <custom colName="Vurdering" id="8980">'+vurdering+'</custom>'+"\n";
                      xhtml += '        <custom colName="Logg"      id="8982">'+logg+'</custom>'+"\n";
                      xhtml += "      </customs>\n" ;
                      xhtml += "      <objectives>\n" ;
                      xhtml += "        <objective>\n" ;
                      xhtml += '          <title loName="'+title+'" />'+"\n";
                      xhtml += '            <description>'+tdesc+'</description>'+"\n";
                      xhtml += "        </objective>\n" ;
                      xhtml += "      </objectives>\n" ;

                      xhtml += "    </lesson>\n";
                    }
                }
                julday += 7;
            }

            res.writeHead(200 , { "Content-Disposition": 'attachment; filename='+filename+'.xml', "Content-Type":'text/xml' } );
            res.end( xhtml + "  </lessons>\n</plan>");
      });
  }
});

app.get('/', function(req, res) {
  var ip = req.connection.remoteAddress;
  ip = '';
  if (req.session.user || ip.substr(0,6) == '152.93' ) {
      res.redirect('/betelgeuse');
      return;
  }
  res.redirect('/gateway');
});

app.get('/basic', function(req, res) {
        var admins = { "haau6257":1, "gjbe6257":1, "brer6257":1, "kvru6257":1 };
        // get some date info
        // this is done in database.js - but needs redoing here in case
        // the server has been running for more than one day
        // Some returned data will need to be filtered on date
        // The server should be restarted once every day.
        //myclient = database.client;
        //console.log("basic");
        var today = new Date();
        var month = today.getMonth()+1; var day = today.getDate(); var year = today.getFullYear();
        db.firstweek = (month >7) ? julian.w2j(year,33) : julian.w2j(year-1,33)
        db.lastweek  = (month >7) ? julian.w2j(year+1,26) : julian.w2j(year,26)
        // info about this week
        db.thisjd = julian.greg2jul(month,day,year );
        db.startjd = 7 * Math.floor(db.thisjd  / 7);
        db.startdate = julian.jdtogregorian(db.startjd);
        db.enddate = julian.jdtogregorian(db.startjd+6);
        db.week = julian.week(db.startjd);
        var db_copy = db;
        db_copy.userinfo = { uid:0 };
        if (req.query.navn) {
          var username = req.query.navn;
          //username = username.replace(/æ/g,'e').replace(/Æ/g,'E').replace(/ø/g,'o');
          //username = username.replace(/Ø/g,'O').replace(/å/g,'a').replace(/Å/g,'A');
          username = username.toLowerCase();
          var nameparts = username.split(" ");
          var ln = nameparts.pop();
          var fn = nameparts.join(' ');
          if (fn == '') { fn = ln; ln = '' };
          var ulist = findUser(fn,ln);
          //console.log(ulist);
          db_copy.userinfo = (ulist.length == 1) ? ulist[0] : { uid:0 };
          db_copy.ulist = ulist;
          //console.log(db_copy.userinfo);
          if (db_copy.userinfo) {
            db_copy.userinfo.isadmin = (admins[db_copy.userinfo.username] && admins[db_copy.userinfo.username] == 1) ? true : false;
            //console.log(db_copy.userinfo.isadmin);
          }
          req.userinfo = db_copy.userinfo; 
        }
        //console.log("I came here");
        res.send(db_copy);
        //console.log("THIS IS AFTER");
});

app.get('/gateway', function(req, res){
    var locals = { 'key': 'value' };
    locals = dummyHelper.add_overlay(app, req, locals);
    res.render('yearplan/login', { layout:'zlogin.jade' } );
});

app.get('/kon:key', function(req, res){
    if (db.klasskeys) {
      var key = req.params.key;
      console.log(key,db.klasskeys);
      for (var kk in db.klasskeys) {
        var kky = db.klasskeys[kk];
        if (key == kky) {
          var locals = { 'key': 'value' };
          locals = dummyHelper.add_overlay(app, req, locals);
          res.render('yearplan/index', { layout:'layout.jade', key:key, foresatte:kk } );
          //*/
          return;
        }
      }
    }
    res.redirect('/gateway');
});


//The 404 route (ALWAYS keep this as the last route)
app.get('/*', function (req, res) {
    res.render('404');
});

// Keep this just above .listen()
var dummyTimestamps = new dummyHelper.DummyHelper(app);

app.listen(port, null);
new SocketServer(app);
