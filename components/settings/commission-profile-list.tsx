"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, MoreHorizontal, Target, Award, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CommissionProfile, COMMISSION_PROFILE_TYPES, DEFAULT_COMMISSION_PROFILES, CommissionProfileFormData } from "@/lib/commission-profile-types"
import { useToast } from "@/hooks/use-toast"
import { AddCommissionProfileModal } from "./add-commission-profile-modal"
import { EditCommissionProfileModal } from "./edit-commission-profile-modal"

export function CommissionProfileList() {
  const { toast } = useToast()
  const [profiles, setProfiles] = useState<CommissionProfile[]>(DEFAULT_COMMISSION_PROFILES)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<CommissionProfile | null>(null)

  const handleAddProfile = () => {
    setSelectedProfile(null)
    setIsAddModalOpen(true)
  }

  const handleEditProfile = (profile: CommissionProfile) => {
    setSelectedProfile(profile)
    setIsEditModalOpen(true)
  }

  const handleSaveEditedProfile = (updatedProfile: CommissionProfile) => {
    setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p))
    setIsEditModalOpen(false)
    setSelectedProfile(null)
  }

  const handleDeleteProfile = (profile: CommissionProfile) => {
    setSelectedProfile(profile)
    setIsDeleteModalOpen(true)
  }

  const handleSaveProfile = (profileData: CommissionProfileFormData) => {
    const newProfile: CommissionProfile = {
      id: Date.now().toString(),
      ...profileData,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "current_user" // In real app, get from auth context
    }
    
    setProfiles(prev => [...prev, newProfile])
    setIsAddModalOpen(false)
  }

  const confirmDelete = () => {
    if (selectedProfile) {
      setProfiles(prev => prev.filter(p => p.id !== selectedProfile.id))
      toast({
        title: "Success",
        description: "Commission profile deleted successfully"
      })
    }
    setIsDeleteModalOpen(false)
    setSelectedProfile(null)
  }

  const getProfileTypeIcon = (type: string) => {
    switch (type) {
      case "target_based":
        return <Target className="h-4 w-4" />
      case "item_based":
        return <Package className="h-4 w-4" />
      default:
        return <Award className="h-4 w-4" />
    }
  }

  const getProfileTypeBadge = (type: string) => {
    const typeConfig = {
      target_based: { label: "Commission by Target", variant: "default" as const },
      item_based: { label: "Commission by Item", variant: "secondary" as const }
    }
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.target_based
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {getProfileTypeIcon(type)}
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Commission Profiles</h2>
          <p className="text-gray-600">Manage commission structures and target-based incentives</p>
        </div>
        <Button onClick={handleAddProfile} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Commission Profile
        </Button>
      </div>

      {/* Profiles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Profile List</CardTitle>
          <CardDescription>
            Configure different commission structures for your staff members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profile Name</TableHead>
                  <TableHead>Profile Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.name}</TableCell>
                    <TableCell>
                      {getProfileTypeBadge(profile.type)}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {profile.description || "No description"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={profile.isActive ? "default" : "secondary"}>
                        {profile.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditProfile(profile)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteProfile(profile)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Profile
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Commission Profile</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedProfile?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Commission Profile Modal */}
      <AddCommissionProfileModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveProfile}
      />

      {/* Edit Commission Profile Modal */}
      <EditCommissionProfileModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedProfile(null)
        }}
        onSave={handleSaveEditedProfile}
        profile={selectedProfile}
      />
    </div>
  )
}
