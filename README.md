# AI Humanizer

A Next.js application that transforms AI-generated text into more natural, human-like content by reducing formality and adding conversational elements.

## Features

- **Smart Text Processing**: Converts formal AI text into natural, conversational language
- **Multiple Intensity Levels**: Choose from Light, Medium, or Strong humanization
- **Real-time Statistics**: View character, word, sentence, and paragraph counts
- **Copy to Clipboard**: Easily copy the humanized text
- **Improvements Tracking**: See exactly what changes were made to your text
- **Responsive Design**: Works perfectly on desktop and mobile devices

## What It Does

The AI Humanizer applies several transformations to make text more human-like:

- **Adds Contractions**: Converts "do not" to "don't", "it is" to "it's", etc.
- **Simplifies Language**: Replaces complex phrases like "due to the fact that" with "because"
- **Improves Flow**: Adds casual sentence starters and transition words
- **Active Voice**: Converts passive voice constructions to active voice
- **Reduces Formality**: Replaces overly formal connectors with casual alternatives

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **API**: Next.js API Routes
- **Deployment Ready**: Optimized for Vercel deployment

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd ai-humanizer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3001](http://localhost:3001) in your browser

## Usage

1. **Input Text**: Paste your AI-generated text in the left textarea
2. **Select Intensity**: Choose the level of humanization (Light, Medium, Strong)
3. **Humanize**: Click the "Humanize Text" button
4. **Review Results**: Check the output and improvements made
5. **Copy**: Use the copy button to copy the humanized text

## API Endpoints

### POST /api/humanize

Humanizes the provided text based on the specified options.

**Request Body:**
```json
{
  "text": "Your AI-generated text here",
  "options": {
    "intensity": "medium",
    "preserveFormatting": true
  }
}
```

**Response:**
```json
{
  "originalText": "...",
  "humanizedText": "...",
  "stats": {
    "original": { "characters": 100, "words": 20, "sentences": 2, "paragraphs": 1 },
    "humanized": { "characters": 98, "words": 19, "sentences": 2, "paragraphs": 1 }
  },
  "improvements": ["Added contractions", "Simplified language"]
}
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── humanize/
│   │       └── route.ts          # API endpoint for text humanization
│   ├── globals.css               # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main page
├── components/
│   ├── Header.tsx               # App header component
│   ├── TextHumanizer.tsx        # Main humanizer interface
│   └── TextStats.tsx            # Text statistics display
├── lib/
│   └── textUtils.ts             # Text processing utilities
└── types/
    └── index.ts                 # TypeScript type definitions
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Building for Production

```bash
npm run build
npm run start
```

## Deployment

This app is optimized for deployment on Vercel:

1. Push to GitHub
2. Connect to Vercel
3. Deploy automatically

Or deploy manually:
```bash
npm run build
```

## License

This project is open source and available under the [MIT License](LICENSE).
