// a workbook for a course
//   teach can add elements to book
//   quiz - link to a test
//   questions - question displayd direct on page
//   container - a link to a sub-workbook
//       a container is like a chapter
//       can contain (quiz,question,container)

var wb = { render: {} };
var wbinfo = { trail:[], page:{}, missing:{} };

var tablets = {};   // workaround for lack of drag and drop on tablets

function getUser(uid,pref) {
  // will always get a user
  // notfound will be true if no valid
  // check Department == 'Undervisning' to test for teach
  pref= typeof(pref) != 'undefined' ? pref: 'stud';
  if (pref == 'stud') {
    if (students[uid]) return students[uid];
    if (teachers[uid]) return teachers[uid];
  } else {
    if (teachers[uid]) return teachers[uid];
    if (students[uid]) return students[uid];
  }
  return { notfound:true, firstname:'--', lastname:'--', username:'--', id:uid, department:'--', institution:'--' };
}

function showdate(jsdate) {
  var d = new Date(jsdate);
  var mdate = d.getDate();
  var mmonth = d.getMonth() + 1; //months are zero based
  var myear = d.getFullYear();
  var hh = d.getHours();
  var mm = d.getMinutes();
  return mdate+'.'+mmonth+'-'+myear + ' '+hh+':'+mm;
}

var dragstate = {};   // state of draggable elements
// some qtypes have dragndrop enabled
// they need to store state


function makeTrail() {
    var trail = '';
    var prev = wbinfo.coursename;
    for (var i=0,l=wbinfo.trail.length; i<l; i++) {
      var e = wbinfo.trail[i];
      trail += '<span id="tt'+e.id+'_a" class="cont container">'+prev+'</span>';
      prev = e.name;
    }
    //if (l > 0) trail += '<span class="chapter">' + prev + '</span>';
    if (l > 0) trail += '<span id="tt'+wbinfo.containerid+'_a" class="chapter cont container">'+prev+'</span>';
    return trail;
}


function score2grade(score,grad) {
  grad= typeof(grad) != 'undefined' ? grad: 'medium';
  grades   = {  
    easy: {    // the TEST is easy - the grading is tuf at the top
      0.00: '1',
      0.21: '1+',
      0.26: '2-',
      0.32: '2',
      0.37: '2+',
      0.42: '3-',
      0.48: '3',
      0.55: '3+',
      0.58: '4-',
      0.62: '4',
      0.77: '4+',
      0.80: '5-',
      0.84: '5',
      0.91: '5+',
      0.94: '6-',
      0.97: '6'
             },
    medium: { // normal TEST, standard limits
      0.00: '1',
      0.21: '1+',
      0.26: '2-',
      0.32: '2',
      0.37: '2+',
      0.42: '3-',
      0.48: '3',
      0.55: '3+',
      0.58: '4-',
      0.64: '4',
      0.72: '4+',
      0.75: '5-',
      0.80: '5',
      0.87: '5+',
      0.91: '6-',
      0.96: '6'
             },
    hard: { // the TEST was hard, go easy on the grade limits
      0.00: '1',
      0.21: '1+',
      0.22: '2-',
      0.28: '2',
      0.32: '2+',
      0.38: '3-',
      0.44: '3',
      0.52: '3+',
      0.55: '4-',
      0.61: '4',
      0.67: '4+',
      0.70: '5-',
      0.78: '5',
      0.86: '5+',
      0.91: '6-',
      0.96: '6'
             }

  };
  var gradehash = grades[grad] || grades['medium'];
  var prev = '0.00';
  for (var lim in gradehash) {
    if (+lim > +score) return gradehash[prev];
    prev = lim;
  }
  return '6';
}



function showResults() {
    var group;
    try {
      group = wbinfo.coursename.split('_');
      group = group[1];
    } catch(err) {
      group = '';
    }
    var sortdir = { fn:1, ln:1, grade:1 };  // sort direction
    var reslist = {};
    var showorder = [];   // will be sorted by choice on display page name/grade/time etc
    var displaylist = {};
    var trail = makeTrail();
    function startTime(d) {
      return d.getDate() + '/'+(1+d.getMonth())+ '/' + ("" +d.getFullYear()).substr(2) + ' ' + d.getHours() +':'+ d.getMinutes();
    }
    var skala = wbinfo.courseinfo.contopt.skala;
    var s = '<div id="wbmain"><h1 class="result" id="tt'+wbinfo.containerid+'">Resultat</h1>'+trail+'<div id="results"></div></div>';
    //s += JSON.stringify(wbinfo.courseinfo.contopt);
    $j("#main").html(s);
    $j(".result").click(function() {
          showResults();
        });
    $j.getJSON(mybase+'/getuseranswers',{ container:wbinfo.containerid, group:group, contopt:wbinfo.courseinfo.contopt}, function(results) {
           // results = { res:{ uid ... }, ulist:{ 12:1, 13:1, 14:2, 15:2 }
           if (results) {
             for (var uid in results.ret) {
                var re = results.ret[uid];
                var score = (re.tot) ? re.score/re.tot : 0;
                var gr = Math.round(100*score)/100;
                var prosent = gr*100;
                var first = (re.start) ? startTime( new Date(re.start)) : '' ;
                var last = (re.fresh) ? startTime( new Date(re.fresh)) : '' ;
                var grade = score2grade(gr,skala);
                reslist[uid] = { text:'<span class="kara">' + prosent.toFixed(0) + ' prosent </span>'
                         +  ((wbinfo.courseinfo.contopt.karak == 1) ?'<span class="kara">karakter '+grade+'</span>' : '' )
                         + '<span class="kara"> '+first+'</span><span class="kara"> '+last+'</span>',
                                        grade:gr, first:re.start, last:re.fresh };
             }
             for (var uui in results.ulist) {
               //var started = results.ulist[uui];
               var fn = '--', 
                   ln = '--', 
                   gg = -1,
                   ff = -1,
                   ll = -1,
                   resultat = '<span class="kara">ikke startet</span>';
               var active = '';  // add class for showing result if allowed
               var usr = getUser(uui);
               fn = usr.firstname.caps();
               ln = usr.lastname.caps();
               active =' showme';
               if (reslist[uui]) {
                 resultat = reslist[uui].text;
                 gg = reslist[uui].grade;
                 ff = reslist[uui].first;
                 ll = reslist[uui].last;
               }
               displaylist[uui] =  '<div id="ures'+uui+'" class="userres'+active+'"><span class="fn">' + fn 
                 + '</span><span class="ln">' + ln + '</span>' + resultat + '</div>';
               showorder.push( { id:uui, fn:fn, ln:ln, grade:gg, first:ff, last:ll } );
             }
             _showresults();
             if (teaches(userinfo.id,wbinfo.coursename)) {
               $j("#results").undelegate(".userres","click");
               $j("#results").delegate(".userres","click", function() {
                   var uid = this.id.substr(4);
                   showUserResponse(uid,wbinfo.containerid,results);
                });
             } else {
               $j("#results").undelegate(".showme","click");
               $j("#results").delegate(".showme","click", function() {
                   var uid = this.id.substr(4);
                   showUserResponse(uid,wbinfo.containerid,results);
                });
             }
             $j("#results").undelegate(".heading span","click");
             $j("#results").delegate(".heading span","click", function() {
                 var field = $j(this).attr("sort");
                 var dir = sortdir[field] || 1;
                 dir = -dir;
                 sortdir[field] = dir;
                 _showresults(field,dir);
              });
           }
        });
    function _showresults(field,dir) {
       field   = typeof(field) != 'undefined' ? field : 'grade' ;
       dir   = typeof(dir) != 'undefined' ? dir : -1 ;
       showorder.sort(function (a,b) {
             return a[field] == b[field] ? 0 : (a[field] > b[field] ? dir : -dir) ;
           });
       var display = '<div id="gradelist">';
       display +=  '<div class="userres heading"><span sort="fn" class="fn">Fornavn</span>'
                    + '<span sort="ln" class="ln">Etternavn</span><span sort="grade" class="kara">Score</span>'
                    + ((wbinfo.courseinfo.contopt.karak == 1) ? '<span sort="grade" class="kara">Grade</span>' : '' )
                    + '<span sort="first" class="kara">Start</span><span sort="last" class="kara">Siste</span></div>';
       for (var ii = 0; ii < showorder.length; ii++) {
         if (userinfo.department == 'Undervisning' || wbinfo.courseinfo.contopt.rank == 1 || userinfo.id == showorder[ii].id ) {
           display += displaylist[showorder[ii].id];
         }
       }
       display += '<div class="userres"></div>';
       display += '</div>';
       $j("#results").html(display );
    }

}

function getComment(content) {
  return $j("#"+this.id).attr("title");
}

function updateComment(val,settings) {
  var myid = this.id;
  var uaid = myid.substr(3);
  var uid = _updateScore.uid;
  $j.post(mybase+'/addcomment', { comment:val,  uaid:uaid, uid:uid }, function(comment) {
      // no action yet ..
      // REDRAW question so that comment shows
  });
  return val;
}

var _updateScore;

function updateScore(val,settings) {
  var myid = this.id;
  var elm = myid.substr(2).split('_');
  var qid = elm[0], iid = elm[1];
  var uid = _updateScore.uid;
  var res = _updateScore.res;
  var qua = res.q[qid][iid];

  console.log(qid,iid,uid,res);
  $j.post(mybase+'/editscore', { nuval:val,  iid:iid, qid:qid, cid:wbinfo.containerid, uid:uid, qua:qua }, function(ggrade) {
      // no action yet ..
  });
  return Math.min(+val,qua.points);
}


