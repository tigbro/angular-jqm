jqmModule.directive('html', function() {
    return {
        restrict: 'E',
        //There will always be a default jqmTheme available
        controller: 'jqmThemeController',
        compile: function(cElement) {
            cElement.addClass("ui-mobile");
        }
    };
});
