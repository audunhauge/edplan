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
pg.connect(connectionString, after(function(cli) {
    client = cli;
    console.log("connected");
    client.query( 'select * from users ', after(function(results) {
      userlist = results.rows;
      pro(client);
    }));
  }));

function findUser(firstname,lastname) {
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
    if (s.firstname.toLowerCase() == firstname && s.lastname.toLowerCase() == lastname) {
       if (s) list.push(s);
       return list;
    }
  }
  var fn = new RegExp(firstname,"i");
  var ln = new RegExp(lastname,"i");
  //console.log("regexp scanning studs");
  for (var i in userlist) {
    var s = userlist[i];
    if ( s.firstname.match(fn) && s.lastname.match(ln)) {
       if (s) list.push(s);
    }
  }
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
  var kogrid = 560;  // TODO select max(id) from groups
  while (i < l) {
    var line = lines[i].toLowerCase();
    //Aamodt,Mariell,LOSJ
    var parts = line.split(',');
    var ln  = parts[0];
    var fn  = parts[1];
    var kon = parts[2];
    if (fn == undefined || ln == undefined || kon == undefined) {
      //console.log("Bad line ",i,line);
    } else {
      if (!kogr[kon]) {
        kogr[kon] = [];
        kogrname2id[kon] = kogrid;
        kogrnames.push( "("  + kogrid + ",'kogr_"  + kon +  "' ) "  );
        kogrid++;
      }
      var found = findUser(fn,ln);
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
      kogrmem.push(  "("  + uid + ","  + kid +  " ) "  );
    }
  }
  var grouplist = kogrnames.join(',');
  var memberlist = kogrmem.join(',');
  /*
  console.log( 'insert into groups (id,groupname) values '+ grouplist);
  console.log( 'insert into members (userid,groupid) values ' + memberlist);
    */

  client.query( 'insert into groups (id,groupname) values '+ grouplist,
       after(function(results) {
         console.log('GROUPS INSERTED');
         client.query( 'insert into members (userid,groupid) values ' + memberlist,
           after(function(results) {
             console.log("ADDED MEMBERS");
           }));
       }));

    

      

  });
}
