export default class SemanticInterpreter {
    constructor() {
        this.tables = [];
        this.relations = [];
    }

    execute(ast) {
        this.tables = [];
        this.relations = [];
        for (const node of ast) {
            switch (node.type) {
                case "table":
                    this._checkTable(node);
                    break;
                case "relation":
                    this._checkRelation(node);
                    break;
                default:
                    throw Error(`Unknown AST node type: ${node.type}`);
            }
        }

        return {
			tables: Array.isArray(this.tables) ? this.tables : [],
			relations: Array.isArray(this.relations) ? this.relations : []
		};
    }

    _checkTable(node) {
		if (this.tables.find(t => t.name === node.name)) {
			throw Error(`Table '${node.name}' is already defined`);
		}

		let cols = [];
		let hasPk = false;
		let hasFk = false;

		// Garante que node.attributes seja sempre array
		const attrs = Array.isArray(node.attributes) ? node.attributes : node.attributes ? [node.attributes] : [];
		for (const col of attrs) {
			// Garante que col.constraints seja sempre array
			const colConstraints = Array.isArray(col.constraints) ? col.constraints : col.constraints ? [col.constraints] : [];
			const colOptions = colConstraints.map(c => c.type);
			const fkConstraint = colConstraints.find(c => c.type === "fk");
			const fkRef = fkConstraint ? fkConstraint.ref : null;

			if (cols.find(c => c.name === col.name)) {
				throw Error(`Column '${col.name}' already exists in table '${node.name}'`);
			}

			if (colOptions.includes("pk")) {
				hasPk = true;
			}
			if (colOptions.includes("fk")) {
				hasFk = true;
			}

			const columnObj = {
				name: col.name,
				colType: col.type || "int",
				options: (col.constraints ?? []).map(c => c.value ? `${c.type} ${c.value}` : c.type),
				fkRef
			};

			this._checkColumn(columnObj);
			cols.push(columnObj);
		}

		this.tables.push({
			name: node.name,
			columns: cols,
			id: node.id || `${node.name}_id`,
			position: node.position || { x: 50, y: 50 }
		});
	}



    _checkColumn(col) {
		const validTypes = ["int", "varchar", "char", "float", "date"];
		if (!validTypes.includes(col.colType)) {
			throw Error(`Invalid type '${col.colType}' for column '${col.name}'`);
		}

		for (const opt of col.options) {
			if (opt.type === "default" && (opt.value === undefined || opt.value === null || opt.value === "")) {
				throw Error(`Default value missing for column '${col.name}'`);
			}
			if (opt.type === "check" && (opt.value === undefined || opt.value === null || opt.value === "")) {
				throw Error(`Check condition missing for column '${col.name}'`);
			}
		}
	}

	_checkRelation(node) {
		// Verifica se a relação já existe
		const exists = this.relations.find(r =>
			r.table1 === node.table1 &&
			r.table2 === node.table2 &&
			r.fkColumn === node.fkColumn &&
			r.pkColumn === node.pkColumn
		);

		const t1 = this.tables.find(t => t.name === node.table1);
		const t2 = this.tables.find(t => t.name === node.table2);

		if (!t1) throw Error(`Table '${node.table1}' is not defined`);
		if (!t2) throw Error(`Table '${node.table2}' is not defined`);

		// Verifica se as colunas existem
		const col1 = t1.columns.find(c => c.name === node.fkColumn);
		const col2 = t2.columns.find(c => c.name === node.pkColumn);

		if (!col1) throw Error(`Column '${node.fkColumn}' does not exist in table '${node.table1}'`);
		if (!col2) throw Error(`Column '${node.pkColumn}' does not exist in table '${node.table2}'`);
		if (col1) col1.fkRef = node.table2; // aqui seta o ref

		const validCards = ["0-0>", "0-1>", "1-0>", "1-1>", "<0-0", "<0-1", "<1-0", "<1-1", "1-1"];
		if (typeof node.cardinality !== "string" || !validCards.includes(node.cardinality)) {
			throw Error(`Invalid cardinality '${node.cardinality}' in relation`);
		}

		this.relations.push(node);
	}
}