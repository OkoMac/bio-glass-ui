import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        toast({ title: "Account created!", description: "Check your email to verify your account." });
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate("/");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center px-4"
      style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.08) 0%, #0A0A0F 65%)" }}
    >
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground">BIO</h1>
          <p className="text-sm text-muted-foreground mt-2">Every Service. One Platform.</p>
        </div>

        <div className="glass-1 rounded-pill p-1 flex">
          {(["login", "signup"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 rounded-pill py-2 text-sm font-medium transition-all capitalize ${mode === m ? "gradient-indigo text-primary-foreground" : "text-muted-foreground"}`}
            >{m === "login" ? "Sign In" : "Sign Up"}</button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" required
              className="w-full glass-1 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30" />
          )}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required
            className="w-full glass-1 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required minLength={6}
            className="w-full glass-1 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30" />

          <motion.button whileTap={{ scale: 0.97 }} disabled={loading} type="submit"
            className="w-full rounded-pill py-3.5 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta disabled:opacity-50"
          >{loading ? "..." : mode === "login" ? "Sign In" : "Create Account"}</motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default Auth;