function showUserResponse(uid,cid,results) {
  // given a user-id and a container
  // show detailed response for all questions in container for this user
  var sscore = { userscore:0, maxscore:0 ,scorelist:{} };
  if (results.ret[uid] != undefined) {
    // var contopt = wbinfo.courseinfo.contopt;
    $j.getJSON(mybase+'/displayuserresponse',{ uid:uid, container:wbinfo.containerid }, function(results) {
      //var ss = wb.render.normal.displayQuest(rr,i,sscore,false);
      //var ss = JSON.stringify(results);
      _updateScore = { uid:uid, res:results };
      var rr = unwindResults(results);
      var skala = wbinfo.courseinfo.contopt.skala;
      score = Math.round(100*sscore.userscore)/100;
      tot = Math.round(100*sscore.maxscore)/100;
      var gr = Math.round(100*score/tot)/100;
      var grade = score2grade(gr,skala);
      var fn='-', ln='-',depp='-';
      var usr = getUser(uid);
      fn = usr.firstname.caps();
      ln = usr.lastname.caps();
      depp = usr.department;
      var header = '<h4>'+fn+' '+ln+' '+depp+'</h4>';
      header += '<h4>'+score+" av "+tot+" Karakter: "+grade+'</h4>';
      $j("#results").html(header+rr);
      $j('#results .score').editable( updateScore , {
                   indicator      : 'Saving...',
                   tooltip        : 'Click to edit...',
                   submit         : 'OK'
               });
      $j('#results .addcomment').editable( updateComment , {
                   indicator      : 'Saving...',
                   type           : 'textarea',
                   getValue       : getComment,
                   width          : '12em',
                   height         : '12em',
                   style          : 'display:block',
                   submit         : 'OK'
               });
      MathJax.Hub.Queue(["Typeset",MathJax.Hub,"main"]);
    });
  }

  function unwindResults(res) {
      var rr = '';
      var ss = [];
      for (var qid in res.q) {
        var qua = res.q[qid];
        for (var iid in qua) {
          var qu = qua[iid];
          var qdiv = wb.render.normal.displayQuest(qu,iid,{},sscore,0,qu.param.fasit);
          ss[iid] = qdiv;
        }
      }
      rr = ss.join('');
      for (var qid in res.c) {
        rr += '<h4>'+res.c[qid].name+'</h4>'+unwindResults(res.c[qid]);
      }
      return rr;
  }

}


function renderPage() {
  // render a page of questions
  // if questions pr page is given
  // then render that many + button for next page
  //   also if navi is set then render back button when not on first page
  _updateScore = { uid:userinfo.id, res:{} };
  $j.getJSON(mybase+'/getqcon',{ container:wbinfo.containerid }, function(container) {
    tablets = { usedlist:{} };    // forget any stored info for dragndrop for tablets on rerender
    if (!container) {
      // we are most likely not logged in any more
      $j("#main").html("Not logged in - session expired or server restart<p>Reload page and logg in again.");
      return;
    }
    var courseinfo;
    try {
      eval( 'courseinfo = '+container.qtext);
    }
    catch(err) {
      courseinfo = {};
    }
    wbinfo.page[wbinfo.containerid] = wbinfo.page[wbinfo.containerid] || 0;
    wbinfo.missing[wbinfo.containerid] = wbinfo.missing[wbinfo.containerid] || 0;
    wbinfo.courseinfo = courseinfo;
    wbinfo.qlistorder = courseinfo.qlistorder || [];
    // call the render functions indexed by layout
    // render the question list and update order if changed
    // typeset any math
    // prepare the workbook editor (setupWB)

    var trail = makeTrail();
    var nav   = '';              // default no page navigation

    var contopt = {};   // options for this container
    if (courseinfo.contopt) {
      contopt = courseinfo.contopt;
    }

    var header,  // header for first page
        body;    // som text info on first page

    // if this is a quiz ...
    if (container.qtype == 'quiz') {
      trail += '<h1 id="quiz">QUIZ </h1>';
      header = '';
    } else {
        header = wb.render[wbinfo.layout].header();
    }
    body = wb.render[wbinfo.layout].body();





    var s = '<div id="wbmain">'+header + trail + body +  '</div>';
    $j("#main").html(s);
    if (teaches(userinfo.id,wbinfo.coursename)) {
      //if (userinfo.department == 'Undervisning') {
      $j("span.wbteachedit").addClass("wbedit");
    }
    $j(".totip").tooltip({position:"bottom right" } );
    $j("#main").undelegate("#nextpage","click");
    $j("#main").delegate("#nextpage","click", function() {
        if ( $j(this).hasClass("disabled") ) return;
        wbinfo.page[wbinfo.containerid] ++;
        renderPage();
    });
    $j("#main").undelegate("#prevpage","click");
    $j("#main").delegate("#prevpage","click", function() {
          wbinfo.page[wbinfo.containerid] --
          renderPage();
    });
    $j("#main").undelegate("#editwb","click");
    $j("#main").delegate("#editwb","click", function() {
        setupWB(header);
    });
    $j("#main").undelegate("#edqlist","click");
    $j("#main").delegate("#edqlist","click", function() {
        edqlist();
    });
    $j("#main").undelegate("span.drop","click");
    $j("#main").delegate("span.drop","click", function() {
        //$j("h1.wbhead").html( this.id );
        var thisq = this.id.substr(2).split('_')[0];
        var thisinst = this.id.substr(2).split('_')[1];
        if (thisq == tablets.qnr && thisinst == tablets.instance && tablets.dropvalue) {
          $j("#"+this.id).html( tablets.dropvalue );
          $j("#"+tablets.active).addClass('used');
          $j("#"+tablets.active).removeClass('act');
          tablets.usedlist[tablets.active] = this.id;
          delete tablets.dropvalue;
        } 
    });
    $j("#main").undelegate("div.gethint","click");
    $j("#main").delegate("div.gethint","click", function() {
          var myid = this.id;
          var elm = myid.substr(4).split('_');
          $j.get(mybase+'/gimmeahint',{ qid:elm[0], uaid:elm[1] }, function(hints) {
               $j('#'+myid).html(hints.join('<br>'));
               MathJax.Hub.Queue(["Typeset",MathJax.Hub,myid]);
            });
        });
    $j("#main").undelegate("ul.sequence","click");
    $j("#main").delegate("ul.sequence, ul.sourcelist","click", function() {
          var nuelm = $j("#"+tablets.active);
          $j("#"+this.id).append(nuelm);
        });
    $j("#main").undelegate("li.dragme","click");
    $j("#main").delegate("li.dragme","click", function() {
        // for ipad and android 
        $j("li.dragme").removeClass('act');
        tablets.active = this.id;
        $j("#"+tablets.active).addClass('act');
        tablets.qnr = this.id.substr(3).split('_')[0];
        tablets.instance = this.id.substr(3).split('_')[1];
        });
    $j("#main").undelegate("span.dragme","click");
    $j("#main").delegate("span.dragme","click", function() {
        // for ipad and android
        $j("span.dragme").removeClass('act');
        if (tablets.usedlist[this.id]) {
          $j("#" + tablets.usedlist[tablets.active]).html('&nbsp;&nbsp;&nbsp;&nbsp;');
          delete tablets.usedlist[tablets.active];
        }
        tablets.active = this.id;
        $j("#"+tablets.active).removeClass('used');
        $j("#"+tablets.active).addClass('act');
        tablets.qnr = this.id.substr(3).split('_')[0];
        tablets.instance = this.id.substr(3).split('_')[1];
        tablets.dropvalue = this.innerHTML;
    });
    $j("#main").undelegate("#quiz","click");
    $j("#main").delegate("#quiz","click", function() {
        showResults();
    });
    function afterEffects() {
        MathJax.Hub.Queue(["Typeset",MathJax.Hub,"main"]);
        $j('#main .addcomment').editable( updateComment, {
                   indicator      : 'Saving...',
                   type           : 'textarea',
                   getValue       : getComment,
                   width          : '12em',
                   height         : '12em',
                   style          : 'display:block',
                   submit         : 'OK'
               });
        $j("span.dragme").draggable( {
              revert:true, 
              start:function(event,ui) {
                var droppid = ui.helper.attr("id");
                $j("#"+droppid).removeClass('used');
                var parid = $j("#"+droppid).parent().attr("id");
                $j("#"+parid+' span[droppid="'+droppid+'"]').removeAttr('droppid').removeClass("filled").html("&nbsp;&nbsp;&nbsp;&nbsp;");
              } //, 
              // containing in parent is troublesome if we are close to right/left edge and
              // the dragged element is wide - cant get element centered on target
              //containment:'parent'
            } );
        $j("span.drop").droppable({
            drop:function(event,ui) {
              // alert(this.id + " gets " + ui.draggable.attr("id"));
              var droppid = ui.draggable.attr("id");
              var nutxt = ui.draggable.html();
              ui.draggable.addClass('used');
              var parid = $j(this).parent().attr("id");
              $j("#"+parid+' span[droppid="'+droppid+'"]').removeAttr('droppid').removeClass("filled").html("&nbsp;&nbsp;&nbsp;&nbsp;");
              $j(this).attr("droppid",droppid).html(nutxt).addClass("filled");
            },
            hoverClass:"ui-state-hover"
          });
        $j( "ul.sequence, ul.sourcelist" ).sortable({
              // containment: 
              connectWith: ".connectedSortable"
         }).disableSelection();
        $j("#main").undelegate(".cont","click");
        $j("#main").delegate(".cont","click", function() {
            if ( $j(this).hasClass("clock")) {
               if (!teaches(userinfo.id,wbinfo.coursename)) {
                 alert("Test not open");
                 return;
               }
            }
            var containerid = this.id.substr(2).split('_')[0];
            if (containerid == wbinfo.containerid) {
              // self-click - last element in trail is ident
              // just reset page and rerender
              if (contopt.navi && contopt.navi == "1") {
                wbinfo.page[containerid] = 0;
                renderPage();
              }
              return;
            }
            var istrail = ( this.id.substr(0,2)  == 'tt');
            if (istrail) {
              // pop from trail until we hit this container-id
              var cinf;
              do {
                cinf = wbinfo.trail.pop();
              } while (wbinfo.trail.length > 0 && cinf.id != containerid );
            } else {
              wbinfo.trail.push({id:wbinfo.containerid,name:$j("#"+this.id).html() });
            }
            wbinfo.page[containerid] = wbinfo.page[containerid] || 0;
            wbinfo.parentid = wbinfo.containerid;   // remember parent
            wbinfo.containerid = containerid;
            renderPage();
        });
       prettyPrint();

    }
    $j.getJSON(mybase+'/getcontainer',{ container:wbinfo.containerid }, function(qlist) {
      // list of distinct questions - can not be used for displaying - as they may need
      // modification based on params stored in useranswers
      // the questions are 'stripped' of info giving correct answer
        var showlist = generateQlist(qlist);
        var pagenum = '';
        if (contopt.antall < qlist.length) {
          // show page number
          pagenum = 'Side ' + (+wbinfo.page[wbinfo.containerid] + 1);
        }
        if (showlist.length) {
          wb.render[wbinfo.layout].qlist(wbinfo.containerid, showlist, contopt, function(renderq) {
                $j("#qlist").html( renderq.showlist);
                $j("#progress").html( '<div id="page">'+pagenum+'</div><div id="maxscore">'
                            +renderq.maxscore+'</div><div id="uscore">'+renderq.uscore+'</div>');
                afterEffects();
                if (contopt.omstart && contopt.omstart == "1") {
                    $j("#progress").append('<div title="Gi meg ett nytt sett med spørsmål" id="renew" class="gradebutton">Lag nye</div>');
                    $j("#renew").click(function() {
                       $j.post(mybase+"/studresetcontainer",{ uid:userinfo.id, container:wbinfo.containerid},function(res) {
                         renderPage();
                       });
                    });
                }
                // if the test is locked for grading (all studs completed).
                if (!(contopt.locked && contopt.locked == "1")) {
                    $j(".grademe").html('<div class="gradebutton">Vurder</div>');
                    $j("#qlistbox").undelegate(".grademe","click");
                    $j("#qlistbox").delegate(".grademe","click", function() {
                        var myid = $j(this).parent().attr("id");
                        $j("#"+myid+" div.gradebutton").html("Lagrer..");
                        $j("#"+myid+" div.gradebutton").addClass("working");
                        var elm = myid.substr(5).split('_');  // fetch questionid and instance id (is equal to index in display-list)
                        var qid = elm[0], iid = elm[1];
                        var ua = wb.getUserAnswer(qid,iid,myid,renderq.qrender);
                        $j.post(mybase+'/gradeuseranswer', {  contopt:contopt, iid:iid, qid:qid, cid:wbinfo.containerid, ua:ua }, function(ggrade) {
                              ggrade.qua.display = ggrade.qua.param.display;
                              ggrade.qua.score = ggrade.score;
                              wb.render[wbinfo.layout].qrend(contopt,iid,qid,ggrade.qua,renderq.qrender,renderq.scorelist,function(adjust) {
                                      //$j("#qlist").html( renderq.showlist);
                                      $j("#"+adjust.sscore.qdivid).html(adjust.sscore.qdiv);
                                      $j("#"+adjust.sscore.scid).html( adjust.sscore.userscore);
                                      $j("#"+adjust.sscore.atid).html( ggrade.att);
                                      $j("#uscore").html(Math.floor(100*adjust.sumscore) / 100);
                                      redrawQuestion(iid,ggrade.att,adjust.sscore.userscore);  // redraw next question if any
                              });
                        });
                    });
                };


              function redrawQuestion(iid,att,score) {
                var doafter = true;
                if (att == 1) wbinfo.missing[wbinfo.containerid]--;
                if (wbinfo.missing[wbinfo.containerid] < 1) {
                  $j("#nextpage").removeClass("disabled");
                }
                if (contopt.trinn == "1") {
                 var nuid = +iid + 1;
                 var myid = $j(".qq"+nuid).attr("id");
                 if (myid && (att>4 || score > 0.8) ) {
                   var elm = myid.substr(2).split('_');  // fetch questionid and instance id (is equal to index in display-list)
                   var qid = elm[0];
                   var qu = renderq.qrender[nuid];
                   if (qu.param.donotshow) {
                     qu.param.donotshow = 0;
                     doafter = false;
                     wb.render[wbinfo.layout].qrend(contopt,nuid,qid,qu,renderq.qrender,renderq.scorelist,function(addj) {
                         $j("#"+addj.sscore.qdivid).html(addj.sscore.qdiv);
                         $j("#"+addj.sscore.scid).html( addj.score);
                         $j("#"+addj.sscore.atid).html( qu.attemptnum);
                         afterEffects();
                         $j(".grademe").html('<div class="gradebutton">Vurder</div>');
                      });
                   }
                  } 
                }
                if (doafter) {
                       afterEffects();
                       $j(".grademe").html('<div class="gradebutton">Vurder</div>');
                }
              }
          });
        }
    });
  });
}

