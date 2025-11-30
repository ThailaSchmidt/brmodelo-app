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

# Cardinality
cardinality_arrow ->
  %NUMBER _ %HIFEN _ %NUMBER _ %ARROWR
    {% (data) => {
        // procura os dois números no array
        const nums = data.flat().filter(x => x && (x.type === "NUMBER" || typeof x.value === "string" && /^\d+$/.test(x.value) || typeof x === "string" && /^\d+$/.test(x)));
        const aRaw = nums[0];
        const bRaw = nums[1];
        const av = aRaw?.text ?? aRaw?.value ?? aRaw;
        const bv = bRaw?.text ?? bRaw?.value ?? bRaw;

        if (!["0","1"].includes(String(av))) throw new Error("Cardinalidade inválida");
        if (!["0","1"].includes(String(bv))) throw new Error("Cardinalidade inválida");
        return `${av}-${bv}>`;
    } %}
| %ARROWL _ %NUMBER _ %HIFEN _ %NUMBER
    {% (data) => {
        const nums = data.flat().filter(x => x && (x.type === "NUMBER" || typeof x.value === "string" && /^\d+$/.test(x.value) || typeof x === "string" && /^\d+$/.test(x)));
        const aRaw = nums[0];
        const bRaw = nums[1];
        const av = aRaw?.text ?? aRaw?.value ?? aRaw;
        const bv = bRaw?.text ?? bRaw?.value ?? bRaw;

        if (!["0","1"].includes(String(av))) throw new Error("Cardinalidade inválida");
        if (!["0","1"].includes(String(bv))) throw new Error("Cardinalidade inválida");
        return `<${av}-${bv}`;
    } %}
| %NUMBER _ %HIFEN _ %NUMBER
    {% (data) => {
        const nums = data.flat().filter(x => x && (x.type === "NUMBER" || typeof x.value === "string" && /^\d+$/.test(x.value) || typeof x === "string" && /^\d+$/.test(x)));
        const aRaw = nums[0];
        const bRaw = nums[1];
        const av = aRaw?.text ?? aRaw?.value ?? aRaw;
        const bv = bRaw?.text ?? bRaw?.value ?? bRaw;

        if (!["0","1"].includes(String(av))) throw new Error("Cardinalidade inválida");
        if (!["0","1"].includes(String(bv))) throw new Error("Cardinalidade inválida");
        return `${av}-${bv}`;
    } %}

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
