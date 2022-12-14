"use strict";

requirejs.config({
	baseUrl: "scripts",
	paths: {
		vue: "https://cdnjs.cloudflare.com/ajax/libs/vue/3.2.45/vue.global",
	},
	shim: {
		vue: {
			exports: "Vue",
		},
	},
	waitSeconds: 10,
});

requirejs(["vue", "colors"], function(vue, colors) {
	const NAME_PADDING = 4.0;

	const canvas = document.getElementById("canvas");
	canvas.width = canvas.parentNode.clientWidth;
	canvas.height = canvas.parentNode.clientHeight;

	vue.createApp({
		mounted() {
			var canvas = document.getElementById("canvas");
			var context = canvas.getContext("2d");
			var image = new Image();
			image.addEventListener("load", () => this.updateCanvas());
			image.src = "/images/dummy.png";

			this.vueWidth = canvas.width;
			this.vueHeight = canvas.height;
			this.vueContext = context;
			this.vueImage = image;

			fetch("/data/boards.json")
				.then(result => result.json())
				.then(result => (this.boards = result));
		},

		data() {
			return {
				selectedBoard: null,
				boards: [],
				pins: [],
				groups: [],
			};
		},

		watch: {
			selectedBoard(newValue, oldValue) {
				const image = newValue.image;
				const pins = newValue.pins;
				const functions = newValue.functions;

				this.vueImage.src = image;

				Promise.all([
					fetch(pins).then(result => result.json()),
					fetch(functions).then(result => result.json()),
				]).then(values => this.updateData(values[0], values[1]));
			},

			groups: {
				handler(_newValue, _oldValue) {
					this.updateCanvas();
				},
				deep: true,
			},
		},

		methods: {
			showGroup(group) {
				group.expand = true;
			},

			hideGroup(group) {
				group.expand = false;
			},

			toggleFunction(item) {
				item.selected = !item.selected && item.enabled;

				const usesPins = new Set(
					this.groups
						.flatMap(row => row.alternateFunctions)
						.filter(row => row.selected)
						.flatMap(row => row.pins)
						.map(pin => pin.index)
				);

				for (const group of this.groups) {
					for (const alternateFunction of group.alternateFunctions) {
						if (alternateFunction.selected) {
							continue;
						}

						const isUsed = alternateFunction.pins.some(row => usesPins.has(row.index));

						alternateFunction.enabled = !isUsed;
					}
				}
			},

			isPinUsed(pin) {
				for (const alternateFunction of pin.alternateFunctions) {
					for (const item of alternateFunction.items) {
						if (item.selected) {
							return true;
						}
					}
				}

				return false;
			},

			functionName(pin) {
				for (const alternateFunction of pin.alternateFunctions) {
					for (const item of alternateFunction.items) {
						if (item.selected) {
							for (const functionPin of item.pins) {
								if (pin.index === functionPin.index) {
									return functionPin.function;
								}
							}

							return item.name;
						}
					}
				}

				return "";
			},

			updateData(pins, items) {
				const groupMap = {};
				const pinMap = {};
				const alternateFunctionNames = new Set();

				for (const pin of pins) {
					pinMap[pin.index] = {
						index: pin.index,
						description: pin.description,
						position: pin.position,
						alternateFunctions: [],
					};
				}

				for (const item of items) {
					const groupName = item.group;
					const alternateFunctionName = item.name;
					const itemRef = {
						group: item.group,
						name: item.name,
						description: item.description,
						pins: item.pins,
						selected: false,
						enabled: true,
					};

					if (groupName in groupMap) {
						groupMap[groupName].alternateFunctions.push(itemRef);
					} else {
						groupMap[groupName] = { name: groupName, expand: true, alternateFunctions: [itemRef] };
					}

					for (const pin of item.pins) {
						const index = pin.index;
						const description = pin.description;

						if (index in pinMap) {
							const alternateFunctions = pinMap[index].alternateFunctions;
							const alternateFunction = alternateFunctions.find(
								alternameFunction => alternameFunction.name === alternateFunctionName
							);

							if (alternateFunction) {
								alternateFunction.items.push(itemRef);
							} else {
								alternateFunctions.push({
									name: alternateFunctionName,
									color: "#eeeeee",
									items: [itemRef],
								});
							}
						}
					}

					alternateFunctionNames.add(alternateFunctionName);
				}

				const alternateFunctionList = Array.from(alternateFunctionNames);
				alternateFunctionList.sort();
				const groupColors = new Map(alternateFunctionList.map((name, index) => [name, colors(index)]));

				for (const pin of Object.values(pinMap)) {
					for (const alternateFunction of pin.alternateFunctions) {
						alternateFunction.color = groupColors.get(alternateFunction.name);
					}
				}

				this.pins = Object.values(pinMap);
				this.groups = Object.values(groupMap);
			},

			updateCanvas() {
				const image = this.vueImage;
				const context = this.vueContext;
				const centerX = this.vueWidth / 2.0;
				const centerY = this.vueHeight / 2.0;

				context.clearRect(0, 0, this.vueWidth, this.vueHeight);
				context.drawImage(image, centerX - image.width / 2, centerY - image.height / 2);

				if (this.selectedBoard) {
					context.font = "bold 18px sans";
					context.textAlign = "center";
					context.textBaseline = "bottom";
					context.fillStyle = "#000000";
					context.fillText(this.selectedBoard.description, centerX, centerY - image.height / 2 - 10);
				}

				for (const pin of this.pins) {
					let translate;

					switch (pin.position.align) {
						case "left":
							translate = -1.0;
							break;

						case "right":
							translate = 1.0;
							break;

						case "none":
						default:
							continue;
					}

					let x = pin.position.x + centerX - image.width / 2;
					let y = pin.position.y + centerY - image.height / 2;

					context.fillStyle = "#ffffff";
					context.strokeStyle = "#000000";
					context.lineWidth = 2.0;
					context.beginPath();
					context.moveTo(x + translate * 0, y);
					context.lineTo(x + translate * 15, y);
					context.fill();
					context.stroke();

					x += translate * 15.0;
					y += 0.0;

					if (this.isPinUsed(pin)) {
						const functionName = this.functionName(pin);

						context.font = "14px sans";

						const metrics = context.measureText(functionName);
						const textWidth = Math.max(50, metrics.width + 2.0 * NAME_PADDING);

						context.fillStyle = "#eeeeee";
						context.strokeStyle = "#000000";
						context.lineWidth = 2.0;
						context.beginPath();
						context.rect(x + ((translate - 1) * textWidth) / 2.0, y - 9.0, textWidth, 18.0);
						context.fill();
						context.stroke();

						context.fillStyle = "#000000";
						context.textAlign = "middle";
						context.textBaseline = "middle";
						context.beginPath();
						context.fillText(functionName, x + (translate * textWidth) / 2.0, y);
					} else {
						let isFirst = true;

						for (const alternateFunction of pin.alternateFunctions) {
							if (isFirst) {
								isFirst = false;
							} else {
								context.strokeStyle = "#000000";
								context.lineWidth = 2.0;
								context.beginPath();
								context.moveTo(x + translate * 0, y);
								context.lineTo(x + translate * 10, y);
								context.stroke();

								x += translate * 10.0;
								y += 0.0;
							}

							context.font = "14px sans";

							const metrics = context.measureText(alternateFunction.name);
							const textWidth = Math.max(50, metrics.width + 2.0 * NAME_PADDING);

							context.fillStyle = alternateFunction.color;
							context.strokeStyle = "#000000";
							context.lineWidth = 2.0;
							context.beginPath();
							context.rect(x + ((translate - 1) * textWidth) / 2.0, y - 9.0, textWidth, 18.0);
							context.fill();
							context.stroke();

							context.fillStyle = "#000000";
							context.textAlign = "middle";
							context.textBaseline = "middle";
							context.beginPath();
							context.fillText(alternateFunction.name, x + (translate * textWidth) / 2.0, y);

							x += translate * textWidth;
							y += 0.0;
						}
					}
				}
			},
		},
	}).mount("#app");
});
