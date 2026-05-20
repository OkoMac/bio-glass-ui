import { NavLink } from "react-router-dom";
import { MessageSquare, Radio, Workflow, Users } from "lucide-react";

/**
 * Shared sub-nav for the WhatsApp CRM. Mounted at the top of every CRM
 * page (Conversations, Contacts, Broadcasts, Automations) so the whole
 * thing feels like one tool. The sidebar entry "WhatsApp CRM" is the
 * single door; this pill row is the inner navigation.
 */
const tabs = [
  { to: "/admin/whatsapp",        label: "Conversations", icon: MessageSquare },
  { to: "/admin/crm/contacts",    label: "Contacts",      icon: Users        },
  { to: "/admin/broadcasts",      label: "Broadcasts",    icon: Radio        },
  { to: "/admin/automations",     label: "Automations",   icon: Workflow     },
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
