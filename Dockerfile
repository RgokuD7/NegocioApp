  # Utilizar una imagen base de Node.js
  FROM node:23-slim


  # Establecer el directorio de trabajo
  WORKDIR /app

  # Copiar los archivos del proyecto al contenedor
  COPY . .

  # Instalar las dependencias
  RUN npm install

  RUN apt-get update && apt-get install -y ca-certificates
  RUN apt-get update && apt-get install -y snapcraft


  # Construir la aplicación para Windows
  RUN npm run electron:build --win
