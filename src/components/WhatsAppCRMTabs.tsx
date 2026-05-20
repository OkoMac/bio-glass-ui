import { NavLink } from "react-router-dom";
import { MessageSquare, Radio, Workflow } from "lucide-react";

/**
 * Shared sub-nav for the WhatsApp CRM. Mounted at the top of Conversations
 * (/admin/whatsapp), Broadcasts (/admin/broadcasts*), and Automations
 * (/admin/automations) so all three feel like one tool.
 *
 * Lives outside <AdminNav> so the existing sidebar item "WhatsApp" still
 * lights up for the whole CRM — only the inner pill row tells you which
 * sub-section you're on.
 */
const tabs = [
  { to: "/admin/whatsapp",    label: "Conversations", icon: MessageSquare },
  { to: "/admin/broadcasts",  label: "Broadcasts",    icon: Radio        },
  { to: "/admin/automations", label: "Automations",   icon: Workflow     },
];

export default function WhatsAppCRMTabs() {
  return (
    <div className="flex items-center gap-2 flex-wrap mb-4">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.to === "/admin/whatsapp"}>
          {({ isActive }) => (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-medium border transition-all ${
                isActive
                  ? "bg-coral/15 text-coral border-coral/30"
                  : "bg-white/[0.02] text-muted-foreground border-white/[0.06] hover:bg-white/[0.04] hover:text-foreground"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </div>
          )}
        </NavLink>
      ))}
    </div>
  );
}
