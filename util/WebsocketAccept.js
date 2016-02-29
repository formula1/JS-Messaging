'use strict';

var url = require('url');

var headerSanitizeRegExp = /[\r\n]/g;
var controlCharsAndSemicolonRegEx = /[\x00-\x20\x3b]/g;
var cookieNameValidateRegEx = /([\x00-\x20\x22\x28\x29\x2c\x2f\x3a-\x3f\x40\x5b-\x5e\x7b\x7d\x7f])/;
var cookieValueValidateRegEx = /[^\x21\x23-\x2b\x2d-\x3a\x3c-\x5b\x5d-\x7e]/;
var cookieValueDQuoteValidateRegEx = /^"[^"]*"$/;

var cleanupFailedConnection;
var separators;

module.exports.parseRequest = function(httpRequest, resource, serverConfig, webSocketVersion){
  var parsedRequest = {};

  // Decode URL
  parsedRequest.resourceURL = url.parse(resource, true);

  parsedRequest.host = httpRequest.headers['host'];
  if(!parsedRequest.host){
    throw new Error('Client must provide a Host header.');
  }

  parsedRequest.key = httpRequest.headers['sec-websocket-key'];
  if(!parsedRequest.key){
    throw new Error('Client must provide a value for Sec-WebSocket-Key.');
  }

  parsedRequest.webSocketVersion = parseInt(httpRequest.headers['sec-websocket-version'], 10);

  if(!parsedRequest.webSocketVersion || isNaN(parsedRequest.webSocketVersion)){
    throw new Error('Client must provide a value for Sec-WebSocket-Version.');
  }

  switch(this.webSocketVersion){
    case 8:
    case 13:
      break;
    default:
      var e = new Error(
      `Unsupported websocket client version: ${this.webSocketVersion} Only versions 8 and 13 are supported.`
      );
      e.httpCode = 426;
      e.headers = {
        'Sec-WebSocket-Version': '13',
      };
      throw e;
  }

  if(webSocketVersion === 13){
    parsedRequest.origin = httpRequest.headers['origin'];
  }else if(webSocketVersion === 8){
    parsedRequest.origin = httpRequest.headers['sec-websocket-origin'];
  }

  // Protocol is optional.
  var protocolString = httpRequest.headers['sec-websocket-protocol'];
  parsedRequest.protocolFullCaseMap = {};
  parsedRequest.requestedProtocols = [];
  if(protocolString){
    var requestedProtocolsFullCase = protocolString.split(headerValueSplitRegExp);
    requestedProtocolsFullCase.forEach(function(protocol){
      var lcProtocol = protocol.toLocaleLowerCase();
      self.requestedProtocols.push(lcProtocol);
      self.protocolFullCaseMap[lcProtocol] = protocol;
    });
  }

  if(!serverConfig.ignoreXForwardedFor && httpRequest.headers['x-forwarded-for']){
    var immediatePeerIP = parsedRequest.remoteAddress;
    parsedRequest.remoteAddresses = httpRequest.headers['x-forwarded-for']
    .split(xForwardedForSeparatorRegExp);
    parsedRequest.remoteAddresses.push(immediatePeerIP);
    parsedRequest.remoteAddress = parsedRequest.remoteAddresses[0];
  }

  // Extensions are optional.
  var extensionsString = httpRequest.headers['sec-websocket-extensions'];
  parsedRequest.requestedExtensions = parsedRequest.parseExtensions(extensionsString);

  // Cookies are optional
  var cookieString = httpRequest.headers['cookie'];
  parsedRequest.cookies = parsedRequest.parseCookies(cookieString);
};

