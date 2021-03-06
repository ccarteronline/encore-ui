function rxMiscCtrl ($scope, $timeout, $q, rxNotify, rxAutoSave) {
    $scope.formData = {
        checkbox: false,
        name: '',
        description: '',
        sensitive: ''
    };

    var autosave = rxAutoSave($scope, 'formData', {
        exclude: ['sensitive'],
        ttl: 86400000
    });

    $scope.status = {
        loading: false,
        disable: false,
        deferredLoading: false,
        deferredDisable: false
    };

    // Clear with an explicit autosave.clear() call
    $scope.clearStorage = function () {
        $scope.status.loading = true;
        $timeout(function () {
            $scope.status.loading = false;
            autosave.clear();
            rxNotify.add("rxAutoSave data has been cleared! Navigate away and return, and the form won't be auto-populated", {
                type: 'success'
            });
        }, 1000);
    };

    // Clear by resolving the associated promise
    $scope.deferredClear = function () {
        var deferred = $q.defer();

        autosave.clearOnSuccess(deferred.promise);
        $scope.status.deferredLoading = true;

        $timeout(function () {
            $scope.status.deferredLoading = false;
            deferred.resolve();
            rxNotify.add("rxAutoSave data has been cleared! Navigate away and return, and the form won't be auto-populated", {
                type: 'success'
            });
        }, 1000);
    };
}
