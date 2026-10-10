#!/bin/bash
for img in mysql:8.0.44 eclipse-temurin:17-jre python:3.11-slim nginx:1.25; do
  if docker images --format '{{.Repository}}:{{.Tag}}' | grep -qx "$img"; then
    echo "$img EXISTS"
  else
    echo "pulling $img ..."
    if timeout 480 docker pull "$img" >/dev/null 2>&1; then
      echo "$img OK"
    else
      echo "$img FAIL"
    fi
  fi
done
