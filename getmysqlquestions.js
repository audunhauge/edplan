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

function cleanup(str) {
  str = str.replace(/\\/g,'');
  str = str.replace(/\[code .+?\]/g,'<pre class=\"prettyprint\">');
  str = str.replace(/\[\/code\]/g,'</pre>');
  return str;
}


var allplans = {};
var now = new Date();
var jnow = now.getTime();
var getCoursePlans = function() {
          //*
  client.query(
            "SELECT q.id,q.txt as qtext,c.txt as ctxt,c.sann,q.type, q.emne "
          + "   FROM mdl_lgcquiz_question q INNER JOIN mdl_lgcquiz_choice c ON (q.id = c.qnr) "
          + " where q.type='multiple' and teachid=654 ",
      function (err, results, fields) {
          if (err) {
              console.log("ERROR: " + err.message);
              throw err;
          }
          var qlist = {};
          for (var i=0,k= results.length; i < k; i++) {
            var qq = results[i];
	    try {
	      var qtx = unescape(decodeURI(qq.qtext));
	      var ctx = unescape(decodeURI(qq.ctxt));
	    } 
	    catch(err) {
	      console.log("ERR ",qq.qtext,qq.ctxt);
              continue;
	    }
	    ctx = cleanup(ctx);
	    qtx = cleanup(qtx);
            if (!qlist[qq.id]) {
                qlist[qq.id] = { display:unescape((qtx)), fasit:[], options:[], tag:qq.emne, type:qq.type };
            }
            qlist[qq.id].options.push(unescape((ctx)));
            qlist[qq.id].fasit.push(unescape(decodeURI(qq.sann)));
          }
          qql = [];
          for (var qid in qlist) {
            var qobj = qlist[qid];
            qql.push( "( 10024,'"+  addslashes(JSON.stringify(qobj)) + "','multiple',"+jnow+","+jnow+") " );
          }
          questionlist = qql.join(',');
          //console.log('insert into quiz_question (teachid,qtext,qtype,created,modified) values '+ questionlist);
 	  pg.connect(connectionString, after(function(cli) {
             cli.query('insert into quiz_question (teachid,qtext,qtype,created,modified) values '+ questionlist,
                 after(function(results) {
			console.log("INSERTED multiple");
	     }));
	  }));
      });
          // */
  client.query(
            "SELECT q.id,q.txt as qtext, q.type, q.emne "
          + "   FROM mdl_lgcquiz_question q  "
          + " where q.type in ('dragndrop','sequence','textarea','fillin','diff','info','math','textmark') and teachid=654",
      function (err, results, fields) {
          if (err) {
              console.log("ERROR: " + err.message);
              throw err;
          }
          var tran = { 'dragndrop':'dragdrop' };
          var qlist = [];
          var qtx;
          for (var i=0,k= results.length; i < k; i++) {
            var qq = results[i];
            var fasit = [];
            var daze = '';
            var emne = qq.emne;
            qq.type = tran[qq.type] || qq.type;
	    try {
	      qtx = unescape(decodeURI(qq.qtext));
	    } 
	    catch(err) {
	      console.log("ERR ",qq.qtext);
              continue;
	    }
	    qtx = cleanup(qtx);
            // find fog and stuff into daze
            qtx = qtx.replace(/_\(\((.+?)\)\)_/g,function(m,ch) {
              if (ch) daze = ch;
              return '';
            });
            qtx = qtx.replace(/\[\[(.+?)\]\]/g,function(m,ch) {
              if (ch) fasit.push(ch);
              return m;
            });
            //console.log(fasit,daze);
            //qlist.push( { display:unescape((qtx)), fasit:fasit, daze:daze, code:"", pycode:"" } );
            qlist.push( { display:unescape((qtx)), tag:qq.emne, type:qq.type } );
          }
          qql = [];
          for (var qid in qlist) {
            var qobj = qlist[qid];
            qql.push( "( 10024,'"+  addslashes(JSON.stringify(qobj)) + "','"+qobj.type+"',"+jnow+","+jnow+") " );
          }
          questionlist = qql.join(',');
          //console.log('insert into quiz_question (teachid,qtext,qtype,created,modified) values '+ questionlist);
          //*
 	  pg.connect(connectionString, after(function(cli) {
             cli.query('insert into quiz_question (teachid,qtext,qtype,created,modified) values '+ questionlist,
                 after(function(results) {
			console.log("INSERTED diuerse");
	     }));
	  }));
          //*/
      });
}

getCoursePlans();




