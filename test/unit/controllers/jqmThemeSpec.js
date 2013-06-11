'use strict';

describe('jqmThemeController', function() {
    var $controller;
    beforeEach(inject(function(_$controller_) {
        $controller = _$controller_;
    }));

    function makeCtrl($attrs) {
        return $controller('jqmThemeController', {
            $attrs: $attrs || {}
        });
    }

    it('should have a default theme', function() {
        var ctrl = makeCtrl();
        expect(typeof ctrl.theme()).toBe('string');
    });

    it('should set the theme if given', function() {
        var ctrl = makeCtrl({ jqmTheme: 'pizza' });
        expect(ctrl.theme()).toBe('pizza');
    });
});
