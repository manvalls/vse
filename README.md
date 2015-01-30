
**DEPRECATED in favour of [y-emitter](https://www.npmjs.org/package/y-emitter "y-emitter")**

# Very Simple Emitter

## Sample usage:

```javascript
var Vse = require('vse'),
    walk = require('vz.walk'),
    vse = new Vse();

vse.on('foo',function callback(data){
  console.log(data);
  vse.detach('foo',callback);
});

vse.fire('foo','bar'); // bar

walk(function*(){
  var data = yield vse.until('foo');
  
  console.log(data);
});

vse.fire('foo','bar'); // bar
```

