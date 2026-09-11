# Ass-DJ (PromptDJ MIDI)

🎵 AI-powered DJ application with MIDI support and Google GenAI integration.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Google GenAI API key

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

Then edit `.env` and add your Google GenAI API key:
```
VITE_GOOGLE_GENAI_API_KEY=your_api_key_here
```

3. **Start development server:**
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 📦 Available Scripts

- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run TypeScript type checking

## 🛠 Tech Stack

- **Frontend Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **UI Components:** Lit Web Components
- **Icons:** Lucide React
- **AI:** Google GenAI API
- **Web Components:** Experimental decorators support

## 📋 Project Structure

```
├── src/              # Source files
├── package.json      # Dependencies and scripts
├── tsconfig.json     # TypeScript configuration
├── vite.config.ts    # Vite configuration
└── README.md         # This file
```

## 🔑 API Keys

This project requires a Google GenAI API key for the AI features. 

Get your key at: https://aistudio.google.com/

## 📝 License

Private repository

## 🤝 Contributing

All commits are welcome!
