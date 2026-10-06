import os
import httpx
import re
from typing import Optional, List, Dict, Any
from app.core.config import settings

REALTIME_KEYWORDS = [
    "live score", "score", "match", "vs", "t20", "ipl", "weather",
    "today", "latest news", "breaking news", "stock price", "crypto price",
    "who won", "current price", "now", "result", "recent", "what happened"
]

def should_trigger_search(prompt: str, enable_web_search: bool = False) -> bool:
    if enable_web_search:
        return True
    prompt_lower = prompt.lower()
    return any(keyword in prompt_lower for keyword in REALTIME_KEYWORDS)

async def perform_web_search(query: str) -> Optional[str]:
    """Perform real-time web search using Serper API or DuckDuckGo API fallback."""
    serper_api_key = os.getenv("SERPER_API_KEY")
    
    # 1. Try Serper API if key available
    if serper_api_key:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    "https://google.serper.dev/search",
                    headers={
                        "X-API-KEY": serper_api_key,
                        "Content-Type": "application/json"
                    },
                    json={"q": query, "num": 5},
                    timeout=10.0
                )
                if resp.status_code == 200:
                    data = resp.json()
                    results = []
                    # Check for Answer Box / Knowledge Graph (e.g. live sports scores)
                    if "answerBox" in data:
                        box = data["answerBox"]
                        results.append(f"Answer Box: {box.get('title', '')} - {box.get('answer', '') or box.get('snippet', '')}")
                    if "sportsResults" in data:
                        results.append(f"Sports Result: {data['sportsResults']}")
                    for item in data.get("organic", [])[:5]:
                        results.append(f"Title: {item.get('title')}\nSnippet: {item.get('snippet')}\nURL: {item.get('link')}")
                    if results:
                        return "\n\n".join(results)
        except Exception as e:
            print(f"Serper API search warning: {e}")

    # 2. DuckDuckGo Free JSON/HTML Search Fallback
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://api.duckduckgo.com/",
                params={"q": query, "format": "json", "no_html": "1", "skip_disambig": "1"},
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
                timeout=10.0
            )
            if resp.status_code == 200:
                data = resp.json()
                abstract = data.get("AbstractText")
                if abstract:
                    return f"DuckDuckGo Instant Answer: {abstract}"
                related = [topic.get("Text") for topic in data.get("RelatedTopics", []) if isinstance(topic, dict) and topic.get("Text")]
                if related:
                    return "DuckDuckGo Web Snippets:\n" + "\n".join(related[:5])
    except Exception as e:
        print(f"DuckDuckGo search warning: {e}")

    return None
