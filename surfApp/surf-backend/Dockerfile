# Start from a small official image that already has Node.js 22 installed.
FROM node:22-alpine

# All following commands run inside this folder in the image.
WORKDIR /app

# Copy ONLY the manifests first. Docker caches each step as a layer, so as long
# as package*.json don't change, it reuses the cached "npm install" below and
# doesn't reinstall on every code change.
COPY package*.json ./
RUN npm install

# Now copy the rest of the source and compile TypeScript -> dist/.
COPY . .
RUN npm run build

# Document that the app listens on 3001 (compose maps it to the host).
EXPOSE 3001

# The command that runs when the container starts: run the compiled JS.
CMD ["node", "dist/index.js"]
