/* global angular */
(function () {
	"use strict";

	angular
		.module('__MODULE__.core')
		.factory('HttpInterceptor', function (CONFIG, $q, $log, $injector, NotificationService, LoadingService) {

			var LOG = $log.getInstance('HttpInterceptor');

			return {
				'request': handleRequest,
				'requestError': handleRequestError,
				'response': handleResponse,
				'responseError': handleResponseError
			};

			function handleRequest(config) {
				if (http().api.isApiCall(config.url) && !isSilent(config)) {
					LoadingService.start();
				}
				return config;
			}

			function handleRequestError(rejection) {
				return $q.reject(rejection);
			}

			function handleResponse(response) {
				var $http = http();
				if ($http.api.isApiCall(response.config.url)) {
					LoadingService.stop();
				}
				// Unwrap api responses
				if (response.data && $http.api.isApiCall(response.config.url)) {
					return response.data;
				} else {
					return response;
				}
			}

			function handleResponseError(rejection) {
				var $http = http();
				if ($http.api.isApiCall(rejection.config.url)) {
					LoadingService.stop();
				}
				if (rejection.data && rejection.data.error && rejection.data.error.errors) {
					rejection.data.error.errors.forEach(function (error, index) {
						NotificationService.add(error.messageSeverity, 'error.business.' + error.messageKey);
						handleOptimisticLockingException(error);
					});
				} else if(!isSilent(rejection.config)) {
					NotificationService.add('error', 'error.http.status.' + rejection.status);
				}
				LOG.error(rejection);
				return $q.reject(rejection);
			}

			function handleOptimisticLockingException(error) {
				if (error.messageKey === 'ObjectOptimisticLockingFailureException') {
					// Reload state:
					var $state = state();
					$state.go($state.current.name, {}, {reload: true});
				}
			}

			function isSilent(config) {
				return config && config.data && config.data.silent;
			}

			// Others services are injected on demand in order to prevent circular dependency during factory creation:
			function http(){
				return $injector.get('$http');
			}
			function state(){
				return $injector.get('$state');
			}
		});
}());
