/*! angular-jqm - v0.0.1-SNAPSHOT - 2013-06-19
 * https://github.com/opitzconsulting/angular-jqm
 * Copyright (c) 2013 OPITZ CONSULTING GmbH; Licensed MIT */
(function(window, angular) {
    "use strict";
var jqmModule = angular.module("jqm", ['jqm-templates']);

jqmModule.provider('jqmTheme', function () {
    var JQM_THEME = '$jqmTheme',
        _defaultTheme = 'c';

    return {
        $get: jqmThemeFactory,
        defaultTheme: defaultTheme
    };

    function defaultTheme(value) {
        if (value) {
            _defaultTheme = value;
        }
        return _defaultTheme;
    }

    function jqmThemeFactory() {
        return jqmTheme;
    }

    function jqmTheme(element, value) {
        if (arguments.length === 2) {
            if (value) {
                element.data(JQM_THEME, value);
            } else {
                element.removeData(JQM_THEME);
            }
        }
        return element.inheritedData(JQM_THEME) || _defaultTheme;
    }
});
jqmModule.factory('$animationComplete', ['$sniffer', function ($sniffer) {
    return function (el, callback) {
        var eventNames = 'animationend';
        if (!$sniffer.animations) {
            throw new Error("Browser does not support css animations.");
        }
        if ($sniffer.vendorPrefix) {
            eventNames += " " + $sniffer.vendorPrefix.toLowerCase() + "AnimationEnd";
        }
        el.bind(eventNames, callback);
    };
}]);

(function () {
    /*! matchMedia() polyfill - Test a CSS media type/query in JS. Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas. Dual MIT/BSD license */
    window.matchMedia = window.matchMedia || (function (doc) {
        var bool,
            docElem = doc.documentElement,
            refNode = docElem.firstElementChild || docElem.firstChild,
        // fakeBody required for <FF4 when executed in <head>
            fakeBody = doc.createElement("body"),
            div = doc.createElement("div");

        div.id = "mq-test-1";
        div.style.cssText = "position:absolute;top:-100em";
        fakeBody.style.background = "none";
        fakeBody.appendChild(div);

        return function (q) {

            div.innerHTML = "&shy;<style media=\"" + q + "\"> #mq-test-1 { width: 42px; }</style>";

            docElem.insertBefore(fakeBody, refNode);
            bool = div.offsetWidth === 42;
            docElem.removeChild(fakeBody);

            return {
                matches: bool,
                media: q
            };

        };

    }(window.document));
})();

jqmModule.config(['$provide', function ($provide) {
    $provide.decorator('$sniffer', ['$delegate', '$window', function ($sniffer, $window) {
        var fakeBody = angular.element("<body>");
        angular.element($window).prepend(fakeBody);

        $sniffer.cssTransform3d = transform3dTest();

        fakeBody.remove();
        return $sniffer;

        function media(q) {
            return window.matchMedia(q).matches;
        }

        // This is a copy of jquery mobile 1.3.1 detection for transform3dTest
        function transform3dTest() {
            var mqProp = "transform-3d",
                vendors = [ "Webkit", "Moz", "O" ],
            // Because the `translate3d` test below throws false positives in Android:
                ret = media("(-" + vendors.join("-" + mqProp + "),(-") + "-" + mqProp + "),(" + mqProp + ")");

            if (ret) {
                return !!ret;
            }

            var el = $window.document.createElement("div"),
                transforms = {
                    // We’re omitting Opera for the time being; MS uses unprefixed.
                    'MozTransform': '-moz-transform',
                    'transform': 'transform'
                };

            fakeBody.append(el);

            for (var t in transforms) {
                if (el.style[ t ] !== undefined) {
                    el.style[ t ] = 'translate3d( 100px, 1px, 1px )';
                    ret = window.getComputedStyle(el).getPropertyValue(transforms[ t ]);
                }
            }
            return ( !!ret && ret !== "none" );
        }

    }]);
}]);


jqmModule.config(['$provide', function ($provide) {
    $provide.decorator('$browser', ['$delegate', browserHashReplaceDecorator]);
    $provide.decorator('$browser', ['$delegate', '$history', browserHistoryDecorator]);
    return;

    // ---------------
    // implementation functions
    function browserHashReplaceDecorator($browser) {
        // On android and non html5mode, the hash in a location
        // is returned as %23.
        var _url = $browser.url;
        $browser.url = function () {
            var res = _url.apply(this, arguments);
            if (arguments.length === 0) {
                res = res.replace(/%23/g, '#');
                res = res.replace(/ /g, '%20');
            }
            return res;
        };
        return $browser;
    }

    // Integrates $browser with $history.
    function browserHistoryDecorator($browser, $history) {
        var _url = $browser.url;
        $browser.onUrlChange($history.onUrlChangeBrowser);

        $browser.url = function (url, replace) {
            if (url) {
                // setter
                var res = _url.call(this, url, replace);
                $history.onUrlChangeProgrammatically(url, replace);
                return res;
            } else {
                // getter
                return _url.apply(this, arguments);
            }
        };
        return $browser;
    }
}]);
jqmModule.factory('$history', function $historyFactory() {
    var $history;
    return $history = {
        go: go,
        urlStack: [],
        indexOf: indexOf,
        activeIndex: -1,
        previousIndex: -1,
        onUrlChangeProgrammatically: onUrlChangeProgrammatically,
        onUrlChangeBrowser: onUrlChangeBrowser
    };

    function go(relativeIndex) {
        // Always execute history.go asynchronously.
        // This is required as firefox and IE10 trigger the popstate event
        // in sync. By using a setTimeout we have the same behaviour everywhere.
        // Don't use $defer here as we don't want to trigger another digest cycle.
        // Note that we need at least 20ms to ensure that
        // the hashchange/popstate event for the current page
        // as been delivered (in IE this can take some time...).
        window.setTimeout(function () {
            window.history.go(relativeIndex);
        }, 20);
    }

    function indexOf(url) {
        var i,
            urlStack = $history.urlStack;
        for (i = 0; i < urlStack.length; i++) {
            if (urlStack[i].url === url) {
                return i;
            }
        }
        return -1;
    }

    function findInPast(url) {
        var index = $history.activeIndex - 1;
        while (index >= 0 && $history.urlStack[index].url !== url) {
            index--;
        }
        return index;
    }

    function onUrlChangeBrowser(url) {
        var oldIndex = $history.activeIndex;
        $history.activeIndex = indexOf(url);
        if ($history.activeIndex === -1) {
            onUrlChangeProgrammatically(url, false);
        } else {
            $history.previousIndex = oldIndex;
        }
    }

    function onUrlChangeProgrammatically(url, replace) {
        var currentEntry = $history.urlStack[$history.activeIndex];
        if (!currentEntry || currentEntry.url !== url) {
            $history.previousIndex = $history.activeIndex;
            if (!replace) {
                $history.activeIndex++;
            }
            $history.urlStack.splice($history.activeIndex, $history.urlStack.length - $history.activeIndex);
            $history.urlStack.push({url: url});
        }
    }
});

/**
 * The cache that is used in `jqmCachingView`.
 */
jqmModule.factory("$jqmViewCache", ['$cacheFactory', function($cacheFactory) {
    return $cacheFactory('views');
}]);

jqmModule.config(['$provide', function ($provide) {
    $provide.decorator('$rootScope', ['$delegate', function scopeReconnectDecorator($rootScope) {
        $rootScope.$disconnect = function () {
            if (this.$root === this) {
                return; // we can't disconnect the root node;
            }
            var parent = this.$parent;
            this.$$disconnected = true;
            // See Scope.$destroy
            if (parent.$$childHead === this) {
                parent.$$childHead = this.$$nextSibling;
            }
            if (parent.$$childTail === this) {
                parent.$$childTail = this.$$prevSibling;
            }
            if (this.$$prevSibling) {
                this.$$prevSibling.$$nextSibling = this.$$nextSibling;
            }
            if (this.$$nextSibling) {
                this.$$nextSibling.$$prevSibling = this.$$prevSibling;
            }
            this.$$nextSibling = this.$$prevSibling = null;
        };
        $rootScope.$reconnect = function () {
            if (this.$root === this) {
                return; // we can't disconnect the root node;
            }
            var child = this;
            if (!child.$$disconnected) {
                return;
            }
            var parent = child.$parent;
            child.$$disconnected = false;
            // See Scope.$new for this logic...
            child.$$prevSibling = parent.$$childTail;
            if (parent.$$childHead) {
                parent.$$childTail.$$nextSibling = child;
                parent.$$childTail = child;
            } else {
                parent.$$childHead = parent.$$childTail = child;
            }

        };
        return $rootScope;
    }]);
}]);

jqmModule.config(['$provide', function ($provide) {
    /**
     * Adds a function called `keys` to the $templateCache so that
     * it is possible to inspect the stored templates.
     * Note that the keys might be out of date when templates have been removed.
     */
    $provide.decorator("$templateCache", ['$delegate', function ($templateCache) {
        var keys = [],
            _put = $templateCache.put;
        $templateCache.put = function (key, value) {
            keys.push(key);
            return _put.call(this, key, value);
        };
        $templateCache.keys = function () {
            return keys;
        };
        return $templateCache;

    }]);
}]);
/**
 * watchPositionInParent will watch the position of a given set of elements within their common parent node.
 * For example, if three children of a parent element each call `watchPositionInParent(me, callback)`, then
 * whenever the position of any of those children changes relative to the parent, the changed childs' callbacks
 * will be called.
 *
 * The callback is called with parameters `(newPosition, previousPosition)`.  The `position` is a string: either
 * 'first', 'middle', or 'last'.
 *
 */
jqmModule.factory('watchPositionInParent', [ '$rootScope', function ($rootScope) {

    var WATCH_DATA_KEY_CHILD = '$watchPositionChild';
    var WATCH_DATA_KEY_PARENT = '$watchPositionParent';
    function ParentWatcher($parent) {
        $parent.data(WATCH_DATA_KEY_PARENT, this);

        var parent = $parent[0];

        this.watchChild = function($element, callback) {
            var watchData = $element.data(WATCH_DATA_KEY_CHILD);
            if (!watchData) {
                $element.data(WATCH_DATA_KEY_CHILD, (watchData = {
                    callbacks: [],
                    position: undefined
                }));
            }
            watchData.callbacks.push(callback);
            enqueueUpdate();
        };

        afterFn(parent, 'appendChild', enqueueUpdate);
        afterFn(parent, 'insertBefore', enqueueUpdate);
        afterFn(parent, 'removeChild', enqueueUpdate);

        var _updateEnqueued = false;
        function enqueueUpdate() {
            if (!_updateEnqueued) {
                _updateEnqueued = true;
                $rootScope.$evalAsync(function() {
                    updateChildren();
                    _updateEnqueued = false;
                });
            }
        }

        function updateChildren() {
            var children = $parent.children();
            var length = children.length;
            angular.forEach(children, function(child, index) {
                var childData = angular.element(child).data(WATCH_DATA_KEY_CHILD);
                if (childData) {
                    var newPos = getPosition(index, length);
                    if (newPos !== childData.position) {
                        angular.forEach(childData.callbacks, function(cb) {
                            cb(newPos, childData.position);
                        });
                        childData.position = newPos;
                    }
                }
            });
        }
    }

    function getPosition(index, length) {
        if (index === 0) {
            return 'first';
        } else if (index === length - 1) {
            return 'last';
        } else {
            return 'middle';
        }
    }

    function afterFn(context, fnName, afterCb) {
        var fn = context[fnName];
        context[fnName] = function(arg1, arg2) {
            fn.call(context, arg1, arg2);
            afterCb(arg1, arg2);
        };
    }

    return function watchPositionInParent(element, callback) {
        var parent = element.parent();
        var parentWatcher = parent.data(WATCH_DATA_KEY_PARENT) || new ParentWatcher(parent);
        parentWatcher.watchChild(element, callback);
    };
}]);

jqmModule.directive('jqmPage', ['jqmTheme', function (jqmTheme) {
    return {
        restrict: 'A',
        link: function (scope, iElement) {
            var theme = jqmTheme(iElement);

            iElement.addClass('ui-page ui-body-' + theme);
            scope.$on('$viewContentLoaded', function () {
                // Modify the parent when this page is shown.
                iElement.parent().addClass("ui-overlay-" + theme);
            });
        }
    };
}]);

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

jqmModule.directive('jqmTheme', ['jqmTheme', function (jqmTheme) {
    return {
        restrict: 'A',
        compile: function compile() {
            return {
                pre: function preLink(scope, iElement, iAttrs) {
                    // Set the theme before all other link functions of children
                    var theme = iAttrs.jqmTheme;
                    if (theme) {
                        jqmTheme(iElement, theme);
                    }
                }
            };
        }
    };
}]);

jqmModule.directive('html', function() {
    return {
        restrict: 'E',
        compile: function(cElement) {
            cElement.addClass("ui-mobile");
        }
    };
});

jqmModule.directive('jqmViewport', ['jqmCachingViewDirective', '$animator', '$history', function (ngViewDirectives, $animator, $history) {
    // Note: Can't use template + replace here,
    // as this might be used on the <body>, which is not supported by angular.
    // So we are calling the ngViewDirective#link functions directly...
    return {
        restrict: 'A',
        compile: function (cElement) {
            cElement.addClass("ui-mobile-viewport");
            return link;
        },
        // for ng-view
        terminal: true
    };
    function link(scope, iElement, iAttrs, ctrl) {
        /*jshint -W040:true*/
        var self = this,
            args = arguments;
        angular.forEach(ngViewDirectives, function (directive) {
            directive.link.apply(self, args);
        });

        scope.$on('$viewContentLoaded', function (scope) {
            // if animations are disabled,
            // add the "ui-page-active" css class manually.
            // E.g. needed for the initial page.
            if (!$animator.enabled()) {
                iElement.children().addClass("ui-page-active");
            }
        });
        scope.$on('$routeChangeStart', function (scope, newRoute) {
            // Use $routeChangeStart and not $watch:
            // Need to update the animate function before
            // ngView evaluates it!
            var transition,
                reverse = $history.activeIndex < $history.previousIndex;
            if (reverse) {
                transition = $history.urlStack[$history.previousIndex].transition;
            } else {
                transition = newRoute.transition;
                if (angular.isFunction(transition)) {
                    transition = transition(newRoute.params);
                }
                $history.urlStack[$history.activeIndex].transition = transition;
            }
            transition = transition || 'none';
            iAttrs.$set('ngAnimate', "'jqmPage-" + transition + (reverse?"-reverse":"")+"'");
        });
    }
}]);

/**
 * This directive is very similar to ngViewDirective.
 * However, it allows to cache views including their scopes using the `jqmViewCache`.
 * <p>
 * For this to work the semantics of routes were changed a little:
 *
 * 1. If a route for a cached template is activated, the template and it's scope are taken from the cache.
 *    If the template is not yet cached, it is compiled and then added to the cache.
 * 2. If a route is left, it's scope is disconnected, if it's activated, the scope gets reconnected.
 * 3. All templates that are in `$templateCache` are compiled with a new disconnected scope
 *    when this directive is created.
 * 4. Route controllers are created only on the first time it's route is activated.
 *    Afterwards, they may listen to the `$viewContentLoaded` to be notified that
 *    their route is activated again.
 * <p>
 * Implementation notes:
 *
 * - controllers are not instantiated on startup but on the first matching route, as it's not easy
 *   to determine them from the routes in advance, as routes may use default routes, functions for the
 *   `templateUrl` property, ...
 */
jqmModule.directive('jqmCachingView', ['$jqmViewCache', '$templateCache', '$route', '$anchorScroll', '$compile',
    '$controller', '$animator',
    function (jqmViewCache, $templateCache, $route, $anchorScroll, $compile, $controller, $animator) {
        return {
            restrict: 'ECA',
            terminal: true,
            link: function (scope, element, attr) {
                precompileTemplateCache();

                var lastScope,
                    onloadExp = attr.onload || '',
                    animate = $animator(scope, attr);

                scope.$on('$routeChangeSuccess', update);
                update();


                function destroyLastScope() {
                    if (lastScope) {
                        lastScope.$disconnect();
                        lastScope = null;
                    }
                }

                function clearContent() {

                    var contents = element.contents();
                    contents.remove = detachNodes;
                    animate.leave(contents, element);
                    destroyLastScope();

                    // Note: element.remove() would
                    // destroy all data associated to those nodes,
                    // e.g. widgets, ...
                    function detachNodes() {
                        /*jshint -W040:true*/
                        var i, node, parent;
                        for (i=0; i<this.length; i++) {
                            node = this[i];
                            parent = node.parentNode;
                            if (parent) {
                                parent.removeChild(node);
                            }
                        }
                    }
                }

                function update() {
                    var locals = $route.current && $route.current.locals,
                        template = locals && locals.$template;

                    if (template) {
                        clearContent();
                        var current = $route.current,
                            controller,
                            cacheEntry = compileTemplateIfNeeded(current.loadedTemplateUrl, template);

                        animate.enter(cacheEntry.elements, element);
                        lastScope = current.scope = cacheEntry.scope;
                        lastScope.$reconnect();
                        if (current.controller) {
                            controller = cacheEntry.controller;
                            locals.$scope = lastScope;
                            if (!controller) {
                                controller = cacheEntry.controller = $controller(current.controller, locals);
                                if (current.controllerAs) {
                                    lastScope[current.controllerAs] = controller;
                                }
                                element.children().data('$ngControllerController', controller);
                            }
                        }
                        lastScope.$emit('$viewContentLoaded');
                        lastScope.$eval(onloadExp);
                        // $anchorScroll might listen on event...
                        $anchorScroll();
                    } else {
                        clearContent();
                    }
                }

                function precompileTemplateCache() {
                    var urls = $templateCache.keys();
                    angular.forEach(urls, function (url) {
                        var template, ctrlFn;
                        template = $templateCache.get(url);
                        compileTemplateIfNeeded(url, template);
                    });
                }

                function compileTemplateIfNeeded(templateUrl, template) {
                    var enterElements, link, childScope,
                        locals = {},
                        cacheEntry;

                    cacheEntry = jqmViewCache.get(templateUrl);
                    if (!cacheEntry) {
                        enterElements = angular.element('<div></div>').html(template).contents();
                        link = $compile(enterElements);

                        childScope = scope.$new();
                        childScope.$disconnect();
                        link(childScope);
                        cacheEntry = {
                            elements: enterElements,
                            scope: childScope
                        };
                        if (templateUrl) {
                            jqmViewCache.put(templateUrl, cacheEntry);
                        }
                    }
                    return cacheEntry;
                }
            }
        };
    }]);
var PAGE_ANIMATION_DEFS = {
    none: {
        sequential: true,
        fallback: 'none'
    },
    slide: {
        sequential: false,
        fallback: 'fade'
    },
    fade: {
        sequential: true,
        fallback: 'fade'
    },
    pop: {
        sequential: true,
        fallback: 'fade'
    },
    slidefade: {
        sequential: true,
        fallback: 'fade'
    },
    slidedown: {
        sequential: true,
        fallback: 'fade'
    },
    slideup: {
        sequential: true,
        fallback: 'fade'
    },
    flip: {
        sequential: true,
        fallback: 'fade'
    },
    turn: {
        sequential: true,
        fallback: 'fade'
    },
    flow: {
        sequential: true,
        fallback: 'fade'
    }
};

registerPageAnimations(PAGE_ANIMATION_DEFS);

function registerPageAnimations(animations) {
    var type;
    for (type in animations) {
        registerPageAnimation(type, false, 'enter');
        registerPageAnimation(type, true, 'enter');
        registerPageAnimation(type, false, 'leave');
        registerPageAnimation(type, true, 'leave');
    }
}

function registerPageAnimation(transitionType, reverse, direction) {
    var ngName = "jqmPage-" + transitionType;

    if (reverse) {
        ngName += "-reverse";
    }
    ngName += "-" + direction;

    jqmModule.animation(ngName, ['$animationComplete', '$sniffer', function (animationComplete, $sniffer) {
        var degradedTransitionType = maybeDegradeTransition(transitionType),
            activePageClass = "ui-page-active",
            toPreClass = "ui-page-pre-in",
            addClasses = degradedTransitionType + (reverse ? " reverse" : ""),
            removeClasses = "out in reverse " + degradedTransitionType,
            viewPortClasses = "ui-mobile-viewport-transitioning viewport-" + degradedTransitionType,
            transitionDef = PAGE_ANIMATION_DEFS[degradedTransitionType];

        if (degradedTransitionType === 'none') {
            return {
                setup: setupNone,
                start: startNone
            };
        } else {
            if (direction === "leave") {
                addClasses += " out";
                removeClasses += " " + activePageClass;
                return {
                    setup: setupLeave,
                    start: start
                };
            } else {
                addClasses += " in " + activePageClass + " " + toPreClass;
                return {
                    setup: setupEnter,
                    start: start
                };
            }
        }

        // --------------

        function setupNone(element) {
            element = firstElement(element);
            if (direction === "leave") {
                element.removeClass(activePageClass);
            } else {
                element.addClass(activePageClass);
            }
        }

        function startNone(element, done) {
            done();
        }

        function setupEnter(element) {
            var synchronization;
            element = firstElement(element);
            synchronization = createSynchronizationIfNeeded(element);
            synchronization.enter(function(done) {
                // -----------
                // This code is from jquery mobile 1.3.1, function "createHandler".
                // Prevent flickering in phonegap container: see comments at #4024 regarding iOS
                element.css("z-index", -10);
                element.addClass(addClasses);
                // Restores visibility of the new page: added together with $to.css( "z-index", -10 );
                element.css("z-index", "");
                element.removeClass(toPreClass);
                // ------------
                animationComplete(element, function() {
                    element.removeClass(removeClasses);
                    done();
                });
            });
            return synchronization;
        }

        function setupLeave(element) {
            var synchronization;
            element = firstElement(element);
            synchronization = createSynchronizationIfNeeded(element);
            synchronization.leave(function(done) {
                element.addClass(addClasses);
                animationComplete(element, function() {
                    element.removeClass(removeClasses);
                    done();
                });
            });
            return synchronization;
        }

        function start(element, done, synchronization) {
            synchronization.bindEnd(done);
        }

        function createSynchronizationIfNeeded(el) {
            var parent = el.parent(),
                sync = parent.data("animationSync");
            if (!sync) {
                if (transitionDef.sequential) {
                    sync = sequentialSynchronization();
                } else {
                    sync = parallelSynchronization();
                }
                sync.bindStart(function() {
                    parent.addClass(viewPortClasses);
                });
                sync.bindEnd(function() {
                    parent.removeClass(viewPortClasses);
                    parent.data("animationSync", null);
                });
                parent.data("animationSync", sync);
            }
            return sync;
        }

        function firstElement(element) {
            var i;
            for (i = 0; i < element.length; i++) {
                if (element[i].nodeType === 1) {
                    return element.eq(i);
                }
            }
            return angular.element();
        }

        function maybeDegradeTransition(transition) {
            if (!$sniffer.cssTransform3d) {
                // Fall back to simple transition in browsers that don't support
                // complex 3d animations.
                transition = PAGE_ANIMATION_DEFS[transition].fallback;
            }
            if (!$sniffer.animations) {
                transition = "none";
            }
            return transition;
        }
    }]);

    function parallelSynchronization() {
        var start = latch(),
            end = latch(),
            runningCount = 0;
        return {
            enter: enter,
            leave: leave,
            bindStart: start.listen,
            bindEnd: end.listen
        };

        function enter(delegate) {
            setup(delegate);
        }

        function leave(delegate) {
            setup(delegate);
        }

        function setup(delegate) {
            start.notify();
            runningCount++;
            delegate(function () {
                runningCount--;
                if (runningCount === 0) {
                    end.notify();
                }
            });
        }

    }

    function sequentialSynchronization() {
        var start = latch(),
            end = latch(),
            enterDelegate,
            leaveDelegate;
        return {
            enter: enter,
            leave: leave,
            bindStart: start.listen,
            bindEnd: end.listen
        };

        function enter(delegate) {
            enterDelegate = delegate;
            start.notify();
            // setTimeout as the leave animation
            // to detect if a leave animation has been used.
            window.setTimeout(function () {
                if (!leaveDelegate) {
                    enterDelegate(function () {
                        end.notify();
                    });
                }
            }, 0);
        }

        function leave(delegate) {
            leaveDelegate = delegate;
            start.notify();
            delegate(function () {
                if (enterDelegate) {
                    enterDelegate(function () {
                        end.notify();
                    });
                } else {
                    end.notify();
                }
            });
        }
    }

    function latch() {
        var _listeners = [],
            _notified = false;
        return {
            listen: listen,
            notify: notify
        };

        function listen(callback) {
            if (_notified) {
                callback();
            } else {
                _listeners.push(callback);
            }
        }

        function notify() {
            if (_notified) {
                return;
            }
            var i;
            for (i = 0; i < _listeners.length; i++) {
                _listeners[i]();
            }
            _notified = true;
        }
    }
}


angular.module('jqm-templates', ['templates/jqmCheckbox.html']);

angular.module("templates/jqmCheckbox.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/jqmCheckbox.html",
    "\n" +
    "<div class=\"ui-checkbox\" ng-click=\"toggle()\" ng-class=\"{'ui-disabled': disabled}\">\n" +
    "  <label class=\"ui-btn ui-btn-corner-all ui-fullsize ui-btn-icon-left\"\n" +
    "   ng-class=\"checked ? 'ui-checkbox-on' : 'ui-checkbox-off'\"\n" +
    "   jqm-theme-class=\"ui-btn-up-$\">\n" +
    "    <span class=\"ui-btn-inner\">\n" +
    "      <span class=\"ui-btn-text\" ng-transclude></span>\n" +
    "      <span class=\"ui-icon ui-icon-shadow\"\n" +
    "       ng-class=\"checked ? 'ui-icon-checkbox-on' : 'ui-icon-checkbox-off'\">\n" +
    "      </span>\n" +
    "    </span>\n" +
    "  </label>\n" +
    "  <input type=\"checkbox\" ng-checked=\"checked\">\n" +
    "</div>\n" +
    "");
}]);
})(window, angular);
