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
function addslashes(str) {
str=str.replace(/\\/g,'\\\\');
str=str.replace(/\'/g,'\\\'');
str=str.replace(/\"/g,'\\"');
str=str.replace(/\0/g,'\\0');
return str;
}

// '

var allplans = {};
var now = new Date();
var jnow = now.getTime();
var getCoursePlans = function() {
  client.query(
            "SELECT q.id,q.txt as qtext,c.txt as ctxt,c.sann "
          + "   FROM mdl_lgcquiz_question q INNER JOIN mdl_lgcquiz_choice c ON (q.id = c.qnr) "
          + " where q.type='multiple' and teachid=654 limit 10 ",
      function (err, results, fields) {
          if (err) {
              console.log("ERROR: " + err.message);
              throw err;
          }
          var qlist = {};
          for (var i=0,k= results.length; i < k; i++) {
            var qq = results[i];
            if (!qlist[qq.id]) {
                qlist[qq.id] = { display:unescape(decodeURI(qq.qtext)), fasit:[], options:[] };
            }
            qlist[qq.id].options.push(unescape(decodeURI(qq.ctxt)));
            qlist[qq.id].fasit.push(unescape(decodeURI(qq.sann)));
          }
          qql = [];
          for (var qid in qlist) {
            var qobj = qlist[qid];
            qql.push( "( 10024,'"+  addslashes(JSON.stringify(qobj)) + "','multiple',"+jnow+","+jnow+") " );
          }
          questionlist = qql.join(',');
          console.log('insert into quiz_question (teachid,qtext,qtype,created,modified) values '+ questionlist);
          /*
 	  pg.connect(connectionString, after(function(cli) {
             cli.query('insert into quiz_question (teachid,qtext,qtype) values '+ questionlist,
                 after(function(results) {
	     }));
	  }));
          */
      });
}

getCoursePlans();




