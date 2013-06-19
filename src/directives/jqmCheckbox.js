// Note: No theme dependency in the css classes of checkboxes!
jqmModule.directive('jqmCheckbox', [function () {
    return {
        restrict: 'A',
        transclude: true,
        require: '?ngModel',
        scope: {
            disabled: '@'
        },
        replace: true,
        templateUrl: 'templates/jqmCheckbox.html',
        link: function (scope, element, attr, ctrl) {

            scope.toggle = function() {
                scope.checked = !scope.checked;
            };

            if (ctrl) {
                enableNgModelCollaboration();
            }

            function enableNgModelCollaboration() {
                // For the following code, see checkboxInputType in angular's sources
                var trueValue = attr.ngTrueValue,
                    falseValue = attr.ngFalseValue;
                if (!angular.isString(trueValue)) {
                    trueValue = true;
                }
                if (!angular.isString(falseValue)) {
                    falseValue = false;
                }

                ctrl.$render = function () {
                    scope.checked = ctrl.$viewValue;
                };
                ctrl.$formatters.push(function (value) {
                    return value === trueValue;
                });
                ctrl.$parsers.push(function (value) {
                    return value ? trueValue : falseValue;
                });
            }
        }
    };
}])

//Example: <div jqm-theme-class="ui-btn-$"></div> will be compiled to
//<div class="ui-btn-c"></div> if c is current theme
.directive('jqmThemeClass', function(jqmTheme) {
    return function postLInk(scope, elm, attrs) {
        elm.addClass( attrs.jqmThemeClass.replace(/\$/g, jqmTheme(element)) );
    };
});
