'use client'

import { useState } from 'react';

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Column {
  accessorKey?: string
  id?: string
  header: string
  cell?: ({ row }: { row: any }) => React.ReactNode
}

interface DataTableProps {
  columns: Column[]
  data: any[]
  isLoading?: boolean
  pagination?: {
    page: number
    totalPages: number
    onPageChange: (page: number) => void
  }
}

export function DataTable({ columns, data, isLoading = false, pagination }: DataTableProps) {
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (columnId: string) => {
    if (sortBy === columnId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(columnId)
      setSortDirection('asc')
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortBy) return 0

    const aValue = a[sortBy]
    const bValue = b[sortBy]

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const getSortIcon = (columnId: string) => {
    if (sortBy !== columnId) return <ChevronsUpDown className="h-4 w-4" />
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-wood-300 scrollbar-track-wood-100 hover:scrollbar-thumb-wood-400"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d4844f #f1ddc7'
          }}>
          <Table className="w-full border-collapse">
            <TableHeader>
              <TableRow>
                {columns.map((column) => {
                  const columnId = column.accessorKey || column.id || ''
                  return (
                    <TableHead
                      key={columnId}
                      className="text-left p-4 font-medium text-charcoal"
                    >
                      <span className="w-max inline-block"> {column.header}</span>
                    </TableHead>
                  )
                })}
              </TableRow>
            </TableHeader>
          </Table>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-wood-500" />
          <span className="ml-2 text-walnut-600">Đang tải...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-wood-300 scrollbar-track-wood-100 hover:scrollbar-thumb-wood-400"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#d4844f #f1ddc7'
        }}>
        <Table className="w-full border-collapse">
          <TableHeader>
            <TableRow>
              {columns.map((column) => {
                const columnId = column.accessorKey || column.id || ''
                return (
                  <th
                    key={columnId}
                    className="text-left p-4 font-medium text-charcoal"
                  >
                    {column.accessorKey ? (
                      <Button
                        variant="ghost"
                        onClick={() => handleSort(column.accessorKey!)}
                        className="h-auto p-0 font-medium hover:bg-transparent"
                      >
                        {column.header}
                        {getSortIcon(column.accessorKey)}
                      </Button>
                    ) : (
                      <span className="w-max inline-block"> {column.header}</span>
                    )}
                  </th>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((row, index) => (
              <TableRow key={index} className="border-b border-wood-100 hover:bg-wood-50">
                {columns.map((column) => {
                  const columnId = column.accessorKey || column.id || ''
                  return (
                    <TableCell key={columnId} className="p-4">
                      {column.cell ? (
                        column.cell({ row })
                      ) : (
                        column.accessorKey ? row[column.accessorKey] : ''
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data.length === 0 && !isLoading && (
        <div className="text-center py-8 text-walnut-600">
          Không có dữ liệu
        </div>
      )}

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-walnut-600">
            Trang {pagination.page} của {pagination.totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Sau
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 