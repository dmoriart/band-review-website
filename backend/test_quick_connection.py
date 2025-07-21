#!/usr/bin/env python3
"""
Simple database connection test with timeout
"""
import os
import sys
import signal
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

def timeout_handler(signum, frame):
    raise TimeoutError("Connection timed out")

def test_quick_connection():
    load_dotenv()
    database_url = os.environ.get('DATABASE_URL')
    
    if not database_url:
        print("❌ DATABASE_URL not found")
        return False
        
    print(f"🔗 Testing connection to: {database_url.split('@')[1].split('/')[0] if '@' in database_url else 'unknown'}")
    
    try:
        # Set a 10-second timeout
        signal.signal(signal.SIGALRM, timeout_handler)
        signal.alarm(10)
        
        engine = create_engine(database_url, connect_args={
            "connect_timeout": 10,
            "application_name": "BandVenueReview_Test"
        })
        
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            result.fetchone()
            print("✅ Connection successful!")
            return True
            
    except TimeoutError:
        print("❌ Connection timed out (10 seconds)")
        print("💡 This might indicate:")
        print("   - Incorrect hostname")
        print("   - Network connectivity issues")
        print("   - Supabase project is paused/inactive")
        return False
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        return False
    finally:
        signal.alarm(0)  # Disable the alarm

if __name__ == "__main__":
    success = test_quick_connection()
    sys.exit(0 if success else 1)
