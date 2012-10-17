// some utility functions

function clone(o) {
  // make a deep copy - assumed to be simple object
  var tmp = {},k;
  for (k in o) {
     if (o[k] && typeof o[k] == "object") {
       tmp[k] = o[k].clone();
     } else tmp[k] = o[k]
  }
  return tmp;
}

function override(a,b) {
  // overide properties in a with props from b
  var k;
  for (k in b) {
    if (b.hasOwnProperty(k)) {
       if (b[k] && typeof b[k] == "object") {
         override(a[k],b[k]);
       } else {
         a[k] = b[k];
       }
    }
  }
}

function typeOf(value) {
    var s = typeof value;
    if (s === 'object') {
        if (value) {
            if (typeof value.length === 'number' &&
                    !(value.propertyIsEnumerable('length')) &&
                    typeof value.splice === 'function') {
                s = 'array';
            }
        } else {
            s = 'null';
        }
    }
    return s;
}

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}


function isEmpty(o) {
    var i, v;
    if (typeOf(o) === 'object') {
        for (i in o) {
            v = o[i];
            if (v !== undefined && typeOf(v) !== 'function') {
                return false;
            }
        }
    }
    return true;
}

if (!String.prototype.entityify) {
    String.prototype.entityify = function () {
        return this.replace(/&/g, "&amp;").replace(/</g,
            "&lt;").replace(/>/g, "&gt;");
    };
}

if (!String.prototype.quote) {
    String.prototype.quote = function () {
        var c, i, l = this.length, o = '"';
        for (i = 0; i < l; i += 1) {
            c = this.charAt(i);
            if (c >= ' ') {
                if (c === '\\' || c === '"') {
                    o += '\\';
                }
                o += c;
            } else {
                switch (c) {
                case '\b':
                    o += '\\b';
                    break;
                case '\f':
                    o += '\\f';
                    break;
                case '\n':
                    o += '\\n';
                    break;
                case '\r':
                    o += '\\r';
                    break;
                case '\t':
                    o += '\\t';
                    break;
                default:
                    c = c.charCodeAt();
                    o += '\\u00' + Math.floor(c / 16).toString(16) +
                        (c % 16).toString(16);
                }
            }
        }
        return o + '"';
    };
} 

if (!String.prototype.supplant) {
    String.prototype.supplant = function (o) {
        return this.replace(/{([^{}]*)}/g,
            function (a, b) {
                var r = o[b];
                return typeof r === 'string' || typeof r === 'number' ? r : '';
            }
        );
    };
}

if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^\s*(\S*(?:\s+\S+)*)\s*$/, "$1");
    };
}



