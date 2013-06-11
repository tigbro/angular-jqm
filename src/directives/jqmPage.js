jqmModule.directive('jqmPage', function() {
    return {
        restrict: 'A',
        require: '?^jqmThemeController',
        link: function(scope, element, attrs, themeCtrl) {
            var theme = themeCtrl ? themeCtrl.theme() : 'c';
            element.addClass('ui-page ui-body-' + theme);
        }
    };
});
