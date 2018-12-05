CREATE FUNCTION unsigned_right_shift(value bigint, shift integer)
RETURNS bigint AS $$
BEGIN
    shift := shift & 63;
    IF shift = 0 THEN
        RETURN value;
    END IF;
    RETURN (value >> shift) & (~(1::bigint << 63) >> (shift - 1));
END;
$$ LANGUAGE plpgsql;

/*
trigger function idgen(
    max_count bigint,
    refill_percent integer,
    server_id bigint,
    id_bit_length integer
)
*/
CREATE FUNCTION idgen()
RETURNS trigger AS $$
DECLARE
    prealloc_count bigint;
    max_count      bigint;
    refill_percent integer;
    to_add_count   bigint;
    last_id        bigint;
    server_id      bigint;
    id_bit_length  integer;
    lock_obtained  boolean;
    cur_id         bigint;
    last_to_add_id bigint;
BEGIN
    max_count := TG_ARGV[0]::bigint;
    refill_percent := TG_ARGV[1]::integer;
    server_id := TG_ARGV[2]::bigint;
    id_bit_length := TG_ARGV[3]::integer;

    SELECT pg_try_advisory_xact_lock(0) INTO lock_obtained;
    IF NOT lock_obtained THEN
        RETURN NULL;
    END IF;

    SELECT count(*) INTO prealloc_count
    FROM "Identifier"
    WHERE "Status" = 'Prealloc';

    SELECT COALESCE(max(unsigned_right_shift("Id", id_bit_length)), 0)
    INTO last_id FROM "Identifier";

    IF prealloc_count < max_count * refill_percent / 100 THEN
        to_add_count := max_count - prealloc_count;
        cur_id := last_id + 1;
        last_to_add_id := last_id + to_add_count;
        WHILE cur_id <= last_to_add_id LOOP
            INSERT INTO "Identifier"
            ("Id", "StorageKind", "Status", "Creation", "Change", "Checksum")
            VALUES
            (
                (cur_id << id_bit_length) | server_id,
                'Master', 'Prealloc', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
                -- sha512 value for empty string:
                E'\\xcf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d3'
                '6ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327a'
                'f927da3e'::bytea
            );
            cur_id := cur_id + 1;
        END LOOP;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION trigger_creator(
    max_count bigint,
    refill_percent integer,
    server_id bigint,
    id_bit_length integer
) RETURNS void AS $$
BEGIN
    EXECUTE format(
        'CREATE TRIGGER idgen BEFORE UPDATE ON "Identifier"'
        ' FOR EACH STATEMENT EXECUTE PROCEDURE idgen(%L, %L, %L, %L);',
        max_count, refill_percent, server_id, id_bit_length
    );
    -- run trigger function at least once before first update
    UPDATE "Identifier" SET "Id" = 0 WHERE FALSE;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION get_checksum(
    category text,
    id bigint,
    algorithm text
) RETURNS bytea AS $$
DECLARE
    rec record;
    result bytea;
BEGIN
    EXECUTE format('SELECT * FROM %I WHERE "Id" = $1', category)
        INTO STRICT rec USING id;
    SELECT digest(rec::text, algorithm) INTO STRICT result;
    RETURN result;
END;
$$ LANGUAGE plpgsql;
