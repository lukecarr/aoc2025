// Because we don't have numbers in type definitions, we use the _length_ of tuples to represent numbers.
// In other words, to represent a variable n, we actually use a tuple of n zeroes.

// These are some utility types that let us basically write unit tests in TS types and assert conditions!
// Equal checks equality by returning true if A extends B and B extends A, otherwise false. We have to wrap
// A and B in tuples because this allows us to do equality comparisons on never types.
type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
// Assert will make the type compiler complain if T is not true.
type Assert<T extends true> = T;

// Digit converts a string representation of numerical digit n to a tuple of n zeroes
// This is effectively how we construct integer literals.
type Digit = {
  '0': [];
  '1': [0];
  '2': [0,0];
  '3': [0,0,0];
  '4': [0,0,0,0];
  '5': [0,0,0,0,0];
  '6': [0,0,0,0,0,0];
  '7': [0,0,0,0,0,0,0];
  '8': [0,0,0,0,0,0,0,0];
  '9': [0,0,0,0,0,0,0,0,0];
};

// C100 is a tuple of 100 zeroes, recursively constructed. 'N' prefix because type names can't be numbers.
type N100<T extends any[] = []> = T['length'] extends 100 ? T : N100<[...T, 0]>;

// Types for basic arithmetic.
// Add performs addition on two _numbers_, such that A is a tuple of size m and B is a tuple of size n, then
// Add<A, B> will be a tuple of size m + n.
type Add<A extends any[], B extends any[]> = [...A, ...B];

type TestAdd = Assert<Equal<Add<Digit['2'], Digit['3']>, Digit['5']>>;
type TestAdd0 = Assert<Equal<Add<Digit['2'], Digit['0']>, Digit['2']>>;

// Sub performs subtraction of two _numbers_, but it cannot do a simple inverse of Add.
// Because we use tuples of zeroes to represent numbers, assuming B <= A, we can "subtract" B from A by trying to
// find B as a prefix of A, and then inferring R which is the other elements in tuple A that aren't in B. This
// creates our result of subtracting B from A. We return never if B > A.
type Sub<A extends any[], B extends any[]> = A extends [...B, ...infer R] ? R : never;

type TestSub = Assert<Equal<Sub<Digit['5'], Digit['3']>, Digit['2']>>;
type TestSub0 = Assert<Equal<Sub<Digit['5'], Digit['0']>, Digit['5']>>;
type TestSubBGreaterThanA = Assert<Equal<Sub<Digit['3'], Digit['5']>, never>>;

// Mod100 calculates T mod 100 recursively by continuously trying to find 100 zeroes at the start of T (which is
// a tuple of n zeroes), until it has length < 100, then it returns T (which is the remainder).
type Mod100<T extends any[]> = T extends [...N100, ...infer Rest] ? Mod100<Rest> : T;

type TestMod100 = Assert<Equal<Mod100<Add<ParseInt<'99'>, ParseInt<'50'>>>, ParseInt<'49'>>>;
type TestMod100LessThan100 = Assert<Equal<Mod100<ParseInt<'99'>>, ParseInt<'99'>>>;

// Mul10 multiplies T by 10, by constructing an array that spreads T 10 times.
type Mul10<T extends any[]> = [...T, ...T, ...T, ...T, ...T, ...T, ...T, ...T, ...T, ...T];

type TestMul10 = Assert<Equal<Mul10<Digit['5']>, ParseInt<'50'>>>;
type TestMul10By0 = Assert<Equal<Mul10<Digit['0']>, Digit['0']>>;

// ParseInt converts an integer n, encoded as a string, to a tuple of n zeroes.
// We go digit by digit, left to right, multiplying each by 10 based on its position, and then returning the sum.
// We do an optimisation trick here: because the problem's dial is a fixed size of 100, we can actually do mod 100
// on all numbers in the test input, and this will create the same number of rotations. This is useful for
// avoiding recursion depth limits.
type ParseInt<S extends string, Acc extends any[] = []> = 
  S extends `${infer D extends keyof Digit}${infer Rest}`
    ? ParseInt<Rest, Mod100<Add<Mul10<Acc>, Digit[D]>>>
    : Acc;

// RotateR calculates the action of rotating the dial right, which is really just (current + amount) % 100.
type RotateR<Current extends any[], Amount extends any[]> = Mod100<Add<Current, Amount>>;

type TestRotateR = Assert<Equal<RotateR<Digit['2'], Digit['3']>, Digit['5']>>;
type TestRotateRLoopBack = Assert<Equal<RotateR<ParseInt<'98'>, Digit['5']>, Digit['3']>>;

// RotateL calculates the action of rotating the dial left, which is (current - amount) % 100.
// Because our Sub<A, B> function only works for B <= A, we perform our dial wrap around logic here and subtract
// the "remainder" (B - A) from 100 (the dial size).
type RotateL<Current extends any[], Amount extends any[]> = 
  Mod100<
    Amount extends [...Current, ...infer Remainder] // if B > A
      ? Sub<N100, Remainder>
      : Sub<Current, Amount>
  >;

type TestRotateL = Assert<Equal<RotateL<Digit['5'], Digit['3']>, Digit['2']>>;
type TestRotateLLoopBack = Assert<Equal<RotateL<Digit['3'], Digit['5']>, ParseInt<'98'>>>;

