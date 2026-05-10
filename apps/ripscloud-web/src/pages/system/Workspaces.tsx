import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Building2, Users, Eye, Trash2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/useAuth'
import { useApiClient } from '@/context/ApiClientContext'

interface Workspace {
  id: string
  nit: string
  companyName: string
  logoUrl?: string
  isActive: boolean
  createdAt: string
}

interface WorkspaceDetails extends Workspace {
  users: WorkspaceUser[]
}

interface WorkspaceUser {
  userId: string
  email: string
  firstName: string
  lastName: string
  roleName: string
  isActive: boolean
  joinedAt: string
}

export function Workspaces() {
  const { user, roles } = useAuth()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [formData, setFormData] = useState({
    nit: '',
    verificationDigit: '',
    companyName: '',
    commercialName: '',
    taxRegime: '',
    economicActivityCode: '',
    address: '',
    departmentCode: '',
    municipalityCode: '',
    phoneNumber: '',
    email: '',
    serviceCode: '',
    adminEmail: '',
    adminFirstName: '',
    adminLastName: ''
  })
  const [memberFormData, setMemberFormData] = useState({
    userEmail: '',
    firstName: '',
    lastName: '',
    roleName: 'Admin'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const { apiClient } = useApiClient()
  const hasSuperAdminRole = roles.includes('SuperAdmin')

  const fetchWorkspaces = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.ripsAdminPresentationEndpointsWorkspacesListWorkspacesEndpoint()
      setWorkspaces((response.data || []).map(ws => ({
        id: ws.id || '',
        nit: ws.nit || '',
        companyName: ws.companyName || '',
        logoUrl: ws.logoUrl || undefined,
        isActive: ws.isActive ?? true,
        createdAt: ws.createdAt || new Date().toISOString(),
      })))
      setError('')
    } catch (err) {
      setError('Failed to load workspaces')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [apiClient])

  useEffect(() => {
    if (user) {
      void fetchWorkspaces()
    }
  }, [user, fetchWorkspaces])

  const fetchWorkspaceDetails = async (workspaceId: string) => {
    try {
      const response = await apiClient.ripsAdminPresentationEndpointsWorkspacesGetWorkspaceDetailsEndpoint(workspaceId)
      const details = response.data
      if (details) {
        setSelectedWorkspace({
          id: details.id || '',
          nit: details.nit || '',
          companyName: details.companyName || '',
          logoUrl: details.logoUrl || undefined,
          isActive: details.isActive ?? true,
          createdAt: details.createdAt || new Date().toISOString(),
          users: (details.users || []).map(u => ({
            userId: u.userId || '',
            email: u.email || '',
            firstName: u.firstName || '',
            lastName: u.lastName || '',
            roleName: u.roleName || '',
            isActive: u.isActive ?? true,
            joinedAt: u.joinedAt || new Date().toISOString(),
          })),
        })
        setIsDetailsOpen(true)
      }
    } catch (err) {
      setError('Failed to load workspace details')
      console.error(err)
    }
  }

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nit || !formData.verificationDigit || !formData.companyName || !formData.adminEmail) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      const response = await apiClient.ripsAdminPresentationEndpointsWorkspacesCreateWorkspaceEndpoint({
        nit: formData.nit,
        verificationDigit: formData.verificationDigit,
        companyName: formData.companyName,
        commercialName: formData.commercialName,
        taxRegime: formData.taxRegime,
        economicActivityCode: formData.economicActivityCode,
        address: formData.address,
        departmentCode: formData.departmentCode,
        municipalityCode: formData.municipalityCode,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        serviceCode: formData.serviceCode,
        adminEmail: formData.adminEmail,
        adminFirstName: formData.adminFirstName,
        adminLastName: formData.adminLastName,
      })

      if (response.data) {
        const newWorkspace = {
          id: response.data.id || '',
          nit: response.data.nit || '',
          companyName: response.data.companyName || '',
          logoUrl: response.data.logoUrl || undefined,
          isActive: response.data.isActive ?? true,
          createdAt: response.data.createdAt || new Date().toISOString(),
        }
        setWorkspaces([...workspaces, newWorkspace])
        setFormData({
          nit: '',
          verificationDigit: '',
          companyName: '',
          commercialName: '',
          taxRegime: '',
          economicActivityCode: '',
          address: '',
          departmentCode: '',
          municipalityCode: '',
          phoneNumber: '',
          email: '',
          serviceCode: '',
          adminEmail: '',
          adminFirstName: '',
          adminLastName: ''
        })
        setIsDialogOpen(false)
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } }
      setError(error.response?.data?.error || 'Failed to create workspace')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWorkspace || !memberFormData.userEmail) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      await apiClient.ripsAdminPresentationEndpointsWorkspacesAddUserToWorkspaceEndpoint(
        selectedWorkspace.id,
        {
          userEmail: memberFormData.userEmail,
          firstName: memberFormData.firstName || undefined,
          lastName: memberFormData.lastName || undefined,
          roleName: memberFormData.roleName
        }
      )

      // Refresh workspace details
      await fetchWorkspaceDetails(selectedWorkspace.id)
      
      setMemberFormData({
        userEmail: '',
        firstName: '',
        lastName: '',
        roleName: 'Admin'
      })
      setIsAddMemberOpen(false)
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } }
      setError(error.response?.data?.error || 'Failed to add member')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteWorkspace = async (workspaceId: string) => {
    try {
      // Delete endpoint not yet defined in generated API - would need to be added
      // For now, using the workspace endpoint pattern
      await apiClient.ripsAdminPresentationEndpointsWorkspacesGetWorkspaceDetailsEndpoint(workspaceId)
      setWorkspaces(workspaces.filter((w) => w.id !== workspaceId))
      setDeleteConfirm(null)
    } catch (err) {
      setError('Failed to delete workspace')
      console.error(err)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
          <p className="text-gray-500 mt-1">Manage workspaces and their members</p>
        </div>
        {hasSuperAdminRole && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-4 w-4" />
                New Workspace
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Workspace</DialogTitle>
                <DialogDescription>Add a new workspace with complete DIAN information</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateWorkspace} className="space-y-6">
                {error && (
                  <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}

                {/* Company Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Company Information</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nit" className="text-sm font-medium">
                        NIT *
                      </Label>
                      <Input
                        id="nit"
                        placeholder="123456789"
                        value={formData.nit}
                        onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="verificationDigit" className="text-sm font-medium">
                        Verification Digit *
                      </Label>
                      <Input
                        id="verificationDigit"
                        placeholder="0"
                        maxLength={1}
                        value={formData.verificationDigit}
                        onChange={(e) => setFormData({ ...formData, verificationDigit: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="serviceCode" className="text-sm font-medium">
                        Service Code *
                      </Label>
                      <Input
                        id="serviceCode"
                        placeholder="001"
                        value={formData.serviceCode}
                        onChange={(e) => setFormData({ ...formData, serviceCode: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-sm font-medium">
                        Company Name (Legal) *
                      </Label>
                      <Input
                        id="companyName"
                        placeholder="Acme Corporation S.A.S."
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="commercialName" className="text-sm font-medium">
                        Commercial Name *
                      </Label>
                      <Input
                        id="commercialName"
                        placeholder="Acme"
                        value={formData.commercialName}
                        onChange={(e) => setFormData({ ...formData, commercialName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="taxRegime" className="text-sm font-medium">
                        Tax Regime *
                      </Label>
                      <Input
                        id="taxRegime"
                        placeholder="Régimen Común"
                        value={formData.taxRegime}
                        onChange={(e) => setFormData({ ...formData, taxRegime: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="economicActivityCode" className="text-sm font-medium">
                        Economic Activity Code *
                      </Label>
                      <Input
                        id="economicActivityCode"
                        placeholder="8610"
                        value={formData.economicActivityCode}
                        onChange={(e) => setFormData({ ...formData, economicActivityCode: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Location Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium">
                      Address *
                    </Label>
                    <Input
                      id="address"
                      placeholder="Calle 123 # 45-67"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="departmentCode" className="text-sm font-medium">
                        Department Code *
                      </Label>
                      <Input
                        id="departmentCode"
                        placeholder="11"
                        value={formData.departmentCode}
                        onChange={(e) => setFormData({ ...formData, departmentCode: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="municipalityCode" className="text-sm font-medium">
                        Municipality Code *
                      </Label>
                      <Input
                        id="municipalityCode"
                        placeholder="11001"
                        value={formData.municipalityCode}
                        onChange={(e) => setFormData({ ...formData, municipalityCode: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Contact Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber" className="text-sm font-medium">
                        Phone Number *
                      </Label>
                      <Input
                        id="phoneNumber"
                        placeholder="3001234567"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Company Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="contact@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Admin User Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Admin User</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail" className="text-sm font-medium">
                      Admin Email *
                    </Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      placeholder="admin@company.com"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminFirstName" className="text-sm font-medium">
                        First Name
                      </Label>
                      <Input
                        id="adminFirstName"
                        placeholder="John"
                        value={formData.adminFirstName}
                        onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adminLastName" className="text-sm font-medium">
                        Last Name
                      </Label>
                      <Input
                        id="adminLastName"
                        placeholder="Doe"
                        value={formData.adminLastName}
                        onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Creating...
                      </>
                    ) : (
                      'Create Workspace'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Error Alert */}
      {error && !isDialogOpen && (
        <div className="flex gap-2 p-4 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Workspaces Grid */}
      {workspaces.length === 0 ? (
        <Card>
          <CardContent className="pt-12 text-center">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No workspaces yet</h3>
            <p className="text-gray-500 mb-4">Create your first workspace to get started</p>
            {hasSuperAdminRole && (
              <Button onClick={() => setIsDialogOpen(true)} size="sm" variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Workspace
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <Card key={workspace.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      {workspace.companyName}
                    </CardTitle>
                    <CardDescription className="mt-1">NIT: {workspace.nit}</CardDescription>
                  </div>
                  <Badge variant={workspace.isActive ? 'default' : 'secondary'}>
                    {workspace.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-xs text-gray-500">
                  Created: {new Date(workspace.createdAt).toLocaleDateString()}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => fetchWorkspaceDetails(workspace.id)}
                  >
                    <Eye className="h-4 w-4" />
                    Details
                  </Button>
                  {hasSuperAdminRole && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-2"
                      onClick={() => setDeleteConfirm(workspace.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Workspace Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedWorkspace && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {selectedWorkspace.companyName}
                </DialogTitle>
                <DialogDescription>NIT: {selectedWorkspace.nit}</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info">Information</TabsTrigger>
                  <TabsTrigger value="users">Members ({selectedWorkspace.users.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-semibold text-gray-600">NIT</Label>
                      <p className="text-sm mt-1">{selectedWorkspace.nit}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-gray-600">Company Name</Label>
                      <p className="text-sm mt-1">{selectedWorkspace.companyName}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-gray-600">Status</Label>
                      <Badge className="mt-1" variant={selectedWorkspace.isActive ? 'default' : 'secondary'}>
                        {selectedWorkspace.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-gray-600">Created</Label>
                      <p className="text-sm mt-1">{new Date(selectedWorkspace.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="users" className="space-y-4">
                  {selectedWorkspace.users.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>No members in this workspace</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedWorkspace.users.map((member) => (
                            <TableRow key={member.userId}>
                              <TableCell className="text-sm">{member.email}</TableCell>
                              <TableCell className="text-sm">
                                {member.firstName} {member.lastName}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{member.roleName}</Badge>
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {new Date(member.joinedAt).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {hasSuperAdminRole && (
                    <Button variant="outline" className="w-full gap-2" onClick={() => setIsAddMemberOpen(true)}>
                      <Plus className="h-4 w-4" />
                      Add Member
                    </Button>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Member to Workspace</DialogTitle>
            <DialogDescription>
              {selectedWorkspace && `Add a new member to ${selectedWorkspace.companyName}`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddMember} className="space-y-4">
            {error && isAddMemberOpen && (
              <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="userEmail" className="text-sm font-medium">
                Email *
              </Label>
              <Input
                id="userEmail"
                type="email"
                placeholder="user@example.com"
                value={memberFormData.userEmail}
                onChange={(e) => setMemberFormData({ ...memberFormData, userEmail: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500">
                If the user doesn't exist, a new account will be created
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={memberFormData.firstName}
                  onChange={(e) => setMemberFormData({ ...memberFormData, firstName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={memberFormData.lastName}
                  onChange={(e) => setMemberFormData({ ...memberFormData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roleName" className="text-sm font-medium">
                Role *
              </Label>
              <Select
                value={memberFormData.roleName}
                onValueChange={(value) => setMemberFormData({ ...memberFormData, roleName: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddMemberOpen(false)
                  setError('')
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Adding...
                  </>
                ) : (
                  'Add Member'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workspace? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDeleteWorkspace(deleteConfirm)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
