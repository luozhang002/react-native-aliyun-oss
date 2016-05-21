var NativeModules = require('react-native').NativeModules;
import { isEqual } from 'lodash'
import moment from 'moment'
const pluginName = 'AliyunOSS'
const pluginInstanceName = 'AliOssPlugin'
/*
  Utility that avoids leaking the arguments object. See
  https://www.npmjs.org/package/argsarray
 */
var plugin = {}
console.log('NativeModules[pluginName] ', NativeModules['RCTAliOSSProvider'])
argsArray = function(fun) {
  return function() {
    var args, i, len;
    len = arguments.length;
    if (len) {
      args = [];
      i = -1;
      while (++i < len) {
        args[i] = arguments[i];
      }
      return fun.call(this, args);
    } else {
      return fun.call(this, []);
    }
  };
};

plugin.exec = function(method, params, success, error) {
  if (plugin.AliOssPlugin.DEBUG){
    console.log(`${pluginName}.` + method + '(' + JSON.stringify(params) + ')');
  }


  NativeModules['AliyunOSS'][method](params,success,error);
};




function enablePromiseRuntime(enable){
  if (enable){
    createPromiseRuntime();
  } else {
    createCallbackRuntime();
  }
};



var AliOssPlugin = function() {
  this.instancePlugin = undefined
  this.options = {}
}

AliOssPlugin.prototype.setUpClient = function(params:Map,success:Function,error:Function) {
  success = success || function(){};
  error = error || function(){};
  if (!isEqual(this.options,params)) {
    plugin.exec('setUpClient',params,success,error)
    this.options = Object.assign({},params)
  }
  else{
    const isTimeout = moment(this.options.timeout).isBefore(Date.now())
    if (!isTimeout) {
      success({status:{code:0,msg:'成功'},para:params})
    }
    else {
      error({status:{code:100,msg:'token失效'},para:params})
    }
  }
}

AliOssPlugin.prototype.putByParams = function(params:Map,success:Function,error:Function) {
  success = success || function(){};
  error = error || function(){};
  plugin.exec('putByParams',params,success,error)
}

var AliOssFactory = function(){

}

AliOssFactory.prototype.fetchClient = function(config,success,error){
  if (typeof this.instancePlugin === 'undefined') {
    this.instancePlugin = new AliOssPlugin()
  }
  this.instancePlugin.setUpClient(config,success,error)
  return this.instancePlugin
}

AliOssFactory.prototype.DEBUG = function(debug) {
  console.log("Setting debug to:",debug);
  plugin.AliOssPlugin.DEBUG = debug;
};

AliOssFactory.prototype.enablePromiseRuntime = enablePromiseRuntime

plugin = {
  AliOssFactory : AliOssFactory,
  AliOssPlugin : AliOssPlugin
};

plugin.exec = function(method, params, success, error) {
  if (plugin.AliOssPlugin.DEBUG){
    console.log(`${pluginName}.` + method + '(' + JSON.stringify(params) + ')');
  }
  NativeModules[pluginName][method](params,success,error);
};

var originalFns = {};


var config = [
  [false,"AliOssPlugin","setUpClient",false,false,true],
  [false,"AliOssPlugin","putByParams",false,false,true]
];

config.forEach(entry => {
  let [returnValueExpected,prototype,fn]= entry;
  console.log('plugins ',returnValueExpected,prototype,fn)
  let originalFn = plugin[prototype].prototype[fn];
  originalFns[prototype + "." + fn] = originalFn;
});

function createCallbackRuntime() {
  config.forEach(entry => {
    let [returnValueExpected,prototype,fn,argsNeedPadding,reverseCallbacks,rejectOnError]= entry;
    plugin[prototype].prototype[fn] = originalFns[prototype + "." + fn];
  });
  console.log("Callback based runtime ready");
};

function createPromiseRuntime() {
  config.forEach(entry => {
    let [returnValueExpected,prototype,fn,argsNeedPadding,reverseCallbacks,rejectOnError]= entry;
    let originalFn = plugin[prototype].prototype[fn]
    plugin[prototype].prototype[fn] = function(...args){
      if (argsNeedPadding && args.length == 1){
        args.push([]);
      }
      var promise = new Promise((resolve,reject) => {
        let success = function(...args){
          if (!returnValueExpected) {
           return resolve(args);
          }
        };
        let error = function(err){
          console.log('error: ',fn,...args,arguments);
          if (rejectOnError) {
            reject(err);
          }
          return false;
        };
        var retValue = originalFn.call(this,...args,reverseCallbacks ? error : success, reverseCallbacks ? success : error);
        if (returnValueExpected){
          return resolve(retValue);
        }
      });

      return promise;
    }
  });
  console.log("Promise based runtime ready");
};

export default (new AliOssFactory())
