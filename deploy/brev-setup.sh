#!/bin/bash
set -e

echo "=== TripshotTracker Brev Setup ==="

# Install Node.js 22
if ! command -v node &> /dev/null || [[ $(node -v) != v22* ]]; then
  echo "Installing Node.js 22..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

echo "Node: $(node -v)"
echo "NPM: $(npm -v)"

# Install build essentials for better-sqlite3
apt-get update -y && apt-get install -y build-essential python3 git

# Clone repo
APP_DIR="/root/tripshot-tracker"
if [ ! -d "$APP_DIR" ]; then
  echo "Cloning repository..."
  git clone https://github.com/nvidia-trieaurora/tripshot-tracker.git "$APP_DIR"
else
  echo "Updating repository..."
  cd "$APP_DIR" && git pull origin main
fi

cd "$APP_DIR"

# Install dependencies
echo "Installing dependencies..."
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Build Next.js
echo "Building Next.js app..."
npm run build

# Seed database
echo "Seeding database..."
node -e "
const http = require('http');
const { exec } = require('child_process');
exec('PORT=3333 npm start &', (err) => {
  if (err) console.error(err);
});
setTimeout(() => {
  http.request({hostname:'localhost',port:3333,path:'/api/seed',method:'POST'}, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => { console.log('Seed:', data); process.exit(0); });
  }).end();
}, 5000);
"

# Kill any existing process on port 3333
kill $(lsof -t -i:3333) 2>/dev/null || true
sleep 2

# Create systemd service for auto-start
cat > /etc/systemd/system/tripshot.service << 'SERVICEEOF'
[Unit]
Description=TripshotTracker Next.js App
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/tripshot-tracker
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5
Environment=PORT=3333
Environment=NODE_ENV=production
EnvironmentFile=/root/tripshot-tracker/.env

[Install]
WantedBy=multi-user.target
SERVICEEOF

# Enable and start service
systemctl daemon-reload
systemctl enable tripshot
systemctl start tripshot

echo "=== TripshotTracker is running on port 3333 ==="
echo "Use 'brev port-forward tripshot-tracker -p 3333:3333' to access locally"
echo "Or access via Brev's public URL"
