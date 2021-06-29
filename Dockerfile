FROM node:12.18-alpine
ENV NODE_ENV=production 
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm i -g @nestjs/cli
RUN npm install --production --silent
RUN npm run build
COPY . .
EXPOSE 4000
CMD ["npm","run" ,"start:prod"]
