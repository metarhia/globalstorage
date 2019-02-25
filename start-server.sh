#!/bin/sh

export PGHOST=localhost
export PGPORT=5432
export PGDATABASE=console-pg
export PGUSER=postgres

if [[ "$2" = "true" ]]; then
  docker run -it --rm --link $1:postgres postgres psql -h postgres -U $PGUSER -c "DROP DATABASE IF EXISTS \"$PGDATABASE\";" -c " CREATE DATABASE \"$PGDATABASE\";"
fi

node ./start-server $2 $3
