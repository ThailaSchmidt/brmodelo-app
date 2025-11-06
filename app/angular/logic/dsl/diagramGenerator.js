import * as joint from "jointjs/dist/joint";
class DiagramGeneratorLogical {
	constructor(ls) {
		this.ls = ls;
		this.tables = new Map();
		this.relations = [];

		if (!this.ls.graph) {
			throw new Error("LogicService.graph não inicializado.");
		}
  	}

	generate(ast) {
		this.ls.graph.clear();
		this.tables.clear();
		this.relations = [];

		ast.tables?.forEach(table => this.createTable(table));
		ast.relations?.forEach(relation => this.createRelation(relation));

		return {
		tables: Array.from(this.tables.values()),
		relations: this.relations
		};
	}

    createTable(node) {
		const index = this.tables.size;
		const x = (index % 3) * 300 + 100;   // 3 tabelas por linha
		const y = Math.floor(index / 3) * 200 + 100; // nova linha a cada 3 tabelas

		const columns = (node.columns || []).map((col, idx) => {
			const colOptions = col.options ?? [];
			return {
				tableOrigin: { idOrigin: null },
				editable: col.editable ?? true,
				name: col.name ?? '',
				colType: col.colType ?? col.type ?? '',
				type: col.type ?? col.colType ?? '',
				PK: colOptions.includes('pk'),
				FK: colOptions.some(o => o.startsWith('fk')),
				fkId: col.fkRef,
				UNIQUE: colOptions.includes('unique'),
				NOT_NULL: colOptions.includes('not null'),
				AUTO_INCREMENT: colOptions.includes('autoincrement') || colOptions.includes('ai'),
				options: colOptions
			};

		});

		// strings para exibição no canvas
		const attributesAsStrings = columns.map(c => {
			const flags = [];
			if (c.PK) flags.push('PK');
			if (c.FK) flags.push('FK');
			const flagText = flags.length ? ` ${flags.join(', ')}` : '';
			return `${c.name}${flagText ? `: ${flagText}` : ''}`;
		});

		const height = Math.max(100, 24 + attributesAsStrings.length * 18);
		const width = 100;

		if (this.tables.has(node.name)) {
			const existing = this.tables.get(node.name);

			existing.set('attributes', attributesAsStrings); // para exibição no shape
			existing.set('objects', columns);               // usado pelo editor (brModelo)
			existing.set('columns', columns);               // redundância segura se houver código que leia 'columns'
			existing.resize(width, height);

			// dispara eventos para UI reagir
			existing.trigger('change:attributes', existing);
			existing.trigger('change:objects', existing);
			existing.trigger('change:columns', existing);
			return; // não cria novo
		}

		// cria novo elemento
		const tableElement = new joint.shapes.uml.Class({
			position: { x, y },
			size: { width, height },
			name: node.name || 'Table',
			type: 'uml.Class',
			attributes: attributesAsStrings,
			attrs: {
				'.uml-class-name-rect': { fill: '#ffffffff'}
			}
		});

		columns.forEach(col => {
			if (col.FK && col.fkId) {
				// fkId contém o NOME da tabela referenciada
				const fkTableElement = this.tables.get(col.fkId); // busca o elemento pelo nome
				col.tableOrigin.idOrigin = fkTableElement?.id || null; // agora sim pega o ID do shape
			}
		});

		// guarda os objetos originais para a aba de edição (brModelo geralmente usa 'objects')
		tableElement.set('objects', columns);
		tableElement.set('columns', columns);
		tableElement.trigger('change:attributes', tableElement);
		tableElement.trigger('change:objects', tableElement);
		tableElement.trigger('change:columns', tableElement);

		this.ls.graph.addCell(tableElement);
		this.tables.set(node.name, tableElement);
	}

	createRelation(node) {
		const left = this.tables.get(node.table1);
		const right = this.tables.get(node.table2);

		if (!left || !right) return;

		const [rightCard, leftCard] = node.cardinality || ["", ""];

		const link = new joint.shapes.erd.Line({
			source: { id: left.id },
			target: { id: right.id },
			attrs: {
			".connection": { stroke: "#000", "stroke-width": 0.9 },
			},
			labels: [
			{
				position: 0.1, // perto da origem (table1)
				attrs: {
				text: {
					text: `(${leftCard})`,
					"font-size": 12,
					"font-weight": "400"
				}
				}
			},
			{
				position: 0.9, // perto do destino (table2)
				attrs: {
				text: {
					text: `(${rightCard})`,
					"font-size": 12,
					"font-weight": "400"
				}
				}
			}
			]
		});

		this.ls.graph.addCell(link);

		this.relations.push({
			table1: node.table1,
			fkColumn: node.fkColumn,
			cardinality: node.cardinality,
			table2: node.table2,
			pkColumn: node.pkColumn
		});
   }
}

export default DiagramGeneratorLogical;
