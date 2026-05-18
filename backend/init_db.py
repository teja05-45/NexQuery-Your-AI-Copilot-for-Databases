#!/usr/bin/env python3
"""
Database initialization script.
Run with: python init_db.py
Creates all tables and optionally seeds a demo user.
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


async def main():
    print("Initializing AI SQL Assistant database...")

    from app.db.session import init_db, AsyncSessionLocal
    from app.repositories.user_repository import UserRepository

    # Create tables
    await init_db()
    print("✓ Database tables created")

    # Seed demo user (optional)
    if "--seed" in sys.argv:
        async with AsyncSessionLocal() as db:
            repo = UserRepository(db)
            if not await repo.email_exists("demo@aisql.ai"):
                user = await repo.create(
                    email="demo@aisql.ai",
                    username="demo",
                    password="demo1234",
                    full_name="Demo User",
                )
                await db.commit()
                print(f"✓ Demo user created: demo@aisql.ai / demo1234 (id={user.id})")
            else:
                print("ℹ Demo user already exists")

    print("\nDatabase initialization complete!")
    print("Run the server with: uvicorn app.main:app --reload")


if __name__ == "__main__":
    asyncio.run(main())
