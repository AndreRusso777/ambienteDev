# Use the official Node.js 20 image as the base image
FROM node:22.14.0-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# RUN npm install next@latest --legacy-peer-deps

# Install dependencies
RUN npm install --legacy-peer-deps


# Copy the rest of the application code to the working directory
COPY . .

# Expose the port Next.js runs on (default is 3000)
EXPOSE 3000

# Set the default command to start the Next.js development server
# CMD ["npm", "run", "dev"]
# CMD ["npm run build && npm run start"]
CMD ["sh", "-c", "npm run build && npm run start"]
