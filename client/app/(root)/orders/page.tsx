'use client'

import { OrdersCard } from '@/components/tables/OrdersTable';
import { withUserAuth } from '@/lib/auth-context';

function OrdersPage() {
	return (
		<div className="container mx-auto py-6">
			<OrdersCard userRole="user" />
		</div>
	)
}

export default withUserAuth(OrdersPage)