function gui(elements) {
  // create gui-elements
  //  { defaults:{ ... }, elements:{ ... }
  // prescan the list to get references for dependencies
  var deppers = {};
  for (var tag in elements.elements) {
    var elm = elements.elements[tag];
    var depend = (elm.depend != undefined) ? elm.depend : null;
    if (depend) for (var ta in depend) {
      if (!deppers[ta]) {
        deppers[ta] = {};
      }
      deppers[ta][tag] = depend[ta];
    }
  }
  var res = {};
  for (var tag in elements.elements) {
    var elm = elements.elements[tag];
    elm.name = elm.name || tag
    elm.id = elm.id || tag;
    elm.type = elm.type || elements.defaults.type;
    elm.klass = (elm.klass != undefined) ? elm.klass : elements.defaults.klass;
    elm.disabled = '';
    // add class so state can be set on change for dependents
    if (deppers[tag]) {
      elm.klass += " deppers";
      var depp = [];
      for (var tt in deppers[tag]) {
        var tty = deppers[tag][tt];
        depp.push(tt+':'+tty);
      }
      elm.depp = 'derp="'+depp.join(';') + '"';
    }
    // initial state for control - all depps must be true
    if (elm.depend) {
      for (var tt in elm.depend) {
        if (elm.depend[tt] != elements.elements[tt].value) {
          elm.disabled = ' disabled="disabled" ';
        }
      }
    }
    var s = '<input type="{type}" name="{name}" id="{id}" ';
    if (elm.type == 'select' || elm.type == 'yesno') {
        s = '<select name="{name}" id="{id}" ';
    }
    if (elm.klass) {
      s += '{disabled} {depp} class="{klass}" ';
    }
    s = s.supplant(elm);
    switch (elm.type) {
      case 'yesno':
        s += '>';
        elm.checked = (+elm.value == 1) ? ' selected="selected"' : ''; 
        s += '<option value="1"{checked} >ja</option>'.supplant(elm);
        elm.checked = (+elm.value == 0) ? ' selected="selected"' : ''; 
        s += '<option value="0"{checked} >nei</option>'.supplant(elm);
        s += '</select>';
        break;
      case 'select':
        s += '>';
        if (elm.options) {
          for (var j=0; j < elm.options.length; j++) {
            var item = elm.options[j]; // item may be string - just a value - or object { label:xx, value:yy }
            var opt = {};
            opt.label = (item.label == undefined) ? (item.value != undefined ? item.value : item  ) : item.label;
            opt.value = item.value || opt.label;
            var checked = (elm.value == opt.value) ? ' selected="selected"' : '';
            opt.checked = checked;
            s += '<option value="{value}"{checked} >{label}</option>'.supplant(opt);
          }
        }
        s += '</select>';
        break;
      case 'checkbox':
      case 'radio':
        s = '';
        if (elm.options) {
          for (var j=0; j < elm.options.length; j++) {
            var opt = elm.options[j];
            var checked = (elm.value == opt.value) ?  ' checked="checked"' : '';
            opt.checked = checked;
            opt.type = elm.type;
            opt.name = elm.name;
            opt.id = elm.id;
            opt.klass = elm.klass;
            s += '<input name="{name}" id="{id}" class="check {klass}" type="{type}" value="{value}"{checked} >'.supplant(opt);
          }
        }
        break;
      default:
        s += ' value="{value}">'.supplant(elm);
        break;
    }
    res[tag] = s;
  }
  return res;
}

function formatweekdate(jd) {
    // given a julian day will return 3.4 - 9.4 
    var greg = julian.jdtogregorian(jd);
    var d1 = new Date(greg.year, greg.month-1, greg.day);
    greg = julian.jdtogregorian(jd+4);
    var d2 = new Date(greg.year, greg.month-1, greg.day);
    return "" + d1.getDate() + '.' + (d1.getMonth()+1) + '-'+d2.getDate()+ '.'  + (d2.getMonth()+1);
}    

function addTime(a,b) {
  // adds two hh.mm
  var elm = a.split('.');
  var ah = +elm[0], am = +elm[1];
  elm = b.split('.');
  var bh = +elm[0], bm = +elm[1];
  var tm = am+bm;
  var th = ah+bh+Math.floor(tm/60);
  tm = tm % 60;
  if (tm < 10) tm = '0' + tm;
  return (th+'.'+tm);
}

function shuffle(ar) {
        var len = ar.length;
        var i = len;
        while (i--) {
                var p = Math.floor(Math.random()*len);
                var t = ar[i];
                ar[i] = ar[p];
                ar[p] = t;
        }
};

String.prototype.cap = function() {
  // cap first char of string
  return this.charAt(0).toUpperCase() + this.slice(1);
}

String.prototype.caps = function() {
  // cap first char of all words in string
  return this.replace( /(^|\s)([a-zæøå])/g , function(m,p1,p2){ return p1+p2.toUpperCase(); } );
}

function disjoint(g1,g2) {
  // return elements in g2,g1 not in (g1 and g2)
  var dis = [];
  for (var i in g1) {
    var eg1 = g1[i];
    if ($j.inArray(eg1,g2) == -1) {
      dis.push(eg1);
    }
  }
  for (var i in g2) {
    var eg2 = g2[i];
    if ($j.inArray(eg2,g1) == -1) {
      dis.push(eg2);
    }
  }
  return dis;
}

