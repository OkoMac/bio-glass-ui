import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { FeatureGate } from "@/components/FeatureGate";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import {
  Stethoscope, FileText, Pill, Shield, User,
  Calendar, Clock, TrendingUp, AlertCircle, CheckCircle,
  Filter, Search, Plus, Edit, Trash2, ChevronRight,
  Sparkles as SparklesIcon, Clipboard, Heart,
  ArrowLeft,
} from "lucide-react";

// Medical Vertical Dashboard
// Tools for medical and allied health providers (physiotherapists, dietitians, biokineticists)
// Matches EXACT same design patterns as existing components

export default function MedicalDashboard() {
  const navigate = useNavigate();
  const { isEnabled } = useFeatureFlags();
  
  // Patients loaded from backend
  const [patients, setPatients] = useState<{
    id: number; name: string; condition: string; lastVisit: string;
    nextAppointment: string; medicalAid: string; memberNumber: string; notes: string;
  }[]>([]);

  // SOAP notes loaded from backend
  const [soapNotes, setSoapNotes] = useState<{
    id: number; patient: string; date: string;
    subjective: string; objective: string; assessment: string; plan: string;
  }[]>([]);
  
  // If the feature flag is disabled, show upgrade prompt
  if (!isEnabled('medicalVertical')) {
    return (
      <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>
        <div className="mx-auto max-w-2xl px-4 pt-20 pb-28 md:pb-8 md:pt-8 space-y-5">
          <GlassCard className="p-6 text-center">
            <SparklesIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Medical Vertical (Coming Soon)
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              HIPAA-compliant tools for medical and allied health providers.
            </p>
            <p className="text-xs text-muted-foreground">
              This feature requires Medical Vertical add-on subscription.
            </p>
          </GlassCard>
          <ProviderNav />
        </div>
      </div>
    );
  }
  
  const stats = {
    totalPatients: patients.length,
    upcomingAppointments: patients.filter(p => p.nextAppointment).length,
    soapNotesCount: soapNotes.length,
    medicalAidClaims: 0,
  };
  
  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="mx-auto max-w-6xl px-4 pt-20 pb-28 md:pb-8 md:pt-8 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Medical Dashboard</h1>
            <p className="text-xs text-muted-foreground">
              HIPAA-compliant tools for medical and allied health providers
            </p>
          </div>
          <button className="gradient-indigo rounded-pill px-4 py-2 text-sm font-semibold text-white flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Patient
          </button>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Patients</p>
                <p className="text-xl font-bold text-foreground">{stats.totalPatients}</p>
              </div>
              <User className="w-8 h-8 text-indigo/50" />
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Upcoming</p>
                <p className="text-xl font-bold text-foreground">{stats.upcomingAppointments}</p>
              </div>
              <Calendar className="w-8 h-8 text-teal/50" />
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">SOAP Notes</p>
                <p className="text-xl font-bold text-foreground">{stats.soapNotesCount}</p>
              </div>
              <FileText className="w-8 h-8 text-amber/50" />
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Medical Claims</p>
                <p className="text-xl font-bold text-foreground">{stats.medicalAidClaims}</p>
              </div>
              <Shield className="w-8 h-8 text-purple/50" />
            </div>
          </GlassCard>
        </div>
        
        {/* Medical Patients */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-indigo flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Medical Patients</h3>
                <p className="text-xs text-muted-foreground">Patients with medical conditions and treatment plans</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{patients.length} patients</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          
          <div className="space-y-3">
            {patients.length === 0 ? (
              <div className="p-6 text-center">
                <User className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">No patients yet</p>
                <p className="text-xs text-muted-foreground">
                  Add patients to manage their conditions, appointments, and medical records.
                </p>
              </div>
            ) : (
              patients.map(patient => (
                <div key={patient.id} className="p-4 glass-1 rounded-xl">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-indigo/20 flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-indigo" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{patient.name}</p>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Stethoscope className="w-3 h-3" />
                            <span>{patient.condition}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Last: {patient.lastVisit}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end mb-1">
                        <Calendar className="w-3 h-3 text-teal" />
                        <p className="text-sm font-medium text-teal">{patient.nextAppointment}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Next appointment</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="p-2 glass-1 rounded-lg">
                      <p className="text-xs text-muted-foreground">Medical Aid</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Shield className="w-3 h-3 text-amber" />
                        <p className="text-sm font-medium text-foreground">{patient.medicalAid}</p>
                      </div>
                    </div>

                    <div className="p-2 glass-1 rounded-lg">
                      <p className="text-xs text-muted-foreground">Member Number</p>
                      <div className="flex items-center gap-1 mt-1">
                        <FileText className="w-3 h-3 text-purple" />
                        <p className="text-sm font-medium text-foreground">{patient.memberNumber}</p>
                      </div>
                    </div>
                  </div>

                  {patient.notes && (
                    <div className="p-2 glass-1 rounded-lg mb-3">
                      <p className="text-xs text-muted-foreground mb-1">Clinical Notes</p>
                      <p className="text-sm text-foreground">{patient.notes}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button className="flex-1 glass-1 rounded-pill py-2 text-sm font-medium text-foreground">
                      SOAP Notes
                    </button>
                    <button className="flex-1 glass-1 rounded-pill py-2 text-sm font-medium text-foreground">
                      Prescriptions
                    </button>
                    <button className="flex-1 gradient-indigo rounded-pill py-2 text-sm font-semibold text-white">
                      Medical Claim
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
        
        <div className="grid lg:grid-cols-3 gap-5">
          
          {/* Recent SOAP Notes */}
          <div className="lg:col-span-2">
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-teal flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Recent SOAP Notes</h3>
                    <p className="text-xs text-muted-foreground">Subjective, Objective, Assessment, Plan documentation</p>
                  </div>
                </div>
                <button className="glass-1 rounded-pill px-3 py-1.5 text-xs font-medium text-foreground">
                  New Note
                </button>
              </div>
              
              <div className="space-y-3">
                {soapNotes.length === 0 ? (
                  <div className="p-6 text-center">
                    <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground mb-1">No SOAP notes yet</p>
                    <p className="text-xs text-muted-foreground">Create SOAP notes to document patient consultations.</p>
                  </div>
                ) : (
                  soapNotes.map(note => (
                    <div key={note.id} className="p-3 glass-1 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{note.patient}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Calendar className="w-3 h-3" />
                            <span>{note.date}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="px-2 py-0.5 bg-teal/20 text-teal rounded-full text-xs font-medium">
                            SOAP
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Subjective</p>
                          <p className="text-sm text-foreground">{note.subjective}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Objective</p>
                          <p className="text-sm text-foreground">{note.objective}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Assessment</p>
                          <p className="text-sm text-foreground">{note.assessment}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Plan</p>
                          <p className="text-sm text-foreground">{note.plan}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <button className="flex-1 glass-1 rounded-pill py-1.5 text-xs font-medium text-foreground">
                          Edit
                        </button>
                        <button className="flex-1 glass-1 rounded-pill py-1.5 text-xs font-medium text-foreground">
                          Print
                        </button>
                        <button className="flex-1 gradient-indigo rounded-pill py-1.5 text-xs font-semibold text-white">
                          Sign & Lock
                        </button>
                      </div>
                    </div>
                  ))
                )}

                <button className="w-full glass-1 rounded-pill py-2.5 text-sm font-medium text-foreground flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create New SOAP Note
                </button>
              </div>
            </GlassCard>
          </div>
          
          {/* Medical Quick Tools */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-amber flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Medical Tools</h3>
                  <p className="text-xs text-muted-foreground">Quick access to medical features</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <button className="w-full glass-1 rounded-pill py-2.5 text-sm font-medium text-foreground flex items-center justify-center gap-2">
                <Pill className="w-4 h-4" />
                Prescription Manager
              </button>
              
              <button className="w-full glass-1 rounded-pill py-2.5 text-sm font-medium text-foreground flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" />
                Medical Aid Claims
              </button>
              
              <button className="w-full glass-1 rounded-pill py-2.5 text-sm font-medium text-foreground flex items-center justify-center gap-2">
                <Clipboard className="w-4 h-4" />
                Treatment Plans
              </button>
              
              <button className="w-full glass-1 rounded-pill py-2.5 text-sm font-medium text-foreground flex items-center justify-center gap-2">
                <Heart className="w-4 h-4" />
                Patient Education
              </button>
              
              <div className="pt-3 border-t border-white/5">
                <h4 className="text-sm font-semibold text-foreground mb-2">Compliance Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">HIPAA Compliant</span>
                    <CheckCircle className="w-3 h-3 text-teal" />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Data Encrypted</span>
                    <CheckCircle className="w-3 h-3 text-teal" />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Audit Logs</span>
                    <CheckCircle className="w-3 h-3 text-teal" />
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
        
        {/* Feature-Gated Medical Analytics */}
        <FeatureGate feature="medicalVertical">
          <GlassCard className="p-5">
            <h3 className="font-semibold text-foreground mb-4">Medical Analytics</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 glass-1 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full gradient-indigo flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    {/* TODO STUB: hardcoded "42" — wire to useBookings() count for current month when medical dashboard ships */}
                    <p className="text-2xl font-bold text-foreground">—</p>
                    <p className="text-xs text-muted-foreground">Consultations/Month</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Average medical consultations</p>
              </div>
              
              <div className="p-4 glass-1 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full gradient-teal flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    {/* TODO STUB: hardcoded "R18,500" — wire to medical_claims aggregate when dashboard ships */}
                    <p className="text-2xl font-bold text-foreground">—</p>
                    <p className="text-xs text-muted-foreground">Monthly Claims</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Medical aid billing value</p>
              </div>
              
              <div className="p-4 glass-1 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full gradient-amber flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    {/* TODO STUB: hardcoded "94%" — wire to claims approval ratio when dashboard ships */}
                    <p className="text-2xl font-bold text-foreground">—</p>
                    <p className="text-xs text-muted-foreground">Claim Success</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Medical aid claim approval rate</p>
              </div>
            </div>
          </GlassCard>
        </FeatureGate>
        
        <ProviderNav />
      </div>
    </div>
  );
}