- Router needs to have similar methods to Writer
- Needs to allow for many request types
  - trigger
  - request
  - stream
  - duplex
- In addition, I also want to allow for regexp based routing

so heres what I can do
- next skips to the next function

```
req = {
  originator: Unique,
  id: Unique,
  data: Any
}

.all(/path/m function(req, respeonder, next){

});

.on(/path/, function(req, void 0, next){
  //handle an event
});

.get(/path/, function(req, promise, next){

})

.stream(/path/, function(req, stream, next){

});

.messenger(/path/, function(req, messenger, next){

});
```

And of course

```
.remove(/path/);
.remove(/path/, fn);
.remove('type', /path/, fn);
.remove('type', /path/)
```
