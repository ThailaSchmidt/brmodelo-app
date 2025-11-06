const tokens = [
  // Palavras-chave
  { regex: /\bTable\b/, token: "keyword" },
  { regex: /\bRelation\b/, token: "keyword" },

  { regex: /\bint\b/, token: "type" },
  { regex: /\bvarchar\b/, token: "type" },
  { regex: /\bchar\b/, token: "type" },
  { regex: /\bfloat\b/, token: "type" },
  { regex: /\bboolean\b/, token: "type" },
  { regex: /\bdate\b/, token: "type" },

  { regex: /\bpk\b/, token: "modifier" },
  { regex: /\bfk\b/, token: "modifier" },
  { regex: /\bunique\b/, token: "modifier" },
  { regex: /\bnot\s+null\b/, token: "modifier" },
  { regex: /\bauto\s+increment\b/, token: "modifier" },
  { regex: /\bdefault\b/, token: "modifier" },
  { regex: /\bcheck\b/, token: "modifier" },

  { regex: /\b[01]-[01]>\b/, token: "cardinality" },
	{ regex: /\b<[01]-[01]\b/, token: "cardinality" },
	{ regex: /\b[01]-[01]\b/, token: "cardinality" },

  { regex: /->/, token: "operator" },
	{ regex: /</, token: "operator" },
  { regex: /{/, token: "brace" },
  { regex: /}/, token: "brace" },
  { regex: /\(/, token: "paren" },
  { regex: /\)/, token: "paren" },
  { regex: /\[/, token: "bracket" },
  { regex: /\]/, token: "bracket" },
  { regex: /;/, token: "semicolon" },
  { regex: /,/, token: "comma" },

  { regex: /"(?:[^"\\]|\\.)*?"/, token: "string" },
  { regex: /'(?:[^'\\]|\\.)*?'/, token: "string" },
  { regex: /\b[a-zA-Z_]\w*\b/, token: "identifier" }, // nomes de tabelas e colunas
];

export default tokens;
