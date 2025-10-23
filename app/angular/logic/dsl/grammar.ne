@lexer lexer

main -> declaration (_ declaration):* {% ([first, rest]) => [first, ...rest.map(r => r[1])] %}
     | null                             {% () => [] %}

declaration -> table_command {% id %}
             | relation_command {% id %}

# TABLE COMMAND
table_command -> %TABLE _ identifier _ %LBRACE _ attributes_list _ %RBRACE
    {% ([,, name,,,, attrs,,]) => ({
        type: "table",
        name: name,
        attributes: attrs
    }) %}

attributes_list -> attribute_definition:* {% (attrs) => attrs.flat() %}

attribute_definition -> identifier _ identifier _ constraints:? _ %SEMICOLON
    {% ([name,, type,, constraints]) => ({
        name: name,
        type: type,
        constraints: constraints ?? []
    }) %}

constraints -> %LBRACK _ constraint_list _ %RBRACK
    {% ([,, list,]) => list %}

constraint_list -> constraint_item (_ %COMMA _ constraint_item):*
    {% ([first, rest]) => [first, ...rest.map(r => r[3])] %}

constraint_item -> %PK               {% () => ({ type: "pk" }) %}
                 | %FK _ %ARROW _ identifier {% ([,, name]) => ({ type: "fk", ref: name }) %}
                 | %UNIQUE            {% () => ({ type: "unique" }) %}
                 | %NOT_NULL          {% () => ({ type: "not_null" }) %}
                 | %AUTO_INCREMENT    {% () => ({ type: "auto_increment" }) %}
                 | %DEFAULT _ %IDENTIFIER   {% ([,, value]) => ({ type: "default", value: value.value }) %}
                 | %CHECK _ %IDENTIFIER     {% ([,, value]) => ({ type: "check", value: value.value }) %}

identifier -> %IDENTIFIER {% ([value]) => value.value %}
           | %STRING     {% ([value]) => value.value %}
           | %NUMBER     {% ([value]) => value.value %}

# Cardinality (para usar na relation_command)
cardinality -> %ZERO _ %COLON _ %ONE {% () => "0:1" %}
			 | %ZERO _ %COLON _ %N {% () => "0:N" %}
			 | %ONE _ %COLON _ %ONE {% () => "1:1" %}
             | %ONE _ %COLON _ %N   {% () => "1:N" %}
             | %N   _ %COLON _ %ONE {% () => "N:1" %}


# RELATION COMMAND (aponta para FK)
relation_command -> %RELATION _ identifier _ %LPAREN identifier %RPAREN _ cardinality _ identifier _ %LPAREN identifier %RPAREN
    {% function([, , table1, , , fkColumn, , , cardinality, , table2, , , pkColumn, ]) {
        return {
            type: "relation",
            table1,
            fkColumn,
            cardinality,
            table2,
            pkColumn
        };
    } %}


_ -> %WHITESPACE:* {% () => null %}

@{%
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
	ZERO:			"0"
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
%}
