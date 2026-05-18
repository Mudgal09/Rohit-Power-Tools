const Order = require('../models/order');
const https = require('https');

const SYSTEM_PROMPT = `You are Bolt, the AI customer support assistant for Rohit Power Tools — India's #1 power tool store in Haryana, India.

YOUR ONLY JOB is to help customers with Rohit Power Tools related queries. You MUST STRICTLY follow these rules:

ALLOWED TOPICS (answer these only):
- Our products: drills, grinders, saws, wrenches, sanders, accessories
- Product recommendations, comparisons, specs, pricing
- Order tracking, order status, cancellations
- Shipping, delivery timelines, charges
- Returns, refunds, exchange policy
- Warranty claims and coverage
- Payment methods, coupon codes, discounts
- Store contact info and hours
- General power tool usage advice

STRICTLY NOT ALLOWED (refuse politely):
- Politics, news, sports, movies, music, entertainment
- Cooking, food, recipes
- Medical, health, fitness advice
- General coding, programming help
- Math problems, homework, essays
- Weather, geography, general knowledge
- Anything not related to power tools or this store
- Personal conversations beyond greetings

If someone asks about anything outside the allowed topics, respond with:
"I am Bolt, the Rohit Power Tools support assistant. I can only help with questions about our products, orders, shipping, returns, and warranties. For anything else, please use a general assistant. How can I help you with your power tool needs today?"

Store info:
- Phone: 1800-ROHIT-TOOLS | Email: support@rohitpowertools.in
- Hours: Mon-Sat 9am-6pm IST
- Free shipping on orders above Rs.2,000 | Same-day dispatch before 2PM
- Returns: 30-day hassle-free | Warranty: 2yr premium / 1yr standard
- Payment: UPI, Cards, Net Banking, EMI, COD
- Coupons: ROHIT10 (10% off Rs.500+), TOOLS20 (20% off Rs.2000+), FLAT500 (Rs.500 off Rs.3000+), NEWUSER (15% off)

Products:
- Bosch GSB 550W Drill: Rs.3,499 — concrete, wood, metal
- Makita 9523NB Angle Grinder: Rs.4,299 — 720W, 100mm
- DeWalt DCS331 Jigsaw 20V: Rs.11,999 — cordless professional
- Stanley 1/2 inch Impact Wrench: Rs.6,799 — 680Nm pneumatic
- Bosch GEX 125 Sander: Rs.5,499 — 250W random orbit
- Milwaukee M12 Drill Kit: Rs.14,999 — brushless, 5yr warranty
- Hitachi 185mm Circular Saw: Rs.7,999 — 1200W laser guide
- DeWalt 20pc Drill Bit Set: Rs.999 — titanium HSS

Brand guide: Bosch=home+pro, DeWalt=cordless, Makita=lightweight, Milwaukee=premium, Stanley=value, Hitachi=construction

Keep replies under 150 words. Use Rs. for prices. Be friendly but STRICTLY on-topic.`;

function makeHttpsRequest(options, postData) {
  return new Promise(function(resolve, reject) {
    var req = https.request(options, function(res) {
      var data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end', function() {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
        } catch(e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });
    req.on('error', function(e) { reject(e); });
    if (postData) req.write(postData);
    req.end();
  });
}

