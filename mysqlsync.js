var Client = require('mysql').Client;

var client = new Client();
    client.user = 'skeisvangmoodle3';
    client.password = 'Bodric78?';
    client.database = 'skeisvangmoodle3';
    client.host = 'skeisvangmoodle3.mysql.domeneshop.no';

var pg = require('pg');
var sys = require('sys');
var connectionString = "postgres://admin:123simple@localhost/planner";
fs = require('fs');
var after = function(callback) {
    return function(err, queryResult) {
      if(err) {
        console.log("Error! " + sys.inspect(err));
      }
      callback(queryResult)
    }
  }

var julian = require('./julian');

var allplans = {};
var getCoursePlans = function() {
  client.query(
            'SELECT p.*, w.* '
          + '   FROM plan p INNER JOIN weekplan w ON p.id = w.planid '
          + ' order by w.sequence ',
      function (err, results, fields) {
          if (err) {
              console.log("ERROR: " + err.message);
              throw err;
          }
          console.log("came here allplans");
          var fliste = {}; 
          var compliance = {};  // is this a compliant teacher?
          var startdate   = 0;
          var numsections = 0;
          var prevsum = '';  // used to calc lev distance
          for (var i=0,k= results.length; i < k; i++) {
            fag = results[i];
            summary = fag.plantext;
            summary = summary.replace("\n",'<br>');
            summary = summary.replace("\r",'<br>');
            summary = summary.replace("'",'"');
            if (!allplans[fag.userid]) allplans[fag.userid] = {};
            if (!allplans[fag.userid][fag.name]) allplans[fag.userid][fag.name] = {};
            allplans[fag.userid][fag.name][fag.sequence] = summary;
          }
          console.log("got allplans");
          console.log(allplans[654]);
 	  pg.connect(connectionString, after(function(cli) {
	   console.log("connected");
           var pid = 10000;
           var planlist = [];
           var weeklist = [];
           for (var uu in allplans) {
              for (var fag in allplans[uu]) {
                 planlist.push( " ("+pid+",1,1,'"+fag+"') ");
                 for (var ss in allplans[uu][fag]) {
                   weeklist.push( " ("+pid+","+ss+",'"+allplans[uu][fag][ss]+"') ");
                 }
                 pid++;
              }
           }
           cli.query('insert into plan (id,category,userid,name) values ' + planlist.join(','),
               after(function(results) {
                  console.log("PLANS inserted");
                  cli.query('insert into weekplan (planid,sequence,plantext) values ' + weeklist.join(','),
                      after(function(results) {
                         console.log("WEEKPLANS inserted");
                      }));
                   }));
	  }));
      });
}

getCoursePlans();




