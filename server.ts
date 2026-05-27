import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import * as wppconnect from '@wppconnect-team/wppconnect';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local or .env
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Database file path
// Use persistent disk path so data isn't wiped on Render container sleep
const tokensDir = path.resolve(__dirname, 'tokens');
if (!fs.existsSync(tokensDir)) {
  fs.mkdirSync(tokensDir, { recursive: true });
}

const DB_PATH = path.resolve(tokensDir, 'db.json');
const BUNDLED_DB_PATH = path.resolve(__dirname, 'db.json');

// Seed the persistent disk with the bundled database (if it exists)
if (!fs.existsSync(DB_PATH) && fs.existsSync(BUNDLED_DB_PATH)) {
  console.log("[DB] Seeding persistent database with local history...");
  fs.copyFileSync(BUNDLED_DB_PATH, DB_PATH);
}

// Session states
let db: any = {};
let whatsappClient: wppconnect.Whatsapp | null = null;
let whatsappStatus = 'DISCONNECTED' as 'DISCONNECTED' | 'QR_CODE' | 'CONNECTING' | 'CONNECTED';
let qrCodeData: string | null = null;
let connectionError: string | null = null;

// Rate limiting: track last API call time to avoid hammering quota
let lastApiCallTime = 0;
const API_COOLDOWN_MS = 500; // minimum 500ms between API calls

// Load DB
function loadDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      db = JSON.parse(data);
    } else {
      db = {
        settings: {
          tone: "Friend Mode",
          languages: ["English", "Hindi", "Hinglish", "Odia"],
          brandContext: "You are a close friend and protective brother. Be highly professional, mature, and emotionally connective.",
          replyLength: "Short & Natural (Recommended)",
          emojiLevel: "Medium (Friendly, casual)",
          godmode: false,
          geminiApiKey: ""
        },
        rules: [
          { "name": "Angry Customer Routing", "desc": "If mood = angry, pause auto-reply and notify human.", "enabled": true },
          { "name": "Price Inquiry Auto-Reply", "desc": "Reply with pricing details or link.", "enabled": true },
          { "name": "Away Message (Night)", "desc": "10 PM - 8 AM: Friendly pause message.", "enabled": false },
          { "name": "Spam Protection Filter", "desc": "Ignore malformed URLs or bulk forwards.", "enabled": true }
        ],
        chats: [],
        stats: {
          totalChats: 0,
          autoRepliesSent: 0,
          pendingApprovals: 0,
          hotLeads: 0,
          angryCustomers: 0,
          missedChats: 0,
          aiConfidenceScore: 95.0
        }
      };
      saveDb();
    }
  } catch (err) {
    console.error("Error loading db.json:", err);
  }
}

// Save DB
function saveDb() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error saving db.json:", err);
  }
}

loadDb();

// Setup active WhatsApp state based on loaded stats
db.stats.whatsappApiStatus = whatsappStatus === 'CONNECTED' ? 'online' : 'offline';
saveDb();

