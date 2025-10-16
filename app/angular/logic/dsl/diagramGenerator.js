import * as joint from "jointjs/dist/joint";
import Column from "../../service/Column"; // caminho correto até Column.js

class DiagramGeneratorLogical {
  constructor(ls) {
    this.ls = ls; // LogicService
    this.tables = new Map();
    this.relations = [];

    if (!this.ls.graph) {
      throw new Error("LogicService.graph não inicializado. Chame buildWorkspace() antes de instanciar DiagramGeneratorLogical.");
    }
  }

  generate(ast) {
    ast.tables?.forEach(table => this.createTable(table));
    ast.relations?.forEach(relation => this.createRelation(relation));

    return {
      tables: Array.from(this.tables.values()),
      relations: this.relations
    };
  }

  createTable(node) {
		const index = this.tables.size;
		const x = (index % 4) * 300 + 100;   // 4 colunas por linha
		const y = Math.floor(index / 4) * 200 + 100; // nova linha a cada 4 tabelas

		// normaliza/garante structure das colunas (inclui idOrigin etc.)
		const columns = (node.columns || []).map((col, idx) => ({
			idOrigin: col.idOrigin ?? `${node.name}_${col.name ?? 'col'}_${idx}`,
			tableOrigin: col.idTableOrigin ?? node.name,
			editable: col.editable ?? true,
			name: col.name ?? '',
			colType: col.colType ?? col.type ?? '',
			type: col.type ?? col.colType ?? '',
			pk: !!col.pk || (col.options && col.options.includes('pk')),
			fk: !!col.fk || (col.options && col.options.includes('fk')),
			options: col.options ?? []
		}));

		// strings para exibição no canvas
		const attributesAsStrings = columns.map(c => {
			const flags = [];
			if (c.pk) flags.push('PK');
			if (c.fk) flags.push('FK');
			const flagText = flags.length ? ` ${flags.join(', ')}` : '';
			return `${c.name}${flagText ? `: ${flagText}` : ''}`;
		});

		// tamanho dinâmico conforme número de linhas
		const height = Math.max(100, 24 + attributesAsStrings.length * 18);
		const width = 100;

		// se já existir, atualiza e sai
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
			attributes: attributesAsStrings, // array de strings usado pelo markup do shape
			attrs: {
				'.uml-class-name-rect': { fill: '#ffffffff'}
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

		const cardinalityLeft = node.cardinality || "";
		const cardinalityRight = node.cardinality || "";


    const link = new joint.shapes.erd.Line({
      source: { id: left.id },
      target: { id: right.id },
      attrs: {
        ".connection": { stroke: "#000", "stroke-width": 0.9 },
      },
      labels: [
      {
        position: 0.1, // perto da source
        attrs: { text: {  text: `(${cardinalityLeft})`, "font-size": 12, "font-weight": "400"  } }
      },
      {
        position: 0.9, // perto do target
        attrs: { text: {  text: `(${cardinalityRight})`, "font-size": 12, "font-weight": "400"  } }
      }
    ]
    });

    this.ls.graph.addCell(link);

    this.relations.push({
			left: node.table1,
			right: node.table2,
			cardinality: node.cardinality
		});
  }
}

export default DiagramGeneratorLogical;
