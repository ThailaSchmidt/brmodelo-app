export function reverseToDSL(model, codeEditor) {

    // mapeia constraints de colunas para strings da DSL
    function cToString(constraint, col) {
        if (constraint.type === "fk") {
            return constraint.ref ? `fk -> ${constraint.ref}` : "fk";
        }
        switch(constraint.type) {
            case "pk": return "pk";
            case "unique": return "unique";
            case "not_null": return "not null";
            case "auto_increment": return "auto increment";
            case "default": return "default " + constraint.value;
            case "check": return "check " + constraint.value;
            default: return "";
        }
    }

    // converte AST de colunas em código
    function generateTableCode(table) {
		const attrs = table.columns.map(a => {
			// força o tipo a minúsculas
			const type = a.type ? a.type.toLowerCase() : "";

			// remove ":pk" ":fk" do nome
			const cleanName = a.name.replace(/:.*/g, "");

			const cons = (a.constraints || []).map(c => cToString(c, a)).join(", ");
			return `  ${cleanName} ${type}${cons ? " [" + cons + "]" : ""};`;
		}).join("\n");
		return `Table ${table.name} {\n${attrs} \n}`;
	}

    function generateRelationCode(rel) {
		// remove ":pk" ":fk" do nome
		const fk = rel.fkColumn.replace(/:.*/g, "");
    	const pk = rel.pkColumn.replace(/:.*/g, "");
		const [card1, card2] = rel.cardinality;
		return `Relation ${rel.table1}(${fk}) (${card1}, ${card2}) ${rel.table2}(${pk});`;
	}

    const dslAst = [];
    model.keys().forEach(key => {
        const table = model.get(key);
        dslAst.push({
            type: "table",
            name: table.name,
            columns: table.columns.map(col => ({
                name: col.name,
                type: col.type,
                constraints: colConstraints(col)
            }))
        });
    });

	const relations = [];
    model.keys().forEach(key => {
		const table = model.get(key);
		table.columns.forEach(col => {
			const constraints = colConstraints(col);

			constraints.forEach(constraint => {
				if (constraint.type === "fk" && constraint.ref) {
					const refTable = model.get(col.tableOrigin?.idOrigin);
    				const pkCol = refTable?.columns.find(c => c.PK)?.name || "id";
					const cardinality = constraint.cardinality || col.cardinality || ["1:1", "0:N"];
					const [leftCard, rightCard] = cardinality; // origem, destino

					relations.push({
						type: "relation",
						table1: table.name,
						fkColumn: col.name,
						table2: constraint.ref,
						pkColumn: pkCol,
						cardinality: [leftCard, rightCard]
					});
				}
			});
		});
	});

	relations.forEach(rel => dslAst.push(rel));


	function colConstraints(col) {
        const arr = [];
        if (col.PK) arr.push({ type: "pk" });
        if (col.FK) {
			let refName = null;
			if (col.tableOrigin && col.tableOrigin.idOrigin) {
				refName = model.get(col.tableOrigin.idOrigin)?.name || null;
			}
			if (refName) {
				arr.push({ type: "fk", ref: refName });
			}
		}
        if (col.UNIQUE) arr.push({ type: "unique" });
        if (col.NOT_NULL) arr.push({ type: "not_null" });
        if (col.AUTO_INCREMENT) arr.push({ type: "auto_increment" });
        if (col.defaultValue) arr.push({ type: "default", value: col.defaultValue });
        if (col.checkConstraint) arr.push({ type: "check", value: col.checkConstraint.value });
        return arr;
    }

    // AST em código
    const dslCode = dslAst.map(node => {
        if(node.type === "table") return generateTableCode(node);
        if(node.type === "relation") return generateRelationCode(node);
        return "";
    }).join("\n\n");


    // atualiza o codemirror
	codeEditor.setValue(dslCode);
}
