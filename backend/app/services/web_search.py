import os
import httpx
import re
import asyncio
from typing import Optional, List, Dict, Any
from urllib.parse import quote_plus, urlparse
from app.core.config import settings

REALTIME_KEYWORDS = [
    "live score", "score", "match", "vs", "t20", "ipl", "weather",
    "today", "latest news", "breaking news", "stock price", "crypto price",
    "who won", "current price", "now", "result", "recent", "what happened",
    "price of", "election", "president", "championship", "update"
]

def should_trigger_search(prompt: str, enable_web_search: bool = False) -> bool:
    if enable_web_search:
        return True
    prompt_lower = prompt.lower()
    return any(keyword in prompt_lower for keyword in REALTIME_KEYWORDS)

async def _fetch_serper(query: str, api_key: str):
    try:
        async with httpx.AsyncClient(timeout=3.5) as client:
            resp = await client.post(
                "https://google.serper.dev/search",
                headers={"X-API-KEY": api_key, "Content-Type": "application/json"},
                json={"q": query, "num": 5}
            )
            if resp.status_code == 200:
                data = resp.json()
                blocks = []
                sources = []
                if "answerBox" in data:
                    box = data["answerBox"]
                    ans = box.get("answer") or box.get("snippet", "")
                    blocks.append(f"Answer Box: {box.get('title', '')} - {ans}")
                if "sportsResults" in data:
                    blocks.append(f"Sports Result: {data['sportsResults']}")
                for item in data.get("organic", [])[:5]:
                    t = item.get("title", "")
                    s = item.get("snippet", "")
                    l = item.get("link", "")
                    blocks.append(f"Title: {t}\nSnippet: {s}\nURL: {l}")
                    domain = urlparse(l).netloc if l else "google.com"
                    sources.append({"title": t, "url": l, "snippet": s, "domain": domain, "sourceType": "live_web_search"})
                return blocks, sources
    except Exception as e:
        print(f"Serper search note: {e}")
    return [], []

async def _fetch_duckduckgo(query: str):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
    }
    blocks = []
    sources = []
    try:
        async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=3.5) as client:
            r = await client.post("https://html.duckduckgo.com/html/", data={"q": query})
            if r.status_code == 200:
                raw_html = r.text
                raw_snippets = re.findall(r'<a class="result__snippet[^"]*"[^>]*>(.*?)</a>', raw_html, re.DOTALL)
                raw_titles = re.findall(r'<a class="result__url[^"]*"[^>]*>(.*?)</a>', raw_html, re.DOTALL)
                
                for i in range(min(5, len(raw_snippets))):
                    clean_snippet = re.sub(r'<[^>]+>', '', raw_snippets[i]).strip()
                    url_text = re.sub(r'<[^>]+>', '', raw_titles[i]).strip() if i < len(raw_titles) else "duckduckgo.com"
                    full_url = "https://" + url_text if not url_text.startswith("http") else url_text
                    
                    blocks.append(f"Web Snippet ({url_text}):\n{clean_snippet}")
                    sources.append({
                        "title": f"Live Web Result: {url_text}",
                        "url": full_url,
                        "snippet": clean_snippet,
                        "domain": urlparse(full_url).netloc or "web",
                        "sourceType": "live_web_search"
                    })
    except Exception as e:
        print(f"DuckDuckGo search note: {e}")
    return blocks, sources

async def _fetch_google_news(query: str):
    blocks = []
    sources = []
    try:
        encoded_q = quote_plus(query)
        news_url = f"https://news.google.com/rss/search?q={encoded_q}&hl=en-US&gl=US&ceid=US:en"
        async with httpx.AsyncClient(timeout=3.5) as client:
            nr = await client.get(news_url)
            if nr.status_code == 200:
                titles = re.findall(r'<title>(.*?)</title>', nr.text)
                links = re.findall(r'<link>(.*?)</link>', nr.text)
                news_headlines = []
                for i in range(1, min(4, len(titles))):
                    headline = titles[i].replace("&amp;", "&").replace("&quot;", '"')
                    news_headlines.append(f"- {headline}")
                    news_link = links[i] if i < len(links) else ""
                    if i < 3:
                        sources.append({
                            "title": headline,
                            "url": news_link or "https://news.google.com",
                            "snippet": f"Breaking coverage: {headline}",
                            "domain": "news.google.com",
                            "sourceType": "live_web_search"
                        })
                if news_headlines:
                    blocks.append("Breaking News Headlines:\n" + "\n".join(news_headlines))
    except Exception as e:
        print(f"Google News notice: {e}")
    return blocks, sources

async def perform_web_search(query: str) -> Optional[Dict[str, Any]]:
    """
    Perform real-time concurrent live web search using Serper (if key set),
    DuckDuckGo Live Web Crawler, and Google News RSS.
    """
    serper_api_key = os.getenv("SERPER_API_KEY")
    tasks = []
    
    if serper_api_key:
        tasks.append(_fetch_serper(query, serper_api_key))
    else:
        tasks.append(_fetch_duckduckgo(query))
    
    # Also fetch live breaking news concurrently
    tasks.append(_fetch_google_news(query))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    all_blocks = []
    all_sources = []

    for r in results:
        if isinstance(r, tuple) and len(r) == 2:
            blocks, sources = r
            all_blocks.extend(blocks)
            all_sources.extend(sources)

    if not all_blocks:
        return None

    return {
        "summary_text": "\n\n".join(all_blocks),
        "sources": all_sources
    }
