# Como rodar no Windows

Em cada terminal faça: 

1. Inicie o MongoDB:
& "C:\Program Files\MongoDB\server\bin\mongod.exe" --dbpath "C:\Users\thail\mongodb-data"

2. Inicie o servidor Node.js:
set NODE_ENV=development
node server.js

3. Rode o frontend:
yarn webpack-dev-server --hot --progress --color

Acesse: http://localhost:9000

