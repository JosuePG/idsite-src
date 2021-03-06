'use strict';

angular.module('stormpathIdpApp')
  .controller('LoginCtrl', function ($scope,Stormpath,$window) {
    console.log("---> stormath: ", Stormpath);
    $scope.ready = false;
    $scope.canRegister = true;
    $scope.errors = {
      badLogin: false,
      notFound: false,
      userMessage: false,
      unknown: false,
      organizationNameKeyRequired: false,
      organizationNameKeyInvalid: false
    };

    Stormpath.init.then(function initSuccess(){
      $scope.organizationNameKey = Stormpath.getOrganizationNameKey();
      $scope.showOrganizationField = Stormpath.client.jwtPayload.sof;
      $scope.disableOrganizationField = $scope.organizationNameKey !== '';
      $scope.canRegister = !!Stormpath.idSiteModel.passwordPolicy;
      $scope.providers = Stormpath.providers;
      //GET THE APPLICATION NAME FROM THE CLIENT
      $scope.AKQA_application = Stormpath.client.jwtPayload.state;

changeCSS(Stormpath.client.jwtPayload.state);

      $scope.ready = true;
      $scope.hasSocial = $scope.providers.length > 0;
      if(Stormpath.getProvider('facebook')){
        initFB();
      }
    });

    var googleIsSignedIn = false;
    function initFB(){
      $window.fbAsyncInit = function() {
        var FB = $window.FB;
        FB.init({
          appId: Stormpath.getProvider('facebook').clientId,
          xfbml: true,
          status: true,
          version: 'v2.0'
        });
      };
      (function(d, s, id){
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {
          return;
        }
        js = d.createElement(s);
        js.id = id;
        js.src = '//connect.facebook.net/es_LA/sdk.js';
        fjs.parentNode.insertBefore(js, fjs);
      }($window.document, 'script', 'facebook-jssdk'));
    }

function changeCSS(appName){
    var oldlink = document.getElementsByTagName("link").item(0);
    console.log("old------>",oldlink);

    var newlink = document.createElement("link");
    newlink.setAttribute("rel", "stylesheet");
    newlink.setAttribute("type", "text/css");
    newlink.setAttribute("href", appName);

console.log("new------>",newlink);
    document.getElementsByTagName("head").item(0).replaceChild(newlink, oldlink);
}



function changeCSS(appName){

console.log("D-bug-----------, appName: ", appName);
    var oldlink = document.getElementsByTagName("link").item(0);
console.log("D-bug-----------, oldlink: ", oldlink);
    var newlink = document.createElement("link");
    newlink.setAttribute("rel", "stylesheet");
    newlink.setAttribute("type", "text/css");
    newlink.setAttribute("href", (appName + ".css");
console.log("D-bug-----------, newlink: ", newlink);
    document.getElementsByTagName("head").item(0).replaceChild(newlink, oldlink);
}

    function clearErrors(){
      Object.keys($scope.errors).map(function(k){$scope.errors[k]=false;});
    }

    function showError(err){
      if(err.status===400){
        if(err.code && err.code===2014){
          $scope.errors.organizationNameKeyInvalid = true;
        }else{
          $scope.errors.badLogin = true;
        }
      }
      else if(err.status===404){
        $scope.errors.notFound = true;
      }
      else if(err.userMessage || err.message){
        $scope.errors.userMessage = err.userMessage || err.message;
      }else{
        $scope.errors.unknown = true;
      }
    }

    function errHandler(err){
      $scope.submitting = false;
      if(err){
        showError(err);
      }
    }

    $scope.submit = function(){
      clearErrors();
      if($scope.showOrganizationField && !$scope.organizationNameKey){
        $scope.errors.organizationNameKeyRequired = true;
      }
      else if($scope.username && $scope.password){
        $scope.submitting = true;
        var data = {
          login: $scope.username.trim(),
          password: $scope.password.trim()
        };
        if($scope.organizationNameKey){
          data.accountStore = {
            nameKey: $scope.organizationNameKey
          };
        }
        if(Stormpath.client.jwtPayload.ash){
          data.accountStore = {
            href: Stormpath.client.jwtPayload.ash
          };
        }
        Stormpath.login(data,errHandler);
      }else{
        $scope.errors.emailPasswordRequired = true;
      }
    };

    $scope.googleLogin = function(){
      var gapi = $window.gapi;
      if(!gapi){
        return;
      }
      clearErrors();
      var params = {
        clientid: Stormpath.getProvider('google').clientId,
        scope: 'email',
        cookiepolicy: 'single_host_origin',
        callback: function(authResult){
          if (!googleIsSignedIn && authResult.status.signed_in && authResult.status.method === 'PROMPT') {
            googleIsSignedIn = true;
            Stormpath.register({
              providerData: {
                providerId: 'google',
                accessToken: authResult.access_token
              }
            },errHandler);
          }
        }
      };

      gapi.auth.signIn(params);
    };

    function fbRegister(response){
      Stormpath.register({
        providerData: {
          providerId: 'facebook',
          accessToken: response.authResponse.accessToken
        }
      },errHandler);
    }

    $scope.facebookLogin = function(){
      var FB = $window.FB;

      FB.login(function(response) {
        if(response.status === 'connected'){
          fbRegister(response);
        }
      },{scope: 'email'});

    };

    $scope.providerLogin = function(providerId){
      var fn = $scope[providerId+'Login'];
      if(typeof fn!=='function'){
        console.error('provider login function \'' + providerId + '\' is not implemented');
      }else{
        fn();
      }
    };

    return $scope;
  });
