// this module implements the server-side of quiz-question engine
//   display   : will pick apart questions dependent on type
//   grade     : grade question-answer against correct answer

var fs = require('fs');
var exec = require('child_process').exec;
var crypto = require('crypto');
var jsp = require('uglify-js').parser;
var pro = require('uglify-js').uglify;

function prep(code) {
  code = code.replace(/package/g,"function package()");
  code = code.replace(/(\w+) extends (\w+)/g,"$1_ext_$2");
  code = code.replace(/class (\w+)/ig,"function class_$1()");
  code = code.replace(/import ([^ ;]+)/g,"import($1) ");
  code = code.replace(/\+\+/g,"+=1");
  code = code.replace(/--/g,"-=1");
  code = code.replace(/(\w+):(int|String|Number|Boolean)/g,"$1_$2");
  code = code.replace(/(\w+)\((.+)\):(int|String|Number|Boolean|void)/g,"$1_$3($2)");
  code = code.replace(/public (\w+) (\w+)/g,"$1 public_$2");
  code = code.replace(/private (\w+) (\w+)/g,"$1 private_$2");
  var ast;
  try {
   ast = jsp.parse(code);
  }
  catch (err) {
   console.log(err);
   return '';
  }
  ast = pro.ast_mangle(ast,{toplevel:true} );
  ast = pro.ast_squeeze(ast,{make_seqs:false});
  var newcode = pro.gen_code(ast,{beautify:true});
  return newcode;
}

