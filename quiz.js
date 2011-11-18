// this module implements the server-side of quiz-question engine
//   display   : will pick apart questions dependent on type
//   grade     : grade question-answer against correct answer


var qz = {
    quiz:{}         // cache for quiz info
 ,  question:{}     // cache for questions
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
           return qobj;

         }

  , grade: function(aquiz,aquest,useranswer) {
           // takes a question + useranswer and returns a grade
           //console.log(aquiz,aquest,useranswer);
           var qobj = { display:'', options:[] , fasit:[]};
           var qgrade = 0;
           try {
             eval( 'qobj='+aquest.qtext);
           } catch(err) {
             qobj = { display:'', options:[] , fasit:[]};
           }
           if (!qobj) {
             qobj = { display:'', options:[] , fasit:[]};
           }
           switch(aquest.qtype) {
             case 'multiple':
                 //console.log(qobj,useranswer);
                 var tot = 0;      // total number of options
                 var totfasit = 0; // total of choices that are true
                 var ucorr = 0;    // user correct choices
                 var uerr = 0;     // user false choices
                 for (var ii=0,l=qobj.fasit.length; ii < l; ii++) {
                   var truthy = (qobj.fasit[ii] == '1');
                   tot++;
                   if (truthy) totfasit++;
                   if (useranswer[ii] && truthy ) {
                     ucorr++;
                   } else {
                     uerr++;
                   }
                 }
                 qgrade = (ucorr - uerr / 3) / totfasit;
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
