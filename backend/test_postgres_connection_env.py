import os
import psycopg2
from psycopg2 import OperationalError

def test_postgres_connection_env():
    try:
        conn = psycopg2.connect(
            host=os.environ.get('DB_HOST'),
            port=os.environ.get('DB_PORT'),
            database=os.environ.get('DB_NAME'),
            user=os.environ.get('DB_USER'),
            password=os.environ.get('DB_PASSWORD'),
            sslmode=os.environ.get('DB_SSLMODE', 'require')
        )
        cur = conn.cursor()
        cur.execute("SELECT version();")
        db_version = cur.fetchone()
        print(f"✅ Connected to PostgreSQL! Version: {db_version[0]}")
        cur.close()
        conn.close()
    except OperationalError as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    test_postgres_connection_env()
