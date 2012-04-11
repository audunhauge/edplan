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
  str=str.replace(/\\/g,'\\\\');
  str=str.replace(/\'/g,'\\\'');
  str=str.replace(/\"/g,'\\"');
  str=str.replace(/\0/g,'\\0');
  return str;
}


var remap = { niwi:{old:1348, nu:10061}, 
              haau:{old:654, nu:10024}, 
              vier:{old:1348, nu:10090}, 
              begu:{old:1378, nu:10004}, 
              hotr:{old:1368, nu:10038}, 
              sokn:{old:1374,nu:10081}  };

var user = 'haau';
if (process.argv[2]) {
    var user = process.argv[2];
}
var info = remap[user];

var wordlist = {};
var skipwords = {};
var relations = {};  // questions sharing words
var questions = [];
var shortlist = ' akkurat aldri alene all alle allerede alltid alt alts_a andre annen annet _ar _arene at av b_ade bak bare'
+ ' skriv finn klikk f_olgende svar bruk husk deretter begynne gj_or bedre begge begynte beste betyr blant ble blev bli blir blitt b_or bort borte bra bruke burde byen da dag dagen dager'
+ ' d_arlig de deg del dem den denne der dere deres derfor dermed dersom dessuten det dette din disse d_oren du eg egen egentlig'
+ ' eget egne ei ein eit eksempel eller ellers en enda ene eneste enkelte enn enn_a er et ett etter f_a fall fant far f_ar faren fast f_att'
+ ' fem fikk finne finner finnes fire fjor flere fleste f_olge folk f_olte for f_or foran fordi forhold f_orst f_orste forteller fortsatt fra'
+ ' fr_a fram frem fremdeles full funnet ga g_a gamle gammel gang gangen ganger ganske g_ar g_att gi gikk gir gitt gjelder gjennom gjerne gj_or gjorde'
+ ' gj_ore gjort glad god gode godt grunn gud ha hadde ham han hans har hatt hele heller helst helt henne hennes her hjelp hjem hjemme'
+ ' ho holde holder holdt h_ore h_orte hos hun hus huset hva hvem hver hverandre hvert hvis hvor hvordan hvorfor igjen ikke ikkje imidlertid'
+ ' imot ingen ingenting inn inne ja jeg jo kampen kan kanskje kjenner kjent kjente klar klart kom komme kommer kommet kort '
+ ' kunne kveld la l_a laget lagt lang lange langt legge legger lenge lenger lett ligger like likevel lille lite liten litt liv'
+ ' livet l_opet l_ordag lot m_a m_al man mange mann mannen m_ate m_aten m_atte med meg meget mellom men mener menn menneske mennesker mens mente mer'
+ ' mest mig min mindre mine minst mitt mor moren mot m_ote mulig mye n n_a n_ermere n_ar ned nei neste nesten nettopp noe noen nok norge norges'
+ ' norsk norske nu ny nye nytt ofte og ogs_a om omkring _onsker op opp oppe ord oss over overfor p_a par per plass plutselig '
+ ' redd reiste rekke rett riktig rundt sa s_a s_erlig sagt saken samme sammen samtidig satt satte se seg seier seks selv senere ser'
+ ' sett sette si side siden sier sig sikkert sin sine siste sitt sitter skal skulde skulle slags slik slike slikt slo slutt sm_a snakke snakket'
+ ' snart som spurte st_a stadig st_ar sted stedet sterkt stille sto stod stor store st_orre st_orste stort stund sv_ert svarte synes syntes ta'
+ ' tar tatt tenke tenker tenkt tenkte ti tid tiden tidende tidligere til tilbake tillegg ting to tok tre trenger tro trodde tror under unge ut'
+ ' ute uten utenfor v_ere v_ert vanskelig vant var v_ar v_are v_art ved vei veien vel ventet verden vet vi videre viktig vil vilde ville virkelig'
+ ' vise viser visst visste viste vite';
shortlist.replace(/(\w+)\s/g,function(m,wo) {
       skipwords[wo] = 1;
       return '';
    });

var getAllTags = function() {
  pg.connect(connectionString, after(function(cli) {
    // first find existing tags
          // now find all questions and pick out any tag field from import
          cli.query('select * from quiz_question where teachid='+ info.nu ,
             after(function(results) {
                if (results && results.rows) {
                  for (var i=0, l= results.rows.length; i<l; i++) {
                    var qu = results.rows[i];
                    questions[qu.id] = qu;
                    var str = qu.qtext;
                    str = str.replace(/\\n/g,' ');
                    str = str.replace(/\\r/g,' ');
                    str = str.replace(/&aring;/g,'_a');
                    str = str.replace(/&oslash;/g,'_o');
                    str = str.replace(/&aelig;/g,'_e');
                    str = str.replace(/å/g,'_a');
                    str = str.replace(/ø/g,'_o');
                    str = str.replace(/æ/g,'_e');
                    str.replace(/([A-Z_a-z]+)\s/g,function(m,wo) {
                        if (wo.length < 3) return '';
                        wo = wo.toLowerCase();
                        if (skipwords[wo]) {
                          console.log('skipping ',wo);
                          return '';
                        }
                        wo = wo.replace(/_a/g,'å').replace(/_o/g,'ø').replace(/_e/g,'æ');
                        if (wordlist[wo]) {
                          wordlist[wo].count ++;
                          if (!wordlist[wo].qids[qu.id]) {
                            wordlist[wo].qcount ++;
                            wordlist[wo].qids[qu.id] = 1;
                          }
                        } else {
                          wordlist[wo] = { count:1, qcount:1, qids:{} };
                          wordlist[wo].qids[qu.id] = 1;
                        }
                        return '';
                      });
                  }
                }
                for (var wo in wordlist) {
                  var w = wordlist[wo];
                  if (w.count > 1 && w.qcount > 1 ) {
                    console.log(wo,w);
                     for (q in w.qids) {
                       if (!relations[q]) {
                         relations[q] = {};
                       }
                       for (qq in w.qids) {
                         if (qq == q) continue;
                         if (!relations[q][qq]) {
                           relations[q][qq] = 0;
                         }
                         relations[q][qq]++;
                       }
                     }
                  }
                }
                for (q in relations) {
                  var rr = relations[q];
                  for (r in rr) {
                    if (rr[r] > 8) {
                      //console.log(questions[q].qtext,q,r,rr[r]);
                      console.log(rr[r],q,r,questions[q].qtype,questions[q].qtext.substr(0,35));
                    }
                  }
                }

             }));
  }));
}

getAllTags();