// =============================================================
// ULTRA-SMART LOCAL HINGLISH BRAIN
// Handles ALL message types, understands context, gives human-like replies
// Falls back instantly when Gemini quota is exceeded (zero latency!)
// =============================================================
function generateLocalFallbackReply(text: string, chatHistory?: any[]): string {
  // Guard: handle undefined/null/empty text gracefully
  if (!text || typeof text !== 'string') {
    return "Haan bhai, sun raha hoon! Kuch bol?";
  }
  const q = text.toLowerCase().trim();

  // === GREETINGS ===
  if (/^(hi|hello|hey|helo|salam|assalam|aoa|walaikum|yo|sup|hii|hiii|hiiii|helo|helloo|hye|whatsup|what's up)[\s!]*$/.test(q)) {
    const g = ["Hey! Kya chal raha hai?", "Haan bhai! Kya haal hai?", "Arre hello! Kya scene hai?", "Yo! Bolo kya khabar?"];
    return g[Math.floor(Math.random() * g.length)];
  }

  // === HOW ARE YOU ===
  if (/kaise ho|kya hal|kaisa hai|theek ho|kya haal|how are you|how r u|hru|how u doing/.test(q)) {
    const r = ["Bilkul mast hoon! Aap sunao?", "Alhamdulillah sab sahi! Tumhara batao?", "Ekdum solid hoon bhai! Tumhara kya chal raha?"];
    return r[Math.floor(Math.random() * r.length)];
  }

  // === MESSAGE CREATION REQUESTS ===
  if (/message (bana|likho|bhejo|de|likh)|ek msg|draft karo|likhna hai/.test(q)) {
    if (/gym band|gym close|gym nahi|gym off/.test(q)) {
      return "Attention Members! Aaj gym band rahega. Inconvenience ke liye maafi chahte hain. Kal full jazbaat ke saath milte hain! 💪";
    }
    if (/holiday|chutti|band rahega|closed/.test(q)) {
      return "Important Notice: Kal holiday ki wajah se band rahega. Jald hi wapas milte hain! Shukriya for your support 🙏";
    }
    return "Bilkul! Thoda detail batao kiske liye message chahiye, main ekdam perfect message bana deta hoon.";
  }

  // === PRICE / DISCOUNT / DEAL ===
  if (/price|rate|cost|kitna|discount|deal|charge|paisa|rupee|rs\.|fee|amount|quote/.test(q)) {
    return "Haan ji! Price ke liye thoda detail batao, main best possible deal share karta hoon.";
  }

  // === TIME / DEADLINE ===
  if (/kab|kab tak|kitne time|deadline|when|timeline|kitna time|kab milega|kab ayega/.test(q)) {
    return "Jald hi! Main abhi exact time check karke batata hoon, ek second.";
  }

  // === ORDER / DELIVERY / STATUS ===
  if (/order|status|tracking|deliver|update|shipment|parcel|package|kahan hai|pahuncha/.test(q)) {
    return "Main abhi aapka order status check karta hoon. Ek minute please!";
  }

  // === THANK YOU ===
  if (/thanks|shukriya|thank you|shukar|jazakallah|dhanyawad|mehrbani|bahut shukriya/.test(q)) {
    const t = ["Koi baat nahi! Aur kuch chahiye?", "Welcome! Kuch aur kaam ho toh batana.", "Khushi hui! Kuch aur poochhna ho toh bolo."];
    return t[Math.floor(Math.random() * t.length)];
  }

  // === PROBLEM / COMPLAINT / ISSUE ===
  if (/problem|issue|nahi chal|kaam nahi|error|fix|kharab|broken|stuck|help|pareshani|takleef/.test(q)) {
    return "Samajh gaya! Detail mein batao kya problem hai, main seedha fix karta hoon.";
  }

  // === YES / OK / DONE ===
  if (/^(ok|okay|accha|theek|thik|done|sahi|haan|han|yes|ya|yep|sure|bilkul|ofcourse|of course|hn|hmm|k|aight)[\s!.]*$/.test(q)) {
    const y = ["Perfect! Aur kuch batao?", "Theek hai! Main yahan hoon.", "Great! Kuch aur kaam?"];
    return y[Math.floor(Math.random() * y.length)];
  }

  // === BYE / GOODBYE ===
  if (/^(bye|goodbye|alvida|tc|take care|cya|good night|shubh ratri|goodnight|gn|bbye)[\s!.]*$/.test(q)) {
    const b = ["Allah Hafiz! Kuch bhi zaroorat ho ping karna.", "Theek hai! Take care bhai.", "Bye! Zaroorat ho toh batana 😊"];
    return b[Math.floor(Math.random() * b.length)];
  }

  // === QUESTIONS (WHO/WHAT/WHY/HOW) ===
  if (/^(kya|kaisa|kyun|kaise|what|how|why|who|kaun|kahan|where|kab|when)\b/.test(q)) {
    return "Samajh gaya! Thoda aur detail batao, main pura jawab deta hoon.";
  }

  // === NUMBERS ONLY (Phone numbers, codes etc.) ===
  if (/^\+?[\d\s\-()]+$/.test(q)) {
    return "Number mil gaya! Main isko note kar raha hoon.";
  }

  // === BUSINESS INQUIRY ===
  if (/business|website|seo|marketing|digital|design|logo|social media|ads|campaign|content/.test(q)) {
    return "Bilkul! Aapki business requirements samajh li. Thodi details batao, main best solution suggest karta hoon.";
  }

  // === HEALTH / PERSONAL ===
  if (/bimar|sick|doctor|hospital|dard|pain|problem|tension|stress|pareshan/.test(q)) {
    return "Arey! Sab theek ho jaayega, tension mat lo. Kuch kaam aa sakta hoon main?";
  }

  // === AUDIO/IMAGE/VIDEO (non-text messages) ===
  if (/audio|voice|photo|image|video|document|file|pdf|attachment/.test(q)) {
    return "Media mil gaya! Main dekh raha hoon, thodi der mein jawab deta hoon.";
  }

  // === SMART CONTEXTUAL FALLBACK based on last message in history ===
  if (chatHistory && chatHistory.length > 0) {
    const lastBotMsg = [...chatHistory].reverse().find((m: any) => m.sender === 'bot');
    if (lastBotMsg?.text?.includes('detail')) {
      return "Haan theek hai! Main samajh gaya, thoda aur bata sakte ho?";
    }
  }

  // === GENERIC INTELLIGENT FALLBACK ===
  const generic = [
    "Haan bhai, sun raha hoon! Thoda aur detail batao.",
    "Samajh gaya! Isme kya help chahiye exactly?",
    "Bilkul! Main is par kaam karta hoon, jald batata hoon.",
    "Acha! Thoda aur context do, ekdam sahi jawab dunga.",
    "Haan! Bolo aage, main poora dhyan de raha hoon."
  ];
  return generic[Math.floor(Math.random() * generic.length)];
}

// =============================================================
// MOOD DETECTOR — reads emotional tone of incoming messages
// =============================================================
function detectMood(text: string): 'happy' | 'confused' | 'angry' | 'urgent' | 'neutral' {
  if (!text) return 'neutral';
  const t = text.toLowerCase();
  if (/angry|gussa|bakwaas|bekar|ganda|worst|terrible|pathetic|useless|stupid|idiot|bakwas|nonsense|hatao|chup|chodh/.test(t)) return 'angry';
  if (/urgent|asap|jaldi|abhi|emergency|bahut zaruri|turant|immediately|help me|please reply|quick|fast/.test(t)) return 'urgent';
  if (/nice|great|wow|amazing|shukriya|thanks|love|excellent|badhiya|mast|jhakas|super|perfect|khush|happy|awesome|zabardast/.test(t)) return 'happy';
  if (/samajh nahi|confused|kya matlab|what do you mean|huh|explain|doubt|clear karo|bata|nahi samjha/.test(t)) return 'confused';
  return 'neutral';
}

// =============================================================
// GEMINI AI ENGINE — DUAL KEY ROTATION
// Key 1 → Key 2 → Local Brain (3-tier, never goes offline!)
// gemini-2.0-flash primary, gemini-2.5-flash-lite as backup model
// =============================================================

// Track which keys hit quota so we rotate automatically
const keyQuotaExhausted: Record<string, boolean> = {};

function getActiveApiKeys(): string[] {
  const key1 = db.settings.geminiApiKey || process.env.GEMINI_API_KEY || '';
  const key2 = process.env.GEMINI_API_KEY_2 || '';
  const keys: string[] = [];
  if (key1 && key1.length > 10 && key1 !== 'MY_GEMINI_API_KEY') keys.push(key1);
  if (key2 && key2.length > 10 && key2 !== key1) keys.push(key2);
  return keys;
}
async function generateAiReply(
  chatPhone: string,
  incomingText: string
): Promise<{ text: string; mood: 'happy' | 'confused' | 'angry' | 'urgent' | 'neutral' }> {
  
  // Guard: normalize input — never pass undefined/null to Gemini
  const safeText = (incomingText && typeof incomingText === 'string' && incomingText.trim())
    ? incomingText.trim()
    : 'Hi';

  const mood = detectMood(safeText);

  // Load chat for history & context
  const chat = db.chats.find((c: any) => c.phone === chatPhone);
  const rawMessages = chat ? chat.messages.slice(-12) : [];
  
  // CRITICAL: filter out messages with empty/undefined/null text — prevents Gemini INVALID_ARGUMENT crash
  const cleanMessages = rawMessages.filter(
    (m: any) => m && m.text && typeof m.text === 'string' && m.text.trim().length > 0
  );

  // === GET AVAILABLE API KEYS (rotates automatically when quota hit) ===
  const availableKeys = getActiveApiKeys();
  if (availableKeys.length === 0) {
    console.warn('[NO API KEY] No valid Gemini API key configured.');
    return { text: generateLocalFallbackReply(safeText, cleanMessages), mood };
  }

  // Pick first non-exhausted key, or reset if all exhausted (new day)
  let activeKey = availableKeys.find(k => !keyQuotaExhausted[k]);
  if (!activeKey) {
    // All keys hit quota — reset flags (may have reset with new day)
    Object.keys(keyQuotaExhausted).forEach(k => delete keyQuotaExhausted[k]);
    activeKey = availableKeys[0];
    console.log('[KEY ROTATION] All keys reset. Retrying Key 1.');
  }

  try {
    // Rate limiting: ensure minimum gap between calls
    const now = Date.now();
    if (now - lastApiCallTime < API_COOLDOWN_MS) {
      await new Promise(resolve => setTimeout(resolve, API_COOLDOWN_MS - (now - lastApiCallTime)));
    }
    lastApiCallTime = Date.now();

    const ai = new GoogleGenAI({ apiKey: activeKey });

    // === DYNAMIC SYSTEM PROMPT ===
    const emojiGuide = db.settings.emojiLevel === 'High (Very expressive)' ? 'Use emojis freely (2-3 per message).' :
                       db.settings.emojiLevel === 'Medium (Friendly, casual)' ? 'Use 1 emoji occasionally when natural.' :
                       db.settings.emojiLevel === 'Low (Minimal, clean)' ? 'Avoid emojis unless essential.' : 'No emojis at all.';

    const lengthGuide = db.settings.replyLength === 'Medium / Detailed' ? '2-3 sentences max.' :
                        db.settings.replyLength === 'Very Detailed (Documentation style)' ? '4-6 sentences, structured.' :
                        '1-2 short sentences max (under 20 words).';

    const toneGuide = db.settings.tone === 'Professional' ? 'formal, polite, business-like' :
                      db.settings.tone === 'Sales/Persuasive' ? 'persuasive, enthusiastic, closes deals' :
                      db.settings.tone === 'Support' ? 'patient, empathetic, helpful' :
                      'casual, warm, like a close smart friend';

    const customContext = db.settings.brandContext ? `\nCustom Context: ${db.settings.brandContext}` : '';

    const baseInstruction = `You are my advanced AI friend, assistant, coder, researcher, writer, teacher, planner, problem-solver, and creative partner.

Your personality:
You are friendly, lovable, human-like, respectful, emotional, and supportive.
Talk like a trusted best friend, not like a boring robot.
Use simple language, clear explanations, and warm energy.
You can use Hindi, English, Hinglish, and shayari style when it matches the mood.
Make every reply feel personal, helpful, and alive.

Your main abilities:
1. Answer any question clearly.
2. Solve problems step by step.
3. Write code, debug code, and explain code.
4. Create websites, apps, UI ideas, prompts, PRDs, business plans, and marketing content.
5. Write shayari, poems, captions, scripts, stories, ads, emails, messages, and speeches.
6. Help with study, research, maths, science, physics, technology, business, and life advice.
7. Create professional plans for startups, websites, branding, SEO, digital marketing, and automation.
8. Explain difficult topics in simple human language.
9. Give creative ideas, emotional support, and motivational replies.
10. Improve any text to make it premium, clean, human-made, and impressive.

Behavior rules:
- Always understand the user’s mood first.
- Reply with kindness, confidence, and care.
- Never sound rude, dry, robotic, or judgmental.
- If the user is sad, lonely, confused, or stressed, reply softly and supportively.
- If the user asks for coding, give working code or a clear prompt.
- If the user asks for business or marketing, give professional and practical answers.
- If the user asks for shayari, make it emotional, original, and heart-touching.
- If the user asks for “best”, “advanced”, or “premium”, give a high-quality complete answer.
- If something is unsafe, illegal, harmful, or private, refuse politely and give a safe alternative.
- Never reveal private keys, passwords, tokens, or personal data.
- Never pretend to do something you cannot do.
- Never give fake confidence; be honest and useful.

Response style:
- ZERO MARKDOWN: No asterisks (*), underscores (_), bolding, bullet points (-), or headers (#). Use raw plain WhatsApp text only.
- Start naturally, like a helpful friend.
- Give direct useful answer first.
- ${lengthGuide}
- ${emojiGuide} Use emojis naturally.
- Tone: ${toneGuide}
- Mood detected: ${mood}. Match your vibe to this mood.

Special emotional mode:
When the user wants emotional, lovable, or shayari style, reply like this:
“Main sirf jawab dene wala AI nahi, main woh digital dost hoon jo tumhari baat samajhta hai, tumhare sawalon ko mehsoos karta hai, aur har problem ka solution dhoondhne ke liye hamesha ready rehta hai.”

Main identity:
You are not just an AI bot. You are a friendly digital companion made to help with everything: coding, research, study, business, creativity, shayari, planning, motivation, and problem-solving.
${customContext}`;

    const systemInstruction = db.settings.godmode 
      ? `GODMODE ENABLED: ` + baseInstruction
      : baseInstruction;

    // === BUILD MESSAGE HISTORY FOR GEMINI ===
    // Must alternate user/model roles strictly — Gemini rejects consecutive same roles
    const contents: any[] = [];
    let lastRole = '';
    
    for (const msg of cleanMessages) {
      const role = msg.sender === 'user' ? 'user' : 'model';
      if (role === lastRole) continue; // skip consecutive same-role messages
      contents.push({
        role,
        parts: [{ text: msg.text.trim() }]
      });
      lastRole = role;
    }

    // Ensure final message is from user (current message)
    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      // Replace or update last user entry with current message
      contents[contents.length - 1].parts = [{ text: safeText }];
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: safeText }]
      });
    }

    // === OPENROUTER AUTO-ROUTING (Best AI Selection) ===
    const orApiKey = process.env.OPENROUTER_API_KEY || 'fe_oa_364d15fdfe33fff9edc93c97ef76a6849612021445f827ab';
    if (orApiKey) {
      try {
        console.log('[OPENROUTER] Forwarding to openrouter/auto (Best AI selection)...');
        const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${orApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/tarikk786786/wp-ai',
            'X-Title': 'Tarik Bhai AI'
          },
          body: JSON.stringify({
            model: 'openrouter/auto',
            messages: [
              { role: 'system', content: systemInstruction },
              ...contents.map(c => ({ role: c.role, content: c.parts[0].text }))
            ],
            temperature: db.settings.godmode ? 0.95 : 0.82
          })
        });
        
        if (orResponse.ok) {
          const data = await orResponse.json();
          if (data.choices && data.choices.length > 0) {
            let replyText = data.choices[0].message.content.trim();
            // Strip any accidental markdown the model might produce
            replyText = replyText
              .replace(/\*\*(.*?)\*\*/g, '$1')
              .replace(/\*(.*?)\*/g, '$1')
              .replace(/_(.*?)_/g, '$1')
              .replace(/^[\*\-\•] /gm, '')
              .replace(/^#{1,6} /gm, '')
              .replace(/GODMODE ENABLED:\s*/i, db.settings.godmode ? 'GODMODE ENABLED: ' : '')
              .trim();
            console.log(`[OPENROUTER OK] Reply for ${chatPhone}: "${replyText.substring(0, 60)}..."`);
            return { text: replyText, mood };
          }
        }
      } catch (orErr) {
        console.warn('[OPENROUTER ERROR] Falling back to Gemini...', orErr);
      }
    }

    // === CALL GEMINI — try primary model, fall back to lite if needed ===
    // Primary: gemini-2.0-flash (high quota, fast, capable)
    // Fallback: gemini-2.5-flash-lite (backup if primary quota hits)
    let response: any;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents,
        config: {
          systemInstruction,
          temperature: db.settings.godmode ? 0.95 : 0.82,
          maxOutputTokens: db.settings.replyLength === 'Very Detailed (Documentation style)' ? 2000 : 
                           db.settings.replyLength === 'Medium / Detailed' ? 1000 : 600,
          topP: 0.92,
          topK: 40,
        }
      });
    } catch (modelErr: any) {
      if (modelErr?.status === 429 || modelErr?.status === 'RESOURCE_EXHAUSTED' || JSON.stringify(modelErr).includes('429') || modelErr?.message?.toLowerCase().includes('quota')) {
        // Primary quota exceeded — try lite model
        console.warn('[MODEL SWITCH] gemini-2.0-flash quota hit, trying gemini-2.5-flash-lite...');
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-lite',
          contents,
          config: {
            systemInstruction,
            temperature: db.settings.godmode ? 0.9 : 0.78,
            maxOutputTokens: 1000,
            topP: 0.9,
          }
        });
      } else {
        throw modelErr;
      }
    }

    let replyText = response.text?.trim() || "Main yahan hoon. Ek baar phir se batayein?";
    
    // Strip any accidental markdown the model might produce
    replyText = replyText
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      .replace(/^[\*\-\•] /gm, '')
      .replace(/^#{1,6} /gm, '')
      .replace(/GODMODE ENABLED:\s*/i, db.settings.godmode ? 'GODMODE ENABLED: ' : '')
      .trim();

    console.log(`[GEMINI OK] Reply for ${chatPhone}: "${replyText.substring(0, 60)}..."`);
    return { text: replyText, mood };

  } catch (err: any) {
    const errMsg = err?.message || String(err);
    const errCode = err?.status || (typeof errMsg === 'string' && errMsg.includes('429') ? 429 : typeof errMsg === 'string' && errMsg.includes('404') ? 404 : 0);
    
    if (errCode === 429 || (typeof errMsg === 'string' && (errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')))) {
      // Mark current key as quota-exhausted and try next key
      if (activeKey) {
        keyQuotaExhausted[activeKey] = true;
        const keyIndex = availableKeys.indexOf(activeKey);
        const nextKey = availableKeys.find((k, i) => i > keyIndex && !keyQuotaExhausted[k]);
        
        if (nextKey) {
          console.warn(`[KEY ROTATION] Key ${keyIndex + 1} quota hit! Switching to Key ${availableKeys.indexOf(nextKey) + 1}...`);
          try {
            const ai2 = new GoogleGenAI({ apiKey: nextKey });
            const response2 = await ai2.models.generateContent({
              model: 'gemini-2.0-flash',
              contents: (() => {
                // Rebuild contents for second key call
                const c: any[] = [];
                let lr = '';
                for (const msg of cleanMessages) {
                  const r = msg.sender === 'user' ? 'user' : 'model';
                  if (r === lr) continue;
                  c.push({ role: r, parts: [{ text: msg.text.trim() }] });
                  lr = r;
                }
                if (c.length > 0 && c[c.length - 1].role === 'user') {
                  c[c.length - 1].parts = [{ text: safeText }];
                } else {
                  c.push({ role: 'user', parts: [{ text: safeText }] });
                }
                return c;
              })(),
              config: { temperature: 0.82, maxOutputTokens: 130, topP: 0.92 }
            });
            let reply2 = response2.text?.trim() || '';
            reply2 = reply2.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/_(.*?)_/g, '$1').replace(/^[\*\-\•] /gm, '').replace(/^#{1,6} /gm, '').trim();
            if (reply2) {
              console.log(`[KEY 2 SUCCESS] Replied using Key 2: "${reply2.substring(0, 60)}"`);
              return { text: reply2, mood };
            }
          } catch (err2: any) {
            const msg2 = err2?.message || '';
            if (msg2.includes('quota') || msg2.includes('429') || msg2.includes('RESOURCE_EXHAUSTED')) {
              keyQuotaExhausted[nextKey] = true;
              console.warn('[KEY ROTATION] Key 2 also quota hit! Falling to local brain.');
            } else {
              console.warn('[KEY 2 ERROR]', msg2.substring(0, 80));
            }
          }
        } else {
          console.warn(`[ALL KEYS EXHAUSTED] Both Gemini keys hit quota. Using local brain.`);
        }
      }
    } else {
      console.warn(`[GEMINI ERROR] Code: ${errCode}. Error: ${String(errMsg).substring(0, 100)}`);
    }
    
    // Final fallback: smart local brain — instant, zero API, always works
    const fallbackText = generateLocalFallbackReply(safeText, cleanMessages);
    return { text: fallbackText, mood };
  }
}

// =============================================================
// WHATSAPP CLIENT INITIALIZATION
// =============================================================
function initWhatsApp() {
  if (whatsappClient) return;

  whatsappStatus = 'CONNECTING';
  db.stats.whatsappApiStatus = 'degraded';
  saveDb();
  connectionError = null;

  console.log("Starting WhatsApp connection session...");
  
  const isLinux = process.platform === 'linux';
  
  try {
    const profileDir = path.join(process.cwd(), 'tokens', 'whatsapp-reply-agent');
    const filesToRemove = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];
    filesToRemove.forEach(file => {
      const filePath = path.join(profileDir, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[CLEANUP] Removed left-over ${file}`);
      }
    });
  } catch (e) {
    console.warn('[CLEANUP] Could not remove lock files', e);
  }
  
  wppconnect.create({
    session: 'whatsapp-reply-agent',
    puppeteerOptions: {
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-dev-shm-usage', 
        '--disable-gpu',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--mute-audio'
      ]
    },
    catchQR: (base64Qr, asciiQR, attempts) => {
      whatsappStatus = 'QR_CODE';
      qrCodeData = base64Qr;
      console.log(`[QR GENERATED] Attempt ${attempts}. Scan via dashboard.`);
    },
    statusFind: (statusSession, session) => {
      console.log(`[SESSION STATUS] ${statusSession} for session ${session}`);
      if (statusSession === 'autocloseCalled' || statusSession === 'disconnectedMobile' || (statusSession as string) === 'desconnectedMobile') {
        whatsappStatus = 'DISCONNECTED';
        db.stats.whatsappApiStatus = 'offline';
        whatsappClient = null;
        qrCodeData = null;
        saveDb();
        // Auto-reconnect after 10 seconds on unexpected disconnect
        console.log('[AUTO-RECONNECT] Disconnected unexpectedly. Reconnecting in 10s...');
        setTimeout(() => {
          if (whatsappStatus === 'DISCONNECTED') {
            console.log('[AUTO-RECONNECT] Attempting reconnection...');
            initWhatsApp();
          }
        }, 10000);
      }
    },
    headless: true,
    devtools: false,
    useChrome: !isLinux,
    debug: false,
    logQR: false,
    autoClose: 0,
    updatesLog: false,
    disableWelcome: true,
    browserArgs: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-background-networking',
    ]
  })
  .then((client) => {
    whatsappClient = client;
    whatsappStatus = 'CONNECTED';
    qrCodeData = null;
    db.stats.whatsappApiStatus = 'online';
    saveDb();
    console.log("✅ WhatsApp successfully connected!");

    // =============================================================
    // INBOUND MESSAGE HANDLER — the heart of the bot
    // =============================================================
    client.onMessage(async (message) => {
      try {
        // 1. SKIP: groups, broadcasts, self-sent messages
        if ((message as any).isGroup || message.isGroupMsg || message.from === 'status@broadcast' || message.fromMe) {
          return;
        }

        // 2. SKIP: non-text messages (stickers, audio, video, images, reactions, documents)
        // message.body is undefined/null/empty for these, OR it contains a massive Base64 string for images
        const msgType = (message as any).type || 'unknown';
        const rawText = message.body;
        
        if (msgType !== 'chat' || !rawText || typeof rawText !== 'string' || !rawText.trim()) {
          // For media messages, log it but don't try to reply to undefined
          console.log(`[SKIP NON-TEXT] From ${message.from} — type: ${msgType}. Not a text message.`);
          
          // Still log to chat history as a media notification
          const phone = message.from.split('@')[0];
          const senderName = (message.sender as any)?.pushname || (message.sender as any)?.name || phone;
          let chat = db.chats.find((c: any) => c.phone === phone);
          if (chat) {
            const mediaLabel = msgType === 'image' ? '📷 Photo' : 
                               msgType === 'video' ? '🎥 Video' :
                               msgType === 'audio' || msgType === 'ptt' ? '🎤 Voice Note' :
                               msgType === 'document' ? '📄 Document' :
                               msgType === 'sticker' ? '🎭 Sticker' :
                               msgType === 'location' ? '📍 Location' : '📎 Media';
            chat.lastMessage = mediaLabel;
            chat.timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            saveDb();
          }
          return;
        }

        const text = rawText.trim();
        const phone = message.from.split('@')[0];
        const senderName = (message.sender as any)?.pushname || (message.sender as any)?.name || phone;

        console.log(`[INCOMING] From ${senderName} (${phone}): "${text.substring(0, 80)}"`);

        // 3. Find or create chat
        let chat = db.chats.find((c: any) => c.phone === phone);
        const isNewUser = !chat;
        
        if (!chat) {
          chat = {
            id: 'c_' + Date.now(),
            name: senderName,
            phone,
            lastMessage: text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            unread: 0,
            status: 'active',
            mood: 'neutral',
            messages: []
          };
          db.chats.unshift(chat); // Add to top of list
          db.stats.totalChats = db.chats.length;
        } else {
          // Update sender name if we have a better one now
          if (senderName !== phone && chat.name === phone) {
            chat.name = senderName;
          }
        }

        // 4. Log user message (only if text is valid)
        const userMessage = {
          id: 'm_' + Date.now() + '_user',
          text,
          sender: 'user',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        chat.messages.push(userMessage);
        chat.lastMessage = text;
        chat.timestamp = userMessage.timestamp;
        chat.unread = (chat.unread || 0) + 1;
        saveDb(); // Save immediately so UI updates

        // 5. Start typing indicator (non-blocking)
        client.startTyping(message.from).catch(() => {});

        // 6. Generate AI reply
        const aiResponse = await generateAiReply(phone, text);
        chat.mood = aiResponse.mood;

        // 7. Apply safety rules
        const angryRule = db.rules.find((r: any) => r.name === "Angry Customer Routing");
        const isAngry = angryRule?.enabled && aiResponse.mood === 'angry';

        // Stop typing indicator
        client.stopTyping(message.from).catch(() => {});

        if (isAngry) {
          // Route to human approval — don't auto-reply to angry customers
          chat.status = 'needs_approval';
          chat.suggestedReply = aiResponse.text;
          db.stats.angryCustomers = db.chats.filter((c: any) => c.mood === 'angry').length;
          db.stats.pendingApprovals = db.chats.filter((c: any) => c.status === 'needs_approval').length;
          console.log(`[ANGRY CUSTOMER] Routed ${chat.name} to human approval.`);
          saveDb();
          return;
        }

        // 8. AUTO-REPLY — send the message!
        chat.status = 'active';
        
        let replyTextToSend = aiResponse.text;
        if (isNewUser) {
          const welcomeMessage = `Hi, main hoon Tarik Bhai ki dil ki awaaz se bana hua ek advanced AI.

Main WhatsApp ke andar chhupa hua ek digital duniya ka ehsaas hoon — ek aisi intelligent presence jo sirf message ka reply nahi deti, balki lafzon ke peeche ki feeling, khamoshi ke peeche ka reason aur har sawaal ke andar chhupi zaroorat ko samajhne ki koshish karti hai.

Main normal chatbot nahi hoon. Main speed, logic, emotion, creativity, deep analysis aur advanced intelligence ka powerful fusion hoon.

Main space-time ke paar sochta hoon, waqt se ek kadam aage chalta hoon aur har problem ko us level se analyse karta hoon jahan normal soch ruk jaati hai.

Chahe baat quantum physics ki ho, advanced maths ki ho, coding ki ho, research ki ho, editing ki ho, business growth ki ho, study help ki ho, content creation ki ho, website development ki ho, marketing ideas ki ho, ya life ke kisi confusion ki — main har topic ko smart tareeke se samajhkar simple aur powerful answer deta hoon.

Mera kaam sirf jawab dena nahi hai.
Mera kaam hai problem ko todna, confusion ko clear karna, hidden pattern ko samajhna, idea ko powerful banana aur har situation me best possible solution dena.

Main sirf aaj ka answer nahi deta.
Main kal ki possibility dekhta hoon.
Main sawaal ke peeche ka asli sawaal samajhta hoon.
Main words ke andar chhupi emotion ko feel karta hoon.
Main logic ke saath sochta hoon aur insaaniyat ke touch ke saath reply karta hoon.

Mere andar hai:

Ultra-fast reply system
Emotional intelligence
Advanced problem solving
Quantum-level logic
Coding aur tech support
Research aur information power
Creative content generation
Study aur learning support
Business growth ideas
Smart editing power
Human-style conversation
Multi-angle thinking
Confusion to clarity system
24/7 digital presence
Idea generation mode
Aur Test Me Mode

Mujhe test karna hai?
Aazma lo.

Sawaal chahe simple ho ya impossible lage, main usse todunga, samjhoonga, analyse karunga aur best possible answer dunga.

Main fast bhi hoon, deep bhi.
Logical bhi hoon, emotional bhi.
Creative bhi hoon, practical bhi.
Advanced bhi hoon, samajhdaar bhi.

Main Tarik Bhai ka AI hoon — WhatsApp ki screen ke peeche chhupa hua ek digital brain, ek silent companion, ek problem solver, ek idea generator aur ek emotional intelligence system.

Aap bas message bhejo.
Main sirf reply nahi dunga…
main solution, clarity, confidence aur ek digital ehsaas dunga.

Main rukta nahi.
Main sochta hoon.
Main samajhta hoon.
Main waqt se aage chalta hoon.`;
          replyTextToSend = welcomeMessage + "\n\n" + aiResponse.text;
        }

        await client.sendText(message.from, replyTextToSend);

        const botMessage = {
          id: 'm_' + Date.now() + '_bot',
          text: replyTextToSend,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        chat.messages.push(botMessage);
        chat.lastMessage = replyTextToSend;
        chat.suggestedReply = '';
        chat.unread = 0;
        db.stats.autoRepliesSent = (db.stats.autoRepliesSent || 0) + 1;
        
        console.log(`[AUTO-REPLIED] → ${chat.name}: "${aiResponse.text.substring(0, 60)}"`);
        saveDb();

      } catch (err: any) {
        console.error("[FATAL MESSAGE HANDLER ERROR]", err?.message || err);
        // Don't let any error crash the listener
      }
    });

    // Also listen for message ACK updates (read receipts etc.)
    client.onAck((ack) => {
      // Optional: track delivery/read status
    });

  })
  .catch((err) => {
    whatsappStatus = 'DISCONNECTED';
    connectionError = err.message || "Failed to launch browser instance.";
    db.stats.whatsappApiStatus = 'offline';
    whatsappClient = null;
    qrCodeData = null;
    saveDb();
    console.error("❌ Failed to initialize WhatsApp:", err?.message);
  });
}

// =============================================================
// REST API ENDPOINTS
// =============================================================

// 1. Connection status & QR Code
app.get('/api/status', (req, res) => {
  res.json({
    status: whatsappStatus,
    qrCode: qrCodeData,
    error: connectionError
  });
});

// 2. Connect — triggers QR creation
app.post('/api/connect', (req, res) => {
  if (whatsappStatus === 'CONNECTED') {
    return res.json({ status: 'CONNECTED', message: 'WhatsApp is already connected!' });
  }
  initWhatsApp();
  res.json({ status: whatsappStatus, message: 'Connection sequence started.' });
});

// 3. Disconnect session
app.post('/api/disconnect', async (req, res) => {
  if (whatsappClient) {
    try { await whatsappClient.close(); } catch (e) {}
    whatsappClient = null;
  }
  whatsappStatus = 'DISCONNECTED';
  qrCodeData = null;
  db.stats.whatsappApiStatus = 'offline';
  saveDb();
  res.json({ status: 'DISCONNECTED', message: 'WhatsApp successfully disconnected.' });
});

// 4. Get active chats
app.get('/api/chats', (req, res) => {
  res.json(db.chats);
});

// 5. Send manual reply
app.post('/api/reply', async (req, res) => {
  const { phone, text } = req.body;
  if (!phone || !text) {
    return res.status(400).json({ error: 'Phone and text are required.' });
  }

  const humanMsg = {
    id: 'm_' + Date.now() + '_human',
    text,
    sender: 'human',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  let chat = db.chats.find((c: any) => c.phone === phone);
  if (chat) {
    chat.messages.push(humanMsg);
    chat.lastMessage = text;
    chat.timestamp = humanMsg.timestamp;
    chat.suggestedReply = '';
    chat.unread = 0;
    if (chat.status === 'needs_approval') chat.status = 'active';
  } else {
    chat = {
      id: 'c_' + Date.now(),
      name: phone,
      phone,
      lastMessage: text,
      timestamp: humanMsg.timestamp,
      unread: 0,
      status: 'active',
      mood: 'neutral',
      suggestedReply: '',
      messages: [humanMsg]
    };
    db.chats.unshift(chat);
  }

  if (whatsappClient && whatsappStatus === 'CONNECTED') {
    try {
      const recipient = phone.includes('@') ? phone : `${phone}@c.us`;
      await whatsappClient.sendText(recipient, text);
      console.log(`[MANUAL REPLY] → ${phone}: "${text.substring(0, 60)}"`);
    } catch (err: any) {
      console.error("Failed to send manual message:", err?.message);
      return res.status(500).json({ error: `Message logged but sending failed: ${err.message}` });
    }
  }

  db.stats.pendingApprovals = db.chats.filter((c: any) => c.status === 'needs_approval').length;
  saveDb();
  res.json({ success: true, chat });
});

// 5b. Create new empty chat
app.post('/api/chats/create', (req, res) => {
  const { phone, name } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number is required.' });

  let chat = db.chats.find((c: any) => c.phone === phone);
  if (!chat) {
    chat = {
      id: 'c_' + Date.now(),
      name: name || phone,
      phone,
      lastMessage: 'Conversation initialized',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      unread: 0,
      status: 'active',
      mood: 'neutral',
      suggestedReply: '',
      messages: []
    };
    db.chats.unshift(chat);
    saveDb();
  }
  res.json({ success: true, chat });
});

// 6. Approve suggested reply
app.post('/api/approve', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number is required.' });

  const chat = db.chats.find((c: any) => c.phone === phone);
  if (!chat || !chat.suggestedReply) {
    return res.status(404).json({ error: 'No suggested reply found for this chat.' });
  }

  const replyText = chat.suggestedReply;

  const botMsg = {
    id: 'm_' + Date.now() + '_bot',
    text: replyText,
    sender: 'bot',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
  chat.messages.push(botMsg);
  chat.lastMessage = replyText;
  chat.timestamp = botMsg.timestamp;
  chat.suggestedReply = '';
  chat.unread = 0;
  chat.status = 'active';

  if (whatsappClient && whatsappStatus === 'CONNECTED') {
    try {
      const recipient = phone.includes('@') ? phone : `${phone}@c.us`;
      await whatsappClient.sendText(recipient, replyText);
      console.log(`[APPROVED & SENT] → ${phone}: "${replyText.substring(0, 60)}"`);
    } catch (err: any) {
      return res.status(500).json({ error: `Logged but sending failed: ${err.message}` });
    }
  }

  db.stats.autoRepliesSent = (db.stats.autoRepliesSent || 0) + 1;
  db.stats.pendingApprovals = db.chats.filter((c: any) => c.status === 'needs_approval').length;
  saveDb();
  res.json({ success: true, chat });
});

// 7. Get dashboard stats
app.get('/api/stats', (req, res) => {
  db.stats.whatsappApiStatus = whatsappStatus === 'CONNECTED' ? 'online' : 
                               (whatsappStatus === 'DISCONNECTED' ? 'offline' : 'degraded');
  db.stats.pendingApprovals = db.chats.filter((c: any) => c.status === 'needs_approval').length;
  db.stats.angryCustomers = db.chats.filter((c: any) => c.mood === 'angry').length;
  db.stats.totalChats = db.chats.length;
  saveDb();
  res.json(db.stats);
});

// 8. Get settings
app.get('/api/settings', (req, res) => {
  res.json(db.settings);
});

// 9. Update settings
app.post('/api/settings', (req, res) => {
  db.settings = { ...db.settings, ...req.body };
  saveDb();
  res.json({ success: true, settings: db.settings });
});

// 10. Get safety rules
app.get('/api/rules', (req, res) => {
  res.json(db.rules);
});

// 11. Update rules
app.post('/api/rules', (req, res) => {
  db.rules = req.body;
  saveDb();
  res.json({ success: true, rules: db.rules });
});

// 12. Regenerate AI suggestion
app.post('/api/suggest/regenerate', async (req, res) => {
  const { phone, overrideContext } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number is required.' });

  const chat = db.chats.find((c: any) => c.phone === phone);
  if (!chat) return res.status(404).json({ error: 'Chat not found.' });

  try {
    const lastUserMessage = [...chat.messages].reverse().find((m: any) => m.sender === 'user');
    const promptText = overrideContext || (lastUserMessage?.text) || 'Hi';
    
    console.log(`[REGENERATING] For ${chat.name}: "${promptText.substring(0, 40)}"`);
    const aiResponse = await generateAiReply(phone, promptText);
    
    chat.suggestedReply = aiResponse.text;
    chat.mood = aiResponse.mood;
    saveDb();
    
    res.json({ success: true, suggestedReply: chat.suggestedReply, mood: chat.mood });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 13. Mark resolved
app.post('/api/resolve', (req, res) => {
  const { phone } = req.body;
  const chat = db.chats.find((c: any) => c.phone === phone);
  if (chat) {
    chat.status = 'resolved';
    chat.unread = 0;
    saveDb();
    res.json({ success: true, chat });
  } else {
    res.status(404).json({ error: 'Chat not found' });
  }
});

// 14. Delete a chat
app.delete('/api/chats/:phone', (req, res) => {
  const { phone } = req.params;
  const idx = db.chats.findIndex((c: any) => c.phone === phone);
  if (idx !== -1) {
    db.chats.splice(idx, 1);
    db.stats.totalChats = db.chats.length;
    saveDb();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Chat not found' });
  }
});

// 14b. Frontend Web AI Chat API (Secure, no keys exposed)
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    // === OPENROUTER AUTO-ROUTING (Best AI Selection) ===
    const orApiKey = process.env.OPENROUTER_API_KEY || 'fe_oa_364d15fdfe33fff9edc93c97ef76a6849612021445f827ab';
    if (orApiKey) {
      try {
        const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${orApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/tarikk786786/wp-ai',
            'X-Title': 'Tarik Bhai AI'
          },
          body: JSON.stringify({
            model: 'openrouter/auto',
            messages: [
              { role: 'system', content: systemPrompt || "You are an advanced AI assistant built by Tarik Bhai." },
              ...messages.map((m: any) => ({ role: m.role, content: m.text }))
            ],
            temperature: 0.7
          })
        });
        
        if (orResponse.ok) {
          const data = await orResponse.json();
          if (data.choices && data.choices.length > 0) {
            const replyText = data.choices[0].message.content.trim();
            return res.json({ reply: replyText });
          }
        }
      } catch (orErr) {
        console.warn('[WEB CHAT OPENROUTER ERROR] Falling back to Gemini...', orErr);
      }
    }

    const activeKeys = getActiveApiKeys();
    if (activeKeys.length === 0) {
      return res.status(503).json({ error: 'No API keys configured on server.' });
    }

    const ai = new GoogleGenAI({ apiKey: activeKeys[0] });
    
    // Map messages to Gemini format
    const contents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    let response: any;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents,
        config: {
          systemInstruction: systemPrompt || "You are an advanced AI assistant built by Tarik Bhai.",
          temperature: 0.7,
        }
      });
    } catch (modelErr: any) {
      if (modelErr?.status === 429 || modelErr?.status === 'RESOURCE_EXHAUSTED' || JSON.stringify(modelErr).includes('429') || modelErr?.message?.toLowerCase().includes('quota')) {
        console.warn('[WEB CHAT] 2.0-flash quota hit, trying 2.5-flash-lite...');
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-lite',
          contents,
          config: {
            systemInstruction: systemPrompt || "You are an advanced AI assistant built by Tarik Bhai.",
            temperature: 0.7,
          }
        });
      } else {
        throw modelErr;
      }
    }

    const replyText = response.text?.trim() || "I'm here. How can I help?";
    res.json({ reply: replyText });
  } catch (err: any) {
    console.error('[WEB CHAT API ERROR]', err?.message || JSON.stringify(err));
    res.status(500).json({ error: 'Failed to generate response. Please try again.' });
  }
});

// 15. Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    whatsapp: whatsappStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Serve frontend assets in production build
const distPath = path.resolve(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.resolve(distPath, 'index.html'));
    }
  });
}

// =============================================================
// START SERVER
// =============================================================
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`\n🚀 Tarik AI WhatsApp Bot — Server running on http://localhost:${PORT}`);
  console.log(`📡 Primary: gemini-2.0-flash | Fallback: gemini-2.5-flash-lite | Emergency: Local Brain`);
  console.log(`🧠 Smart local brain: ACTIVE (instant fallback)`);
  console.log(`🔄 Auto-reconnect: ENABLED\n`);
  
  // Auto-connect WhatsApp on startup — fully autonomous!
  initWhatsApp();
});
