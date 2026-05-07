'use client'

import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CustomRequestCancelDialogProps } from '@/lib/types';

export default function CustomRequestCancelDialog({
	isOpen,
	onClose,
	customRequest,
	onCancelSuccess,
	isLoading = false
}: CustomRequestCancelDialogProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="text-red-600">Xác nhận hủy yêu cầu</DialogTitle>
				</DialogHeader>
				
				<div className="space-y-4">
					{customRequest && (
						<div className="space-y-3">
							<p className="text-charcoal">Bạn có chắc chắn muốn hủy yêu cầu này không?</p>
							
							<div className="bg-wood-50 border border-wood-200 p-4 rounded-lg space-y-2 text-sm">
								<p><strong className="text-charcoal">Yêu cầu #{customRequest?.id}</strong></p>
								<p><strong>Sản phẩm:</strong> {customRequest?.product?.name}</p>
								<p><strong>Vật liệu:</strong> {customRequest?.material?.name}</p>
								<p><strong>Kích thước:</strong> {customRequest?.customWidth} × {customRequest?.customHeight} × {customRequest?.customDepth} cm</p>
							</div>
							
							<div className="bg-red-50 border border-red-200 p-3 rounded-lg">
								<p className="text-red-700 font-medium text-sm">
									⚠️ Thao tác này không thể hoàn tác!
								</p>
							</div>
						</div>
					)}
				</div>

				<DialogFooter className="flex gap-2 pt-4">
					<Button 
						variant="outline" 
						onClick={onCancelSuccess}
						disabled={isLoading}
					>
						Hủy
					</Button>
					<Button 
						variant="destructive"
						onClick={onCancelSuccess}
						disabled={isLoading}
						className="bg-red-600 hover:bg-red-700"
					>
						{isLoading ? 'Đang xử lý...' : 'Xác nhận hủy'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
