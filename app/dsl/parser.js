const parser = {};

parser.parse = function(text) {
	const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);

	const tables = [];
	let currentTable = null;

	for (let line of lines) {
	if (line.startsWith("Table")) { //testa se é Table
		const name = line.split(" ")[1].replace("{", "");
		currentTable = { name, position: { x: 50, y: 50 }, columns: [] };
	} else if (line.startsWith("}")) {
		tables.push(currentTable);
		currentTable = null;
	} else if (currentTable) {
		const parts = line.split(" ");
		const colName = parts[0];
		const pk = line.includes("[pk]");
		currentTable.columns.push({ name: colName, PK: pk });
	}
	}

	return tables;
}

export default parser;
