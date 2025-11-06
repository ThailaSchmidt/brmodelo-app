import angular from "angular";
import CodeMirror from "codemirror";

import "codemirror/addon/edit/closebrackets.js";
import "codemirror/addon/edit/matchbrackets.js";
import "codemirror/lib/codemirror.css";

const codeMirror = angular
	.module("app.codeMirror", [])
	.directive("codeMirror", [
		"$timeout",
		function ($timeout) {
			return {
				restrict: "E",
				require: "ngModel",
				scope: {
					mode: "<?",
					theme: "<?",
					options: "<?",
					onChange: "&?",
				},
				template: "<textarea></textarea>",
				link: function (scope, element, attrs, ngModel) {
					const textarea = element.find("textarea")[0];
					const config = angular.extend(
						{
							lineNumbers: true,
							mode: scope.mode || "javascript",
							lineWrapping: true,
							theme: scope.theme || "default",
							autoCloseBrackets: true,
							matchBrackets: true,
						},
						scope.options,
					);

					const editor = CodeMirror.fromTextArea(textarea, config);
					editor.getWrapperElement().classList.add("code-mirror");

					const injector = angular.element(document.body).injector();
					const LogicService = injector.get("LogicService");
					if (LogicService) {
						LogicService.setCodeEditor(editor);
					}

					$timeout(() => {
						editor.refresh();
					}, 0);

					editor.on("change", function (cm, changeObj) {
						if (changeObj.origin === "setValue") return; // ignora mudanças internas
						scope.$applyAsync(() => {
							ngModel.$setViewValue(cm.getValue());
							if (scope.onChange) scope.onChange();
						});
					});

					ngModel.$render = function () {
						const safeValue = ngModel.$viewValue || "";
						if (safeValue !== editor.getValue()) {
							editor.setValue(safeValue);
						}
					};
				},
			};
		},
	]);

export default codeMirror.name;