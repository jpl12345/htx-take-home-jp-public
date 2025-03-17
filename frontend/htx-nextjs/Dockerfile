FROM node:22.13.0-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Detect system architecture and install the correct @tailwindcss/oxide package
RUN ARCH=$(dpkg --print-architecture) && \
    if [ "$ARCH" = "amd64" ]; then \
        npm install @tailwindcss/oxide-linux-x64-gnu; \
    elif [ "$ARCH" = "arm64" ]; then \
        npm install @tailwindcss/oxide-linux-arm64-gnu; \
    else \
        echo "Unsupported architecture: $ARCH" && exit 1; \
    fi

RUN npm install lightningcss
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
