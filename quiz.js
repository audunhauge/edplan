// this module implements the server-side of quiz-question engine
//   display   : will pick apart questions dependent on type
//   grade     : grade question-answer against correct answer


var qz = {
display: function(qu) {
           // takes a question and returns a formatted display text
           var qobj;
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
           qobj.fasit = [];
           qobj.id = qu.id;
           qobj.qtype = qu.qtype;
           qobj.points = qu.points;
           qobj.name = qu.name;
           return qobj;

         }

}

module.exports.qz = qz;
