
```javascript

function sortPair(array,sort){
  if(array.length < 2) return array;
  return Promise.resolve(sort(array[0], array[1])).then(function(s){
    if(s <= 0) return array;
    return [array[1], array[2]];
  });
}

function MergeSort(array, sort){
  var l;
  if(l = array.length < 3) return sortPair(array, sort);
  var otherHalf = Math.floor(l / 2);
  var toSend = array.splice(otherHalf, l - otherHalf);
  return Promise.all(worker(MergeSort, toSend), MergeSort.bind(void 0, array, sort)).then(function(arrays){
    // Can potentially turn this into a stream
    var ret = [];
    var array1 = arrays[0];
    var len1 = array1.length;
    var array2 = arrays[1];
    var len2 = array2.length;

    var top1 = array1[0], top2 = array2[0];
    var last1 = array1[len1-1], last2 = array2[len2-1];

    return Promise.all([
      Promise.resolve(sort(last1, top2)),
      Promise.resolve(sort(last2, top1)),
    ]).then(function(s){
      if(s[0] <= 0) return array1.concat(array2),
      if(s[1] <= 0) return array2.concat(array1);

      return Merger(array1, array2, sort);
    }).then(function(s){
      return ;
    });
}

function Merger(array1, array2, recheck12, recheck21, sort){
  /*
    I think this can be faster by doing a binary search or finding the exact index
    - Example
      - If we check all possible comparisons
        - Resolving the location is simple
      - But this would not be helpful in other cases considering how slow it is
    - Example
      - Check 1st, 2, 4th, 8th, 16th. 32nd, 64th etc
      - Its possible we could skip a few
      - Also possible it would not be helpful since it becomes helpful when
        - A.index - B.index >= 8
      - Stays Equal when A.index - B.index == < 3
      - n * (1 + 1/3) when three (1 -> 2 -> 4 -> 3)
      - n * (1 + 1/5) when 5 (1 -> 2 -> 4 -> 8 -> 6 -> 5)
      - 6 is faster
      - 7 is faster
      - 8 is faster
      - 9 is faster (1 -> 2 -> 4 -> 8 -> 16 -> 12 -> 10 -> 9)
      - 10 is faster (1 -> 2 -> 4 -> 8 -> 16 -> 12 -> 10)
      - 11 is faster

      I think 3 and 5 are more common than 9 or above
      Huge differences will be undoubtedly faster
      Its the small ones that I care about mostly

  */

  var l1 = array1.length;
  var l2 = array2.length;

  if(l1 < 2 && l2 < 2) return sortPair([array1[0], array2[0]]);

  var first1 = array1[0], first2 = array2[0],
    last1 = array1[l1-1], last2 = [array2[l2-1];

  var toRun = [];
  if(recheck12) toRun.push(sortPair([last1, first2], sort));
  else toRun.push(1);
  if(recheck21) toRun.push(sortPair([last2, first1], sort));
  else toRun.push(1);

  toRun.push(sortPair([first1, first2], sort));
  toRun.push(sortPair([last1, last2], sort));

  var finalFirst = [], finalLast = [];
  recheck12 = recheck21 = false;
  Promise.all(toRun).then(function(rets){
    // Run Easy Outs
    if(rets[0] <= 0) return array1.concat(array2);
    if(rets[1] <= 0) return array2.concat(array1);

    if(rets[2] <= 0){
      finalFirst.push(array1.shift());
      recheck21 = true;
    }
    if(rets[2] >= 0){
      finalFirst.push(array2.shift());
      recheck12 = true;
    }
    if(rets[3] <= 0){
      finalLast.unshift(array1.pop());
      recheck12 = true;
    }
    if(rets[3] >= 0){
      finalLast.unshift(array2.pop());
      recheck21 = true;
    }
    return finalFirst.concat(Merger(array1, array2, recheck12, recheck21, sort)).concat(finalLast);
  })

}

```