function addslashes(str) {
  str=str.replace(/\\/g,'\\\\');
  str=str.replace(/\'/g,'\\\'');
  str=str.replace(/\"/g,'\\"');
  return str;
}
function stripslashes(str) {
  str=str.replace(/\\'/g,'\'');
  str=str.replace(/\\"/g,'"');
  str=str.replace(/\\\\/g,'\\');
  return str;
}

var qz = {
    quiz:{}         // cache for quiz info
 ,  question:{}     // cache for questions
 ,  graphs:{}       // cache for graphs indexed by md5 hash of asymptote code
 ,  symb:{}         // symbols used by dynamic question
 , perturbe:function(optionCount) {
     // gives back a shuffled string, 'abcd'.length == optionCount
     // 'abcd'  becomes 'dacb' etc - giving the order for options
     var str = '';
     var bag = 'abcdefghijklmnopqrstuvwxyz'.substr(0,optionCount); 
     // bugger them that use more options in a quiz!
     for (var i=0; i< optionCount; i++) {
       var idx = Math.floor(Math.random()*bag.length);
       var ch = bag.charAt(idx);
       bag = bag.substr(0,idx) + bag.substr(idx+1);
       str += ch;
     }
     return str;
 }
 , reorder:function(marry,str) {
     // reorders an array based on str
     // str is generated by perturbe
     var jane = [];
     for (var i=0,l=marry.length; i<l; i++) {
       var a = str.charCodeAt(i) - 97;
       jane.push(marry[a]);
     }
     return jane;
 }
 , getQobj: function(qtext,qtype,qid,instance) {
     var qobj = { display:'', options:[] , fasit:[] , code:'', pycode:'', daze:'' };
     if (!qtext ) return qobj;
     try {
         qobj = JSON.parse(qtext);
     } catch(err) {
       console.log("getOBJ EVAL-ERROR",err,qtext);
     }
     if (qobj == undefined) {
        qobj = { display:'', options:[] , fasit:[] , daze:'', code:'', pycode:''};
     }
     if (!qobj.code) qobj.code = '';
     if (!qobj.pycode) qobj.pycode = '';
     var did,cid;
     switch(qtype) {
       case 'textarea':
       case 'diff':
       case 'numeric':
       case 'fillin':
         draggers = [];
         did = 0;
         qobj.origtext = qobj.display;  // used by editor
         qobj.display = qobj.display.replace(/\[\[([^ª]+?)\]\]/mg,function(m,ch) {
             draggers[did] = ch;
	     var sp = '<span id="dd'+qid+'_'+instance+'_'+did+'" class="fillin">&nbsp;&nbsp;&nbsp;&nbsp;</span>';
             did++;
             return sp;
         });
         qobj.fasit = draggers;
         break;
       case 'sequence':
         draggers = [];
         categories = [];
         catnames = [];
         did = 0;
         cid = 0;  // container for this group
         qobj.origtext = qobj.display;  // used by editor
         qobj.display = qobj.display.replace(/\[\[([^ª]+?)\]\]/gm,function(m,ch) {
             // we assume [[categoryname:elements,in,this,category]]
             // where , may be replaced by newline
             var lines;
             var catname=''+cid,elements=ch,off;
             if (off = ch.indexOf(":"), off >= 0) {
               catname = ch.substr(0,off);
               elements = ch.substr(off+1);
             }
             categories[cid] = [];
             catnames[cid] = catname;
             if (elements.indexOf("\n") >= 0) {
               // this is a multiline text - split on newline
               lines = elements.split("\n");
             } else {
               lines = elements.split(',');
             }
             for (var i=0; i< lines.length; i++) {
               var l = lines[i];
               if (l == '') continue;
               draggers[did] = l;
               categories[cid].push(l);
               did++;
             }
             var inorder = catname.charAt(0) == '+';
             var orderclass = '';
             if (inorder) {
               catname = catname.substr(1);
               orderclass = 'order ';
             }
	     var sp = '<div class="catt">'+catname+'</div><ul id="dd'+qid+'_'
                 + cid + '" class="'+orderclass+'sequence connectedSortable"><li class="hidden" >zzzz</li>ª</ul>';
             cid++;
             return sp;
         });
         qobj.fasit = draggers;
         qobj.cats = categories;
         qobj.catnames = catnames;
         break;
       case 'textmark':
       case 'info':
       case 'dragdrop':
         draggers = [];
         did = 0;
         qobj.origtext = qobj.display;  // used by editor
         qobj.display = qobj.display.replace(/\[\[(.+?)\]\]/g,function(m,ch) {
             draggers[did] = ch;
	     var sp = '<span id="dd'+qid+'_'+instance+'_'+did+'" class="drop">&nbsp;&nbsp;&nbsp;&nbsp;</span>';
             did++;
             return sp;
         });
         qobj.fasit = draggers;
         break;
       case 'multiple':
         break;
       default:
         break;
     }
     return qobj;
   }
 , stashInSymbols: function(pyout) {
     var lines = pyout.split(/\n/);
     for (var lid in lines) {
       var exp = lines[lid];
       var elm = exp.split(/=/,2);
       var sy = elm[0].replace(/ /g,'');
       if (symb[sy] != undefined ) {
         symb[sy] = (elm[1].replace(/operatorname/,'mathop'));
       }
     }
   }
  , doPyCode:function(text,uid,instance,callback) {
    if (!text || text == '') {
      callback()
    } else {
      var intro = 'from sympy import *\n';
      var now = new Date().getTime();
      fs.writeFile("/tmp/symp"+now, intro+text, function (err) {
         if (err) { res.send(''); throw err; }
           var child = exec("/usr/bin/python /tmp/symp"+now, function(error,stdout,stderr) {
             fs.unlink('/tmp/symp'+now);
             if (error) {
               console.log(error,stderr);
               callback();
             } else {
               if (stdout && stdout != '') {
                  qz.stashInSymbols(stdout);
               }
               callback();
             }
           });
      });
    }
  }
  , asciimath:function(text) {
     if (!text || text == '') return text;
     if (text.indexOf('€€') < 0) return text;
     var idx = 0;
     //var now = new Date().getTime();
     var retimg =  '<img src="http://i.imgur.com/bY7XM.png">';
     text = text.replace(/€€([^ª]+?)€€/g,function(m,ch) {
           return 'pic';
       });
     return text;
    }
  , asymp:function(text) {
     if (!text || text == '') return text;
     if (text.indexOf('££') < 0) return text;
     var idx = 0;
     //var now = new Date().getTime();
     var retimg =  '<img src="http://i.imgur.com/bY7XM.png">';
     text = text.replace(/££([^ª]+?)££/g,function(m,ch) {
         var asy = '';
           // default graph to show if no valid graph
         ch = ch.trim();
         if (ch.substr(0,4) == 'plot') {
            // we have ££plot {1,2,3,4,5,6} {1,4,9,16,25,36}££
            asy = 'import graph; size(200,200,IgnoreAspect); scale(false);'
            var elm = [];
            ch.replace(/{([^ª]+?)}/g,function(mm,cc) {
                 elm.push(cc);
              });
            if (elm.length < 2) {
              console.log("missing x/y values");
              return retimg;
            }
            asy += 'real[] x={'+elm[0]+'}; real[] y={'+elm[1]+'};';
            asy += 'draw(graph(x,y,Hermite),red);';
            asy += 'xaxis("$x$",BottomTop,LeftTicks );'
            asy += 'yaxis("$y$",LeftRight, RightTicks);';
            var md5 = crypto.createHash('md5').update(asy).digest("hex");
            console.log(md5);
            if (qz.graphs[md5]) {
              // we have a graph for this code already
              retimg = qz.graphs[md5];
            } else {
              retimg =  '<img src="graphs/asy'+md5+'.png">';
              fs.writeFile("/tmp/asy"+md5, asy, function (err) {
                 if (err) { throw err; }
                   var child = exec("/usr/local/bin/asy -o public/graphs/asy"+md5+" -f png /tmp/asy"+md5, function(error,stdout,stderr) {
                     fs.unlink('/tmp/asy'+md5);
                     if (error) {
                       console.log(error,stderr);
                     } else {
                       qz.graphs[md5] = '<img src="graphs/asy'+md5+'.png">';
                     }
                   });
              });
            }
         } else if (ch.substr(0,5) == 'graph') {
            // we have ££graph sin(x);cos(x),-5,5 ££
            asy = 'import graph; size(200,200,IgnoreAspect); scale(false);'
            var elm = ch.substr(6).split(',');
            var elm = ch.substr(6).split(',');
            console.log(elm);
            var lo = (elm[1] != undefined) ? elm[1] : -5;
            var hi = (elm[2] != undefined) ? elm[2] : 5;
            var fun = elm[0].split(';');
            var colors = ['red','blue','green','black'];
            for (var i=0; i< fun.length; i++) {
              var col = colors[i] || 'black';
              asy += 'real f'+i+'(real x) {return '+fun[i]+';} '
                  +  'pair F'+i+'(real x) {return (x,f'+i+'(x));} '
                  +  'draw(graph(f'+i+','+lo+','+hi+',Hermite),'+col+'); ';
            }

            asy += 'xaxis("$x$",LeftTicks ); '
                +  'yaxis("$y$",RightTicks); ';
            var md5 = crypto.createHash('md5').update(asy).digest("hex");
            console.log(asy);
            if (qz.graphs[md5]) {
              // we have a graph for this code already
              retimg = qz.graphs[md5];
            } else {
              retimg =  '<img src="graphs/asy'+md5+'.png">';
              fs.writeFile("/tmp/asy"+md5, asy, function (err) {
                 if (err) { throw err; }
                   var child = exec("/usr/local/bin/asy -o public/graphs/asy"+md5+" -f png /tmp/asy"+md5, function(error,stdout,stderr) {
                     fs.unlink('/tmp/asy'+md5);
                     if (error) {
                       console.log(error,stderr);
                     } else {
                       qz.graphs[md5] = '<img src="graphs/asy'+md5+'.png">';
                     }
                   });
              });
            }
         } else {
         }
         return retimg;
       });
     return text;
  }
 , doCode:function(text,uid,instance) {
     if (text == '') {
       return ;
     }
     var lines = text.split(/\n/);
     for (var lid in lines) {
       var exp = lines[lid];
	     try {
	        with(symb){ eval('('+exp+')') };
	     } catch(err) {
               console.log("EVAL-ERROR",err,exp);
	     }
     }
   }
 , macro:function(text) {
     var cha = 'abcdefghijklmnopqrstuvwxyz';
     var idx = 0;
     if (!text || text == '') return text;
     text = text.replace(/\#([a-z])/g,function(m,ch) {
	     return symb[ch] || 0;
       });
     return text;
   }  
 , rlist:function(lo,hi,num) {  // random list of numbers
   // only one instance of any given number in the list
   var list = [];
   for (var i=0; i<num; i++) {
     do {
       var kand = Math.floor(lo + Math.random()*(hi+1-lo))
     } while (list.indexOf(kand) >= 0 );
     list.push(kand);
   }
   return list;
 }
 , generateParams:function(question,userid,instance,callback) {
     symb = { a:0, b:0, c:0, d:0, e:0, f:0, g:0, h:0, i:0, j:0, k:0, l:0, m:0, n:0,
              p:0, q:0, r:0, s:0, t:0, u:0, v:0, w:0, x:0, y:0, z:0
       , sin:Math.sin ,cos:Math.cos
       , pow:Math.pow 
       , round:function(x,p) { return  Math.round(x*Math.pow(10,p))/Math.pow(10,p)}
       , random:Math.random, floor:Math.floor
       , rlist:qz.rlist
     };  // remove symbols from prev question
     var q = qz.question[question.id];  // get from cache
     var qobj = qz.getQobj(q.qtext,q.qtype,q.id,instance);
     qobj.origtext = '' ; // only used in editor
     qz.doCode(qobj.code,userid,instance); // this is run for the side-effects (symboltabel)
        // javascript code
     // we need a callback for running python
     // this might take a while
     // returns immed if no pycode
     qz.doPyCode(qobj.pycode,userid,instance,function() {
       //qobj.origtext = '' ; // only used in editor
       qobj.display = qz.macro(qobj.display);        // MACRO replace #a .. #z with values
       qobj.display = qz.asymp(qobj.display);        // generate graph for ££ draw(graph(x,y,operator ..) ££
       qobj.display = qz.asciimath(qobj.display);    // generate graph for €€ plot(sin(x)) €€
       qobj.display = escape(qobj.display);
       if (question.qtype == 'dragdrop' 
           || question.qtype == 'sequence' 
           || question.qtype == 'numeric' 
           || question.qtype == 'diff' 
           || question.qtype == 'fillin' ) {
         qobj.options = qobj.fasit;
       }
       for (var i in qobj.options) {
         qobj.options[i] = escape(qz.macro(qobj.options[i])); 
       }
       qobj.daze = qz.macro(qobj.daze); 
       qobj.pycode = '';  // remove pycode and code - they are not needed in useranswer
       // only used to generate params susbtituted into display
       qobj.code = '';
       //console.log(qobj);
       switch(question.qtype) {
           case 'dragdrop':
           case 'textarea':
           case 'fillin':
           case 'numeric':
           case 'textmark':
           case 'diff':
           case 'info':
           case 'sequence':
           case 'multiple':
             if (qobj.options && qobj.options.length) {
               qobj.optorder = qz.perturbe(qobj.options.length);
               //qobj.fasit = '';   // don't return fasit
               qobj.options = qz.reorder(qobj.options,qobj.optorder);
             }
             break;
           default:
             break;
       }
       callback(qobj);
     });
    
   }	       
 ,  display: function(qu,options) {
           // takes a question and returns a formatted display text
           options = typeof(options) != 'undefined' ?  options : true;
           var qobj = qz.getQobj(qu.qtext,qu.qtype,qu.id,qu.instance);
           qobj.origtext = '' ; // only used in editor
           qobj.fasit = [];  // we never send fasit for display
           qobj.cats = {};  // we never send categories for display
           // edit question uses getquestion - doesn't involve quiz.display
           if (!options) {
             // remove options from display
             // they need to be refetched anyway
             // so that params can be used properly
             // this is needed to make dynamic questions
             // where we can instanciate a question several times on a page
             // and get different text/numbers for each instance.
             qobj.options = [];
           }
           qobj.id = qu.id;
           qobj.qtype = qu.qtype;
           qobj.points = qu.points;
           qobj.name = qu.name;
           qobj.created = qu.created;
           qobj.modified = qu.modified;
           qobj.parent = qu.parent;
           return qobj;

         }

  , grade: function(aquiz,aquest,useranswer,param,callback) {
           // takes a question + useranswer + param and returns a grade
           // param is stored in db, it contains parameters
           // that are needed for displaying and grading the response
           // the question from db may be mangled (reordered etc) so
           // we need info about how its mangled or how dynamic content
           // has been generated 
           //console.log(param);
           var qobj = qz.getQobj(aquest.qtext,aquest.qtype,aquest.id,aquest.instance);
           qobj.origtext = '' ; // only used in editor
           var optorder = param.optorder;
           //console.log(param,qobj,optorder);
           var options = param.options;
           var qgrade = 0;
           var ua;
           try {
             eval( 'ua ='+useranswer);
           } catch(err) {
           }
           if (!ua) {
             ua = [];
           }
           switch(aquest.qtype) {
             case 'numeric':
                 //var fasit = qobj.fasit;
                 // for numeric the fasit is a template like this  
                 //   33.13:0.5   the answer is 33.13 +- 0.5
                 //   32.0..33.5  the answer must be in the interval [32.0,33.5]
                 var fasit = param.fasit;
                 var tot = 0;      // total number of options
                 var ucorr = 0;    // user correct choices
                 var uerr = 0;     // user false choices
                 for (var ii=0,l=fasit.length; ii < l; ii++) {
                   tot++;
                   var ff = unescape(fasit[ii]);
                   if (ff == ua[ii]  ) {
                     ucorr++;
                   } else {
                     // first do a check using fasit as a regular expression
                     console.log("trying numeric",ff,ua[ii] );
                     var num = +ff;
                     var tol = 0.0000001;
                     var uanum = +ua[ii];
                     if ( ff.indexOf(':') > 0) {
                       // we have a fasit like [[23.3:0.5]]
                       var elm = ff.split(':');
                       num = +elm[0];
                       tol = +elm[1];
                       console.log("NUM:TOL",ff,num,tol,uanum);
                     } else if ( ff.indexOf('..') > 0) {
                       // we have a fasit like [[23.0..23.5]]
                       var elm = ff.split('..');
                       var lo = +elm[0];
                       var hi = +elm[1];
                       tol = (hi - lo) / 2;
                       num = lo + tol;
                       console.log("LO..HI",ff,lo,hi,num,tol,uanum);
                     }
                     console.log(num,tol,uanum);
                     if ( Math.abs(num - uanum) <= tol) {
                       ucorr++;
                     } else if (ua[ii] != undefined && ua[ii] != '' && ua[ii] != '&nbsp;&nbsp;&nbsp;&nbsp;') {
                       uerr++;
                     }
                   }
                 }
                 console.log(fasit,ua,'tot=',tot,'uco=',ucorr,'uer=',uerr);
                 if (tot > 0) {
                   qgrade = (ucorr - uerr/6) / tot;
                 }
                 qgrade = Math.max(0,qgrade);
               break;
             case 'textarea':
             case 'fillin':
                 //var fasit = qobj.fasit;
                 var fasit = param.fasit;
                 var tot = 0;      // total number of options
                 var ucorr = 0;    // user correct choices
                 var uerr = 0;     // user false choices
                 for (var ii=0,l=fasit.length; ii < l; ii++) {
                   tot++;
                   var ff = unescape(fasit[ii]);
                   var fasil = ff.split(',');
                   if (ff == ua[ii] || fasil.indexOf(ua[ii]) >= 0 ) {
                     ucorr++;
                   } else {
                     // first do a check using fasit as a regular expression
                     console.log("trying regexp");
                     var myreg = new RegExp('('+ff+')',"gi");
                     var isgood = false;
                     ua[ii].replace(myreg,function (m,ch) {
                           isgood = (m == ua[ii]);
                           console.log("m ch:",m,ch);
                         });
                     if ( isgood) {
                       ucorr++;     // good match for regular expression
                     } else if (ua[ii] != undefined && ua[ii] != '' && ua[ii] != '&nbsp;&nbsp;&nbsp;&nbsp;') {
                       uerr++;
                     }
                   }
                 }
                 console.log(fasit,ua,'tot=',tot,'uco=',ucorr,'uer=',uerr);
                 if (tot > 0) {
                   qgrade = (ucorr - uerr/6) / tot;
                 }
                 qgrade = Math.max(0,qgrade);
               break;
             case 'diff':
                 //var fasit = qobj.fasit;
                 var fasit = param.fasit;
                 var tot = 0;      // total number of options
                 var ucorr = 0;    // user correct choices
                 var uerr = 0;     // user false choices
                 for (var ii=0,l=fasit.length; ii < l; ii++) {
                   tot++;
                   var ff = unescape(fasit[ii]);
                   if (ff == ua[ii] ) {
                     ucorr++;
                   } else {
                     // TODO  this only works for first wdiff in question
                     // need to handle chaning of callbacks for each [[codea ]] [[codeb ]]
                     // use word diff
                     var codeA = prep(ff);
                     var codeB = prep(ua[ii]);
                     console.log("trying diff",codeA,codeB);
                     fs.writeFile("/tmp/wdiff1", codeA, function (err) {
                         if (err) { res.send(''); throw err; }
                         fs.writeFile("/tmp/wdiff2", codeB, function (err) {
                           if (err) { res.send(''); throw err; }
                           var child = exec("/usr/bin/wdiff -sn /tmp/wdiff1 /tmp/wdiff2", function(error,stdout,stderr) {
                              // stdout is diff format
                              // stderr gives percentages of change
                              //  12 words  12 91% common  0 0% deleted  1 8% changed
                              var ffi = stderr.split(/\n/);
                              var ff1 = ffi[0].split(/  /);
                              var ff2 = ffi[1].split(/  /);
                              var common = ff1[1].split(' ')[1];
                              common = common.substr(0,common.length-1);
                              console.log(ff1,ff2,common);
                              fs.unlink('/tmp/wdiff1');
                              fs.unlink('/tmp/wdiff2');
                              qgrade = +common / 100.0;
                              callback(qgrade);
                           });
                         });
                      });
                     return;
                   }
                 }
                 console.log(fasit,ua,'tot=',tot,'uco=',ucorr,'uer=',uerr);
                 if (tot > 0) {
                   qgrade = (ucorr - uerr/6) / tot;
                 }
                 qgrade = Math.max(0,qgrade);
               break;
             case 'sequence':
                 // adjustment for orderd sequence
                 var adjust =  {   2 : 0.51,  3 : 0.5,   4 : 0.38,  5 : 0.35,
                                   6 : 0.38,  7 : 0.38,  8 : 0.32,  9 : 0.32,
                                  10 : 0.34, 11 : 0.34, 12 : 0.3,  13 : 0.3,
                                  14 : 0.31, 15 : 0.32, 16 : 0.28, 17 : 0.28,
                                  18 : 0.26, 19 : 0.26, 20 : 0.24, 21 : 0.24,
                                  22 : 0.22, 23 : 0.22, 24 : 0.21, 25 : 0.21,
                                  26 : 0.2,  27 : 0.19, 28 : 0.18, 29 : 0.18,
                                  30 : 0.17, 31 : 0.17, 32 : 0.16, 33 : 0.16,
                                  34 : 0.16, 35 : 0.16, 36 : 0.14, 37 : 0.15,
                                  38 : 0.14, 39 : 0.14, 40 : 0.13, 41 : 0.14,
                                  42 : 0.13, 43 : 0.13, 44 : 0.12, 45 : 0.13,
                                  46 : 0.12, 47 : 0.12, 48 : 0.11, 49 : 0.11,
                                  50 : 0.11, 51 : 0.11, 52 : 0.1, 53 : 0.1,
                                  54 : 0.1,  55 : 0.1, 56  : 0.1, 57 : 0.1,
                                  58 : 0.1,  59 : 0.1, 60  : 0.09,
                                  61 : 0.09, 62 : 0.09, 63 : 0.09 };

                 var fasit = param.cats;
                 var tot = 0;      // total number of options
                 var ucorr = 0;    // user correct choices
                 var uerr = 0;     // user false choices
                 var idx;
                 for (var ii=0,l=fasit.length; ii < l; ii++) {
                   tot += fasit[ii].length;
                 }
                 for (var ii=0,l=ua.length; ii < l; ii++) {
                   if (ua[ii]) {
                     if (param.catnames[ii].charAt(0) == '+') {
                       // this sequence is ordered
                       // we check the sequence and also the reversed sequence
                       // first we make a reverse lookup list
                       var idlist = {};
                       for (var jj=0,jl=fasit[ii].length; jj < jl; jj++) {
                         var elm = fasit[ii][jj];
                         idlist[elm] = jj;
                       }
                       var w = Math.min(4,Math.max(1,Math.floor(fasit[ii].length/2)));
                         // width of sequence
                       var maxs = fasit[ii].length;
                       var pr = -1;  // prev value
                       var seq = 0;  // score for sequence  a,b,c,d,e,f
                       var inv = 0;  // score for inverse sequence  f,e,d,c,b,a
                       var idx;      // idx we should have for this element
                       var dscore,rdscore;
                       var inorder = 0;
                       var reverse = 0;
                       for (var jj=0,jl=ua[ii].length; jj < jl; jj++) {
                         var ff = unescape(ua[ii][jj]);
                         idx = idlist[ff];
                         if (idx == undefined) idx = -999;
                         dscore = 1 - Math.min(w,Math.abs(jj-idx))/w;
                         rdscore = 1 - Math.min(w,Math.abs(maxs-jj-idx))/w;
                         if (idx == pr + 1) seq++;
                         if (idx == pr - 1) inv++;
                         pr = idx;
                         inorder += dscore;
                         reverse += rdscore;
                       }
                       if (inv > seq) {
                         inorder = reverse * 0.9;
                         seq = inv;
                       }
                       ucorr = (inorder+seq)/2;
                       if (maxs > 0.45 * tot) {
                         // this sequence is a large part of this question
                         // we dont need adjustment if we have many small sequences
                         // as then its hard placing an element in the correct sequence
                         // in the first place - getting the order right is simple addon 
                         var adj = adjust[Math.min(63,tot)] * maxs;
                         console.log(ucorr,adj);
                         ucorr = ucorr*Math.max(0,(ucorr-adj)/(maxs-adj));
                       }
                     } else {
                       for (var jj=0,jl=ua[ii].length; jj < jl; jj++) {
                         var ff = unescape(ua[ii][jj]);
                         if (fasit[ii].indexOf(ff) >= 0) {
                           ucorr++;
                         } else {
                           uerr++;
                         }
                       }
                     }
                   }
                 }
                 if (tot > 0) {
                   qgrade = (ucorr - uerr/6) / tot;
                 }
                 qgrade = Math.max(0,qgrade);
               break;
             case 'textmark':
             case 'info':
             case 'dragdrop':
                 //var fasit = qobj.fasit;
                 var fasit = param.fasit;
                 var tot = 0;      // total number of options
                 var ucorr = 0;    // user correct choices
                 var uerr = 0;     // user false choices
                 for (var ii=0,l=fasit.length; ii < l; ii++) {
                   tot++;
                   var ff = unescape(fasit[ii]);
                   var fasil = ff.split(',');
                   if (ff == ua[ii] || fasil.indexOf(ua[ii]) >= 0 ) {
                     ucorr++;
                   } else {
                     if (ua[ii] != undefined && ua[ii] != '' && ua[ii] != '&nbsp;&nbsp;&nbsp;&nbsp;') {
                       uerr++;
                     }
                   }
                 }
                 console.log(fasit,ua,'tot=',tot,'uco=',ucorr,'uer=',uerr);
                 if (tot > 0) {
                   qgrade = (ucorr - uerr/6) / tot;
                 }
                 qgrade = Math.max(0,qgrade);
               break;
             case 'multiple':
                 //console.log(qobj,useranswer);
                 var fasit = qz.reorder(qobj.fasit,optorder);
                 var tot = 0;      // total number of options
                 var totfasit = 0; // total of choices that are true
                 var ucorr = 0;    // user correct choices
                 var uerr = 0;     // user false choices
                 var utotch = 0;   // user total choices - should not eq tot
                 for (var ii=0,l=fasit.length; ii < l; ii++) {
                   var truthy = (fasit[ii] == '1');
                   tot++;
                   if (ua[ii]) utotch++;
                   if (truthy) totfasit++;
                   if (ua[ii] && truthy ) {
                     ucorr++;
                   } else if(!truthy  && ua[ii] ) {
                     uerr++;
                   }
                 }
                 //console.log('tot=',tot,'fasit=',totfasit,'uco=',ucorr,'uer=',uerr);
                 if (totfasit > 0) {
                   qgrade = (ucorr - uerr / 3) / totfasit;
                 }
                 if (utotch == tot) {
                   qgrade = 0;    // all options checked => no score
                 }
                 qgrade = Math.max(0,qgrade);
               break;
             case 'info':
               break;
             default:
               break;
           }
           callback(qgrade);
  }
}

module.exports.qz = qz;
