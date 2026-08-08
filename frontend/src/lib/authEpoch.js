// Sessiya "epoch"i: har bir muvaffaqiyatli login/logout uni oshiradi.
// Maqsad — login'dan OLDIN boshlangan so'rovning 401/refresh xatosi keyin
// kelib, yangi ochilgan sessiyani o'chirib tashlamasligi.

let epoch = 0;

export function currentAuthEpoch() {
  return epoch;
}

export function bumpAuthEpoch() {
  epoch += 1;
  return epoch;
}
