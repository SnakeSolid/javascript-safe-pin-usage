define("pins", [], function() {
	return function(callback) {
		const pins = [
			{ pin: 1, position: { x: 13.0, y: 204.0, align: "left" }, name: "PB7/PB8" },
			{ pin: 2, position: { x: 13.0, y: 229.0, align: "left" }, name: "PB9/PC14-OSC32_IN" },
			{ pin: 3, position: { x: 13.0, y: 254.0, align: "left" }, name: "PC15-OSC32_OUT" },
			// { pin: 4, position: { x: 20.0, y: 20.0, align: "left" }, name: "VDD/VDDA" },
			// { pin: 5, position: { x: 40.0, y: 40.0, align: "left" }, name: "VSS/VSSA" },
			// { pin: 6, position: { x: 60.0, y: 60.0, align: "left" }, name: "NRST" },
			{ pin: 7, position: { x: 13.0, y: 280.0, align: "left" }, name: "PA0" },
			{ pin: 8, position: { x: 13.0, y: 305.0, align: "left" }, name: "PA1" },
			{ pin: 9, position: { x: 13.0, y: 330.0, align: "left" }, name: "PA2" },
			{ pin: 10, position: { x: 13.0, y: 355.0, align: "left" }, name: "PA3" },
			{ pin: 20, position: { x: 175.0, y: 127.0, align: "right" }, name: "PB3/PB4/PB5/PB6" },
			{ pin: 19, position: { x: 175.0, y: 152.0, align: "right" }, name: "PA15/PA14-BOOT0" },
			{ pin: 18, position: { x: 175.0, y: 178.0, align: "right" }, name: "PA13" },
			{ pin: 17, position: { x: 175.0, y: 203.0, align: "right" }, name: "PA12[PA10]" },
			{ pin: 16, position: { x: 175.0, y: 228.0, align: "right" }, name: "PA11[PA9]" },
			{ pin: 15, position: { x: 174.0, y: 254.0, align: "right" }, name: "PB0/PB1/PB2/PA8" },
			{ pin: 14, position: { x: 174.0, y: 279.0, align: "right" }, name: "PA7" },
			{ pin: 13, position: { x: 174.0, y: 304.0, align: "right" }, name: "PA6" },
			{ pin: 12, position: { x: 174.0, y: 330.0, align: "right" }, name: "PA5" },
			{ pin: 11, position: { x: 174.0, y: 355.0, align: "right" }, name: "PA4" },
		];

		callback(pins);
	};
});
