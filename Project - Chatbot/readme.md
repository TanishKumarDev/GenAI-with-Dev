# 🤖 GenAI Chatbot

A modern, full-stack chatbot application that combines the power of Groq's AI with real-time external data sources for intelligent, context-aware conversations.

## 🌟 Features

- **🤖 AI-Powered Conversations**: Powered by Groq's LLaMA 3.3 70B model for fast, intelligent responses
- **🕒 Real-Time Data Integration**: 
  - WorldTimeAPI for accurate date/time information
  - Tavily API for current events, weather, news, and stocks
- **💾 Conversation Memory**: Persistent chat history using localStorage
- **🛡️ Production-Ready Backend**:
  - Rate limiting for abuse prevention
  - Input validation with Joi
  - Structured logging with Winston
  - CORS enabled for frontend integration
- **🎨 Modern UI**: Responsive design with Tailwind CSS and dark theme
- **⚡ Scalable Architecture**: Modular code structure for easy extensions

## 🏗️ Architecture

```
Frontend (HTML/CSS/JS) ↔ Backend (Node.js/Express) ↔ External APIs (Groq, WorldTimeAPI, Tavily)
```

### Backend Components:
- **Express Server** with middleware chain
- **Rate Limiting** - 100 requests per 15 minutes
- **Input Validation** - Joi schema validation
- **Structured Logging** - Winston with file and console transport
- **External API Integration** - Real-time data enrichment
- **Error Handling** - Comprehensive error middleware

### Frontend Components:
- **Responsive UI** - Tailwind CSS with dark theme
- **Local Storage** - Client-side conversation persistence
- **Real-time Updates** - Dynamic message rendering
- **Thinking Indicator** - Better UX during API calls

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- API keys for:
  - Groq API
  - Tavily API (optional)

### Installation

1. **Clone and setup:**
```bash
git clone <your-repo>
cd genai-chatbot
npm install
```

2. **Environment Configuration:**
Create a `.env` file:
```env
PORT=5000
GROQ_API_KEY=your_groq_api_key_here
TAVILY_API_KEY=your_tavily_api_key_optional
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
TIMEZONE=Etc/UTC
```

3. **Start the backend:**
```bash
npm start
```

4. **Open the frontend:**
Open `index.html` in your browser or serve it with a local server.

## 📁 Project Structure

```
genai-chatbot/
├── server.js          # Backend Express server
├── index.html         # Frontend HTML
├── script.js          # Frontend JavaScript
├── style.css          # Additional CSS styles
├── .env               # Environment variables
├── app.log           # Winston logs
└── README.md         # This file
```

## 🔧 API Endpoints

### POST `/chat`
Main chat endpoint that processes messages and returns AI responses.

**Request Body:**
```json
{
  "message": "What's the weather today?",
  "history": [
    {"sender": "user", "text": "Hello"},
    {"sender": "bot", "text": "Hi there!"}
  ]
}
```

**Response:**
```json
{
  "reply": "The current weather in your area is sunny with a temperature of 72°F."
}
```

## 🛠️ Configuration

### Environment Variables
- `PORT`: Server port (default: 5000)
- `GROQ_API_KEY`: Your Groq API key (required)
- `TAVILY_API_KEY`: Tavily API key for real-time data (optional)
- `RATE_LIMIT_WINDOW`: Rate limit window in ms (default: 15 minutes)
- `RATE_LIMIT_MAX`: Max requests per window (default: 100)
- `TIMEZONE`: Timezone for WorldTimeAPI (default: Etc/UTC)

### Model Configuration
- **Model**: `llama-3.3-70b-versatile`
- **Max Tokens**: 200
- **Temperature**: 0.3 (for consistent responses)

## 💡 Usage Examples

The chatbot automatically detects and enriches conversations with real-time data:

- **"What's the current time?"** → Uses WorldTimeAPI
- **"What's the weather in NYC?"** → Uses Tavily for live weather
- **"Latest tech news"** → Fetches current news via Tavily
- **"Tell me about today's events"** → Combines date + real-time events

## 🔒 Security Features

- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Sanitizes and validates all inputs
- **CORS**: Configured for secure frontend-backend communication
- **Error Handling**: Graceful failure handling without exposing internals

## 📈 Scaling Considerations

The architecture supports easy scaling:

- **Redis Integration**: For distributed rate limiting and caching
- **Database**: For persistent conversation storage
- **Microservices**: Split external API integrations
- **Load Balancing**: Multiple backend instances
- **Monitoring**: Integration with ELK stack or Sentry

## 🐛 Troubleshooting

### Common Issues:

1. **"Could not connect to server"**
   - Ensure backend is running on port 5000
   - Check CORS configuration

2. **"AI error" in responses**
   - Verify Groq API key is valid
   - Check API rate limits

3. **No real-time data**
   - Tavily API key optional - features degrade gracefully
   - Check Tavily API status

### Logs:
Check `app.log` for detailed error information and request logs.

## 🎨 Customization

### Styling:
Modify Tailwind config in `index.html` or add custom CSS in `style.css`

### Adding New Features:
1. **New External APIs**: Add functions following the Tavily pattern
2. **UI Components**: Extend the frontend JavaScript
3. **Middleware**: Add to Express middleware chain
4. **Validation**: Update Joi schemas

## 📄 License

MIT License - feel free to use and modify for your projects.

## 🤝 Contributing

1. Fork the project
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

**Built with ❤️ using Express, Groq, and modern web technologies**