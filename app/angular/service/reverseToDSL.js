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
		const card = rel.cardinality || "<1-0";
		return `Relation ${rel.table1}(${fk}) ${card} ${rel.table2}(${pk});`;
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
	const graphLinks = model.graph?.getLinks?.() || [];

	function findCardinalityFromLinks(tableName1, tableName2) {
	for (const link of graphLinks) {
		const srcId = link.get('source')?.id;
		const tgtId = link.get('target')?.id;
		const srcName = model.get(srcId)?.get('name');
		const tgtName = model.get(tgtId)?.get('name');
		if (!srcName || !tgtName) continue;
		if ((srcName === tableName1 && tgtName === tableName2) || (srcName === tableName2 && tgtName === tableName1)) {
			// prioriza metadado salvo
			const meta = link.get('cardinality');
			if (meta) return meta;
			// fallback: tenta ler labels (antigo comportamento)
			const labels = link.get('labels') || [];
			let leftCard = labels[0]?.attrs?.text?.text?.replace(/[()]/g, "")?.toLowerCase() || "";
			let rightCard = labels[1]?.attrs?.text?.text?.replace(/[()]/g, "")?.toLowerCase() || "";

			let card = "1-0>";
			if (leftCard === "0,1" && rightCard === "0,n") card = "0-0>";
			else if (leftCard === "0,1" && rightCard === "1,n") card = "0-1>";
			else if (leftCard === "1,1" && rightCard === "0,n") card = "1-0>";
			else if (leftCard === "1,1" && rightCard === "1,n") card = "1-1>";
			else if (leftCard === "0,n" && rightCard === "0,1") card = "<0-0";
			else if (leftCard === "1,n" && rightCard === "0,1") card = "<0-1";
			else if (leftCard === "0,n" && rightCard === "1,1") card = "<1-0";
			else if (leftCard === "1,n" && rightCard === "1,1") card = "<1-1";
			else if (leftCard === "1,1" && rightCard === "1,1") card = "1-1";
			return card;
		}
	}
	return null;
}

    model.keys().forEach(key => {
		const table = model.get(key);
		table.columns.forEach(col => {
			const constraints = colConstraints(col);

			constraints.forEach(constraint => {
				if (constraint.type === "fk" && constraint.ref) {
					const refTable = model.get(col.tableOrigin?.idOrigin);
					const pkCol = refTable?.columns.find(c => c.PK)?.name || "id";

					let cardinality = constraint.cardinality || col.cardinality;
					if (!cardinality) {
						const inferred = findCardinalityFromLinks(table.name, constraint.ref);
						cardinality = inferred || "<1-0";
					}

					relations.push({
						type: "relation",
						table1: table.name,
						fkColumn: col.name,
						table2: constraint.ref,
						pkColumn: pkCol,
						cardinality: cardinality
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