function getkeys(obj) {
  // return array of keys in object
  var things = []
  for (var k in obj) {
      if (obj.hasOwnProperty(k)) {
         things.push(k);
      }
  }
  return things;
}

function countme(obj) {
  var count = 0;
  for (var k in obj) {
      if (obj.hasOwnProperty(k)) {
         ++count;
      }
  }
  return count;
}

function gup( name ) {
    // get url parameter from location href
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regexS = "[\\?&]"+name+"=([^&#]*)";
    var regex = new RegExp( regexS );
    var results = regex.exec( window.location.href );
    if( results == null )
      return "";
    else
      return results[1];
}
var julian = {
  greg2jul: function (mm,id,iyyy) {
      var jy,jm,jul,ja;
      if (iyyy <0) iyyy += 1;
      if (mm>2) {
       jy = iyyy;
       jm = mm+1;
      } else {
       jy = iyyy-1;
       jm = mm + 13;
      }
      jul = Math.floor(365.25*jy) + Math.floor(30.6001*jm)+id+1720995;
      if (id+31*(mm+12*iyyy) >= (15+31*(10+12*1582))) {
       ja = Math.floor(0.01 * jy);
       jul += Math.floor(2 - ja+ Math.floor(0.25* ja));
      }
      return Math.floor(jul);
  },

  jdtogregorian: function (julian) {
      var jalpha,ja,jb,jc,jd,je,id,mm,iyyy;
      if (julian >= (15+31*(10+12*1582))) {
          jalpha =  Math.floor((julian -1867216-0.25)/36524.25);
          ja = Math.floor(julian +1 + jalpha - Math.floor(0.25*jalpha));
      } else {  ja = julian; }
      jb = Math.floor(ja + 1524);
      jc = Math.floor(6680.0 + (jb-2439870-122.1)/365.25);
      jd = Math.floor(365*jc+(0.25*jc));
      je = Math.floor((jb-jd)/30.6001);
      id = Math.floor(jb - jd -Math.floor(30.6001*je));
      mm = Math.floor(je-1);
      if (mm >12) mm -= 12;
      iyyy = Math.floor(jc -4715);
      if (mm>2) iyyy -= 1;
      if (iyyy <= 0) iyyy -= 1;
      return { month:mm, day:id, year:iyyy };
  },


  w2j :function (year,week) {
      base = julian.greg2jul(1,1,year);
      rest = base % 7;
      start = base - rest;
      if (rest>3) start += 7;
      return Math.floor(start + 7*(week-1));
  },

  week : function (jd) {
      var base,rest,start,jdate;
      jd = (typeof jd != "undefined" && jd !== null) ? jd : 0;
      if (jd == 0) {
         var today = new Date();
         jdate = { month:today.getMonth()+1, day: today.getDate(),  year:today.getFullYear() };
         jd = julian.greg2jul(jdate.month,jdate.day,jdate.year);
      } else {
         jdate = julian.jdtogregorian(jd);
      }
      base = julian.greg2jul(1,1,jdate.year);
      rest = base % 7;
      start = base - rest;
      if (rest>3) start += 7;
      if (jd < start) return 0;
      return 1 + Math.floor((jd - start) / 7);
  }

}

var Url = {
    encode : function (string) {
        return escape(this._utf8_encode(string));
    },
    decode : function (string) {
        return this._utf8_decode(unescape(string));
    },
    _utf8_encode : function (string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";
        for (var n = 0; n < string.length; n++) {
            var c = string.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    },
    _utf8_decode : function (utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;
        while ( i < utftext.length ) {
            c = utftext.charCodeAt(i);
            if (c == 94) c = 32;
            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i+1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i+1);
                c3 = utftext.charCodeAt(i+2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
        }
        return string;
    }
}

