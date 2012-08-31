/*
 *  Les inn liste over elever,kontaktlærer
 *  Opprett grupper for alle kontaktlærere
 *  Legg elevene inn i grupper
 *  Oppdater institution til for elever til username for kontaktlærer
 *
*/

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

var userlist;
var db = {};
db.groups = {};
pg.connect(connectionString, after(function(cli) {
    client = cli;
    console.log("connected");
    client.query( 'select * from users ', after(function(results) {
      userlist = results.rows;
      client.query( 'delete from members where flag=1', after(function(results) {
        // remove all members inserted earlier with this script
        // only this script set flag == 1
        client.query( 'select * from groups', after(function(results) {
              db.grmax = 0;
              for (var ii in results.rows) {
                var g = results.rows[ii];
                if (g.id > db.grmax) {
                  db.grmax = g.id;
                }
                db.groups[g.groupname] = g;
              }
              pro(client);
        }));
      }));
    }));
  }));

function findUser(stuid,firstname,lastname) {
  // NOW just search for username - ignore first,lastname
  // search for a user given firstname and lastname
  // try students first (studs may shadow teach)
  var list = [];
  var seen = {};
  firstname = firstname.trim();
  lastname = lastname.trim();
  //console.log("fn="+firstname + " ln=" + lastname);
  //console.log("scanning studs");
  for (var i in userlist) {
    var s = userlist[i];
    //if (s.firstname.toLowerCase() == firstname && s.lastname.toLowerCase() == lastname) {
    if (s.username == stuid) {
       if (s) list.push(s);
       return list;
    }
  }
  /*
  var fn = new RegExp(firstname,"i");
  var ln = new RegExp(lastname,"i");
  //console.log("regexp scanning studs");
  for (var i in userlist) {
    var s = userlist[i];
    if ( s.firstname.match(fn) && s.lastname.match(ln)) {
       if (s) list.push(s);
    }
  }
  */
  return list;
}

function pro(client) {
fs.readFile('kontakt.csv', 'utf8',function (err, data) {
  if (err) throw err;
  var lines = data.split('\n');
  var i = 0;
  var l = lines.length;
  var kogr = {};
  var studs = {};
  var kogrnames = [];
  var kogrname2id = {};
  var kogrid = db.grmax + 1;
  while (i < l) {
    var line = lines[i].toLowerCase();
    //Aamodt,Mariell,LOSJ
    //Aarhus, Arne,ANST,651
    var parts = line.split(',');
    var ln    = parts[0];
    var fn    = parts[1];
    var kon   = parts[2];
    var stuid = parts[3];
    if (fn == undefined || ln == undefined || kon == undefined) {
      //console.log("Bad line ",i,line);
    } else {
      if (!kogr[kon]) {
        if (db.groups['kogr_'+kon]) {
          // group exists
          var gr = db.groups['kogr_'+kon];
          kogr[kon] = [];
          kogrname2id[kon] = gr.id;
        } else {
          kogr[kon] = [];
          kogrname2id[kon] = kogrid;
          kogrnames.push( "("  + kogrid + ",'kogr_"  + kon +  "' ) "  );
          kogrid++;
        }
      }
      var found = findUser(stuid,fn,ln);
      if (found.length == 0) {
        console.log("Not found "+ln+" "+fn);
      } else if (found.length != 1) {
        console.log("Doubles "+ln+" "+fn);
      } else {
        var stu = found[0];
        studs[stu.id] = stu;
        kogr[kon].push(stu.id);
      }
    }
    i++;
  }
  var kogrmem = [];
  for (var koid in kogr) {
    var kid = kogrname2id[koid];
    var memb = kogr[koid];
    for (var ii in memb) {
      var uid = memb[ii];
      kogrmem.push(  "("  + uid + ","  + kid +  " , 1) "  );
    }
  }
  var grouplist = kogrnames.join(',');
  var memberlist = kogrmem.join(',');
  console.log( 'insert into groups (id,groupname) values '+ grouplist);
  console.log( 'insert into members (userid,groupid,flag) values ' + memberlist);
  var sql = (grouplist) ?  'insert into groups (id,groupname) values '+ grouplist : 'select 1+2' ;
  client.query( sql,
       after(function(results) {
         console.log('GROUPS INSERTED');
         client.query( 'insert into members (userid,groupid,flag) values ' + memberlist,
           after(function(results) {
             console.log("ADDED MEMBERS");
           }));
       }));

    

      

  });
}
