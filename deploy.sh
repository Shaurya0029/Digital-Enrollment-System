#!/bin/bash
# Quick GitHub Deployment Script for Digital Enrollment System

set -e  # Exit on error

echo "=========================================="
echo "Digital Enrollment System - GitHub Deployment"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    exit 1
fi

# Stage all changes
echo -e "${BLUE}📝 Staging changes...${NC}"
git add .

# Get commit message
read -p "Enter commit message: " commit_msg
if [ -z "$commit_msg" ]; then
    commit_msg="Update project"
fi

# Commit
echo -e "${BLUE}💾 Committing changes...${NC}"
git commit -m "$commit_msg"

# Push to GitHub
echo -e "${BLUE}🚀 Pushing to GitHub...${NC}"
git push origin main

# Deploy frontend
read -p "Deploy frontend to GitHub Pages? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🌐 Building and deploying frontend...${NC}"
    cd frontend
    npm run deploy
    cd ..
    echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "✅ Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo "Your repository is available at:"
echo -e "${YELLOW}https://github.com/YOUR_USERNAME/Digital-Enrollment-System${NC}"
echo ""
echo "Frontend will be available at:"
echo -e "${YELLOW}https://YOUR_USERNAME.github.io/Digital-Enrollment-System${NC}"
echo ""
