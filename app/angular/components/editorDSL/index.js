import angular from "angular";
import template from "./index.html";
import codeMirror from "./codeMirror";
import CodeMirror from "codemirror";
import "codemirror/addon/mode/simple.js";
import "./index.scss";
import nearley from "nearley";
import grammar from "../../logic/dsl/grammar.js";
import moo from "moo";

const textEditor = function ($scope, $timeout) {
    this.text = "";
    let debounceTimeout = null;
    let clearErrorTimeout = null;

    // Garantir tokens sempre como array quando mudar
    this.$onChanges = (changes) => {
        if (changes.tokens && changes.tokens.currentValue) {
            this.tokens = Array.isArray(changes.tokens.currentValue)
                ? changes.tokens.currentValue
                : [changes.tokens.currentValue];
        }
    };

    this.$onInit = () => {
        this.modeName = "customMode_" + Math.random().toString(36).substr(2, 5);
        this.errors = null;

        // Garante que tokens é sempre array
        const tokens = Array.isArray(this.tokens) ? this.tokens : [];

        CodeMirror.defineSimpleMode(this.modeName, {
            start: tokens
                .map((token) => ({
                    regex: new RegExp(token.regex),
                    token: token.token,
                }))
                .concat([
                    { regex: /\/\/.*/, token: "comment" },
                    { regex: /\/\*/, token: "comment", next: "commentBlock" },
                    { regex: /\s+/, token: null },
                    { regex: /./, token: null },
                ]),
            commentBlock: [
                { regex: /.*?\*\//, token: "comment", next: "start" },
                { regex: /.*/, token: "comment" },
            ],
        });

        if (this.grammar) {
			try {
				this.myGrammar = nearley.Grammar.fromCompiled(grammar);
				this.lexer = this.myGrammar.lexer;
				console.log("Grammar carregada com sucesso!");
			} catch (e) {
				console.error("Erro ao carregar o grammar:", e.message);
			}
		}


        this.modeToUse = this.modeName;
    };

    this.onChange = function () {
        if (debounceTimeout) $timeout.cancel(debounceTimeout);

        debounceTimeout = $timeout(() => {
            if (this.interpreter && this.grammar) {
                try {
                    const parser = new nearley.Parser(this.myGrammar, { lexer: this.lexer });
                    parser.feed(this.text);
                    this.errors = null;
                    this.interpreter(parser.results[0]);
                } catch (e) {
                    this.errors = this.formatSyntaxErrors(e);
                    this.resetError();
                }
                $scope.$applyAsync();
            }
        }, 1000);
    };

    this.formatSyntaxErrors = function (err) {
        if (err.token && err.token.line && err.token.col) {
            return `Syntax error at line ${err.token.line} col ${err.token.col}:\nUnexpected ${err.token.type} token: "${err.token.text || err.token.value}"`;
        }
        return err.message || `Syntax error: Unexpected token "${err.token?.value}"`;
    };

    this.resetError = function () {
        if (clearErrorTimeout) $timeout.cancel(clearErrorTimeout);

        clearErrorTimeout = $timeout(() => {
            this.errors = null;
            $scope.$applyAsync();
        }, 5000);
    };
};
textEditor.$inject = ["$scope", "$timeout"];

export default angular
    .module("app.textEditor", [codeMirror])
    .component("textEditor", {
        template,
        controller: textEditor,
        bindings: {
            tokens: "<",
            interpreter: "<",
            grammar: "<",
        },
    }).name;
