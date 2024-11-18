# Use the official node image as the base image
FROM node:16-alpine as build-stage

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Build the Vue.js application for production
RUN npm run build

# Use the official nginx image as the base image for serving the application
FROM nginx:stable-alpine as production-stage

# Copy the built files from the build-stage to the nginx html directory
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy custom nginx configuration files
COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf /etc/nginx/conf.d/default.conf

# Copy the entry point script
COPY start.sh /start.sh

# Make the entry point script executable
RUN chmod +x /start.sh

# Expose port 80
EXPOSE 80

# Set the entry point to the shell script
ENTRYPOINT ["/start.sh"]