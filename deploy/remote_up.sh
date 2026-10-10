cd /opt/mall-swarm/deploy
docker compose config --quiet && echo CONFIG-OK
docker compose up -d mongodb mall-portal 2>&1 | tail -8
sleep 12
echo ===PS===
docker ps --format '{{.Names}} {{.Status}}' | grep -E 'mongodb|mall-portal|mall-mysql'
echo ===MONGO-REACH===
docker run --rm --network mall-swarm_mall-net busybox sh -c 'nc -z -w4 mongodb 27017 && echo MONGO-BY-NAME-OK || echo MONGO-BY-NAME-FAIL'
echo ===PORTAL-MONGO-LOG===
docker logs mall-portal 2>&1 | grep -iE 'mongo' | tail -3