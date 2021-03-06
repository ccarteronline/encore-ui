/* jshint node: true */

describe('rxDOMHelper', function () {
    var rxjq;

    var windowMock = {
        getComputedStyle: sinon.stub()
            .returns({ width: '10px', height: '20px' })
    };

    beforeEach(function () {
        module('encore.ui.rxMisc');

        module(function ($provide) {
            $provide.value('$window', windowMock);
        });

        inject(function (rxDOMHelper) {
            rxjq = rxDOMHelper;
        });
    });

    it('should accept raw DOM objects', function () {
        var div = angular.element('<div></div>'),
            raw = div[0];

        rxjq.width(raw);
        expect(windowMock.getComputedStyle).to.have.been.calledWith(raw);
    });

    it('should accept jquery lite objects and convert them to raw DOM', function () {
        var div = angular.element('<div></div>'),
            raw = div[0];

        rxjq.width(div);
        expect(windowMock.getComputedStyle).to.have.been.calledWith(raw);
    });

    it('should allow query selectors for finding nested objects', function () {
        var el = angular.element('<div><span><h1 class="title">Title!</h1></span></div>'),
            title = rxjq.find(el, '.title');

        expect(title.text()).to.equal('Title!');
        expect(title[0].nodeName).to.equal('H1');
    });

    it('should wrap a single element', function () {
        var span = $('<span class="hi">Test</span>');
        var div = $('<div></div>');
        rxjq.wrapAll(div[0], span[0]);
        expect(div.find('span').text()).to.equal('Test');
        expect(div.find('span').hasClass('hi')).to.be.true;
    });

    it('should wrap embedded elements', function () {
        var span = $('<span class="hi"><span class="foo">Test</span></span>');
        var div = $('<div></div>');
        rxjq.wrapAll(div[0], span[0]);
        expect(div.find('span.hi span.foo').text()).to.equal('Test');
        expect(div.find('span.hi span.foo').hasClass('foo')).to.be.true;
    });

    it('should work for select elements', function () {
        var select = $('<select><option class="foo">Foo</option><option class="bar">Bar</option></select>');
        var div = $('<div></div>');
        rxjq.wrapAll(div[0], select[0]);
        expect(div.find('select > option.foo').text()).to.equal('Foo');
        expect(div.find('select > option.foo').hasClass('foo')).to.be.true;
        expect(div.find('select > option.bar').text()).to.equal('Bar');
        expect(div.find('select > option.bar').hasClass('bar')).to.be.true;
    });
});

describe('titleize', function () {
    var titleize;

    beforeEach(function () {
        module('encore.ui.rxMisc');

        inject(function (titleizeFilter) {
            titleize = titleizeFilter;
        });
    });

    it('replaces underscores with spaces', function () {
        expect(titleize('_A_B_')).to.equal(' A B ');
    });

    it('converts the string to title case', function () {
        expect(titleize('a bcD_e')).to.equal('A Bcd E');
    });

});

