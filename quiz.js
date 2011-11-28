// this module implements the server-side of quiz-question engine
//   display   : will pick apart questions dependent on type
//   grade     : grade question-answer against correct answer

var fs = require('fs');
var exec = require('child_process').exec;
var Parser = function () {
	function object(o) {
		function F() {}
		F.prototype = o;
		return new F();
	}

	var TNUMBER = 0;
	var TFUNC1 = 1;
	var TFUNC2 = 2;
	var TVAR = 3;
	var TMARKER = 4;

	function Token(type_, index_, prio_, number_) {
		this.type_ = type_;
		this.index_ = index_ || 0;
		this.prio_ = prio_ || 0;
		this.number_ = number_ || 0;
		this.toString = function () {
			switch (this.type_) {
			case TNUMBER:
				return this.number_;
			case TFUNC1:
			case TFUNC2:
			case TVAR:
				return this.index_;
			case TMARKER:
				return ",";
			default:
				return "Invalid Token";
			}
		};
	}

	function Expression(tokens, funcs1, funcs2) {
		this.tokens = tokens;
		this.funcs1 = funcs1;
		this.funcs2 = funcs2;
	}

	Expression.prototype = {
		simplify: function (values) {
			values = values || {};
			var nstack = [];
			var newexpression = [];
			var n1;
			var n2;
			var f;
			var L = this.tokens.length;
			var item;
			var i = 0;
			for (i = 0; i < L; i++) {
				item = this.tokens[i];
				var type_ = item.type_;
				if (type_ === TNUMBER) {
					nstack.push(item);
				}
				else if (type_ === TVAR && (item.index_ in values)) {
					item = new Token(TNUMBER, 0, 0, values[item.index_]);
					nstack.push(item);
				}
				else if (type_ === TFUNC2 && nstack.length > 1) {
					n2 = nstack.pop();
					n1 = nstack.pop();
					f = this.funcs2[item.index_];
					item = new Token(TNUMBER, 0, 0, f(n1.number_, n2.number_));
					nstack.push(item);
				}
				else if (type_ === TFUNC1 && nstack.length > 0) {
					n1 = nstack.pop();
					f = this.funcs1[item.index_];
					item = new Token(TNUMBER, 0, 0, f(n1.number_));
					nstack.push(item);
				}
				else if (type_ === TMARKER) {
				}
				else {
					while (nstack.length > 0) {
						newexpression.push(nstack.shift());
					}
					newexpression.push(item);
				}
			}
			while (nstack.length > 0) {
				newexpression.push(nstack.shift());
			}

			return new Expression(newexpression, object(this.funcs1), object(this.funcs2));
		},

		substitute: function (variable, expr) {
			if (!(expr instanceof Expression)) {
				expr = new Parser().parse(expr);
			}
			var newexpression = [];
			var L = this.tokens.length;
			var item;
			var i = 0;
			for (i = 0; i < L; i++) {
				item = this.tokens[i];
				var type_ = item.type_;
				if (type_ === TVAR && item.index_ === variable) {
					for (var j = 0; j < expr.tokens.length; j++) {
						var expritem = expr.tokens[j];
						var replitem = new Token(expritem.type_, expritem.index_, expritem.prio_, expritem.number_);
						newexpression.push(replitem);
					}
				}
				else {
					newexpression.push(item);
				}
			}

			var ret = new Expression(newexpression, object(this.funcs1), object(this.funcs2));
			return ret;
		},

		evaluate: function (values) {
			values = values || {};
			var nstack = [];
			var n1;
			var n2;
			var f;
			var L = this.tokens.length;
			var item;
			var i = 0;
			for (i = 0; i < L; i++) {
				item = this.tokens[i];
				var type_ = item.type_;
				if (type_ === TNUMBER) {
					nstack.push(item.number_);
				}
				else if (type_ === TFUNC2) {
					n2 = nstack.pop();
					n1 = nstack.pop();
					f = this.funcs2[item.index_];
					nstack.push(f(n1, n2));
				}
				else if (type_ === TVAR) {
					if (item.index_ in values) {
						nstack.push(values[item.index_]);
					}
					else {
						throw new Error("undefined variable: " + item.index_);
					}
				}
				else if (type_ === TFUNC1) {
					n1 = nstack.pop();
					f = this.funcs1[item.index_];
					nstack.push(f(n1));
				}
				else if (type_ === TMARKER) {
				}
				else {
					throw new Error("invalid Expression");
				}
			}
			if (nstack.length > 1) {
				throw new Error("invalid Expression (parity)");
			}
			return nstack[0];
		},

		toString: function () {
                        var mathback = {
                                "sin"  : 'Math.sin',
                                "cos"  : 'Math.cos',
                                "tan"  : 'Math.tan',
                                "asin" : 'Math.asin',
                                "acos" : 'Math.acos',
                                "atan" : 'Math.atan',
                                "sqrt" : 'Math.sqrt',
                                "log"  : 'Math.log',
                                "abs"  : 'Math.abs',
                                "ceil" : 'Math.ceil',
                                "floor": 'Math.floor',
                                "round": 'Math.round',
                                "exp"  : 'Math.exp'
                        };
			var nstack = [];
			var n1;
			var n2;
			var f;
			var L = this.tokens.length;
			var item;
			var i = 0;
			for (i = 0; i < L; i++) {
				item = this.tokens[i];
				var type_ = item.type_;
				if (type_ === TNUMBER) {
					nstack.push(item.number_);
				}
				else if (type_ === TFUNC2) {
					n2 = nstack.pop();
					n1 = nstack.pop();
					f = item.index_;
					if (f.length === 1) {
						nstack.push("(" + n1 + f + n2 + ")");
					}
					else {
						nstack.push(f + "(" + n1 + "," + n2 + ")");
					}
				}
				else if (type_ === TVAR) {
					nstack.push(item.index_);
				}
				else if (type_ === TFUNC1) {
					n1 = nstack.pop();
					f = item.index_;
					if (f.length === 1) {
						nstack.push("(" + f + n1 + ")");
					}
					else {
                                                var fg = mathback[f] || f;
						nstack.push(fg + "(" + n1 + ")");
					}
				}
				else if (type_ === TMARKER) {
				}
				else {
					throw new Error("invalid Expression");
				}
			}
			if (nstack.length > 1) {
				throw new Error("invalid Expression (parity)");
			}
			return nstack[0];
		},

		variables: function () {
			var L = this.tokens.length;
			var vars = [];
			for (var i = 0; i < L; i++) {
				var item = this.tokens[i];
				if (item.type_ === TVAR && (vars.indexOf(item.index_) == -1)) {
					vars.push(item.index_);
				}
			}

			return vars;
		},

		toJSFunction: function (param, variables) {
			var f = new Function(param, "with(Parser.values) { return " + this.simplify(variables).toString() + "; }");
			return f;
		}
	};

	function add(a, b) {
		return a + b;
	}
	function sub(a, b) {
		return a - b; 
	}
	function mul(a, b) {
		return a * b;
	}
	function div(a, b) {
		return a / b;
	}
	function mod(a, b) {
		return a % b;
	}

	function neg(a) {
		return -a;
	}

	function random(a) {
		return Math.random() * (a || 1);
	}
	function fac(a) { //a!
		a = Math.floor(a);
		var b = a;
		while (a > 1) {
			b = b * (--a);
		}
		return b;
	}

	// TODO: use hypot that doesn't overflow
	function pyt(a, b) {
		return Math.sqrt(a * a + b * b);
	}

	function Parser() {
		this.success = false;
		this.errormsg = "";
		this.expression = "";

		this.pos = 0;

		this.tokennumber = 0;
		this.tokenprio = 0;
		this.tokenindex = 0;
		this.tmpprio = 0;

		this.funcs1 = {
			"sin": Math.sin,
			"cos": Math.cos,
			"tan": Math.tan,
			"asin": Math.asin,
			"acos": Math.acos,
			"atan": Math.atan,
			"sqrt": Math.sqrt,
			"log": Math.log,
			"abs": Math.abs,
			"ceil": Math.ceil,
			"floor": Math.floor,
			"round": Math.round,
			"random": random,
			"fac": fac,
			"-": neg,
			"exp": Math.exp
		};

		this.funcs2 = {
			"min": Math.min,
			"max": Math.max,
			"pyt": pyt,
			"+": add,
			"-": sub,
			"*": mul,
			"/": div,
			"%": mod,
			"pow": Math.pow,
			"atan2": Math.atan2
		};

		this.consts = {
			"E": Math.E,
			"PI": Math.PI
		};
	}

	Parser.evaluate = function (expr, variables) {
		return new Parser().parse(expr).evaluate(variables);
	};

	Parser.Expression = Expression;

	Parser.values = {
		sin: Math.sin,
		cos: Math.cos,
		tan: Math.tan,
		asin: Math.asin,
		acos: Math.acos,
		atan: Math.atan,
		sqrt: Math.sqrt,
		log: Math.log,
		abs: Math.abs,
		ceil: Math.ceil,
		floor: Math.floor,
		round: Math.round,
		random: random,
		fac: fac,
		exp: Math.exp,
		min: Math.min,
		max: Math.max,
		pyt: pyt,
		pow: Math.pow,
		atan2: Math.atan2,
		E: Math.E,
		PI: Math.PI
	};

	var PRIMARY  = 1 << 0;
	var OPERATOR = 1 << 1;
	var FUNCTION = 1 << 2;
	var LPAREN   = 1 << 3;
	var RPAREN   = 1 << 4;
	var COMMA    = 1 << 5;
	var SIGN     = 1 << 6;

	Parser.prototype = {
		parse: function (expr) {
			this.errormsg = "";
			this.success = true;
			var operstack = [];
			var tokenstack = [];
			this.tmpprio = 0;
			var expected = (PRIMARY | LPAREN | FUNCTION | SIGN);
			var noperators = 0;
			this.expression = expr;
			this.pos = 0;

			while (this.pos < this.expression.length) {
				if (this.isOperator()) {
					if (this.isSign() && (expected & SIGN)) {
						if (this.isNegativeSign()) {
							this.tokenprio = 4;
							this.tokenindex = "-";
							noperators++;
							this.addfunc(tokenstack, operstack, TFUNC1);
						}
						expected = (PRIMARY | LPAREN | FUNCTION | SIGN);
					}
					else if (this.isComment()) {

					}
					else {
						if ((expected & OPERATOR) === 0) {
							this.error_parsing(this.pos, "unexpected operator");
						}
						noperators += 2;
						this.addfunc(tokenstack, operstack, TFUNC2);
						expected = (PRIMARY | LPAREN | FUNCTION | SIGN);
					}
				}
				else if (this.isNumber()) {
					if ((expected & PRIMARY) === 0) {
						this.error_parsing(this.pos, "unexpected number");
					}
					var token = new Token(TNUMBER, 0, 0, this.tokennumber);
					tokenstack.push(token);
					expected = (OPERATOR | RPAREN | COMMA);
				}
				else if (this.isLeftParenth()) {
					if ((expected & LPAREN) === 0) {
						this.error_parsing(this.pos, "unexpected \"(\"");
					}
					expected = (PRIMARY | LPAREN | FUNCTION | SIGN);
				}
				else if (this.isRightParenth()) {
					if ((expected & RPAREN) === 0) {
						this.error_parsing(this.pos, "unexpected \")\"");
					}
					expected = (OPERATOR | RPAREN | COMMA);
				}
				else if (this.isComma()) {
					if ((expected & COMMA) === 0) {
						this.error_parsing(this.pos, "unexpected \",\"");
					}
					this.addfunc(tokenstack, operstack, TMARKER);
					noperators++;
					expected = (PRIMARY | LPAREN | FUNCTION | SIGN);
				}
				else if (this.isConst()) {
					if ((expected & PRIMARY) === 0) {
						this.error_parsing(this.pos, "unexpected constant");
					}
					var consttoken = new Token(TNUMBER, 0, 0, this.tokennumber);
					tokenstack.push(consttoken);
					expected = (OPERATOR | RPAREN | COMMA);
				}
				else if (this.isFunc2()) {
					if ((expected & FUNCTION) === 0) {
						this.error_parsing(this.pos, "unexpected function");
					}
					this.addfunc(tokenstack, operstack, TFUNC2);
					noperators += 2;
					expected = (LPAREN);
				}
				else if (this.isFunc1()) {
					if ((expected & FUNCTION) === 0) {
						this.error_parsing(this.pos, "unexpected function");
					}
					this.addfunc(tokenstack, operstack, TFUNC1);
					noperators++;
					expected = (LPAREN);
				}
				else if (this.isVar()) {
					if ((expected & PRIMARY) === 0) {
						this.error_parsing(this.pos, "unexpected variable");
					}
					var vartoken = new Token(TVAR, this.tokenindex, 0, 0);
					tokenstack.push(vartoken);
					expected = (OPERATOR | RPAREN | COMMA);
				}
				else if (this.isWhite()) {
				}
				else {
					if (this.errormsg === "") {
						this.error_parsing(this.pos, "unknown character");
					}
					else {
						this.error_parsing(this.pos, this.errormsg);
					}
				}
			}
			if (this.tmpprio < 0 || this.tmpprio >= 10) {
				this.error_parsing(this.pos, "unmatched \"()\"");
			}
			while (operstack.length > 0) {
				var tmp = operstack.pop();
				tokenstack.push(tmp);
			}
			if (noperators + 1 !== tokenstack.length) {
				this.error_parsing(this.pos, "parity");
			}

			return new Expression(tokenstack, object(this.funcs1), object(this.funcs2));
		},

		evaluate: function (expr, variables) {
			return this.parse(expr).evaluate(variables);
		},

		error_parsing: function (column, msg) {
			this.success = false;
			this.errormsg = "parse error [column " + (column) + "]: " + msg;
			throw new Error(this.errormsg);
		},

//\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\

		addfunc: function (tokenstack, operstack, type_) {
			var operator = new Token(type_, this.tokenindex, this.tokenprio + this.tmpprio, 0);
			while (operstack.length > 0) {
				if (operator.prio_ <= operstack[operstack.length - 1].prio_) {
					tokenstack.push(operstack.pop());
				}
				else {
					break;
				}
			}
			operstack.push(operator);
		},

		isNumber: function () {
			var r = false;
			var str = "";
			while (this.pos < this.expression.length) {
				var code = this.expression.charCodeAt(this.pos);
				if ((code >= 48 && code <= 57) || code === 46) {
					str += this.expression.charAt(this.pos);
					this.pos++;
					this.tokennumber = parseFloat(str);
					r = true;
				}
				else {
					break;
				}
			}
			return r;
		},

		isConst: function () {
			var str;
			for (var i in this.consts) {
				if (true) {
					var L = i.length;
					str = this.expression.substr(this.pos, L);
					if (i === str) {
						this.tokennumber = this.consts[i];
						this.pos += L;
						return true;
					}
				}
			}
			return false;
		},

		isOperator: function () {
			var code = this.expression.charCodeAt(this.pos);
			if (code === 43) { // +
				this.tokenprio = 0;
				this.tokenindex = "+";
			}
			else if (code === 45) { // -
				this.tokenprio = 0;
				this.tokenindex = "-";
			}
			else if (code === 42) { // *
				this.tokenprio = 1;
				this.tokenindex = "*";
			}
			else if (code === 47) { // /
				this.tokenprio = 2;
				this.tokenindex = "/";
			}
			else if (code === 37) { // %
				this.tokenprio = 2;
				this.tokenindex = "%";
			}
			else if (code === 94) { // ^
				this.tokenprio = 3;
				this.tokenindex = "pow";
			}
			else {
				return false;
			}
			this.pos++;
			return true;
		},

		isSign: function () {
			var code = this.expression.charCodeAt(this.pos - 1);
			if (code === 45 || code === 43) { // -
				return true;
			}
			return false;
		},

		isPositiveSign: function () {
			var code = this.expression.charCodeAt(this.pos - 1);
			if (code === 43) { // -
				return true;
			}
			return false;
		},

		isNegativeSign: function () {
			var code = this.expression.charCodeAt(this.pos - 1);
			if (code === 45) { // -
				return true;
			}
			return false;
		},

		isLeftParenth: function () {
			var code = this.expression.charCodeAt(this.pos);
			if (code === 40) { // (
				this.pos++;
				this.tmpprio += 10;
				return true;
			}
			return false;
		},

		isRightParenth: function () {
			var code = this.expression.charCodeAt(this.pos);
			if (code === 41) { // )
				this.pos++;
				this.tmpprio -= 10;
				return true;
			}
			return false;
		},

		isComma: function () {
			var code = this.expression.charCodeAt(this.pos);
			if (code === 44) { // ,
				this.pos++;
				this.tokenprio = -1;
				this.tokenindex = -1;
				return true;
			}
			return false;
		},

		isWhite: function () {
			var code = this.expression.charCodeAt(this.pos);
			if (code === 32 || code === 9 || code === 10 || code === 13) {
				this.pos++;
				return true;
			}
			return false;
		},

		isFunc1: function () {
			var str = "";
			for (var i = this.pos; i < this.expression.length; i++) {
				var c = this.expression.charAt(i);
				if (c.toUpperCase() === c.toLowerCase()) {
					if (i === this.pos || c < '0' || c > '9') {
						break;
					}
				}
				str += c;
			}
			if (str.length > 0 && (str in this.funcs1)) {
				this.tokenindex = str;
				this.tokenprio = 5;
				this.pos += str.length;
				return true;
			}
			return false;
		},

		isFunc2: function () {
			var str = "";
			for (var i = this.pos; i < this.expression.length; i++) {
				var c = this.expression.charAt(i);
				if (c.toUpperCase() === c.toLowerCase()) {
					if (i === this.pos || c < '0' || c > '9') {
						break;
					}
				}
				str += c;
			}
			if (str.length > 0 && (str in this.funcs2)) {
				this.tokenindex = str;
				this.tokenprio = 5;
				this.pos += str.length;
				return true;
			}
			return false;
		},

		isVar: function () {
			var str = "";
			for (var i = this.pos; i < this.expression.length; i++) {
				var c = this.expression.charAt(i);
				if (c.toUpperCase() === c.toLowerCase()) {
					if (i === this.pos || c < '0' || c > '9') {
						break;
					}
				}
				str += c;
			}
			if (str.length > 0) {
				this.tokenindex = str;
				this.tokenprio = 5;
				this.pos += str.length;
				return true;
			}
			return false;
		},

		isComment: function () {
			var code = this.expression.charCodeAt(this.pos - 1);
			if (code === 47 && this.expression.charCodeAt(this.pos) === 42) {
				this.pos = this.expression.indexOf("*/", this.pos) + 2;
				if (this.pos === 1) {
					this.pos = this.expression.length;
				}
				return true;
			}
			return false;
		}
	};

	return Parser;
}();

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
 , getQobj: function(qtext,doescape) {
     var qobj = { display:'', options:[] , fasit:[]};
     try {
         qobj = JSON.parse(qtext);
     } catch(err) {
     }
     if (qobj == undefined) {
        qobj = { display:'', options:[] , fasit:[]};
     }
     if (doescape) {
       qobj.display = escape(qobj.display);
     }
     return qobj;
   }
  , sympy:function(text) {
    var intro = 'from sympy import *\n';
    fs.writeFile("/tmp/symp", intro+text, function (err) {
       if (err) { res.send(''); throw err; }
         var child = exec("/usr/bin/python /tmp/symp", function(error,stdout,stderr) {
            console.log(stdout);
            console.log(stderr);
            fs.unlink('/tmp/symp');
         });
    });
  }
 , macro:function(text,userid,instance) {
     var symb = {};
     qz.sympy("print 'hei'");
     var cha = 'abcdefghijklmnopqrstuvwxyz';
     var idx = 0;
     var parser = new Parser();
     var expr = 'sin(x)+2*x+2*a';
     var ff;
     try {
       var f = parser.parse(expr).simplify();
     } catch(err) {
       // the expression didnt compile
       expr = '';
     }
     if (expr) {
       expr = f.simplify({}).toString();
       eval('( ff = function(x) { with (symb) {return ('+expr+') } } ) ');
     }
     symb.a = 12;
     console.log(ff(3));


     text = text.replace(/\${irand\(([0-9]+)\)}/g,function(m,val) {
	     var num = Math.floor(1+Math.random()*+val);
	     var c = cha.charAt(idx);
	     symb[c] = num;
	     idx++;
	     return num;
       });
     text = text.replace(/\${eval\((.+?)\)}/g,function(m,exp) {
	     var exp = exp.replace(/\$([a-z])/g,function(m,ch) {
	       return symb[ch] || 0;
             });
	     console.log(exp);
	     try {
	       var val = eval('('+exp+')');
	     } catch(err) {
	       var val = 0;
	     }
	     var c = cha.charAt(idx);
	     symb[c] = val;
	     idx++;
	     return val;
       });
     text = text.replace(/\${([a-z])}/g,function(m,ch) {
	     return symb[ch] || 0;
       });
     return text;
   }  
 , generateParams:function(question,userid,instance) {
     var q = qz.question[question.id];  // get from cache
     //console.log("generATE params",question,instance,q,qobj);
     var qtxt = qz.macro(q.qtext, userid,instance);
     var qobj = qz.getQobj(qtxt,true);
     switch(question.qtype) {
       case 'multiple':
	 if (qobj.options && qobj.options.length) {
           qobj.optorder = qz.perturbe(qobj.options.length);
           //qobj.fasit = qz.reorder(qobj.fasit,qobj.optorder);
           qobj.fasit = '';   // don't return fasit
           qobj.options = qz.reorder(qobj.options,qobj.optorder);
	 }
         break;
       case 'info':
         break;
       default:
         break;
     }
     //console.log("generATE params qobj",qobj);
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
           var qobj = qz.getQobj(qu.qtext,false);
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

  , grade: function(aquiz,aquest,useranswer,param) {
           // takes a question + useranswer + param and returns a grade
           // param is stored in db, it contains parameters
           // that are needed for displaying and grading the response
           // the question from db may be mangled (reordered etc) so
           // we need info about how its mangled or how dynamic content
           // has been generated 
           var qobj = qz.getQobj(aquest.qtext);
           var optorder = param.optorder;
           console.log(param,qobj,optorder);
           var options = param.options;
           var fasit = qz.reorder(qobj.fasit,optorder);
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
           return qgrade;
  }
}

module.exports.qz = qz;