// ProcessStep handles a single line from the test input, calling RotateL or RotateR depending on if the
// line starts with an 'L' or 'R' (and inferring the number from the rest of the string).
type ProcessStep<Line extends string, Pos extends any[]> = 
  Line extends `L${infer Val}` ? RotateL<Pos, ParseInt<Val>> :
  Line extends `R${infer Val}` ? RotateR<Pos, ParseInt<Val>> :
  Pos;

type TestProcessStepLeft = Assert<Equal<ProcessStep<'L1', Digit['2']>, Digit['1']>>;
type TestProcessStepRight = Assert<Equal<ProcessStep<'R1', Digit['1']>, Digit['2']>>;
type TestProcessStepOther = Assert<Equal<ProcessStep<'Hello', Digit['1']>, Digit['1']>>;

// UpdatePassword determines the "password" or answer to the puzzle. The puzzle defines the password as the
// number of times that the dial stops on zero at any point in the sequence. This function appends a zero
// to the rest of the password value (which is represented as a tuple of zeroes) whenever the current position
// is zero.
type UpdatePassword<Pos extends any[], Password extends any[]> = 
  Pos['length'] extends 0 ? [...Password, 0] : Password;

type TestUpdatePasswordNoOp = Assert<Equal<UpdatePassword<Digit['5'], Digit['0']>, Digit['0']>>;
type TestUpdatePasswordUpdate = Assert<Equal<UpdatePassword<Digit['0'], Digit['1']>, Digit['2']>>;

// ProcessBlock hardcodes processing of ten lines at a time, and then collects all of the results, making sure to
// update the password as they go.
// We try and solve in blocks of ten (see SolveRec) to speed up the TS type compiler and stop it from complaining
// about resources/timing out. Ten is completely arbitrary, but a nice round number that doesn't look too verbose
// manually writtenn out, and supports easy in SolveRec logic by being a round number.
type ProcessBlock<Block extends string, Pos extends any[], Password extends any[]> = 
  Block extends `${infer L1}\n${infer L2}\n${infer L3}\n${infer L4}\n${infer L5}\n${infer L6}\n${infer L7}\n${infer L8}\n${infer L9}\n${infer L10}` ?
  ProcessStep<L1, Pos> extends infer P1 extends any[] ?
  ProcessStep<L2, P1>  extends infer P2 extends any[] ?
  ProcessStep<L3, P2>  extends infer P3 extends any[] ?
  ProcessStep<L4, P3>  extends infer P4 extends any[] ?
  ProcessStep<L5, P4>  extends infer P5 extends any[] ?
  ProcessStep<L6, P5>  extends infer P6 extends any[] ?
  ProcessStep<L7, P6>  extends infer P7 extends any[] ?
  ProcessStep<L8, P7>  extends infer P8 extends any[] ?
  ProcessStep<L9, P8>  extends infer P9 extends any[] ?
  ProcessStep<L10, P9> extends infer P10 extends any[] ?
  { 
    pos: P10, 
    password: [...Password, 
      ...UpdatePassword<P1,[]>, ...UpdatePassword<P2,[]>, ...UpdatePassword<P3,[]>, ...UpdatePassword<P4,[]>,
      ...UpdatePassword<P5,[]>, ...UpdatePassword<P6,[]>, ...UpdatePassword<P7,[]>, ...UpdatePassword<P8,[]>,
      ...UpdatePassword<P9,[]>, ...UpdatePassword<P10,[]>
    ]
  } 
  : never : never : never : never : never : never : never : never : never : never 
  : never;

// Solve will solve the puzzle, based on the test input, with the resolved type being the password number.
// 50 is hardcoded as the starting position of the dial (as per the problem).
type Solve<Input extends string> = SolveRec<Input, ParseInt<'50'>, []>;

// SolveRec solves the problem recursively by breaking down the input lines into 10 line blocks, and aggregating
// the "passwords" (number of times each block results in the dial ending on zero) to determine the final
// password (i.e., problem solution).
type SolveRec<Input extends string, Pos extends any[], Password extends any[]> =
  // While the input still has at least ten lines, process ten lines
  Input extends `${infer L1}\n${infer L2}\n${infer L3}\n${infer L4}\n${infer L5}\n${infer L6}\n${infer L7}\n${infer L8}\n${infer L9}\n${infer L10}\n${infer Rest}`
    ? ProcessBlock<`${L1}\n${L2}\n${L3}\n${L4}\n${L5}\n${L6}\n${L7}\n${L8}\n${L9}\n${L10}`, Pos, Password> extends { pos: infer NewPos extends any[], password: infer NewPassword extends any[] }
      ? SolveRec<Rest, NewPos, NewPassword>
      : never
  // Then, when we're down to less than ten lines, process line by line
  : Input extends `${infer Line}\n${infer Rest}`
    ? ProcessStep<Line, Pos> extends infer NewPos extends any[]
      ? SolveRec<Rest, NewPos, UpdatePassword<NewPos, Password>>
      : never
  // Finally, process the last line
  : ProcessStep<Input, Pos> extends infer FinalPos extends any[]
    ? UpdatePassword<FinalPos, Password>['length']
    : Password['length'];

type Input = `L68
L30
R48
L5
R60
L55
L1
L99
R14
L82`; 

// Hover over "Result" to see the password (3, based on the example input)
type Result = Solve<Input>;
