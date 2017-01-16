var getParamStr = function(url) {
  if (!url) {
    return;
  }
  var urlParts = url.split("?");
  var pathname = urlParts[0];
  var urlParamString = url.substring(pathname.length + 1, url.length);
  return urlParamString;
}

var getParams = function(url) {
  var params = [];
  var urlParamString = getParamStr(url);
  if (!urlParamString) {
      return params;
  }
  params = urlParamString.split("&");
  return params;
}

var getParamMap = function(url) {
  var map = {};

  var params = getParams(url);

  params.forEach((val, index) => {
    var kvs = val.split("=");
    var paramName = kvs[0];
    var value = val.substring(paramName.length + 1, val.length);
    map[paramName] = value;
  });

  return map;
}

var getParam = function(url, key) {
  var map = getParamMap(url);
  return map[key];
}

var addParam = function(url, paramStr) {
  if (getParamStr(url)) {
    url = url + "&" + paramStr;
  } else {
    url = url + "?" + paramStr;
  }
  return url;
}

var url = {
  getParamMap: getParamMap,
  addParam: addParam,
  getParam: getParam
}

export default url;
