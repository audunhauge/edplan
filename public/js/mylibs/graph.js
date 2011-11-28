Graph = (function() {
	var parser = new Parser();
	function Graph(canvas, width, height, offsetX, offsetY, settings) {
		this.canvas = canvas;
		this.offsetX = offsetX || 0;
		this.offsetY = offsetY || 0;
		this.width = width || (canvas.width - this.offsetX);
		this.height = height || (canvas.height - this.offsetY);

		// XXX: Changes to Graph.defaultSettings will affect existing Graph objects. Is that the Right Thing?
		this.settings = extend(object(Graph.defaultSettings), settings || {});

		this.functions = [];
		this.constants = {};

		this.commandCallback = null;
		this.redrawCallback = null
	}

	Graph.defaultSettings = {
		showAxes: true,
		showGrid: true,
		xGridSize: 1,
		yGridSize: 1,
		minX: -10,
		maxX: 10,
		minY: -10,
		maxY: 10,
		minT: 0,
		maxT: 2 * Math.PI,
		minParam: 0,
		maxParam: 2 * Math.PI,
		colors: [ "red", "blue", "green", "orange", "purple", "gray", "pink", "lightblue", "limegreen"],
	};

	function PairExpression(expr0, expr1) {
		this.expr0 = expr0;
		this.expr1 = expr1;
		this.param = expr0.param || expr1.param;
		this.to = expr0.to || expr1.to;
	}
	PairExpression.prototype = {
		simplify: function(vars) {
			var spe = PairExpression(this.expr0.simplify(vars), this.expr1.simplify(vars));
			spe.param = this.expr0.param;
			spe.to = this.expr0.to;
		},
		evaluate: function(vars) {
			return [this.expr0.evaluate(vars), this.expr1.evaluate(vars)];
		},
		toString: function() {
			return this.expr0 + "; " + this.expr1;
		},
		substitute: function(variable, expr) {
			var spe = PairExpression(this.expr0.substitute(variable, expr), this.expr1.substitute(variable, expr));
			spe.param = this.expr0.param;
			spe.to = this.expr0.to;
		},
		toJSFunction: function(param, variables) {
			var xf = this.expr0.toJSFunction(param, variables);
			var yf = this.expr1.toJSFunction(param, variables);
			return function(t) {
				return [xf(t), yf(t)];
			};
		},
	}

	Graph.derivative = function(f) {
		if (f.to && f.to == "xy") {
			var dt = 0.001;
			var p00 = f.expr0;
			var p01 = f.expr1;
			var p10 = f.expr0.substitute("t", parser.parse("t+" + dt));
			var p11 = f.expr1.substitute("t", parser.parse("t+" + dt));

			var d = new PairExpression(
				p00,
				parser.parse("((" + p11 + ") - (" + p01 + ")) / ((" + p10 + ") - (" + p00 + "))").simplify()
			);
		}
		else {
			var dx = 0.001;
			var p1 = f.substitute(f.param, parser.parse(f.param + "+" + dx));
			var d = parser.parse("((" + p1 + ") - (" + f + ")) / " + dx).simplify();
		}
		d.param = f.param;
		d.to = f.to;
		return d;
	};

	function setupContext(graph) {
		var settings = graph.settings;
		var ctx = graph.canvas.getContext("2d");
		ctx.save();

		var scalex = graph.scaleX;
		var scaley = graph.scaleY;
		var offsetX = graph.offsetX;
		var offsetY = graph.offsetY;

		ctx.beginPath();
			ctx.moveTo(offsetX                  , offsetY);
			ctx.lineTo(offsetX + graph.width + 1, offsetY);
			ctx.lineTo(offsetX + graph.width + 1, offsetY + graph.height + 1);
			ctx.lineTo(offsetX                  , offsetY + graph.height + 1);
			ctx.lineTo(offsetX                  , offsetY);
		//ctx.stroke();
		ctx.clip();

		ctx.translate(
			offsetX - settings.minX * scalex,
			graph.height + offsetY + settings.minY * scaley
		);
		ctx.scale(scalex, -scaley);

		ctx.lineWidth = 1 / scalex;

		return ctx;
	}

	function round(x) {
		return Math.round(x * 4096) / 4096;
	}

	function drawGrid(graph) {
		var ctx = setupContext(graph);
		var minX = graph.settings.minX;
		var minY = graph.settings.minY;
		var maxX = graph.settings.maxX;
		var maxY = graph.settings.maxY;
		var xstep = round(graph.settings.xGridSize);
		var ystep = round(graph.settings.yGridSize);

		try {
			if (graph.settings.showGrid) {
				ctx.strokeStyle = "lightgray";
				ctx.lineWidth = 1 / graph.scaleY;
				for (var i = 0; i <= maxY; i += ystep) {
					ctx.beginPath();
						ctx.moveTo(minX, i);
						ctx.lineTo(maxX, i);
					ctx.stroke();
				}
				for (var i = -ystep; i >= minY; i -= ystep) {
					ctx.beginPath();
						ctx.moveTo(minX, i);
						ctx.lineTo(maxX, i);
					ctx.stroke();
				}

				ctx.lineWidth = 1 / graph.scaleX;
				for (var i = 0; i <= maxX; i += xstep) {
					ctx.beginPath();
						ctx.moveTo(i, minY);
						ctx.lineTo(i, maxY);
					ctx.stroke();
				}
				for (var i = -xstep; i >= minX; i -= xstep) {
					ctx.beginPath();
						ctx.moveTo(i, minY);
						ctx.lineTo(i, maxY);
					ctx.stroke();
				}
			}

			if (graph.settings.showAxes) {
				ctx.strokeStyle = "black";

				ctx.lineWidth = 2 / graph.scaleY;
				ctx.beginPath();
					ctx.moveTo(minX, 0);
					ctx.lineTo(maxX, 0);
				ctx.stroke();

				ctx.lineWidth = 2 / graph.scaleX;
				ctx.beginPath();
					ctx.moveTo(0, minY);
					ctx.lineTo(0, maxY);
				ctx.stroke();
			}
		}
		finally {
			ctx.restore();
		}
	}

	Graph.prototype = {
		get scaleX() {
			var userWidth = this.settings.maxX - this.settings.minX;
			return this.width / userWidth;
		},

		get scaleY() {
			var userHeight = this.settings.maxY - this.settings.minY;
			return this.height / userHeight;
		},

		zoom: function(sx, sy, x, y) {
			var settings = this.settings;
			if (arguments.length == 2) {
				x = settings.minX + (settings.maxX - settings.minX) / 2;
				y = settings.minY + (settings.maxY - settings.minY) / 2;
			}

			function scale(point, scale, reference) {
				var d = (point - reference) * scale;
				return reference + d;
			}

			settings.minX = scale(settings.minX, sx, x);
			settings.maxX = scale(settings.maxX, sx, x);
			settings.minY = scale(settings.minY, sy, y);
			settings.maxY = scale(settings.maxY, sy, y);
		},

		setCenter: function(x, y) {
			var settings = this.settings;
			var scalex = this.scaleX;
			var scaley = this.scaleY;
			var offsetX = this.offsetX;
			var offsetY = this.offsetY;

			var width = settings.maxX - settings.minX;
			var height = settings.maxY - settings.minY;

			settings.minX = x - width / 2;
			settings.maxX = x + width / 2;
			settings.minY = y - height / 2;
			settings.maxY = y + height / 2;
		},

		getPoint: function(devx, devy) {
			var settings = this.settings;
			var scalex = this.scaleX;
			var scaley = this.scaleY;
			var offsetX = this.offsetX;
			var offsetY = this.offsetY;

			var x = (devx /  scalex) - ((              offsetX - settings.minX * scalex) / scalex);
			var y = (devy / -scaley) + ((this.height + offsetY + settings.minY * scaley) / scaley);

			return { x:x, y:y };
		},

		plotFunction: function(f, color) {
			var settings = this.settings;
			var ctx = setupContext(this);

			try {
				var minX = settings.minX;
				var minY = settings.minY;
				var maxX = settings.maxX;
				var maxY = settings.maxY;
				var xstep = 1 / this.scaleX;
				var ystep = 1 / this.scaleY;

				var txstep = round(xstep);
				var tystep = round(ystep);
				if (txstep) xstep = txstep;
				if (txstep) ystep = tystep;
				var first = true;

				var param = f.param || "x";
				var to = f.to || "y";

				f = f.toJSFunction(param, this.constants);
				f.param = param;
				f.to = to;

				function plotPoint(x, y) {
					if (isFinite(y) && isFinite(x)) {
						if (first) {
							ctx.moveTo(x, y);
							first = false;
						}
						else {
							ctx.lineTo(x, y);
						}
					}
					else {
						if (y > maxY || y < minY || x > maxX || x < minX) {
							first = true;
						}
					}
				}

				ctx.strokeStyle = color || "black";
				ctx.beginPath();

				if (param == "x") {
					for (var x = minX; x <= maxX; (x < 0 && x + xstep > 0) ? x = 0 : x += xstep) {
						var y = f(x);
						plotPoint(x, y);
					}
					if (x - xstep < maxX) {
						var y = f(maxX);
						plotPoint(maxX, y);
					}
				}
				else if (param == "y") {
					for (var y = minY; y <= maxY; (y < 0 && y + ystep > 0) ? y = 0 : y += ystep) {
						var x = f(y);
						plotPoint(x, y);
					}
					if (y - ystep < maxY) {
						var x = f(maxY);
						plotPoint(x, maxY);
					}
				}
				else if (param == "t" && f.to == "r") {
					var minT = settings.minT;
					var maxT = settings.maxT;
					var tstep = Math.min(xstep, ystep);
					if ("minT" in f) minT = f.minT;
					if ("maxT" in f) maxT = f.maxT;

					for (var t = minT; t <= maxT; (t < 0 && t + tstep > 0) ? t = 0 : t += tstep) {
						var r = f(t);
						plotPoint(r * Math.cos(t), r * Math.sin(t));
					}
					if (t - tstep < maxT) {
						var r = f(maxT);
						plotPoint(r * Math.cos(maxT), r * Math.sin(maxT));
					}
				}
				else if (param == "t" && f.to == "xy") {
					var minT = settings.minParam;
					var maxT = settings.maxParam;
					var tstep = Math.min(xstep, ystep);
					if ("minT" in f) minT = f.minT;
					if ("maxT" in f) maxT = f.maxT;

					for (var t = minT; t <= maxT; (t < 0 && t + tstep > 0) ? t = 0 : t += tstep) {
						var xy = f(t);
						var x = xy[0];
						var y = xy[1];
						plotPoint(x, y);
					}
					if (t - tstep < maxT) {
						var xy = f(t);
						var x = xy[0];
						var y = xy[1];
						plotPoint(x, y);
					}
				}

				ctx.stroke();
			}
			finally {
				ctx.restore();
			}
		},

		addFunction: function(f, c) {
			var colors = this.settings.colors;
			this.functions.push({
				fn: f,
				color: c || colors[this.functions.length % colors.length]
			});
		},

		removeFunction: function(index) {
			this.functions.splice(index, 1);
		},

		redraw: function() {
			var ctx = this.canvas.getContext("2d");
			ctx.clearRect(this.offsetX, this.offsetY, this.width, this.height);
			drawGrid(this);

			var functions = this.functions;
			var errors = [];
			for (var i = 0; i < functions.length; i++) {
				var f = functions[i];
				try {
					this.plotFunction(f.fn, f.color);
				}
				catch (e) {
					errors.push("Error in function " + i + ": " + e.message);
				}
			}

			if (this.redrawCallback) {
				this.redrawCallback(ctx);
			}

			return errors;
		},

		evalFunction: function(f) {
			return f.evaluate(this.constants);
		},

		evalExpression: function(expr) {
			try {
				var f = this.makeFunction(expr);
			}
			catch (e) {
				throw new Error("Syntax error");
			}

			return this.evalFunction(f);
		},

		processCommand: function(line) {
			line = line.trim();
			if (line == "") return "";

			var cmd = line.split(/\s/);
			var command = cmd.shift();
			var args = (cmd.join(" ") || "").trim();
			var status = "";

			switch (command) {
			case "delete":
				var n = parseInt(args);
				if (!isNaN(n)) {
					this.removeFunction(n);
				}
				else {
					status = "Invalid delete";
				}
				break;
			case "let":
				var expr = args.split(/=/);
				if (expr.length == 2) {
					var varName = expr[0].trim();
					if (/^[a-zA-Z][a-zA-Z]*$/.test(varName) && varName != "x" && varName != "y" && varName != "t") {
						try {
							try {
								var f = this.makeFunction(expr[1]);
								try {
									var n = f.evaluate(this.constants);
									this.constants[varName] = n;
								}
								catch (e) { status = e.message; }
							}
							catch (e) { status = "Sytax error"; }
						}
						catch (e) { status = "Invalid value in assignment"; }
					}
					else { status = "Invalid constant"; }
				}
				else {
					status = "Invalid assignment";
				}
				break;
			case "clear":
				var varName = args;
				if (/^[a-zA-Z][a-zA-Z]*$/.test(varName) && varName != "x" && varName != "y" && varName != "t") {
					delete this.constants[varName];
				}
				else {
					status = "Invalid constant";
				}
				break;
			case "plot":
				try {
					var f = this.makeFunction(args);
					this.addFunction(f);
				}
				catch (e) {
					status = e.message;
				}
				break;
			case "redraw":
				status = this.redraw().join("\n");
				break;
			default:
				if (this.commandCallback) {
					var info = {status: "", fullCommand: line};
					if (this.commandCallback(command, args, info)) {
						status = info.status;
					}
					else {
						status = "Unrecognized command";
					}
				}
				else {
					status = "Unrecognized command";
				}
				break;
			}

			return status;
		},

		makeFunction: function(expr) {
			expr = expr.trim();

			if (expr.startsWith("d(")) {
				if (!expr.endsWith(")")) {
					throw new Error("Syntax error: Missing ')'");
				}
				expr = expr.substring(2, expr.length - 1);

				return Graph.derivative(this.makeFunction(expr));
			}
			else {
				try {
					var param = "x";
					var range = "y";
					if (/^f\(x\)\s*=.*$/.test(expr) || /^y\s*=.*$/.test(expr)) {
						expr = expr.substring(expr.indexOf("=") + 1).trim();
					}
					else if (/^f\(y\)\s*=.*$/.test(expr) || /^x\s*=.*$/.test(expr)) {
						expr = expr.substring(expr.indexOf("=") + 1).trim();
						param = "y";
						range = "x";
					}
					else if (/^r\s*=.*$/.test(expr)) {
						expr = expr.substring(expr.indexOf("=") + 1).trim();
						param = "t";
						range = "r";
					}
					else if (/^x\s*,\s*y\s*=.*$/.test(expr) || /^\[.+,.+\]$/.test(expr)) {
						expr = expr.substring(expr.indexOf("=") + 1).trim();
						param = "t";
						range = "xy";
					}
					else if (expr.indexOf(";") != -1) {
						var exprs = expr.split(";");
						var expr0 = parser.parse(exprs[0]).simplify();
						var expr1 = parser.parse(exprs[1]).simplify();
						var f = new PairExpression(expr0, expr1);
						f.param = "t";
						f.to = "xy";
						return f;
					}

					var f = parser.parse(expr).simplify();
					f.param = param;
					f.to = range;
					return f;
				}
				catch (e) {
					throw new Error("Syntax error");
				}
			}
		}
	};

	return Graph;
})();