function generateQlist(qlist) {
      var showlist = [];
      if (qlist) {
        // qlist is list of questions in this container
        var ql = {};
        var trulist = []; // a revised version of qlistorder where ids are good
        var changed = false;
        for (var qi in qlist) {
          var qu = qlist[qi];
          ql[qu.id] = qu;
        }
        for (var qi in ql) {
          var hit = false;
          for (var qli in wbinfo.qlistorder) {
            var qlii = wbinfo.qlistorder[qli];
             if (+qi == +qlii) {
                hit = true;
                break;
             }
          }
          if (!hit) {
            changed = true;
            wbinfo.qlistorder.push(qi);
          }
        }
        var points = 0;
        for (var qi in wbinfo.qlistorder) {
          var quid = wbinfo.qlistorder[qi];
          if (ql[quid]) {
            trulist.push(quid);
            var qu = ql[quid];
            points += +qu.points;
            showlist.push(qu);
          } else {
              console.log("MISSIL ",ql,quid);
              changed = true;
          }
        }
        // update qlistorder in the container if different from orig
        if (changed) {
          console.log("CHANGED ",trulist,wbinfo.qlistorder,points);
          wbinfo.courseinfo.qlistorder = trulist;
          $j.post(mybase+'/editquest', { action:'update', points:points, qtext:wbinfo.courseinfo, qid:wbinfo.containerid }, function(resp) {
          });
        }

        // original
      }
      wbinfo.qlist = qlist;
      return showlist;
}

function getTimmy(coursename,timmy,tidy) {
    if (timetables && timetables.course) {
      for (var tt in timetables.course[coursename] ) {
        var tty = timetables.course[coursename][tt];
        if (!timmy[tty[0]]) {
          timmy[tty[0]] = {};
          tidy [tty[0]] = [];
        }
        if (timmy[ tty[0] ][ tty[1] ]) continue;
        timmy[ tty[0] ][ tty[1] ] = 1;
        tidy[ tty[0] ].push(""+(1+tty[1]));
      }
    }
}

