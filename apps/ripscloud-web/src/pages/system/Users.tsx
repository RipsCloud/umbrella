import { useCallback, useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { AlertCircle, RefreshCcw, UserPlus, Users as UsersIcon } from "lucide-react"
import type { AxiosError } from "axios"

import { useApiClient } from "@/context/ApiClientContext"
import { useAuth } from "@/context/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import type { RipsAdminApplicationDTOsWorkspaceUserDto } from "@/api"

type RoleOption = "Admin" | "User"

interface Member {
  userId: string
  email: string
  firstName: string
  lastName: string
  roleName: string
  joinedAt: string
}

interface InviteFormState {
  email: string
  firstName: string
  lastName: string
  roleName: RoleOption
}

const DEFAULT_FORM: InviteFormState = {
  email: "",
  firstName: "",
  lastName: "",
  roleName: "Admin",
}

export function Users() {
  const { t } = useTranslation()
  const { apiClient } = useApiClient()
  const { currentWorkspace, isLoading: isAuthLoading } = useAuth()

  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState<InviteFormState>(DEFAULT_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const hasWorkspace = !!currentWorkspace
  const showTableSkeleton = isLoading || isAuthLoading

  const normalizedMembers = useMemo(
    () =>
      members.map((member) => ({
        ...member,
        displayName: `${member.firstName} ${member.lastName}`.trim() || member.email,
        joinedDate: member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : "",
      })),
    [members],
  )

  const fetchMembers = useCallback(async () => {
    if (!currentWorkspace) {
      setMembers([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response =
        await apiClient.ripsAdminPresentationEndpointsWorkspacesGetWorkspaceUsersEndpoint(currentWorkspace.id)

      const workspaceUsers = response.data ?? []
      const mapped: Member[] = workspaceUsers.map((member: RipsAdminApplicationDTOsWorkspaceUserDto) => ({
        userId: member.userId ?? "",
        email: member.email ?? "",
        firstName: member.firstName ?? "",
        lastName: member.lastName ?? "",
        roleName: member.roleName ?? "",
        joinedAt: member.joinedAt ?? "",
      }))

      setMembers(mapped)
    } catch (err) {
      console.error(err)
      setError(t("usersPage.errors.load"))
    } finally {
      setIsLoading(false)
    }
  }, [apiClient, currentWorkspace, t])

  useEffect(() => {
    void fetchMembers()
  }, [fetchMembers])

  const handleInviteFormChange = (field: keyof InviteFormState, value: string) => {
    setInviteForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleInviteSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!currentWorkspace) {
      return
    }

    if (!inviteForm.email.trim()) {
      setError(t("usersPage.errors.formRequired"))
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      await apiClient.ripsAdminPresentationEndpointsWorkspacesAddUserToWorkspaceEndpoint(currentWorkspace.id, {
        userEmail: inviteForm.email,
        firstName: inviteForm.firstName || undefined,
        lastName: inviteForm.lastName || undefined,
        roleName: inviteForm.roleName,
      })

      setInviteForm(DEFAULT_FORM)
      setIsInviteOpen(false)
      setSuccess(t("usersPage.success.userAdded"))
      await fetchMembers()
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>
      const message =
        axiosError.response?.data?.error ||
        axiosError.message ||
        t("usersPage.errors.create")
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold">{t("usersPage.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("usersPage.description")}</p>
      </div>

      {!hasWorkspace ? (
        <Card>
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                {t("usersPage.noWorkspaceTitle")}
              </CardTitle>
              <CardDescription>{t("usersPage.noWorkspaceDescription")}</CardDescription>
            </div>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <UsersIcon className="h-5 w-5 text-primary" />
                {currentWorkspace?.companyName}
              </CardTitle>
              <CardDescription>
                {t("usersPage.workspaceDescription", { count: members.length })}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void fetchMembers()}
                disabled={isLoading}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                {t("usersPage.refresh")}
              </Button>
              <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogTrigger asChild>
                  <Button type="button" size="sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t("usersPage.inviteButton")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("usersPage.dialog.title")}</DialogTitle>
                    <DialogDescription>{t("usersPage.dialog.description")}</DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleInviteSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="invite-email">{t("usersPage.dialog.email")}</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        required
                        autoFocus
                        value={inviteForm.email}
                        onChange={(event) => handleInviteFormChange("email", event.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="invite-first-name">{t("usersPage.dialog.firstName")}</Label>
                        <Input
                          id="invite-first-name"
                          value={inviteForm.firstName}
                          onChange={(event) => handleInviteFormChange("firstName", event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invite-last-name">{t("usersPage.dialog.lastName")}</Label>
                        <Input
                          id="invite-last-name"
                          value={inviteForm.lastName}
                          onChange={(event) => handleInviteFormChange("lastName", event.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("usersPage.dialog.role")}</Label>
                      <Select
                        value={inviteForm.roleName}
                        onValueChange={(value) => handleInviteFormChange("roleName", value as RoleOption)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">{t("usersPage.roles.admin")}</SelectItem>
                          <SelectItem value="User">{t("usersPage.roles.user")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {error && (
                      <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}
                    <DialogFooter className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsInviteOpen(false)}
                        disabled={isSubmitting}
                      >
                        {t("usersPage.dialog.cancel")}
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? t("usersPage.dialog.submitting") : t("usersPage.dialog.submit")}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {success && (
              <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                <UsersIcon className="h-4 w-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {error && !isInviteOpen && (
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {showTableSkeleton ? (
              <div className="space-y-2">
                <Skeleton className="h-11 rounded-md" />
                <Skeleton className="h-11 rounded-md" />
                <Skeleton className="h-11 rounded-md" />
              </div>
            ) : normalizedMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-muted-foreground/20 p-8 text-center">
                <UsersIcon className="h-8 w-8 text-muted-foreground/60" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("usersPage.empty.title")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("usersPage.empty.description")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("usersPage.table.email")}</TableHead>
                      <TableHead>{t("usersPage.table.name")}</TableHead>
                      <TableHead>{t("usersPage.table.role")}</TableHead>
                      <TableHead>{t("usersPage.table.joined")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {normalizedMembers.map((member) => (
                      <TableRow key={member.userId || member.email}>
                        <TableCell className="font-medium">{member.email}</TableCell>
                        <TableCell>{member.displayName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{member.roleName}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{member.joinedDate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
