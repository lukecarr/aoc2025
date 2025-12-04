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
-- Sum up steps and add to starting dial position (50)
positions AS (
    SELECT
        50 + SUM(CASE
            WHEN direction = 'R' THEN amount
            ELSE -amount
        END) OVER (ORDER BY id) as pos
    FROM steps
)
-- Count number of times where the position is a multiple of 100
SELECT
    count(*) as answer
FROM positions
WHERE mod(pos, 100) = 0;
