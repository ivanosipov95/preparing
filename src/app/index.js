'use strict'

angular.module('app', ['ui.router'])
    .controller('main', ($scope) => {
        $scope.test = 'eeee;';
        console.log('hello again');
    });
