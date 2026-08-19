import React, { useState, useEffect, useRef } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  User
} from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";

interface LoginWallProps {
  onAccessGranted: (user: User, userData: any) => void;
}

export const LoginWall: React.FC<LoginWallProps> = ({ onAccessGranted }) => {
  const [activeTab, setActiveTab] = useState<"youtube" | "mercadopago">("youtube");
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  
  // Auth state inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Loading & error states
  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Checkout & youtube state
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [youtubeVerifying, setYoutubeVerifying] = useState(false);

  const onAccessGrantedRef = useRef(onAccessGranted);
  useEffect(() => {
    onAccessGrantedRef.current = onAccessGranted;
  }, [onAccessGranted]);

  // Monitor Auth State safely without infinite write loops
  useEffect(() => {
    let unsubDoc: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubDoc) {
        unsubDoc();
        unsubDoc = null;
      }

      setUser(currentUser);
      if (currentUser) {
        const isCreator = currentUser.email?.toLowerCase() === "jose.lancellotti@gmail.com";
        const userRef = doc(db, "users", currentUser.uid);

        try {
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            const defaultProfile = {
              uid: currentUser.uid,
              email: currentUser.email || "",
              displayName: currentUser.displayName || (isCreator ? "Zé (Criador)" : ""),
              photoURL: currentUser.photoURL || "",
              hasAccess: isCreator,
              membershipType: isCreator ? "youtube_member" : "none",
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, defaultProfile, { merge: true });
            setUserData(defaultProfile);
            if (isCreator) {
              onAccessGrantedRef.current(currentUser, defaultProfile);
            }
          } else {
            const data = snap.data();
            setUserData(data);
            if (isCreator && !data.hasAccess) {
              await setDoc(userRef, { hasAccess: true, membershipType: "youtube_member" }, { merge: true });
              data.hasAccess = true;
              data.membershipType = "youtube_member";
            }
            if (data.hasAccess || isCreator) {
              onAccessGrantedRef.current(currentUser, { ...data, hasAccess: true, membershipType: data.membershipType || "youtube_member" });
            }
          }
        } catch (err) {
          console.warn("Initial Firestore profile fetch error:", err);
          if (isCreator) {
            onAccessGrantedRef.current(currentUser, {
              uid: currentUser.uid,
              email: currentUser.email || "",
              displayName: currentUser.displayName || "Zé (Criador)",
              hasAccess: true,
              membershipType: "youtube_member"
            });
          }
        }

        // Listen for live updates (e.g. webhook updates payment) in read-only mode
        try {
          unsubDoc = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setUserData(data);
              if (data.hasAccess || isCreator) {
                onAccessGrantedRef.current(currentUser, { ...data, hasAccess: true, membershipType: data.membershipType || "youtube_member" });
              }
            }
          }, (err) => {
            console.warn("Firestore snapshot listener notice:", err);
          });
        } catch (e) {
          console.warn("Snapshot setup failed:", e);
        }

        setAuthChecking(false);
      } else {
        setUserData(null);
        setAuthChecking(false);
      }
    });

    return () => {
      if (unsubDoc) unsubDoc();
      unsubscribe();
    };
  }, []);

  // Handle Google Sign-In and YouTube verification
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Check if user is the creator (Zé)
      const userEmail = result.user.email?.toLowerCase();
      if (userEmail === "jose.lancellotti@gmail.com") {
        setSuccessMessage("Bem-vindo, Zé! Acesso de Criador liberado.");
        const userRef = doc(db, "users", result.user.uid);
        await setDoc(userRef, {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || "Zé (Criador)",
          hasAccess: true,
          membershipType: "youtube_member",
          membershipLevel: "Criador do Canal"
        }, { merge: true });
        return;
      }

      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      setYoutubeVerifying(true);

      let channelId: string = "user_" + result.user.uid;
      
      // 1. Fetch user's YouTube Channel ID if token is available
      if (accessToken) {
        try {
          const ytResponse = await fetch(
            "https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true",
            {
              headers: {
                Authorization: `Bearer ${accessToken}`
              }
            }
          );

          if (ytResponse.ok) {
            const ytData = await ytResponse.json();
            if (ytData.items && ytData.items.length > 0) {
              channelId = ytData.items[0].id;
            }
          }
        } catch (ytErr) {
          console.warn("Could not retrieve channel ID directly, continuing with account UID:", ytErr);
        }
      }

      // 2. Call backend server to verify membership status
      const verifyResponse = await fetch("/api/youtube/verify", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({
          userId: result.user.uid,
          channelId: channelId,
          accessToken: accessToken,
          userEmail: result.user.email
        })
      });

      if (!verifyResponse.ok) {
        const verifyError = await verifyResponse.json().catch(() => ({}));
        throw new Error(verifyError.error || "A assinatura de membro do YouTube não foi confirmada no nível exigido.");
      }

      const verifyData = await verifyResponse.json();
      setSuccessMessage(`Acesso liberado como Membro! Nível: ${verifyData.level}`);

    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === "auth/api-key-not-valid" || err.message?.includes("api-key-not-valid")) {
        setError("Chave de API do Firebase não autorizada para login. No Google Cloud Console (APIs e Serviços > Credenciais), certifique-se de que a chave de API não esteja restrita apenas para YouTube, ou permita a 'Identity Toolkit API'.");
      } else if (err.code === "auth/unauthorized-domain") {
        setError(`Domínio não autorizado no Firebase. Adicione "${window.location.hostname}" em Firebase Console > Authentication > Settings > Authorized Domains.`);
      } else if (err.code === "auth/popup-blocked") {
        setError("A janela de login do Google foi bloqueada pelo navegador. Permita popups neste site.");
      } else if (err.code === "auth/popup-closed-by-user") {
        setError("A janela de login foi fechada antes de concluir.");
      } else if (err.code === "auth/cancelled-popup-request") {
        setError("Tentativa de login cancelada.");
      } else if (err.code === "auth/operation-not-allowed") {
        setError("O login com Google não está ativado no Firebase Console (Authentication > Sign-in method).");
      } else {
        setError(err.message || "Ocorreu um erro ao fazer login.");
      }
    } finally {
      setLoading(false);
      setYoutubeVerifying(false);
    }
  };

  // Handle Email / Password authentication
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setError("Preencha todos os campos.");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Register new user
        await createUserWithEmailAndPassword(auth, email, password);
        setSuccessMessage("Conta criada com sucesso! Assine abaixo para liberar o acesso.");
      } else {
        // Login existing user
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("E-mail ou senha incorretos.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Este e-mail já está cadastrado. Tente fazer login.");
      } else if (err.code === "auth/weak-password") {
        setError("A senha deve ter pelo menos 6 caracteres.");
      } else if (err.code === "auth/invalid-email") {
        setError("Formato de e-mail inválido.");
      } else {
        setError(err.message || "Erro de autenticação.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Create Mercado Pago Checkout Preference and Redirect
  const handleSubscribeMercadoPago = async () => {
    if (!user) {
      setError("Faça login com e-mail/senha antes de assinar.");
      return;
    }

    setCheckoutLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/mercadopago/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email || "usuario@teste.com",
          userId: user.uid
        })
      });

      if (!response.ok) {
        throw new Error("Não foi possível gerar a preferência de pagamento.");
      }

      const pref = await response.json();
      if (pref.init_point) {
        // Redirect the user to the Mercado Pago checkout or mock checkout page
        window.location.href = pref.init_point;
      } else {
        throw new Error("Link de checkout não retornado pelo servidor.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Falha ao iniciar checkout.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUserData(null);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (authChecking) {
    return (
      <div id="auth-loading" className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-vintage-moss mb-4"></div>
        <p className="text-sm font-medium text-slate-600">Verificando credenciais...</p>
      </div>
    );
  }

  return (
    <div id="login-wall-container" className="min-h-screen bg-vintage-offwhite flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Banner Decorativo / Logo */}
        <div className="bg-vintage-moss px-8 py-8 text-center text-white relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/fabric-of-the-world.png')] opacity-10"></div>
          <div className="w-12 h-12 bg-vintage-mustard rounded-full flex items-center justify-center mx-auto mb-3 text-2xl shadow-md">
            🧶
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-white">
            Esquema Fácil
          </h2>
          <p className="mt-1 text-xs text-vintage-mossVeryLight uppercase tracking-widest font-semibold">
            Tricotando com o Zé
          </p>
        </div>

        {/* Corpo */}
        <div className="px-8 py-8">
          
          {/* Alertas e Erros */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-r-lg font-medium">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-xs rounded-r-lg font-medium">
              {successMessage}
            </div>
          )}

          {/* Estado de Acesso Negado / Sem Assinatura do Usuário Autenticado */}
          {user && userData && !userData.hasAccess ? (
            <div className="text-center space-y-4">
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-left">
                <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm mb-1">
                  <span>⚠️</span>
                  <span>Acesso Restrito</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Olá, <strong className="text-slate-800">{user.displayName || user.email}</strong>! Sua conta está autenticada, mas não detectamos uma assinatura ativa ou nível de membro elegível do YouTube.
                </p>
              </div>

              <div className="bg-vintage-mossVeryLight rounded-xl p-5 border border-slate-200 text-center space-y-3">
                <h4 className="font-display font-bold text-sm text-vintage-moss">Assinar via Mercado Pago</h4>
                <p className="text-xs text-slate-500">
                  Desbloqueie acesso total instantâneo por apenas R$ 29,90 por mês. Cancele quando quiser.
                </p>
                
                <button
                  onClick={handleSubscribeMercadoPago}
                  disabled={checkoutLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-medium py-3 px-4 rounded-xl transition duration-150 text-sm shadow-sm flex items-center justify-center space-x-2"
                >
                  {checkoutLoading ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                  ) : (
                    <>
                      <span>💳</span>
                      <span>Assinar por R$ 29,90/mês</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Deseja alternar de conta?</span>
                <button onClick={handleLogout} className="text-vintage-clay hover:underline font-bold">
                  Sair da Conta
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tabs para novo login */}
              <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                <button
                  onClick={() => { setActiveTab("youtube"); setError(null); }}
                  className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all duration-150 ${
                    activeTab === "youtube"
                      ? "bg-white text-vintage-moss shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  🔴 Membro do Canal
                </button>
                <button
                  onClick={() => { setActiveTab("mercadopago"); setError(null); }}
                  className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all duration-150 ${
                    activeTab === "mercadopago"
                      ? "bg-white text-vintage-moss shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  💳 Assinatura Direta
                </button>
              </div>

              {/* CONTEÚDO TAB: MEMBRO DO YOUTUBE */}
              {activeTab === "youtube" && (
                <div className="space-y-5 text-center">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Se você é membro ativo do canal <strong className="text-vintage-moss">Tricotando com o Zé</strong> em nível elegível, use o botão abaixo para se autenticar e liberar o acesso automático.
                  </p>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-2">
                    <h4 className="text-xs font-bold text-slate-700">Como funciona?</h4>
                    <ul className="text-[11px] text-slate-500 space-y-1 list-disc list-inside">
                      <li>Clique no botão e conecte sua conta Google</li>
                      <li>Nossos sistemas verificarão sua assinatura</li>
                      <li>Acesso imediato e 100% gratuito para membros elegíveis</li>
                    </ul>
                  </div>

                  <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-medium py-3 px-4 rounded-xl transition duration-150 text-sm shadow-md flex items-center justify-center space-x-2"
                  >
                    {youtubeVerifying ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                        <span>Verificando no YouTube...</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                          <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.52 3.54 12 3.54 12 3.54s-7.52 0-9.388.515a3.003 3.003 0 0 0-2.11 2.108C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.108C4.48 20.46 12 20.46 12 20.46s7.52 0 9.388-.515a3.003 3.003 0 0 0 2.11-2.108C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                        <span>Entrar com Google & Verificar</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* CONTEÚDO TAB: MERCADO PAGO / EMAIL E SENHA */}
              {activeTab === "mercadopago" && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed text-center">
                    Não é membro do canal? Acesse criando uma assinatura dedicada da plataforma usando Mercado Pago.
                  </p>

                  <form onSubmit={handleEmailAuth} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">E-mail</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seuemail@exemplo.com"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-vintage-moss"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Senha</label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Sua senha de acesso"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-vintage-moss"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-vintage-moss hover:bg-vintage-mossLight disabled:bg-slate-300 text-white font-medium py-2.5 rounded-xl transition duration-150 text-xs shadow-sm"
                    >
                      {loading ? "Processando..." : isSignUp ? "Cadastrar Conta" : "Entrar com E-mail"}
                    </button>
                  </form>

                  <div className="text-center pt-2">
                    <button
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-xs text-vintage-clay hover:underline font-semibold"
                    >
                      {isSignUp ? "Já tem conta? Entrar" : "Não tem conta? Cadastrar-se"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Rodapé da login wall */}
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
          <span>Ambiente Seguro SSL</span>
          <span>© Tricotando com o Zé 2026</span>
        </div>

      </div>
    </div>
  );
};
