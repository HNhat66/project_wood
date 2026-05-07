'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { LoadingSpinner } from '@/components/ui/loading-spinner';

import APIClient from './api';
import {
  AuthContextType,
  User,
  UserRole,
} from './types';

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children, accessToken, refreshToken }: { children: React.ReactNode, accessToken: string | undefined, refreshToken: string | undefined }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [tokens, setTokens] = useState<{ accessToken: string | undefined, refreshToken: string | undefined }>({ accessToken, refreshToken })

  const isAuthenticated = !!user

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      if (tokens.accessToken || tokens.refreshToken) {
        try {
          const api = new APIClient(tokens)
          const response = await api.auth().getProfile()
          if (response.status === 200) {
            setUser(response.data)
          }
        } catch (error) {
          console.error('Failed to get profile:', error)
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const api = new APIClient()
      const response = await api.auth().login(email, password)

      if (response.status === 201) {
        setUser(response.data.user)
        setTokens({ accessToken: response.data.access_token, refreshToken: response.data.refresh_token })
        return { success: true, role: response.data.user.role as UserRole }
      } else {
        return { success: false, error: response.message || 'Đăng nhập thất bại' }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Đăng nhập thất bại'
      }
    }
  }

  const logout = async () => {
    setLogoutLoading(true)
    try {
      const api = new APIClient(tokens)
      await api.auth().logout()
      setUser(null)
      setTokens({ accessToken: undefined, refreshToken: undefined })
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Logout error:', error)
      // Even if API call fails, clear local state and redirect
      setUser(null)
      setTokens({ accessToken: undefined, refreshToken: undefined })
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    } finally {
      setLogoutLoading(false)
    }
  }
  const updateProfile = async (profile: {
    fullName?: string
    phone?: string
    address?: string
    dateOfBirth?: string
    gender?: 'male' | 'female' | 'other'
  }) => {
    try {
      const api = new APIClient(tokens)
      // get all field has value, ignore undefined, empty string, null
      const profileData = Object.fromEntries(
        Object.entries(profile).filter(([_, value]) => value !== undefined && value !== '' && value !== null)
      ) 
      const response = await api.auth().updateProfile(profileData)
      if (response.status === 200) {
        setUser(response.data)
        return { success: true }
      } else {
        return { success: false, error: response.message || 'Cập nhật thông tin thất bại' }
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Cập nhật thông tin thất bại' }
    }
  }

  const refreshProfile = async () => {
    if (!tokens.accessToken) return

    try {
      const api = new APIClient(tokens)
      const response = await api.auth().getProfile()
      if (response.status === 200) {
        setUser(response.data)
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    logoutLoading,
    isAuthenticated,
    login,
    logout,
    refreshProfile,
    updateProfile,
    tokens
  }

  return (
    <AuthContext.Provider value={value}>
      {/* Global Logout Loading Overlay */}
      {logoutLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-xl flex flex-col items-center space-y-4">
            <LoadingSpinner className="w-8 h-8" />
            <p className="text-wood-900 font-medium">Đang đăng xuất...</p>
          </div>
        </div>
      )}
      
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles?: UserRole[]
) {
  return function AuthenticatedComponent(props: P) {
    const { user, isLoading } = useAuth()
    
    if (allowedRoles?.includes(UserRole.GUEST)) {
      return <Component {...props} />
    }

    if (isLoading) {
      return (
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-wood-500 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <div className="w-8 h-8 bg-white rounded"></div>
            </div>
            <p className="text-wood-600">Đang tải...</p>
          </div>
        </div>
      )
    }

    if (!user) {
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      return null
    }
    if (user.role === UserRole.USER && !allowedRoles?.includes(UserRole.USER)) {
      // at here mean if user is user and allowedRoles not have permission to access this page
      if (typeof window !== 'undefined') {
        window.location.href = '/profile'
      }
      return null
    }

    if (allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
      return (
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className=" text-2xl">⚠</span>
            </div>
            <h1 className="text-2xl font-bold text-wood-900 mb-2">Không có quyền truy cập</h1>
            <p className="text-wood-600">Bạn không có quyền truy cập vào trang này.</p>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}

// Specific HOC for user-only routes
export function withUserAuth<P extends object>(Component: React.ComponentType<P>) {
  return withAuth(Component, [UserRole.USER])
}

export function withGuestAuth<P extends object>(Component: React.ComponentType<P>) {
  return withAuth(Component, [UserRole.USER,UserRole.GUEST])
}

// Specific HOC for admin/employee routes  
export function withEmployeeAuth<P extends object>(Component: React.ComponentType<P>) {
  return withAuth(Component, [UserRole.ADMIN, UserRole.EMPLOYEE])
}

// Specific HOC for admin routes
export function withAdminAuth<P extends object>(Component: React.ComponentType<P>) {
  return withAuth(Component, [UserRole.ADMIN])
}

// Hook for checking permissions
export function usePermissions() {
  const { user } = useAuth()

  const hasRole = (role: UserRole) => {
    return user?.role === role
  }

  const isAdmin = () => hasRole(UserRole.ADMIN)
  const isEmployee = () => hasRole(UserRole.EMPLOYEE)
  const isUser = () => hasRole(UserRole.USER)

  const canAccess = (allowedRoles: UserRole[]) => {
    return user && allowedRoles.includes(user.role as UserRole)
  }

  const canAccessUserFeatures = () => hasRole(UserRole.USER)
  const canAccessAdminFeatures = () => hasRole(UserRole.ADMIN) || hasRole(UserRole.EMPLOYEE)
  const onlyUserAndGuest = () => !hasRole(UserRole.ADMIN) && !hasRole(UserRole.EMPLOYEE)

  return {
    hasRole,
    isAdmin,
    isEmployee,
    isUser,
    canAccess,
    canAccessUserFeatures,
    canAccessAdminFeatures,
    user,
    onlyUserAndGuest,
  }
} 