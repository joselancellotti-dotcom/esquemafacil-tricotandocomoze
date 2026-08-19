import express from "express";
import path from "path";
import cors from "cors";
import admin from "firebase-admin";
import { getFirestore, FieldValue, Firestore } from "firebase-admin/firestore";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Lazy-load Firestore database reference
let db: Firestore | null = null;

function getDb(): Firestore | null {
  if (!db) {
    try {
      // Initialize with our app's Firebase project ID
      admin.initializeApp({
        projectId: "gen-lang-client-0909510203"
      });
      db = getFirestore();
      console.log("Firebase Admin successfully initialized.");
    } catch (e: any) {
      console.error("Failed to initialize firebase-admin:", e.message);
    }
  }
  return db;
}

// ==========================================
// YOUTUBE MEMBERSHIP VERIFICATION ENDPOINT
// ==========================================
app.post("/api/youtube/verify", async (req, res) => {
  const { userId, channelId } = req.body;
  if (!userId || !channelId) {
    return res.status(400).json({ error: "userId and channelId are required" });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  const creatorChannelId = process.env.YOUTUBE_CHANNEL_ID;

  let isMember = false;
  let level = "Membro Tricotando";

  if (!apiKey) {
    // DEMO / FALLBACK MODE when YouTube credentials are not set up in environment
    console.log(`[Demo Mode] YouTube Verification for User: ${userId} with ChannelId: ${channelId}`);
    isMember = true;
    level = "Tricoteiro(a) de Ouro (Membro YouTube)";
  } else {
    // REAL API INTEGRATION
    try {
      // Google YouTube Members.list API
      // Since members list requires OAuth, we check if the user is a channel member
      const url = `https://www.googleapis.com/youtube/v3/members?part=snippet&filterByMemberChannelId=${channelId}&key=${apiKey}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json() as any;
        if (data.items && data.items.length > 0) {
          isMember = true;
          const details = data.items[0].snippet?.membershipsDetails;
          level = details?.highestReadableLevel || "Membro Ativo";
        }
      } else {
        const errText = await response.text();
        console.error(`YouTube API error (${response.status}):`, errText);
      }
    } catch (err: any) {
      console.error("YouTube verification call failed:", err.message);
    }
  }

  if (isMember) {
    const firestore = getDb();
    if (firestore) {
      try {
        const userRef = firestore.collection("users").doc(userId);
        await userRef.set({
          hasAccess: true,
          membershipType: "youtube_member",
          youtubeChannelId: channelId,
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        return res.json({ success: true, level, isDemo: !apiKey });
      } catch (err: any) {
        console.error("Error writing user status to Firestore:", err.message);
        return res.status(500).json({ error: "Erro de banco de dados ao salvar acesso." });
      }
    } else {
      return res.json({ success: true, level, isDemo: true, warning: "Firestore offline" });
    }
  }

  return res.status(401).json({ error: "Canal do YouTube não identificado como membro ativo do nível exigido." });
});

// ==========================================
// MERCADO PAGO CREATE PREFERENCE ENDPOINT
// ==========================================
app.post("/api/mercadopago/create-preference", async (req, res) => {
  const { email, userId } = req.body;
  if (!email || !userId) {
    return res.status(400).json({ error: "Email and userId are required" });
  }

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken) {
    // DEMO / SIMULATOR MODE
    console.log(`[Demo Mode] Creating Mercado Pago subscription preference for user: ${userId}`);
    return res.json({
      id: "demo-pref-12345",
      init_point: `/api/mercadopago/mock-checkout?userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(email)}`
    });
  }

  // REAL MERCADO PAGO INTEGRATION
  try {
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        items: [
          {
            title: "Assinatura Mensal Esquema Fácil Tricotando com o Zé",
            quantity: 1,
            currency_id: "BRL",
            unit_price: 29.90
          }
        ],
        payer: {
          email: email
        },
        external_reference: userId,
        back_urls: {
          success: `${req.protocol}://${req.get("host")}/?payment=success`,
          failure: `${req.protocol}://${req.get("host")}/?payment=failure`,
          pending: `${req.protocol}://${req.get("host")}/?payment=pending`
        },
        auto_return: "approved"
      })
    });

    if (response.ok) {
      const data = await response.json() as any;
      return res.json({ id: data.id, init_point: data.init_point });
    } else {
      const errText = await response.text();
      console.error("Mercado Pago Preference API error:", errText);
      return res.status(500).json({ error: "Erro ao gerar preferência no Mercado Pago" });
    }
  } catch (err: any) {
    console.error("Mercado Pago preference creation failed:", err.message);
    return res.status(500).json({ error: "Erro interno ao conectar ao Mercado Pago" });
  }
});

