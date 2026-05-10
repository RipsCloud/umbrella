"use client"

import { useTranslation } from "react-i18next"
import { ChevronsUpDown, Command } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/context/useAuth"

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const { t } = useTranslation()
  const { workspaces, currentWorkspace, switchWorkspace, roles } = useAuth()
  const userHasSuperAdminRole = roles.includes("SuperAdmin")
  const appName = t("common.appName") || "Admin"
  const hasWorkspaces = workspaces.length > 0
  const currentWorkspaceName =
    currentWorkspace?.companyName || t("workspace.noWorkspaces") || "Workspace"
  
  const environmentBadge = currentWorkspace?.environment === 1 
    ? { label: t("environment.badge.production"), variant: "default" as const, className: "bg-emerald-500 hover:bg-emerald-600" }
    : { label: t("environment.badge.testing"), variant: "secondary" as const, className: "bg-amber-500 hover:bg-amber-600 text-white" }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Command className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold flex items-center gap-2">
                  {appName}
                  {currentWorkspace?.environment !== undefined && (
                    <Badge 
                      variant={environmentBadge.variant} 
                      className={`text-[10px] px-1.5 py-0 h-4 ${environmentBadge.className}`}
                    >
                      {environmentBadge.label}
                    </Badge>
                  )}
                </span>
                <span className="truncate text-xs">{currentWorkspaceName}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {t("common.workspace") || "Workspace"}
            </DropdownMenuLabel>
            {userHasSuperAdminRole && (
              <DropdownMenuLabel className="text-[10px] font-semibold uppercase text-blue-600">
                {t("workspace.current") || "Current"}
              </DropdownMenuLabel>
            )}
            <DropdownMenuSeparator />
            {hasWorkspaces ? (
              <DropdownMenuRadioGroup
                value={currentWorkspace?.id}
                onValueChange={switchWorkspace}
              >
                {workspaces.map((workspace) => (
                  <DropdownMenuRadioItem key={workspace.id} value={workspace.id}>
                    {workspace.companyName}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            ) : (
              <div className="px-2 py-3 text-xs text-muted-foreground">
                {t("workspace.noWorkspaces") || "No workspaces available"}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
