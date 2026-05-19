#!/bin/bash

# Recipe Scraper Setup Script
# This script sets up the Python environment and installs dependencies

set -e  # Exit on error

echo "🍳 Setting up Recipe Scraper API..."
echo ""

# Check Python version
echo "📋 Checking Python version..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed"
    echo "Please install Python 3.8 or higher from https://www.python.org/"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
REQUIRED_VERSION="3.8"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Error: Python $REQUIRED_VERSION or higher is required"
    echo "Current version: $PYTHON_VERSION"
    exit 1
fi

echo "✅ Python $PYTHON_VERSION detected"
echo ""

# Create virtual environment
echo "🔧 Creating virtual environment..."
if [ -d "venv" ]; then
    echo "⚠️  Virtual environment already exists. Skipping creation."
else
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi
echo ""

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate
echo "✅ Virtual environment activated"
echo ""

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip --quiet
echo "✅ pip upgraded"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt
echo "✅ Dependencies installed"
echo ""

# Test installation
echo "🧪 Testing installation..."
python3 -c "from recipe_scrapers import scrape_me; print('✅ recipe-scrapers imported successfully')"
python3 -c "from flask import Flask; print('✅ Flask imported successfully')"
echo ""

echo "🎉 Setup complete!"
echo ""
echo "To start the development server:"
echo "  1. Activate the virtual environment: source venv/bin/activate"
echo "  2. Run the server: python app.py"
echo ""
echo "The API will be available at http://localhost:5001"
echo ""
echo "For production deployment, use: gunicorn -w 4 -b 0.0.0.0:5001 app:app"

# Made with Bob
