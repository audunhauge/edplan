/*
 * Update all plans so that they all have 48 weeks
 *
*/


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
  client.query( ' select plan.id,plan.name, count(weekplan.id) from plan left join weekplan on (plan.id = weekplan.planid) '
               + ' where plan.periodeid=1 group by plan.id,plan.name having count(weekplan.id) < 48;', 
       after(function(results) {
            weekplanlist = [];
	    for (var ii in results.rows) {
		var pp = results.rows[ii];
		for (var wi=0; wi < 48; wi++) {
		  weekplanlist.push('('+pp.id+','+wi+')');
		}
	    }
            client.query( 'insert into weekplan (planid,sequence) values ' + weekplanlist.join(','),
            after(function(results) {
               console.log("weekplans updated");
            }));
      }));
}