function edqlist() {
  var showlist = generateQlist(wbinfo.qlist);
  var showqlist = wb.render[wbinfo.layout].editql(showlist);
  var header = wb.render[wbinfo.layout].header();
  var head = '<h1 class="wbhead">' + header + '</h1>' ;
  var s = '<div id="wbmain">' + head + '<div id="qlistbox"><div id="sortable">'
         +showqlist 
         + '</div><div title="Lag nytt spørsmål" id="addmore" class="button">add</div>'
         + '<div title="Nullstill svarlista" id="reset" class="gradebutton">reset</div>'
         + '<div title="Lag klasseset - generer alle sprsml for alle elever i gruppa" id="regen" class="gradebutton">regen</div>'
         + '<div title="Exporter spørsmål" id="export" class="gradebutton">export</div>'
         + '<div title="Importer spørsmål" id="import" class="gradebutton">import</div>'
         + '<div tag="'+wbinfo.containerid+'" title="Rediger QUIZ" id="edquiz" class="gradebutton">REDIGER</div>'
         + '<div id="qlist" class="qlist"></div>'
         + '<div id="importdia" ></div>'
         + '<div title="Legg til eksisterende sprsml" id="attach" class="gradebutton">attach</div></div></div>';
  $j("#main").html(s);
  //MathJax.Hub.Queue(["Typeset",MathJax.Hub,"main"]);
  //$j.post("/resetcontainer",{ container:wbinfo.containerid});
  $j("#sortable").sortable({placeholder:"ui-state-highlight",update: function(event, ui) {
            var ser = $j("#sortable").sortable("toArray");
            var trulist = [];
            for (var i=0,l=ser.length; i<l; i++) {
              trulist.push(ser[i].split('_')[1]);
            }
            wbinfo.courseinfo.qlistorder = trulist;
            $j.post(mybase+'/editquest', { action:'update', qtext:wbinfo.courseinfo, qid:wbinfo.containerid }, function(resp) {
            });
          }  
       });
  $j("#qlist").dialog({ width:550, height:500, autoOpen:false, title:'Pick question',
     buttons: {
       "Cancel": function() {
             $j( this ).dialog( "close" );
        },
       "Oppdater": function() {
               $j( this ).dialog( "close" );
               var nulist = $j.map($j("#qqlist div.chooseme"),function(e,i) {
                    return e.id.substr(4);
                  });
               // filter the new list removing questions already in container
               // this is the set of questions to insert intoquestion_container
               if (wbinfo.courseinfo.qlistorder && wbinfo.courseinfo.qlistorder.length) {
                 var nufilter = $j.grep(nulist,function(e,i) {
                   return ($j.inArray(e,wbinfo.courseinfo.qlistorder) < 0 );
                 });
               } else {
                 nufilter = nulist;
                 wbinfo.courseinfo.qlistorder = [];
               }
               $j.post(mybase+'/editqncontainer', { action:'insert', container:wbinfo.containerid, nuqs:nufilter.join(',') }, function(resp) {
                    wbinfo.courseinfo.qlistorder = wbinfo.courseinfo.qlistorder.concat(nulist);
                    $j.post(mybase+'/editquest', { action:'update', qtext:wbinfo.courseinfo, qid:wbinfo.containerid }, function(resp) {
                      //workbook(wbinfo.coursename);
                      renderPage();
                    });
               });
              
            }
         }
  });
  $j("#attach").click(function() {
    var dia = ''
        + '<div id="selectag"><span class="tagtitle">Tags</span>'
        + '  <div id="chtag"></div>'
        + '  <div id="qqlist"></div>'
        + '</div>'
        + '<div id="multi"> Multiple: <input id="mult" name="mult" type="checkbox"></div>';
    $j("#qlist").html(dia);
    var taggis = {};
    var subject = wbinfo.coursename.split('_')[0];
    $j.getJSON(mybase+'/gettags', { subject:subject }, function(tags) {
         var mytags = tags[userinfo.id] || [];
         var tlist = [];
         for (var i=0,l=mytags.length; i<l; i++) {
           var tag = mytags[i];
           tlist.push('<div id="tt'+tag+'" class="tagdiv"><div class="tagg">'+tag+'</div></div>');
         }
         tlist.push('<div id="ttnon" class="tagdiv"><div class="tagg">uten tag</div></div>');
         $j("#chtag").html(tlist.join(''));
         $j("#qlist").dialog('open');
         $j("#qqlist").undelegate(".equest","click");
         $j("#qqlist").delegate(".equest","click", function() {
              var myid = this.id;
              $j("#"+myid).toggleClass("chooseme");
           });
         $j("#selectag").undelegate(".tagdiv","click");
         $j("#selectag").delegate(".tagdiv","click", function() {
           $j("#qlistbox div.equest").removeClass("chooseme");
           var mytag = this.id;
           var tagname = mytag.substr(2);
           if (taggis[tagname]) {
             delete taggis[tagname];
             $j("#"+mytag).removeClass("tagon");
           } else {
             taggis[tagname] = 1;
             $j("#"+mytag).addClass("tagon");
           }
           var taglist = Object.keys(taggis).join(',');
           $j.getJSON(mybase+'/getquesttags',{ tags:taglist, subject:subject }, function(qtlist) {
                // qtlist = { tagname:{ teachid:[qid,..], ... }
                var mmu = $j("#mult").is(":checked");
                //var mmu =  (multi && multi.length) ? true : false;
                var qqlist = [];
                var xqqlist = [];
                var tagsforq = {}; // tags for question
                var qids = {};     // list of seen questions
                var totag = 0;     // count of tags
                taggis = {};       // remove mark from tags
                $j(".tagdiv").removeClass("tagon");
                if (qtlist ) {
                  // first gather all tags for questions
                  for(var tname in qtlist) {
                    for(var i in qtlist[tname][userinfo.id]) {
                      var qqa =qtlist[tname][userinfo.id][i];
                      if (!tagsforq[qqa.id]) {
                        tagsforq[qqa.id] = [];
                      }
                      tagsforq[qqa.id].push(tname);
                    }
                  }
                  for(var tname in qtlist) {
                    totag++;
                    for(var i in qtlist[tname][userinfo.id]) {
                      var qqa =qtlist[tname][userinfo.id][i];
                      var param = {};
                      try {
                        param = JSON.parse(qqa.qtext);
                      }
                      catch (err) {
                        param = {};
                      }
                      var already = $j.inArray(""+qqa.id,wbinfo.qlistorder) >= 0; 
                      if (already) {
                        $j("#qq_"+qqa.id).addClass("chooseme");
                      }
                      if (mmu || !already) {
                        if (!qids[qqa.id]) {
                          qids[qqa.id] = 0;
                          var shorttext = param.display || '&lt; no text &gt;';
                          var duup = already ? 'duup' : '';
                          shorttext = shorttext.replace(/</g,'&lt;');
                          shorttext = shorttext.replace(/>/g,'&gt;');
                          var tit = tagsforq[qqa.id].join(',');
                          var qdiv = '<div title="'+tit+'" class="equest listqq '+duup+'" id="zqq_'+qqa.id+'"><span class="qid">' 
                                     + qqa.id+ '</span><span class="img img'+qqa.qtype+'"></span>'
                                     + '<span >' + qqa.qtype + '</span><span > '
                                     + qqa.name + '</span><span >' + shorttext.substr(0,20)
                                     + '</span></div>';
                          qqlist.push([qqa.id,qdiv]);
                        }
                        qids[qqa.id] += 1;
                      } 
                      taggis[tname] = 1;
                      $j("#tt"+tname).addClass("tagon");
                    }
                  }
                }
                // shift questions to the right - depending on how few tags they have
                // questions with all tags applied will be flush to the left edge
                // first we sort em so that qs with most tags are at top
                function sso(a,b) {
                      return qids[b[0]] - qids[a[0]];
                }
                qqlist.sort(sso);
                for (var i=0; i< qqlist.length; i++) {
                  xqqlist.push(qqlist[i][1]);
                }
                $j("#qqlist").html(xqqlist.join(''));
                for (var qiq in qids) {
                  var qii = qids[qiq];  // count of tags for question
                  $j("#zqq_"+qiq).css("margin-left",(totag -qii)*3);
                  if (qii == totag) {
                    $j("#zqq_"+qiq).addClass('tagon');
                  }
                }

           });
         });
     });
     return false;
  });
  $j("#addmore").click(function() {  
      // the newly created question is given subject based on coursename
      var subject = wbinfo.coursename.split('_')[0];
      $j.post(mybase+'/editqncontainer', { action:'create', container:wbinfo.containerid, subject:subject }, function(resp) {
         $j.getJSON(mybase+'/getcontainer',{ container:wbinfo.containerid }, function(qlist) {
           wbinfo.qlist = qlist;
           edqlist();
         });
      });
  });
  $j("#reset").click(function() {
     $j.post(mybase+"/resetcontainer",{ container:wbinfo.containerid});
     show_thisweek();
  });
  /*
  $j("#regen").click(function() {
     var group;
     try {
        group = wbinfo.coursename.split('_');
        group = group[1];
     } catch(err) {
        group = '';
     }
     $j.post(mybase+'/generateforall',{ parentid:wbinfo.parentid, group:group, container:wbinfo.containerid, questlist:showlist}, function(qrender) {
     });
  });
  */
  $j("#edquiz").click(function() {
     var myid = $j("#"+this.id).attr('tag');
     editquestion(+myid);
  });
  $j("#export").click(function() {
     //$j.get("/exportcontainer",{ container:wbinfo.containerid});
     window.location.href="/exportcontainer?container="+wbinfo.containerid;
  });
  $j("#import").click(function() {
      var imp = '<div id="fff">'
                 + '<form action="/importcontainer" method="post" enctype="multipart/form-data">'
                 + '<p>Spørsmål: <input type="file" name="image" /></p>'
                 + '<input id="containerid" type="hidden" name="containerid" value="'+wbinfo.containerid+'" />'
                 + '<input id="loc" type="hidden" name="loc" value="'+document.location+'" />'
                 + '<input id="wbinfo" type="hidden" name="wbinfo" value="'+escape(JSON.stringify(wbinfo))+'" />'
                 + '<p><input type="submit" value="Upload" /></p>'
                 + '</form></div>';
     $j("#importdia").html(imp);
  });
  $j(".wbhead").click(function() {
      //workbook(wbinfo.coursename);
      renderPage();
  });
  // check if question editor is loaded
  // and load it if missing
  if (typeof(editquestion) == 'undefined' ) {
      $j.getScript('js/'+database.version+'/quiz/editquestion.js', function() {
              editbind();
      });
  } else {
     editbind();
  }
}

function editbind() {
        //$j("#sortable").undelegate(".equest","click");
        $j("#sortable").undelegate(".edme","click");
        $j("#sortable").delegate(".edme","click", function() {
                var myid = $j(this).parent().attr("id").split('_')[1];
                editquestion(myid);
            });
        $j("#sortable").undelegate(".killer","click");
        $j("#sortable").delegate(".killer","click", function() {
                var myid = $j(this).parent().attr("id");
                dropquestion(myid);
            });
}

function workbook(coursename) {
    wbinfo = { trail:[], page:{}, missing:{} };
    wbinfo.coursename = coursename;
    wbinfo.courseid = database.cname2id[coursename];
    var plandata = courseplans[coursename];
    var tests = coursetests(coursename);
    var felms = coursename.split('_');
    var fag = felms[0];
    var gru = felms[1];
    wbinfo.timmy = {};
    wbinfo.tidy = {};
    getTimmy(coursename,wbinfo.timmy,wbinfo.tidy);
    var startjd = database.firstweek;
    var tjd = database.startjd;
    var section = Math.min(47,Math.floor((tjd - startjd) / 7));
    // build timetable data for quick reference
    var uke = julian.week(tjd);
    var elever = memberlist[gru];
    var info = synopsis(coursename,plandata);
    wbinfo.weeksummary = showAweek(false,gru,elever,info,absent,wbinfo.timmy,tests,plandata,uke,tjd,section);
    $j.getJSON(mybase+'/workbook',{ courseid:wbinfo.courseid, coursename:coursename }, function(resp) {
        if (resp) {
          var courseinfo;
          try {
            eval( 'courseinfo = '+resp.qtext);
          }
          catch(err) {
            courseinfo = {};
          }
          wbinfo.courseinfo = courseinfo;
          wbinfo.quizid = resp.quizid;
          wbinfo.containerid = resp.id;
          wbinfo.parentid = 0;
          wbinfo.title = courseinfo.title || coursename;
          wbinfo.ingress = courseinfo.ingress || '';
          wbinfo.bodytext = courseinfo.text || '';
          wbinfo.layout = courseinfo.layout || 'normal';
          wbinfo.qlistorder = courseinfo.qlistorder || [];
          if (wb.render[wbinfo.layout] ) {
            renderPage();
          }  else {
            $j.getScript('js/'+database.version+'/workbook/'+wbinfo.layout+'.js', function() {
                   renderPage();
              });
          }
        }
    });
}

function makeSelect(name,selected,arr) {
  // prelim version - needs selected,value and ids
  var s = '<select name="'+name+'" id="'+name+'" ">';
  for (var ii in arr) {
    var oo = arr[ii];
    var sel = (selected == oo) ? ' selected="selected" ' : '';
    s += '<option '+sel+' value="'+oo+'">'+oo+'</option>';
  }
  s += '</select>';
  return s;
}

function setupWB(heading) {
  $j.getJSON(mybase+'/workbook',{ courseid:wbinfo.courseid, coursename:wbinfo.coursename }, function(resp) {
    if (resp) {
      var courseinfo;
      try {
        eval( 'courseinfo = '+resp.qtext);
      }
      catch(err) {
        courseinfo = {};
      }
      var title = courseinfo.title || wbinfo.coursename;
      var ingress = courseinfo.ingress || '';
      var text = courseinfo.text || '';
      var chosenlayout = courseinfo.layout || '';

      var head = '<h1 class="wbhead">' + heading + '</h1>' ;
      var layout = makeSelect('layout',chosenlayout,"normal cool".split(' '));
      var setup = '<div id="editform">'
                 + '<table>'
                 + ' <tr>  <th>Tittel</th>  <td colspan="3" ><input name="tittel" type="text" value="'+title+'"></td></tr>'
                 + ' <tr>  <th>Ingress</th> <td colspan="3" ><textarea id="ingress">'+ingress+'</textarea></td></tr>'
                 + ' <tr>  <th>Tekst</th>   <td colspan="3" ><textarea id="text">'+text+'</textarea></td></tr>'
                 + ' <tr>  <th>Layout</th>  <td>'+layout+'</td>'
                 + '   <th>Layout</th>  <td>ertioyiu</td></tr>'
                 + ' <tr>  <th>Jalla</th>  <td>dsfkjhhsd kjsdfhkjh</td>'
                 + '   <th>khjk</th>  <td>dfghkj sdhfkjh</td></tr>'
                 + ' <tr>  <th></th>   <td><div id="save" class="button">Lagre</div></td></tr>'
                 + '</table>'
                 + '</form>'
                 + '</div>'
                 + '';
      var s = '<div id="wbmain">' + head + setup + '</div>';
      $j("#main").html(s);
      $j(".wbhead").click(function() {
            //workbook(wbinfo.coursename);
            renderPage();
          });
      $j("#save").click(function() {
            courseinfo.title = $j("input[name=tittel]").val();
            courseinfo.ingress = $j('#ingress').val()
            courseinfo.text = $j('#text').val()
            courseinfo.layout = $j("#layout option:selected").val();
            //$j.post('/editquest', { action:'update', qtext:{ title:title, ingress:ingress, text:text, layout:layout }, qid:resp.id }, function(resp) {
            $j.post(mybase+'/editquest', { action:'update', qtext:courseinfo, qid:resp.id }, function(resp) {
                 //workbook(wbinfo.coursename);
                 renderPage();
                 //setupWB(courseid,coursename,heading);
              });
          });
    }
  });
}


