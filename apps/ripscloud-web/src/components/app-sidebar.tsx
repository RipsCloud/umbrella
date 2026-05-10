"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  ClipboardList,
  Settings2,
  Building2,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { useAuth } from "@/context/useAuth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation()
  const { user, roles } = useAuth()
  const location = useLocation()

  const roleSet = React.useMemo(() => new Set(roles), [roles])
  const hasAnyRole = React.useCallback(
    (requiredRoles?: string | string[]) => {
      if (!requiredRoles) {
        return true
      }

      if (Array.isArray(requiredRoles)) {
        return requiredRoles.some((role) => roleSet.has(role))
      }

      return roleSet.has(requiredRoles)
    },
    [roleSet],
  )

  const navMain = [
    {
      title: t("sidebar.dashboard"),
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: location.pathname === "/dashboard",
    },
    {
      title: t("sidebar.newInvoice"),
      url: "/accounting/invoices/new",
      icon: FileText,
      isActive: location.pathname === "/accounting/invoices/new",
    },
    {
      title: t("sidebar.ripsWizard"),
      url: "/rips/wizard",
      icon: FileText,
      isActive: location.pathname === "/rips/wizard",
    },
    {
      title: t("sidebar.accounting"),
      url: "/accounting",
      icon: BarChart3,
      isActive: location.pathname.startsWith("/accounting"),
      items: [
        {
          title: t("sidebar.invoices"),
          url: "/accounting/invoices",
        },
        {
          title: t("sidebar.creditNotes"),
          url: "/accounting/credit-notes",
        },
        {
          title: t("sidebar.clients"),
          url: "/accounting/clients",
        },
      ],
    },
    {
      title: t("sidebar.reports"),
      url: "/reports",
      icon: ClipboardList,
      isActive: location.pathname.startsWith("/reports"),
      items: [
        {
          title: t("sidebar.salesReport"),
          url: "/reports/sales",
        },
        {
          title: t("sidebar.clientStatement"),
          url: "/reports/client-statement",
        },
        {
          title: t("sidebar.ripsDispatchReport"),
          url: "/reports/rips-dispatch",
        },
        {
          title: t("sidebar.resolutionUsageReport"),
          url: "/reports/resolution-usage",
        },
      ],
    },
    {
      title: t("sidebar.rips"),
      url: "/rips",
      icon: FileText,
      isActive: location.pathname.startsWith("/rips") && location.pathname !== "/rips/wizard",
      items: [
        {
          title: t("sidebar.patients"),
          url: "/rips/patients",
        },
        {
          title: t("sidebar.specialists"),
          url: "/rips/specialists",
        },
      ],
    },
    {
      title: t("sidebar.services"),
      url: "/services",
      icon: FileText,
      isActive: location.pathname.startsWith("/services"),
      items: [
        {
          title: t("sidebar.servicesConsultas"),
          url: "/services/consultas",
        },
        {
          title: t("sidebar.servicesProcedimientos"),
          url: "/services/procedimientos",
        },
        {
          title: t("sidebar.servicesUrgencias"),
          url: "/services/urgencias",
        },
        {
          title: t("sidebar.servicesHospitalizacion"),
          url: "/services/hospitalizacion",
        },
        {
          title: t("sidebar.servicesRecienNacidos"),
          url: "/services/recien-nacidos",
        },
        {
          title: t("sidebar.servicesMedicamentos"),
          url: "/services/medicamentos",
        },
        {
          title: t("sidebar.servicesOtrosServicios"),
          url: "/services/otros-servicios",
        },
      ],
    },
    ...(() => {
      const systemItems = [
        // Workspaces: SuperAdmin only
        hasAnyRole("SuperAdmin")
          ? {
              title: t("sidebar.workspaces"),
              url: "/system/workspaces",
              icon: Building2,
            }
          : null,
        // Company: Admin or SuperAdmin
        hasAnyRole(["Admin", "SuperAdmin"])
          ? {
              title: t("sidebar.company"),
              url: "/system/company",
            }
          : null,
        // Users: Admin or SuperAdmin
        hasAnyRole(["Admin", "SuperAdmin"])
          ? {
              title: t("sidebar.users"),
              url: "/system/users",
            }
          : null,
        // Invoice Configuration: Admin or SuperAdmin
        hasAnyRole(["Admin", "SuperAdmin"])
          ? {
              title: t("sidebar.invoiceConfiguration"),
              url: "/system/invoice-configuration",
            }
          : null,
        // Invoice Resolutions: Admin or SuperAdmin
        hasAnyRole(["Admin", "SuperAdmin"])
          ? {
              title: t("sidebar.invoiceResolutions"),
              url: "/system/invoice-resolutions",
            }
          : null,
        // Credit Note Resolutions: Admin or SuperAdmin
        hasAnyRole(["Admin", "SuperAdmin"])
          ? {
              title: t("sidebar.creditNoteResolutions"),
              url: "/system/credit-note-resolutions",
            }
          : null,
        // Sispro Configuration: Admin or SuperAdmin
        hasAnyRole(["Admin", "SuperAdmin"])
          ? {
              title: t("sidebar.sisproConfiguration"),
              url: "/system/sispro-configuration",
            }
          : null,
        // Environment: Admin or SuperAdmin
        hasAnyRole(["Admin", "SuperAdmin"])
          ? {
              title: t("sidebar.environment"),
              url: "/system/environment",
            }
          : null,
      ].filter(Boolean) as {
        title: string
        url: string
        icon?: typeof Building2
      }[]

      if (systemItems.length === 0) {
        return []
      }

      return [
        {
          title: t("sidebar.system"),
          url: "/system",
          icon: Settings2,
          isActive: location.pathname.startsWith("/system"),
          items: systemItems,
        },
      ]
    })(),
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        {user && <NavUser user={user} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
