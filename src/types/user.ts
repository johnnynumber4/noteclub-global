export interface User {
  _id: string
  name?: string
  email: string
  image?: string
  password?: string
  role?: 'user' | 'admin'
  emailVerified?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Group {
  _id: string
  name: string
  description?: string
  slug: string
  isPublic: boolean
  owner: string // User ID
  admins: string[] // User IDs
  members: string[] // User IDs
  settings: {
    allowInvites: boolean
    requireApproval: boolean
    allowMemberPosts: boolean
  }
  createdAt: Date
  updatedAt: Date
}

export interface Note {
  _id: string
  title: string
  content: string
  author: string // User ID
  group: string // Group ID
  isPublic: boolean
  tags: string[]
  collaborators: string[] // User IDs
  version: number
  lastEditedBy: string // User ID
  createdAt: Date
  updatedAt: Date
}

export interface Membership {
  _id: string
  user: string // User ID
  group: string // Group ID
  role: 'member' | 'admin' | 'owner'
  status: 'pending' | 'active' | 'suspended'
  joinedAt: Date
  updatedAt: Date
}
