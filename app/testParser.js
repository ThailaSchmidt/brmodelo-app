import logicService from './angular/service/logicService.js';
import parser from './dsl/parser.js'

const script = `
Table users {
	id int [pk]
	name varchar
	email varchar
}
`;

const tables = parser.parse(script);
tables.forEach(t => logicService.insertTable(t)); //para cada tabela t chama insertTable