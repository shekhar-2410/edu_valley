#!/bin/bash

echo "================================"
echo "Building Docker Images..."
echo "================================"
echo

docker-compose build

echo
echo "================================"
echo "Build Complete!"
echo "================================"
echo
echo "To start the application, run:"
echo "  docker-compose up -d"
echo
