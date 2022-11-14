"use strict";

requirejs.config({
	baseUrl: "scripts",
	paths: {
		knockout: "https://cdnjs.cloudflare.com/ajax/libs/knockout/3.4.2/knockout-min",
	},
	waitSeconds: 10,
});

requirejs(["knockout", "pins", "functions", "colors"], function(ko, pins, functions, colors) {
	const canvas = document.getElementById("canvas");
	canvas.width = canvas.parentNode.clientWidth;
	canvas.height = canvas.parentNode.clientHeight;

	ko.bindingHandlers.pinMap = {
		init: function(element, valueAccessor, allBindings, _, bindingContext) {
			const value = ko.unwrap(valueAccessor());
			const image = new Image();
			image.addEventListener("load", () => value.ready(true), false);
			image.src = "images/stm32g030f6p6-board.png";

			ko.utils.domData.set(element, "image", image);
		},
		update: function(element, valueAccessor, allBindings, _, bindingContext) {
			const value = ko.unwrap(valueAccessor());

			if (!value.ready()) {
				return;
			}

			const image = ko.utils.domData.get(element, "image");
			const data = ko.dataFor(element);
			const context = canvas.getContext("2d");
			const centerX = canvas.width / 2.0;
			const centerY = canvas.height / 2.0;
			const imageWidth = image.width;
			const imageHeight = image.height;

			context.clearRect(0, 0, canvas.width, canvas.height);
			context.drawImage(image, centerX - imageWidth / 2.0, centerY - imageHeight / 2.0);

			for (const item of value.pins()) {
				const pin = item.pin;
				const name = item.name;
				const groups = item.groups;
				const selected = item.selected();
				const textAlign = item.position.align === "left" ? "start" : "end";
				const direction = item.position.align === "left" ? -1.0 : 1.0;
				let x = centerX - imageWidth / 2.0 + item.position.x;
				let y = centerY - imageHeight / 2.0 + item.position.y;

				context.fillStyle = "#ffffff";
				context.strokeStyle = "#000000";
				context.lineWidth = 2.0;
				context.beginPath();
				context.arc(x, y, 5.0, 0.0, 360.0);
				context.moveTo(x + direction * 5, y);
				context.lineTo(x + direction * 30, y);
				context.fill();
				context.stroke();

				context.font = "bold 16px sans";
				context.textAlign = textAlign;
				context.textBaseline = "middle";
				context.fillStyle = "#000000";
				context.fillText(pin, x - direction * 15, y);

				x += direction * 30;
				y += 0;

				if (selected) {
					const padding = 3.0;
					const name = item.functionNames();
					const metrics = context.measureText(name);
					const width = Math.max(50, metrics.width + 2 * padding);

					context.fillStyle = "#e0e0e0";
					context.strokeStyle = "#000000";
					context.lineWidth = 2.0;
					context.beginPath();
					context.moveTo(x + direction * width, y + 10);
					context.lineTo(x + direction * width, y - 10);
					context.lineTo(x - direction * 0, y - 10);
					context.lineTo(x - direction * 0, y + 10);
					context.lineTo(x + direction * width, y + 10);
					context.fill();
					context.stroke();

					context.font = "bold 16px sans";
					context.textAlign = "center";
					context.textBaseline = "middle";
					context.fillStyle = "#000000";
					context.fillText(name, x + (direction * width) / 2.0, y);
				} else {
					let isFirst = true;

					for (const group of groups) {
						if (isFirst) {
							isFirst = false;
						} else {
							context.fillStyle = "#ffffff";
							context.strokeStyle = "#000000";
							context.lineWidth = 2.0;
							context.beginPath();
							context.moveTo(x + direction * 0, y);
							context.lineTo(x + direction * 15, y);
							context.fill();
							context.stroke();

							x += direction * 15;
							y += 0;
						}

						const padding = 3.0;
						const name = group.name;
						const color = group.color;
						const metrics = context.measureText(name);
						const width = Math.max(50, metrics.width + 2 * padding);

						context.fillStyle = color;
						context.strokeStyle = "#444444";
						context.lineWidth = 2.0;
						context.beginPath();
						context.moveTo(x + direction * width, y + 10);
						context.lineTo(x + direction * width, y - 10);
						context.lineTo(x - direction * 0, y - 10);
						context.lineTo(x - direction * 0, y + 10);
						context.lineTo(x + direction * width, y + 10);
						context.fill();
						context.stroke();

						context.font = "bold 16px sans";
						context.textAlign = "center";
						context.textBaseline = "middle";
						context.fillStyle = "#000000";
						context.fillText(name, x + (direction * width) / 2.0, y);

						x += direction * width;
						y += 0;
					}
				}
			}
		},
	};

	function PinGroupsModel(name, color, functions) {
		const self = this;
		self.name = name;
		self.color = color;
		self.functions = functions;
		self.selected = ko.pureComputed(function() {
			return self.functions.some(f => f.selected());
		});
	}

	function PinModel(pin, position, name, groups) {
		const self = this;
		self.pin = pin;
		self.position = position;
		self.name = name;
		self.groups = groups;
		self.selected = ko.pureComputed(function() {
			return self.groups.some(f => f.selected());
		});
		self.functionNames = ko.pureComputed(function() {
			const result = [];

			for (const group of self.groups.filter(g => g.selected())) {
				for (const item of group.functions.filter(f => f.selected())) {
					if (self.pin in item.pins) {
						result.push(item.pins[self.pin]);
					}
				}
			}

			return result.join(" ");
		});
	}

	function FunctionModel(id, group, name, description, pins, callback) {
		const self = this;
		self.id = id;
		self.group = group;
		self.name = name;
		self.description = description;
		self.pins = pins;
		self.allowed = ko.observable(true);
		self.selected = ko.observable(false);
		self.selected.subscribe(callback);
	}

	function GroupModel(name, items) {
		const self = this;
		self.name = name;
		self.items = items;
		self.visible = ko.observable(true);
		self.show = function() {
			self.visible(true);
		};
		self.hide = function() {
			self.visible(false);
		};
	}

	function ViewModel() {
		const self = this;
		self.ready = ko.observable(false);
		self.functionTree = ko.observableArray([]);
		self.pinTree = ko.observable({});
		self.pins = [];
		self.functions = [];

		self.functionsInGroup = ko.computed(function() {
			return self.functionTree().filter(item => item.group === this);
		});

		self.updateFunctions = function() {
			const selectedPins = new Set();

			for (const group of self.functionTree()) {
				for (const item of group.items) {
					if (item.selected()) {
						const pins = Object.keys(item.pins);

						pins.forEach(pin => selectedPins.add(pin));
					}
				}
			}

			for (const group of self.functionTree()) {
				for (const item of group.items) {
					if (!item.selected()) {
						const pins = Object.keys(item.pins);
						const found = pins.some(pin => selectedPins.has(pin));

						item.allowed(!found);
					}
				}
			}
		};

		self.updateTrees = function() {
			const nameToGroup = {};
			const functionMap = {};
			const pinMap = {};

			for (let index = 0; index < self.functions.length; index += 1) {
				const row = self.functions[index];
				const groupName = row.group;
				const functionName = row.name;
				const data = new FunctionModel(
					index,
					groupName,
					functionName,
					row.description,
					row.pins,
					self.updateFunctions
				);

				if (groupName in functionMap) {
					functionMap[groupName].push(data);
				} else {
					functionMap[groupName] = [data];
				}

				for (const pin of Object.keys(row.pins)) {
					if (pin in pinMap) {
						pinMap[pin].push(data);
					} else {
						pinMap[pin] = [data];
					}
				}

				nameToGroup[functionName] = groupName;
			}

			const functionGroups = Array.from(new Set(self.functions.map(f => f.group)));
			functionGroups.sort();
			const functionTree = functionGroups.map(function(name) {
				return new GroupModel(name, functionMap[name]);
			});
			self.functionTree(functionTree);

			const groupColors = {};

			for (const index in functionGroups) {
				const name = functionGroups[index];

				groupColors[name] = colors(index);
			}

			const pinTree = self.pins.map(function(item) {
				const pin = item.pin;
				const position = item.position;
				const name = item.name;
				const functionMap = {};

				if (pin in pinMap) {
					for (const item of pinMap[pin]) {
						const functionName = item.name;

						if (functionName in functionMap) {
							functionMap[functionName].push(item);
						} else {
							functionMap[functionName] = [item];
						}
					}
				}

				const functionNames = Object.keys(functionMap);
				functionNames.sort();
				const groups = functionNames.map(
					name => new PinGroupsModel(name, groupColors[nameToGroup[name]], functionMap[name])
				);

				return new PinModel(pin, position, name, groups);
			});
			self.pinTree(pinTree);
		};

		pins(function(pins) {
			self.pins = pins;
			self.updateTrees();
		});

		functions(function(functions) {
			self.functions = functions;
			self.updateTrees();
		});
	}

	ko.applyBindings(new ViewModel());
});
