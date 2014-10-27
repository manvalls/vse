
var Yielded,
    Vse,
    Su = require('vz.rand').Su,
    
    number = Su(),
    yieldeds = Su(),
    handlers = Su(),
    context = Su(),
    
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
    
    for(i = 0;i < hds.length;i++) ret.push(hds[i].call(ctx,data));
    
    return ret;
  }},
  
  detach: {value: function(event,handler){
    var hds = this[handlers][event],
        i;
    
    if(!hds) return false;
    
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
  Object.defineProperties(obj);
  Vse.call(obj,ctx);
};

Yielded = require('vz.yielded');
