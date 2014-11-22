
var Yielded,
    Vse,
    walk,
    Su = require('vz.rand').Su,
    
    number = Su(),
    yieldeds = Su(),
    handlers = Su(),
    context = Su(),
    
    proxy = Su(),
    proxiedHandlers = Su(),
    proxied = Su(),
    useCapture = Su(),
    
    bag;

module.exports = Vse = function Vse(ctx){
  this[number] = {};
  this[yieldeds] = {};
  this[handlers] = {};
  this[context] = ctx || this;
};

function init(vse,event){
  
  if(!vse[number][event]){
    vse[number][event] = 0;
    vse[yieldeds][event] = [];
    vse[handlers][event] = [];
    return true;
  }
  
  return false;
}

function destroy(vse,event,n){
  
  if(!(vse[number][event] -= n)){
    delete vse[number][event];
    delete vse[yieldeds][event];
    delete vse[handlers][event];
    
    return true;
  }
  
  return false;
  
}

bag = {
  
  on: {value: function(event,handler){
    var fire = init(this,event);
    
    this[number][event]++;
    this[handlers][event].push(handler);
    
    if(fire) this.fire('event-handled',event);
  }},
  
  until: {value: function(event){
    var fire = init(this,event),
        yd = new Yielded();
    
    this[number][event]++;
    this[yieldeds][event].push(yd);
    
    if(fire) this.fire('event-handled',event);
    
    return yd;
  }},
  
  fire: {value: function(event,data){
    var yds,hds,i,ret,ctx;
    
    if(!this[number][event]) return [];
    
    // Yieldeds
    
    if((yds = this[yieldeds][event]).length){
      this[yieldeds][event] = [];
      for(i = 0;i < yds.length;i++) yds[i].value = data;
      
      if(destroy(this,event,yds.length)){
        this.fire('event-unhandled',event);
        return [];
      }
    }
    
    // Handlers
    
    hds = this[handlers][event].slice();
    ret = [];
    ctx = this[context];
    
    for(i = 0;i < hds.length;i++) ret.push(walk(hds[i],[data,event],ctx));
    
    return ret;
  }},
  
  detach: {value: function(event,handler){
    var hds = this[handlers][event],
        i;
    
    if(!hds) return false;
    
    if(!handler){
      delete this[number][event];
      delete this[yieldeds][event];
      delete this[handlers][event];
      
      return true;
    }
    
    i = hds.indexOf(handler);
    
    if(i != -1){
      hds.splice(i,1);
      if(destroy(this,event,1)) this.fire('event-unhandled',event);
      return true;
    }
    
    return false;
  }},
  
  throw: {value: function(error){
    var events = Object.keys(this[yieldeds]),
        event,
        
        ydsCol = [],
        eCol = [],
        
        yds,
        i;
    
    this.fire('error',e);
    
    for(i = 0;i < events.length;i++){
      event = events[i];
      ydsCol.push(this[yieldeds][event]);
      this[yieldeds][event] = [];
      eCol.push(event);
    }
    
    while(yds = ydsCol.shift()){
      event = eCol.shift();
      for(i = 0;i < yds.length;i++) yds[i].error = error;
      if(destroy(this,event,yds.length)) this.fire('event-unhandled',event);
    }
    
  }},
  
  isHandled: {value: function(event){
    return !!this[number][event];
  }}
  
};

Object.defineProperties(Vse.prototype,bag);

Vse.make = function(obj,ctx){
  Object.defineProperties(obj,bag);
  Vse.call(obj,ctx);
};

// Proxy

//// EventEmitter

function onEventHandledEEArr(event){
  var pd = this[proxied],
      p = this;
  
  function onEvent(){
    p.fire(event,arguments);
  }
  
  p[proxiedHandlers][event] = onEvent;
  pd.on(event,onEvent);
}

function onEventHandledEE(event){
  var pd = this[proxied],
      p = this;
  
  function onEvent(data){
    p.fire(event,data);
  }
  
  p[proxiedHandlers][event] = onEvent;
  pd.on(event,onEvent);
}

function onEventUnhandledEE(event){
  var pd = this[proxied],
      p = this,
      onEvent;
  
  if(onEvent = p[proxiedHandlers][event]){
    pd.removeListener(event,onEvent);
    delete p[proxiedHandlers][event];
  }
}

//// EventTarget

function onEventHandledET(event){
  this[proxied].addEventListener(event,onEventET,this[useCapture]);
}

function onEventUnhandledET(event){
  this[proxied].removeEventListener(event,onEventET,this[useCapture]);
}

function onEventHandledETS(event){
  this[proxied].addEventListener(event,onEventETS,this[useCapture]);
}

function onEventUnhandledETS(event){
  this[proxied].removeEventListener(event,onEventETS,this[useCapture]);
}

function onEventET(e){
  if(this[proxy].fire(e.type,e).indexOf(false) != -1){
    e.preventDefault();
    e.stopPropagation();
  }
}

function onEventETS(e){
  this[proxy].fire(e.type,e);
}

//// Proxy function

Vse.proxy = function(obj,p,strict,capture){
  if(obj[proxy]) return obj[proxy];
  
  if(p && p[proxied]) throw 'Provided Vse is already proxying another object';
  
  p = p || new Vse();
  p[proxied] = obj;
  obj[proxy] = p;
  
  if(obj.on){
    p[proxiedHandlers] = {};
    
    if(strict) p.on('event-handled',onEventHandledEEArr);
    else p.on('event-handled',onEventHandledEE);
    p.on('event-unhandled',onEventUnhandledEE);
    
    return p;
  }
  
  if(obj.addEventListener){
    p[useCapture] = capture || false;
    
    if(strict){
      p.on('event-handled',onEventHandledETS);
      p.on('event-unhandled',onEventUnhandledETS);
    }else{
      p.on('event-handled',onEventHandledET);
      p.on('event-unhandled',onEventUnhandledET);
    }
    
    return p;
  }
  
};

// Late imports

walk = require('vz.walk');
Yielded = require('vz.yielded');
