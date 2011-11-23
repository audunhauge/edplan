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
 ,  display: function(qu) {
           // takes a question and returns a formatted display text
           var qobj = { display:'', options:[] , fasit:[]};
           try {
             eval( 'qobj='+qu.qtext);
           } catch(err) {
             qobj = { display:'', options:[] , fasit:[]};
           }
           switch(qu.qtype) {
             case 'multiple':
               qobj.optorder = qz.perturbe(qobj.options.length);
               break;
             case 'info':
               break;
             default:
               break;
           }
           //qobj.fasit = [];
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
           var qobj = { display:'', options:[] , fasit:[]};
           var qgrade = 0;
           var ua;
           
           try {
             eval( 'qobj='+aquest.qtext);
           } catch(err) {
           }
           if (!qobj) {
             qobj = { display:'', options:[] , fasit:[]};
           }

           try {
             eval( 'ua ='+useranswer);
           } catch(err) {
           }
           if (!ua) {
             ua = [];
           }
           switch(aquest.qtype) {
             case 'multiple':
                 console.log(qobj,useranswer);
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