/*
 * This code really belongs in quiz/editquestion.js
 * but during debug we need it here
 *
*/ 


var dialog = { daze:'', contopt:{} };  // pesky dialog


function editquestion(myid, target) {
  // given a quid - edit the question
 target   = typeof(target) != 'undefined' ? target : '#main';
 var descript = { multiple:'Multiple choice', dragdrop:'Drag and Drop', sequence:'Place in order' 
               , info:'Information'
               , textarea:'Free text'
               , numeric:'Numeric answers'
               , fillin:'Textbox'
               , diff:'Difference'
               , container:'SubChapter'
               , quiz:'A quiz'
 };
 $j.getJSON(mybase+'/getquestion',{ qid:myid }, function(q) {
   dialog.qtype = q.qtype;
   dialog.qpoints = q.points;
   dialog.qcode = q.code;
   dialog.pycode = q.pycode;
   dialog.hints = q.hints || '';
   dialog.daze = q.daze || '';
   dialog.contopt = q.contopt || {};
   var qdescript = descript[q.qtype] || q.qtype;
   var selectype = makeSelect('qtype',q.qtype,"multiple,diff,dragdrop,sequence,fillin,numeric,info,textarea,container,quiz".split(','));
   var head = '<h1 id="heading" class="wbhead">Question editor</h1>' ;
        head += '<h3>Question '+ q.id + ' ' + qdescript + '</h3>' ;
   var variants = editVariants(q);
   var sync = '';
   if (q.sync && q.sync.origtext) {
      var syncdiff = diffString(q.display,q.sync.origtext);
      sync = '<span title="Synkroniser mot original" id="sync">Sync</span><div class="diff">'+syncdiff+'</div>';
   }
   var s = '<div id="wbmain">' + head + '<div id="qlistbox"><div id="editform">'
        + '<table class="qed">'
        + '<tr><th>Navn</th><td><input class="txted" name="qname" type="text" value="' + q.name + '"></td></tr>'
        + variants.qdisplay
        + '<tr><th>Detaljer <div id="details"></div></th><td>'+sync+'</td></tr>'
        + '</table>'
        + '<div id="taggs"><span class="tagtitle">Tags</span>'
        + '  <div id="taglist"><div id="mytags"></div>'
        + '  <div id="tagtxt"><input name="tagtxt" value=""></div>'
        + '  <div id="nutag" class="tinybut"><div id="ppp">+</div></div></div>'
        + '</div>'
        + '<div id="edetails" ></div>';
   //s += editVariants(q);
   s += variants.options;
   //if (target == "#main") s += '<div id="killquest"><div id="xx">x</div></div>';
   s += '</div></div>';

   $j(target).html(s);
   $j('#sync').click(function() {
         q.count = q.count ? q.count + 1 : 1 ;
         if ( q.count % 2) {
           $j("#qdisplay").text(q.sync.origtext).css("background","#fdd");
         } else {
           $j("#qdisplay").text(q.display).css("background","#ffe");
         }
       });
   $j("#start,#stop").datepicker( {showWeek:true, firstDay:1 
       , dayNamesMin:"Sø Ma Ti On To Fr Lø".split(' ')
       , monthNames:"Januar Februar Mars April Mai Juni July August September Oktober November Desember".split(' ')
       , weekHeader:"Uke"
       , dateFormat:"dd/mm/yy"
       } );
   $j("#edetails").dialog({ width:550, autoOpen:false, title:'Details',
     buttons: {
       "Cancel": function() {
             $j( this ).dialog( "close" );
        },
       "Oppdater": function() {
               //alert($j("input[name=qpoints]").val());
             $j( this ).dialog( "close" );
             dialog.qtype = $j("select[name=qtype]").val();
             dialog.qpoints = $j("input[name=qpoints]").val();
             dialog.qcode = $j("#qcode").val();
             dialog.pycode = $j("#pycode").val();
             dialog.hints = $j("#hints").val();
             $j("#saveq").addClass('red');
            }
         }
   });
   // enable/disable dependent controls
   $j("#inputdiv").undelegate(".deppers","change");
   $j("#inputdiv").delegate(".deppers","change", function() {
         var test = $j(this).attr("derp");
         var val = $j(this).val();
         var elm = test.split(';');
         for (var i=0; i< elm.length; i++) {
           var listener = elm[i].split(':');
           if (val == listener[1]) {
             $j("#"+listener[0]).removeAttr('disabled').css("background","#ffe");
           } else {
             $j("#"+listener[0]).attr('disabled', 'disabled').css("background","#ccc");
           }
         }
       });
   $j('#taggs span.tagtitle').click(function() {
         $j("#taglist").toggle();
       });
   $j('#nutag').click(function() {
       var tagname = $j("input[name=tagtxt]").val();
       $j.post(mybase+'/edittags', { action:'tag', qid:myid, tagname:tagname}, function(resp) {
         freshenTags();
       });
   });
   freshenTags();
   $j("#mytags").undelegate("input.tagr","change");
   $j("#mytags").delegate("input.tagr","change", function() {
        $j("#saveq").addClass('red');
        dialog.tagger = true;
      });
   $j('#details').click(function() {
                var dia = ''
                +   '<form><fieldset><table class="standard_info">'
                +   '<tr><th>Points</th><td><input name="qpoints" class="num4" type="text" value="'+q.points+'"></td></tr>'
                +   '<tr><th>Type</th><td>'+selectype+'</td></tr>'
                +   '<tr><th>Created</th><td>'+showdate(q.created)+'</td></tr>'
                +   '<tr><th>Modified</th><td>'+showdate(q.modified)+'</td></tr>'
                +   '<tr><th>Parent</th><td>'+q.parent+'</td></tr>'
                +   '<tr><th>Javascript</th><td><textarea class="txted" id="qcode">'+dialog.qcode+'</textarea></td></tr>'
                +   '<tr><th>SymbolicPython</th><td><textarea class="txted" id="pycode">'+dialog.pycode+'</textarea></td></tr>'
                +   '<tr><th>Hints</th><td><textarea class="txted" id="hints">'+dialog.hints+'</textarea></td></tr>'
                +   '</table></form></fieldset>'
             $j("#edetails").html(dia);
             $j("#edetails").dialog('open');
              return false;
           });
   $j("#opts").undelegate(".killer","click");
   $j("#opts").delegate(".killer","click", function() {
        preserve();  // save opt values
        var myid = $j(this).parent().attr("id").substr(1);
        q.options.splice(myid,1);
        q.fasit.splice(myid,1);
        optlist = drawOpts(q.options,q.fasit);
        $j("#opts").html(optlist);
      });
   $j(target).undelegate(".txted","change");
   $j(target).delegate(".txted","change", function() {
        $j("#saveq").addClass('red');
      });
   $j("#heading").click(function() {
       if (target == '#main') {
         edqlist();
       } else {
         showinfo(mylink);
       }
      });
   $j("#addopt").click(function() {
        if (typeof(q.options) == 'undefined') {
          q.options = [];
          q.fasit = [];
        }
        preserve();
        q.options.push('');
        optlist = drawOpts(q.options,q.fasit);
        $j("#opts").html(optlist);
      });
   $j("#saveq").click(function() {
        var qoptlist = [];
        preserve();  // q.options and q.fasit are now up-to-date
        retag();
        // containers and quiz have options for how to display
        // pick them out and stuff them into a field
        var contopt = {};
        var containeropts = $j("#inputdiv .copts");
        if (containeropts.length > 0) {
          var ssum = '';
          for (var coi = 0; coi < containeropts.length; coi++) {
            var inp = containeropts[coi];
            contopt[inp.name] = inp.value;
          }
        }
        var daze = $j("input[name=daze]").val();
        dialog.daze = daze;
        var qname = $j("input[name=qname]").val();
        var newqtx = { display:$j("#qdisplay").val(), options:q.options, fasit:q.fasit, code:dialog.qcode, 
                        pycode:dialog.pycode, hints:dialog.hints, daze:daze, contopt:contopt };
        $j.post(mybase+'/editquest', { action:'update', qid:myid, qtext:newqtx, name:qname, 
                                qtype:dialog.qtype, points:dialog.qpoints }, function(resp) {
           editquestion(myid,target);
        });
      });
   if (target == '#main') $j("#killquest").click(function() {
      $j.post(mybase+'/editquest', { action:'delete', qid:myid }, function(resp) {
         $j.getJSON(mybase+'/getcontainer',{ container:wbinfo.containerid }, function(qlist) {
           wbinfo.qlist = qlist;
           edqlist();
         });
      });

    });

    function retag() { 
        if (!dialog.tagger) return;
        var tags = [];
        var tagged = $j("#mytags input:checked");
        for (var i=0,l=tagged.length; i<l; i++) {
          var b = tagged[i];
          var tname = $j(b).parent().attr("id").substr(2);
          tags.push(tname);
        }
        if (tags.length) {
          $j.post(mybase+'/updateTags', { tags:tags.join(','), qid:myid }, function(resp) {
          });
        }
    }

    function freshenTags() { 
       var subject = (wbinfo.coursename) ? wbinfo.coursename.split('_')[0] :  '';
       $j.getJSON(mybase+'/gettags', { subject:subject }, function(tags) {
         var mytags = tags[userinfo.id] || [];
         var tlist = [];
         $j.getJSON(mybase+'/gettagsq', { qid:myid }, function(mtags) {
           for (var i=0,l=mytags.length; i<l; i++) {
             var tag = mytags[i];
             var chk = ($j.inArray(tag,mtags) >= 0) ? 'checked="checked"' : '';
             tlist.push('<div id="tt'+tag+'" class="tagdiv"><input  class="tagr" type="checkbox" '+chk+'><div class="tagg">'+tag+'</div></div>');
           }
           $j("#mytags").html(tlist.join(''));
         });
       });
    }

    function editVariants(q) {  // qu is a question
      var s = '<hr />'
      var qdisplay = '<tr id="qtextarea"><th>Spørsmål</th><td><textarea class="txted" id="qdisplay" >' + q.display + '</textarea></td></tr>';
      switch(q.qtype) {
        case 'multiple':
           var optlist = drawOpts(q.options,q.fasit);
           s += '<h3>Alternativer</h3>'
           + '<table id="opts" class="opts">'
           + optlist
           + '</table>'
           + '</div><div class="button" id="addopt">+</div>'
           break;
        case 'sequence':
        case 'dragdrop':
           s += 'Daze and Confuse (csv fog list: daze,confuse) : '
             + '<input id="daze" name="daze" type="text" value ="'+dialog.daze+'" />'
             + '</div>';
           break;
        case 'container':
           qdisplay = '';
           s += '</div>';
           break;
        case 'quiz':
           qdisplay = '';
           var start = dialog.contopt.start || '';
           var stop = dialog.contopt.stop || '';
           var locked = (dialog.contopt.locked != undefined) ? dialog.contopt.locked : 0;
           var hidden = (dialog.contopt.hidden != undefined) ? dialog.contopt.hidden : 0;
           var fasit = (dialog.contopt.fasit != undefined) ? dialog.contopt.fasit : 0;
           var skala = dialog.contopt.skala || 'medium';
           var rcount = dialog.contopt.rcount || '15';
           var xcount = dialog.contopt.xcount || '0';
           var antall = dialog.contopt.antall || '10';
           var hintcost = dialog.contopt.hintcost || '0.05';
           var attemptcost = dialog.contopt.attemptcost || '0.1';
           var trinn = (dialog.contopt.trinn != undefined) ? dialog.contopt.trinn : 0;
           var karak = (dialog.contopt.karak != undefined) ? dialog.contopt.karak : 0;
           var rank = (dialog.contopt.rank != undefined) ? dialog.contopt.rank : 0;
           var randlist = (dialog.contopt.randlist != undefined) ? dialog.contopt.randlist : 0;
           var shuffle = (dialog.contopt.shuffle != undefined) ? dialog.contopt.shuffle : 0;
           var omstart = (dialog.contopt.omstart != undefined) ? dialog.contopt.omstart : 0;
           var komme = (dialog.contopt.komme != undefined) ? dialog.contopt.komme : 1;
           var hints = (dialog.contopt.hints != undefined) ? dialog.contopt.hints : 1;
           var navi = (dialog.contopt.navi != undefined) ? dialog.contopt.navi : 1;
           var adaptiv = (dialog.contopt.adaptiv != undefined) ? dialog.contopt.adaptiv : 0;
           var elements = { 
                 defaults:{  type:"text", klass:"copts" }
               , elements:{
                   adaptiv:       {  type:"yesno", value:adaptiv }
                 , navi:          {  type:"yesno", value:navi }
                 , hints:         {  type:"yesno", value:hints }
                 , trinn:         {  type:"yesno", value:trinn }
                 , locked:        {  type:"yesno", value:locked }
                 , hidden:        {  type:"yesno", value:hidden }
                 , omstart:       {  type:"yesno", value:omstart }
                 , randlist:      {  type:"yesno", value:randlist }
                 , rcount:        {  klass:"copts num4",  value:rcount, depend:{ randlist:1}  } 
                 , xcount:        {  klass:"copts num4",  value:xcount, depend:{ randlist:1} } 
                 , shuffle:       {  type:"yesno", value:shuffle }
                 , komme:         {  type:"yesno", value:komme }
                 , start:         {  klass:"copts pickdate", type:"text", value:start } 
                 , stop:          {  klass:"copts pickdate", type:"text", value:stop } 
                 , fasit:         {  type:"yesno", value:fasit }
                 , karak:         {  type:"yesno",  value:karak } 
                 , rank:          {  type:"yesno",  value:rank } 
                 , skala:         {  type:"select", klass:"copts",  value:skala, options:[{ value:"medium"},{ value:"easy"},{ value:"hard"} ] } 
                 , hintcost:      {  klass:"copts num4",  value:hintcost, depend:{ hints:1} } 
                 , attemptcost:   {  klass:"copts num4",  value:attemptcost, depend:{ adaptiv:1 } } 
                 , antall:        {  klass:"copts num4",  value:antall } 
                          }
               };
           var res = gui(elements);
           s += 'Instillinger for prøven: <div id="inputdiv">'
             + '<div title="Elever kan ikke se prøven.">Skjult {hidden}</div>'
             + '<div title="Prøve utilgjengelig før denne datoen">Start {start}</div>'
             + '<div title="Prøve utilgjengelig etter denne datoen">Stop {stop}</div>'
             + '<div title="Velger ut N fra spørsmålslista">Utvalg fra liste {randlist}</div>'
             + '<div title="Bruk uansett de første N spørsmålene, alle vil da få disse.">Faste spørsmål {xcount}</div>'
             + '<div title="Antall spørsmål som skal trekkes (i tillegg til de faste)">Antall tilfeldig valgte {rcount}</div>'
             + '<div title="Vis spørsmål i tillfeldig orden">Stokk {shuffle}</div>'
             + '<div title="Elever kan ikke lenger endre svar, låst for retting.">Låst {locked}</div>'
             + '<div title="Nivå for fasit visning">Fasit {fasit}</div>'
             + '<div title="Karakterskala som skal brukes, easy for en lett prøve (streng vurdering), hard gir snill vurdering">Skala {skala}</div>'
             + '<div title="Skal karakter vises">Karakter{karak} </div>'
             + '<div title="Rangering i klassen">Rank{rank} </div>'
             + '<div title="Antall spørsmål pr side">Antall pr side {antall}</div>'
             + '<div title="Brukeren kan kommentere spørsmålene">Brukerkommentarer{komme}</div>'
             + '<div title="Trinnvis visning av hjelpehint">Hjelpehint{hints}</div>'
             + '<div title="Pris for visning av hjelpehint">  Hintpris{hintcost}</div>'
             + '<div title="Kan bla tilbake i prøven">Navigering {navi}</div>'
             + '<div title="Neste spørsmål vises dersom 80% riktig eller mer enn 4 forsøk">Trinnvis {trinn}</div>'
             + '<div title="Nyttig for øvingsoppgaver med genererte spørsmål">Elev kan ta omstart {omstart}</div>'
             + '<div title="Kan svare flere ganger mot poengtap (10%)">Adaptiv {adaptiv}</div>'
             + '<div title="  Pris for adaptiv">  Adaptpris{attemptcost}</div>'
             + '</div></div>';
           s = s.supplant(res);
           break;
        case 'numeric':
        case 'info':
        case 'diff':
        case 'textarea':
        case 'fillin':
        default:
           s += '</div>';
           break;
      }
      s += '<div class="button" id="saveq">Lagre</div>';
      return {qdisplay:qdisplay, options:s};
   }

   function drawOpts(options,fasit) {
     // given a list of options - creates rows for each
     var optlist = '';
     if (options) {
       for (var i=0,l=options.length; i<l; i++) {
         var fa = (fasit[i] == 1) ? ' checked="checked" ' : '';
         optlist += '<tr><td><input name="o'+i+'" class="txted option" type="text" value="'
                + options[i] +'"></td><td><div id="c'+i+'" class="eopt"><input class="check txted " type="checkbox" '+fa+' ><div class="killer"></div></div></td></tr>';
       }
     }
     return optlist;
   }
   function preserve() {
        // preserve any changed option text
      if (q.options) {
        for (var i=0,l=q.options.length; i<l; i++) {
          var oval = $j("input[name=o"+i+"]").val();
          q.options[i] = oval;
          q.fasit[+i] = 0;
        }
        // preserve any changed checkboxes
        var fas = $j("div.eopt input:checked");
        for (var i=0,l=fas.length; i<l; i++) {
          var b = fas[i];
          var ii = $j(b).parent().attr("id").substr(1);
          q.fasit[+ii] = 1;
        }
        $j("#saveq").addClass('red');
      }
   }
 });
}

