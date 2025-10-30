# JSON Expert

> **Professional JSON visualization and analysis tool**

Transform complex JSON data into beautiful, interactive visualizations. Analyze, search, validate, and export JSON with ease.

🌐 **Website:** [jsonexpert.com](https://jsonexpert.com)
💻 **GitHub:** [Json-Expert/JsonExpert](https://github.com/Json-Expert/JsonExpert)

---

[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white)

---

## ✨ Features

### 🎯 Multiple Visualization Modes

- **Tree View** - Hierarchical, expandable structure with syntax highlighting
- **Graph View** - Interactive node-based visualization with smart branching
- **Table View** - Sortable, filterable tabular representation
- **Raw View** - Syntax-highlighted JSON editor

### 📥 Flexible Input Options

- **File Upload** - Drag-and-drop support, up to **100MB** files
- **Text Paste** - Direct JSON input with real-time validation
- **URL Fetch** - Load from APIs with CORS proxy support

### 🔍 Advanced Search & Analysis

- **Global Search** - Search across all fields with highlighting
- **Regex Support** - Advanced pattern matching
- **Type Filtering** - Filter by data type
- **Nested Search** - Deep search in complex structures

### 🌳 Smart Data Management

- **Property Inspector** - Click any property to view full content
- **Selective Expansion** - For large arrays, show first 2 items and select others
- **Branch Selection** - Choose which items to expand
- **Optimized Performance** - Handles large datasets efficiently

### 💾 Export & Validation

- **JSON Export** - Formatted or minified
- **CSV Export** - Convert to tabular format
- **PNG Export** - Save visualizations as images
- **Schema Validation** - Validate against JSON Schema

### 🎨 User Experience

- **Dark/Light Theme** - Seamless theme switching
- **Responsive Design** - Works on all devices
- **Toast Notifications** - User-friendly messages
- **No Horizontal Scroll** - Smart container management

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or 20+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Json-Expert/JsonExpert.git

# Navigate to project directory
cd JsonExpert

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev
```

The app will be available at `http://localhost:12355`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### 🐳 Docker Deployment

#### Quick Start with Docker

```bash
# Build Docker image
docker build -t json-expert .

# Run container
docker run -d -p 80:80 --name json-expert json-expert

# Access at http://localhost
```

#### Using Docker Compose

```bash
# Start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

#### Environment Configuration

Create a `.env` file from the example:

```bash
cp .env.example .env
```

**Key configuration options:**

```env
# Domain Configuration
VITE_ALLOWED_DOMAINS=jsonexpert.com,localhost

# File Upload Settings
VITE_MAX_FILE_SIZE=104857600  # 100MB

# Server Port
PORT=80
```

**Custom domain setup:**

```bash
# Set your domain(s)
VITE_ALLOWED_DOMAINS=yourdomain.com,www.yourdomain.com

# Run with custom port
PORT=8080 docker-compose up -d
```

---

## 📖 Usage

### Basic Workflow

1. **Load JSON Data**
   - Drag & drop a file
   - Paste JSON text
   - Fetch from a URL

2. **Visualize**
   - Choose your preferred view mode
   - Expand/collapse nodes
   - Navigate the structure

3. **Search & Filter**
   - Use the global search
   - Apply type filters
   - Try regex patterns

4. **Inspect Details**
   - Click on properties to view full content
   - Browse nested structures
   - Examine complex data

5. **Export**
   - Download as JSON, CSV, or PNG
   - Choose your format

### Working with Large Arrays

For arrays with **3 or more items**:
- First 2 items shown automatically
- Click **"+ X more items"** to select which items to expand
- Choose specific items via modal
- Keep visualization clean and fast

### Property Details

Click on complex properties (objects, arrays, long strings) to:
- View full JSON content in tree format
- See syntax-highlighted data
- Navigate nested structures

---

## 🏗️ Technology

**Built with modern web technologies:**
- React 19 with TypeScript 5
- Vite 7 for blazing fast builds
- Tailwind CSS 4 for styling
- Zustand for state management
- React Flow for graph visualization
- Monaco Editor for code editing

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📝 License

This project is licensed under the **MIT License**.

---

## 📞 Contact

- **Website:** [jsonexpert.com](https://jsonexpert.com)
- **GitHub:** [github.com/Json-Expert/JsonExpert](https://github.com/Json-Expert/JsonExpert)
- **Issues:** [Report a bug](https://github.com/Json-Expert/JsonExpert/issues)

---

<div align="center">

**Made with ❤️ by the JSON Expert Team**

⭐ Star us on GitHub if you find this project useful!

</div>
