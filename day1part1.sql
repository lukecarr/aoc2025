-- Take in inputs
WITH inputs AS (
    SELECT $$L68
L30
R48
L5
R60
L55
L1
L99
R14
L82$$ AS lines
),
-- Parse out direction and amounts from inputs
steps AS (
    SELECT
        ordinality AS id,
        substring(line from 1 for 1) as direction,
        substring(line from 2)::int as amount
    FROM inputs,
         regexp_split_to_table(trim(lines), '\n') WITH ORDINALITY t(line)
    WHERE line <> ''
),
-- Convert amounts to positive/negative based on L/R
deltas AS (
    SELECT
        id,
        CASE
            WHEN direction = 'R' THEN amount
            ELSE -amount
        END as change
    FROM steps
),
-- Sum up delts and add to starting dial position (50)
positions AS (
    SELECT
        50 + sum(change) OVER (ORDER BY id) as pos
    FROM deltas
)
-- Count number of times where the position is a multiple of 100
SELECT
    count(*) as answer
FROM positions
WHERE mod(pos, 100) = 0;
