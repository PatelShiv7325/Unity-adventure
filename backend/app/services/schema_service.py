"""Adds columns that are in the models but missing from an existing database (no Alembic needed)."""
from sqlalchemy import inspect, text
from sqlalchemy.schema import CreateColumn


def add_missing_columns(app, db):
    with app.app_context():
        try:
            insp = inspect(db.engine)
            existing_tables = set(insp.get_table_names())
            for table in db.metadata.sorted_tables:
                if table.name not in existing_tables:
                    continue
                have = {c["name"] for c in insp.get_columns(table.name)}
                for col in table.columns:
                    if col.name in have:
                        continue
                    ddl = CreateColumn(col).compile(dialect=db.engine.dialect)
                    with db.engine.begin() as conn:
                        conn.execute(text(f'ALTER TABLE {table.name} ADD COLUMN {ddl}'))
                    app.logger.info("Added column %s.%s", table.name, col.name)
        except Exception:
            app.logger.exception("Auto column check failed")