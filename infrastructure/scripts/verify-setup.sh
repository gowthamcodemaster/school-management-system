#! /bin/bash

echo "Verifying Postgres setup..."
echo "=============================================================="

# Check Docker container status
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker to proceed."
    exit 1
fi
echo "Docker is installed."


# Check Container
if [ "$(docker ps -q -f name=school-postgres)" ]; then
    echo "Postgres container is running."
else
    { echo "Postgres container is not running. Please start the container."; exit 1; }
fi

# Check Redis issues
if [ "$(docker ps -q -f name=school-redis)" ]; then
    echo "Redis container is running."
else
    { echo "Redis container is not running. Please start the container."; exit 1; }
fi

# Test database connection
docker exec -it school-postgres pg_isready -U school_admin > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "Successfully connected to the Postgres database."
else
    { echo "Failed to connect to the Postgres database."; exit 1; }
fi

# Test Redis connection
docker exec -it school-redis redis-cli ping > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "Successfully connected to the Redis server."
else
    { echo "Failed to connect to the Redis server."; exit 1; }
fi

echo "=============================================================="
echo "Postgres and Redis setup verification completed successfully."
echo ""
echo "Next Steps:"
echo "1. Access pgAdmin: http://localhost:5050"
echo "2. Connect to Postgres: localhost:5432, User: school_admin, Password: securepassword123"
echo "3. Connect to Redis: localhost:6379"
echo "4. Connection pooling via PgBouncer is set up on port 6432."