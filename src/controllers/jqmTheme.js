/**
 * jqmThemeController is used in conjunction with the `jqm-theme` directive.
 * <p>
 * All directives try to require the jqmThemeController to see if they can inherit
 * the theme from their parent.
 * </p>
 * <p>
 * Methods
 *  - theme {string} - Returns the current theme
 */
jqmModule.controller('jqmThemeController', ['$attrs', function ($attrs) {
    //Default Theme
    var currentTheme = $attrs.jqmTheme || 'c';

    this.theme = function() {
        return currentTheme;
    };
}]);
