export let seq = 0;
export const seqIncrement = () => {
  seq += 1;
}
export const seqReset = () => {
  seq = 0;
}
export const predicates: Predicate[] = []
export type Predicate = {
  seq: number,
  action: string
}
export const pushPredicate = (action: string) => {
  predicates.push({
    seq,
    action,
  });
}
export const matchPredicate = (action: string, seq: number): boolean => {
  const predicate = predicates.shift();
  if (predicate) {
    if (predicate.action === action
      // && predicate.seq === seq
    ) {
      return true;
    }
  }
  return false;
}
export const resetPredicate = () => {
  predicates.length = 0;
}