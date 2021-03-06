var rxCheckboxPage = require('../rxCheckbox.page').rxCheckbox;
var exercise = require('../rxCheckbox.exercise');

describe('rxCheckbox', function () {
    before(function () {
        demoPage.go('#/component/rxCheckbox');
    });

    describe('(State) Valid Enabled Checked', exercise.rxCheckbox({
        cssSelector: "#chkValidEnabledOne",
        disabled: false,
        selected: true,
        valid: true
    }));

    describe('(State) Valid Enabled UnChecked', exercise.rxCheckbox({
        cssSelector: "#chkValidEnabledTwo",
        disabled: false,
        selected: false,
        valid: true
    }));

    describe('(State) Valid Ng-Disabled Checked', exercise.rxCheckbox({
        cssSelector: "#chkValidNgDisabledOne",
        disabled: true,
        selected: true,
        valid: true
    }));

    describe('(State) Valid Ng-Disabled Unchecked', exercise.rxCheckbox({
        cssSelector: "#chkValidNgDisabledTwo",
        disabled: true,
        selected: false,
        valid: true
    }));

    describe('(State) Valid Disabled Checked', exercise.rxCheckbox({
        cssSelector: "#chkValidDisabledOne",
        disabled: true,
        selected: true,
        valid: true
    }));

    describe('(State) Valid Disabled Unchecked', exercise.rxCheckbox({
        cssSelector: "#chkValidDisabledTwo",
        disabled: true,
        selected: false,
        valid: true
    }));

    describe('(State) Invalid Enabled Checked', exercise.rxCheckbox({
        cssSelector: "#chkInvalidEnabledOne",
        disabled: false,
        selected: true,
        valid: false
    }));

    describe('(State) Invalid Enabled UnChecked', exercise.rxCheckbox({
        cssSelector: "#chkInvalidEnabledTwo",
        disabled: false,
        selected: false,
        valid: false
    }));

    describe('(State) Invalid Ng-Disabled Checked', exercise.rxCheckbox({
        cssSelector: "#chkInvalidNgDisabledOne",
        disabled: true,
        selected: true,
        valid: false
    }));

    describe('(State) Invalid Ng-Disabled Unchecked', exercise.rxCheckbox({
        cssSelector: "#chkInvalidNgDisabledTwo",
        disabled: true,
        selected: false,
        valid: false
    }));

    describe('(State) Invalid Disabled Checked', exercise.rxCheckbox({
        cssSelector: "#chkInvalidDisabledOne",
        disabled: true,
        selected: true,
        valid: false
    }));

    describe('(State) Invalid Disabled Unchecked', exercise.rxCheckbox({
        cssSelector: "#chkInvalidDisabledTwo",
        disabled: true,
        selected: false,
        valid: false
    }));

    describe('Show/Hide Input', function () {
        var chkSure, chkReallySure;

        before(function () {
            chkSure = rxCheckboxPage.initialize($('#chkAmSure'));
            chkReallySure = rxCheckboxPage.initialize($('#chkAmReallySure'));
        });

        describe('"Are you sure?"', function () {
            it('should be displayed', function () {
                expect(chkSure.isDisplayed()).to.eventually.be.true;
            });

            describe('when checked', function () {
                before(function () {
                    chkSure.select();
                });

                it('should be valid', function () {
                    expect(chkSure.isValid()).to.eventually.be.true;
                });

                it('should show "Are you REALLY sure?"', function () {
                    expect(chkReallySure.isDisplayed()).to.eventually.be.true;
                });
            });

            describe('when unchecked', function () {
                before(function () {
                    chkSure.deselect();
                });

                it('should not be valid', function () {
                    expect(chkSure.isValid()).to.eventually.be.false;
                });

                it('should not show "Are you REALLY sure?"', function () {
                    expect(chkReallySure.isDisplayed()).to.eventually.be.false;
                });
            });
        });
    });

    describe('Destroy Input', function () {
        var chkRemove, chkRemoveable;

        before(function () {
            chkRemove = rxCheckboxPage.initialize($('#chkRemoveCheckbox'));
            chkRemoveable = rxCheckboxPage.initialize($('#chkRemoveable'));
        });

        describe('when checked', function () {
            before(function () {
                chkRemove.select();
            });

            describe('Static Checkbox', function () {
                it('should not exist', function () {
                    expect(chkRemoveable.isPresent()).to.eventually.be.false;
                });
            });
        });

        describe('when unchecked', function () {
            before(function () {
                chkRemove.deselect();
            });

            describe('Static Checkbox', function () {
                it('should exist', function () {
                    expect(chkRemoveable.isPresent()).to.eventually.be.true;
                });
            });
        });
    });
});