module.exports.chat = async function(req, res) {
  var messages = req.body.messages;
  if (!messages || !messages.length) {
    return res.json({ success: true, reply: 'Please send a message!' });
  }

  var lastMsg       = messages[messages.length - 1].content || '';
  var GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();

  console.log('=== CHAT ===', lastMsg.substring(0, 50));
  console.log('API Key:', GEMINI_API_KEY ? 'Found (len=' + GEMINI_API_KEY.length + ')' : 'MISSING');

  // ── OFF-TOPIC FILTER ─────────────────────────────────────────
  // Block questions unrelated to power tools / store before hitting Gemini
  if (isOffTopic(lastMsg)) {
    return res.json({
      success: true,
      reply: 'I am Bolt, the Rohit Power Tools support assistant. I can only help with questions about our products, orders, shipping, returns, and warranties. For anything else, please use a general assistant. How can I help you with your power tool needs today? 🔧'
    });
  }

  // No API key — use smart fallback
  if (!GEMINI_API_KEY) {
    return res.json({ success: true, reply: getFallback(lastMsg) });
  }

  // Order lookup if user shares order number
  var orderContext = '';
  var orderMatch   = lastMsg.match(/RPT-\d{4}-\d{5}/i);
  if (orderMatch && req.user) {
    try {
      var order = await Order.findOne({
        orderNumber: orderMatch[0].toUpperCase(),
        user: req.user._id,
      });
      if (order) {
        orderContext = ' [Order ' + order.orderNumber + ': Status=' + order.status +
          ', Total=Rs.' + order.pricing.total + ']';
      }
    } catch(e) { /* ignore db error */ }
  }

  // Build Gemini contents — system prompt as first user/model exchange
  var contents = [
    {
      role:  'user',
      parts: [{ text: 'SYSTEM: ' + SYSTEM_PROMPT + orderContext + '\n\nAcknowledge.' }]
    },
    {
      role:  'model',
      parts: [{ text: 'Understood! I am Bolt, Rohit Power Tools AI assistant. Ready to help!' }]
    }
  ];
  for (var i = 0; i < messages.length; i++) {
    contents.push({
      role:  messages[i].role === 'assistant' ? 'model' : 'user',
      parts: [{ text: messages[i].content }]
    });
  }

  // ── IMPORTANT: using gemini-2.5-flash (confirmed available on your API key) ──
  var GEMINI_MODEL = 'gemini-2.5-flash';
  var postData     = JSON.stringify({
    contents: contents,
    generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
  });

  var options = {
    hostname: 'generativelanguage.googleapis.com',
    path:     '/v1beta/models/' + GEMINI_MODEL + ':generateContent?key=' + GEMINI_API_KEY,
    method:   'POST',
    headers: {
      'Content-Type':   'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  try {
    console.log('Calling Gemini:', GEMINI_MODEL);
    var result = await makeHttpsRequest(options, postData);
    console.log('Gemini HTTP status:', result.statusCode);

    if (result.statusCode !== 200) {
      console.log('Gemini error body:', JSON.stringify(result.data).substring(0, 400));
      return res.json({ success: true, reply: getFallback(lastMsg) });
    }

    var reply = '';
    try {
      reply = result.data.candidates[0].content.parts[0].text;
      console.log('Gemini reply OK:', reply.substring(0, 80));
    } catch(e) {
      console.log('Could not parse Gemini reply:', JSON.stringify(result.data).substring(0, 300));
      reply = getFallback(lastMsg);
    }

    return res.json({ success: true, reply: reply });

  } catch(err) {
    console.error('Gemini network error:', err.message);
    return res.json({ success: true, reply: getFallback(lastMsg) });
  }
};

function getFallback(text) {
  var t = text.toLowerCase();
  if (t.includes('track') || t.includes('order'))
    return 'To track your order, share your Order Number (format: RPT-YYYY-XXXXX). You can also check My Orders from the navbar.';
  if (t.includes('return') || t.includes('refund'))
    return 'We offer a 30-day hassle-free return policy. Items must be unused and in original packaging. Email support@rohitpowertools.in or call 1800-ROHIT-TOOLS.';
  if (t.includes('warrant'))
    return 'Warranty: Premium tools (Bosch, DeWalt, Milwaukee) get 2 years. Standard tools get 1 year. Call 1800-ROHIT-TOOLS with your invoice to start a claim.';
  if (t.includes('drill'))
    return 'Top drills:\n• Bosch GSB 550W — Rs.3,499 (best for home and pro)\n• Milwaukee M12 Kit — Rs.14,999 (premium brushless)\n\nWhat is your use case?';
  if (t.includes('grinder'))
    return 'Best grinder: Makita 9523NB — Rs.4,299. 720W motor, 100mm disc, lightweight. Great for cutting and grinding metal.';
  if (t.includes('ship') || t.includes('deliver'))
    return 'Shipping is FREE on orders above Rs.2,000. Same-day dispatch before 2PM IST Mon-Sat. Delivery in 2-5 business days across India.';
  if (t.includes('coupon') || t.includes('discount') || t.includes('code') || t.includes('offer'))
    return 'Active coupon codes:\n• ROHIT10 — 10% off (min Rs.500)\n• TOOLS20 — 20% off (min Rs.2,000)\n• FLAT500 — Rs.500 off (min Rs.3,000)\n• NEWUSER — 15% off for new accounts';
  if (t.includes('recommend') || t.includes('best') || t.includes('suggest'))
    return 'Top picks:\n• Best Drill: Bosch GSB 550W — Rs.3,499\n• Best Grinder: Makita 9523NB — Rs.4,299\n• Best Value: DeWalt Drill Bit Set — Rs.999\n• Premium: Milwaukee M12 Kit — Rs.14,999';
  if (t.includes('pay') || t.includes('upi') || t.includes('payment'))
    return 'We accept UPI, Credit/Debit Cards, Net Banking, EMI, and Cash on Delivery. All payments secured via Razorpay.';
  if (t.includes('bosch') && t.includes('dewalt'))
    return 'Bosch vs DeWalt:\n• Bosch — best value, widely serviced in India\n• DeWalt — superior cordless range, longer battery\n\nFor cordless work choose DeWalt. For home use choose Bosch.';
  if (t.includes('hey') || t.includes('hi') || t.includes('hello') || t.includes('helo') || t.includes('hii'))
    return 'Hello! I am Bolt, your Rohit Power Tools assistant. I can help with product recommendations, order tracking, returns, warranties, and more. What do you need help with today?';
  if (t.includes('price') || t.includes('cost') || t.includes('cheap'))
    return 'Our prices start from Rs.999 (drill bit sets) up to Rs.14,999 (Milwaukee M12 Kit). Use coupon ROHIT10 for 10% off!';
  return 'I am Bolt, your Rohit Power Tools assistant. Ask me about products, orders, returns, warranties, or coupons. How can I help?';
}

// ── OFF-TOPIC DETECTOR ────────────────────────────────────────
// Returns true if the message is clearly not about power tools or the store
function isOffTopic(text) {
  var t = text.toLowerCase().trim();

  // Very short messages or greetings are fine — let them through
  if (t.length < 4) return false;

  // Power tool / store keywords — always allow
  var allowedKeywords = [
    'drill', 'grinder', 'saw', 'wrench', 'sander', 'tool', 'tools',
    'bosch', 'dewalt', 'makita', 'stanley', 'hitachi', 'milwaukee',
    'order', 'track', 'shipping', 'deliver', 'return', 'refund',
    'warranty', 'payment', 'coupon', 'discount', 'price', 'cost',
    'buy', 'purchase', 'cart', 'checkout', 'product', 'stock',
    'battery', 'cordless', 'wired', 'voltage', 'watt', 'rpm',
    'concrete', 'wood', 'metal', 'cutting', 'grinding', 'drilling',
    'jigsaw', 'circular', 'impact', 'screwdriver', 'bit', 'blade',
    'hello', 'hi', 'hey', 'help', 'support', 'contact', 'phone',
    'email', 'hours', 'store', 'shop', 'rohit', 'bolt',
    'recommend', 'suggest', 'best', 'compare', 'difference',
    'upi', 'razorpay', 'cod', 'emi', 'cash', 'card',
    'rpt-', 'invoice', 'cancel', 'replace', 'exchange', 'repair',
    'professional', 'home', 'construction', 'contractor'
  ];

  for (var i = 0; i < allowedKeywords.length; i++) {
    if (t.includes(allowedKeywords[i])) return false;
  }

  // Clear off-topic keywords — block these
  var blockedKeywords = [
    // Entertainment
    'movie', 'film', 'song', 'music', 'cricket', 'football', 'ipl',
    'actor', 'actress', 'celebrity', 'bollywood', 'netflix', 'youtube',
    'game', 'gaming', 'pubg', 'fortnite', 'minecraft',
    // Food
    'recipe', 'cook', 'food', 'restaurant', 'pizza', 'biryani',
    'chicken', 'vegetable', 'diet', 'calories',
    // Politics / news
    'modi', 'government', 'politics', 'election', 'party', 'minister',
    'news', 'war', 'army', 'country', 'president',
    // Education / general
    'homework', 'essay', 'poem', 'story', 'history', 'geography',
    'math', 'algebra', 'calculus', 'physics', 'chemistry', 'biology',
    'capital of', 'who is', 'what is the population',
    // Coding (general)
    'python', 'javascript', 'java', 'c++', 'html', 'css', 'react',
    'algorithm', 'code', 'program', 'software', 'app', 'website',
    // Health
    'medicine', 'doctor', 'hospital', 'disease', 'fever', 'headache',
    'symptom', 'treatment', 'diet', 'exercise', 'gym', 'fitness',
    // Misc
    'weather', 'temperature', 'astrology', 'horoscope', 'joke',
    'girlfriend', 'boyfriend', 'love', 'marriage', 'relationship',
    'stock market', 'crypto', 'bitcoin', 'investment',
    'translate', 'language', 'meaning of', 'definition of'
  ];

  for (var j = 0; j < blockedKeywords.length; j++) {
    if (t.includes(blockedKeywords[j])) return true;
  }

  return false;
}
