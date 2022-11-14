define("colors", [], function() {
	const COLORS = [
		"#ef9a9a",
		"#f48fb1",
		"#ce93d8",
		"#b39ddb",
		"#9fa8da",
		"#90caf9",
		"#81d4fa",
		"#80deea",
		"#80cbc4",
		"#a5d6a7",
		"#c5e1a5",
		"#e6ee9c",
		"#fff59d",
		"#ffe082",
		"#ffcc80",
		"#ffab91",
	];
	const INDEXES = [0, 8, 4, 12, 2, 10, 6, 14, 1, 9, 5, 13, 3, 11, 7, 15];

	return function(id) {
		const index = INDEXES[id % INDEXES.length];
		const color = COLORS[index];

		return color;
	};
});
