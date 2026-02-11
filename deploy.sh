#!/bin/bash

# AI Agent Academy - Quick Deploy Script
# This script helps you deploy the website quickly to various platforms

set -e  # Exit on any error

echo "🤖 AI Agent Academy - Quick Deploy Script"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    print_error "Please run this script from the ai-agent-academy directory"
    exit 1
fi

print_status "Checking project structure..."

# Verify required files exist
REQUIRED_FILES=("index.html" "css/style.css" "js/main.js" "package.json" "vercel.json" "manifest.json" "robots.txt")

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Missing required file: $file"
        exit 1
    fi
done

print_success "All required files present ✓"

# Check if Node.js and npm are installed
if command -v node > /dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    print_status "Node.js version: $NODE_VERSION"
else
    print_warning "Node.js not installed (optional for static deployment)"
fi

if command -v npm > /dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    print_status "npm version: $NPM_VERSION"
else
    print_warning "npm not installed (optional for static deployment)"
fi

# Generate sitemap if Node.js is available
if command -v node > /dev/null 2>&1; then
    print_status "Generating sitemap..."
    if [ -f "scripts/generate-sitemap.js" ]; then
        node scripts/generate-sitemap.js
        print_success "Sitemap generated"
    else
        print_warning "Sitemap generator not found, skipping..."
    fi
fi

echo ""
echo "🚀 Choose your deployment platform:"
echo "1) Vercel (Recommended)"
echo "2) Netlify" 
echo "3) GitHub Pages"
echo "4) Firebase Hosting"
echo "5) Local Development Server"
echo "6) Generate deployment package (ZIP)"
echo ""

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo ""
        print_status "Deploying to Vercel..."
        
        if command -v vercel > /dev/null 2>&1; then
            vercel --prod
            print_success "Deployed to Vercel! ✨"
        else
            print_warning "Vercel CLI not installed. Installing now..."
            npm install -g vercel
            vercel login
            vercel --prod
            print_success "Deployed to Vercel! ✨"
        fi
        ;;
        
    2)
        echo ""
        print_status "Preparing for Netlify deployment..."
        
        # Create _redirects file for SPA routing
        echo "/*    /index.html   200" > _redirects
        
        print_success "Files prepared for Netlify"
        print_status "Next steps:"
        echo "1. Create account at netlify.com"
        echo "2. Drag and drop this entire folder to Netlify"
        echo "3. Or connect your Git repository for continuous deployment"
        ;;
        
    3)
        echo ""
        print_status "Preparing for GitHub Pages..."
        
        if command -v git > /dev/null 2>&1; then
            git add .
            git commit -m "Deploy AI Agent Academy to GitHub Pages"
            git push origin main
            
            print_success "Files pushed to GitHub"
            print_status "Next steps:"
            echo "1. Go to your repository settings on GitHub"
            echo "2. Scroll to 'Pages' section"
            echo "3. Select 'Deploy from a branch' → 'main' → '/ (root)'"
            echo "4. Your site will be available at: https://username.github.io/repository-name"
        else
            print_error "Git not installed. Please install Git and initialize repository first."
        fi
        ;;
        
    4)
        echo ""
        print_status "Preparing for Firebase deployment..."
        
        if command -v firebase > /dev/null 2>&1; then
            firebase init hosting
            firebase deploy
            print_success "Deployed to Firebase! ✨"
        else
            print_warning "Firebase CLI not installed. Installing now..."
            npm install -g firebase-tools
            firebase login
            firebase init hosting
            firebase deploy
            print_success "Deployed to Firebase! ✨"
        fi
        ;;
        
    5)
        echo ""
        print_status "Starting local development server..."
        
        if command -v python3 > /dev/null 2>&1; then
            print_status "Starting Python HTTP server on port 8000..."
            python3 -m http.server 8000
        elif command -v python > /dev/null 2>&1; then
            print_status "Starting Python HTTP server on port 8000..."
            python -m http.server 8000
        elif command -v npx > /dev/null 2>&1; then
            print_status "Starting Node.js HTTP server on port 8000..."
            npx http-server -p 8000
        else
            print_error "No suitable HTTP server found. Please install Python or Node.js"
            exit 1
        fi
        ;;
        
    6)
        echo ""
        print_status "Creating deployment package..."
        
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        PACKAGE_NAME="ai-agent-academy_${TIMESTAMP}.zip"
        
        # Exclude unnecessary files
        zip -r "$PACKAGE_NAME" . \
            -x "*.git*" \
            -x "node_modules/*" \
            -x "*.log" \
            -x ".env*" \
            -x "*.zip" \
            -x ".DS_Store"
        
        print_success "Package created: $PACKAGE_NAME"
        print_status "You can now upload this ZIP file to any static hosting service"
        ;;
        
    *)
        print_error "Invalid choice. Please run the script again and select 1-6."
        exit 1
        ;;
esac

echo ""
print_success "🎉 Deployment process completed!"
echo ""
print_status "📊 Post-deployment checklist:"
echo "• Verify website loads correctly"
echo "• Test mobile responsiveness" 
echo "• Check all interactive features work"
echo "• Submit sitemap to Google Search Console"
echo "• Set up analytics tracking"
echo "• Configure uptime monitoring"
echo ""
print_status "📖 For detailed deployment instructions, see DEPLOYMENT.md"
print_status "🆘 For support, check README.md or visit our community"
echo ""
print_success "Happy building! 🚀"