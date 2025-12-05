type Trim<S extends string> = S extends `\n${infer R}` | ` ${infer R}` ? Trim<R> : S;

type DigitLessThan = {
  '0': '1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9';
  '1': '2'|'3'|'4'|'5'|'6'|'7'|'8'|'9';
  '2': '3'|'4'|'5'|'6'|'7'|'8'|'9';
  '3': '4'|'5'|'6'|'7'|'8'|'9';
  '4': '5'|'6'|'7'|'8'|'9';
  '5': '6'|'7'|'8'|'9';
  '6': '7'|'8'|'9';
  '7': '8'|'9';
  '8': '9';
  '9': never;
};

// LengthLte evaluates if |A| <= |B|.
// Basically: if B runs out first, A is longer (A > B). If A runs out, B is longer (A < B).
type LengthLte<A extends string, B extends string> = 
  A extends `${string}${infer RA}` 
    ? B extends `${string}${infer RB}` 
      ? LengthLte<RA, RB> // Both have something left, keep recursing
      : false             // B ran out, A is longer
    : true;               // A ran out, A is shorter or equal

// Go from left to right on both strings, checking if each digit is <= the corresponding digit.
type DigitLte<A extends string, B extends string> = 
  A extends `${infer DigitA extends keyof DigitLessThan}${infer RestA}`
    ? B extends `${infer DigitB extends keyof DigitLessThan}${infer RestB}`
      ? DigitA extends DigitB ? DigitLte<RestA, RestB> : DigitB extends DigitLessThan[DigitA] ? true : false
      : true
    : true; // Strings empty, therefore equal

// Lte checks if one string (an encoded integer) is less than or equal to another.
type Lte<A extends string, B extends string> = 
  LengthLte<A, B> extends true 
    // If lengths are equal, check digits
    ? (LengthLte<B, A> extends true ? DigitLte<A, B> : true)
    : false; // A has more digits, so can't be <= B

type IdRange = { min: string, max: string };

// Parse one line into a Range
type ToRange<S extends string> = S extends `${infer Min}-${infer Max}` ? { min: Min, max: Max } : never;

// Check if ID is in a Range
type InRange<ID extends string, R extends IdRange> = Lte<R['min'], ID> extends true ? Lte<ID, R['max']> : false;

// CheckAll checks whether an ID exists in any of the ranges
type CheckAll<ID extends string, Ranges extends string> = 
  Ranges extends `${infer Line}\n${infer RestRanges}`
    ? InRange<ID, ToRange<Trim<Line>>> extends true 
      ? true 
      : CheckAll<ID, RestRanges>
    : InRange<ID, ToRange<Trim<Ranges>>>;

// Count Iteration
type CountFresh<IDs extends string, Ranges extends string, Count extends any[] = []> = 
  IDs extends `${infer ID}\n${infer RestIDs}`
    ? CountFresh<RestIDs, Ranges, CheckAll<Trim<ID>, Ranges> extends true ? [...Count, 0] : Count>
    : CheckAll<Trim<IDs>, Ranges> extends true ? [...Count, 0]['length'] : Count['length'];

type Solve<Input extends string> =
  // Split out the range and ID parts from the input, then count.
  Input extends `${infer RangePart}\n\n${infer IdPart}`
    ? CountFresh<IdPart, RangePart>
    : never;

type TestInput = `3-5
10-14
16-20
12-18

1
5
8
11
17
32`;

type Result = Solve<TestInput>;
//   ^?
