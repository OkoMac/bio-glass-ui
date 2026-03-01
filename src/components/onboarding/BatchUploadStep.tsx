import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Download, CheckCircle, XCircle, AlertCircle, Users, Trash2, Plus } from "lucide-react";
import type { BatchEmployee } from "@/types/onboarding";

interface Props {
  title: string;
  subtitle?: string;
  employees: BatchEmployee[];
  onEmployeesChange: (employees: BatchEmployee[]) => void;
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────

function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
  return lines.slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const values = line.match(/("([^"]*)"|[^,]*)/g)?.map((v) => v.replace(/^"|"$/g, "").trim()) ?? [];
      return headers.reduce((obj, header, i) => ({ ...obj, [header]: values[i] ?? "" }), {} as Record<string, string>);
    });
}

function csvToEmployees(rows: Array<Record<string, string>>): BatchEmployee[] {
  return rows.map((row, i) => {
    const name = row.name ?? row["full name"] ?? row["full_name"] ?? row.employee ?? "";
    const email = row.email ?? row["email address"] ?? row["email_address"] ?? "";
    const department = row.department ?? row.dept ?? "";
    const jobTitle = row["job title"] ?? row["job_title"] ?? row.role ?? row.position ?? "";
    const budget = parseFloat(row["monthly budget"] ?? row.budget ?? row["monthly_budget"] ?? "0") || undefined;

    const errors: string[] = [];
    if (!name.trim()) errors.push("missing name");
    if (!email.trim()) errors.push("missing email");
    else if (!/^[\w.+-]+@[\w.-]+\.\w{2,}$/.test(email)) errors.push("invalid email");

    return {
      id: `emp_${i}_${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      department: department.trim() || undefined,
      jobTitle: jobTitle.trim() || undefined,
      monthlyBudget: budget,
      status: errors.length ? "error" : "valid",
      error: errors.join(", "),
    } as BatchEmployee;
  });
}

function deduplicateEmployees(employees: BatchEmployee[]): BatchEmployee[] {
  const seen = new Set<string>();
  return employees.map((e) => {
    if (seen.has(e.email)) {
      return { ...e, status: "duplicate" as const, error: "Duplicate email" };
    }
    seen.add(e.email);
    return e;
  });
}

// ─── CSV Template ─────────────────────────────────────────────────────────────

const CSV_TEMPLATE = `name,email,department,job title,monthly budget
Jane Smith,jane@company.co.za,Engineering,Software Engineer,1200
John Doe,john@company.co.za,Marketing,Marketing Manager,1000
`;

function downloadTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bion_employee_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_COLORS: Record<BatchEmployee["status"], string> = {
  pending: "text-muted-foreground",
  valid: "text-teal",
  duplicate: "text-amber-400",
  error: "text-coral",
};

const STATUS_ICONS: Record<BatchEmployee["status"], React.ReactNode> = {
  pending: <AlertCircle className="w-4 h-4 text-muted-foreground" />,
  valid: <CheckCircle className="w-4 h-4 text-teal" />,
  duplicate: <AlertCircle className="w-4 h-4 text-amber-400" />,
  error: <XCircle className="w-4 h-4 text-coral" />,
};

// ─── Manual Add Form ──────────────────────────────────────────────────────────

function AddEmployeeForm({ onAdd }: { onAdd: (e: BatchEmployee) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dept, setDept] = useState("");
  const [budget, setBudget] = useState("");

  const add = () => {
    if (!name.trim() || !email.trim()) return;
    const emp: BatchEmployee = {
      id: `emp_manual_${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      department: dept.trim() || undefined,
      monthlyBudget: parseFloat(budget) || undefined,
      status: /^[\w.+-]+@[\w.-]+\.\w{2,}$/.test(email) ? "valid" : "error",
      error: /^[\w.+-]+@[\w.-]+\.\w{2,}$/.test(email) ? undefined : "invalid email",
    };
    onAdd(emp);
    setName(""); setEmail(""); setDept(""); setBudget("");
  };

  return (
    <div className="glass-1 rounded-xl p-4 border border-white/5 space-y-3">
      <p className="text-xs font-semibold text-foreground">Add employee manually</p>
      <div className="grid grid-cols-2 gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name *"
          className="glass-1 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground border border-white/5 outline-none" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email *" type="email"
          className="glass-1 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground border border-white/5 outline-none" />
        <input value={dept} onChange={(e) => setDept(e.target.value)} placeholder="Department"
          className="glass-1 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground border border-white/5 outline-none" />
        <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Monthly budget (R)" type="number"
          className="glass-1 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground border border-white/5 outline-none" />
      </div>
      <button
        onClick={add}
        disabled={!name.trim() || !email.trim()}
        className="flex items-center gap-1.5 text-xs font-medium text-indigo disabled:opacity-40"
      >
        <Plus className="w-3.5 h-3.5" />
        Add employee
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BatchUploadStep({ title, subtitle, employees, onEmployeesChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const validCount = employees.filter((e) => e.status === "valid").length;
  const errorCount = employees.filter((e) => e.status === "error" || e.status === "duplicate").length;

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      const parsed = csvToEmployees(rows);
      onEmployeesChange(deduplicateEmployees([...employees, ...parsed]));
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith(".csv")) processFile(file);
  };

  const removeEmployee = (id: string) => {
    onEmployeesChange(employees.filter((e) => e.id !== id));
  };

  const addEmployee = (emp: BatchEmployee) => {
    onEmployeesChange(deduplicateEmployees([...employees, emp]));
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>

      {/* Template download */}
      <button
        onClick={downloadTemplate}
        className="flex items-center gap-2 text-sm text-indigo"
      >
        <Download className="w-4 h-4" />
        Download CSV template
      </button>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
          dragOver ? "border-indigo/60 bg-indigo/5" : "border-white/10 hover:border-white/20"
        }`}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">Drop your CSV here or click to browse</p>
        <p className="text-xs text-muted-foreground mt-1">Supports: name, email, department, job title, monthly budget</p>
      </div>

      {/* Stats */}
      {employees.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-1 rounded-xl p-3 border border-white/5 text-center">
            <Users className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{employees.length}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className="glass-1 rounded-xl p-3 border border-teal/20 text-center">
            <CheckCircle className="w-4 h-4 text-teal mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{validCount}</p>
            <p className="text-[10px] text-muted-foreground">Ready</p>
          </div>
          <div className="glass-1 rounded-xl p-3 border border-coral/20 text-center">
            <XCircle className="w-4 h-4 text-coral mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{errorCount}</p>
            <p className="text-[10px] text-muted-foreground">Issues</p>
          </div>
        </div>
      )}

      {/* Employee list */}
      {employees.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {employees.map((emp) => (
              <motion.div
                key={emp.id}
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 glass-1 rounded-xl px-3 py-2.5 border border-white/5"
              >
                {STATUS_ICONS[emp.status]}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{emp.name || "—"}</p>
                  <p className={`text-xs truncate ${STATUS_COLORS[emp.status]}`}>
                    {emp.error || emp.email}
                  </p>
                </div>
                {emp.department && (
                  <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:block">{emp.department}</span>
                )}
                {emp.monthlyBudget && (
                  <span className="text-[10px] text-teal shrink-0">R{emp.monthlyBudget}/mo</span>
                )}
                <button onClick={() => removeEmployee(emp.id)} className="text-muted-foreground hover:text-coral shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Manual add toggle */}
      <button
        onClick={() => setShowAddForm((v) => !v)}
        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5"
      >
        <Plus className="w-3.5 h-3.5" />
        Add employee manually
      </button>

      {showAddForm && <AddEmployeeForm onAdd={addEmployee} />}

      {/* Invite note */}
      {validCount > 0 && (
        <div className="glass-1 rounded-xl p-3 border border-indigo/20 text-center">
          <p className="text-xs text-muted-foreground">
            <span className="text-foreground font-semibold">{validCount} employees</span> will receive an invitation email to join BION when you complete onboarding.
          </p>
        </div>
      )}
    </div>
  );
}
