FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD [ "npm", "start" ]
#need to test if this works
# CMD [ "npx", "pm2-runtime", "start", "npm", "--", "start" ]
