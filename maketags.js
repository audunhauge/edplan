var creds = require('./creds');
var connectionString = creds.connectionString;
var pg = require('pg');
var sys = require('sys');
fs = require('fs');
var after = function(callback) {
    return function(err, queryResult) {
      if(err) {
        console.log("Error! " + sys.inspect(err));
      }
      callback(queryResult)
    }
  }

function addslashes(str) {
  //str=str.replace(/\\/g,'\\\\');
  //str=str.replace(/\'/g,'«');
  //str=str.replace(/\"/g,'»');
  //str=str.replace(/«/g,'"');
  str=str.replace(/\0/g,'\\0');
  return str;
}


var remap = { niwi:{old:1348, nu:10061}, 
              haau:{old:654, nu:10024}, 
              mara:{old:1371, nu:10054}, 
              jekj:{old:1355, nu:10042},
              vier:{old:1348, nu:10090}, 
              jekj:{old:1355, nu:10042},
              dahi:{old:1328, nu:10009},
              begu:{old:1378, nu:10004}, 
              hotr:{old:1368, nu:10038}, 
              sokn:{old:1374,nu:10081}  };

var user = 'haau';
if (process.argv[2]) {
    var user = process.argv[2];
}
var info = remap[user];


var taglist = {};
var tagid = {};
var nuqtags = {};
var nutags = {};
var getAllTags = function() {
  pg.connect(connectionString, after(function(cli) {
    // first find existing tags
    cli.query('select t.id,qt.qid,t.tagname from quiz_tag t left outer join quiz_qtag qt on (qt.tid = t.id) where t.teachid=' + info.nu,
       after(function(results) {
          if (results && results.rows) {
            for (var i=0, l= results.rows.length; i<l; i++) {
              var nutag = results.rows[i];
              if (!taglist[nutag.tagname]) {
                taglist[nutag.tagname] = {};
                tagid[nutag.tagname] = nutag.id;
              }
              taglist[nutag.tagname][nutag.qid] = 1;  
              // mark this question as tagged with this tagname
            }
          }
          // now find all questions and pick out any tag field from import
          cli.query('select * from quiz_question where teachid='+ info.nu ,
             after(function(results) {
                if (results && results.rows) {
                  for (var i=0, l= results.rows.length; i<l; i++) {
                    var qu = results.rows[i];
                    var str = qu.qtext;
                    try {
                      var ta = JSON.parse(str);
                    } catch(err) {
                      console.log(err,str);
                      continue;
                    }
                    // ignore some non-usefull questions
                    if (ta.tag && ta.tag.substr(0,3) == 'Arb') {
                      if (ta.display.indexOf('Egen') >= 0 || ta.display.indexOf('Elevsam') >= 0) {
                        continue;
                      }
                    }
                    console.log(ta.tag);
                    if (!ta.tag) continue;
                    // try splitting tags on camelcase
                    var camels = [];
                    ta.tag.replace(/([A-ZØÆÅ][0-9a-zøæå]+)/g,function(m,ch) {
                        camels.push(ch);
                      });
                    if (camels.length > 0) {
                      for (var ci = 0; ci < camels.length; ci++) {
                        var cam = camels[ci];
                        if (!taglist[cam] ) {
                          nutags[cam] = 1;
                          taglist[cam] = {};
                        }
                        if (!taglist[cam][qu.id]) {
                          taglist[cam][qu.id] = 2;
                        }
                      }
                    } else {
                      if (!taglist[ta.tag] ) {
                        nutags[ta.tag] = 1;
                        taglist[ta.tag] = {};
                      }
                      if (!taglist[ta.tag][qu.id]) {
                        taglist[ta.tag][qu.id] = 2;
                        // mark for insertion
                      }
                    }
                    // treat the type as a tag
                    if (!taglist[ta.type] ) {
                      nutags[ta.type] = 1;
                      taglist[ta.type] = {};
                    }
                    if (!taglist[ta.type][qu.id]) {
                      taglist[ta.type][qu.id] = 2;
                      // mark for insertion
                    }

                  }
                }
                for (var ttid in taglist) {
                  var tt = taglist[ttid];
                  for (var qid in tt) {
                    if ( tt[qid] == 2) {
                      //console.log(ttid,qid);
                    }
                  }
                }
                var nutaglist = Object.keys(nutags);
                // if this list is not empty then we insert these tags
                // give message NEW TAGS INSERTED - RERUN TO CONNECT TAGS TO QUESTIONS
                if (nutaglist.length > 0) {
                  var tagval = [];
                  for (var ttid in nutaglist) {
                    var tt = nutaglist[ttid];
                    tagval.push( "( "+info.nu+",'"+tt+"')" );
                  }
                  console.log('insert into quiz_tag (teachid,tagname) values '+tagval.join(',') );

                  cli.query('insert into quiz_tag (teachid,tagname) values '+tagval.join(','),
                     after(function(results) {
                         console.log("NEW TAGS INSERTED - RERUN TO CONNECT TAGS TO QUESTIONS");
                     }));
                } else {
                  // all tags exist - so we can insert into qtag
                  console.log("Inserting tags ..");
                  var ttaglist = [];
                  for (var ttid in taglist) {
                    var tt = taglist[ttid];
                    for (var qid in tt) {
                      if ( tt[qid] == 2) {
                        console.log(ttid,tagid[ttid],qid);
                        ttaglist.push( "("+tagid[ttid]+","+qid+")" );
                      }
                    }
                  }
                  cli.query("insert into quiz_qtag (tid,qid) values " + ttaglist.join(',') ,
                     after(function(results) {
                         console.log("inserted quiz_qtag",ttaglist);
                     }));

                }
                
                console.log("DONE");

             }));
       }));
  }));
}

getAllTags();




