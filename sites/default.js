var crypto = require('crypto');
// static data that doesnt need to be stored i db
//   list of rooms



// standard timeslots for lesson-slots
var slotlabels = '8.05-8.45,8.45-9.25,9.35-10.15,10.20-11.00,11.25-12.05,12.10-12.50,12.50-13.30,'
               + '13.40-14.20,14.25-15.05,15.05-15.30,15.30-16.00,16.00-16.30,16.30-17.00,17.00-17.30,'
               + '17.30-18.00,18.00-18.30,18.30-19.00,19.00-19.30,19.30-20.00,20.00-20.30,20.30-21.00';

var roominfo = {};

var menu = {
     login                : 'Login'
   , logout               : 'logout'
   , seek                 : 'seek'
   , yearplan             : 'Yearplan'
   , thisweek             : 'This week'
   , next4                : 'Next 4 weeks'
   , sss                  : 'Starbkurs'
   , restofyear           : 'Rest of year'
   , wholeyear            : 'Whole year'
   , mytests              : 'My tests'
   , bigtest              : 'Main tests'
   , alltests             : 'All tests'
   , plans                : 'Plans'
   , mycourses            : 'My courses'
   , othercourses         : 'Other courses'
   , away                 : 'Away'
   , quiz                 : 'Quiz'
   , timeplans            : 'Timeplans'
   , teachers             : 'Teachers'
   , students             : 'Students'
   , groupings            : 'Groupings'
   , klasses              : 'Classes'
   , groups               : 'Groups'
   , courses              : 'Courses'
   , rooms                : 'Rooms'
   , multiview            : 'MultiView'
   , loading              : 'loading plans ...'
}

var site = {
   title                :       "My School"
 , base                 :       "/myschool"
 , language             :       "en"
 , timezone             :       -1
 , port                 :       3000
 , menu                 :       menu
 , admin                :       {  // get the admin menue
                                    'admin':true
                                }
 , depleader :                  {  // department -leaders  get email when people are sick
                                }
 , course               :       [  ]   // missing course list
 , schoolyear           :       "2011-2012"
 , connectionString     :       "postgres://admin:123@localhost/planner"
 , supwd                :       crypto.createHash('md5').update('gto').digest("hex")
 , startpwd             :       crypto.createHash('md5').update('abd').digest("hex")
 , adminpwd             :       crypto.createHash('md5').update('13').digest("hex")
 , roominfo             :       roominfo
 , slotlabels           :       slotlabels
 , days                 :       5               // default number of days for reservations
 , slots                :       12              // default slots for reservations
}
module.exports = site;