function dropquestion(myid) {
  var elm = myid.split('_');
  var qid = elm[1], instance = elm[2];
  var cnt = 0;
  for (var id in wbinfo.qlistorder) {
    // check for duplicates
    var qii = wbinfo.qlistorder[id];
    if (qii == qid) cnt++;
  }
  wbinfo.qlistorder.splice(instance,1);
  $j.post(mybase+'/editquest', { action:'update', qtext:wbinfo.courseinfo, qid:wbinfo.containerid }, function(resp) {
    if (cnt == 1) {
      $j.post(mybase+'/editqncontainer', {  action:'delete', qid:qid, container:wbinfo.containerid }, function(resp) {
           $j.getJSON(mybase+'/getcontainer',{ container:wbinfo.containerid }, function(qlist) {
             wbinfo.qlist = qlist;
             edqlist();
           });
        });
    } else {
      $j.getJSON(mybase+'/getcontainer',{ container:wbinfo.containerid }, function(qlist) {
         wbinfo.qlist = qlist;
         edqlist();
      });
    }
  });
}


/*    The code below belongs in workbook/normal.js
 *        it is placed here only while debugging
 *        so that errors can show line number
 *        and chrome can step the code
 *
 * 
 */

wb.getUserAnswer = function(qid,iid,myid,showlist) {
  // parses out user answer for a given question
  var qu = showlist[iid];
  var ua = {};
  var quii = myid.substr(5);  // drop 'quest' from 'quest' + qid_iid
  switch(qu.qtype) {
      case 'multiple':
        var ch = $j("#qq"+quii+" input:checked");
        for (var i=0, l=ch.length; i<l; i++) {
          var opti = $j(ch[i]).attr("id");
          var elm = opti.substr(2).split('_');
          var optid = elm[1];   // elm[0] is the same as qid
          var otxt = qu.param.options[optid];
          ua[optid] = otxt;
        }
        break;
      case 'diff':
      case 'textarea':
        var ch = $j("#qq"+quii+" textarea");
        for (var i=0, l=ch.length; i<l; i++) {
          var opti = $j(ch[i]).val();
          ua[i] = opti
        }
        break;
      case 'numeric':
      case 'fillin':
        var ch = $j("#qq"+quii+" input");
        for (var i=0, l=ch.length; i<l; i++) {
          var opti = $j(ch[i]).val();
          ua[i] = opti
        }
        break;
      case 'textmark':
        break;
      case 'info':
        break;
      case 'sequence':
        var ch = $j("#qq"+quii+" ul.sequence");
        for (var i=0, l=ch.length; i<l; i++) {
          var itemlist = $j("#"+ch[i].id+" li.dragme");
          ua[i] = {};
          for (var j=0, m=itemlist.length; j<m; j++) {
              var item = itemlist[j].innerHTML;
              ua[i][j] = item;
          }
        }
        break;
      case 'dragdrop':
        var ch = $j("#qq"+quii+" span.drop");
        for (var i=0, l=ch.length; i<l; i++) {
          var opti = $j(ch[i]).attr("id");
          var elm = opti.substr(2).split('_');
          var optid = elm[2];   // elm[0] is the same as qid
          var otxt = ch[i].innerHTML;
          ua[optid] = otxt;
        }
        break;
  }
  return ua;
}   

