let merge arr l m r max =
  let i = ref l in
  let j = ref (m + 1) in
  let k = ref l in
  while !i <= m && !j <= r do
    if arr.(!i) mod max <= arr.(!j) mod max then (
      arr.(!k) <- arr.(!k) + (arr.(!i) mod max * max);
      incr k;
      incr i)
    else (
      arr.(!k) <- arr.(!k) + (arr.(!j) mod max * max);
      incr k;
      incr j)
  done;
  while !i <= m do
    arr.(!k) <- arr.(!k) + (arr.(!i) mod max * max);
    incr k;
    incr i
  done;
  while !j <= r do
    arr.(!k) <- arr.(!k) + (arr.(!j) mod max * max);
    incr k;
    incr j
  done;
  for i = l to r do
    arr.(i) <- arr.(i) / max
  done

let rec merge_sort_aux arr l r max =
  if l < r then (
    let mid = (l + r) / 2 in
    merge_sort_aux arr l mid max;
    merge_sort_aux arr (mid + 1) r max;
    merge arr l mid r max)

let merge_sort (arr : int array) : unit =
  let max = Array.fold_left max min_int arr + 1 in
  merge_sort_aux arr 0 (Array.length arr - 1) max
