// this module implements the server-side of quiz-question engine
//   display   : will pick apart questions dependent on type
//   grade     : grade question-answer against correct answer

var qz = {
    quiz:{}         // cache for quiz info
 ,  question:{}     // cache for questions
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
     var jane = [];
     for (var i=0,l=marry.length; i<l; i++) {
       var a = str.charCodeAt(i) - 97;
       jane.push(marry[a]);
     }
     return jane;
 }
 , getQobj: function(qtext) {
     var qobj = { display:'', options:[] , fasit:[]};
     try {
        eval( 'qobj='+qtext);
     } catch(err) {
     }
     if (qobj == undefined) {
        qobj = { display:'', options:[] , fasit:[]};
     }
     return qobj;
   }
 , macro:function(text,userid,instance) {
     var x = Math.floor(1+Math.random()*10);
     text = text.replace(/\${x}/g,x);
     return text;
   }  
 , generateParams:function(question,userid,instance) {
     var q = qz.question[question.id];  // get from cache - question is stripped of fasit and params
     //console.log("generATE params",question,instance,q,qobj);
     var qtxt = qz.macro(q.qtext, userid,instance);
     var qobj = qz.getQobj(qtxt);
     switch(question.qtype) {
       case 'multiple':
	 if (qobj.options && qobj.options.length) {
           qobj.optorder = qz.perturbe(qobj.options.length);
           //qobj.fasit = qz.reorder(qobj.fasit,qobj.optorder);
           qobj.fasit = '';   // don't return fasit
           qobj.options = qz.reorder(qobj.options,qobj.optorder);
           console.log("REEEORDERED    =",qobj);
	 }
         break;
       case 'info':
         break;
       default:
         break;
     }
     //console.log("generATE params q=",q);
     return qobj
    
   }	       
 ,  display: function(qu,options) {
           // takes a question and returns a formatted display text
           // if fasit == false - remove this property
           // and also remove prop options
           //   studs may glean info from original order of
           //   options in a multiple choice question
           //   it's likely that the first option in the list is correct choice
           options = typeof(options) != 'undefined' ?  options : true;
           var qobj = qz.getQobj(qu.qtext);
           qobj.fasit = [];  // we never send fasit for display
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

  , grade: function(aquiz,aquest,useranswer) {
           // takes a question + useranswer and returns a grade
           var qobj = qz.getQobj(aquest.qtext);
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
             case 'multiple':
                 //console.log(qobj,useranswer);
                 var tot = 0;      // total number of options
                 var totfasit = 0; // total of choices that are true
                 var ucorr = 0;    // user correct choices
                 var uerr = 0;     // user false choices
                 var utotch = 0;   // user total choices - should not eq tot
                 for (var ii=0,l=qobj.fasit.length; ii < l; ii++) {
                   var truthy = (qobj.fasit[ii] == '1');
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
           return qgrade;
  }
}

module.exports.qz = qz;