wb.render.normal  = { 
         // renderer for header
         header:function() { 
            var head = '<h1 class="wbhead">' + wbinfo.title + '<span id="editwb" class="wbteachedit">&nbsp;</span></h1>' ;
            var summary = '<div class="wbsummary"><table>'
                  + '<tr><th>Uke</th><th></th><th>Absent</th><th>Tema</th><th>Vurdering</th><th>Mål</th><th>Oppgaver</th><th>Logg</th></tr>'
                  + wbinfo.weeksummary + '</table></div><hr>'; 
            var bod = '<div class="wbingress">'+wbinfo.ingress+'</div><div class="wbbodytxt">'+wbinfo.bodytext+'</div>';
            return(head+summary+bod);
           }  
         // renderer for body
       , body:function() {
            var contained = '<div id="qlistbox" class="wbbodytxt"><br><div id="progress"></div><span id="edqlist" class="wbteachedit">&nbsp;</span><div id="qlist"></div></div>';
            //var addmore = '<div id="addmore" class="button">add</div>';
            return contained;
           }   
         // renderer for edit question list 
       , editql:function(questlist,wantlist) {
            wantlist   = typeof(wantlist) != 'undefined' ? wantlist : false;
            var qq = '';
            var qql = [];
            for (var qidx in questlist) {
              qu = questlist[qidx];
              var shorttext = qu.display || '( no text )';
              shorttext = shorttext.replace(/</g,'&lt;');
              shorttext = shorttext.replace(/>/g,'&gt;');
              var tit = shorttext.replace(/['"]/g,'«');
              var qdiv = '<div class="equest" id="qq_'+qu.id+'_'+qidx+'">';
              if (wantlist) qdiv += '<input type="checkbox">';
              qdiv +=      '<span class="num n'+qu.sync+'">'+(+qidx+1)+'</span>' + '<span class="qid">' 
                         + qu.id+ '</span><span class="img img'+qu.qtype+'"></span>'
                         + '<span class="qtype">' + qu.qtype + '</span><div class="qname"> '
                         + qu.subject + '</div><span title="'+tit+'" class="qshort">' + shorttext.substr(0,50)
                         + '</span><span class="qpoints">'+ qu.points +'</span><div class="edme"></div>';
              if (!wantlist) qdiv += '<div class="killer"></div>';
              qdiv += '</div>';
              qql.push(qdiv);
            }
            if (wantlist) {
              return qql;
            } else {
              qq = qql.join('');
              return qq;
            }
           }   

       , qrend:function(contopt,iid,qid,qua,qrender,scorelist,callback) {
         // renderer for a single question
              //var qu = qrender[iid];
              if (qid != qua.qid) alert("error "+qid+":"+qua.qid);
              var sscore = { userscore:0, maxscore:0, qdiv:'', scorelist:scorelist };
              var qdiv = wb.render.normal.displayQuest(qua,iid,contopt,sscore,1);
              var sum = 0;
              for (var i in scorelist) {
                sum += scorelist[i];
              }
              callback( { sscore:sscore, sumscore:sum });
              //$j.post('/updatecontainerscore', {  cid:wbinfo.containerid, sum:sum });
         }

       , qlist:function(container,questlist,contopt, callback) {
         // renderer for question list 
            var qq = '';
            var qql = [];
            var qqdiv = [];
            var sscore = { userscore:0, maxscore:0 ,scorelist:{} };
            $j.post(mybase+'/renderq',{ container:container, questlist:questlist }, function(qrender) {
              var qstart = 0, qant = qrender.length;
              if (contopt && contopt.antall) {
               // paged display
               qstart = Math.min(qrender.length-1, (+contopt.antall * +wbinfo.page[wbinfo.containerid]));
               qant =  Math.min(qrender.length, qstart + +contopt.antall);
              }
              var gonext = true;  // if navi != 1 then can not go to next page before submitting all on this page
              var open = true;  // open next question if prev already answerd
              var stepw = (contopt && contopt.trinn && contopt.trinn == '1');
              var missing = 0; // ungraded questions this page
              // this is used in stepwise test
              for (var qi=qstart; qi < qant; qi++) {
                var qu = qrender[qi];
                gonext = (qu.attemptnum > 0) ? gonext : false;
                missing += (qu.attemptnum > 0) ? 0 : 1;
                if (stepw) {
                  if (!open) {
                    qu.param.donotshow = 1;
                  } else {
                    open = qu.attemptnum > 0;
                  }
                }
                var qdiv = wb.render.normal.displayQuest(qu,qi,contopt,sscore,0);
                qql.push(qdiv);
              }
              wbinfo.missing[wbinfo.containerid] = missing;
              if (contopt.navi) {
                gonext = (contopt.navi == "1") ? '' : ' disabled' ;
                if (contopt.navi != "1"  && wbinfo.missing[wbinfo.containerid] < 1) {
                   gonext = '';
                   qql=[ '<div class="question">Besvart - naviger til neste spørsmål.</div>' ];
                   if (qant == qrender.length ) {
                     qql=[ '<div class="question">Du har fullført prøven.</div>' ];
                   }
                }
              }
              qq = qql.join('');
              if (contopt.antall) {
                 //if (qant < qrender.length && (contopt.trinn == '0' || qu.attemptnum > 0 ) ) {
                 //var hidden =  (contopt.trinn == '0' || qu.attemptnum > 0 ) ? '' : ' hidden';
                 if (qant < qrender.length ) {
                   qq += '<div id="nextpage" class="gradebutton '+gonext+'">&gt;&gt;</div>';
                 }
                 if (contopt.navi && contopt.navi == "1" && qstart > 0) {
                   qq += '<div id="prevpage" class="gradebutton">&lt;&lt;</div>';
                 }
              }
              sscore.userscore = Math.floor(sscore.userscore*100) / 100;
              callback( { showlist:qq, maxscore:sscore.maxscore, uscore:sscore.userscore, qrender:qrender, scorelist:sscore.scorelist });
            });
          }


         , displayQuest:function(qu,qi,contopt,sscore,scored,fasit) {
              // qu is the question+useranswer, qi is instance number
              // scored is set true if we have graded this instance
              // (we display ungraded questions on first show of question)
                fasit   = typeof(fasit) != 'undefined' ? fasit : [];
                if (qu.display == '') return '';
                var attempt = qu.attemptnum || '';
                var score = qu.score || 0;
                var chosen = qu.response;
                var param = qu.param;
                param.display = param.display.replace(/«/g,'"');
                param.display = param.display.replace(/»/g,"'");
                score = Math.round(score*100)/100;
                var delta = score || 0;
                sscore.userscore += delta;
                sscore.maxscore += qu.points;
                sscore.scorelist[qi] = delta;
                var adjusted = param.display;
                var hints = '';
                var grademe = '</div>';
                if (contopt.hints && contopt.hints == "1" && qu.param.havehints == "y") {
                  var cost = contopt.hintcost || 0;
                  if (qu.hintcount > 0) {
                    //var hi = qu.param.hints.split(/\n|_&_/).slice(0,qu.hintcount).join('<br>');
                    var hi = qu.param.hints.join('<br>');
                    hints = '<div id="hint'+qu.qid+'_'+qu.id+'" title="Bruk av hint reduserer poengsummen med '+(+cost*100)
                      +'% pr klikk " class="gethint">'+hi+'</div>';
                  } else {
                    hints = '<div id="hint'+qu.qid+'_'+qu.id+'" title="Bruk av hint reduserer poengsummen med '
                         +(cost*100)+'% pr klikk" class="gethint">Koster:'+cost+'</div>';
                  }
                }
                if (contopt.adaptiv && contopt.adaptiv == "1" || !(scored || attempt != '' && attempt > 0) ) {
                   grademe = '<div class="grademe"></div></div>';
                }
                if (param.donotshow) {
                  adjusted = '';
                }
                var qtxt = ''
                  switch(qu.qtype) {
                      case 'quiz':
                          console.log(qu);
                          var mycopt = qu.param.contopt;
                          if (mycopt && mycopt.hidden == "1") {
                            if (!teaches(userinfo.id,wbinfo.coursename)) {
                               return '';
                            }
                            return '<div class="cont quiz cloaked" id="qq'+qu.qid+'_'+qi+'">' + qu.name + '</div>';
                          }
                          var start,stop,elm;
                          var justnow = new Date();
                          if (mycopt && mycopt.start) {
                             elm = mycopt.start.split('/');
                             start = new Date(elm[2],+elm[1]-1,elm[0]);
                          }
                          if (mycopt && mycopt.stop) {
                             elm = mycopt.stop.split('/');
                             stop = new Date(elm[2],+elm[1]-1,elm[0]);
                          }
                          start = start || justnow - 20000;
                          stop = stop || justnow + 2000;
                          if (justnow < start || justnow > stop ) {
                            return '<div class="cont quiz clock" id="qq'+qu.qid+'_'+qi+'">' + qu.name + '</div>';
                          }
                          if (mycopt && mycopt.locked == "1") {
                            return '<div class="cont quiz locked" id="qq'+qu.qid+'_'+qi+'">' + qu.name + '</div>';
                          }
                          return '<div class="cont quiz" id="qq'+qu.qid+'_'+qi+'">' + qu.name + '</div>';
                          break;
                      case 'container':
                          return '<div class="cont container" id="qq'+qu.qid+'_'+qi+'">' + qu.name + '</div>';
                          break;
                      case 'diff':
                      case 'textarea':
                          var iid = 0;
                          adjusted = adjusted.replace(/(&nbsp;&nbsp;&nbsp;&nbsp;)/g,function(m,ch) {
                                var vv = ''
                                if (chosen[iid]) {
                                  vv = chosen[iid];
                                } 
                                var ff = fasit[iid] || '';
                                var ret = '<textarea>'+vv+'</textarea>';
                                ret += '<div class="fasit">'+unescape(ff)+'</div>';
                                iid++;
                                return ret;
                              });
                          if (qu.feedback && qu.feedback != '' ) {
                            adjusted += '<div class="fasit">'+unescape(qu.feedback) + '</div>';
                          }
                          qtxt = '<div id="quest'+qu.qid+'_'+qi+'" class="qtext textareaq">'+adjusted;
                          if (iid > 0) {  // there are input boxes to be filled
                              if (scored || attempt != '' && attempt > 0) {
                                qtxt += '<span id="at'+qi+'" class="attempt">'+(attempt)+'</span>';
                              }
                              if (scored || attempt > 0 || score != '') {
                                qtxt += '<span id="sc'+qu.qid+'_'+qi+'" class="score">'+score+'</span>'
                              }
                              qtxt += grademe;
                              qtxt += '<div class="clearbox">&nbsp;</div>';

                          } else {
                              qtxt += '</div>';
                          }
                          break;
                      case 'numeric':
                      case 'fillin':
                          var iid = 0;
                          adjusted = adjusted.replace(/(&nbsp;&nbsp;&nbsp;&nbsp;)/g,function(m,ch) {
                                var vv = ''
                                if (chosen[iid]) {
                                  vv = chosen[iid];
                                } 
                                var ff = fasit[iid] || '';
                                //ff=ff.replace(/%3A/g,':');
                                var ret = '<input type="text" value="'+vv+'" /><span class="fasit">'+unescape(ff)+'</span>';
                                iid++;
                                return ret;
                              });
                          qtxt = '<div id="quest'+qu.qid+'_'+qi+'" class="qtext fillinq">'+adjusted;
                          if (iid > 0) {  // there are input boxes to be filled
                              if (scored || attempt != '' && attempt > 0) {
                                qtxt += '<span id="at'+qi+'" class="attempt">'+(attempt)+'</span>';
                              }
                              if (scored || attempt > 0 || score != '') {
                                qtxt += '<span id="sc'+qu.qid+'_'+qi+'" class="score">'+score+'</span>'
                              }
                              qtxt += grademe;
                              qtxt += '<div class="clearbox">&nbsp;</div>';

                          } else {
                              qtxt += '</div>';
                          }
                          break;
                      case 'sequence':
                          var iid = 0;
                          var used = {};
                          var feedback = [];
                          if (qu.feedback) {
                              try {
                                feedback = JSON.parse(qu.feedback);
                              } catch (err) {
                                console.log("Feedback EVAL-ERROR",err,qu.feedback);
                              }
                          }
                          adjusted = adjusted.replace(/(ª)/g,function(m,ch) {
                                var ret = '';
                                var fee = feedback[iid];
                                if (chosen[iid]) {
                                  console.log(m,fee,chosen[iid]);
                                  for (var j=0, m = chosen[iid].length; j<m; j++) {
                                      var opt = chosen[iid][j];
                                      var oo = 'a';
                                      used[opt] ? used[opt]++ : used[opt] = 1;
                                      ret += '<li id="ddm'+qu.qid+'_'+qi+'_'+j+'" class="dragme">' + opt + '</li>';
                                  }
                                } 
                                iid++;
                                return ret;
                              });
                          qtxt = '<div id="quest'+qu.qid+'_'+qi+'" class="qtext sequenceq">'+adjusted;
                          if (!param.donotshow && param.options && param.options.length) {
                              if (param.daze && param.daze.length) {
                                // distractors are defined - stir them in
                                param.options = param.options.concat(param.daze.split(','));
                                shuffle(param.options);
                              }
                              qtxt += '<hr>';
                              if (scored || attempt != '' && attempt > 0) {
                                qtxt += '<span id="at'+qi+'" class="attempt">'+(attempt)+'</span>';
                              }
                              if (scored || attempt > 0 || score != '') {
                                qtxt += '<span id="sc'+qu.qid+'_'+qi+'" class="score">'+score+'</span>'
                              }
                              qtxt += grademe;
                              qtxt += '<ul id="sou'+qu.qid+'_'+qi+'" class="qtext sourcelist connectedSortable">';
                              for (var i=0, l= param.options.length; i<l; i++) {
                                  var opt = param.options[i].split(',')[0];
                                  if (used[opt]) {
                                    used[opt]--;
                                    continue;
                                  }
                                  qtxt += '<li id="ddm'+qu.qid+'_'+qi+'_'+i+'" class="dragme">' + opt + '</li>';
                              }
                              qtxt += '</ul>';
                              qtxt += '<div class="clearbox">&nbsp;</div>';

                          } else {
                              qtxt += '</div>';
                          }
                          break;
                      case 'info':
                          qtxt = '<div id="quest'+qu.qid+'_'+qi+'" class="qtext dragdropq">'+adjusted + '</div>';
                          return '<div class="question" id="qq'+qu.qid+'_'+qi+'">' + qtxt + '</div>';
                      case 'textmark':
                      case 'dragdrop':
                          var iid = 0;
                          adjusted = adjusted.replace(/(&nbsp;&nbsp;&nbsp;&nbsp;)/g,function(m,ch) {
                                var ret = '&nbsp;&nbsp;&nbsp;&nbsp;';
                                if (chosen[iid]) {
                                  ret = chosen[iid];
                                } 
                                iid++;
                                return ret;
                              });
                          qtxt = '<div id="quest'+qu.qid+'_'+qi+'" class="qtext dragdropq">'+adjusted;
                          if (!param.donotshow && param.options && param.options.length) {
                              if (param.daze && param.daze.length) {
                                // distractors are defined - stir them in
                                param.options = param.options.concat(param.daze.split(','));
                                shuffle(param.options);
                              }
                              qtxt += '<hr>';
                              if (scored || attempt != '' && attempt > 0) {
                                qtxt += '<span id="at'+qi+'" class="attempt">'+(attempt)+'</span>';
                              }
                              if (scored || attempt > 0 || score != '') {
                                qtxt += '<span id="sc'+qu.qid+'_'+qi+'" class="score">'+score+'</span>'
                              }
                              qtxt += grademe;
                              for (var i=0, l= param.options.length; i<l; i++) {
                                  var opt = param.options[i].split(',')[0];
                                  qtxt += '<span id="ddm'+qu.qid+'_'+qi+'_'+i+'" class="dragme">' + opt + '</span>';
                              }
                              qtxt += '<div class="clearbox">&nbsp;</div>';

                          } else {
                              qtxt += '</div>';
                          }
                          break;
                      case 'multiple':
                          qtxt = '<div id="quest'+qu.qid+'_'+qi+'" class="qtext multipleq">'+adjusted
                          if (!param.donotshow && param.options && param.options.length) {
                              if (scored || attempt != '' && attempt > 0) {
                                qtxt += '<span id="at'+qi+'" class="attempt">'+(attempt)+'</span>';
                              }
                              if (scored || attempt > 0 || score != '') {
                                qtxt += '<span id="sc'+qu.qid+'_'+qi+'" class="score">'+score+'</span>'
                              }
                              qtxt += grademe;
                              for (var i=0, l= param.options.length; i<l; i++) {
                                  var opt = param.options[i];
                                  var chh = (chosen[i]) ? ' checked="checked" ' : '';
                                  var fa = (fasit[i] == '1') ? ' correct' : ((fasit[i] == '0' && chosen[i]) ? ' wrong' : '' );
                                  qtxt += '<div class="multipleopt'+fa+'"><input id="op'+qu.qid+'_'+i
                                        +'" class="check" '+chh+' type="checkbox"><label for="op'+qu.qid+'_'+i+'">' + opt + '</label></div>';
                              }
                          } else {
                              qtxt += '</div>';
                          }
                          break;
                  }
                  var qnum = +qi + 1;
                  var studnote = ''; // <div class="studnote"></div>
                  if (qu.usercomment && qu.usercomment != '') {
                    var stutxt = qu.usercomment.replace(/['"]/g,'«');
                    studnote = '<div  id="com'+qu.id+'" title="'+stutxt+'" class="studnote addcomment">'+stutxt+'</div>';
                  }
                  if (qu.teachcomment && qu.teachcomment != '') {
                    var teachtxt = qu.teachcomment.replace(/['"]/g,'«');
                    studnote += '<div  id="com'+qu.id+'" title="'+teachtxt+'" class="teachnote addcomment"></div>';
                  }
                  qtxt = '<span class="qnumber">Spørsmål '+qnum
                    +' &nbsp; <span id="com'+qu.id+'" class="addcomment wbedit">&nbsp;</span></span>' + qtxt;
                  if (sscore.qdiv != undefined) {
                    sscore.qdiv = hints+qtxt;
                    sscore.qdivid = 'qq'+qu.qid+'_'+qi;
                    sscore.scid = 'sc'+qi;
                    sscore.atid = 'at'+qi;
                  }
                  return '<div class="question qq'+qi+'" id="qq'+qu.qid+'_'+qi+'">' + hints+ qtxt + studnote + '</div>';
            }
      }

wb.render.cool={ 
         header:function(heading,ingress,summary) { 
            var head = '<h1 class="wbhead">' + heading + '<span id="editwb" class="wbteachedit">&nbsp;</span></h1>' ;
            var summary = '<div class="wbsummary"><table>'
                  + '<tr><th>Uke</th><th></th><th>Absent</th><th>Tema</th><th>Vurdering</th><th>Mål</th><th>Oppgaver</th><th>Logg</th></tr>'
                  + summary + '</table></div>'; 
            var bod = '<div class="wbingress">'+ingress+'</div>'; 
            return(head+summary+bod);
           }  
       , body:function(bodytxt) {
            var bod = '<div class="wbbodytxt">'+bodytxt+'</div>';
            return bod;
           }   
         // renderer for question list - should switch on qtype
       , qlist:function(questlist) {
            var qq = '';
            var qql = [];
            for (var qidx in questlist) {
              qu = questlist[qidx];
              var qdiv = '<div id="'+qu.id+'">' + qu.qtext + '</div>';
              qql.push(qdiv);
            }
            qq = qql.join('');
            return qq;
           }   
      }
