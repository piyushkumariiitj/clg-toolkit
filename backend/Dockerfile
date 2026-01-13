# Use Node.js 18 (LTS) on Alpine Linux for a small image
FROM node:18-alpine

# Install Ghostscript
# Alpine's package manager is 'apk'
RUN apk add --no-cache ghostscript

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