module.exports.prepareResponse = function(request, acceptedProtocol, allowedOrigin, cookies){
    // TODO: Handle extensions

    var protocolFullCase;

    if(acceptedProtocol){
      protocolFullCase = this.protocolFullCaseMap[acceptedProtocol.toLocaleLowerCase()];
      if(typeof protocolFullCase === 'undefined'){
        protocolFullCase = acceptedProtocol;
      }
    }else{
      protocolFullCase = acceptedProtocol;
    }

    this.protocolFullCaseMap = null;

    // Create key validation hash
    var sha1 = crypto.createHash('sha1');
    sha1.update(`${this.key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`);
    var acceptKey = sha1.digest('base64');

    var response =  [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey}\r\n`,
    ].join('\r\n');

    if(protocolFullCase){
      // validate protocol
      for(var i = 0; i < protocolFullCase.length; i++){
        var charCode = protocolFullCase.charCodeAt(i);
        var character = protocolFullCase.charAt(i);
        if(charCode < 0x21 || charCode > 0x7E || separators.indexOf(character) !== -1){
          throw new Error(`Illegal character "${String.fromCharCode(character)}" in subprotocol.`);
        }
      }

      if(this.requestedProtocols.indexOf(acceptedProtocol) === -1){
        throw new Error('Specified protocol was not requested by the client.');
      }

      protocolFullCase = protocolFullCase.replace(headerSanitizeRegExp, '');
      response += `Sec-WebSocket-Protocol: ${protocolFullCase}\r\n`;
    }

    this.requestedProtocols = null;

    if(allowedOrigin){
      allowedOrigin = allowedOrigin.replace(headerSanitizeRegExp, '');
      if(this.webSocketVersion === 13){
        response += `Origin: ${allowedOrigin}\r\n`;
      }else if(this.webSocketVersion === 8){
        response +=  `Sec-WebSocket-Origin: ${allowedOrigin}\r\n`;
      }
    }

    if(cookies){
      if(!Array.isArray(cookies)){
        this.reject(500);
        throw new Error('Value supplied for "cookies" argument must be an array.');
      }

      var seenCookies = {};
      cookies.forEach(function(cookie){
        if(!cookie.name || !cookie.value){
          this.reject(500);
          throw new Error('Each cookie to set must at least provide a "name" and "value"');
        }

        // Make sure there are no \r\n sequences inserted
        cookie.name = cookie.name.replace(controlCharsAndSemicolonRegEx, '');
        cookie.value = cookie.value.replace(controlCharsAndSemicolonRegEx, '');

        if(seenCookies[cookie.name]){
          this.reject(500);
          throw new Error('You may not specify the same cookie name twice.');
        }

        seenCookies[cookie.name] = true;

        // token (RFC 2616, Section 2.2)
        var invalidChar = cookie.name.match(cookieNameValidateRegEx);
        if(invalidChar){
          this.reject(500);
          throw new Error(`Illegal character ${invalidChar[0]} in cookie name`);
        }

        // RFC 6265, Section 4.1.1
        // *cookie-octet / ( DQUOTE *cookie-octet DQUOTE ) | %x21 / %x23-2B / %x2D-3A / %x3C-5B / %x5D-7E
        if(cookie.value.match(cookieValueDQuoteValidateRegEx)){
          invalidChar = cookie.value.slice(1, -1).match(cookieValueValidateRegEx);
        }else{
          invalidChar = cookie.value.match(cookieValueValidateRegEx);
        }

        if(invalidChar){
          this.reject(500);
          throw new Error(`Illegal character ${invalidChar[0]} in cookie value`);
        }

        var cookieParts = [`${cookie.name}=${cookie.value}`];

        // RFC 6265, Section 4.1.1
        // 'Path=' path-value | <any CHAR except CTLs or ';'>
        if(cookie.path){
          invalidChar = cookie.path.match(controlCharsAndSemicolonRegEx);
          if(invalidChar){
            this.reject(500);
            throw new Error(`Illegal character ${invalidChar[0]} in cookie path`);
          }

          cookieParts.push(`Path=${cookie.path}`);
        }

        // RFC 6265, Section 4.1.2.3
        // 'Domain=' subdomain
        if(cookie.domain){
          if(typeof cookie.domain !== 'string'){
            this.reject(500);
            throw new Error('Domain must be specified and must be a string.');
          }

          invalidChar = cookie.domain.match(controlCharsAndSemicolonRegEx);
          if(invalidChar){
            this.reject(500);
            throw new Error(`Illegal character ${invalidChar[0]} in cookie domain`);
          }

          cookieParts.push(`Domain=${cookie.domain.toLowerCase()}`);
        }

        // RFC 6265, Section 4.1.1
        //'Expires=' sane-cookie-date | Force Date object requirement by using only epoch
        if(cookie.expires){
          if(!(cookie.expires instanceof Date)){
            this.reject(500);
            throw new Error('Value supplied for cookie "expires" must be a vaild date object');
          }

          cookieParts.push(`Expires=${cookie.expires.toGMTString()}`);
        }

        // RFC 6265, Section 4.1.1
        //'Max-Age=' non-zero-digit *DIGIT
        if(cookie.maxage){
          var maxage = cookie.maxage;
          if(typeof maxage === 'string'){
            maxage = parseInt(maxage, 10);
          }

          if(isNaN(maxage) || maxage <= 0){
            this.reject(500);
            throw new Error('Value supplied for cookie "maxage" must be a non-zero number');
          }

          maxage = Math.round(maxage);
          cookieParts.push(`Max-Age=${maxage.toString(10)}`);
        }

        // RFC 6265, Section 4.1.1
        //'Secure;'
        if(cookie.secure){
          if(typeof cookie.secure !== 'boolean'){
            this.reject(500);
            throw new Error('Value supplied for cookie "secure" must be of type boolean');
          }

          cookieParts.push('Secure');
        }

        // RFC 6265, Section 4.1.1
        //'HttpOnly;'
        if(cookie.httponly){
          if(typeof cookie.httponly !== 'boolean'){
            this.reject(500);
            throw new Error('Value supplied for cookie "httponly" must be of type boolean');
          }

          cookieParts.push('HttpOnly');
        }

        response += `Set-Cookie: ${cookieParts.join(';')}\r\n`;
      }.bind(this));
    }

    // TODO: handle negotiated extensions
    // if(negotiatedExtensions){
    //     response += 'Sec-WebSocket-Extensions: ' + negotiatedExtensions.join(', ') + '\r\n';
    // }

    // Mark the request resolved now so that the user can't call accept or
    // reject a second time.
    this._resolved = true;
    this.emit('requestResolved', this);

    response += '\r\n';

    var connection = new WebSocketConnection(this.socket, [], acceptedProtocol, false, this.serverConfig);
    connection.webSocketVersion = this.webSocketVersion;
    connection.remoteAddress = this.remoteAddress;
    connection.remoteAddresses = this.remoteAddresses;

    var _this = this;

    if(this._socketIsClosing){
      // Handle case when the client hangs up before we get a chance to
      // accept the connection and send our side of the opening handshake.
      cleanupFailedConnection(connection);
    }else{
      this.socket.write(response, 'ascii', function(error){
        if(error){
          cleanupFailedConnection(connection);
          return;
        }

        _this._removeSocketCloseListeners();
        connection._addSocketEventListeners();
      });
    }

    this.emit('requestAccepted', connection);
    return connection;
  };

  cleanupFailedConnection = function(connection){
    // Since we have to return a connection object even if the socket is
    // already dead in order not to break the API, we schedule a 'close'
    // event on the connection object to occur immediately.
    process.nextTick(function(){
      // WebSocketConnection.CLOSE_REASON_ABNORMAL = 1006
      // Third param: Skip sending the close frame to a dead socket
      connection.drop(1006, 'TCP connection lost before handshake completed.', true);
    });
  };

  separators = [
    '(', ')', '<', '>', '@',
    ',', ';', ':', '\\', '\"',
    '/', '[', ']', '?', '=',
    '{', '}', ' ', String.fromCharCode(9),
  ];
