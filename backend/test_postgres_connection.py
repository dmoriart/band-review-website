import psycopg2
from psycopg2 import OperationalError

#DB_URL = "postgresql://postgres.thoghjwipjpkxcfkkcbx:N9EHHIXhFQuJ6Kr@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"
#DB_URL = "postgresql://postgres:N9EHHIXhFQuJ6Kr@thoghjwipjpkxcfkkcbx.supabase.co:5432/postgres"
DB_URL = "postgresql://postgres.thoghjwipjpkxcfkkcbx:N9EHHIXhFQuJ6Kr@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require"
def test_postgres_connection():
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        cur.execute("SELECT version();")
        db_version = cur.fetchone()
        print(f"✅ Connected to PostgreSQL! Version: {db_version[0]}")
        cur.close()
        conn.close()
    except OperationalError as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    test_postgres_connection()
