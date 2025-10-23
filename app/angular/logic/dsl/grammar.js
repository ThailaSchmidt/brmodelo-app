// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley

function id(x) { return x[0]; }

const moo = require('moo');
let lexer = moo.compile({
    BLOCK_COMMENT:  { match: /\/\*[^]*?\*\//, lineBreaks: true, value: x => null },
    COMMENT:        { match: /\/\/[^\n]*\n?/, lineBreaks: true, value: x => null },
    WHITESPACE:     { match: /\s+/, lineBreaks: true },
    TABLE:          "Table",
    RELATION:       "Relation",
    PK:             "pk",
    FK:             "fk",
    UNIQUE:         "unique",
    NOT_NULL:       "not null",
    AUTO_INCREMENT: "auto increment",
    DEFAULT:        "default",
    CHECK:          "check",
    ARROW:          "->",
	ZERO:			"0",
    ONE:            "1",
    N:              "N",
    IDENTIFIER:     /[a-zA-Z_]\w*/,
    STRING:         { match: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/, value: x => x.slice(1,-1) },
    NUMBER:         /[0-9]+/,
    LBRACE:         "{",
    RBRACE:         "}",
    LBRACK:         "[",
    RBRACK:         "]",
    SEMICOLON:      ";",
    LPAREN:         "(",
    RPAREN:         ")",
    COMMA:          ",",
    COLON:          ":",
});

const originalLexerNext = lexer.next;
lexer.next = function () {
    let token;
    while ((token = originalLexerNext.call(this))) {
        if (!["COMMENT", "BLOCK_COMMENT", "WHITESPACE"].includes(token.type)) {
            return token;
        }
    }
    return undefined;
};
var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "main$ebnf$1", "symbols": []},
    {"name": "main$ebnf$1$subexpression$1", "symbols": ["_", "declaration"]},
    {"name": "main$ebnf$1", "symbols": ["main$ebnf$1", "main$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "main", "symbols": ["declaration", "main$ebnf$1"], "postprocess": ([first, rest]) => [first, ...rest.map(r => r[1])]},
    {"name": "main", "symbols": [], "postprocess": () => []},
    {"name": "declaration", "symbols": ["table_command"], "postprocess": id},
    {"name": "declaration", "symbols": ["relation_command"], "postprocess": id},
    {"name": "table_command", "symbols": [(lexer.has("TABLE") ? {type: "TABLE"} : TABLE), "_", "identifier", "_", (lexer.has("LBRACE") ? {type: "LBRACE"} : LBRACE), "_", "attributes_list", "_", (lexer.has("RBRACE") ? {type: "RBRACE"} : RBRACE)], "postprocess":  ([,, name,,,, attrs,,]) => ({
            type: "table",
            name: name,
            attributes: attrs
        }) },
    {"name": "attributes_list$ebnf$1", "symbols": []},
    {"name": "attributes_list$ebnf$1", "symbols": ["attributes_list$ebnf$1", "attribute_definition"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "attributes_list", "symbols": ["attributes_list$ebnf$1"], "postprocess": (attrs) => attrs.flat()},
    {"name": "attribute_definition$ebnf$1", "symbols": ["constraints"], "postprocess": id},
    {"name": "attribute_definition$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "attribute_definition", "symbols": ["identifier", "_", "identifier", "_", "attribute_definition$ebnf$1", "_", (lexer.has("SEMICOLON") ? {type: "SEMICOLON"} : SEMICOLON)], "postprocess":  ([name,, type,, constraints]) => ({
            name: name,
            type: type,
            constraints: constraints ?? []
        }) },
    {"name": "constraints", "symbols": [(lexer.has("LBRACK") ? {type: "LBRACK"} : LBRACK), "_", "constraint_list", "_", (lexer.has("RBRACK") ? {type: "RBRACK"} : RBRACK)], "postprocess": ([,, list,]) => list},
    {"name": "constraint_list$ebnf$1", "symbols": []},
    {"name": "constraint_list$ebnf$1$subexpression$1", "symbols": ["_", (lexer.has("COMMA") ? {type: "COMMA"} : COMMA), "_", "constraint_item"]},
    {"name": "constraint_list$ebnf$1", "symbols": ["constraint_list$ebnf$1", "constraint_list$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "constraint_list", "symbols": ["constraint_item", "constraint_list$ebnf$1"], "postprocess": ([first, rest]) => [first, ...rest.map(r => r[3])]},
    {"name": "constraint_item", "symbols": [(lexer.has("PK") ? {type: "PK"} : PK)], "postprocess": () => ({ type: "pk" })},
    {"name": "constraint_item", "symbols": [(lexer.has("FK") ? {type: "FK"} : FK), "_", (lexer.has("ARROW") ? {type: "ARROW"} : ARROW), "_", "identifier"], "postprocess": ([,,,, name]) => ({ type: "fk", ref: name.text ?? name.value ?? name })},
    {"name": "constraint_item", "symbols": [(lexer.has("UNIQUE") ? {type: "UNIQUE"} : UNIQUE)], "postprocess": () => ({ type: "unique" })},
    {"name": "constraint_item", "symbols": [(lexer.has("NOT_NULL") ? {type: "NOT_NULL"} : NOT_NULL)], "postprocess": () => ({ type: "not_null" })},
    {"name": "constraint_item", "symbols": [(lexer.has("AUTO_INCREMENT") ? {type: "AUTO_INCREMENT"} : AUTO_INCREMENT)], "postprocess": () => ({ type: "auto_increment" })},
    {"name": "constraint_item", "symbols": [(lexer.has("DEFAULT") ? {type: "DEFAULT"} : DEFAULT), "_", (lexer.has("IDENTIFIER") ? {type: "IDENTIFIER"} : IDENTIFIER)], "postprocess": ([,, value]) => ({ type: "default", value: value.value })},
    {"name": "constraint_item", "symbols": [(lexer.has("CHECK") ? {type: "CHECK"} : CHECK), "_", (lexer.has("IDENTIFIER") ? {type: "IDENTIFIER"} : IDENTIFIER)], "postprocess": ([,, value]) => ({ type: "check", value: value.value })},
    {"name": "identifier", "symbols": [(lexer.has("IDENTIFIER") ? {type: "IDENTIFIER"} : IDENTIFIER)], "postprocess": ([value]) => value.value},
    {"name": "identifier", "symbols": [(lexer.has("STRING") ? {type: "STRING"} : STRING)], "postprocess": ([value]) => value.value},
    {"name": "identifier", "symbols": [(lexer.has("NUMBER") ? {type: "NUMBER"} : NUMBER)], "postprocess": ([value]) => value.value},
    {"name": "cardinality", "symbols": [(lexer.has("ZERO") ? {type: "ZERO"} : ZERO), "_", (lexer.has("COLON") ? {type: "COLON"} : COLON), "_", (lexer.has("ONE") ? {type: "ONE"} : ONE)], "postprocess": () => "0:1"},
    {"name": "cardinality", "symbols": [(lexer.has("ZERO") ? {type: "ZERO"} : ZERO), "_", (lexer.has("COLON") ? {type: "COLON"} : COLON), "_", (lexer.has("N") ? {type: "N"} : N)], "postprocess": () => "0:N"},
    {"name": "cardinality", "symbols": [(lexer.has("ONE") ? {type: "ONE"} : ONE), "_", (lexer.has("COLON") ? {type: "COLON"} : COLON), "_", (lexer.has("ONE") ? {type: "ONE"} : ONE)], "postprocess": () => "1:1"},
    {"name": "cardinality", "symbols": [(lexer.has("ONE") ? {type: "ONE"} : ONE), "_", (lexer.has("COLON") ? {type: "COLON"} : COLON), "_", (lexer.has("N") ? {type: "N"} : N)], "postprocess": () => "1:N"},
    {"name": "cardinality", "symbols": [(lexer.has("N") ? {type: "N"} : N), "_", (lexer.has("COLON") ? {type: "COLON"} : COLON), "_", (lexer.has("ONE") ? {type: "ONE"} : ONE)], "postprocess": () => "N:1"},
    {"name": "relation_command", "symbols": [(lexer.has("RELATION") ? {type: "RELATION"} : RELATION), "_", "identifier", "_", (lexer.has("LPAREN") ? {type: "LPAREN"} : LPAREN), "identifier", (lexer.has("RPAREN") ? {type: "RPAREN"} : RPAREN), "_", "cardinality", "_", "identifier", "_", (lexer.has("LPAREN") ? {type: "LPAREN"} : LPAREN), "identifier", (lexer.has("RPAREN") ? {type: "RPAREN"} : RPAREN)], "postprocess":  function([, , table1, , , fkColumn, , , cardinality, , table2, , , pkColumn, ]) {
            return {
                type: "relation",
                table1,
                fkColumn,
                cardinality,
                table2,
                pkColumn
            };
        } },
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", (lexer.has("WHITESPACE") ? {type: "WHITESPACE"} : WHITESPACE)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": () => null}
]
  , ParserStart: "main"
}
export default grammar;