describe('rxAutoSave', function () {
    var $rootScope, $q, $timeout, scope, rxAutoSave, a, b, LocalStorage, SessionStorage,
        now;

    var url;

    var $location = {
        url: function () {
            return url;
        }
    };
    
    var initializeScope = function () {
        scope.$destroy();
        scope.$digest();
        scope = $rootScope.$new();
        scope.formA = { foo: '' };
        scope.formB = { foo: '' };
        scope.$digest();
    };
    
    var flush = function () {
        scope.$digest();
        $timeout.flush();
    };

    beforeEach(function () {
        module('encore.ui.rxMisc');
        module('encore.ui.rxLocalStorage');
        module('encore.ui.rxSessionStorage');
        
        module(function ($provide) {
            $provide.value('$location', $location);
        });

        url = 'foo/bar?x=y';
        
        inject(function (_$rootScope_, _$q_, _$timeout_, _rxAutoSave_, _LocalStorage_, _SessionStorage_) {
            $rootScope = _$rootScope_;
            $q = _$q_;
            $timeout = _$timeout_;
            rxAutoSave = _rxAutoSave_;
            LocalStorage = _LocalStorage_;
            SessionStorage = _SessionStorage_;
            scope = $rootScope.$new();
            LocalStorage.clear();
            SessionStorage.clear();
        });

        now = sinon.stub(_, 'now');
        // Initialize the scope with two empty forms,
        // and immediately tie them to rxAutoSave
        initializeScope();

        a = rxAutoSave(scope, 'formA');
        b = rxAutoSave(scope, 'formB');
        
        scope.$digest();
    });

    afterEach(function () {
        now.restore();
    });

    it('should store a value in LocalStorage on change', function () {
        // have rxAutoSave save the value
        scope.formA.foo = 'bar';
        scope.formB.foo = 'baz';
        flush();

        // Explicitly destroy the scope, i.e. "navigate away from the page"
        // and create a new scope
        initializeScope();

        // Automatically load the last stored value into the scope
        a = rxAutoSave(scope, 'formA');
        b = rxAutoSave(scope, 'formB');
        scope.$digest();

        expect(scope.formA.foo).to.equal('bar');
        expect(scope.formB.foo).to.equal('baz');

    });

    it('should clear out all values for the current page with clear()', function () {
        // have rxAutoSave store 'bar'
        scope.formA.foo = 'bar';
        flush();

        a.clear();
        scope.$digest();

        // Recreate the scope, initialize it to ''. Because we've
        // done clear() on the previous rxAutoSave, it shouldn't have
        // the 'bar' stored anymore
        initializeScope();
        a = rxAutoSave(scope, 'formA');
        scope.$digest();

        expect(scope.formA.foo).to.equal('');
    });

    it('should not load values on creation if you pass load: false', function () {
        // have rxAutoSave store 'bar'
        scope.formA.foo = 'bar';
        flush();

        // Recreate the scope, initialize it to ''. It should
        // not load the previous formA value in because we're
        // passing `load: false`
        initializeScope();
        scope.formA = { foo: '' };
        a = rxAutoSave(scope, 'formA', { load: false });
        flush();

        expect(scope.formA.foo).to.equal('');
    });

    it('should load values on creation if you pass in a truthfully resolving promise', function () {
        var deferred = $q.defer();

        scope.formA.foo = 'bar';
        flush();

        // Recreate the scope, initialize it to ''. It should
        // not load the previous formA value in because we're
        // passing `load: false`
        initializeScope();
        a = rxAutoSave(scope, 'formA', { load: deferred.promise });

        deferred.resolve(true);
        $timeout.flush();

        expect(scope.formA.foo).to.equal('bar');
    });
    
    it('should not load values on creation if you pass falsely resolving promise', function () {
        var deferred = $q.defer();
        // have rxAutoSave store 'bar'
        scope.formA.foo = 'bar';
        flush();

        // Recreate the scope, initialize it to ''. It should
        // not load the previous formA value in because we're
        // passing `load: false`
        initializeScope();
        a = rxAutoSave(scope, 'formA', { load: deferred.promise });
        deferred.resolve(false);
        flush();

        expect(scope.formA.foo).to.equal('');
    });

    it('should let you automatically clear() on a successful promise', function () {
        // have rxAutoSave store 'bar'
        scope.formA.foo = 'bar';
        flush();

        
        // Load the stored values into a new scope, and
        // tell it to clear the stored values on a successful
        // promise
        initializeScope();
        var deferred = $q.defer();
        a = rxAutoSave(scope, 'formA', {
            clearOnSuccess: deferred.promise
        });
        scope.$digest();
        expect(scope.formA.foo, 'sanity check').to.equal('bar');
        
        deferred.resolve();
        scope.$digest();

        // New scope, and this time it shouldn't load 'bar'
        // because it was cleared by the successful promise
        initializeScope();
        a = rxAutoSave(scope, 'formA');
        expect(scope.formA.foo, 'empty localstorage').to.equal('');
    });

    it('should let you exclude individual values from being loaded', function () {
        // have rxAutoSave store 'bar'
        scope.formA.foo = 'bar';
        scope.formA.keepAround = '123';
        flush();
        
        initializeScope();
        a = rxAutoSave(scope, 'formA', {
            exclude: ['foo']
        });
        scope.$digest();
        expect(scope.formA.foo, 'should have erased `bar`').to.equal('');
        expect(scope.formA.keepAround, 'should have kept `123`').to.equal('123');
    });

    it('should let you exclude individual values from being saved', function () {
        scope.formA.foo = 'bar';
        scope.formA.shouldMaintain = '123';
        flush();
        
        initializeScope();
        a = rxAutoSave(scope, 'formA', {
            exclude: ['shouldMaintain']
        });

        flush();

        // It _should_ save this value
        scope.formA.foo = 'a new value';

        // It should _not_ save this value
        scope.formA.shouldMaintain = '456';
        flush();
        
        initializeScope();
        a = rxAutoSave(scope, 'formA');
        flush();

        expect(scope.formA.foo, 'should changed `foo`').to.equal('a new value');
        expect(scope.formA.shouldMaintain, 'should have kept `123`').to.equal('123');
    });

    it('should key stored values on URLs', function () {
        // store a value on the default URL
        scope.formA.foo = 'bar';
        flush();

        var oldUrl = url;

        // Navigate to a new URL with the same form structure
        url = 'a/new/url';
        initializeScope();
        a = rxAutoSave(scope, 'formA');
        scope.$digest();
        expect(scope.formA.foo, 'no data for this url').to.equal('');

        // Navigate back to the original URL
        url = oldUrl;
        initializeScope();
        a = rxAutoSave(scope, 'formA');
        scope.$digest();
        expect(scope.formA.foo, 'stored data for this url').to.equal('bar');
    });

    it('should allow key manipulation for stored values on URLs', function () {
        // store a value on the default URL
        scope.formA.foo = 'bar';
        flush();

        var oldUrl = url;

        var opts = {
            keyShaping: function (key) {
                return key.replace('invalid', '');
            }
        };

        // Navigate to a new URL with the same form structure
        url = oldUrl + 'invalid';
        initializeScope();
        a = rxAutoSave(scope, 'formA', opts);
        scope.$digest();
        expect(scope.formA.foo, 'stored data for this url').to.equal('bar');

        // Navigate back to the original URL
        url = oldUrl;
        initializeScope();
        a = rxAutoSave(scope, 'formA', opts);
        scope.$digest();
        expect(scope.formA.foo, 'stored data for this url').to.equal('bar');
    });

    it('should let you add a clear promise via clearOnSuccess()', function () {
        // have rxAutoSave store 'bar'
        scope.formA.foo = 'bar';
        flush();

        // Load the stored values into a new scope
        initializeScope();
        a = rxAutoSave(scope, 'formA');
        scope.$digest();
        
        // Tell it to clear the stored values on a successful promise
        var deferred = $q.defer();
        a.clearOnSuccess(deferred.promise);
        expect(scope.formA.foo, 'sanity check').to.equal('bar');
        
        deferred.resolve();
        scope.$digest();

        // New scope, and this time it shouldn't load 'bar'
        // because it was cleared by the successful promise
        initializeScope();
        a = rxAutoSave(scope, 'formA');
        expect(scope.formA.foo, 'empty localstorage').to.equal('');
    });

    it('should automatically clear the saved values after a ttl has expired', function () {
        // Load the stored values into a new scope, but have them expire
        // after a second
        now.returns(2000);
        initializeScope();
        a = rxAutoSave(scope, 'formA', {
            ttl: 1000
        });
        scope.formA.foo = 'bar';
        flush();
        
        now.returns(3001);
        initializeScope();
        a = rxAutoSave(scope, 'formA');
        expect(scope.formA.foo, 'empty localstorage').to.equal('');
    });

    it('should not clear saved values if the expiry time has not occurred', function () {
        now.returns(0);
        initializeScope();
        a = rxAutoSave(scope, 'formA', {
            ttl: 1000
        });
        scope.formA.foo = 'bar';
        flush();
        
        // One millisecond short of expiring
        now.returns(999);
        initializeScope();
        a = rxAutoSave(scope, 'formA');
        flush();
        expect(scope.formA.foo, 'still in localstorage').to.equal('bar');
        
    });

    it('should default to clearing out values after two days', function () {
        var twoDays = 60 * 60 * 24 * 2;
        now.returns(0);
        initializeScope();
        a = rxAutoSave(scope, 'formA');
        scope.formA.foo = 'bar';
        flush();
        
        // Check that the value is still there in twoDays-1 seconds
        now.returns(twoDays - 1);
        initializeScope();
        a = rxAutoSave(scope, 'formA');
        flush();
        expect(scope.formA.foo, 'still in localstorage').to.equal('bar');
        
        // When we "loaded" the page above, it reset the expiry time to
        // now() + ttl. So to cause an expiry, we have to set the now.returns
        // to what it was the last time, plus the twoDays
        now.returns(now() + twoDays);
        initializeScope();
        a = rxAutoSave(scope, 'formA');
        expect(scope.formA.foo, 'not in localstorage').to.equal('');
    });

    it('should save and load values from SessionStorage', function () {
        // Automatically load the last stored value into the scope
        a = rxAutoSave(scope, 'formA', { storageBackend: SessionStorage });
        b = rxAutoSave(scope, 'formB', { storageBackend: SessionStorage });
        flush();

        scope.formA.foo = 'bar';
        scope.formB.foo = 'baz';
        flush();

        // Explicitly destroy the scope, i.e. "navigate away from the page"
        // and create a new scope
        initializeScope();

        a = rxAutoSave(scope, 'formA', { storageBackend: SessionStorage });
        b = rxAutoSave(scope, 'formB', { storageBackend: SessionStorage });
        flush();

        expect(scope.formA.foo).to.equal('bar');
        expect(scope.formB.foo).to.equal('baz');
    });

    it('should debounce the $watch function',  function () {
        $timeout.flush();
        scope.formA.foo = 'bar';
        $timeout.flush(500);
        expect(a.getStoredValue().foo, 'debounce has not fired').to.equal('');

        // An addition 500ms gives us a full 1000ms, at which point the debounce should fire
        $timeout.flush(500);
        expect(a.getStoredValue().foo, 'debounce fired').to.equal('');
    });

    it('should let you disable automatic saving', function () {
        initializeScope();
        a = rxAutoSave(scope, 'formA', {
            save: false
        });

        scope.formA.foo = 'bar';

        flush();

        expect(a.getStoredValue().foo, 'should not have written to storage').to.equal('');

        a.save();
        expect(a.getStoredValue().foo).to.equal('bar');
    });

});
