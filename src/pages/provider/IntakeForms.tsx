import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Trash2, ClipboardList, Loader2,
  ChevronDown, ChevronUp, X, Eye, FileText,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

type FieldDef = {
  label: string;
  type: "text" | "textarea" | "select" | "checkbox" | "radio" | "date" | "number" | "file";
  required: boolean;
  options: string[];
};

type Form = {
  id: string;
  title: string;
  description: string | null;
  active: boolean;
  created_at: string;
  fields: {
    id: string; label: string; field_type: string;
    required: boolean; options: string[] | null; sort_order: number;
  }[];
};

type Submission = {
  id: string;
  client_id: string;
  booking_id: string | null;
  responses: { fieldId: string; value: any }[];
  created_at: string;
  client: { id: string; full_name: string; avatar_url: string | null } | null;
};

const FIELD_TYPES = [
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Text" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "radio", label: "Radio" },
  { value: "date", label: "Date" },
  { value: "number", label: "Number" },
  { value: "file", label: "File Upload" },
] as const;

const emptyField: FieldDef = { label: "", type: "text", required: false, options: [] };

export default function IntakeForms() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedForm, setExpandedForm] = useState<string | null>(null);

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FieldDef[]>([{ ...emptyField }]);

  // View submissions
  const [viewFormId, setViewFormId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile) {
        setProfileId(profile.id);
        loadForms(profile.id);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadForms = async (provId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/intake-forms?providerId=${provId}`);
      const json = await res.json();
      if (json.ok) setForms(json.data ?? []);
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  };

  const addField = () => setFields(prev => [...prev, { ...emptyField }]);
  const removeField = (idx: number) => setFields(prev => prev.filter((_, i) => i !== idx));
  const updateField = (idx: number, key: keyof FieldDef, value: any) => {
    setFields(prev => prev.map((f, i) => i === idx ? { ...f, [key]: value } : f));
  };

  const handleCreate = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (fields.some(f => !f.label.trim())) { toast.error("All fields need labels"); return; }

    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${API}/api/intake-forms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          fields: fields.map(f => ({
            label: f.label,
            type: f.type,
            required: f.required,
            options: ["select", "radio", "checkbox"].includes(f.type) && f.options.length > 0
              ? f.options.filter(o => o.trim())
              : undefined,
          })),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success("Intake form created");
        setShowCreate(false);
        setTitle(""); setDescription(""); setFields([{ ...emptyField }]);
        if (profileId) loadForms(profileId);
      } else {
        toast.error(json.error ?? "Failed to create form");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Error creating form");
    } finally {
      setCreating(false);
    }
  };

  const deleteForm = async (formId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await fetch(`${API}/api/intake-forms/${formId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setForms(prev => prev.filter(f => f.id !== formId));
      toast.success("Form removed");
    } catch {
      toast.error("Could not delete form");
    }
  };

  const loadSubmissions = async (formId: string) => {
    setViewFormId(formId);
    setLoadingSubs(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API}/api/intake-forms/${formId}/submissions`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (json.ok) setSubmissions(json.data ?? []);
    } catch {
      // non-fatal
    } finally {
      setLoadingSubs(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-24">
      <div className="w-full px-4 md:px-8 xl:px-12 pt-12 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="shrink-0 w-9 h-9 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-2xl font-bold text-foreground">Intake Forms</h1>
          </div>
          <button
            onClick={() => setShowCreate(v => !v)}
            className="flex items-center gap-2 px-4 py-2 gradient-indigo rounded-pill text-sm font-semibold text-primary-foreground"
          >
            <Plus className="w-4 h-4" /> New Form
          </button>
        </div>

        {/* Create form builder */}
        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <GlassCard className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">Create Intake Form</h3>
                  <button onClick={() => setShowCreate(false)} className="w-7 h-7 glass-1 rounded-full flex items-center justify-center">
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>

                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Form title (e.g. New Client Health Assessment)"
                  className="w-full px-4 py-3 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/[0.08] focus:border-indigo/40"
                />
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Description shown to clients (optional)"
                  rows={2}
                  className="w-full px-4 py-3 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/[0.08] focus:border-indigo/40 resize-none"
                />

                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Form Fields</p>
                  <div className="space-y-3">
                    {fields.map((field, idx) => (
                      <div key={idx} className="glass-1 rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            value={field.label}
                            onChange={e => updateField(idx, "label", e.target.value)}
                            placeholder="Field label (e.g. Medical History)"
                            className="flex-1 px-3 py-2 glass-2 rounded-lg text-xs text-foreground placeholder:text-muted-foreground outline-none"
                          />
                          {fields.length > 1 && (
                            <button onClick={() => removeField(idx)} className="w-6 h-6 rounded-full glass-2 flex items-center justify-center">
                              <Trash2 className="w-3 h-3 text-coral" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={field.type}
                            onChange={e => updateField(idx, "type", e.target.value)}
                            className="flex-1 px-3 py-2 glass-2 rounded-lg text-xs text-foreground outline-none"
                          >
                            {FIELD_TYPES.map(t => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                          <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={e => updateField(idx, "required", e.target.checked)}
                              className="accent-indigo"
                            />
                            Required
                          </label>
                        </div>
                        {["select", "radio", "checkbox"].includes(field.type) && (
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-1">Options (one per line)</p>
                            <textarea
                              value={field.options.join("\n")}
                              onChange={e => updateField(idx, "options", e.target.value.split("\n"))}
                              placeholder={"Option 1\nOption 2\nOption 3"}
                              rows={3}
                              className="w-full px-3 py-2 glass-2 rounded-lg text-xs text-foreground placeholder:text-muted-foreground outline-none resize-none"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={addField} className="mt-2 flex items-center gap-1.5 text-xs text-indigo font-medium">
                    <Plus className="w-3.5 h-3.5" /> Add Field
                  </button>
                </div>

                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full py-3 gradient-indigo rounded-pill text-sm font-semibold text-primary-foreground"
                >
                  {creating ? "Creating..." : "Create Form"}
                </button>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submissions viewer modal */}
        {viewFormId && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setViewFormId(null)} className="fixed inset-0 bg-obsidian/70 z-[80]" />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }}
              className="fixed bottom-0 left-0 right-0 z-[90] max-w-lg mx-auto rounded-t-3xl p-6 space-y-4 max-h-[80vh] overflow-y-auto"
              style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Submissions</h3>
                <button onClick={() => setViewFormId(null)} className="w-7 h-7 glass-1 rounded-full flex items-center justify-center">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>

              {loadingSubs ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-6 h-6 text-indigo animate-spin mx-auto" />
                </div>
              ) : submissions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No submissions yet.</p>
              ) : (
                <div className="space-y-3">
                  {submissions.map(sub => {
                    const form = forms.find(f => f.id === viewFormId);
                    return (
                      <GlassCard key={sub.id} className="p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo/20 flex items-center justify-center text-[9px] font-bold text-indigo">
                            {sub.client?.full_name?.charAt(0) ?? "?"}
                          </div>
                          <span className="text-xs font-medium text-foreground">{sub.client?.full_name ?? "Client"}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {new Date(sub.created_at).toLocaleDateString("en-ZA")}
                          </span>
                        </div>
                        {(Array.isArray(sub.responses) ? sub.responses : []).map((r: any, i: number) => {
                          const field = form?.fields.find(f => f.id === r.fieldId);
                          return (
                            <div key={i} className="glass-2 rounded-lg p-2">
                              <p className="text-[10px] text-muted-foreground">{field?.label ?? `Field ${i + 1}`}</p>
                              <p className="text-xs text-foreground">{String(r.value ?? "—")}</p>
                            </div>
                          );
                        })}
                      </GlassCard>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </>
        )}

        {/* Forms list */}
        {loading ? (
          <GlassCard className="p-8 text-center">
            <Loader2 className="w-6 h-6 text-indigo animate-spin mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Loading forms...</p>
          </GlassCard>
        ) : forms.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No intake forms yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Create one to collect client info before appointments.</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {forms.map(form => {
              const isExpanded = expandedForm === form.id;
              return (
                <GlassCard key={form.id} className="overflow-hidden">
                  <button
                    onClick={() => setExpandedForm(isExpanded ? null : form.id)}
                    className="w-full p-4 flex items-center gap-3 text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-violet/20 flex items-center justify-center shrink-0">
                      <ClipboardList className="w-5 h-5 text-violet" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{form.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {form.fields.length} fields · Created {new Date(form.created_at).toLocaleDateString("en-ZA")}
                      </p>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="px-4 pb-4 space-y-3">
                          {form.description && <p className="text-xs text-muted-foreground">{form.description}</p>}

                          <div className="space-y-2">
                            {form.fields.map(field => (
                              <div key={field.id} className="glass-2 rounded-xl p-3 flex items-start gap-3">
                                <FileText className="w-4 h-4 text-violet shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs font-medium text-foreground">
                                    {field.label}
                                    {field.required && <span className="text-coral ml-1">*</span>}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground capitalize">{field.field_type.replace("_", " ")}</p>
                                  {field.options && (
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                      Options: {(field.options as string[]).join(", ")}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button onClick={() => loadSubmissions(form.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 glass-1 rounded-pill text-xs font-medium text-indigo">
                              <Eye className="w-3 h-3" /> View Submissions
                            </button>
                            <button onClick={() => deleteForm(form.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 glass-1 rounded-pill text-xs font-medium text-coral">
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
      <ProviderNav />
    </div>
  );
}
