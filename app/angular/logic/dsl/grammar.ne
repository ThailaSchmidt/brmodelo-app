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

value -> %NUMBER       {% ([v]) => v.value %}
      | %STRING        {% ([v]) => v.value %}
      | %IDENTIFIER    {% ([v]) => v.value %}

constraint_item -> %PK               {% () => ({ type: "pk" }) %}
                 | %FK _ %ARROWR _ identifier {% ([,, name]) => ({ type: "fk", ref: name }) %}
                 | %UNIQUE            {% () => ({ type: "unique" }) %}
                 | %NOT_NULL          {% () => ({ type: "not_null" }) %}
                 | %AUTO_INCREMENT    {% () => ({ type: "auto_increment" }) %}
                 | %DEFAULT _ value   {% ([,, value]) => ({ type: "default", value }) %}
				 | %CHECK _ value     {% ([,, value]) => ({ type: "check", value }) %}

identifier -> %IDENTIFIER {% ([value]) => value.value %}
           | %STRING     {% ([value]) => value.value %}
           | %NUMBER     {% ([value]) => value.value %}

# Cardinality atualizada
cardinality_arrow ->
      %ZERO _ %HIFEN _ %ZERO _ %ARROWR {% () => "0-0>" %}
    | %ZERO _ %HIFEN _ %ONE  _ %ARROWR {% () => "0-1>" %}
    | %ONE  _ %HIFEN _ %ZERO _ %ARROWR {% () => "1-0>" %}
    | %ONE  _ %HIFEN _ %ONE  _ %ARROWR {% () => "1-1>" %}
	| %ARROWL _ %ZERO _ %HIFEN _ %ZERO {% () => "<0-0" %}
    | %ARROWL _ %ZERO _ %HIFEN _ %ONE  {% () => "<0-1" %}
    | %ARROWL _ %ONE  _ %HIFEN _ %ZERO {% () => "<1-0" %}
    | %ARROWL _ %ONE  _ %HIFEN _ %ONE  {% () => "<1-1" %}
	| %ONE  _ %HIFEN _ %ONE           {% () => "1-1" %}

# RELATION COMMAND (aponta para FK)
relation_command ->
    %RELATION _ identifier _ %LPAREN identifier %RPAREN _
    cardinality_arrow _
    identifier _ %LPAREN identifier %RPAREN _ %SEMICOLON
    {%
        ([, , table1, , , fk, , , card, , table2, , , pk]) => ({
            type: "relation",
            table1,
            fkColumn: fk,
            table2,
            pkColumn: pk,
            cardinality: card
        })
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
    ARROWR: { match: /->|>/ },
	ARROWL: { match: /<-|</ },
	ZERO:			"0",
    ONE:            "1",
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
	HIFEN:			"-",
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
