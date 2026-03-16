# ============== Docker Command Cheatsheet ==============

## Start/Stop
docker-compose up -d
docker-compose down
docker-compose restart
docker-compose down -v

## Logs
docker-compose logs -f
docker-compose logs -f postgres
docker-compose logs --tail=100

## Status
docker-compose ps
docker stats

## Database Access
docker exec -it school-postgres psql -U school_admin -d school_management_db

## Redis Access
docker exec -it school-redis redis-cli

## Back (Manual)
docker exec school-postgres pg_dump -U school_admin school_managemnt_db > backup.sql

## Restore 
cat backup.sql | docker exec -i school-postgres psql -U school_admin -d school_management_db

## Clean Everything (Danger)
docker-compose down -v --remove-orphans
rm -rf ../../data/*