// ==========================================
// MERCADO PAGO WEBHOOK ENDPOINT
// ==========================================
app.post("/api/mercadopago/webhook", async (req, res) => {
  const { action, data, userId: bodyUserId } = req.body;
  console.log("Mercado Pago Webhook payload:", req.body);

  let userId = bodyUserId;
  let paymentId = data?.id || "mock-payment-" + Math.floor(Math.random() * 1000000);

  // If this is a real production notification from Mercado Pago
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (accessToken && action === "payment.created" && data?.id) {
    try {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.ok) {
        const paymentData = await response.json() as any;
        if (paymentData.status === "approved") {
          userId = paymentData.external_reference;
          paymentId = paymentData.id;
        }
      }
    } catch (err: any) {
      console.error("Error verifying payment with Mercado Pago:", err.message);
    }
  }

  // Update Firestore user record
  if (userId) {
    const firestore = getDb();
    if (firestore) {
      try {
        const userRef = firestore.collection("users").doc(userId);
        await userRef.set({
          hasAccess: true,
          membershipType: "subscriber",
          subscriptionId: paymentId,
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        console.log(`Firestore User ${userId} updated to 'subscriber' successfully.`);
      } catch (err: any) {
        console.error("Failed to update Firestore user on webhook:", err.message);
        return res.status(500).json({ error: "Db write failed" });
      }
    } else {
      console.warn("Firestore not available during webhook callback.");
    }
  }

  return res.json({ received: true });
});

// ==========================================
// MERCADO PAGO INTERACTIVE PAYMENT SIMULATOR
// ==========================================
app.get("/api/mercadopago/mock-checkout", (req, res) => {
  const { userId, email } = req.query;
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Mercado Pago - Simulação de Assinatura</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-slate-50 flex items-center justify-center min-h-screen font-sans">
        <div class="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
          <div class="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            MP
          </div>
          <h1 class="text-xl font-bold text-slate-800 mb-2">Simulador de Assinatura Mercado Pago</h1>
          <p class="text-sm text-slate-500 mb-6">Você está no ambiente de testes integrado para o app <strong>Tricotando com o Zé</strong>.</p>
          
          <div class="bg-slate-50 p-4 rounded-xl text-left mb-6 border border-slate-100">
            <div class="text-xs text-slate-400 uppercase tracking-wider mb-1">Item da Fatura</div>
            <div class="text-sm font-medium text-slate-700">Assinatura Anual do Plano Esquema Fácil</div>
            <div class="text-xl font-bold text-emerald-600 mt-1">R$ 29,90/mês</div>
            <hr class="my-3 border-slate-100" />
            <div class="text-xs text-slate-400"><strong>Usuário:</strong> ${userId}</div>
            <div class="text-xs text-slate-400"><strong>Email:</strong> ${email}</div>
          </div>

          <button id="btn-pay" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl transition duration-150 mb-3">
            Simular Pagamento com Sucesso
          </button>
          
          <a href="/" class="text-xs text-slate-400 hover:text-slate-600 underline block mt-2">Cancelar e voltar</a>
        </div>
        <script>
          document.getElementById('btn-pay').addEventListener('click', async () => {
            const btn = document.getElementById('btn-pay');
            btn.disabled = true;
            btn.innerText = 'Processando...';
            
            try {
              // Call simulated webhook API
              const response = await fetch('/api/mercadopago/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'payment.created',
                  data: { id: 'mock-pay-' + Math.floor(Math.random() * 1000000) },
                  userId: decodeURIComponent('${userId}')
                })
              });
              
              if (response.ok) {
                alert('Assinatura ativada no sistema! Você será redirecionado para a aplicação.');
                window.location.href = '/?payment=success';
              } else {
                alert('Erro ao processar simulação.');
                btn.disabled = false;
                btn.innerText = 'Simular Pagamento com Sucesso';
              }
            } catch (err) {
              alert('Erro de conexão: ' + err.message);
              btn.disabled = false;
              btn.innerText = 'Simular Pagamento com Sucesso';
            }
          });
        </script>
      </body>
    </html>
  `);
});

// ==========================================
// VITE INTEGRATION & PRODUCTION SERVING
// ==========================================
async function start() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode with Vite Dev Server Middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware mounted.");
  } else {
    // Production serving of bundled static assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving production bundle from dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening at http://localhost:${PORT}`);
  });
}

start();
