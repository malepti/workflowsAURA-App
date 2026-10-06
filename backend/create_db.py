import asyncio
import asyncpg

async def create_database():
    try:
        # Connect to the default 'postgres' database first
        conn = await asyncpg.connect(
            user='postgres', 
            password='postgres123', 
            database='postgres', 
            host='localhost', 
            port=5432
        )
        
        # Create the new MVAI database
        await conn.execute('CREATE DATABASE "MVAI"')
        print("Database 'MVAI' created successfully!")
        
        await conn.close()
    except asyncpg.exceptions.DuplicateDatabaseError:
        print("Database 'MVAI' already exists!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    asyncio.run(create_database())
