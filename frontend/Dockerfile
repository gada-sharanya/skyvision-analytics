FROM node:20-slim

WORKDIR /app

# Copy package.json first
COPY package.json ./

# Install dependencies
RUN yarn install

# Copy rest of the application
COPY . .

# Expose port
EXPOSE 3000

# Start the development server
CMD ["yarn", "start"]