var Client = require('mysql').Client;
var crypto = require('crypto');

var remap = { niwi:{old:1348, nu:10061}, haau:{old:654, nu:10024}, begu:{old:1378, nu:10004}, hotr:{old:1368, nu:10038}, sokn:{old:1374,nu:10081}  };

var user = 'haau';
if (process.argv[2]) {
    var user = process.argv[2];
}
var info = remap[user];

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
  str=str.replace(/\'/g,'´');
  str = str.replace(/\\/g,'');
  str = str.replace(/\[code .+?\]/g,'<pre class=\"prettyprint\">');
  str = str.replace(/\[\/code\]/g,'</pre>');
  return str;
}


var duplicateq = {};     // use md5 to find duplicates
var now = new Date();
var jnow = now.getTime();
var getCoursePlans = function() {
          //*
  client.query(
            "SELECT q.id,q.txt as qtext,c.txt as ctxt,c.sann,q.type, q.emne "
          + "   FROM mdl_lgcquiz_question q INNER JOIN mdl_lgcquiz_choice c ON (q.id = c.qnr) "
          + " where q.type='multiple' and teachid=" + info.old,
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
            var text = JSON.stringify(qobj);
            var m5 = crypto.createHash('md5').update(text).digest("hex");
            if (duplicateq[m5] && duplicateq[m5] == text) {
              console.log("SKIPPING DUPLICATE",text.substr(0,50),'multiple');
              continue;
            } else {
              duplicateq[m5] = text;
            }
            qql.push( "( "+info.nu+",'"+  addslashes(text) + "','multiple',"+jnow+","+jnow+") " );
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
          + " where q.type in ('dragndrop','sequence','textarea','fillin','diff','info','math','textmark') and teachid="+info.old ,
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
            var text = JSON.stringify(qobj);
            var m5 = crypto.createHash('md5').update(text).digest("hex");
            if (duplicateq[m5] && duplicateq[m5] == text) {
              console.log("SKIPPING DUPLICATE",text.substr(0,50),qobj.type);
              continue;
            } else {
              duplicateq[m5] = text;
            }
            qql.push( "( "+info.nu+",'"+  addslashes(text) + "','"+qobj.type+"',"+jnow+","+jnow+") " );
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




