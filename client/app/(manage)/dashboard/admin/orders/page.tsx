'use client'

import { OrdersCard } from '@/components/tables/OrdersTable';
import { withEmployeeAuth } from '@/lib/auth-context';

function AdminOrdersPage() {
	return (
		<div className="container mx-auto py-6">
			<OrdersCard userRole="admin" />
		</div>
	)
} 

export default withEmployeeAuth(AdminOrdersPage)