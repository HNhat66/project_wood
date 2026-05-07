import React from 'react';

import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export default function SkeletonLoadingProfile() {
	return (
		<div className="min-h-screen bg-cream py-8">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Header Skeleton */}
				<div className="mb-8">
					<Skeleton className="h-9 w-64 mb-2" />
					<Skeleton className="h-6 w-96" />
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Profile Information Card Skeleton */}
					<div className="lg:col-span-2">
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-2">
											<Skeleton className="w-5 h-5" />
											<Skeleton className="h-6 w-32" />
										</div>
										<Skeleton className="h-4 w-64" />
									</div>
									<Skeleton className="h-8 w-20" />
								</div>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="space-y-4">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										{/* Name field skeleton */}
										<div className="space-y-2">
											<div className="flex items-center gap-2">
												<Skeleton className="w-4 h-4" />
												<Skeleton className="h-4 w-20" />
											</div>
											<Skeleton className="h-6 w-full" />
										</div>

										{/* Email field skeleton */}
										<div className="space-y-2">
											<div className="flex items-center gap-2">
												<Skeleton className="w-4 h-4" />
												<Skeleton className="h-4 w-16" />
											</div>
											<Skeleton className="h-6 w-full" />
										</div>

										{/* Phone field skeleton */}
										<div className="space-y-2">
											<div className="flex items-center gap-2">
												<Skeleton className="w-4 h-4" />
												<Skeleton className="h-4 w-24" />
											</div>
											<Skeleton className="h-6 w-full" />
										</div>

										{/* Date field skeleton */}
										<div className="space-y-2">
											<div className="flex items-center gap-2">
												<Skeleton className="w-4 h-4" />
												<Skeleton className="h-4 w-20" />
											</div>
											<Skeleton className="h-6 w-full" />
										</div>
									</div>

									{/* Address field skeleton */}
									<div className="space-y-2">
										<div className="flex items-center gap-2">
											<Skeleton className="w-4 h-4" />
											<Skeleton className="h-4 w-16" />
										</div>
										<Skeleton className="h-6 w-full" />
									</div>

									{/* Gender field skeleton */}
									<div className="space-y-2">
										<Skeleton className="h-4 w-16" />
										<Skeleton className="h-6 w-24" />
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Change Password Card Skeleton */}
						<Card className="mt-6">
							<CardHeader>
								<div className="flex items-center justify-between">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-2">
											<Skeleton className="w-5 h-5" />
											<Skeleton className="h-6 w-24" />
										</div>
										<Skeleton className="h-4 w-72" />
									</div>
									<Skeleton className="h-8 w-24" />
								</div>
							</CardHeader>
						</Card>
					</div>

					{/* Account Status Sidebar Skeleton */}
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<div className="flex items-center gap-2">
									<Skeleton className="w-5 h-5" />
									<Skeleton className="h-6 w-32" />
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* Role skeleton */}
								<div className="space-y-2">
									<Skeleton className="h-4 w-12" />
									<Skeleton className="h-6 w-20 rounded-full" />
								</div>

								{/* Status skeleton */}
								<div className="space-y-2">
									<Skeleton className="h-4 w-16" />
									<Skeleton className="h-6 w-24 rounded-full" />
								</div>

								<Separator />

								{/* Created date skeleton */}
								<div className="space-y-2">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-4 w-28" />
								</div>

								{/* Last login skeleton */}
								<div className="space-y-2">
									<Skeleton className="h-4 w-36" />
									<Skeleton className="h-4 w-32" />
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	)
}
