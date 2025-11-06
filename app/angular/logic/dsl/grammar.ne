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
relation_command ->
    %RELATION _ identifier _ %LPAREN identifier %RPAREN _
    %LPAREN cardinality _ %COMMA _ cardinality %RPAREN _
    identifier _ %LPAREN identifier %RPAREN _ %SEMICOLON
    {%
		(data) => {
			const tokens = data.filter(d => typeof d === 'string');
			return {
			type: "relation",
			table1: tokens[0],
			fkColumn: tokens[1],
			card1: tokens[2],
			card2: tokens[3],
			table2: tokens[4],
			pkColumn: tokens[5],
			cardinality: [tokens[2], tokens[3]]
			};
		}
	%}


#ignora espaços
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
    IDENTIFIER:      /[\p{L}_][\p{L}\p{N}_]*/u,
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
